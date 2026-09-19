/** Occupancy-aware Auto Fill — packs copies around existing canvas art. */

export const FILL_ORIGIN_IN = 0.1;
export const FILL_MAX_COPIES = 250;

const EPS = 1e-9;

export type FillCopy = {
  xIn: number;
  yIn: number;
};

export type FillOccupied = {
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
};

export type FillPlan = {
  copies: FillCopy[];
  capacity: number;
  placed: number;
  remaining: number;
};

export type AutoFillCommitOk<T> = {
  ok: true;
  items: T[];
  copies: T[];
  plan: FillPlan;
};

export type AutoFillCommitFail<T> = {
  ok: false;
  reason: "no-source" | "nothing-fits";
  items: T[];
  copies: T[];
  plan: FillPlan;
};

export type AutoFillCommitResult<T> = AutoFillCommitOk<T> | AutoFillCommitFail<T>;

/**
 * True when the candidate AABB overlaps an obstacle or sits closer than `gap`.
 * Touching at exactly `gap` is allowed (same as the empty-sheet grid stride).
 */
export function fillConflictsWithOccupied(
  candidate: FillOccupied,
  occupied: readonly FillOccupied[],
  gap: number,
): boolean {
  const clearance = Math.max(0, gap);
  for (const obstacle of occupied) {
    const ox = obstacle.xIn - clearance;
    const oy = obstacle.yIn - clearance;
    const ow = obstacle.widthIn + clearance * 2;
    const oh = obstacle.heightIn + clearance * 2;
    const separate =
      candidate.xIn + candidate.widthIn <= ox + EPS ||
      ox + ow <= candidate.xIn + EPS ||
      candidate.yIn + candidate.heightIn <= oy + EPS ||
      oy + oh <= candidate.yIn + EPS;
    if (!separate) return true;
  }
  return false;
}

export function occupiedForAutoFill<T extends FillOccupied & { id: string }>(
  items: readonly T[],
  sourceId: string,
): T[] {
  return items.filter((item) => item.id !== sourceId);
}

/**
 * Repeat-to-fill scan used by the studio Fill sheet action.
 * Geometry matches the existing nested left-to-right, top-to-bottom loop.
 * `requested` only caps how many of those cells are used — it does not change spacing.
 * `occupied` cells (other canvas items) are skipped; free-cell coordinates stay on the grid.
 */
export function planFillSheetCopies(input: {
  widthIn: number;
  heightIn: number;
  sheetWidth: number;
  sheetHeight: number;
  gap: number;
  requested?: number;
  occupied?: readonly FillOccupied[];
}): FillPlan {
  const occupied = input.occupied ?? [];
  const copies: FillCopy[] = [];
  const strideX = input.widthIn + input.gap;
  const strideY = input.heightIn + input.gap;

  for (let y = FILL_ORIGIN_IN; y + input.heightIn <= input.sheetHeight; y += strideY) {
    for (let x = FILL_ORIGIN_IN; x + input.widthIn <= input.sheetWidth; x += strideX) {
      const candidate = {
        xIn: x,
        yIn: y,
        widthIn: input.widthIn,
        heightIn: input.heightIn,
      };
      if (fillConflictsWithOccupied(candidate, occupied, input.gap)) continue;
      copies.push({ xIn: x, yIn: y });
      if (copies.length >= FILL_MAX_COPIES) break;
    }
    if (copies.length >= FILL_MAX_COPIES) break;
  }

  const capacity = copies.length;
  const requested = Math.max(0, Math.round(input.requested ?? capacity));
  const limited = copies.slice(0, Math.min(requested, FILL_MAX_COPIES));
  return {
    copies: limited,
    capacity,
    placed: limited.length,
    remaining: Math.max(0, requested - limited.length),
  };
}

/**
 * Calculate-then-commit. Returns the original `items` reference when nothing
 * can be placed so callers can skip history.
 */
export function commitAutoFill<T extends FillOccupied & { id: string }>(input: {
  items: T[];
  sourceId: string;
  widthIn: number;
  heightIn: number;
  sheetWidth: number;
  sheetHeight: number;
  gap: number;
  requested: number;
  placeCopy: (source: T, copy: FillCopy, index: number) => T;
}): AutoFillCommitResult<T> {
  const source = input.items.find((item) => item.id === input.sourceId);
  const others = occupiedForAutoFill(input.items, input.sourceId);
  const plan = planFillSheetCopies({
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    sheetWidth: input.sheetWidth,
    sheetHeight: input.sheetHeight,
    gap: input.gap,
    requested: input.requested,
    occupied: others,
  });

  if (!source) {
    return { ok: false, reason: "no-source", items: input.items, copies: [], plan };
  }
  if (!plan.copies.length) {
    return { ok: false, reason: "nothing-fits", items: input.items, copies: [], plan };
  }

  const copies = plan.copies.map((copy, index) => input.placeCopy(source, copy, index));
  return {
    ok: true,
    items: [...others, ...copies],
    copies,
    plan,
  };
}
