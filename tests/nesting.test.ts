import { describe, expect, it } from "vitest";
import { nestRectangles, nestRectanglesPartial } from "../app/domain/nesting";
import { DEFAULT_UPLOAD_BY_SIZE_SHEET } from "../app/domain/design/types";

describe("nesting", () => {
  const sheet = { ...DEFAULT_UPLOAD_BY_SIZE_SHEET, maxHeightIn: 50 };

  it("places a single item inside artboard margins", () => {
    const result = nestRectangles(
      [
        {
          assetId: "a",
          widthIn: 4,
          heightIn: 2,
          quantity: 1,
          rotationDeg: 0,
        },
      ],
      sheet,
    );
    expect(result.placements).toHaveLength(1);
    expect(result.placements[0].xIn).toBe(sheet.artboardMarginIn);
    expect(result.placements[0].yIn).toBe(sheet.artboardMarginIn);
    expect(result.sheetHeightIn).toBeCloseTo(
      sheet.artboardMarginIn + 2 + sheet.artboardMarginIn,
      3,
    );
  });

  it("duplicates quantity and applies image margins between items", () => {
    const result = nestRectangles(
      [
        {
          assetId: "a",
          widthIn: 4,
          heightIn: 2,
          quantity: 3,
          rotationDeg: 0,
        },
      ],
      sheet,
    );
    expect(result.placements).toHaveLength(3);
    const xs = result.placements.map((p) => p.xIn);
    expect(xs[1] - (xs[0] + 4)).toBeCloseTo(sheet.imageMarginIn, 5);
  });

  it("is deterministic for identical inputs", () => {
    const items = [
      {
        assetId: "b",
        widthIn: 3,
        heightIn: 3,
        quantity: 4,
        rotationDeg: 0 as const,
      },
      {
        assetId: "a",
        widthIn: 5,
        heightIn: 2,
        quantity: 2,
        rotationDeg: 0 as const,
      },
    ];
    const a = nestRectangles(items, sheet);
    const b = nestRectangles(items, sheet);
    expect(a).toEqual(b);
  });

  it("rotates 90° when required to fit printable width", () => {
    const narrow = { ...sheet, widthIn: 5, artboardMarginIn: 0.1 };
    const result = nestRectangles(
      [
        {
          assetId: "wide",
          widthIn: 6,
          heightIn: 2,
          quantity: 1,
          rotationDeg: 0,
        },
      ],
      narrow,
      { allowRotate90: true },
    );
    expect(result.placements[0].rotationDeg).toBe(90);
    expect(result.placements[0].widthIn).toBe(2);
    expect(result.placements[0].heightIn).toBe(6);
  });

  it("rejects items wider than printable width", () => {
    expect(() =>
      nestRectangles(
        [
          {
            assetId: "huge",
            widthIn: 30,
            heightIn: 2,
            quantity: 1,
            rotationDeg: 0,
          },
        ],
        sheet,
        { allowRotate90: false },
      ),
    ).toThrow(/exceeds printable width/);
  });

  it("partial nest reports fitted and remaining when copies overflow height", () => {
    const short = { ...sheet, maxHeightIn: 6 };
    const partial = nestRectanglesPartial(
      [
        {
          assetId: "tile",
          widthIn: 10,
          heightIn: 2,
          quantity: 10,
          rotationDeg: 0,
        },
      ],
      short,
    );
    expect(partial.fittedCount).toBeGreaterThan(0);
    expect(partial.remainingCount).toBeGreaterThan(0);
    expect(partial.fittedCount + partial.remainingCount).toBe(10);
    expect(partial.placements).toHaveLength(partial.fittedCount);
    expect(partial.remainingAssetIds).toHaveLength(partial.remainingCount);
    expect(partial.remainingAssetIds.every((id) => id === "tile")).toBe(true);
    expect(partial.requiredHeightIn).toBeGreaterThan(short.maxHeightIn);
    expect(partial.sheetHeightIn).toBeLessThanOrEqual(short.maxHeightIn + 1e-9);
  });

  it("partial nest is deterministic for identical inputs", () => {
    const short = { ...sheet, maxHeightIn: 8 };
    const items = [
      {
        assetId: "tile",
        widthIn: 10,
        heightIn: 2,
        quantity: 10,
        rotationDeg: 0 as const,
      },
    ];
    const a = nestRectanglesPartial(items, short);
    const b = nestRectanglesPartial(items, short);
    expect(a).toEqual(b);
  });

  it("partial nest with all fitting matches hard nest height", () => {
    const items = [
      {
        assetId: "a",
        widthIn: 4,
        heightIn: 2,
        quantity: 2,
        rotationDeg: 0 as const,
      },
    ];
    const hard = nestRectangles(items, sheet);
    const soft = nestRectanglesPartial(items, sheet);
    expect(soft.remainingCount).toBe(0);
    expect(soft.requiredHeightIn).toBe(soft.sheetHeightIn);
    expect(soft.sheetHeightIn).toBe(hard.sheetHeightIn);
    expect(soft.placements).toEqual(hard.placements);
  });

  it("hard nest throws when height overflows", () => {
    const short = { ...sheet, maxHeightIn: 6 };
    expect(() =>
      nestRectangles(
        [
          {
            assetId: "tile",
            widthIn: 10,
            heightIn: 2,
            quantity: 10,
            rotationDeg: 0,
          },
        ],
        short,
      ),
    ).toThrow(/exceeds max/);
  });
});
