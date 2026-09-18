import { describe, expect, it } from "vitest";
import { dpiQualityTier, effectiveDpi, placementDpi, summarizeQuality } from "../app/components/editor/gang-sheet/dpi-quality";
import {
  fitSheetZoomPercent,
  fitWidthZoomPercent,
  smartFitZoomPercent,
  zoomDisplayLabel,
} from "../app/components/editor/gang-sheet/editor-zoom";

describe("dpi quality tiers", () => {
  it("classifies excellent at 300+ DPI", () => {
    expect(dpiQualityTier(300).tier).toBe("excellent");
    expect(dpiQualityTier(320).label).toBe("Excellent");
  });

  it("classifies poor below 200 DPI", () => {
    expect(dpiQualityTier(150).tier).toBe("poor");
  });

  it("computes effective DPI from pixels and inches", () => {
    expect(effectiveDpi(900, 900, 3, 3)).toBe(300);
  });

  it("recomputes placement DPI when physical size changes", () => {
    const item = {
      id: "a",
      name: "A",
      dpi: 300,
      widthPx: 900,
      heightPx: 900,
      widthIn: 3,
      heightIn: 3,
    };
    expect(placementDpi(item)).toBe(300);
    expect(placementDpi({ ...item, widthIn: 6, heightIn: 6 })).toBe(150);
    const summary = summarizeQuality([{ ...item, widthIn: 6, heightIn: 6 }], new Set(), new Set());
    expect(summary.poor).toBe(1);
    expect(summary.excellent).toBe(0);
  });

  it("summarizes overlap and quality counts", () => {
    const summary = summarizeQuality(
      [
        {
          id: "a",
          name: "A",
          dpi: 320,
          widthIn: 3,
          heightIn: 3,
        },
        {
          id: "b",
          name: "B",
          dpi: 180,
          widthIn: 4,
          heightIn: 4,
        },
      ],
      new Set(["b"]),
      new Set(),
    );
    expect(summary.excellent).toBe(1);
    expect(summary.poor).toBe(1);
    expect(summary.overlap).toBe(1);
  });
});

describe("editor zoom helpers", () => {
  it("prefers fit-width for tall sheets", () => {
    const fit = smartFitZoomPercent(1000, 800, 22.5, 250);
    expect(fit.mode).toBe("fit-width");
    expect(fit.zoom).toBeGreaterThanOrEqual(15);
  });

  it("labels fit modes for display", () => {
    expect(zoomDisplayLabel(80, "fit-width")).toBe("Fit width");
    expect(zoomDisplayLabel(100, "custom")).toBe("100%");
  });

  it("computes fit width percentage", () => {
    expect(fitWidthZoomPercent(1000, 22.5)).toBeGreaterThan(50);
    expect(fitSheetZoomPercent(1000, 800, 22.5, 36)).toBeGreaterThan(15);
  });
});
