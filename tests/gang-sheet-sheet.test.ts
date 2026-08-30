import { describe, expect, it } from "vitest";
import {
  DEFAULT_GANG_SHEET_HEIGHT_IN,
  GANG_SHEET_HEIGHTS,
  GANG_SHEET_WIDTHS,
  UPLOAD_BY_SIZE_ROLL_MAX_IN,
  gangSheetAreaPriceUsd,
  gangSheetDesignSheet,
  isGangSheetHeightIn,
  normalizeArtboardMarginIn,
  resolveAllowedSheetHeights,
  resolveAllowedSheetWidths,
  resolveGangSheetHeight,
  resolveGangSheetVariantPriceCents,
  resolveGangSheetProductPanelVariants,
} from "../app/domain/design/gang-sheet-sheet";

describe("resolveGangSheetHeight", () => {
  it("defaults to 24 when binding only has roll max 360", () => {
    expect(
      resolveGangSheetHeight({
        bindingMaxHeightIn: UPLOAD_BY_SIZE_ROLL_MAX_IN,
      }),
    ).toBe(DEFAULT_GANG_SHEET_HEIGHT_IN);
  });

  it("uses binding sheetHeightIn when set", () => {
    expect(resolveGangSheetHeight({ bindingSheetHeightIn: 36 })).toBe(36);
  });

  it("matches variant-specific gang sheet height", () => {
    expect(
      resolveGangSheetHeight({
        variantId: "50252592382200",
        gangSheetVariants: [
          { variantGid: "gid://shopify/ProductVariant/111", sheetHeightIn: 24 },
          { variantGid: "gid://shopify/ProductVariant/50252592382200", sheetHeightIn: 36 },
        ],
      }),
    ).toBe(36);
  });

  it("never returns 360 for a 24 in preset selection path", () => {
    for (const h of GANG_SHEET_HEIGHTS) {
      const resolved = resolveGangSheetHeight({ bindingSheetHeightIn: h });
      expect(resolved).toBe(h);
      expect(resolved).not.toBe(UPLOAD_BY_SIZE_ROLL_MAX_IN);
    }
  });
});

describe("gang sheet dimensions regression", () => {
  for (const width of GANG_SHEET_WIDTHS) {
    for (const height of GANG_SHEET_HEIGHTS) {
      it(`${width} × ${height} in maps consistently`, () => {
        const sheet = gangSheetDesignSheet(width, height);
        expect(sheet.widthIn).toBe(width);
        expect(sheet.maxHeightIn).toBe(height);
        expect(sheet.maxHeightIn).not.toBe(UPLOAD_BY_SIZE_ROLL_MAX_IN);

        const price = gangSheetAreaPriceUsd(width, height, 0.049);
        expect(price).toBe(Math.round(width * height * 0.049 * 100) / 100);
        expect(price).not.toBe(gangSheetAreaPriceUsd(width, UPLOAD_BY_SIZE_ROLL_MAX_IN, 0.049));
      });
    }
  }

  it("22.5 × 24 pricing is not confused with 22.5 × 360", () => {
    const short = gangSheetAreaPriceUsd(22.5, 24, 0.049);
    const wrong = gangSheetAreaPriceUsd(22.5, 360, 0.049);
    expect(short).toBeCloseTo(26.46, 2);
    expect(wrong).toBeCloseTo(396.9, 2);
    expect(short).not.toBe(wrong);
  });
});

describe("resolveAllowedSheetWidths", () => {
  it("restricts to product width when bound", () => {
    expect(resolveAllowedSheetWidths(22.5)).toEqual([22.5]);
    expect(resolveAllowedSheetWidths(24)).toEqual([24]);
  });

  it("returns all widths when product width is unset", () => {
    expect(resolveAllowedSheetWidths(null)).toEqual(GANG_SHEET_WIDTHS);
  });
});

describe("resolveAllowedSheetHeights", () => {
  it("uses variant heights when configured", () => {
    expect(
      resolveAllowedSheetHeights([
        { variantGid: "gid://shopify/ProductVariant/1", sheetHeightIn: 24 },
        { variantGid: "gid://shopify/ProductVariant/2", sheetHeightIn: 36 },
      ]),
    ).toEqual([24, 36]);
  });
});

describe("isGangSheetHeightIn", () => {
  it("rejects roll max as canvas height", () => {
    expect(isGangSheetHeightIn(360)).toBe(false);
    expect(isGangSheetHeightIn(24)).toBe(true);
  });
});

describe("resolveGangSheetVariantPriceCents", () => {
  it("matches price by active sheet height", () => {
    expect(
      resolveGangSheetVariantPriceCents({
        gangSheetVariants: [
          { sheetHeightIn: 24, variantPriceCents: 1700 },
          { sheetHeightIn: 36, variantPriceCents: 2500 },
        ],
        sheetHeightIn: 36,
      }),
    ).toBe(2500);
  });

  it("returns $17 for 22.5 × 24 when 24 in variant is bound", () => {
    expect(
      resolveGangSheetVariantPriceCents({
        gangSheetVariants: [{ sheetHeightIn: 24, variantPriceCents: 1700 }],
        sheetHeightIn: 24,
      }),
    ).toBe(1700);
  });

  it("prefers fixed variant price over area-pricing fallback", () => {
    expect(
      resolveGangSheetVariantPriceCents({
        gangSheetVariants: [{ sheetHeightIn: 24, variantPriceCents: 1700 }],
        sheetHeightIn: 24,
        fallbackVariantPriceCents: 9999,
      }),
    ).toBe(1700);
  });
});

describe("resolveGangSheetProductPanelVariants", () => {
  it("falls back to active binding when catalog is empty", () => {
    const binding = {
      builderType: "gang_sheet" as const,
      sheetHeightIn: 24,
      variantPriceCents: 1700,
      variantTitle: "22.5 x 24",
    };
    expect(resolveGangSheetProductPanelVariants<typeof binding>([], binding)).toEqual([binding]);
  });
});

describe("normalizeArtboardMarginIn", () => {
  it("defaults to 0.125 for null and legacy 0.1", () => {
    expect(normalizeArtboardMarginIn(null)).toBe(0.125);
    expect(normalizeArtboardMarginIn(0.1)).toBe(0.125);
  });

  it("preserves user-chosen margins", () => {
    expect(normalizeArtboardMarginIn(0.2)).toBe(0.2);
    expect(normalizeArtboardMarginIn(0.125)).toBe(0.125);
  });
});
