import { dpiQualityTier, effectiveDpi, type DpiQualityInfo } from "./dpi-quality";

/** Selected-artwork print quality display. Uses existing DPI helpers; does not change their math. */
export type ArtworkPrintQuality = {
  taggedDpi: number | null;
  printDpi: number | null;
  info: DpiQualityInfo;
  warn: boolean;
};

export function artworkPrintQuality(item: {
  kind?: string;
  dpi?: number | null;
  widthPx: number;
  heightPx: number;
  widthIn: number;
  heightIn: number;
}): ArtworkPrintQuality | null {
  if (item.kind === "text") return null;
  const taggedDpi = item.dpi != null && Number.isFinite(item.dpi) && item.dpi > 0 ? item.dpi : null;
  const printDpi = effectiveDpi(item.widthPx, item.heightPx, item.widthIn, item.heightIn, null);
  const info = dpiQualityTier(printDpi);
  return {
    taggedDpi,
    printDpi,
    info,
    warn: info.tier === "low" || info.tier === "poor" || info.tier === "unknown",
  };
}

/** Inspector-only treatment preview. Does not persist or change print processing. */
export type ArtworkTreatmentPreview = {
  trimPct: number;
  overlayColor: string;
  overlayAmount: number;
  halftone: boolean;
  halftoneLpi: number;
};

export const DEFAULT_ARTWORK_TREATMENT: ArtworkTreatmentPreview = {
  trimPct: 0,
  overlayColor: "#c9a227",
  overlayAmount: 0,
  halftone: false,
  halftoneLpi: 45,
};
