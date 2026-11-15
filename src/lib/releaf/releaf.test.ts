import { describe, expect, it } from "vitest";
import { assessRisk, evaluateSafetyGate, riskLevelFor } from "./risk";
import { matchWater } from "./matching";
import { getSample } from "./data";
import type { WaterSample } from "./types";

const clean: WaterSample = {
  id: "T",
  name: "test",
  stage: "",
  factoryId: "x",
  collectedAt: "",
  ph: 7.3,
  turbidity: 1.5,
  tds: 700,
  temperature: 25,
  ec: 1100,
  sar: 2,
  heavyMetals: { cd: 0.002, pb: 0.4, source: "illustrative-lab" },
};

describe("risk bands", () => {
  it("0–39 is low, 40–69 medium, 70+ high", () => {
    expect(riskLevelFor(39)).toBe("low");
    expect(riskLevelFor(40)).toBe("medium");
    expect(riskLevelFor(69)).toBe("medium");
    expect(riskLevelFor(70)).toBe("high");
  });
});

describe("Safety Gate", () => {
  it("restricts reuse for the contaminated demo sample", () => {
    const risk = assessRisk(getSample("S-101"));
    expect(risk.level).toBe("high");
    expect(evaluateSafetyGate(risk).status).toBe("restricted");
    expect(evaluateSafetyGate(risk).title).toBe("Water Reuse Restricted");
  });

  it("allows further evaluation for the treated demo sample", () => {
    const gate = evaluateSafetyGate(assessRisk(getSample("S-103")));
    expect(gate.status).toBe("eligible");
    expect(gate.title).toBe("Eligible for Further Evaluation");
  });

  it("restricts reuse when cadmium exceeds its limit even if sensors look fine", () => {
    const risk = assessRisk({ ...clean, heavyMetals: { cd: 0.02, pb: 0.4, source: "illustrative-lab" } });
    expect(risk.heavyMetalBreach).toBe(true);
    expect(evaluateSafetyGate(risk).status).toBe("restricted");
  });

  it("flags a lab-testing warning when heavy-metal data is missing", () => {
    const risk = assessRisk({ ...clean, heavyMetals: null });
    expect(risk.labDataMissing).toBe(true);
    expect(evaluateSafetyGate(risk).warnings.some((w) => w.includes("laboratory"))).toBe(true);
  });
});

describe("Water Matching", () => {
  it("returns no reuse recommendation when the Safety Gate blocks the sample", () => {
    const outcome = matchWater(getSample("S-101"));
    expect(outcome.blocked).toBe(true);
    expect(outcome.matches).toHaveLength(0);
  });

  it("ranks an industrial reuse above irrigation for clean treated water", () => {
    const outcome = matchWater(getSample("S-103"));
    expect(outcome.blocked).toBe(false);
    expect(outcome.matches[0]?.app.category).toBe("industrial");
  });
});
