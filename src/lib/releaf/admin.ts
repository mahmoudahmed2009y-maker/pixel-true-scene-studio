import { z } from "zod";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import type { Factory } from "./data";
import { LIMITS, type RiskLimits } from "./risk";
import type { WaterSample } from "./types";

export type FactoryRow = Tables<"factories">;
export type SampleRow = Tables<"water_samples">;
export type LimitsRow = Tables<"risk_limits">;
export type AppRole = "admin" | "operator";

/** What each role may do in the admin panel. Mirrors the database policies. */
export const ROLE_PERMISSIONS: Record<AppRole, { factories: boolean; samples: boolean; limits: boolean; users: boolean; branding: boolean }> = {
  admin: { factories: true, samples: true, limits: true, users: true, branding: true },
  operator: { factories: false, samples: true, limits: false, users: false, branding: false },
};

export function can(roles: readonly AppRole[], area: keyof (typeof ROLE_PERMISSIONS)["admin"]) {
  return roles.some((r) => ROLE_PERMISSIONS[r][area]);
}

export function rowToFactory(r: FactoryRow): Factory {
  return { id: r.id, name: r.name, location: r.location, sector: r.sector, dailyCapacityM3: r.daily_capacity_m3 };
}

/** "2026-11-12T06:40:00+00:00" → "2026-11-12 06:40" (UTC, so server and browser agree). */
export function fmtCollectedAt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 16).replace("T", " ");
}

export function rowToSample(r: SampleRow): WaterSample {
  return {
    id: r.id,
    name: r.name,
    stage: r.stage,
    factoryId: r.factory_id,
    collectedAt: fmtCollectedAt(r.collected_at),
    ph: Number(r.ph),
    turbidity: Number(r.turbidity),
    tds: Number(r.tds),
    temperature: Number(r.temperature),
    ec: Number(r.ec),
    sar: Number(r.sar),
    heavyMetals:
      r.lab_cd !== null && r.lab_pb !== null
        ? { cd: Number(r.lab_cd), pb: Number(r.lab_pb), source: "illustrative-lab" }
        : null,
    source: "demo-dataset",
  };
}

export function rowToLimits(r: LimitsRow): RiskLimits {
  return {
    ph: { min: Number(r.ph_min), max: Number(r.ph_max) },
    turbidity: { max: Number(r.turbidity_max) },
    tds: { max: Number(r.tds_max) },
    salinity: { none: Number(r.salinity_none), severe: Number(r.salinity_severe) },
    sar: { none: Number(r.sar_none), severe: Number(r.sar_severe) },
    cd: Number(r.cd_max),
    pb: Number(r.pb_max),
  };
}

const num = (label: string, min: number, max: number) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .refine(Number.isFinite, `${label} must be a number`)
    .refine((n) => n >= min && n <= max, `${label} must be between ${min} and ${max}`);
const optionalNum = (label: string, min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), num(label, min, max).nullable());

export const factorySchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{1,40}$/, "ID: 2–41 lowercase letters, numbers or dashes (e.g. cairo-paper)"),
  name: z.string().trim().min(1, "Name is required").max(80),
  location: z.string().trim().max(80),
  sector: z.string().trim().max(80),
  daily_capacity_m3: num("Daily capacity", 1, 1_000_000).refine(Number.isInteger, "Daily capacity must be a whole number"),
});
export type FactoryInput = z.infer<typeof factorySchema>;

export const sampleSchema = z
  .object({
    id: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9][A-Za-z0-9-]{1,30}$/, "ID: 2–31 letters, numbers or dashes (e.g. S-105)"),
    name: z.string().trim().min(1, "Name is required").max(120),
    stage: z.string().trim().max(80),
    factory_id: z.string().min(1, "Choose a factory"),
    collected_at: z.string().min(1, "Collection time is required"),
    ph: num("pH", 0, 14),
    turbidity: num("Turbidity", 0, 5000),
    tds: num("TDS", 0, 100_000),
    temperature: num("Temperature", -10, 100),
    ec: num("EC", 0, 200_000),
    sar: num("SAR", 0, 100),
    lab_cd: optionalNum("Cadmium", 0, 100),
    lab_pb: optionalNum("Lead", 0, 1000),
  })
  .refine((v) => (v.lab_cd === null) === (v.lab_pb === null), {
    message: "Enter both cadmium and lead, or leave both empty",
    path: ["lab_pb"],
  });
export type SampleInput = z.infer<typeof sampleSchema>;

