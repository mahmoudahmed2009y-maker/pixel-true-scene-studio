import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PageHeader } from "@/components/releaf/Cards";
import { DataBadge } from "@/components/releaf/DataBadge";
import { RiskBadge } from "@/components/releaf/RiskBadge";
import { SafetyGatePanel } from "@/components/releaf/SafetyGatePanel";
import { SampleSelect } from "@/components/dashboard/SampleSelect";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { pageMeta } from "@/lib/releaf/meta";
import { assessRisk, evaluateSafetyGate, RISK_BANDS } from "@/lib/releaf/risk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/safety-gate")({
  head: () => pageMeta("Safety Gate", "Blocks reuse recommendations for high-risk wastewater and flags missing laboratory heavy-metal data."),
  component: SafetyGatePage,
});

function SafetyGatePage() {
  const { risk, gate, setSampleId, sampleId, samples, limits } = useReleaf();
  const restricted = gate.status === "restricted";

  const checks = [
    { label: `Risk score below ${RISK_BANDS.highFrom}`, state: risk.score < RISK_BANDS.highFrom ? "pass" : "fail", detail: `Current score ${risk.score}/100` },
    {
      label: "Heavy metals within reference limits",
      state: risk.labDataMissing ? "pending" : risk.heavyMetalBreach ? "fail" : "pass",
      detail: risk.labDataMissing ? "No laboratory data — cannot be confirmed by sensors" : risk.heavyMetalBreach ? "Cd or Pb exceeds limit" : "Illustrative lab entry below limits",
    },
    {
      label: "No parameter in the severe band",
      state: risk.factors.some((f) => f.status === "exceeds") ? "fail" : "pass",
      detail: risk.factors.filter((f) => f.status === "exceeds").map((f) => f.label).join(", ") || "All parameters below severe threshold",
    },
    { label: "Operator review", state: "pending", detail: "Required before any change of use" },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Safety Gate"
        title={restricted ? "Reuse is blocked for this sample" : "Sample can move to evaluation"}
        description="The Safety Gate runs before any reuse recommendation. High-risk water never reaches Water Matching."
        actions={<SampleSelect />}
      />

      <SafetyGatePanel
        gate={gate}
        risk={risk}
        action={
          restricted ? (
            <Button variant="danger" size="sm" asChild className="rounded-full">
              <Link to="/dashboard/risk">View risk breakdown <ArrowRight /></Link>
            </Button>
          ) : (
            <Button variant="forest" size="sm" asChild>
              <Link to="/dashboard/water-matching">Explore potential reuse options <ArrowRight /></Link>
            </Button>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Gate checks" subtitle="Configured demonstration checks" actions={<DataBadge kind="ai" />}>
          <ul className="space-y-3">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 rounded-lg border bg-background/60 p-3">
                {c.state === "pass" ? (
                  <CheckCircle2 className="mt-0.5 size-5 text-risk-low" />
                ) : c.state === "fail" ? (
                  <XCircle className="mt-0.5 size-5 text-risk-high" />
                ) : (
                  <CircleDashed className="mt-0.5 size-5 text-risk-medium" />
                )}
                <div>
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="All samples" subtitle="Gate decision per sample" bodyClassName="px-0 pb-1">
          <table className="w-full text-sm">
            <tbody>
              {samples.map((s) => {
                const r = assessRisk(s, limits);
                const g = evaluateSafetyGate(r);
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSampleId(s.id)}
                    className={cn("cursor-pointer border-b last:border-0 hover:bg-mint/40", s.id === sampleId && "bg-mint/60")}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium">{s.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{s.id} · {s.stage}</div>
                    </td>
                    <td className="px-3 py-3"><RiskBadge level={r.level} /></td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("text-xs font-semibold", g.status === "restricted" ? "text-risk-high" : "text-risk-low")}>
                        {g.status === "restricted" ? "Restricted" : "Eligible"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
