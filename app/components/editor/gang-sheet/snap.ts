/** Snap helpers for gang-sheet canvas placement. */

export const SNAP_GRID_IN = 0.25;
export const SNAP_THRESHOLD_IN = 0.08;

export type SnapGuide = {
  axis: "x" | "y";
  valueIn: number;
};

export function snapValue(value: number, grid = SNAP_GRID_IN): number {
  return Math.round(value / grid) * grid;
}

export function snapPoint(
  xIn: number,
  yIn: number,
  widthIn: number,
  heightIn: number,
  sheetW: number,
  sheetH: number,
  others: Array<{ xIn: number; yIn: number; widthIn: number; heightIn: number }>,
  options?: { grid?: boolean; edges?: boolean; center?: boolean },
): { xIn: number; yIn: number; guides: SnapGuide[] } {
  const grid = options?.grid !== false;
  const edges = options?.edges !== false;
  const center = options?.center !== false;
  const guides: SnapGuide[] = [];
  let x = xIn;
  let y = yIn;

  if (grid) {
    x = snapValue(x);
    y = snapValue(y);
  }

  const candidatesX: number[] = [];
  const candidatesY: number[] = [];
  if (center) {
    candidatesX.push(sheetW / 2 - widthIn / 2);
    candidatesY.push(sheetH / 2 - heightIn / 2);
  }
  if (edges) {
    candidatesX.push(0, sheetW - widthIn);
    candidatesY.push(0, sheetH - heightIn);
  }
  for (const o of others) {
    candidatesX.push(o.xIn, o.xIn + o.widthIn - widthIn, o.xIn + o.widthIn / 2 - widthIn / 2);
    candidatesY.push(o.yIn, o.yIn + o.heightIn - heightIn, o.yIn + o.heightIn / 2 - heightIn / 2);
  }

  for (const cx of candidatesX) {
    if (Math.abs(x - cx) <= SNAP_THRESHOLD_IN) {
      x = cx;
      guides.push({ axis: "x", valueIn: cx });
      break;
    }
  }
  for (const cy of candidatesY) {
    if (Math.abs(y - cy) <= SNAP_THRESHOLD_IN) {
      y = cy;
      guides.push({ axis: "y", valueIn: cy });
      break;
    }
  }

  return { xIn: x, yIn: y, guides };
}
