/** Canvas zoom helpers — practical display percentages for tall gang sheets. */

export type ZoomMode = "custom" | "fit-width" | "fit-sheet";

export function fitWidthZoomPercent(
  viewportW: number,
  sheetW: number,
  paddingPx = 48,
): number {
  const availW = Math.max(80, viewportW - paddingPx * 2);
  const pct = Math.floor((availW / Math.max(1, viewportW)) * 100);
  return clamp(pct, 15, 200);
}

export function fitSheetZoomPercent(
  viewportW: number,
  viewportH: number,
  sheetW: number,
  sheetH: number,
  paddingPx = 48,
): number {
  const availW = Math.max(80, viewportW - paddingPx * 2);
  const availH = Math.max(80, viewportH - paddingPx * 2);
  const sheetAspect = sheetW / Math.max(0.01, sheetH);
  const byWidth = availW;
  const byHeight = availH * sheetAspect;
  const targetPx = Math.min(byWidth, byHeight);
  const pct = Math.floor((targetPx / Math.max(1, viewportW)) * 100);
  return clamp(pct, 15, 200);
}

/** Prefer fit-width for very tall sheets (height > 2× width). */
export function smartFitZoomPercent(
  viewportW: number,
  viewportH: number,
  sheetW: number,
  sheetH: number,
  paddingPx = 48,
): { zoom: number; mode: ZoomMode } {
  if (sheetH > sheetW * 2) {
    return { zoom: fitWidthZoomPercent(viewportW, sheetW, paddingPx), mode: "fit-width" };
  }
  return {
    zoom: fitSheetZoomPercent(viewportW, viewportH, sheetW, sheetH, paddingPx),
    mode: "fit-sheet",
  };
}

export function zoomDisplayLabel(zoom: number, mode: ZoomMode): string {
  if (mode === "fit-width") return "Fit width";
  if (mode === "fit-sheet") return "Fit sheet";
  return `${Math.round(zoom)}%`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
