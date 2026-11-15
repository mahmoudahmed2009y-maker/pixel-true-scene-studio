import { Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { tooltipStyle } from "@/components/dashboard/chart-theme";
import { cn } from "@/lib/utils";

export function SensorCard({
  label,
  value,
  unit,
  decimals,
  pass,
  thresholdText,
  formula,
  wiring,
  adc,
  history,
  domain,
  band,
  limit,
}: {
  label: string;
  value: number;
  unit: string;
  decimals: number;
  pass: boolean;
  thresholdText: string;
  formula: string;
  wiring: string;
  adc: number;
  history: { t: number; v: number }[];
  domain: [number, number];
  band?: [number, number];
  limit?: number;
}) {
  return (
    <article className="surface-card flex flex-col overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{label}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", pass ? "bg-risk-low-soft text-risk-low" : "bg-risk-high-soft text-risk-high")}>
            {pass ? "Within demo range" : "Outside demo range"}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-5xl font-semibold tracking-tight tabular">{value.toFixed(decimals)}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Demo threshold: <b className="font-medium text-foreground">{thresholdText}</b></span>
          <span className="font-mono">ADC {adc}</span>
        </div>
      </div>
      <div className="h-36 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 6, right: 12, bottom: 6, left: 0 }}>
            {band && <ReferenceArea y1={band[0]} y2={band[1]} fill="var(--risk-low)" fillOpacity={0.1} />}
            {limit !== undefined && <ReferenceLine y={limit} stroke="var(--risk-high)" strokeDasharray="4 4" />}
            <YAxis domain={domain} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={40} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(decimals)} ${unit}`, label]} labelFormatter={() => ""} />
            <Line type="monotone" dataKey="v" stroke="var(--chart-1)" strokeWidth={2.25} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-auto border-t bg-background/60 px-5 py-3 text-[11px] text-muted-foreground">
        <div className="font-mono">{formula}</div>
        <div className="mt-0.5">{wiring}</div>
      </div>
    </article>
  );
}
