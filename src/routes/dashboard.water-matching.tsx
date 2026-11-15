import { createFileRoute, Link } from "@tanstack/react-router";
import { useBrand } from "@/hooks/use-brand";
import { ArrowRight, Info, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/releaf/Cards";
import { DataBadge } from "@/components/releaf/DataBadge";
import { LabWarning } from "@/components/releaf/LabWarning";
import { MatchCard } from "@/components/releaf/MatchCard";
import { SafetyGatePanel } from "@/components/releaf/SafetyGatePanel";
import { SampleSelect } from "@/components/dashboard/SampleSelect";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { matchWater } from "@/lib/releaf/matching";
import { pageMeta } from "@/lib/releaf/meta";

export const Route = createFileRoute("/dashboard/water-matching")({
  head: ({ matches }) => pageMeta(matches, "AI Water Matching", "Ranks cooling, process wash, landscaping and plantation reuse options by water-quality suitability."),
  component: WaterMatching,
});

function WaterMatching() {
  const { name: siteName } = useBrand();
  const { sample, risk, gate, limits } = useReleaf();
  const outcome = matchWater(sample, limits);
  const top = outcome.matches[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI water matching"
        title="Where can this water go next?"
        description="Options are ranked by water-quality fit — closed-loop industrial reuse is weighed first, irrigation only where quality allows."
        actions={<SampleSelect />}
      />

      {outcome.blocked ? (
        <>
          <SafetyGatePanel
            gate={gate}
            risk={risk}
            compact
            action={
              <Button variant="danger" size="sm" asChild className="rounded-full">
                <Link to="/dashboard/safety-gate">Open Safety Gate <ArrowRight /></Link>
              </Button>
            }
          />
          <div className="surface-card flex items-start gap-3 p-6">
            <Info className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <div className="font-semibold">No reuse recommendation provided</div>
              <p className="mt-1 text-sm text-muted-foreground">
                The Safety Gate restricts this sample, so {siteName} does not rank or approve any reuse application. Treat the
                water further, obtain laboratory results and re-assess.
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {risk.labDataMissing && <LabWarning />}
          {top && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-forest p-6 text-on-dark md:p-8">
              <div className="pointer-events-none absolute inset-0 bg-glow" />
              <div className="relative flex flex-wrap items-center gap-6">
                <div className="grid size-14 place-items-center rounded-2xl bg-emerald text-emerald-foreground"><Trophy className="size-6" /></div>
                <div className="min-w-0 flex-1">
                  <div className="eyebrow text-on-dark-muted">Most suitable potential application</div>
                  <div className="mt-1 font-display text-4xl">{top.app.name}</div>
                  <p className="mt-1 max-w-2xl text-sm text-on-dark-muted">{top.reason}</p>
                </div>
                <div className="text-right">
                  <div className="font-display text-6xl text-emerald tabular">{top.score}</div>
                  <div className="text-xs text-on-dark-muted">suitability / 100</div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">All evaluated applications</h2>
            <DataBadge kind="ai" />
          </div>
          <div className="space-y-4">
            {outcome.matches.map((m, i) => (
              <MatchCard key={m.app.id} match={m} rank={i + 1} featured={i === 0} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Suitability scores are rule-based estimates from simulated readings. They are not a certification of safety or regulatory compliance.
          </p>
        </>
      )}
    </div>
  );
}
