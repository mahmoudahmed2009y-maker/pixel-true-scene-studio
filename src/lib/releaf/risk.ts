import { isEstimated, isMeasured } from "./types";
import type { FactorStatus, GateResult, RiskFactor, RiskLevel, RiskResult, WaterSample } from "./types";

/** Score bands: 0–39 low, 40–69 medium, 70–100 high. */
export const RISK_BANDS = { mediumFrom: 40, highFrom: 70 } as const;

/** Reference limits used by the demonstration model (based on common irrigation guidance, not certified). */
export interface RiskLimits {
  ph: { min: number; max: number };
  turbidity: { max: number };
  tds: { max: number };
  salinity: { none: number; severe: number };
  sar: { none: number; severe: number };
  cd: number;
  pb: number;
}

/** Default limits. Admins can override them; the score bands and Safety Gate rule stay fixed. */
export const LIMITS: RiskLimits = {
  ph: { min: 6.5, max: 8.5 },
  turbidity: { max: 5 },
  tds: { max: 1000 },
  salinity: { none: 0.7, severe: 3 },
  sar: { none: 3, severe: 9 },
  cd: 0.01,
  pb: 5.0,
};

const WEIGHTS = { ph: 0.15, turbidity: 0.2, tds: 0.2, salinity: 0.15, sar: 0.1, metals: 0.2 } as const;
/** Added when heavy-metal lab data is missing: sensors can't see Cd or Pb, so uncertainty raises risk. */
export const MISSING_LAB_PENALTY = 8;
/** Added per field parameter the source hardware cannot measure (e.g. SAR on the ESP32 rig). */
export const UNMEASURED_PENALTY = 4;

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

export function riskLevelFor(score: number): RiskLevel {
  if (score >= RISK_BANDS.highFrom) return "high";
  if (score >= RISK_BANDS.mediumFrom) return "medium";
  return "low";
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
};

function statusFor(sub: number): FactorStatus {
  if (sub >= 50) return "exceeds";
  if (sub >= 15) return "watch";
  return "ok";
}

export function phSubScore(ph: number, L: RiskLimits = LIMITS) {
  const dist = ph < L.ph.min ? L.ph.min - ph : ph > L.ph.max ? ph - L.ph.max : 0;
  return clamp(dist * 35);
}
/** Ramps scale with the limit so the default limits reproduce the original curve exactly. */
export function turbiditySubScore(t: number, L: RiskLimits = LIMITS) {
  const max = L.turbidity.max;
  if (t <= max) return 0;
  if (t <= max * 10) return ((t - max) / (max * 9)) * 50;
  return clamp(50 + ((t - max * 10) / (max * 30)) * 50);
}
export function tdsSubScore(tds: number, L: RiskLimits = LIMITS) {
  const max = L.tds.max;
  if (tds <= max) return 0;
  if (tds <= max * 2) return ((tds - max) / max) * 50;
  return clamp(50 + ((tds - max * 2) / (max * 3)) * 50);
}
export function salinitySubScore(ecMicroS: number, L: RiskLimits = LIMITS) {
  const ec = ecMicroS / 1000;
  const { none, severe } = L.salinity;
  if (ec <= none) return 0;
  if (ec <= severe) return ((ec - none) / (severe - none)) * 50;
  return clamp(50 + ((ec - severe) / 5) * 50);
}
export function sarSubScore(sar: number, L: RiskLimits = LIMITS) {
  const { none, severe } = L.sar;
  if (sar <= none) return 0;
  if (sar <= severe) return ((sar - none) / (severe - none)) * 50;
  return clamp(50 + ((sar - severe) / severe) * 50);
}
/** Ratio of the worst metal to its limit. >1 means a limit is exceeded. */
export function metalRatio(cd: number, pb: number, L: RiskLimits = LIMITS) {
  return Math.max(cd / L.cd, pb / L.pb);
}
function metalSubScore(ratio: number) {
  if (ratio <= 0.5) return ratio * 40;
  if (ratio <= 1) return 20 + (ratio - 0.5) * 100;
  return 100;
}

const fmtNum = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 3 });

