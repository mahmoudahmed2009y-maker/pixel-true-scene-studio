import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Radio, Unplug } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "@/components/releaf/Cards";
import { pageMeta } from "@/lib/releaf/meta";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { MISSING_LAB_PENALTY, RISK_BANDS } from "@/lib/releaf/risk";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => pageMeta("Settings", "Data sources, risk thresholds, Safety Gate rules and notification preferences for the ReLeaf workspace."),
  component: SettingsPage,
});

function SettingsPage() {
  const { limits: LIMITS } = useReleaf();
  const [notify, setNotify] = useState({ high: true, lab: true, daily: false });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="Settings" description="Configuration for this demonstration workspace." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Data sources">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3 rounded-lg border border-dashed border-info/40 bg-info-soft p-3">
              <Radio className="size-4 text-info" />
              <div className="flex-1"><div className="font-medium">Simulated sensor stream</div><div className="text-xs text-muted-foreground">Active — powers every reading in the app</div></div>
            </li>
            <li className="flex items-center gap-3 rounded-lg border p-3">
              <Unplug className="size-4 text-muted-foreground" />
              <div className="flex-1"><div className="font-medium">Hardware sensors</div><div className="text-xs text-muted-foreground">Not connected</div></div>
            </li>
            <li className="flex items-center gap-3 rounded-lg border p-3">
              <Unplug className="size-4 text-muted-foreground" />
              <div className="flex-1"><div className="font-medium">Laboratory (LIMS) integration</div><div className="text-xs text-muted-foreground">Not connected — heavy-metal values are illustrative entries</div></div>
            </li>
            <li className="flex items-center gap-3 rounded-lg border p-3">
              <Unplug className="size-4 text-muted-foreground" />
              <div className="flex-1"><div className="font-medium">AI model</div><div className="text-xs text-muted-foreground">Not connected — recommendations are rule-based</div></div>
            </li>
          </ul>
        </Panel>
        <Panel title="Risk model thresholds" subtitle="Admins can change parameter limits in the admin panel">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Low risk", `0 – ${RISK_BANDS.mediumFrom - 1}`],
              ["Medium risk", `${RISK_BANDS.mediumFrom} – ${RISK_BANDS.highFrom - 1}`],
              ["High risk (gate blocks)", `${RISK_BANDS.highFrom} – 100`],
              ["Missing-lab penalty", `+${MISSING_LAB_PENALTY} points`],
              ["pH range", `${LIMITS.ph.min} – ${LIMITS.ph.max}`],
              ["Turbidity", `≤ ${LIMITS.turbidity.max} NTU`],
              ["TDS", `≤ ${LIMITS.tds.max} mg/L`],
              ["Cadmium / Lead", `≤ ${LIMITS.cd} / ≤ ${LIMITS.pb} mg/L`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-medium tabular">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Safety & oversight">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium"><Lock className="size-3.5" /> Require operator approval for every reuse decision</div>
              <p className="mt-1 text-xs text-muted-foreground">Always on. ReLeaf never authorizes reuse on its own.</p>
            </div>
            <Switch checked disabled aria-label="Operator approval required" />
          </div>
          <div className="mt-3 flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium"><Lock className="size-3.5" /> Block reuse for high-risk samples</div>
              <p className="mt-1 text-xs text-muted-foreground">Always on. The Safety Gate cannot be bypassed.</p>
            </div>
            <Switch checked disabled aria-label="Safety Gate enforced" />
          </div>
        </Panel>
        <Panel title="Notifications" subtitle="Stored for this session only">
          <div className="space-y-4">
            {([
              ["high", "High-risk sample detected"],
              ["lab", "Laboratory data missing"],
              ["daily", "Daily summary email"],
            ] as const).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between">
                <Label htmlFor={k} className="font-normal">{label}</Label>
                <Switch id={k} checked={notify[k]} onCheckedChange={(v) => setNotify((n) => ({ ...n, [k]: v }))} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
