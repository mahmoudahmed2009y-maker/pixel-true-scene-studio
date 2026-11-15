import { describe, expect, it } from "vitest";
import {
  can,
  canChangeRole,
  mergeUsersWithRoles,
  sampleRowToForm,
  DEFAULT_LIMITS_INPUT,
  factorySchema,
  fmtCollectedAt,
  inputToLimits,
  limitsSchema,
  rowToSample,
  sampleSchema,
} from "./admin";
import { getSample } from "./data";
import { assessRisk, evaluateSafetyGate, LIMITS } from "./risk";

const sampleForm = {
  id: "S-200",
  name: "Test",
  stage: "",
  factory_id: "delta-textiles",
  collected_at: "2026-11-12T08:00",
  ph: "7.1",
  turbidity: "2",
  tds: "800",
  temperature: "26",
  ec: "1200",
  sar: "2",
  lab_cd: "",
  lab_pb: "",
};

describe("admin roles", () => {
  it("operators can manage samples only", () => {
    expect(can(["operator"], "samples")).toBe(true);
    expect(can(["operator"], "factories")).toBe(false);
    expect(can(["operator"], "limits")).toBe(false);
    expect(can(["operator"], "users")).toBe(false);
  });
  it("admins can manage everything", () => {
    expect(can(["admin"], "factories") && can(["admin"], "limits") && can(["admin"], "users")).toBe(true);
  });
  it("no role means no access", () => {
    expect(can([], "samples")).toBe(false);
  });
});

describe("admin forms", () => {
  it("rejects a factory ID with spaces or capitals", () => {
    expect(factorySchema.safeParse({ id: "Delta Mill", name: "x", location: "", sector: "", daily_capacity_m3: "10" }).success).toBe(false);
  });
  it("rejects pH outside 0–14", () => {
    expect(sampleSchema.safeParse({ ...sampleForm, ph: "15" }).success).toBe(false);
  });
  it("requires both lab values or neither", () => {
    expect(sampleSchema.safeParse({ ...sampleForm, lab_cd: "0.004" }).success).toBe(false);
    const both = sampleSchema.safeParse({ ...sampleForm, lab_cd: "0.004", lab_pb: "0.5" });
    expect(both.success && both.data.lab_cd).toBe(0.004);
    const none = sampleSchema.safeParse(sampleForm);
    expect(none.success && none.data.lab_cd).toBe(null);
  });
  it("rejects pH minimum at or above maximum", () => {
    expect(limitsSchema.safeParse({ ...DEFAULT_LIMITS_INPUT, ph_min: 8.5, ph_max: 8.5 }).success).toBe(false);
  });
});

describe("admin-managed limits", () => {
  it("default limits score the demo samples exactly as before", () => {
    const L = inputToLimits(DEFAULT_LIMITS_INPUT);
    for (const id of ["S-101", "S-102", "S-103", "S-104"]) {
      expect(assessRisk(getSample(id), L).score).toBe(assessRisk(getSample(id), LIMITS).score);
    }
    expect(assessRisk(getSample("S-101"), L).score).toBe(85);
    expect(assessRisk(getSample("S-103"), L).score).toBe(13);
  });
  it("a stricter TDS limit raises the score of a sample above it", () => {
    const strict = inputToLimits({ ...DEFAULT_LIMITS_INPUT, tds_max: 500 });
    expect(assessRisk(getSample("S-103"), strict).score).toBeGreaterThan(13);
  });
  it("a heavy-metal breach under admin limits still restricts reuse", () => {
    const strict = inputToLimits({ ...DEFAULT_LIMITS_INPUT, pb_max: 0.5 });
    const gate = evaluateSafetyGate(assessRisk(getSample("S-103"), strict));
    expect(gate.status).toBe("restricted");
  });
});

describe("database rows", () => {
  it("formats collection time in UTC", () => {
    expect(fmtCollectedAt("2026-11-12T06:40:00+00:00")).toBe("2026-11-12 06:40");
  });
  it("maps missing lab values to no lab data", () => {
    const s = rowToSample({
      id: "S-1", name: "n", stage: "", factory_id: "f", collected_at: "2026-11-12T06:40:00+00:00",
      ph: 7, turbidity: 1, tds: 1, temperature: 20, ec: 1, sar: 1, lab_cd: null, lab_pb: null,
      sort_order: 0, created_at: "", updated_at: "",
    });
    expect(s.heavyMetals).toBeNull();
  });
});

describe("admin users", () => {
  it("an admin cannot remove their own admin role", () => {
    expect(canChangeRole("me", "me", "admin", false)).toBe(false);
  });
  it("an admin can remove another user's admin role and their own operator role", () => {
    expect(canChangeRole("me", "other", "admin", false)).toBe(true);
    expect(canChangeRole("me", "me", "operator", false)).toBe(true);
  });
  it("lists admins first and attaches each user's roles", () => {
    const users = mergeUsersWithRoles(
      [
        { id: "a", email: "a@x.com", display_name: null, created_at: "2026-01-01" },
        { id: "b", email: "b@x.com", display_name: null, created_at: "2026-02-01" },
      ],
      [{ user_id: "b", role: "admin" }],
    );
    expect(users.map((u) => u.id)).toEqual(["b", "a"]);
    expect(users[0]!.roles).toEqual(["admin"]);
    expect(users[1]!.roles).toEqual([]);
  });
  it("sample rows convert back to form values in UTC", () => {
    const form = sampleRowToForm({
      id: "S-1", name: "n", stage: "", factory_id: "f", collected_at: "2026-11-12T06:40:00+00:00",
      ph: 7, turbidity: 1, tds: 2, temperature: 3, ec: 4, sar: 5, lab_cd: null, lab_pb: null,
      sort_order: 0, created_at: "", updated_at: "",
    });
    expect(form.collected_at).toBe("2026-11-12T06:40");
    expect(form.lab_cd).toBe("");
  });
});
