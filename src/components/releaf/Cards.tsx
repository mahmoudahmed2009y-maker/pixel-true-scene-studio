import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("surface-card flex min-w-0 flex-col", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h3 className="text-[0.95rem] font-semibold tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  tone = "default",
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: number;
  tone?: "default" | "low" | "medium" | "high";
  hint?: string;
}) {
  return (
    <div className="surface-card group relative overflow-hidden p-5 transition-shadow hover:shadow-elevated">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "grid size-8 place-items-center rounded-lg",
            tone === "default" && "bg-mint text-forest",
            tone === "low" && "bg-risk-low-soft text-risk-low",
            tone === "medium" && "bg-risk-medium-soft text-risk-medium",
            tone === "high" && "bg-risk-high-soft text-risk-high",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[1.75rem] font-semibold leading-none tracking-tight tabular">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-risk-low" : "text-risk-high")}>
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <div className="eyebrow text-emerald">{eyebrow}</div>}
        <h1 className="mt-1 font-display text-4xl leading-tight md:text-[2.75rem]">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ScoreBar({ value, className, tone }: { value: number; className?: string; tone?: "low" | "medium" | "high" }) {
  const t = tone ?? (value >= 75 ? "low" : value >= 45 ? "medium" : "high");
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          t === "low" && "bg-risk-low",
          t === "medium" && "bg-risk-medium",
          t === "high" && "bg-risk-high",
        )}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}
