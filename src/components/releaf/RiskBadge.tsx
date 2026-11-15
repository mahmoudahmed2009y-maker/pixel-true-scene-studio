import { Badge } from "@/components/ui/badge";
import { RISK_LABEL } from "@/lib/releaf/risk";
import type { RiskLevel } from "@/lib/releaf/types";
import { cn } from "@/lib/utils";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <Badge variant={level} className={cn("gap-1.5 rounded-full", className)}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          level === "low" && "bg-risk-low",
          level === "medium" && "bg-risk-medium",
          level === "high" && "bg-risk-high",
        )}
      />
      {RISK_LABEL[level]}
    </Badge>
  );
}

export const riskText: Record<RiskLevel, string> = {
  low: "text-risk-low",
  medium: "text-risk-medium",
  high: "text-risk-high",
};
export const riskStroke: Record<RiskLevel, string> = {
  low: "stroke-risk-low",
  medium: "stroke-risk-medium",
  high: "stroke-risk-high",
};
export const riskBg: Record<RiskLevel, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
};
export const riskSoftBg: Record<RiskLevel, string> = {
  low: "bg-risk-low-soft",
  medium: "bg-risk-medium-soft",
  high: "bg-risk-high-soft",
};
