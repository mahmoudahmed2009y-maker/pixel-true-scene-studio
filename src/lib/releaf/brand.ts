import { z } from "zod";

/** Site name + logo chosen by admins in the admin panel. `logoUrl: null` means "use the built-in emblem". */
export type Brand = { name: string; logoUrl: string | null };

export const DEFAULT_BRAND_NAME = "RELEAF";
export const DEFAULT_BRAND: Brand = { name: DEFAULT_BRAND_NAME, logoUrl: null };

export const SITE_NAME_MAX = 40;
/** Largest stored logo (a base64 data URL) — mirrors the database check. */
export const LOGO_MAX_CHARS = 400_000;
/** Longest side of the stored logo in pixels; uploads are shrunk to this. */
export const LOGO_MAX_PX = 256;

export const siteNameSchema = z
  .string()
  .trim()
  .min(1, "Site name is required")
  .max(SITE_NAME_MAX, `Site name must be ${SITE_NAME_MAX} characters or fewer`);

const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/** Returns an error message, or null when the logo can be saved. */
export function logoError(dataUrl: string | null): string | null {
  if (dataUrl === null) return null;
  if (!LOGO_RE.test(dataUrl)) return "Logo must be a PNG, JPEG or WebP image";
  if (dataUrl.length > LOGO_MAX_CHARS) return "Logo is too large — try a simpler or smaller image";
  return null;
}

/** Turns a raw settings row (or anything unexpected) into a safe Brand, falling back to the defaults. */
export function parseBrand(raw: unknown): Brand {
  if (!raw || typeof raw !== "object") return DEFAULT_BRAND;
  const r = raw as { site_name?: unknown; logo_data_url?: unknown; name?: unknown; logoUrl?: unknown };
  const name = siteNameSchema.safeParse(r.site_name ?? r.name);
  const logo = typeof (r.logo_data_url ?? r.logoUrl) === "string" ? ((r.logo_data_url ?? r.logoUrl) as string) : null;
  return {
    name: name.success ? name.data : DEFAULT_BRAND_NAME,
    logoUrl: logo && logoError(logo) === null ? logo : null,
  };
}

/** Swaps the default product name in a piece of copy for the admin-chosen name. */
export function brandText(text: string, name: string) {
  return name === DEFAULT_BRAND_NAME ? text : text.split(DEFAULT_BRAND_NAME).join(name);
}
