import { describe, expect, it } from "vitest";
import {
  FILL_ORIGIN_IN,
  commitAutoFill,
  fillConflictsWithOccupied,
  planFillSheetCopies,
} from "../app/components/editor/workflow/auto-fill-placement";

type Piece = {
  id: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
};

const SHEET = { sheetWidth: 10, sheetHeight: 10, gap: 0.15 };
const COPY = { widthIn: 3, heightIn: 3 };

function placeCopy(source: Piece, copy: { xIn: number; yIn: number }, index: number): Piece {
  return {
    ...source,
    id: `copy-${index}`,
    xIn: copy.xIn,
    yIn: copy.yIn,
    widthIn: COPY.widthIn,
    heightIn: COPY.heightIn,
  };
}

function emptyGrid() {
  return planFillSheetCopies({ ...COPY, ...SHEET });
}

describe("planFillSheetCopies occupancy", () => {
  it("fills the same empty-sheet grid as the previous scan (regression)", () => {
    const plan = emptyGrid();
    expect(plan.copies[0]).toEqual({ xIn: FILL_ORIGIN_IN, yIn: FILL_ORIGIN_IN });
    expect(plan.copies[1].xIn).toBeCloseTo(3.25);
    expect(plan.copies[1].yIn).toBe(FILL_ORIGIN_IN);
    expect(plan.capacity).toBe(9);
    expect(plan.placed).toBe(9);
    expect(plan.copies).toEqual(
      planFillSheetCopies({ ...COPY, ...SHEET, occupied: [] }).copies,
    );
  });

  it("skips grid cells that overlap existing art, including gap clearance", () => {
    const blocker = { xIn: 3.25, yIn: FILL_ORIGIN_IN, widthIn: 3, heightIn: 3 };
    const plan = planFillSheetCopies({ ...COPY, ...SHEET, occupied: [blocker] });
    expect(plan.capacity).toBe(8);
    expect(plan.copies).not.toContainEqual({ xIn: 3.25, yIn: FILL_ORIGIN_IN });
    expect(plan.copies[0]).toEqual({ xIn: FILL_ORIGIN_IN, yIn: FILL_ORIGIN_IN });
    for (const copy of plan.copies) {
      expect(
        fillConflictsWithOccupied({ ...copy, ...COPY }, [blocker], SHEET.gap),
      ).toBe(false);
    }
  });

  it("lets copies reuse the selected source footprint", () => {
    const sourceFootprint = { xIn: FILL_ORIGIN_IN, yIn: FILL_ORIGIN_IN, widthIn: 3, heightIn: 3 };
    const withSourceAsOccupied = planFillSheetCopies({
      ...COPY,
      ...SHEET,
      occupied: [sourceFootprint],
    });
    const sourceExcluded = planFillSheetCopies({ ...COPY, ...SHEET, occupied: [] });
    expect(withSourceAsOccupied.capacity).toBe(8);
    expect(sourceExcluded.copies[0]).toEqual({ xIn: FILL_ORIGIN_IN, yIn: FILL_ORIGIN_IN });
  });

  it("places capacity and reports remaining when requested exceeds free cells", () => {
    const blocker = { xIn: 6.4, yIn: 6.4, widthIn: 3, heightIn: 3 };
    const plan = planFillSheetCopies({
      ...COPY,
      ...SHEET,
      occupied: [blocker],
      requested: 20,
    });
    expect(plan.placed).toBe(plan.capacity);
    expect(plan.placed).toBe(8);
    expect(plan.remaining).toBe(12);
  });

  it("is deterministic for identical occupied inputs", () => {
    const occupied = [
      { xIn: 4, yIn: 1, widthIn: 2, heightIn: 2 },
      { xIn: 1, yIn: 5, widthIn: 4, heightIn: 1.5 },
    ];
    const a = planFillSheetCopies({ ...COPY, ...SHEET, occupied, requested: 6 });
    const b = planFillSheetCopies({ ...COPY, ...SHEET, occupied, requested: 6 });
    expect(a).toEqual(b);
  });
});

describe("commitAutoFill preservation", () => {
  const source: Piece = {
    id: "src",
    xIn: FILL_ORIGIN_IN,
    yIn: FILL_ORIGIN_IN,
    widthIn: 3,
    heightIn: 3,
  };
  const other: Piece = { id: "keep", xIn: 6.4, yIn: 6.4, widthIn: 3, heightIn: 3 };

  it("replaces the source with copies and leaves unrelated art identity-equal", () => {
    const items = [source, other];
    const result = commitAutoFill({
      items,
      sourceId: source.id,
      ...COPY,
      ...SHEET,
      requested: 9,
      placeCopy,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items.some((item) => item.id === "src")).toBe(false);
    const kept = result.items.find((item) => item.id === "keep");
    expect(kept).toBe(other);
    expect(kept).toEqual({ id: "keep", xIn: 6.4, yIn: 6.4, widthIn: 3, heightIn: 3 });
    expect(result.copies.length).toBeGreaterThan(0);
    expect(result.items).toHaveLength(1 + result.copies.length);
    expect(result.copies.some((copy) => copy.xIn === source.xIn && copy.yIn === source.yIn)).toBe(
      true,
    );
  });

  it("does not overlap existing items after commit", () => {
    const items = [source, other];
    const result = commitAutoFill({
      items,
      sourceId: source.id,
      ...COPY,
      ...SHEET,
      requested: 9,
      placeCopy,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const copy of result.copies) {
      expect(fillConflictsWithOccupied(copy, [other], SHEET.gap)).toBe(false);
    }
  });

  it("returns the original items reference when zero copies fit", () => {
    const items = [source, other];
    const result = commitAutoFill({
      items,
      sourceId: source.id,
      widthIn: 9,
      heightIn: 9,
      ...SHEET,
      requested: 4,
      placeCopy,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("nothing-fits");
    expect(result.plan.placed).toBe(0);
    expect(result.items).toBe(items);
    expect(result.copies).toEqual([]);
    expect(items).toEqual([source, other]);
  });

  it("places only what fits when requested exceeds free space", () => {
    const items = [source, other];
    const result = commitAutoFill({
      items,
      sourceId: source.id,
      ...COPY,
      ...SHEET,
      requested: 20,
      placeCopy,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.placed).toBe(result.plan.capacity);
    expect(result.plan.remaining).toBeGreaterThan(0);
    expect(result.copies).toHaveLength(result.plan.placed);
    expect(result.items.find((item) => item.id === "keep")).toBe(other);
  });
});
