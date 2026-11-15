import { describe, expect, it } from "vitest";
import { adcToPh, adcToTds, adcToTurbidity } from "./hardware";
import { evaluateFirmware } from "./logic";
import { iotToWaterSample, parseEsp32Payload, DEFAULT_IOT_SAMPLE } from "./telemetry";
import { assessRisk } from "../risk";

const clean = { ph: 7.2, tds: 640, turbidity: 18 };
const none = { treatment: false, emergency: false };

describe("Wokwi conversion formulas", () => {
  it("match main.py at ADC 0 and 4095", () => {
    expect(adcToPh(0)).toBe(4);
    expect(adcToPh(4095)).toBe(11);
    expect(adcToTds(0)).toBe(200);
    expect(adcToTds(4095)).toBe(3500);
    expect(adcToTurbidity(0)).toBe(0);
    expect(adcToTurbidity(4095)).toBe(100);
  });
});

describe("Wokwi safety logic", () => {
  it("clean water: green on, red off, buzzer off, SAFE - OPEN", () => {
    const s = evaluateFirmware(clean, none);
    expect([s.greenLed, s.redLed, s.buzzer]).toEqual([true, false, false]);
    expect(s.statusLabel).toBe("SAFE - OPEN");
  });

  it("uses strict limits: pH 6.5, TDS 1000 and turbidity 50 all fail", () => {
    expect(evaluateFirmware({ ...clean, ph: 6.5 }, none).safe).toBe(false);
    expect(evaluateFirmware({ ...clean, ph: 8.5 }, none).safe).toBe(false);
    expect(evaluateFirmware({ ...clean, tds: 1000 }, none).safe).toBe(false);
    expect(evaluateFirmware({ ...clean, turbidity: 50 }, none).safe).toBe(false);
  });

  it("any failed condition: red on, green off, buzzer on, DANGER - CLOSED", () => {
    const s = evaluateFirmware({ ...clean, tds: 1500 }, none);
    expect([s.greenLed, s.redLed, s.buzzer]).toEqual([false, true, true]);
    expect(s.statusLabel).toBe("DANGER - CLOSED");
  });

  it("treatment button: red on, green off, buzzer off", () => {
    const s = evaluateFirmware(clean, { treatment: true, emergency: false });
    expect([s.greenLed, s.redLed, s.buzzer]).toEqual([false, true, false]);
    expect(s.statusLabel).toBe("TREATMENT IN PROGRESS");
    expect(s.lcd).toEqual(["TREATING...", "PLEASE WAIT"]);
  });

  it("emergency button overrides treatment: red on, green off, buzzer on", () => {
    const s = evaluateFirmware(clean, { treatment: true, emergency: true });
    expect([s.greenLed, s.redLed, s.buzzer]).toEqual([false, true, true]);
    expect(s.statusLabel).toBe("EMERGENCY ALERT");
  });
});

describe("IoT integration layer", () => {
  it("rejects malformed telemetry payloads", () => {
    expect(parseEsp32Payload({ device: "x", ph: 22, tds: 100, turbidity: 10 }, "esp32-hardware")).toBeNull();
  });

  it("IoT samples carry the lab warning and no SAR score into RELIEF risk", () => {
    const risk = assessRisk(iotToWaterSample(DEFAULT_IOT_SAMPLE));
    expect(risk.labDataMissing).toBe(true);
    expect(risk.factors.find((f) => f.key === "sar")?.status).toBe("missing");
  });
});
