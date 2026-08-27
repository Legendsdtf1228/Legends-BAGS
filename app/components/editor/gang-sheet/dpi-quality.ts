/** Effective print DPI quality tiers for gang sheet artwork. */

export type DpiQualityTier = "excellent" | "good" | "low" | "poor" | "unknown";

export type DpiQualityInfo = {
  tier: DpiQualityTier;
  label: string;
  explanation: string;
};

export function dpiQualityTier(dpi: number | null | undefined): DpiQualityInfo {
  if (dpi == null || !Number.isFinite(dpi)) {
    return {
      tier: "unknown",
      label: "Unknown",
      explanation: "Image resolution was not detected. Upload a higher-resolution file if print quality matters.",
    };
  }
  if (dpi >= 300) {
    return {
      tier: "excellent",
      label: "Excellent",
      explanation: `${Math.round(dpi)} DPI — ideal for sharp print at this size.`,
    };
  }
  if (dpi >= 250) {
    return {
      tier: "good",
      label: "Good",
      explanation: `${Math.round(dpi)} DPI — acceptable for most DTF prints at this size.`,
    };
  }
  if (dpi >= 200) {
    return {
      tier: "low",
      label: "Low",
      explanation: `${Math.round(dpi)} DPI — may look soft when printed. Consider a larger source file or smaller print size.`,
    };
  }
  return {
    tier: "poor",
    label: "Poor",
    explanation: `${Math.round(dpi)} DPI — likely to look pixelated. Replace with a higher-resolution image.`,
  };
}

export function effectiveDpi(
  widthPx: number,
  heightPx: number,
  widthIn: number,
  heightIn: number,
  taggedDpi?: number | null,
): number | null {
  if (taggedDpi != null && taggedDpi > 0) return taggedDpi;
  if (widthIn <= 0 || heightIn <= 0) return null;
  const fromW = widthPx / widthIn;
  const fromH = heightPx / heightIn;
  const dpi = Math.min(fromW, fromH);
  return Number.isFinite(dpi) && dpi > 0 ? dpi : null;
}

export type QualitySummary = {
  excellent: number;
  good: number;
  low: number;
  poor: number;
  unknown: number;
  overlap: number;
  oob: number;
};

export function summarizeQuality(
  items: Array<{
    id: string;
    kind?: string;
    dpi?: number | null;
    widthPx?: number;
    heightPx?: number;
    widthIn: number;
    heightIn: number;
    name: string;
  }>,
  overlappingIds: Set<string>,
  oobIds: Set<string>,
): QualitySummary {
  const summary: QualitySummary = {
    excellent: 0,
    good: 0,
    low: 0,
    poor: 0,
    unknown: 0,
    overlap: overlappingIds.size,
    oob: oobIds.size,
  };
  for (const item of items) {
    if (item.kind === "text") continue;
    const dpi =
      item.dpi ??
      (item.widthPx && item.heightPx
        ? effectiveDpi(item.widthPx, item.heightPx, item.widthIn, item.heightIn)
        : null);
    const tier = dpiQualityTier(dpi).tier;
    summary[tier === "unknown" ? "unknown" : tier] += 1;
  }
  return summary;
}
