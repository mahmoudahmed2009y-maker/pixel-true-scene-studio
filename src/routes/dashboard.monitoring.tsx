import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Cpu, Radio, Unplug } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, PageHeader } from "@/components/releaf/Cards";
import { DataBadge } from "@/components/releaf/DataBadge";
import { SampleSelect } from "@/components/dashboard/SampleSelect";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { axisProps, tooltipStyle } from "@/components/dashboard/chart-theme";
import { seeded, SENSORS } from "@/lib/releaf/data";
import { pageMeta } from "@/lib/releaf/meta";
import { PARAMS, paramState, type ParamConfig, type ParamKey } from "@/lib/releaf/parameters";
import { cn } from "@/lib/utils";
import { isEstimated, isMeasured } from "@/lib/releaf/types";

export const Route = createFileRoute("/dashboard/monitoring")({
  head: () => pageMeta("Water Monitoring", "Simulated pH, turbidity, TDS, temperature and conductivity readings with normal and warning ranges."),
  component: Monitoring,
});

const STATE_STYLE = {
  normal: { text: "text-risk-low", bg: "bg-risk-low", soft: "bg-risk-low-soft", label: "Normal" },
  warning: { text: "text-risk-medium", bg: "bg-risk-medium", soft: "bg-risk-medium-soft", label: "Warning" },
  critical: { text: "text-risk-high", bg: "bg-risk-high", soft: "bg-risk-high-soft", label: "Out of range" },
} as const;

function RangeBar({ cfg, value }: { cfg: ParamConfig; value: number }) {
  const pct = (v: number) => ((v - cfg.domain[0]) / (cfg.domain[1] - cfg.domain[0])) * 100;
  const pos = Math.max(0, Math.min(100, pct(value)));
  return (
    <div className="relative mt-4 h-2 rounded-full bg-risk-high-soft">
      <div className="absolute inset-y-0 rounded-full bg-risk-medium/35" style={{ left: `${pct(cfg.warning[0])}%`, width: `${pct(cfg.warning[1]) - pct(cfg.warning[0])}%` }} />
      <div className="absolute inset-y-0 rounded-full bg-risk-low/55" style={{ left: `${pct(cfg.normal[0])}%`, width: `${pct(cfg.normal[1]) - pct(cfg.normal[0])}%` }} />
      <div className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-foreground shadow transition-all duration-700" style={{ left: `${pos}%` }} />
    </div>
  );
}

