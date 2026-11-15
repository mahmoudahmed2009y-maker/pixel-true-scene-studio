import { FlaskConical, Radio, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Kind = "simulated" | "lab" | "ai" | "illustrative";

const COPY: Record<Kind, { label: string; title: string }> = {
  simulated: { label: "Simulated data", title: "Generated readings — no hardware sensor is connected." },
  lab: { label: "Illustrative lab entry", title: "Example laboratory values — not a verified lab result." },
  ai: { label: "Rule-based recommendation", title: "Computed by RELIEF's demonstration rules — not a trained AI model." },
  illustrative: { label: "Illustrative figures", title: "Example statistics for demonstration only." },
};

export function DataBadge({ kind = "simulated", className }: { kind?: Kind; className?: string }) {
  const Icon = kind === "lab" ? FlaskConical : kind === "ai" ? Sparkles : Radio;
  return (
    <Badge variant={kind === "lab" ? "lab" : "simulated"} className={cn("gap-1.5 rounded-full", className)} title={COPY[kind].title}>
      <Icon className="size-3" />
      {COPY[kind].label}
    </Badge>
  );
}
