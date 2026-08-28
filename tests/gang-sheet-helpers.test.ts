import { describe, expect, it } from "vitest";
import { scaleItemsToSheet } from "../app/components/editor/gang-sheet-helpers";

describe("scaleItemsToSheet", () => {
  it("uniformly scales items when shrinking the sheet", () => {
    const items = [
      { id: "a", xIn: 10, yIn: 5, widthIn: 8, heightIn: 4 },
      { id: "b", xIn: 0, yIn: 0, widthIn: 4, heightIn: 4 },
    ];
    const scaled = scaleItemsToSheet(items, 22.5, 36, 11.25, 18);
    expect(scaled[0]).toMatchObject({ xIn: 5, yIn: 2.5, widthIn: 4, heightIn: 2 });
    expect(scaled[1]).toMatchObject({ xIn: 0, yIn: 0, widthIn: 2, heightIn: 2 });
  });

  it("does not upscale when the target sheet is larger", () => {
    const items = [{ id: "a", xIn: 1, yIn: 2, widthIn: 3, heightIn: 4 }];
    const scaled = scaleItemsToSheet(items, 10, 10, 20, 20);
    expect(scaled).toEqual(items);
  });

  it("clamps scaled pieces inside the new sheet bounds", () => {
    const items = [{ id: "a", xIn: 20, yIn: 30, widthIn: 5, heightIn: 5 }];
    const scaled = scaleItemsToSheet(items, 22.5, 36, 11.25, 18);
    for (const i of scaled) {
      expect(i.xIn).toBeGreaterThanOrEqual(0);
      expect(i.yIn).toBeGreaterThanOrEqual(0);
      expect(i.xIn + i.widthIn).toBeLessThanOrEqual(11.25);
      expect(i.yIn + i.heightIn).toBeLessThanOrEqual(18);
    }
  });
});