function Monitoring() {
  const { sample } = useReleaf();
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState<string | null>(null);
  const [active, setActive] = useState<ParamKey>("ph");

  // Simulated live stream: small jitter every 4s, only after hydration.
  useEffect(() => {
    const update = () => {
      setTick((t) => t + 1);
      setNow(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    update();
    const id = setInterval(update, 4000);
    return () => clearInterval(id);
  }, []);

  const live = useMemo(() => {
    const rnd = seeded(tick * 97 + sample.id.charCodeAt(3));
    const j = (v: number, pct: number) => (tick === 0 ? v : v * (1 + (rnd() - 0.5) * pct));
    return {
      ph: j(sample.ph, 0.02),
      turbidity: j(sample.turbidity, 0.08),
      tds: j(sample.tds, 0.03),
      temperature: j(sample.temperature, 0.015),
      ec: j(sample.ec, 0.03),
    } as Record<ParamKey, number>;
  }, [tick, sample]);

  const history = useMemo(() => {
    const rnd = seeded(sample.id.charCodeAt(3) * 31);
    return Array.from({ length: 24 }, (_, i) => {
      const drift = 1 + ((23 - i) / 23) * 0.12;
      const row: Record<string, number | string> = { time: `${String(i).padStart(2, "0")}:00` };
      PARAMS.forEach((p) => {
        const base = sample[p.key] * (p.key === "temperature" || p.key === "ph" ? 1 : drift);
        row[p.key] = +(base * (1 + (rnd() - 0.5) * 0.1)).toFixed(p.decimals === 0 ? 0 : 2);
      });
      return row;
    });
  }, [sample]);

  const cfg = PARAMS.find((p) => p.key === active)!;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Water quality monitoring"
        title="Sensor readings"
        description={`${sample.name} · ${sample.stage} · collected ${sample.collectedAt}`}
        actions={<SampleSelect />}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-info/40 bg-info-soft px-4 py-3">
          <Radio className="size-4 text-info" />
          <div className="text-sm"><span className="font-semibold text-info">Simulated stream</span> <span className="text-muted-foreground">· every value on this page</span></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <Unplug className="size-4 text-muted-foreground" />
          <div className="text-sm"><span className="font-semibold">Connected sensors</span> <span className="text-muted-foreground">· none (0 of 4)</span></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <Clock className="size-4 text-muted-foreground" />
          <div className="text-sm"><span className="font-semibold">Last update</span> <span className="font-mono text-muted-foreground tabular">{now ?? "—"}</span></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {PARAMS.map((p) => {
          const v = live[p.key];
          if (p.key === "temperature" && !isMeasured(sample, "temperature")) {
            return (
              <div key={p.key} className="surface-card flex flex-col justify-between p-5">
                <span className="text-xs font-medium text-muted-foreground">{p.label}</span>
                <span className="mt-3 text-lg font-semibold text-muted-foreground">Not measured</span>
                <span className="mt-3 text-[11px] text-muted-foreground">The ESP32 rig has no temperature sensor.</span>
              </div>
            );
          }
          const st = STATE_STYLE[paramState(p, v)];
          return (
            <button
              key={p.key}
              onClick={() => setActive(p.key)}
              className={cn(
                "surface-card p-5 text-left transition-all hover:shadow-elevated",
                active === p.key && "ring-2 ring-emerald",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{p.label}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", st.soft, st.text)}>{st.label}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular">{v.toLocaleString("en-US", { maximumFractionDigits: p.decimals, minimumFractionDigits: p.decimals })}</span>
                <span className="text-sm text-muted-foreground">{p.unit}</span>
              </div>
              <RangeBar cfg={p} value={v} />
              <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
                <span>{p.key === "ec" && isEstimated(sample, "ec") ? "Estimated from TDS" : `Normal ${p.normal[0]}–${p.normal[1].toLocaleString("en-US")}`}</span>
                <span className="font-mono">{p.sensorId}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title={`${cfg.label} — last 24 hours`}
          subtitle="Shaded band shows the normal range"
          actions={<DataBadge />}
        >
          <div className="mb-4 flex flex-wrap gap-1.5">
            {PARAMS.map((p) => (
              <button
                key={p.key}
                onClick={() => setActive(p.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  active === p.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-mint",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ left: -10, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <ReferenceArea y1={cfg.normal[0]} y2={cfg.normal[1]} fill="var(--risk-low)" fillOpacity={0.08} />
                <XAxis dataKey="time" {...axisProps} interval={3} />
                <YAxis {...axisProps} domain={["auto", "auto"]} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey={cfg.key} name={`${cfg.label} ${cfg.unit}`} stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Sensor status" subtitle="Simulated devices">
          <ul className="divide-y">
            {SENSORS.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="grid size-9 place-items-center rounded-lg bg-mint text-forest"><Cpu className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{s.id} · {s.location}</div>
                </div>
                <span className={cn("text-xs font-medium", s.status === "online" ? "text-risk-low" : "text-risk-medium")}>
                  {s.status === "online" ? "Online (sim)" : "Calibration due"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg border p-3 text-xs text-muted-foreground">
            <div className="mb-2 font-semibold text-foreground">Data source legend</div>
            <div className="flex items-center gap-2"><span className="size-2.5 rounded-full border-2 border-dashed border-info" /> Simulated reading — shown on this page</div>
            <div className="mt-1 flex items-center gap-2"><span className="size-2.5 rounded-full bg-emerald" /> Connected sensor measurement — none available</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
