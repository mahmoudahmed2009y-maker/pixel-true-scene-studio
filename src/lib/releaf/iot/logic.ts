import { adcToPh, adcToTds, adcToTurbidity, WOKWI_THRESHOLDS as T } from "./hardware";

export interface AdcReading {
  ph: number;
  tds: number;
  turbidity: number;
}

export interface SensorValues {
  ph: number;
  tds: number;
  turbidity: number;
}

export interface ButtonState {
  /** GPIO 15 pressed */
  treatment: boolean;
  /** GPIO 12 pressed */
  emergency: boolean;
}

export type FirmwareMode = "emergency" | "treatment" | "safe" | "danger";

export interface Condition {
  id: "ph-min" | "ph-max" | "tds" | "turbidity";
  label: string;
  rule: string;
  actual: string;
  pass: boolean;
  explanation: string;
}

export interface FirmwareState {
  values: SensorValues;
  safe: boolean;
  conditions: Condition[];
  mode: FirmwareMode;
  redLed: boolean;
  greenLed: boolean;
  buzzer: boolean;
  /** Exact LCD text written by main.py (16×2) */
  lcd: [string, string];
  /** RELIEF UI status label */
  statusLabel: string;
}

export function convert(adc: AdcReading): SensorValues {
  return { ph: adcToPh(adc.ph), tds: adcToTds(adc.tds), turbidity: adcToTurbidity(adc.turbidity) };
}

export function evaluateConditions(v: SensorValues): Condition[] {
  const ph = v.ph.toFixed(1);
  return [
    {
      id: "ph-min",
      label: "pH above minimum",
      rule: `pH > ${T.phMin}`,
      actual: ph,
      pass: v.ph > T.phMin,
      explanation: v.ph > T.phMin ? "Not acidic beyond the demo limit." : "Too acidic for the demo limit.",
    },
    {
      id: "ph-max",
      label: "pH below maximum",
      rule: `pH < ${T.phMax}`,
      actual: ph,
      pass: v.ph < T.phMax,
      explanation: v.ph < T.phMax ? "Not alkaline beyond the demo limit." : "Too alkaline for the demo limit.",
    },
    {
      id: "tds",
      label: "Dissolved solids",
      rule: `TDS < ${T.tdsMax} ppm`,
      actual: `${Math.trunc(v.tds)} ppm`,
      pass: v.tds < T.tdsMax,
      explanation: v.tds < T.tdsMax ? "Dissolved solids under the demo threshold." : "Too many dissolved solids for the demo threshold.",
    },
    {
      id: "turbidity",
      label: "Turbidity",
      rule: `Turbidity < ${T.turbidityMax}`,
      actual: `${Math.trunc(v.turbidity)}`,
      pass: v.turbidity < T.turbidityMax,
      explanation: v.turbidity < T.turbidityMax ? "Water is clear enough for the demo threshold." : "Water is too cloudy for the demo threshold.",
    },
  ];
}

/** MicroPython round(x, 1) → string, e.g. 7 → "7.0" */
const py1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

/**
 * Re-implementation of the main.py loop body. Priority matches the firmware:
 * emergency button (GPIO 12) > treatment button (GPIO 15) > safe / danger check.
 * `counter` is the loop counter after increment; the LCD's first line alternates TDS / TB every 5 loops.
 */
export function evaluateFirmware(v: SensorValues, buttons: ButtonState, counter = 1): FirmwareState {
  const conditions = evaluateConditions(v);
  const safe = conditions.every((c) => c.pass);

  if (buttons.emergency) {
    return { values: v, safe, conditions, mode: "emergency", redLed: true, greenLed: false, buzzer: true, lcd: ["BATTERY LEAK!", "EVACUATE!"], statusLabel: "EMERGENCY ALERT" };
  }
  if (buttons.treatment) {
    return { values: v, safe, conditions, mode: "treatment", redLed: true, greenLed: false, buzzer: false, lcd: ["TREATING...", "PLEASE WAIT"], statusLabel: "TREATMENT IN PROGRESS" };
  }
  const line1 = counter % 10 < 5 ? `pH:${py1(v.ph)} TDS:${Math.trunc(v.tds)}` : `pH:${py1(v.ph)} TB:${Math.trunc(v.turbidity)}`;
  return safe
    ? { values: v, safe, conditions, mode: "safe", redLed: false, greenLed: true, buzzer: false, lcd: [line1, "SAFE - OPEN"], statusLabel: "SAFE - OPEN" }
    : { values: v, safe, conditions, mode: "danger", redLed: true, greenLed: false, buzzer: true, lcd: [line1, "DANGER-CLOSED"], statusLabel: "DANGER - CLOSED" };
}
