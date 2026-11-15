import { useState } from "react";
import { useBrand } from "@/hooks/use-brand";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Droplets, FileText, Gauge, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/releaf/Cards";
import { LogoMark } from "@/components/releaf/Logo";
import { SampleSelect } from "@/components/dashboard/SampleSelect";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { dailySeries, IMPACT, summarize } from "@/lib/releaf/data";
import { matchWater } from "@/lib/releaf/matching";
import { pageMeta } from "@/lib/releaf/meta";
import { RISK_LABEL } from "@/lib/releaf/risk";
import { cn } from "@/lib/utils";
import { fmtEc, fmtSar, fmtTemperature } from "@/lib/releaf/types";
import { DATA_SOURCE_LABEL } from "@/lib/releaf/iot/telemetry";

export const Route = createFileRoute("/dashboard/reports")({
  head: ({ matches }) => pageMeta(matches, "Reports", "Generate printable water quality, risk assessment, water reuse and environmental impact reports."),
  component: Reports,
});

const TYPES = [
  { id: "quality", label: "Water Quality Report", icon: Droplets, desc: "Readings against reference ranges" },
  { id: "risk", label: "Risk Assessment Report", icon: Gauge, desc: "Score, factors and Safety Gate" },
  { id: "reuse", label: "Water Reuse Report", icon: FileText, desc: "Ranked reuse applications" },
  { id: "impact", label: "Environmental Impact Report", icon: BarChart3, desc: "Savings, trees and CO₂" },
] as const;
type ReportType = (typeof TYPES)[number]["id"];

function Row({ k, v, tone }: { k: string; v: React.ReactNode; tone?: string }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4 text-muted-foreground">{k}</td>
      <td className={cn("py-2 text-right font-medium tabular", tone)}>{v}</td>
    </tr>
  );
}

