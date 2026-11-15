import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Droplets, Plus, ShieldAlert, Sprout, Sun, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, ScoreBar } from "@/components/releaf/Cards";
import { DataBadge } from "@/components/releaf/DataBadge";
import { SampleSelect } from "@/components/dashboard/SampleSelect";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { pageMeta } from "@/lib/releaf/meta";
import { fmtSar } from "@/lib/releaf/types";
import { CLIMATE_ZONES, ECE_FROM_ECW, matchPlants, type ClimateZone, type PlantMatch } from "@/lib/releaf/plants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/plants")({
  head: () => pageMeta("AI Plant Matcher", "Compare olive, pomegranate, eucalyptus and sesbania suitability for treated-water irrigation."),
  component: PlantMatcher,
});

const COMPARE_ROWS: { label: string; get: (m: PlantMatch) => string }[] = [
  { label: "Water suitability", get: (m) => `${m.score}/100` },
  { label: "Salinity threshold (ECe)", get: (m) => `${m.plant.salinityThreshold} dS/m` },
  { label: "Max SAR", get: (m) => `${m.plant.maxSar}` },
  { label: "Climate fit", get: (m) => `${m.climateFit}%` },
  { label: "Water need", get: (m) => `~${m.plant.waterLitersPerDay} L/day` },
  { label: "CO₂ uptake (est.)", get: (m) => `~${m.plant.co2KgPerYear} kg/yr` },
  { label: "Growth", get: (m) => m.plant.growth },
];

function PlantMatcher() {
  const { sample, gate, zone, setZone } = useReleaf();
  const matches = matchPlants(sample, zone);
  const [compare, setCompare] = useState<string[]>(["olive", "sesbania"]);
  const toggle = (id: string) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const compared = matches.filter((m) => compare.includes(m.plant.id));
  const restricted = gate.status === "restricted";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI plant matcher"
        title="Drought-tolerant trees for this water"
        description={`Matched on salinity (est. soil ECe ${((sample.ec / 1000) * ECE_FROM_ECW).toFixed(1)} dS/m), sodium hazard (SAR ${fmtSar(sample)}) and climate.`}
        actions={
          <>
            <Select value={zone} onValueChange={(v) => setZone(v as ClimateZone)}>
              <SelectTrigger className="h-9 w-[190px] bg-card" aria-label="Climate zone"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLIMATE_ZONES.map((z) => <SelectItem key={z.id} value={z.id}>{z.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <SampleSelect />
          </>
        }
      />

      <div className={cn("flex gap-3 rounded-xl border p-4", restricted ? "border-risk-high/30 bg-risk-high-soft" : "border-risk-medium/30 bg-risk-medium-soft")}>
        {restricted ? <ShieldAlert className="mt-0.5 size-5 shrink-0 text-risk-high" /> : <TriangleAlert className="mt-0.5 size-5 shrink-0 text-risk-medium" />}
        <p className="text-sm">
          <span className={cn("font-semibold", restricted ? "text-risk-high" : "text-risk-medium")}>
            {restricted ? "Irrigation not permitted for this sample. " : "Plant suitability does not override water safety. "}
          </span>
          {restricted
            ? "The Safety Gate restricts reuse — these scores are shown for planning only."
            : "Any irrigation still requires the Safety Gate, laboratory confirmation and operator approval."}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {matches.map((m, i) => {
          const selected = compare.includes(m.plant.id);
          return (
            <article key={m.plant.id} className="surface-card group overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={m.plant.image} alt={m.plant.name} width={1024} height={768} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {i === 0 && <span className="absolute left-3 top-3 rounded-full bg-emerald px-2.5 py-1 text-[11px] font-semibold text-emerald-foreground">Best match</span>}
                <div className="absolute bottom-3 right-3 rounded-xl bg-card/95 px-3 py-1.5 text-right shadow-card backdrop-blur">
                  <div className="text-[10px] text-muted-foreground">Water suitability</div>
                  <div className="text-xl font-semibold leading-none tabular">{m.score}</div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold">{m.plant.name}</h3>
                <div className="text-xs italic text-muted-foreground">{m.plant.latin}</div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Salinity tolerance</dt><dd className="font-medium">{m.plant.salinityLabel}</dd></div>
                    <ScoreBar value={m.salinityFit} className="mt-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Climate compatibility</dt><dd className="font-medium tabular">{m.climateFit}%</dd></div>
                    <ScoreBar value={m.climateFit} className="mt-1.5" />
                  </div>
                  <div className="flex gap-2"><Droplets className="mt-0.5 size-4 shrink-0 text-emerald" /><span>{m.plant.irrigation} · ~{m.plant.waterLitersPerDay} L/day</span></div>
                  <div className="flex gap-2"><Sprout className="mt-0.5 size-4 shrink-0 text-emerald" /><span>{m.plant.growth}</span></div>
                </dl>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{m.explanation}</p>
                <Button variant={selected ? "soft" : "outline"} size="sm" className="mt-4 w-full" onClick={() => toggle(m.plant.id)}>
                  {selected ? <Check /> : <Plus />} {selected ? "In comparison" : "Add to compare"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <Panel title="Compare species" subtitle={compared.length < 2 ? "Select at least two trees to compare" : `${compared.length} species selected`} actions={<DataBadge kind="ai" />} bodyClassName="px-0 pb-1">
        {compared.length < 2 ? (
          <p className="px-5 pb-4 text-sm text-muted-foreground">Use “Add to compare” on the cards above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Attribute</th>
                  {compared.map((m) => <th key={m.plant.id} className="px-4 py-2 font-medium text-foreground">{m.plant.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="px-5 py-3 text-muted-foreground">{row.label}</td>
                    {compared.map((m) => <td key={m.plant.id} className="px-4 py-3 tabular">{row.get(m)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Sun className="size-3.5" /> Climate zone: {CLIMATE_ZONES.find((z) => z.id === zone)?.note}</p>
    </div>
  );
}
