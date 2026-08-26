import { describe, expect, it } from "vitest";
import { buildNest } from "../app/domain/design/pipeline";
import type { DesignStateV1 } from "../app/domain/design/types";

function state(items: DesignStateV1["items"]): DesignStateV1 {
  return {
    schemaVersion: 1,
    workflow: "gang_sheet",
    layout: "manual",
    allowRotate90: false,
    sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
    items,
    pricing: { currency: "USD", pricePerSqIn: 0.049, areaSqIn: 16, totalCents: 78 },
  };
}

describe("manual gang-sheet layout", () => {
  it("preserves customer canvas positions", () => {
    const result = buildNest(state([{ assetId: "art", widthIn: 4, heightIn: 4, quantity: 1, rotationDeg: 0, xIn: 3.25, yIn: 7.5 }]), state([]).sheet);
    expect(result.sheetHeightIn).toBe(24);
    expect(result.placements[0]).toMatchObject({ xIn: 3.25, yIn: 7.5, widthIn: 4, heightIn: 4 });
  });

  it("rejects artwork outside the selected sheet", () => {
    const s = state([{ assetId: "art", widthIn: 4, heightIn: 4, quantity: 1, rotationDeg: 0, xIn: 20, yIn: 1 }]);
    expect(() => buildNest(s, s.sheet)).toThrow("outside the sheet");
  });
});
