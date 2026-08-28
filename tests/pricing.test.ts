import { describe, expect, it } from "vitest";
import {
  assertPriceMatches,
  buildGangSheetPricingSnapshot,
  buildPricingSnapshot,
  computeGangSheetEstimateUsd,
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

  it("uses fixed variant price for gang sheet when configured", () => {
    const items = [
      { assetId: "a", widthIn: 4, heightIn: 2, quantity: 1, rotationDeg: 0 as const },
    ];
    const snap = buildGangSheetPricingSnapshot(items, { variantPriceCents: 1700 });
    expect(snap.totalCents).toBe(1700);
    expect(snap.areaSqIn).toBe(8);
  });

  it("uses full sheet area for empty gang sheet estimate without variant price", () => {
    expect(
      computeGangSheetEstimateUsd({
        pricePerSqIn: 0.049,
        sheetWidthIn: 22.5,
        sheetHeightIn: 24,
        usedAreaSqIn: 0,
      }),
    ).toBe(26.46);
  });

  it("uses variant price for empty gang sheet when configured", () => {
    expect(
      computeGangSheetEstimateUsd({
        variantPriceCents: 2646,
        pricePerSqIn: 0.049,
        sheetWidthIn: 22.5,
        sheetHeightIn: 24,
      }),
    ).toBe(26.46);
  });

  it("uses full sheet area for gang sheet with artwork when variant price is absent", () => {
    expect(
      computeGangSheetEstimateUsd({
        pricePerSqIn: 0.049,
        sheetWidthIn: 22.5,
        sheetHeightIn: 24,
        usedAreaSqIn: 8,
      }),
    ).toBe(26.46);
  });

  it("uses full sheet dimensions for gang sheet pricing snapshot without variant", () => {
    const items = [
      { assetId: "a", widthIn: 4, heightIn: 2, quantity: 1, rotationDeg: 0 as const },
    ];
    const snap = buildGangSheetPricingSnapshot(items, {
      pricePerSqIn: 0.049,
      sheetWidthIn: 22.5,
      sheetHeightIn: 24,
    });
    expect(snap.totalCents).toBe(2646);
  });
});
