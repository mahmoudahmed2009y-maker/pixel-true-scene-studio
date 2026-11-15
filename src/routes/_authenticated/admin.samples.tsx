import { useState } from "react";
import { useBrand } from "@/hooks/use-brand";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { ConfirmDelete, QueryState } from "@/components/admin/ConfirmDelete";
import { Field, NoAccess } from "@/components/admin/Field";
import { useAdmin } from "@/components/admin/admin-context";
import { PageHeader } from "@/components/releaf/Cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminFactoriesQuery, useAdminAction } from "@/hooks/use-admin-data";
import { limitsQuery, samplesQuery } from "@/hooks/use-releaf-data";
import { supabase } from "@/integrations/supabase/client";
import { can, fieldErrors, fmtCollectedAt, rowToSample, sampleInputToRow, sampleRowToForm, sampleSchema, type SampleRow } from "@/lib/releaf/admin";
import { pageMeta } from "@/lib/releaf/meta";
import { assessRisk, evaluateSafetyGate, LIMITS } from "@/lib/releaf/risk";

export const Route = createFileRoute("/_authenticated/admin/samples")({
  head: ({ matches }) => pageMeta(matches, "Water samples · Admin", "Add, edit and remove the water samples analysed in RELEAF."),
  component: SamplesAdmin,
});

type Form = ReturnType<typeof sampleRowToForm>;
const emptyForm = (factoryId: string): Form => ({
  id: "", name: "", stage: "", factory_id: factoryId, collected_at: new Date().toISOString().slice(0, 16),
  ph: "", turbidity: "", tds: "", temperature: "", ec: "", sar: "", lab_cd: "", lab_pb: "",
});

function SamplesAdmin() {
  const { roles } = useAdmin();
  const q = useQuery(samplesQuery);
  const factories = useQuery(adminFactoriesQuery).data ?? [];
  const limits = useQuery(limitsQuery).data ?? LIMITS;
  const { run } = useAdminAction();
  const [editing, setEditing] = useState<{ original: SampleRow | null; form: Form } | null>(null);

  if (!can(roles, "samples")) return <NoAccess what="water samples" />;
  const rows = q.data ?? [];
  const factoryName = (id: string) => factories.find((f) => f.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Water samples"
        description="Samples feed Risk Assessment, Safety Gate, Water Matching and Reports. Values are illustrative unless you enter real lab results."
        actions={
          <Button variant="forest" disabled={!factories.length} onClick={() => setEditing({ original: null, form: emptyForm(factories[0]?.id ?? "") })}>
            <Plus /> Add sample
          </Button>
        }
      />
      <div className="surface-card overflow-hidden">
        <QueryState isPending={q.isPending} error={q.error} />
        {q.data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample</TableHead>
                <TableHead>Factory</TableHead>
                <TableHead>Collected (UTC)</TableHead>
                <TableHead className="text-right">pH</TableHead>
                <TableHead className="text-right">Turbidity</TableHead>
                <TableHead className="text-right">TDS</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead>Risk · Gate</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No samples yet — add the first one.</TableCell></TableRow>
              )}
              {rows.map((r) => {
                const risk = assessRisk(rowToSample(r), limits);
                const gate = evaluateSafetyGate(risk);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground"><span className="font-mono">{r.id}</span>{r.stage ? ` · ${r.stage}` : ""}</div>
                    </TableCell>
                    <TableCell>{factoryName(r.factory_id)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{fmtCollectedAt(r.collected_at)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.ph)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.turbidity)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.tds)}</TableCell>
                    <TableCell>{r.lab_cd !== null ? <Badge variant="lab">Entered</Badge> : <span className="text-xs text-muted-foreground">Missing</span>}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={risk.level} className="capitalize">{risk.level} · {risk.score}</Badge>{" "}
                      <span className="text-xs text-muted-foreground">{gate.status === "eligible" ? "Eligible" : "Restricted"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${r.id}`} onClick={() => setEditing({ original: r, form: sampleRowToForm(r) })}>
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmDelete
                        label={`Delete ${r.id}`}
                        title={`Delete sample ${r.id}?`}
                        description="This can't be undone."
                        onConfirm={() => run(() => supabase.from("water_samples").delete().eq("id", r.id).select("id"), "Sample deleted")}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      {editing && (
        <SampleDialog
          original={editing.original}
          initial={editing.form}
          factories={factories.map((f) => ({ id: f.id, name: f.name }))}
          nextSort={Math.max(0, ...rows.map((r) => r.sort_order)) + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

const NUMBER_FIELDS: { key: keyof Form; label: string; hint?: string }[] = [
  { key: "ph", label: "pH" },
  { key: "turbidity", label: "Turbidity (NTU)" },
  { key: "tds", label: "TDS (mg/L)" },
  { key: "temperature", label: "Temperature (°C)" },
  { key: "ec", label: "EC (µS/cm)" },
  { key: "sar", label: "SAR" },
  { key: "lab_cd", label: "Cadmium (mg/L)", hint: "Optional lab value" },
  { key: "lab_pb", label: "Lead (mg/L)", hint: "Optional lab value" },
];

function SampleDialog({
  original, initial, factories, nextSort, onClose,
}: { original: SampleRow | null; initial: Form; factories: { id: string; name: string }[]; nextSort: number; onClose: () => void }) {
  const [form, setForm] = useState(initial);
  const { name: siteName } = useBrand();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, busy } = useAdminAction();
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = sampleSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    const row = sampleInputToRow(parsed.data, original?.sort_order ?? nextSort);
    const ok = original
      ? await run(() => supabase.from("water_samples").update({ ...row, id: original.id }).eq("id", original.id).select("id"), "Sample saved")
      : await run(() => supabase.from("water_samples").insert(row).select("id"), "Sample added");
    if (ok) onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{original ? `Edit sample ${original.id}` : "Add water sample"}</DialogTitle>
          <DialogDescription>Leave both lab values empty if heavy metals weren't measured — {siteName} raises the risk for missing lab data.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-4" noValidate>
          <Field id="s-name" label="Name" value={form.name} onChange={set("name")} error={errors["name"]} className="sm:col-span-2" />
          <Field id="s-id" label="ID" value={form.id} onChange={set("id")} error={errors["id"]} disabled={!!original} hint={original ? "Can't change" : "e.g. S-105"} />
          <Field id="s-stage" label="Stage" value={form.stage} onChange={set("stage")} error={errors["stage"]} placeholder="Treated" />
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-factory">Factory</Label>
            <Select value={form.factory_id} onValueChange={(v) => setForm((f) => ({ ...f, factory_id: v }))}>
              <SelectTrigger id="s-factory" className="bg-card"><SelectValue placeholder="Choose a factory" /></SelectTrigger>
              <SelectContent>
                {factories.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors["factory_id"] && <p className="text-xs text-destructive">{errors["factory_id"]}</p>}
          </div>
          <Field id="s-time" type="datetime-local" label="Collected at (UTC)" value={form.collected_at} onChange={set("collected_at")} error={errors["collected_at"]} className="sm:col-span-2" />
          {NUMBER_FIELDS.map((f) => (
            <Field key={f.key} id={`s-${f.key}`} label={f.label} inputMode="decimal" value={form[f.key]} onChange={set(f.key)} error={errors[f.key]} hint={f.hint} />
          ))}
          <DialogFooter className="sm:col-span-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="forest" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
