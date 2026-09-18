import { describe, expect, it } from "vitest";
import { inchesToPx, OUTPUT_DPI } from "../app/domain/design/types";
import { GANG_SHEET_EDITOR_CSS } from "../app/components/editor/gang-sheet/gang-sheet-editor-styles";
import {
  buildProductionReview,
  countMissingArtwork,
  formatPixelSize,
  formatSheetInches,
  REVIEW_IN_PROCESS_MAX_PIXELS,
} from "../app/components/editor/gang-sheet/production-review";

describe("production review checkpoint", () => {
  it("reports export-ready when the active sheet has no issues", () => {
    const review = buildProductionReview({
      sheetWidthIn: 22.5,
      sheetHeightIn: 18,
      quantity: 1,
      artworkCount: 3,
      missingArtworkCount: 0,
      overlapCount: 0,
      oobCount: 0,
      lowDpiCount: 0,
    });
    expect(review.readiness).toBe("ready");
    expect(review.canExport).toBe(true);
    expect(review.statusLabel).toBe("Export ready");
    expect(review.blocking).toHaveLength(0);
    expect(review.cautions).toHaveLength(0);
    expect(review.widthPx).toBe(inchesToPx(22.5, OUTPUT_DPI));
    expect(review.heightPx).toBe(inchesToPx(24, OUTPUT_DPI));
    expect(review.usesTiledRender).toBe(false);
  });

  it("groups geometry, DPI, missing artwork, and memory by severity", () => {
    const review = buildProductionReview({
      sheetWidthIn: 22.5,
      sheetHeightIn: 96,
      quantity: 2,
      artworkCount: 4,
      missingArtworkCount: 1,
      overlapCount: 2,
      oobCount: 1,
      lowDpiCount: 3,
    });
    expect(review.readiness).toBe("blocked");
    expect(review.canExport).toBe(false);
    expect(review.blocking.map((i) => i.id)).toEqual(["missing-artwork", "oob"]);
    expect(review.cautions.map((i) => i.id)).toEqual(["overlap", "dpi", "memory"]);
    expect(review.usesTiledRender).toBe(true);
    expect(review.widthPx * review.heightPx).toBeGreaterThan(REVIEW_IN_PROCESS_MAX_PIXELS);
  });

  it("allows save when pieces are out of bounds but marks the sheet not print-ready", () => {
    const review = buildProductionReview({
      sheetWidthIn: 22.5,
      sheetHeightIn: 36,
      quantity: 1,
      artworkCount: 2,
      missingArtworkCount: 0,
      overlapCount: 0,
      oobCount: 1,
      lowDpiCount: 0,
    });
    expect(review.canExport).toBe(true);
    expect(review.readiness).toBe("caution");
    expect(review.statusLabel).toBe("Not print-ready");
    expect(review.blocking.some((i) => i.id === "oob")).toBe(true);
  });

  it("blocks export on an empty sheet", () => {
    const review = buildProductionReview({
      sheetWidthIn: 22.5,
      sheetHeightIn: 24,
      quantity: 1,
      artworkCount: 0,
      missingArtworkCount: 0,
      overlapCount: 0,
      oobCount: 0,
      lowDpiCount: 0,
    });
    expect(review.readiness).toBe("blocked");
    expect(review.canExport).toBe(false);
    expect(review.blocking[0]?.id).toBe("empty-sheet");
  });

  it("counts missing image files and ignores text layers", () => {
    expect(
      countMissingArtwork([
        { id: "a", name: "A", assetId: "asset-1", previewUrl: "blob:a" },
        { id: "b", name: "B", assetId: "", previewUrl: "blob:b" },
        { id: "c", name: "C", assetId: "asset-2", previewUrl: "" },
        { id: "t", name: "Text", kind: "text" },
      ]),
    ).toBe(1);
  });

  it("formats sheet inches and output pixels for the checkpoint", () => {
    expect(formatSheetInches(22.5, 36)).toBe("22.5 × 36 in");
    expect(formatPixelSize(6750, 10800)).toBe("6,750 × 10,800 px");
  });

  it("keeps production review styles on the shared editor stylesheet", () => {
    expect(GANG_SHEET_EDITOR_CSS).toContain(".gs-save-dialog");
    expect(GANG_SHEET_EDITOR_CSS).toContain(".pr-status");
    expect(GANG_SHEET_EDITOR_CSS).toContain("@media(max-width:430px)");
    expect(GANG_SHEET_EDITOR_CSS).toContain("gs-save-dialog-foot .gs-primary-btn");
  });
});
