import { createFileRoute } from "@tanstack/react-router";
import { Cloud, Droplets, Gauge, Leaf, Recycle, TreePine } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard, PageHeader, Panel, ScoreBar } from "@/components/releaf/Cards";
import { DataBadge } from "@/components/releaf/DataBadge";
import { axisProps, tooltipStyle } from "@/components/dashboard/chart-theme";
import { IMPACT } from "@/lib/releaf/data";
import { pageMeta } from "@/lib/releaf/meta";
import { useCountUp } from "@/hooks/use-count-up";

export const Route = createFileRoute("/dashboard/impact")({
  head: ({ matches }) => pageMeta(matches, "Environmental Impact", "Illustrative water reused, freshwater saved, trees supported, CO2 impact and sustainability performance."),
  component: ImpactPage,
});

function Radial({ value, label }: { value: number; label: string }) {
  const v = useCountUp(value, 1200);
  return (
    <div className="relative h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="78%" outerRadius="100%" data={[{ value }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={12} fill="var(--chart-1)" background={{ fill: "var(--muted)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-5xl text-forest tabular">{Math.round(v)}<span className="text-xl">%</span></div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

function ImpactPage() {
  const reused = useCountUp(IMPACT.litersReused / 1_000_000, 1400);
  const saved = useCountUp(IMPACT.freshwaterSavedLiters / 1_000_000, 1400);
  const trees = useCountUp(IMPACT.treesSupported, 1400);
  const co2 = useCountUp(IMPACT.co2TonnesPerYear, 1400);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Environmental impact"
        title="The return on every reused litre"
        description="Six-month view across all factories in the workspace."
        actions={<DataBadge kind="illustrative" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Recycle} label="Total water reused" value={reused.toFixed(1)} unit="M L" delta={9} hint="illustrative" />
        <KpiCard icon={Droplets} label="Estimated freshwater saved" value={saved.toFixed(1)} unit="M L" delta={8} hint="illustrative" />
        <KpiCard icon={TreePine} label="Trees supported" value={fmt(Math.round(trees))} delta={10} hint="illustrative" />
        <KpiCard icon={Cloud} label="Estimated CO₂ impact" value={Math.round(co2)} unit="t / yr" delta={10} hint="illustrative" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Water reused per month" subtitle="Million litres (illustrative)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={IMPACT.monthly} margin={{ left: -16, right: 8 }}>
                <defs>
                  <linearGradient id="ir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="reused" name="Reused (M L)" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#ir)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Performance" subtitle="Illustrative">
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Radial value={IMPACT.reuseEfficiency} label="Reuse efficiency" />
            <Radial value={IMPACT.sustainabilityScore} label="Sustainability score" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Trees supported & CO₂" subtitle="Thousands of trees · tonnes CO₂ / yr (illustrative)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={IMPACT.monthly} margin={{ left: -16, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis yAxisId="l" {...axisProps} />
                <YAxis yAxisId="r" orientation="right" {...axisProps} />
                <Tooltip {...tooltipStyle} />
                <Bar yAxisId="l" dataKey="trees" name="Trees (k)" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="r" dataKey="co2" name="CO₂ (t/yr)" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Sustainability goals" subtitle="Progress toward 2027 targets (illustrative)">
          <div className="space-y-5">
            {[
              { icon: Recycle, label: "Reuse 75% of treated water", v: 68 / 75 },
              { icon: TreePine, label: "Support 25,000 trees", v: 18400 / 25000 },
              { icon: Leaf, label: "Offset 300 t CO₂ / yr", v: 236 / 300 },
              { icon: Gauge, label: "Zero high-risk discharges", v: 0.92 },
            ].map((g) => (
              <div key={g.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><g.icon className="size-4 text-emerald" />{g.label}</span>
                  <span className="font-mono text-xs tabular">{Math.round(g.v * 100)}%</span>
                </div>
                <ScoreBar value={g.v * 100} tone="low" className="mt-2 h-2" />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Freshwater equivalent", body: `≈ ${fmt(Math.round(IMPACT.freshwaterSavedLiters / 150 / 365))} people's household water for a year (illustrative, 150 L/day).` },
          { title: "Green corridor", body: `≈ ${fmt(Math.round(IMPACT.treesSupported / 400))} hectares of tree belts at 400 trees/ha (illustrative).` },
          { title: "Carbon", body: `≈ ${fmt(Math.round(IMPACT.co2TonnesPerYear / 4.6))} passenger cars' annual emissions (illustrative, 4.6 t/car).` },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl bg-gradient-forest p-6 text-on-dark">
            <Leaf className="size-5 text-emerald" />
            <div className="mt-4 font-semibold">{c.title}</div>
            <p className="mt-1 text-sm text-on-dark-muted">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
