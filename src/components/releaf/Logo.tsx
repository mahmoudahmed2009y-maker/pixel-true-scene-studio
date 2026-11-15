import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useBrand } from "@/hooks/use-brand";

/** Built-in RELEAF emblem, served from public/brand so it works on any host (Lovable, Vercel, local). */
export const DEFAULT_LOGO_URL = "/brand/releaf-logo.png";

export function LogoMark({ className, src }: { className?: string; src?: string | null }) {
  const brand = useBrand();
  return (
    <img
      src={src ?? brand.logoUrl ?? DEFAULT_LOGO_URL}
      alt=""
      width={720}
      height={720}
      className={cn("size-8 shrink-0 object-contain", className)}
    />
  );
}

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const { name } = useBrand();
  return (
    <Link to="/" className={cn("flex min-w-0 items-center gap-2.5", className)} aria-label={`${name} home`}>
      <LogoMark />
      <span
        className={cn(
          "truncate text-[1.15rem] font-semibold tracking-tight",
          tone === "light" ? "text-on-dark" : "text-foreground",
        )}
      >
        {name}
      </span>
    </Link>
  );
}