export function assessRisk(s: WaterSample, L: RiskLimits = LIMITS): RiskResult {
  const ecDs = s.ec / 1000;
  const factors: RiskFactor[] = [];

  const ph = phSubScore(s.ph, L);
  factors.push({
    key: "ph",
    label: "pH",
    value: s.ph.toFixed(1),
    reference: `${fmtNum(L.ph.min)} – ${fmtNum(L.ph.max)}`,
    subScore: ph,
    weight: WEIGHTS.ph,
    status: statusFor(ph),
    explanation:
      ph === 0
        ? "pH sits inside the neutral reference band."
        : s.ph < L.ph.min
          ? `Acidic water (pH ${s.ph.toFixed(1)}) can corrode pipework and mobilise metals in soil.`
          : `Alkaline water (pH ${s.ph.toFixed(1)}) increases scaling and can reduce nutrient uptake.`,
  });

  const tu = turbiditySubScore(s.turbidity, L);
  factors.push({
    key: "turbidity",
    label: "Turbidity",
    value: `${s.turbidity.toFixed(1)} NTU`,
    reference: `≤ ${fmtNum(L.turbidity.max)} NTU`,
    subScore: tu,
    weight: WEIGHTS.turbidity,
    status: statusFor(tu),
    explanation:
      tu === 0
        ? "Low suspended solids — suitable for filtration-sensitive uses."
        : `Suspended solids at ${s.turbidity.toFixed(0)} NTU can clog emitters and shield pathogens from disinfection.`,
  });

  const td = tdsSubScore(s.tds, L);
  factors.push({
    key: "tds",
    label: "TDS",
    value: `${Math.round(s.tds)} mg/L`,
    reference: `≤ ${fmtNum(L.tds.max)} mg/L`,
    subScore: td,
    weight: WEIGHTS.tds,
    status: statusFor(td),
    explanation:
      td === 0
        ? "Dissolved solids are within the reference range."
        : `Dissolved solids at ${Math.round(s.tds)} mg/L raise scaling risk and osmotic stress on plants.`,
  });

  const sa = salinitySubScore(s.ec, L);
  factors.push({
    key: "salinity",
    label: "Salinity (ECw)",
    value: `${ecDs.toFixed(2)} dS/m`,
    reference: `< ${fmtNum(L.salinity.none)} none · > ${L.salinity.severe.toFixed(1)} severe`,
    subScore: sa,
    weight: WEIGHTS.salinity,
    status: statusFor(sa),
    explanation:
      (isEstimated(s, "ec") ? "Estimated from TDS (EC ≈ TDS ÷ 0.64), not measured. " : "") +
      (sa === 0
        ? "No salinity restriction expected."
        : ecDs > L.salinity.severe
          ? `ECw of ${ecDs.toFixed(1)} dS/m is in the severe restriction range for irrigation.`
          : `ECw of ${ecDs.toFixed(1)} dS/m suggests slight-to-moderate restriction; choose salt-tolerant species.`),
  });

  if (isMeasured(s, "sar")) {
    const sr = sarSubScore(s.sar, L);
    factors.push({
      key: "sar",
      label: "SAR",
      value: s.sar.toFixed(1),
      reference: `< ${fmtNum(L.sar.none)} none · > ${fmtNum(L.sar.severe)} severe`,
      subScore: sr,
      weight: WEIGHTS.sar,
      status: statusFor(sr),
      explanation:
        sr === 0
          ? "Sodium hazard is low; soil structure should be unaffected."
          : `SAR of ${s.sar.toFixed(1)} can degrade soil structure and infiltration over time.`,
    });
  } else {
    factors.push({
      key: "sar",
      label: "SAR",
      value: "Not measured",
      reference: `< ${fmtNum(L.sar.none)} none · > ${fmtNum(L.sar.severe)} severe`,
      subScore: null,
      weight: WEIGHTS.sar,
      status: "missing",
      explanation: "The source hardware has no sodium measurement. SAR requires laboratory analysis.",
    });
  }

  let heavyMetalBreach = false;
  let metals: number | null = null;
  if (s.heavyMetals) {
    const ratio = metalRatio(s.heavyMetals.cd, s.heavyMetals.pb, L);
    metals = metalSubScore(ratio);
    heavyMetalBreach = ratio > 1;
    factors.push({
      key: "metals",
      label: "Heavy metals (Cd, Pb)",
      value: `Cd ${s.heavyMetals.cd.toFixed(3)} · Pb ${s.heavyMetals.pb.toFixed(2)} mg/L`,
      reference: `Cd ≤ ${fmtNum(L.cd)} · Pb ≤ ${L.pb.toFixed(1)} mg/L`,
      subScore: metals,
      weight: WEIGHTS.metals,
      status: heavyMetalBreach ? "exceeds" : statusFor(metals),
      explanation: heavyMetalBreach
        ? "At least one heavy metal exceeds its reference limit. This alone blocks reuse."
        : "Illustrative lab entry is below reference limits. Verify with an accredited laboratory.",
    });
  } else {
    factors.push({
      key: "metals",
      label: "Heavy metals (Cd, Pb)",
      value: "No lab data",
      reference: `Cd ≤ ${fmtNum(L.cd)} · Pb ≤ ${L.pb.toFixed(1)} mg/L`,
      subScore: null,
      weight: WEIGHTS.metals,
      status: "missing",
      explanation:
        "pH, turbidity and TDS sensors cannot detect cadmium or lead. Laboratory testing is required.",
    });
  }

  const scored = factors.filter((f) => f.subScore !== null) as (RiskFactor & { subScore: number })[];
  const totalWeight = scored.reduce((a, f) => a + f.weight, 0);
  const weighted = scored.reduce((a, f) => a + f.weight * f.subScore, 0) / totalWeight;
  const worst = Math.max(...scored.map((f) => f.subScore));
  const labDataMissing = metals === null;

  const unmeasuredCount = s.unmeasured?.filter((k) => k === "sar").length ?? 0;
  let score =
    Math.max(weighted, worst * 0.8) + (labDataMissing ? MISSING_LAB_PENALTY : 0) + unmeasuredCount * UNMEASURED_PENALTY;
  if (heavyMetalBreach) score = Math.max(score, 85);
  score = Math.round(clamp(score));

  const level = riskLevelFor(score);
  const reasons: string[] = [];
  const top = [...scored].sort((a, b) => b.subScore - a.subScore).filter((f) => f.subScore >= 15);
  if (heavyMetalBreach) reasons.push("Heavy-metal concentration exceeds the reference limit.");
  top.slice(0, 3).forEach((f) => {
    if (f.key !== "metals") reasons.push(`${f.label} ${f.value} is outside the reference range (${f.reference}).`);
  });
  if (labDataMissing) reasons.push(`No heavy-metal lab data: +${MISSING_LAB_PENALTY} uncertainty added.`);
  if (unmeasuredCount) reasons.push(`SAR not measured by the source hardware: +${UNMEASURED_PENALTY} uncertainty added.`);
  if (reasons.length === 0) reasons.push("All measured parameters are inside the demonstration reference ranges.");

  return { score, level, factors, labDataMissing, heavyMetalBreach, reasons };
}

