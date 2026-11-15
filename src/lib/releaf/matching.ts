import { assessRisk, evaluateSafetyGate, LIMITS, type RiskLimits } from "./risk";
import { isEstimated, isMeasured } from "./types";
import type { WaterSample } from "./types";

export type MatchStatus = "recommended" | "conditional" | "not-suitable";

interface Requirement {
  label: string;
  required: string;
  actual: string;
  pass: boolean;
  /** 0 = at limit, >0 = over limit (fraction) */
  overBy: number;
  /** fraction of limit used (for margin) */
  usage: number;
}

export interface ReuseApplication {
  id: string;
  name: string;
  category: "industrial" | "irrigation";
  description: string;
  limits: { phMin: number; phMax: number; turbidity: number; tds: number; ec?: number; sar?: number };
  needsLabMetals: boolean;
  /** Closed-loop industrial reuse replaces freshwater directly and is preferred. */
  priorityBonus: number;
  baseTreatment: string[];
  limitations: string[];
}

export const APPLICATIONS: ReuseApplication[] = [
  {
    id: "cooling",
    name: "Cooling Makeup Water",
    category: "industrial",
    description: "Replenish cooling-tower losses inside the factory loop.",
    limits: { phMin: 6.8, phMax: 8.5, turbidity: 5, tds: 1000, ec: 1500 },
    needsLabMetals: false,
    priorityBonus: 5,
    baseTreatment: ["Scale-inhibitor dosing", "Biocide control program"],
    limitations: ["Cycles of concentration limited by TDS", "Requires legionella monitoring"],
  },
  {
    id: "wash",
    name: "Process Wash Water",
    category: "industrial",
    description: "Floor, equipment and non-contact rinse water.",
    limits: { phMin: 6.5, phMax: 9, turbidity: 10, tds: 1500 },
    needsLabMetals: false,
    priorityBonus: 3,
    baseTreatment: ["Cartridge filtration", "Residual chlorine disinfection"],
    limitations: ["Not for product-contact or food-contact rinsing"],
  },
  {
    id: "landscaping",
    name: "Landscaping",
    category: "irrigation",
    description: "Drip irrigation of ornamental planting around the site.",
    limits: { phMin: 6.5, phMax: 8.4, turbidity: 10, tds: 1200, ec: 2000, sar: 6 },
    needsLabMetals: true,
    priorityBonus: 0,
    baseTreatment: ["UV disinfection", "Emitter-grade filtration (≤ 130 µm)"],
    limitations: ["Restricted public access during irrigation", "Subsurface drip preferred"],
  },
  {
    id: "plantation",
    name: "Tree Plantations",
    category: "irrigation",
    description: "Non-food drought-tolerant tree belts and windbreaks.",
    limits: { phMin: 6.5, phMax: 8.5, turbidity: 20, tds: 2000, ec: 3000, sar: 9 },
    needsLabMetals: true,
    priorityBonus: 0,
    baseTreatment: ["Disinfection", "Sand filtration"],
    limitations: ["Soil salinity must be monitored each season", "Non-edible species only until verified"],
  },
  {
    id: "green-spaces",
    name: "Industrial Green Spaces",
    category: "irrigation",
    description: "Lawns and shade trees within the industrial zone.",
    limits: { phMin: 6.5, phMax: 8.4, turbidity: 10, tds: 1500, ec: 2000, sar: 6 },
    needsLabMetals: true,
    priorityBonus: 0,
    baseTreatment: ["UV disinfection", "Sand filtration"],
    limitations: ["Worker exposure controls required", "No spray irrigation near walkways"],
  },
];

export interface MatchResult {
  app: ReuseApplication;
  score: number;
  status: MatchStatus;
  requirements: Requirement[];
  reason: string;
  treatment: string[];
  warnings: string[];
}

export interface WaterMatchOutcome {
  blocked: boolean;
  matches: MatchResult[];
}

function maxReq(label: string, limit: number, actual: number, unit: string): Requirement {
  const usage = actual / limit;
  return {
    label,
    required: `≤ ${limit.toLocaleString("en-US")} ${unit}`.trim(),
    actual: `${Number.isInteger(actual) ? actual.toLocaleString("en-US") : actual.toFixed(1)} ${unit}`.trim(),
    pass: actual <= limit,
    overBy: Math.max(0, usage - 1),
    usage,
  };
}

