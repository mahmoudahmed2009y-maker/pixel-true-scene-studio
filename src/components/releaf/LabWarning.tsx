import { FlaskConical } from "lucide-react";

export function LabWarning() {
  return (
    <div className="flex gap-3 rounded-xl border border-risk-medium/30 bg-risk-medium-soft p-4">
      <FlaskConical className="mt-0.5 size-5 shrink-0 text-risk-medium" />
      <div className="text-sm">
        <div className="font-semibold text-risk-medium">Laboratory testing required</div>
        <p className="mt-0.5 text-foreground/80">
          Basic pH, turbidity and TDS sensors cannot detect heavy metals such as Cadmium (Cd) and Lead (Pb). Heavy-metal
          data for this sample is missing, so the result is uncertain until an accredited laboratory analysis is available.
        </p>
      </div>
    </div>
  );
}
