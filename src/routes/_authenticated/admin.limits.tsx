import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { QueryState } from "@/components/admin/ConfirmDelete";
import { Field, NoAccess } from "@/components/admin/Field";
import { useAdmin } from "@/components/admin/admin-context";
import { PageHeader, Panel } from "@/components/releaf/Cards";
import { Button } from "@/components/ui/button";
import { useAdminAction } from "@/hooks/use-admin-data";
import { limitsQuery, samplesQuery } from "@/hooks/use-releaf-data";
import { supabase } from "@/integrations/supabase/client";
import { can, DEFAULT_LIMITS_INPUT, fieldErrors, inputToLimits, limitsSchema, limitsToInput, rowToSample, type LimitsInput } from "@/lib/releaf/admin";
import { pageMeta } from "@/lib/releaf/meta";
import { assessRisk, evaluateSafetyGate } from "@/lib/releaf/risk";

export const Route = createFileRoute("/_authenticated/admin/limits")({
  head: ({ matches }) => pageMeta(matches, "Risk limits · Admin", "Edit the reference limits RELEAF uses for risk scoring and the Safety Gate."),
  component: LimitsAdmin,
});

type Form = Record<keyof LimitsInput, string>;
const toForm = (v: LimitsInput) => Object.fromEntries(Object.entries(v).map(([k, n]) => [k, String(n)])) as Form;

const GROUPS: { title: string; subtitle: string; fields: { key: keyof LimitsInput; label: string }[] }[] = [
  { title: "pH", subtitle: "Acceptable range", fields: [{ key: "ph_min", label: "Minimum" }, { key: "ph_max", label: "Maximum" }] },
  { title: "Clarity & solids", subtitle: "Upper limits", fields: [{ key: "turbidity_max", label: "Turbidity (NTU)" }, { key: "tds_max", label: "TDS (mg/L)" }] },
  { title: "Salinity (EC, dS/m)", subtitle: "Irrigation restriction levels", fields: [{ key: "salinity_none", label: "No restriction below" }, { key: "salinity_severe", label: "Severe above" }] },
  { title: "SAR", subtitle: "Sodium hazard levels", fields: [{ key: "sar_none", label: "No restriction below" }, { key: "sar_severe", label: "Severe above" }] },
  { title: "Heavy metals (mg/L)", subtitle: "Lab reference limits", fields: [{ key: "cd_max", label: "Cadmium" }, { key: "pb_max", label: "Lead" }] },
];

function LimitsAdmin() {
  const { roles } = useAdmin();
  const q = useQuery(limitsQuery);
  const samples = useQuery(samplesQuery).data ?? [];
  const { run, busy } = useAdminAction();
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (q.data !== undefined && form === null) setForm(toForm(q.data ? limitsToInput(q.data) : DEFAULT_LIMITS_INPUT));
  }, [q.data, form]);

  if (!can(roles, "limits")) return <NoAccess what="risk limits" />;
  if (!form) return <QueryState isPending={q.isPending} error={q.error} />;

  const parsed = limitsSchema.safeParse(form);
  const preview = parsed.success
    ? samples.map((r) => evaluateSafetyGate(assessRisk(rowToSample(r), inputToLimits(parsed.data))).status)
    : [];
  const eligible = preview.filter((s) => s === "eligible").length;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const p = limitsSchema.safeParse(form);
    if (!p.success) return setErrors(fieldErrors(p.error));
    setErrors({});
    await run(() => supabase.from("risk_limits").upsert({ id: 1, ...p.data, updated_at: new Date().toISOString() }).select("id"), "Risk limits saved");
  }

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <PageHeader
        eyebrow="Admin"
        title="Risk limits"
        description="Illustrative reference values used for every risk score and Safety Gate decision. They are not a certified standard."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => { setForm(toForm(DEFAULT_LIMITS_INPUT)); setErrors({}); }}>
              <RotateCcw /> Defaults
            </Button>
            <Button type="submit" variant="forest" disabled={busy}>{busy ? "Saving…" : "Save limits"}</Button>
          </>
        }
      />
      <div className="surface-card p-4 text-sm">
        {parsed.success
          ? <>With these limits, <b>{eligible}</b> of {samples.length} saved samples would pass the Safety Gate.</>
          : <span className="text-destructive">Fix the highlighted values to see how samples would be affected.</span>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((g) => (
          <Panel key={g.title} title={g.title} subtitle={g.subtitle}>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map((f) => (
                <Field
                  key={f.key}
                  id={`l-${f.key}`}
                  label={f.label}
                  inputMode="decimal"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  error={errors[f.key]}
                />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </form>
  );
}