function Reports() {
  const { name: siteName } = useBrand();
  const { sample, risk, gate, factory, range, limits } = useReleaf();
  const [type, setType] = useState<ReportType>("quality");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const sum = summarize(dailySeries(factory, range));
  const reuse = matchWater(sample, limits);
  const meta = TYPES.find((t) => t.id === type)!;

  const generate = (t: ReportType) => {
    setType(t);
    setGeneratedAt(new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }));
    toast.success(`${TYPES.find((x) => x.id === t)!.label} generated`, { description: "Sample report from simulated data." });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Generate a report"
        description="Every report is built from simulated readings and clearly labelled as such."
        actions={<SampleSelect />}
      />

      <div className="no-print grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => generate(t.id)}
            className={cn("surface-card flex items-start gap-3 p-4 text-left transition-all hover:shadow-elevated", type === t.id && "ring-2 ring-emerald")}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-forest"><t.icon className="size-5" /></span>
            <span>
              <span className="block text-sm font-semibold">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant="forest" onClick={() => generate(type)}><Sparkles /> Generate sample report</Button>
        <Button variant="outline" className="rounded-full" onClick={() => window.print()}><Printer /> Export as PDF</Button>
        <span className="text-xs text-muted-foreground">Export opens your browser's print dialog — choose “Save as PDF”.</span>
      </div>

      <article className="print-area mx-auto max-w-4xl rounded-2xl border bg-card p-8 shadow-elevated md:p-12">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-10" />
            <div>
              <div className="text-lg font-semibold">{siteName}</div>
              <div className="text-xs text-muted-foreground">Industrial wastewater intelligence</div>
            </div>
          </div>
          <div className="rounded-md border-2 border-dashed border-info px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-info">
            Simulated data · not for compliance
          </div>
        </header>

        <div className="mt-8">
          <div className="eyebrow text-emerald">{meta.label}</div>
          <h2 className="mt-2 font-display text-4xl">{factory.name}</h2>
          <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <span>Site: {factory.location} · {factory.sector}</span>
            <span>Sample: {sample.id} — {sample.name}</span>
            <span>Collected: {sample.collectedAt}</span>
            <span>Generated: {generatedAt ?? "not yet generated"}</span>
            <span className="sm:col-span-2">
              Data source: {sample.source === "wokwi-simulation" ? `${DATA_SOURCE_LABEL["wokwi-demo-readings"]} (ESP32 rig, not live telemetry)` : `${siteName} simulated demo dataset`}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {type === "quality" && (
            <>
              <section>
                <h3 className="text-sm font-semibold">Measured parameters (simulated)</h3>
                <table className="mt-2 w-full text-sm"><tbody>
                  <Row k="pH (6.5–8.5)" v={sample.ph.toFixed(1)} />
                  <Row k="Turbidity (≤ 5 NTU)" v={`${sample.turbidity} NTU`} />
                  <Row k="TDS (≤ 1,000 mg/L)" v={`${sample.tds} mg/L`} />
                  <Row k="Temperature" v={fmtTemperature(sample)} />
                  <Row k="Electrical conductivity" v={fmtEc(sample)} />
                  <Row k="SAR" v={fmtSar(sample)} />
                </tbody></table>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Laboratory data</h3>
                <table className="mt-2 w-full text-sm"><tbody>
                  <Row k="Cadmium (≤ 0.01 mg/L)" v={sample.heavyMetals ? `${sample.heavyMetals.cd} mg/L*` : "Not measured"} />
                  <Row k="Lead (≤ 5.0 mg/L)" v={sample.heavyMetals ? `${sample.heavyMetals.pb} mg/L*` : "Not measured"} />
                </tbody></table>
                <p className="mt-3 text-xs text-muted-foreground">* Illustrative lab entry, not a verified laboratory result. Basic sensors cannot detect heavy metals.</p>
              </section>
            </>
          )}
          {type === "risk" && (
            <>
              <section>
                <h3 className="text-sm font-semibold">Risk summary</h3>
                <div className="mt-3 font-display text-6xl tabular">{risk.score}<span className="text-xl text-muted-foreground">/100</span></div>
                <div className="mt-1 text-sm font-medium">{RISK_LABEL[risk.level]}</div>
                <div className={cn("mt-4 rounded-lg p-3 text-sm font-semibold", gate.status === "restricted" ? "bg-risk-high-soft text-risk-high" : "bg-risk-low-soft text-risk-low")}>
                  Safety Gate: {gate.title}
                </div>
                <ul className="mt-4 space-y-1.5 text-sm">{risk.reasons.map((r) => <li key={r}>• {r}</li>)}</ul>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Factor sub-scores</h3>
                <table className="mt-2 w-full text-sm"><tbody>
                  {risk.factors.map((f) => <Row key={f.key} k={`${f.label} (${f.value})`} v={f.subScore === null ? "No data" : Math.round(f.subScore)} />)}
                </tbody></table>
                <h3 className="mt-6 text-sm font-semibold">Next steps</h3>
                <ul className="mt-2 space-y-1.5 text-sm">{gate.nextSteps.map((s) => <li key={s}>• {s}</li>)}</ul>
              </section>
            </>
          )}
          {type === "reuse" && (
            <section className="md:col-span-2">
              {reuse.blocked ? (
                <div className="rounded-lg bg-risk-high-soft p-4 text-sm text-risk-high">
                  <div className="font-semibold">Water Reuse Restricted</div>
                  No reuse recommendation is provided for this sample. Additional treatment and laboratory testing are required.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">Application</th><th>Status</th><th>Treatment</th><th className="text-right">Score</th></tr></thead>
                  <tbody>
                    {reuse.matches.map((m) => (
                      <tr key={m.app.id} className="border-b align-top last:border-0">
                        <td className="py-2.5 pr-3 font-medium">{m.app.name}</td>
                        <td className="py-2.5 pr-3 capitalize">{m.status.replace("-", " ")}</td>
                        <td className="py-2.5 pr-3 text-xs text-muted-foreground">{m.treatment.join("; ")}</td>
                        <td className="py-2.5 text-right tabular">{m.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
          {type === "impact" && (
            <>
              <section>
                <h3 className="text-sm font-semibold">Period ({range}) — {factory.name}</h3>
                <table className="mt-2 w-full text-sm"><tbody>
                  <Row k="Water processed" v={`${sum.processedM3.toLocaleString("en-US")} m³`} />
                  <Row k="Water reused" v={`${sum.reusedM3.toLocaleString("en-US")} m³`} />
                  <Row k="Reuse rate" v={`${sum.reusePct}%`} />
                  <Row k="Trees supported (est.)" v={sum.treesSupported.toLocaleString("en-US")} />
                </tbody></table>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Workspace (illustrative)</h3>
                <table className="mt-2 w-full text-sm"><tbody>
                  <Row k="Freshwater saved" v={`${(IMPACT.freshwaterSavedLiters / 1e6).toFixed(1)} M L`} />
                  <Row k="Trees supported" v={IMPACT.treesSupported.toLocaleString("en-US")} />
                  <Row k="CO₂ impact" v={`${IMPACT.co2TonnesPerYear} t / yr`} />
                  <Row k="Sustainability score" v={`${IMPACT.sustainabilityScore}/100`} />
                </tbody></table>
              </section>
            </>
          )}
        </div>

        <footer className="mt-10 grid gap-6 border-t pt-6 text-xs text-muted-foreground md:grid-cols-2">
          <p>
            This report was produced by a demonstration system using simulated readings and rule-based recommendations. It does not certify water
            safety or regulatory compliance and must not be used for operational decisions without verified laboratory results.
          </p>
          <div className="space-y-6">
            <div className="border-b border-foreground/40 pb-1">Operator review (name / signature)</div>
            <div className="border-b border-foreground/40 pb-1">Date</div>
          </div>
        </footer>
      </article>
    </div>
  );
}
