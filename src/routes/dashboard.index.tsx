import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Droplets, Gauge, Info, Recycle, ShieldAlert, ShieldCheck, TreePine, Waves } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { KpiCard, Panel, PageHeader } from "@/components/releaf/Cards";
import { DataBadge } from "@/components/releaf/DataBadge";
import { RiskBadge } from "@/components/releaf/RiskBadge";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { axisProps, CHART_COLORS, tooltipStyle } from "@/components/dashboard/chart-theme";
import { ALERTS, dailySeries, REUSE_DISTRIBUTION, SENSORS, summarize } from "@/lib/releaf/data";
import { pageMeta } from "@/lib/releaf/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  head: () => pageMeta("Dashboard Overview", "Factory wastewater KPIs, water quality trends, reuse distribution, alerts and system status."),
  component: Overview,
});

function Overview() {
  const { factory, range, risk, gate, sample } = useReleaf();
  const series = dailySeries(factory, range);
  const sum = summarize(series);
  const thinned = series.length > 30 ? series.filter((_, i) => i % 3 === 0) : series;
  const recent = series.slice(-6).reverse();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${factory.name} · ${factory.location}`}
        title="Water intelligence overview"
        description={`${factory.sector} · treatment capacity ${factory.dailyCapacityM3.toLocaleString("en-US")} m³/day`}
        actions={<DataBadge />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={Waves} label="Total water processed" value={sum.processedM3.toLocaleString("en-US")} unit="m³" delta={4} hint="vs prior period" />
        <KpiCard icon={Recycle} label="Water reused" value={sum.reusedM3.toLocaleString("en-US")} unit="m³" delta={9} hint="vs prior period" />
        <KpiCard icon={Gauge} label="Current risk score" value={risk.score} unit="/100" tone={risk.level} hint={`Sample ${sample.id}`} />
        <KpiCard
          icon={gate.status === "restricted" ? ShieldAlert : ShieldCheck}
          label="Water quality status"
          value={<span className="text-lg">{gate.status === "restricted" ? "Restricted" : "Eligible"}</span>}
          tone={gate.status === "restricted" ? "high" : "low"}
          hint="Safety Gate"
        />
        <KpiCard icon={TreePine} label="Trees supported" value={sum.treesSupported.toLocaleString("en-US")} hint="estimated" />
        <KpiCard icon={Droplets} label="Water savings" value={sum.reusePct} unit="%" delta={6} hint="freshwater offset" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Water quality trend" subtitle="Composite quality index (0–100), higher is better">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={thinned} margin={{ left: -18, right: 8 }}>
                <defs>
                  <linearGradient id="q" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" {...axisProps} minTickGap={24} />
                <YAxis domain={[50, 100]} {...axisProps} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="qualityIndex" name="Quality index" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#q)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Water reuse distribution" subtitle="Share of reused volume by application">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={REUSE_DISTRIBUTION} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} stroke="none">
                  {REUSE_DISTRIBUTION.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v: number) => `${v}%`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Daily water consumption" subtitle="Treated volume vs freshwater intake (m³)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={thinned} margin={{ left: -10, right: 8 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" {...axisProps} minTickGap={24} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="reused" name="Reused" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="freshwater" name="Freshwater intake" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="System status" subtitle="Simulated sensor network">
          <ul className="space-y-3">
            {SENSORS.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border bg-background/60 px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{s.id} · {s.location}</div>
                </div>
                <span className={cn("flex items-center gap-1.5 text-xs font-medium", s.status === "online" ? "text-risk-low" : "text-risk-medium")}>
                  <span className={cn("size-2 rounded-full", s.status === "online" ? "bg-risk-low" : "bg-risk-medium")} />
                  {s.status === "online" ? "Simulated · online" : "Calibration due"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-info-soft p-3 text-xs text-info">
            <Info className="mt-0.5 size-3.5 shrink-0" /> Connected hardware sensors: none. Values are generated for demonstration.
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Recent sensor readings"
          subtitle="Daily averages at tertiary outlet"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/monitoring">Monitoring <ArrowRight /></Link>
            </Button>
          }
          bodyClassName="px-0 pb-2"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  {["Date", "pH", "Turbidity", "TDS", "Temp", "EC"].map((h) => (
                    <th key={h} className="px-5 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular">
                {recent.map((r) => (
                  <tr key={r.date} className="border-b last:border-0">
                    <td className="px-5 py-2.5 font-medium">{r.date}</td>
                    <td className="px-5 py-2.5">{r.ph}</td>
                    <td className="px-5 py-2.5">{r.turbidity} NTU</td>
                    <td className="px-5 py-2.5">{r.tds} mg/L</td>
                    <td className="px-5 py-2.5">{r.temperature} °C</td>
                    <td className="px-5 py-2.5">{r.ec} µS/cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Recent alerts" actions={<RiskBadge level={risk.level} />}>
          <ul className="space-y-3">
            {ALERTS.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
                    a.severity === "high" && "bg-risk-high-soft text-risk-high",
                    a.severity === "medium" && "bg-risk-medium-soft text-risk-medium",
                    a.severity === "info" && "bg-info-soft text-info",
                  )}
                >
                  {a.severity === "info" ? <Info className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.detail}</div>
                </div>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">{a.time}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
