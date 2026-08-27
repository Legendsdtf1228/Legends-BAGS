import { describe, expect, it } from "vitest";
import { snapPoint, snapValue } from "../app/components/editor/gang-sheet/snap";

describe("snap helpers", () => {
  it("snaps to grid", () => {
    expect(snapValue(1.12)).toBe(1);
    expect(snapValue(1.13)).toBe(1.25);
  });

  it("snaps to sheet center", () => {
    const { xIn, guides } = snapPoint(10.28, 11, 2, 2, 22.5, 24, [], { grid: false });
    expect(xIn).toBeCloseTo(10.25, 2);
    expect(guides.some((g) => g.axis === "x")).toBe(true);
  });
});