export function scoreApplication(sample: WaterSample, app: ReuseApplication): MatchResult {
  const L = app.limits;
  const reqs: Requirement[] = [];
  const phPass = sample.ph >= L.phMin && sample.ph <= L.phMax;
  const phDist = phPass ? 0 : Math.min(Math.abs(sample.ph - L.phMin), Math.abs(sample.ph - L.phMax));
  reqs.push({
    label: "pH",
    required: `${L.phMin} – ${L.phMax}`,
    actual: sample.ph.toFixed(1),
    pass: phPass,
    overBy: phDist / 2,
    usage: phPass ? 0.5 : 1 + phDist / 2,
  });
  reqs.push(maxReq("Turbidity", L.turbidity, sample.turbidity, "NTU"));
  reqs.push(maxReq("TDS", L.tds, Math.round(sample.tds), "mg/L"));
  if (L.ec) {
    const r = maxReq("EC", L.ec, Math.round(sample.ec), "µS/cm");
    if (isEstimated(sample, "ec")) r.actual += " (est.)";
    reqs.push(r);
  }
  if (L.sar) {
    if (isMeasured(sample, "sar")) reqs.push(maxReq("SAR", L.sar, sample.sar, ""));
    else reqs.push({ label: "SAR", required: `≤ ${L.sar}`, actual: "Not measured", pass: false, overBy: 0, usage: 1 });
  }

  let score = 92 + app.priorityBonus;
  for (const r of reqs) {
    if (!r.pass) score -= 12 + Math.min(30, r.overBy * 30);
    else if (r.usage > 0.6) score -= (r.usage - 0.6) * 20;
  }
  const warnings: string[] = [];
  if (L.sar && !isMeasured(sample, "sar")) warnings.push("SAR is not measured by the source hardware — lab analysis needed.");
  if (app.needsLabMetals && !sample.heavyMetals) {
    score = Math.min(score, 60);
    warnings.push("Irrigation use requires laboratory heavy-metal results (Cd, Pb) first.");
  }
  score = Math.round(Math.max(0, Math.min(99, score)));
  const failing = reqs.filter((r) => !r.pass && r.actual !== "Not measured");
  const unmeasuredReqs = reqs.filter((r) => r.actual === "Not measured");
  const status: MatchStatus =
    failing.length === 0 && unmeasuredReqs.length === 0 && score >= 75 ? "recommended" : score >= 45 ? "conditional" : "not-suitable";

  const treatment = [...app.baseTreatment];
  failing.forEach((r) => {
    if (r.label === "TDS" || r.label === "EC") treatment.push("Reverse osmosis / blending to lower dissolved salts");
    if (r.label === "Turbidity") treatment.push("Additional filtration to reduce suspended solids");
    if (r.label === "pH") treatment.push("pH correction (dosing)");
    if (r.label === "SAR") treatment.push("Gypsum amendment or blending to lower sodium hazard");
  });

  const missingNote = unmeasuredReqs.length ? ` ${unmeasuredReqs.map((r) => r.label).join(", ")} not measured — cannot be fully evaluated.` : "";
  const reason =
    (failing.length === 0
      ? app.category === "industrial"
        ? `All ${reqs.length - unmeasuredReqs.length} measured quality requirements met. Closed-loop reuse replaces freshwater intake directly inside the factory.`
        : `All ${reqs.length - unmeasuredReqs.length} measured quality requirements met for non-food irrigation, subject to lab confirmation.`
      : `${failing.map((r) => r.label).join(", ")} ${failing.length === 1 ? "exceeds" : "exceed"} the requirement for this use.`) + missingNote;

  warnings.push(...app.limitations);
  return { app, score, status, requirements: reqs, reason, treatment: Array.from(new Set(treatment)), warnings };
}

/** Ranks reuse options by water-quality fit. Returns no options when the Safety Gate restricts the sample. */
export function matchWater(sample: WaterSample, limits: RiskLimits = LIMITS): WaterMatchOutcome {
  const gate = evaluateSafetyGate(assessRisk(sample, limits));
  if (gate.status === "restricted") return { blocked: true, matches: [] };
  const matches = APPLICATIONS.map((a) => scoreApplication(sample, a)).sort((a, b) => b.score - a.score);
  return { blocked: false, matches };
}
