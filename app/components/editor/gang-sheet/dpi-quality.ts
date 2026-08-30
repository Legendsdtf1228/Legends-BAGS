/** Effective print DPI quality tiers for gang sheet artwork (BAGS naming). */

export type DpiQualityTier = "optimal" | "good" | "bad" | "terrible" | "minimum" | "unknown";

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
      tier: "optimal",
      label: "Optimal",
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
      tier: "bad",
      label: "Bad",
      explanation: `${Math.round(dpi)} DPI — may look soft when printed. Consider a larger source file or smaller print size.`,
    };
  }
  if (dpi >= 72) {
    return {
      tier: "terrible",
      label: "Terrible",
      explanation: `${Math.round(dpi)} DPI — likely to look pixelated. Replace with a higher-resolution image.`,
    };
  }
  return {
    tier: "minimum",
    label: "Minimum",
    explanation: `${Math.round(dpi)} DPI — below 72 DPI minimum. Artwork will not print well at this size.`,
  };
}

export function effectiveDpi(
  widthPx: number,
  heightPx: number,
  widthIn: number,
  heightIn: number,
  taggedDpi?: number | null,
): number | null {
  if (widthIn <= 0 || heightIn <= 0) return taggedDpi ?? null;
  const fromW = widthPx / widthIn;
  const fromH = heightPx / heightIn;
  const dpi = Math.min(fromW, fromH);
  return Number.isFinite(dpi) && dpi > 0 ? dpi : taggedDpi ?? null;
}

/** Recalculate live DPI after resize (ignores stale tagged DPI). */
export function liveDpi(
  widthPx: number,
  heightPx: number,
  widthIn: number,
  heightIn: number,
): number | null {
  return effectiveDpi(widthPx, heightPx, widthIn, heightIn, null);
}

export type QualitySummary = {
  optimal: number;
  good: number;
  bad: number;
  terrible: number;
  minimum: number;
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
    optimal: 0,
    good: 0,
    bad: 0,
    terrible: 0,
    minimum: 0,
    unknown: 0,
    overlap: overlappingIds.size,
    oob: oobIds.size,
  };
  for (const item of items) {
    if (item.kind === "text") continue;
    const dpi =
      item.dpi ??
      (item.widthPx && item.heightPx
        ? liveDpi(item.widthPx, item.heightPx, item.widthIn, item.heightIn)
        : null);
    const tier = dpiQualityTier(dpi).tier;
    if (tier === "unknown") summary.unknown += 1;
    else summary[tier] += 1;
  }
  return summary;
}

/** True when tier is below Good (Bad, Terrible, Minimum, Unknown). */
export function isLowQualityTier(tier: DpiQualityTier): boolean {
  return tier === "bad" || tier === "terrible" || tier === "minimum" || tier === "unknown";
}
