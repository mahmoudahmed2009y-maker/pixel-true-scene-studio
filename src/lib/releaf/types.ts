export type RiskLevel = "low" | "medium" | "high";

/** Where a value came from. Nothing in this MVP is a verified lab result or a connected sensor. */
export type DataSource = "simulated-sensor" | "illustrative-lab";

export interface HeavyMetals {
  /** Cadmium, mg/L */
  cd: number;
  /** Lead, mg/L */
  pb: number;
  source: "illustrative-lab";
}

export interface WaterSample {
  id: string;
  name: string;
  stage: string;
  factoryId: string;
  collectedAt: string;
  ph: number;
  /** NTU */
  turbidity: number;
  /** mg/L */
  tds: number;
  /** °C */
  temperature: number;
  /** Electrical conductivity, µS/cm */
  ec: number;
  /** Sodium adsorption ratio */
  sar: number;
  /** null = no laboratory data available */
  heavyMetals: HeavyMetals | null;
  /** Origin of the readings. Defaults to the built-in demo dataset. */
  source?: SampleSource;
  /** Parameters the source hardware does not measure (their numeric fields are placeholders). */
  unmeasured?: UnmeasuredParam[];
  /** Parameters derived from other readings rather than measured directly. */
  estimated?: EstimatedParam[];
}

export type SampleSource = "demo-dataset" | "wokwi-simulation";
export type UnmeasuredParam = "temperature" | "sar";
export type EstimatedParam = "ec";

export function isMeasured(s: WaterSample, key: UnmeasuredParam) {
  return !s.unmeasured?.includes(key);
}
export function isEstimated(s: WaterSample, key: EstimatedParam) {
  return !!s.estimated?.includes(key);
}

export type FactorKey = "ph" | "turbidity" | "tds" | "salinity" | "sar" | "metals";
export type FactorStatus = "ok" | "watch" | "exceeds" | "missing";

export interface RiskFactor {
  key: FactorKey;
  label: string;
  value: string;
  reference: string;
  subScore: number | null;
  weight: number;
  status: FactorStatus;
  explanation: string;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  labDataMissing: boolean;
  heavyMetalBreach: boolean;
  reasons: string[];
}

export type GateStatus = "restricted" | "eligible";

export interface GateResult {
  status: GateStatus;
  title: string;
  summary: string;
  nextSteps: string[];
  warnings: string[];
}

export function fmtSar(s: WaterSample) {
  return isMeasured(s, "sar") ? s.sar.toFixed(1) : "Not measured";
}
export function fmtTemperature(s: WaterSample) {
  return isMeasured(s, "temperature") ? `${s.temperature} °C` : "Not measured";
}
export function fmtEc(s: WaterSample) {
  return `${s.ec.toLocaleString("en-US")} µS/cm${isEstimated(s, "ec") ? " (estimated from TDS)" : ""}`;
}
