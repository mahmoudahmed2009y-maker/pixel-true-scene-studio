import { describe, expect, it } from "vitest";
import { brandText, DEFAULT_BRAND, logoError, parseBrand, siteNameSchema } from "./brand";

describe("site branding", () => {
  it("defaults to RELEAF with the built-in logo", () => {
    expect(parseBrand(null)).toEqual({ name: "RELEAF", logoUrl: null });
    expect(DEFAULT_BRAND.name).toBe("RELEAF");
  });

  it("uses the saved name, trimmed", () => {
    expect(parseBrand({ site_name: "  GreenFlow  ", logo_data_url: null }).name).toBe("GreenFlow");
  });

  it("requires a site name of 1–40 characters", () => {
    expect(siteNameSchema.safeParse("   ").success).toBe(false);
    expect(siteNameSchema.safeParse("a".repeat(41)).success).toBe(false);
    expect(siteNameSchema.safeParse("a".repeat(40)).success).toBe(true);
  });

  it("falls back to RELEAF when a stored name is invalid", () => {
    expect(parseBrand({ site_name: "" }).name).toBe("RELEAF");
  });

  it("accepts PNG/JPEG/WebP logos and rejects SVG or oversized ones", () => {
    expect(logoError("data:image/png;base64,iVBORw0KGgo=")).toBeNull();
    expect(logoError("data:image/svg+xml;base64,PHN2Zz4=")).not.toBeNull();
    expect(logoError(`data:image/png;base64,${"A".repeat(400_000)}`)).not.toBeNull();
    expect(parseBrand({ site_name: "X", logo_data_url: "data:image/svg+xml;base64,PHN2Zz4=" }).logoUrl).toBeNull();
  });

  it("replaces the product name in page copy", () => {
    expect(brandText("Impact — RELEAF", "GreenFlow")).toBe("Impact — GreenFlow");
    expect(brandText("Impact — RELEAF", "RELEAF")).toBe("Impact — RELEAF");
  });
});
