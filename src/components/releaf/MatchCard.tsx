import { AlertTriangle, Check, Factory, Sprout, Wrench, X } from "lucide-react";
import type { MatchResult } from "@/lib/releaf/matching";
import { cn } from "@/lib/utils";
import { ScoreBar } from "./Cards";

const STATUS = {
  recommended: { label: "Potential match", cls: "bg-risk-low-soft text-risk-low" },
  conditional: { label: "Conditional", cls: "bg-risk-medium-soft text-risk-medium" },
  "not-suitable": { label: "Not suitable", cls: "bg-risk-high-soft text-risk-high" },
} as const;

export function MatchCard({ match, rank, featured = false }: { match: MatchResult; rank: number; featured?: boolean }) {
  const Icon = match.app.category === "industrial" ? Factory : Sprout;
  return (
    <article className={cn("surface-card overflow-hidden", featured && "ring-2 ring-emerald")}>
      <div className="flex flex-wrap items-start gap-4 p-5">
        <div className="grid size-11 place-items-center rounded-xl bg-mint text-forest">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">#{rank}</span>
            <h3 className="font-semibold">{match.app.name}</h3>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[match.status].cls)}>{STATUS[match.status].label}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{match.app.description}</p>
        </div>
        <div className="w-32 text-right">
          <div className="text-xs text-muted-foreground">Suitability</div>
          <div className="text-2xl font-semibold tabular">{match.score}<span className="text-sm text-muted-foreground">/100</span></div>
          <ScoreBar value={match.score} className="mt-1" />
        </div>
      </div>
      <div className="grid gap-5 border-t bg-background/50 p-5 md:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quality requirements</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {match.requirements.map((r) => (
              <li key={r.label} className="flex items-center gap-2">
                {r.pass ? <Check className="size-3.5 text-risk-low" /> : <X className="size-3.5 text-risk-high" />}
                <span className="w-16 text-muted-foreground">{r.label}</span>
                <span className="tabular">{r.actual}</span>
                <span className="ml-auto text-xs text-muted-foreground">{r.required}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why</div>
          <p className="mt-2 text-sm">{match.reason}</p>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional treatment</div>
          <ul className="mt-2 space-y-1 text-sm">
            {match.treatment.map((t) => (
              <li key={t} className="flex gap-2"><Wrench className="mt-0.5 size-3.5 shrink-0 text-emerald" />{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Warnings & limitations</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {match.warnings.map((w) => (
              <li key={w} className="flex gap-2"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-risk-medium" />{w}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