export function evaluateSafetyGate(risk: RiskResult): GateResult {
  const warnings: string[] = [
    "Simulated readings cannot prove water is safe for irrigation or industrial use.",
  ];
  if (risk.labDataMissing) {
    warnings.unshift(
      "Heavy metals (Cd, Pb) were not measured. Basic sensors cannot detect them — send a sample for laboratory testing.",
    );
  }

  if (risk.level === "high" || risk.heavyMetalBreach) {
    return {
      status: "restricted",
      title: "Water Reuse Restricted",
      summary: risk.heavyMetalBreach
        ? "Heavy-metal levels exceed reference limits. Reuse recommendations are blocked."
        : `Risk score ${risk.score}/100 is in the high-risk band. Reuse recommendations are blocked.`,
      nextSteps: [
        "Route the stream back to treatment (neutralisation, coagulation–flocculation, filtration).",
        "Collect a sample for accredited laboratory analysis, including Cd and Pb.",
        "Re-test after treatment and re-run the risk assessment.",
        "An operator must review and sign off before any change of use.",
      ],
      warnings,
    };
  }

  return {
    status: "eligible",
    title: "Eligible for Further Evaluation",
    summary:
      risk.level === "medium"
        ? "Passes the demonstration checks with caution. Additional treatment is likely needed for most uses."
        : "Passes the demonstration checks. Potential reuse options can be explored.",
    nextSteps: [
      risk.labDataMissing
        ? "Confirm heavy-metal levels with an accredited laboratory before any reuse."
        : "Confirm the illustrative lab values with an accredited laboratory.",
      "Review potential reuse options in Water Matching.",
      "Operator review and approval remain required for every reuse decision.",
    ],
    warnings,
  };
}
