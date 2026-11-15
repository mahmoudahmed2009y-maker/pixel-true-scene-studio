import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/** 16×2 character LCD showing the exact text the firmware writes. */
export function LcdDisplay({ lines, dimmed = false }: { lines: [string, string]; dimmed?: boolean }) {
  return (
    <div className="rounded-xl bg-lcd-frame p-3 shadow-elevated">
      <div className={cn("rounded-md bg-lcd px-3 py-2 font-mono text-[15px] leading-6 text-lcd-foreground transition-opacity sm:text-base", dimmed && "opacity-40")}>
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre tracking-[0.12em]">{l.padEnd(16, " ").slice(0, 16)}</div>
        ))}
      </div>
      <div className="mt-2 flex justify-between px-1 font-mono text-[10px] text-on-dark-muted">
        <span>LCD1602 · I2C 0x27</span>
        <span>SDA 21 · SCL 22</span>
      </div>
    </div>
  );
}

export function Led({ color, on, label, pin }: { color: "red" | "green"; on: boolean; label: string; pin: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "size-9 rounded-full border-2 transition-all duration-300",
          color === "red" ? "border-led-red text-led-red" : "border-led-green text-led-green",
          on ? (color === "red" ? "bg-led-red led-glow" : "bg-led-green led-glow") : "bg-muted",
        )}
        aria-label={`${label} ${on ? "on" : "off"}`}
      />
      <div className="text-center">
        <div className="text-xs font-medium">{label}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{pin} · {on ? "ON" : "OFF"}</div>
      </div>
    </div>
  );
}

export function Buzzer({ on }: { on: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full border-2 transition-all",
          on ? "border-risk-high bg-risk-high-soft text-risk-high animate-pulse-ring" : "border-border bg-muted text-muted-foreground",
        )}
        aria-label={`Buzzer ${on ? "on" : "off"}`}
      >
        {on ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      </span>
      <div className="text-center">
        <div className="text-xs font-medium">Buzzer</div>
        <div className="font-mono text-[10px] text-muted-foreground">GPIO 5 · {on ? "ON" : "OFF"}</div>
      </div>
    </div>
  );
}

export type IndicatorState = "active" | "inactive" | "unavailable";

export function StateDot({ state, label }: { state: IndicatorState; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
        state === "active" && "bg-risk-low-soft text-risk-low",
        state === "inactive" && "bg-muted text-muted-foreground",
        state === "unavailable" && "border border-dashed border-border text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          state === "active" && "bg-risk-low",
          state === "inactive" && "bg-muted-foreground/50",
          state === "unavailable" && "border border-muted-foreground bg-transparent",
        )}
      />
      {label ?? (state === "active" ? "Active" : state === "inactive" ? "Inactive" : "Unavailable")}
    </span>
  );
}
