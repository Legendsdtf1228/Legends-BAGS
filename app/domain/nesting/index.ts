import type { DesignItem, SheetConfig } from "../design/types";

export type NestPlacement = {
  assetId: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg: 0 | 90;
};

export type NestResult = {
  sheetWidthIn: number;
  sheetHeightIn: number;
  placements: NestPlacement[];
  utilization: number;
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

/**
 * Deterministic shelf (row) rectangle packer.
 * Origin is the sheet top-left. Artboard margin insets the printable region.
 * Image margin is the gap between adjacent pieces (not added outside the last piece).
 */
export function nestRectangles(
  items: DesignItem[],
  sheet: SheetConfig,
  options: NestOptions = {},
): NestResult {
  if (items.length === 0) throw new Error("Nothing to nest");

  const allowRotate90 = options.allowRotate90 === true;
  const gap = sheet.imageMarginIn;
  const pad = sheet.artboardMarginIn;
  const innerWidth = sheet.widthIn - pad * 2;
  if (innerWidth <= 0) throw new Error("Sheet too narrow for artboard margin");

  const pieces = expandAndSort(items);
  const placements: NestPlacement[] = [];

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

    // Prefer orientation that fits on the current row; else start a new row.
    let chosen = opts.find((o) => {
      const need = rowX === 0 ? o.widthIn : rowX + gap + o.widthIn;
      return need <= innerWidth + 1e-9;
    });

    if (!chosen) {
      rowY = rowY + rowHeight + gap;
      rowX = 0;
      rowHeight = 0;
      chosen = opts[0];
    }

    const x = rowX === 0 ? 0 : rowX + gap;
    placements.push({
      assetId: piece.assetId,
      xIn: pad + x,
      yIn: pad + rowY,
      widthIn: chosen.widthIn,
      heightIn: chosen.heightIn,
      rotationDeg: chosen.rotationDeg,
    });

    rowX = x + chosen.widthIn;
    rowHeight = Math.max(rowHeight, chosen.heightIn);
  }

  const contentBottom = rowY + rowHeight;
  // Top artboard margin + content + bottom artboard margin
  const sheetHeightIn =
    Math.round((pad + contentBottom + pad) * 1000) / 1000;

  if (sheetHeightIn > sheet.maxHeightIn + 1e-9) {
    throw new Error(
      `Nested height ${sheetHeightIn} in exceeds max ${sheet.maxHeightIn} in`,
    );
  }

  // Bounds check: every placement must sit inside sheet
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

  const usedArea = placements.reduce((s, p) => s + p.widthIn * p.heightIn, 0);
  const sheetArea = sheet.widthIn * sheetHeightIn;

  return {
    sheetWidthIn: sheet.widthIn,
    sheetHeightIn,
    placements,
    utilization: sheetArea > 0 ? usedArea / sheetArea : 0,
  };
}
