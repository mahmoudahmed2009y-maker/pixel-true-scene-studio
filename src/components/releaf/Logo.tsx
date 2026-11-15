import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9 21.5c0-7 5.2-11.6 14-12-0.3 8.6-5 13.6-11.6 13.6-0.9 0-1.7-0.1-2.4-0.4"
        className="fill-emerald"
      />
      <path d="M9.5 22.5c2.6-3.4 5.8-6 9.5-7.8" className="stroke-primary" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="11" cy="9.5" r="1.8" className="fill-mint" />
    </svg>
  );
}

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="ReLeaf home">
      <LogoMark />
      <span
        className={cn(
          "text-[1.15rem] font-semibold tracking-tight",
          tone === "light" ? "text-on-dark" : "text-foreground",
        )}
      >
        ReLeaf
      </span>
    </Link>
  );
}
