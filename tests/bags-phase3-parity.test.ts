import { describe, expect, it } from "vitest";
import { alignSelected, distributeSelected } from "../app/components/editor/gang-sheet-helpers";
import { dpiQualityTier, liveDpi } from "../app/components/editor/gang-sheet/dpi-quality";
import { autoFillCopyCount } from "../app/domain/image/image-adjustments";
import {
  NAME_SIZE_PRESETS,
  NUMBER_SIZE_PRESETS,
  validateNamesNumbersCsv,
} from "../app/components/editor/gang-sheet/editor-data";
import { computeGangSheetEstimateUsd } from "../app/domain/pricing";

describe("BAGS DPI tiers", () => {
  it("uses Optimal/Good/Bad/Terrible/Minimum labels", () => {
    expect(dpiQualityTier(320).tier).toBe("optimal");
    expect(dpiQualityTier(320).label).toBe("Optimal");
    expect(dpiQualityTier(260).tier).toBe("good");
    expect(dpiQualityTier(210).tier).toBe("bad");
    expect(dpiQualityTier(150).tier).toBe("terrible");
    expect(dpiQualityTier(50).tier).toBe("minimum");
  });

  it("recalculates live DPI on resize", () => {
    expect(liveDpi(900, 900, 3, 3)).toBe(300);
    expect(liveDpi(900, 900, 6, 6)).toBe(150);
  });
});

describe("auto fill preview", () => {
  it("counts grid copies for reference 11×11.28 layout with default gap", () => {
    const count = autoFillCopyCount(11, 11.28, 22.5, 24, 0.15);
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

describe("transform helpers", () => {
  const items = [
    { id: "a", xIn: 1, yIn: 1, widthIn: 2, heightIn: 2 },
    { id: "b", xIn: 5, yIn: 1, widthIn: 2, heightIn: 2 },
    { id: "c", xIn: 9, yIn: 1, widthIn: 2, heightIn: 2 },
  ];

  it("aligns selection left", () => {
    const next = alignSelected(items, new Set(["a", "b"]), "left", 22.5, 24);
    const xs = next.filter((i) => i.id !== "c").map((i) => i.xIn);
    expect(new Set(xs).size).toBe(1);
  });

  it("distributes three items horizontally", () => {
    const next = distributeSelected(items, new Set(["a", "b", "c"]), "horizontal", 22.5, 24);
    expect(next.find((i) => i.id === "a")!.xIn).toBeLessThan(next.find((i) => i.id === "c")!.xIn);
  });
});

describe("names and numbers CSV", () => {
  it("validates sample CSV for names", () => {
    const result = validateNamesNumbersCsv("name,number\nSmith,12\nJones,7", "names");
    expect(result.ok).toBe(true);
    expect(result.lines).toEqual(["Smith", "Jones"]);
  });

  it("uses BAGS size presets", () => {
    expect(NAME_SIZE_PRESETS.find((p) => p.id === "small")?.widthIn).toBe(1);
    expect(NUMBER_SIZE_PRESETS.find((p) => p.id === "large")?.widthIn).toBe(8);
  });
});

describe("storefront pricing identity", () => {
  it("uses synced variant price when available", () => {
    const usd = computeGangSheetEstimateUsd({
      variantPriceCents: 1700,
      pricePerSqIn: 0.05,
      sheetWidthIn: 22.5,
      sheetHeightIn: 24,
    });
    expect(usd).toBe(17);
  });
});
