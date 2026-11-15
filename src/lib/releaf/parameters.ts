import type { WaterSample } from "./types";

export type ParamKey = "ph" | "turbidity" | "tds" | "temperature" | "ec";

export interface ParamConfig {
  key: ParamKey;
  label: string;
  unit: string;
  domain: [number, number];
  normal: [number, number];
  warning: [number, number];
  decimals: number;
  sensorId: string;
}

export const PARAMS: ParamConfig[] = [
  { key: "ph", label: "pH", unit: "", domain: [0, 14], normal: [6.5, 8.5], warning: [6, 9], decimals: 1, sensorId: "PH-01" },
  { key: "turbidity", label: "Turbidity", unit: "NTU", domain: [0, 200], normal: [0, 5], warning: [0, 25], decimals: 1, sensorId: "TU-01" },
  { key: "tds", label: "TDS", unit: "mg/L", domain: [0, 5000], normal: [0, 1000], warning: [0, 2000], decimals: 0, sensorId: "TDS-02" },
  { key: "temperature", label: "Temperature", unit: "°C", domain: [0, 50], normal: [15, 35], warning: [10, 40], decimals: 1, sensorId: "TMP-01" },
  { key: "ec", label: "Electrical conductivity", unit: "µS/cm", domain: [0, 8000], normal: [0, 1500], warning: [0, 3000], decimals: 0, sensorId: "TDS-02" },
];

export type ParamState = "normal" | "warning" | "critical";

export function paramState(cfg: ParamConfig, v: number): ParamState {
  if (v >= cfg.normal[0] && v <= cfg.normal[1]) return "normal";
  if (v >= cfg.warning[0] && v <= cfg.warning[1]) return "warning";
  return "critical";
}

export function sampleValue(s: WaterSample, key: ParamKey) {
  return s[key];
}
