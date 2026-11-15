import type { WaterSample } from "./types";

export interface Factory {
  id: string;
  name: string;
  location: string;
  sector: string;
  dailyCapacityM3: number;
}

export const FACTORIES: Factory[] = [
  { id: "delta-textiles", name: "Delta Textiles", location: "10th of Ramadan City", sector: "Textile dyeing", dailyCapacityM3: 1800 },
  { id: "nile-foods", name: "Nile Food Processing", location: "Sadat City", sector: "Food & beverage", dailyCapacityM3: 1200 },
  { id: "suez-metals", name: "Suez Metal Finishing", location: "Ain Sokhna", sector: "Metal finishing", dailyCapacityM3: 950 },
];

export type DateRange = "7d" | "30d" | "90d";
export const DATE_RANGES: { id: DateRange; label: string; days: number }[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
];

/** Reference date for the simulated dataset (keeps SSR and browser output identical). */
export const DATA_REFERENCE_DATE = new Date("2026-11-12T08:00:00Z");

export const SAMPLES: WaterSample[] = [
  {
    id: "S-101",
    name: "Raw influent — dye line",
    stage: "Before treatment",
    factoryId: "delta-textiles",
    collectedAt: "2026-11-12 06:40",
    ph: 4.6,
    turbidity: 145,
    tds: 4200,
    temperature: 34.5,
    ec: 6500,
    sar: 11.2,
    heavyMetals: { cd: 0.034, pb: 7.8, source: "illustrative-lab" },
  },
  {
    id: "S-102",
    name: "After primary clarifier",
    stage: "Partial treatment",
    factoryId: "delta-textiles",
    collectedAt: "2026-11-12 07:10",
    ph: 6.2,
    turbidity: 28,
    tds: 2100,
    temperature: 31.2,
    ec: 3300,
    sar: 6.5,
    heavyMetals: null,
  },
  {
    id: "S-103",
    name: "After tertiary treatment",
    stage: "Treated · lab entry",
    factoryId: "delta-textiles",
    collectedAt: "2026-11-12 07:45",
    ph: 7.4,
    turbidity: 1.8,
    tds: 820,
    temperature: 27.6,
    ec: 1280,
    sar: 2.4,
    heavyMetals: { cd: 0.004, pb: 0.6, source: "illustrative-lab" },
  },
  {
    id: "S-104",
    name: "Treated storage tank",
    stage: "Treated · no lab data",
    factoryId: "delta-textiles",
    collectedAt: "2026-11-12 07:55",
    ph: 7.2,
    turbidity: 3.1,
    tds: 950,
    temperature: 28.1,
    ec: 1450,
    sar: 3.4,
    heavyMetals: null,
  },
];

export const DEMO_BEFORE_ID = "S-101";
export const DEMO_AFTER_ID = "S-103";

export function getSample(id: string) {
  return SAMPLES.find((s) => s.id === id) ?? SAMPLES[0]!;
}

/** Deterministic PRNG so every render shows the same simulated values. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export interface DailyPoint {
  date: string;
  processed: number;
  reused: number;
  freshwater: number;
  qualityIndex: number;
  ph: number;
  turbidity: number;
  tds: number;
  temperature: number;
  ec: number;
}

export function dailySeries(factoryOrId: Factory | string, range: DateRange): DailyPoint[] {
  const factory =
    typeof factoryOrId === "string" ? (FACTORIES.find((f) => f.id === factoryOrId) ?? FACTORIES[0]!) : factoryOrId;
  const factoryId = factory.id;
  const days = DATE_RANGES.find((r) => r.id === range)!.days;
  const rnd = seeded(hash(factoryId + range));
  const out: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(DATA_REFERENCE_DATE.getTime() - i * 86400000);
    const progress = (days - i) / days;
    const processed = Math.round(factory.dailyCapacityM3 * (0.78 + rnd() * 0.18));
    const reuseRate = 0.52 + progress * 0.14 + rnd() * 0.06;
    const reused = Math.round(processed * reuseRate);
    out.push({
      date: fmtDay(d),
      processed,
      reused,
      freshwater: Math.round(processed * (1.08 - reuseRate) + rnd() * 60),
      qualityIndex: Math.round(68 + progress * 18 + (rnd() - 0.5) * 8),
      ph: +(7.1 + (rnd() - 0.5) * 0.8).toFixed(2),
      turbidity: +(2.4 + rnd() * 3.4).toFixed(1),
      tds: Math.round(780 + rnd() * 320),
      temperature: +(26.5 + rnd() * 3).toFixed(1),
      ec: Math.round(1200 + rnd() * 450),
    });
  }
  return out;
}

export function summarize(series: DailyPoint[]) {
  const processed = series.reduce((a, p) => a + p.processed, 0);
  const reused = series.reduce((a, p) => a + p.reused, 0);
  return {
    processedM3: processed,
    reusedM3: reused,
    reusePct: Math.round((reused / processed) * 100),
    // ~0.15 m³ per tree per day in establishment phase (illustrative)
    treesSupported: Math.round(reused / series.length / 0.15 / 10) * 10,
  };
}

export const REUSE_DISTRIBUTION = [
  { name: "Cooling makeup", value: 38 },
  { name: "Process wash", value: 27 },
  { name: "Tree plantations", value: 18 },
  { name: "Landscaping", value: 11 },
  { name: "Green spaces", value: 6 },
];

export type AlertSeverity = "high" | "medium" | "info";
export const ALERTS: { id: string; severity: AlertSeverity; title: string; detail: string; time: string }[] = [
  { id: "a1", severity: "high", title: "Safety Gate blocked S-101", detail: "Raw influent: pH 4.6, Cd above reference limit", time: "06:42" },
  { id: "a2", severity: "medium", title: "Lab data missing for S-104", detail: "Heavy metals not measured — schedule lab test", time: "07:56" },
  { id: "a3", severity: "medium", title: "TDS rising at clarifier", detail: "2,100 mg/L, +9% vs 24h average", time: "07:12" },
  { id: "a4", severity: "info", title: "Operator review recorded", detail: "S-103 cleared for cooling-tower evaluation", time: "Yesterday" },
];

export const SENSORS = [
  { id: "PH-01", label: "pH probe", location: "Inlet", status: "online" as const },
  { id: "TU-01", label: "Turbidimeter", location: "Clarifier out", status: "online" as const },
  { id: "TDS-02", label: "TDS / EC cell", location: "Tertiary out", status: "online" as const },
  { id: "TMP-01", label: "Temperature", location: "Storage tank", status: "calibration" as const },
];

export const IMPACT = {
  litersReused: 412_600_000,
  freshwaterSavedLiters: 371_300_000,
  treesSupported: 18_400,
  co2TonnesPerYear: 236,
  reuseEfficiency: 68,
  sustainabilityScore: 82,
  monthly: [
    { month: "Jun", reused: 41, trees: 9.6, co2: 118 },
    { month: "Jul", reused: 48, trees: 11.2, co2: 141 },
    { month: "Aug", reused: 55, trees: 12.9, co2: 162 },
    { month: "Sep", reused: 61, trees: 14.8, co2: 188 },
    { month: "Oct", reused: 66, trees: 16.7, co2: 214 },
    { month: "Nov", reused: 72, trees: 18.4, co2: 236 },
  ],
};
