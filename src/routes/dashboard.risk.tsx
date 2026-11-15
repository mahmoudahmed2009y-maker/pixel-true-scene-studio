import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Panel, PageHeader, ScoreBar } from "@/components/releaf/Cards";
import { DataBadge } from "@/components/releaf/DataBadge";
import { LabWarning } from "@/components/releaf/LabWarning";
import { RiskBadge } from "@/components/releaf/RiskBadge";
import { RiskGauge } from "@/components/releaf/RiskGauge";
import { SampleSelect } from "@/components/dashboard/SampleSelect";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { pageMeta } from "@/lib/releaf/meta";
import { RISK_BANDS } from "@/lib/releaf/risk";
import type { FactorStatus } from "@/lib/releaf/types";
import { cn } from "@/lib/utils";
import { isEstimated, isMeasured } from "@/lib/releaf/types";

export const Route = createFileRoute("/dashboard/risk")({
  head: ({ matches }) => pageMeta(matches, "AI Risk Assessment", "Explainable 0–100 wastewater risk score across pH, turbidity, TDS, salinity, SAR and heavy metals."),
  component: RiskPage,
});

const STATUS: Record<FactorStatus, { label: string; cls: string }> = {
  ok: { label: "Within range", cls: "bg-risk-low-soft text-risk-low" },
  watch: { label: "Watch", cls: "bg-risk-medium-soft text-risk-medium" },
  exceeds: { label: "Exceeds", cls: "bg-risk-high-soft text-risk-high" },
  missing: { label: "No data", cls: "bg-muted text-muted-foreground" },
};

const SLIDERS = [
  { key: "ph", label: "pH", min: 2, max: 12, step: 0.1, fmt: (v: number) => v.toFixed(1) },
  { key: "turbidity", label: "Turbidity (NTU)", min: 0, max: 200, step: 0.5, fmt: (v: number) => v.toFixed(1) },
  { key: "tds", label: "TDS (mg/L)", min: 100, max: 6000, step: 10, fmt: (v: number) => Math.round(v).toLocaleString("en-US") },
  { key: "ec", label: "EC (µS/cm)", min: 200, max: 9000, step: 10, fmt: (v: number) => Math.round(v).toLocaleString("en-US") },
  { key: "sar", label: "SAR", min: 0, max: 20, step: 0.1, fmt: (v: number) => v.toFixed(1) },
] as const;

function RiskPage() {
  const { sample, risk, gate, adjust, adjusted, resetAdjustments } = useReleaf();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI risk assessment"
        title="Contamination risk score"
        description="Each parameter contributes a weighted sub-score. The overall score explains exactly why it was assigned."
        actions={<SampleSelect />}
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Panel title="Risk score" subtitle={`${sample.id} · ${sample.name}`} actions={<DataBadge kind="ai" />}>
          <RiskGauge score={risk.score} className="mt-2" />
          <div className="mt-6 flex justify-center"><RiskBadge level={risk.level} /></div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-lg bg-risk-low-soft py-2 text-risk-low">Low<br /><span className="font-mono">0–{RISK_BANDS.mediumFrom - 1}</span></div>
            <div className="rounded-lg bg-risk-medium-soft py-2 text-risk-medium">Medium<br /><span className="font-mono">{RISK_BANDS.mediumFrom}–{RISK_BANDS.highFrom - 1}</span></div>
            <div className="rounded-lg bg-risk-high-soft py-2 text-risk-high">High<br /><span className="font-mono">{RISK_BANDS.highFrom}–100</span></div>
          </div>
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this score</div>
            <ul className="mt-2 space-y-2 text-sm">
              {risk.reasons.map((r) => (
                <li key={r} className="flex gap-2"><span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", risk.level === "high" ? "bg-risk-high" : risk.level === "medium" ? "bg-risk-medium" : "bg-risk-low")} />{r}</li>
              ))}
            </ul>
          </div>
          <Button asChild variant={gate.status === "restricted" ? "danger" : "forest"} className="mt-6 w-full rounded-full">
            <Link to="/dashboard/safety-gate">
              Safety Gate: {gate.title} <ArrowRight />
            </Link>
          </Button>
        </Panel>

        <div className="min-w-0 space-y-6">
          {risk.labDataMissing && <LabWarning />}
          <Panel title="Parameter breakdown" subtitle="Sub-scores are 0 (no concern) to 100 (severe)" bodyClassName="px-0 pb-1">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-5 py-2 font-medium">Parameter</th>
                    <th className="px-3 py-2 font-medium">Value</th>
                    <th className="px-3 py-2 font-medium">Reference</th>
                    <th className="w-40 px-3 py-2 font-medium">Sub-score</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 font-medium">Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {risk.factors.map((f) => (
                    <tr key={f.key} className="border-b align-top last:border-0">
                      <td className="px-5 py-3 font-medium">
                        {f.label}
                        <div className="font-mono text-[11px] font-normal text-muted-foreground">weight {Math.round(f.weight * 100)}%</div>
                      </td>
                      <td className="px-3 py-3 tabular">{f.value}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{f.reference}</td>
                      <td className="px-3 py-3">
                        {f.subScore === null ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ScoreBar value={f.subScore} tone={f.subScore >= 50 ? "high" : f.subScore >= 15 ? "medium" : "low"} />
                            <span className="w-7 text-right font-mono text-xs tabular">{Math.round(f.subScore)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3"><span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[f.status].cls)}>{STATUS[f.status].label}</span></td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{f.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title={<span className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-emerald" /> What-if simulator</span>}
            subtitle="Adjust simulated readings to see how the score and Safety Gate respond"
            actions={
              adjusted ? (
                <Button size="sm" variant="outline" onClick={resetAdjustments}><RotateCcw /> Reset to sample</Button>
              ) : null
            }
          >
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {SLIDERS.filter((s) => !(s.key === "sar" && !isMeasured(sample, "sar")) && !(s.key === "ec" && isEstimated(sample, "ec"))).map((s) => (
                <div key={s.key}>
                  <div className="mb-2.5 flex justify-between text-sm">
                    <span className="font-medium">{s.label}</span>
                    <span className="font-mono tabular text-muted-foreground">{s.fmt(sample[s.key])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[sample[s.key]]} onValueChange={(vals) => adjust(s.key, vals[0] ?? sample[s.key])} />
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Heavy-metal values can't be changed here — they only come from laboratory analysis.
              {sample.source === "wokwi-simulation" && " For the ESP32 reading, SAR isn't measured and EC follows TDS automatically."}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
