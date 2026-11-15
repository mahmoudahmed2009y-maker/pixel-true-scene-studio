import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/relief-logo.png.asset.json";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt=""
      width={720}
      height={720}
      className={cn("size-8 shrink-0 object-contain", className)}
    />
  );
}

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="RELIEF home">
      <LogoMark />
      <span
        className={cn(
          "text-[1.15rem] font-semibold tracking-tight",
          tone === "light" ? "text-on-dark" : "text-foreground",
        )}
      >
        RELIEF
      </span>
    </Link>
  );
}
