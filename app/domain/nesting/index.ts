import type { DesignItem, SheetConfig } from "../design/types";

export type NestPlacement = {
  assetId: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg: 0 | 90;
  /** Higher paints later / on top when compositing. */
  zIndex?: number;
  flipX?: boolean;
  flipY?: boolean;
};

export type NestResult = {
  sheetWidthIn: number;
  sheetHeightIn: number;
  placements: NestPlacement[];
  utilization: number;
};

export type NestPartialResult = NestResult & {
  fittedCount: number;
  remainingCount: number;
  remainingAssetIds: string[];
  requiredHeightIn: number;
};

export type NestOptions = {
  allowRotate90?: boolean;
};

type Piece = {
  assetId: string;
  widthIn: number;
  heightIn: number;
};

function expandAndSort(items: DesignItem[]): Piece[] {
  const out: Piece[] = [];
  for (const item of items) {
    if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
      throw new Error("Quantity must be a positive integer");
    }
    for (let i = 0; i < item.quantity; i++) {
      out.push({
        assetId: item.assetId,
        widthIn: item.widthIn,
        heightIn: item.heightIn,
      });
    }
  }
  out.sort((a, b) => {
    const areaDiff = b.widthIn * b.heightIn - a.widthIn * a.heightIn;
    if (areaDiff !== 0) return areaDiff;
    if (b.widthIn !== a.widthIn) return b.widthIn - a.widthIn;
    if (b.heightIn !== a.heightIn) return b.heightIn - a.heightIn;
    return a.assetId.localeCompare(b.assetId);
  });
  return out;
}

function orientations(
  piece: Piece,
  allowRotate90: boolean,
): Array<{ widthIn: number; heightIn: number; rotationDeg: 0 | 90 }> {
  const base = {
    widthIn: piece.widthIn,
    heightIn: piece.heightIn,
    rotationDeg: 0 as const,
  };
  if (!allowRotate90 || piece.widthIn === piece.heightIn) return [base];
  return [
    base,
    {
      widthIn: piece.heightIn,
      heightIn: piece.widthIn,
      rotationDeg: 90,
    },
  ];
}

function roundIn(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Shared shelf (row) packer.
 * When `maxHeightIn` is set, pieces that would exceed it are skipped into remaining.
 */
function packShelf(
  pieces: Piece[],
  sheet: SheetConfig,
  allowRotate90: boolean,
  maxHeightIn: number | null,
): { placements: NestPlacement[]; remaining: Piece[]; sheetHeightIn: number } {
  const gap = sheet.imageMarginIn;
  const pad = sheet.artboardMarginIn;
  const innerWidth = sheet.widthIn - pad * 2;
  if (innerWidth <= 0) throw new Error("Sheet too narrow for artboard margin");

  const placements: NestPlacement[] = [];
  const remaining: Piece[] = [];

  let rowY = 0;
  let rowX = 0;
  let rowHeight = 0;

  for (const piece of pieces) {
    const opts = orientations(piece, allowRotate90).filter(
      (o) => o.widthIn <= innerWidth + 1e-9,
    );
    if (opts.length === 0) {
      throw new Error(
        `Item ${piece.assetId} exceeds printable width ${innerWidth} in`,
      );
    }

    let trialRowY = rowY;
    let trialRowX = rowX;
    let trialRowHeight = rowHeight;

    let chosen = opts.find((o) => {
      const need = trialRowX === 0 ? o.widthIn : trialRowX + gap + o.widthIn;
      return need <= innerWidth + 1e-9;
    });

    if (!chosen) {
      trialRowY = rowY + rowHeight + gap;
      trialRowX = 0;
      trialRowHeight = 0;
      chosen = opts[0];
    }

    const x = trialRowX === 0 ? 0 : trialRowX + gap;
    const contentBottom = trialRowY + Math.max(trialRowHeight, chosen.heightIn);
    const projectedHeight = roundIn(pad + contentBottom + pad);

    if (maxHeightIn != null && projectedHeight > maxHeightIn + 1e-9) {
      remaining.push(piece);
      continue;
    }

    placements.push({
      assetId: piece.assetId,
      xIn: pad + x,
      yIn: pad + trialRowY,
      widthIn: chosen.widthIn,
      heightIn: chosen.heightIn,
      rotationDeg: chosen.rotationDeg,
    });

    rowY = trialRowY;
    rowX = x + chosen.widthIn;
    rowHeight = Math.max(trialRowHeight, chosen.heightIn);
  }

  const contentBottom = placements.length === 0 ? 0 : rowY + rowHeight;
  const sheetHeightIn = roundIn(pad + contentBottom + pad);

  return { placements, remaining, sheetHeightIn };
}

function assertInBounds(
  placements: NestPlacement[],
  sheet: SheetConfig,
  sheetHeightIn: number,
): void {
  const pad = sheet.artboardMarginIn;
  for (const p of placements) {
    if (
      p.xIn < pad - 1e-9 ||
      p.yIn < pad - 1e-9 ||
      p.xIn + p.widthIn > sheet.widthIn - pad + 1e-9 ||
      p.yIn + p.heightIn > sheetHeightIn - pad + 1e-9
    ) {
      throw new Error("Nesting produced out-of-bounds placement");
    }
  }
}

/**
 * Soft packer: places as many pieces as fit without exceeding maxHeightIn.
 * Always throws on impossible printable width. Height overflow is reported via remaining*.
 */
export function nestRectanglesPartial(
  items: DesignItem[],
  sheet: SheetConfig,
  options: NestOptions = {},
): NestPartialResult {
  if (items.length === 0) throw new Error("Nothing to nest");

  const allowRotate90 = options.allowRotate90 === true;
  const pieces = expandAndSort(items);

  const full = packShelf(pieces, sheet, allowRotate90, null);
  const requiredHeightIn = full.sheetHeightIn;

  const limited = packShelf(pieces, sheet, allowRotate90, sheet.maxHeightIn);
  assertInBounds(limited.placements, sheet, limited.sheetHeightIn);

  const usedArea = limited.placements.reduce(
    (s, p) => s + p.widthIn * p.heightIn,
    0,
  );
  const sheetArea = sheet.widthIn * limited.sheetHeightIn;

  return {
    sheetWidthIn: sheet.widthIn,
    sheetHeightIn: limited.sheetHeightIn,
    placements: limited.placements,
    utilization: sheetArea > 0 ? usedArea / sheetArea : 0,
    fittedCount: limited.placements.length,
    remainingCount: limited.remaining.length,
    remainingAssetIds: limited.remaining.map((p) => p.assetId),
    requiredHeightIn:
      limited.remaining.length === 0 ? limited.sheetHeightIn : requiredHeightIn,
  };
}

/**
 * Deterministic shelf (row) rectangle packer.
 * Origin is the sheet top-left. Artboard margin insets the printable region.
 * Image margin is the gap between adjacent pieces (not added outside the last piece).
 * Hard-fails when any piece cannot fit within maxHeightIn.
 */
export function nestRectangles(
  items: DesignItem[],
  sheet: SheetConfig,
  options: NestOptions = {},
): NestResult {
  const partial = nestRectanglesPartial(items, sheet, options);
  if (partial.remainingCount > 0) {
    throw new Error(
      `Nested height ${partial.requiredHeightIn} in exceeds max ${sheet.maxHeightIn} in`,
    );
  }
  return {
    sheetWidthIn: partial.sheetWidthIn,
    sheetHeightIn: partial.sheetHeightIn,
    placements: partial.placements,
    utilization: partial.utilization,
  };
}
