import { useCountUp } from "@/hooks/use-count-up";
import { riskLevelFor, RISK_LABEL } from "@/lib/releaf/risk";
import { cn } from "@/lib/utils";
import { riskStroke, riskText } from "./RiskBadge";

/** Semicircular 0–100 risk gauge with low / medium / high bands. */
export function RiskGauge({ score, size = 240, className }: { score: number; size?: number; className?: string }) {
  const animated = useCountUp(score, 1100);
  const level = riskLevelFor(Math.round(animated));
  const r = 80;
  const len = Math.PI * r;
  const offset = len * (1 - animated / 100);
  const angle = Math.PI * (1 - animated / 100);
  const nx = 100 + Math.cos(angle) * r;
  const ny = 100 - Math.sin(angle) * r;

  return (
    <div className={cn("relative mx-auto", className)} style={{ width: size }}>
      <svg viewBox="0 0 200 116" className="w-full overflow-visible">
        {/* bands */}
        <path d="M20 100 A80 80 0 0 1 180 100" className="stroke-muted" strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d="M20 100 A80 80 0 0 1 180 100" className="stroke-risk-low/25" strokeWidth="16" fill="none" strokeDasharray={`${len * 0.4} ${len}`} />
        <path d="M20 100 A80 80 0 0 1 180 100" className="stroke-risk-medium/25" strokeWidth="16" fill="none" strokeDasharray={`0 ${len * 0.4} ${len * 0.3} ${len}`} />
        <path d="M20 100 A80 80 0 0 1 180 100" className="stroke-risk-high/25" strokeWidth="16" fill="none" strokeDasharray={`0 ${len * 0.7} ${len * 0.3} ${len}`} />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          className={cn(riskStroke[level], "transition-colors duration-500")}
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={offset}
        />
        <circle cx={nx} cy={ny} r="7" className={cn("fill-card", riskStroke[level])} strokeWidth="3" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <div className={cn("font-display text-6xl leading-none tabular transition-colors", riskText[level])}>
          {Math.round(animated)}
        </div>
        <div className="mt-1 text-xs font-medium tracking-wide text-muted-foreground">
          / 100 · {RISK_LABEL[level]}
        </div>
      </div>
    </div>
  );
}
