import { describe, expect, it } from "vitest";
import { buildNest } from "../app/domain/design/pipeline";
import type { DesignStateV1 } from "../app/domain/design/types";

function state(
  items: DesignStateV1["items"],
  overrides?: Partial<DesignStateV1>,
): DesignStateV1 {
  return {
    schemaVersion: 1,
    workflow: "gang_sheet",
    layout: "manual",
    allowRotate90: false,
    sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
    items,
    pricing: { currency: "USD", pricePerSqIn: 0.049, areaSqIn: 16, totalCents: 78 },
    ...overrides,
  };
}

describe("manual gang-sheet layout", () => {
  it("preserves customer canvas positions", () => {
    const result = buildNest(state([{ assetId: "art", widthIn: 4, heightIn: 4, quantity: 1, rotationDeg: 0, xIn: 3.25, yIn: 7.5 }]), state([]).sheet);
    expect(result.sheetHeightIn).toBe(24);
    expect(result.placements[0]).toMatchObject({ xIn: 3.25, yIn: 7.5, widthIn: 4, heightIn: 4 });
  });

  it("preserves 90° rotation on manual placements", () => {
    const s = state([
      {
        assetId: "art",
        widthIn: 3,
        heightIn: 5,
        quantity: 1,
        rotationDeg: 90,
        xIn: 1,
        yIn: 2,
      },
    ]);
    const result = buildNest(s, s.sheet);
    expect(result.placements[0]).toMatchObject({
      rotationDeg: 90,
      widthIn: 3,
      heightIn: 5,
      xIn: 1,
      yIn: 2,
    });
  });

  it("rejects artwork outside the selected sheet", () => {
    const s = state([{ assetId: "art", widthIn: 4, heightIn: 4, quantity: 1, rotationDeg: 0, xIn: 20, yIn: 1 }]);
    expect(() => buildNest(s, s.sheet)).toThrow("outside the sheet");
  });

  it("preserves zIndex paint order in placements", () => {
    const s = state([
      { assetId: "bottom", widthIn: 2, heightIn: 2, quantity: 1, rotationDeg: 0, xIn: 1, yIn: 1, zIndex: 5 },
      { assetId: "top", widthIn: 2, heightIn: 2, quantity: 1, rotationDeg: 0, xIn: 2, yIn: 2, zIndex: 1 },
      { assetId: "mid", widthIn: 2, heightIn: 2, quantity: 1, rotationDeg: 0, xIn: 3, yIn: 3, zIndex: 3 },
    ]);
    const result = buildNest(s, s.sheet);
    expect(result.placements.map((p) => p.assetId)).toEqual(["top", "mid", "bottom"]);
    expect(result.placements.map((p) => p.zIndex)).toEqual([1, 3, 5]);
  });

  it("treats gang_sheet with x/y as manual when layout is omitted", () => {
    const s = state(
      [{ assetId: "art", widthIn: 4, heightIn: 4, quantity: 1, rotationDeg: 0, xIn: 5, yIn: 6 }],
      { layout: undefined },
    );
    delete (s as { layout?: DesignStateV1["layout"] }).layout;
    const result = buildNest(s, s.sheet);
    expect(result.sheetHeightIn).toBe(24);
    expect(result.placements[0]).toMatchObject({ xIn: 5, yIn: 6 });
  });

  it("auto-nests upload_by_size without layout or positions", () => {
    const s: DesignStateV1 = {
      schemaVersion: 1,
      workflow: "upload_by_size",
      allowRotate90: true,
      sheet: { widthIn: 22.5, maxHeightIn: 50, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
      items: [
        { assetId: "a", widthIn: 4, heightIn: 2, quantity: 2, rotationDeg: 0 },
      ],
      pricing: { currency: "USD", pricePerSqIn: 0.049, areaSqIn: 16, totalCents: 78 },
    };
    const result = buildNest(s, s.sheet);
    expect(result.placements).toHaveLength(2);
    expect(result.placements[0].xIn).toBe(s.sheet.artboardMarginIn);
    expect(result.placements[0].yIn).toBe(s.sheet.artboardMarginIn);
  });
});
