import { z } from "zod";
import type { WaterSample } from "../types";

/**
 * Telemetry integration layer.
 *
 * Today only the demo source exists: it replays clearly-labelled demo ADC readings through the
 * firmware formulas. The Wokwi simulation runs inside Wokwi and does not stream data to RELEAF.
 * MQTT and HTTP adapters are declared as contracts only — no broker, endpoint or credentials exist.
 */

export type IotDataSource = "wokwi-demo-readings" | "wokwi-telemetry" | "esp32-hardware";
export type SimulationStatus = "demo" | "live" | "not-connected";
export type IotRiskStatus = "safe" | "danger" | "treatment" | "emergency";

/** Unified water sample shared from the IoT layer to the rest of RELEAF. */
export interface IotWaterSample {
  sampleId: string;
  timestamp: string;
  ph: number;
  /** ppm */
  tds: number;
  /** 0–100 simulation scale (uncalibrated) */
  turbidity: number;
  dataSource: IotDataSource;
  simulationStatus: SimulationStatus;
  riskStatus: IotRiskStatus;
}

export const DATA_SOURCE_LABEL: Record<IotDataSource, string> = {
  "wokwi-demo-readings": "Wokwi Simulation · demo readings",
  "wokwi-telemetry": "Wokwi Simulation · live telemetry",
  "esp32-hardware": "ESP32 hardware",
};

export type AdapterKind = "demo" | "mqtt" | "http";
export type AdapterStatus = "active" | "not-configured";

export interface TelemetryAdapterInfo {
  kind: AdapterKind;
  label: string;
  status: AdapterStatus;
  description: string;
  requires: string[];
}

export const ADAPTERS: TelemetryAdapterInfo[] = [
  {
    kind: "demo",
    label: "Demo readings",
    status: "active",
    description: "Labelled demo ADC values converted with the firmware formulas, in the browser.",
    requires: [],
  },
  {
    kind: "mqtt",
    label: "MQTT (future)",
    status: "not-configured",
    description: "ESP32 publishes JSON telemetry; RELEAF subscribes through a server-side bridge.",
    requires: ["MQTT broker you control", "Device topic", "Credentials stored as server secrets", "Firmware publish step added to main.py"],
  },
  {
    kind: "http",
    label: "HTTP ingest (future)",
    status: "not-configured",
    description: "ESP32 POSTs JSON telemetry to a RELEAF ingest route that verifies a device key.",
    requires: ["Ingest route with device-key verification", "Per-device secret", "Firmware HTTP POST step added to main.py"],
  },
];

/** Expected payload from a future ESP32 publisher. Not produced by the current Wokwi code. */
export const Esp32PayloadSchema = z.object({
  device: z.string().min(1).max(64),
  ts: z.string().datetime().optional(),
  ph: z.number().min(0).max(14),
  tds: z.number().min(0).max(10000),
  turbidity: z.number().min(0).max(100),
  mode: z.enum(["safe", "danger", "treatment", "emergency"]).optional(),
});
export type Esp32Payload = z.infer<typeof Esp32PayloadSchema>;

export const PAYLOAD_EXAMPLE: Esp32Payload = {
  device: "esp32-releaf-01",
  ts: "2026-11-13T08:00:00Z",
  ph: 7.2,
  tds: 640,
  turbidity: 18,
  mode: "safe",
};

/** Validates a future telemetry payload. Returns null for anything malformed. */
export function parseEsp32Payload(input: unknown, source: IotDataSource): IotWaterSample | null {
  const r = Esp32PayloadSchema.safeParse(input);
  if (!r.success) return null;
  const p = r.data;
  return {
    sampleId: `IOT-${p.device}`,
    timestamp: p.ts ?? new Date().toISOString(),
    ph: p.ph,
    tds: p.tds,
    turbidity: p.turbidity,
    dataSource: source,
    simulationStatus: source === "esp32-hardware" ? "live" : source === "wokwi-telemetry" ? "live" : "demo",
    riskStatus: p.mode ?? "danger",
  };
}

export const IOT_SAMPLE_ID = "IOT-01";

/** EC is not measured by the rig; RELEAF estimates it from TDS with a common 0.64 factor. */
export const TDS_TO_EC = 1 / 0.64;

/**
 * Maps an IoT reading into RELEAF's sample model. The 0–100 turbidity scale is treated as NTU,
 * which is conservative (higher risk). Temperature and SAR are not measured; EC is estimated.
 */
export function iotToWaterSample(s: IotWaterSample): WaterSample {
  return {
    id: IOT_SAMPLE_ID,
    name: "ESP32 rig — Wokwi demo reading",
    stage: s.dataSource === "esp32-hardware" ? "ESP32 hardware" : "Wokwi simulation · demo",
    factoryId: "delta-textiles",
    collectedAt: s.timestamp,
    ph: +s.ph.toFixed(2),
    turbidity: +s.turbidity.toFixed(1),
    tds: Math.round(s.tds),
    temperature: 0,
    ec: Math.round(s.tds * TDS_TO_EC),
    sar: 0,
    heavyMetals: null,
    source: "wokwi-simulation",
    unmeasured: ["temperature", "sar"],
    estimated: ["ec"],
  };
}

/** Default reading shown before the IoT page shares one (pots at mid-clean positions). */
export const DEFAULT_IOT_SAMPLE: IotWaterSample = {
  sampleId: IOT_SAMPLE_ID,
  timestamp: "2026-11-13 08:00",
  ph: 7.2,
  tds: 640,
  turbidity: 18,
  dataSource: "wokwi-demo-readings",
  simulationStatus: "demo",
  riskStatus: "safe",
};
