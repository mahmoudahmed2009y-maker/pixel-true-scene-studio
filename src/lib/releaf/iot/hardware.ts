/**
 * Mirror of the Wokwi project https://wokwi.com/projects/480439719352496129
 * (diagram.json + main.py, MicroPython on ESP32). Keep in sync with the original project —
 * do not add parts that are not in the diagram.
 */

export const WOKWI_PROJECT_ID = "480439719352496129";
export const WOKWI_PROJECT_URL = `https://wokwi.com/projects/${WOKWI_PROJECT_ID}`;

export const BOARD = {
  name: "ESP32 DevKit",
  wokwiPart: "board-esp32-devkit-c-v4",
  firmware: "MicroPython (main.py)",
  loopMs: 500,
};

export type ComponentKind = "sensor" | "display" | "indicator" | "button";

export interface HardwareComponent {
  id: "ph" | "tds" | "turbidity" | "lcd" | "red" | "green" | "buzzer" | "treatment" | "emergency";
  label: string;
  kind: ComponentKind;
  /** Part as wired in the Wokwi diagram */
  wokwiPart: string;
  wokwiId: string;
  pins: string;
  note: string;
}

export const COMPONENTS: HardwareComponent[] = [
  { id: "ph", label: "pH sensor", kind: "sensor", wokwiPart: "wokwi-potentiometer", wokwiId: "pot3", pins: "GPIO 34 (ADC)", note: "Simulated by a potentiometer" },
  { id: "tds", label: "TDS sensor", kind: "sensor", wokwiPart: "wokwi-potentiometer", wokwiId: "pot2", pins: "GPIO 35 (ADC)", note: "Simulated by a potentiometer" },
  { id: "turbidity", label: "Turbidity sensor", kind: "sensor", wokwiPart: "wokwi-potentiometer", wokwiId: "pot1", pins: "GPIO 32 (ADC)", note: "Simulated by a potentiometer" },
  { id: "lcd", label: "I2C LCD 16×2", kind: "display", wokwiPart: "wokwi-lcd1602 (i2c)", wokwiId: "lcd1", pins: "SDA GPIO 21 · SCL GPIO 22 · addr 0x27", note: "Shows readings and gate state" },
  { id: "red", label: "Red LED", kind: "indicator", wokwiPart: "wokwi-led (red)", wokwiId: "led1", pins: "GPIO 2", note: "Danger / treatment / emergency" },
  { id: "green", label: "Green LED", kind: "indicator", wokwiPart: "wokwi-led (limegreen)", wokwiId: "led2", pins: "GPIO 4", note: "Safe — valve open" },
  { id: "buzzer", label: "Buzzer", kind: "indicator", wokwiPart: "wokwi-buzzer", wokwiId: "bz1", pins: "GPIO 5 (PWM 2 kHz)", note: "Alarm on danger / emergency" },
  { id: "treatment", label: "Treatment button", kind: "button", wokwiPart: "wokwi-pushbutton", wokwiId: "btn1", pins: "GPIO 15 (pull-up)", note: "Starts treatment cycle" },
  { id: "emergency", label: "Emergency alert button", kind: "button", wokwiPart: "wokwi-pushbutton", wokwiId: "btn2", pins: "GPIO 12 (pull-up)", note: "Labelled “battery leak” in the original code — simulated emergency alert" },
];

export const ADC_MAX = 4095;

/** Conversion formulas from main.py — simulation conversions, not certified sensor calibrations. */
export const adcToPh = (adc: number) => 4 + (adc / ADC_MAX) * 7;
export const adcToTds = (adc: number) => 200 + (adc / ADC_MAX) * 3300;
export const adcToTurbidity = (adc: number) => (adc / ADC_MAX) * 100;

/** Inverse helpers for driving the demo model from a target reading. */
export const phToAdc = (ph: number) => Math.round(((ph - 4) / 7) * ADC_MAX);
export const tdsToAdc = (tds: number) => Math.round(((tds - 200) / 3300) * ADC_MAX);
export const turbidityToAdc = (t: number) => Math.round((t / 100) * ADC_MAX);

export const FORMULAS = [
  { id: "ph", label: "pH", formula: "pH = 4 + (ADC / 4095) × 7", range: "4.0 – 11.0" },
  { id: "tds", label: "TDS", formula: "TDS = 200 + (ADC / 4095) × 3300", range: "200 – 3,500 ppm" },
  { id: "turbidity", label: "Turbidity", formula: "Turbidity = (ADC / 4095) × 100", range: "0 – 100 (simulation scale)" },
] as const;

/** Demonstration thresholds from main.py — not regulatory or certified standards. */
export const WOKWI_THRESHOLDS = {
  phMin: 6.5,
  phMax: 8.5,
  tdsMax: 1000,
  turbidityMax: 50,
} as const;
