import { describe, expect, it } from "vitest";
import {
  assertPriceMatches,
  buildPricingSnapshot,
  resolvePhysicalSize,
} from "../app/domain/pricing";

describe("pricing", () => {
  it("resolves preset by longest side for landscape art", () => {
    const size = resolvePhysicalSize(
      { mode: "preset", presetId: "4in", quantity: 2 },
      400,
      200,
    );
    expect(size.widthIn).toBe(4);
    expect(size.heightIn).toBe(2);
    expect(size.quantity).toBe(2);
  });

  it("resolves preset by longest side for portrait art", () => {
    const size = resolvePhysicalSize(
      { mode: "preset", presetId: "4in", quantity: 1 },
      200,
      400,
    );
    expect(size.widthIn).toBe(2);
    expect(size.heightIn).toBe(4);
  });

  it("locks aspect on custom width", () => {
    const size = resolvePhysicalSize(
      {
        mode: "custom",
        widthIn: 6,
        heightIn: 99,
        lockAspect: true,
        quantity: 1,
      },
      300,
      150,
    );
    expect(size.widthIn).toBe(6);
    expect(size.heightIn).toBe(3);
  });

  it("computes area price at $0.049/in²", () => {
    const items = [
      {
        assetId: "a",
        widthIn: 4,
        heightIn: 2,
        quantity: 3,
        rotationDeg: 0 as const,
      },
    ];
    const snap = buildPricingSnapshot(items, 0.049);
    // 4*2*3 = 24 in² * 0.049 = 1.176 → 118 cents
    expect(snap.areaSqIn).toBe(24);
    expect(snap.totalCents).toBe(118);
    expect(() => assertPriceMatches(items, 118, 0.049)).not.toThrow();
    expect(() => assertPriceMatches(items, 100, 0.049)).toThrow(/Price mismatch/);
  });
});
