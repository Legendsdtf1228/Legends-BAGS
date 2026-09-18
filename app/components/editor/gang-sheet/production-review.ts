import { inchesToPx, OUTPUT_DPI } from "../../../domain/design/types";
import type { QualitySummary } from "./dpi-quality";

/** Display-only. Matches in-process renderer default; does not change export. */
export const REVIEW_IN_PROCESS_MAX_PIXELS = 40_000_000;

export type ReviewIssueSeverity = "blocking" | "caution";

export type ReviewIssue = {
  id: string;
  severity: ReviewIssueSeverity;
  title: string;
  detail: string;
};

export type ExportReadiness = "ready" | "caution" | "blocked";

export type ReviewArtwork = {
  id: string;
  name: string;
  previewUrl?: string | null;
  assetId?: string | null;
  kind?: "image" | "text" | string;
};

export type ProductionReviewInput = {
  sheetWidthIn: number;
  sheetHeightIn: number;
  quantity: number;
  artworkCount: number;
  missingArtworkCount: number;
  overlapCount: number;
  oobCount: number;
  lowDpiCount: number;
  qualitySummary?: Pick<QualitySummary, "excellent" | "good" | "low" | "poor" | "unknown">;
  outputDpi?: number;
};

export type ProductionReviewModel = {
  widthPx: number;
  heightPx: number;
  megapixels: number;
  usesTiledRender: boolean;
  inProcessMaxPixels: number;
  outputDpi: number;
  quantity: number;
  artworkCount: number;
  readiness: ExportReadiness;
  canExport: boolean;
  blocking: ReviewIssue[];
  cautions: ReviewIssue[];
  statusLabel: string;
  statusHint: string;
};

export function countMissingArtwork(items: ReviewArtwork[]): number {
  return items.filter((item) => {
    if (item.kind === "text") return false;
    return !item.assetId;
  }).length;
}

export function formatSheetInches(widthIn: number, heightIn: number): string {
  return `${formatInches(widthIn)} × ${formatInches(heightIn)} in`;
}

export function formatPixelSize(widthPx: number, heightPx: number): string {
  return `${formatPx(widthPx)} × ${formatPx(heightPx)} px`;
}

export function formatMegapixels(pixels: number): string {
  const mp = pixels / 1_000_000;
  if (mp >= 10) return `${mp.toFixed(1)} MP`;
  return `${mp.toFixed(2)} MP`;
}

export function buildProductionReview(input: ProductionReviewInput): ProductionReviewModel {
  const outputDpi = input.outputDpi ?? OUTPUT_DPI;
  const widthPx = inchesToPx(input.sheetWidthIn, outputDpi);
  const heightPx = inchesToPx(input.sheetHeightIn, outputDpi);
  const pixels = widthPx * heightPx;
  const usesTiledRender = pixels > REVIEW_IN_PROCESS_MAX_PIXELS;

  const blocking: ReviewIssue[] = [];
  const cautions: ReviewIssue[] = [];

  if (input.artworkCount < 1) {
    blocking.push({
      id: "empty-sheet",
      severity: "blocking",
      title: "No artwork on this sheet",
      detail: "Place at least one design on the active sheet before saving.",
    });
  }

  if (input.missingArtworkCount > 0) {
    blocking.push({
      id: "missing-artwork",
      severity: "blocking",
      title:
        input.missingArtworkCount === 1
          ? "1 piece is missing artwork"
          : `${input.missingArtworkCount} pieces are missing artwork`,
      detail: "A placed piece has no image file. Replace or remove it before export.",
    });
  }

  if (input.oobCount > 0) {
    blocking.push({
      id: "oob",
      severity: "blocking",
      title:
        input.oobCount === 1
          ? "1 piece is outside the printable margin"
          : `${input.oobCount} pieces are outside the printable margin`,
      detail: "Geometry outside the safe area may clip in print. Move pieces onto the sheet. Saving is still allowed.",
    });
  }

  if (input.overlapCount > 0) {
    cautions.push({
      id: "overlap",
      severity: "caution",
      title:
        input.overlapCount === 1
          ? "1 overlapping piece"
          : `${input.overlapCount} overlapping pieces`,
      detail: "Overlaps print on top of each other. Review placement before sending this sheet.",
    });
  }

  if (input.lowDpiCount > 0) {
    cautions.push({
      id: "dpi",
      severity: "caution",
      title:
        input.lowDpiCount === 1
          ? "1 image below recommended DPI"
          : `${input.lowDpiCount} images below recommended DPI`,
      detail: "Print may look soft or pixelated at this size. Use a larger source file or a smaller print size.",
    });
  }

  if (usesTiledRender) {
    cautions.push({
      id: "memory",
      severity: "caution",
      title: `Sheet is ${formatMegapixels(pixels)} (over ${formatMegapixels(REVIEW_IN_PROCESS_MAX_PIXELS)} in-process cap)`,
      detail: "Export stays available. Output uses the existing tiled renderer — this checkpoint does not change how the print file is generated.",
    });
  }

  const canExport = input.artworkCount > 0 && input.missingArtworkCount === 0;
  const hasIssues = blocking.length > 0 || cautions.length > 0;

  let readiness: ExportReadiness;
  if (!canExport) readiness = "blocked";
  else if (hasIssues) readiness = "caution";
  else readiness = "ready";

  const hasPrintBlockers = blocking.some((issue) => issue.id === "oob" || issue.id === "missing-artwork" || issue.id === "empty-sheet");

  let statusLabel: string;
  let statusHint: string;
  if (readiness === "blocked") {
    statusLabel = "Export blocked";
    statusHint =
      input.artworkCount < 1
        ? "Add artwork to this sheet before saving."
        : "Missing artwork must be fixed before this sheet can be saved.";
  } else if (hasPrintBlockers) {
    statusLabel = "Not print-ready";
    statusHint = "Fix geometry or missing files before print. You can still save this sheet.";
  } else if (readiness === "caution") {
    statusLabel = "Export with cautions";
    statusHint = "This sheet can be saved. Review the cautions before sending it to print.";
  } else {
    statusLabel = "Export ready";
    statusHint = "Active sheet checks passed. Save generates the print file with existing export settings.";
  }

  return {
    widthPx,
    heightPx,
    megapixels: pixels / 1_000_000,
    usesTiledRender,
    inProcessMaxPixels: REVIEW_IN_PROCESS_MAX_PIXELS,
    outputDpi,
    quantity: Math.max(1, input.quantity || 1),
    artworkCount: input.artworkCount,
    readiness,
    canExport,
    blocking,
    cautions,
    statusLabel,
    statusHint,
  };
}

function formatInches(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function formatPx(value: number): string {
  return value.toLocaleString("en-US");
}