export const limitsSchema = z
  .object({
    ph_min: num("pH minimum", 0, 14),
    ph_max: num("pH maximum", 0, 14),
    turbidity_max: num("Turbidity limit", 0.1, 1000),
    tds_max: num("TDS limit", 1, 100_000),
    salinity_none: num("Salinity (no restriction)", 0.01, 50),
    salinity_severe: num("Salinity (severe)", 0.01, 50),
    sar_none: num("SAR (no restriction)", 0.1, 100),
    sar_severe: num("SAR (severe)", 0.1, 100),
    cd_max: num("Cadmium limit", 0.0001, 100),
    pb_max: num("Lead limit", 0.0001, 1000),
  })
  .refine((v) => v.ph_min < v.ph_max, { message: "pH minimum must be below pH maximum", path: ["ph_max"] })
  .refine((v) => v.salinity_none < v.salinity_severe, {
    message: "Severe salinity must be above the no-restriction level",
    path: ["salinity_severe"],
  })
  .refine((v) => v.sar_none < v.sar_severe, { message: "Severe SAR must be above the no-restriction level", path: ["sar_severe"] });
export type LimitsInput = z.infer<typeof limitsSchema>;

export function limitsToInput(L: RiskLimits): LimitsInput {
  return {
    ph_min: L.ph.min,
    ph_max: L.ph.max,
    turbidity_max: L.turbidity.max,
    tds_max: L.tds.max,
    salinity_none: L.salinity.none,
    salinity_severe: L.salinity.severe,
    sar_none: L.sar.none,
    sar_severe: L.sar.severe,
    cd_max: L.cd,
    pb_max: L.pb,
  };
}

export function inputToLimits(v: LimitsInput): RiskLimits {
  return rowToLimits({ id: 1, updated_at: "", ...v });
}

export const DEFAULT_LIMITS_INPUT = limitsToInput(LIMITS);

/** Turns zod issues into `{ field: message }` for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Insert payload for a validated sample form (time entered as UTC "YYYY-MM-DDTHH:mm"). */
export function sampleInputToRow(v: SampleInput, sortOrder = 0): TablesInsert<"water_samples"> {
  const iso = /Z|[+-]\d\d:?\d\d$/.test(v.collected_at) ? v.collected_at : `${v.collected_at}:00Z`;
  return { ...v, collected_at: new Date(iso).toISOString(), sort_order: sortOrder };
}

/** Form values (strings) for editing an existing factory row. */
export function factoryRowToForm(r: FactoryRow) {
  return { id: r.id, name: r.name, location: r.location, sector: r.sector, daily_capacity_m3: String(r.daily_capacity_m3) };
}

/** Form values (strings) for editing an existing sample row; time shown as UTC "YYYY-MM-DDTHH:mm". */
export function sampleRowToForm(r: SampleRow) {
  const d = new Date(r.collected_at);
  return {
    id: r.id,
    name: r.name,
    stage: r.stage,
    factory_id: r.factory_id,
    collected_at: Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16),
    ph: String(r.ph),
    turbidity: String(r.turbidity),
    tds: String(r.tds),
    temperature: String(r.temperature),
    ec: String(r.ec),
    sar: String(r.sar),
    lab_cd: r.lab_cd === null ? "" : String(r.lab_cd),
    lab_pb: r.lab_pb === null ? "" : String(r.lab_pb),
  };
}

export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  roles: AppRole[];
}

/** Joins profile rows with role rows; admins first, then by sign-up date. */
export function mergeUsersWithRoles(
  profiles: { id: string; email: string | null; display_name: string | null; created_at: string }[],
  roleRows: { user_id: string; role: string }[],
): AdminUser[] {
  return profiles
    .map((p) => ({
      id: p.id,
      email: p.email,
      displayName: p.display_name,
      createdAt: p.created_at,
      roles: roleRows.filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
    }))
    .sort((a, b) => Number(b.roles.includes("admin")) - Number(a.roles.includes("admin")) || a.createdAt.localeCompare(b.createdAt));
}

/** Admins can grant any role, but cannot take away their own admin role (prevents locking yourself out). */
export function canChangeRole(actorId: string, targetId: string, role: AppRole, granting: boolean) {
  return granting || !(actorId === targetId && role === "admin");
}

/** Plain-language message for a failed save. */
export function friendlyDbError(e: { code?: string; message: string }) {
  if (e.code === "23505") return "That ID is already used — pick a different one.";
  if (e.code === "23503") return "That factory doesn't exist anymore.";
  if (e.code === "23514") return "One of the values is outside the allowed range.";
  if (e.code === "42501") return "You don't have permission to do that.";
  return e.message;
}
