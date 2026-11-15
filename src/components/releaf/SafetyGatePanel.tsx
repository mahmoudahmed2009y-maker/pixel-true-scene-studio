import { useState } from "react";
import { CheckCircle2, FlaskConical, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GateResult, RiskResult } from "@/lib/releaf/types";
import { cn } from "@/lib/utils";

export function SafetyGatePanel({
  gate,
  risk,
  compact = false,
  action,
}: {
  gate: GateResult;
  risk: RiskResult;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  const restricted = gate.status === "restricted";
  const [reviewed, setReviewed] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 transition-colors duration-500",
        restricted ? "border-risk-high/30 bg-risk-high-soft" : "border-risk-low/30 bg-risk-low-soft",
      )}
      role={restricted ? "alert" : "status"}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-xl animate-pulse-ring",
            restricted ? "bg-risk-high text-risk-high" : "bg-risk-low text-risk-low",
          )}
        >
          {restricted ? (
            <ShieldAlert className="size-6 text-destructive-foreground" />
          ) : (
            <ShieldCheck className="size-6 text-emerald-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="eyebrow text-muted-foreground">Safety Gate</div>
          <h3 className={cn("mt-1 font-display text-3xl leading-tight", restricted ? "text-risk-high" : "text-forest")}>
            {gate.title}
          </h3>
          <p className="mt-1 text-sm text-foreground/80">{gate.summary}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {restricted ? "Recommended next steps" : "Before any reuse"}
            </div>
            <ul className="mt-2 space-y-2">
              {gate.nextSteps.map((s) => (
                <li key={s} className="flex gap-2 text-sm">
                  <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", restricted ? "text-risk-high" : "text-risk-low")} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            {gate.warnings.map((w) => (
              <div key={w} className="flex gap-2 rounded-lg border border-risk-medium/30 bg-card/70 p-3 text-sm">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-risk-medium" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {action}
        {!restricted && !compact && (
          <Button variant={reviewed ? "soft" : "outline"} size="sm" onClick={() => setReviewed((v) => !v)}>
            <UserCheck />
            {reviewed ? "Operator review recorded" : "Record operator review"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">Risk score {risk.score}/100 · a human operator makes the final decision.</span>
      </div>
    </div>
  );
}
