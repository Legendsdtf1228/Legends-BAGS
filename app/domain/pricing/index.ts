import {
  DEFAULT_PRICE_PER_SQ_IN,
  SIZE_PRESETS,
  type DesignItem,
  type PricingSnapshot,
} from "../design/types";

export type SizeInput =
  | { mode: "preset"; presetId: string; quantity: number }
  | {
      mode: "custom";
      widthIn: number;
      heightIn: number;
      lockAspect: boolean;
      quantity: number;
      /** Intrinsic aspect width/height from artwork when lockAspect applies */
      sourceWidthPx?: number;
      sourceHeightPx?: number;
    };

export type ResolvedSize = {
  widthIn: number;
  heightIn: number;
  quantity: number;
};

function roundInches(n: number): number {
  // thousandth-inch resolution is enough for pricing/layout stability
  return Math.round(n * 1000) / 1000;
}

/**
 * Resolve physical print size.
 * Presets use "longest side" proportional sizing from source pixel aspect.
 */
export function resolvePhysicalSize(
  input: SizeInput,
  sourceWidthPx: number,
  sourceHeightPx: number,
): ResolvedSize {
  if (sourceWidthPx <= 0 || sourceHeightPx <= 0) {
    throw new Error("Source dimensions must be positive");
  }
  const aspect = sourceWidthPx / sourceHeightPx;

  if (input.mode === "preset") {
    const preset = SIZE_PRESETS[input.presetId];
    if (!preset) throw new Error(`Unknown preset: ${input.presetId}`);
    if (input.quantity < 1 || !Number.isInteger(input.quantity)) {
      throw new Error("Quantity must be a positive integer");
    }
    const longest = preset.longestSideIn;
    let widthIn: number;
    let heightIn: number;
    if (aspect >= 1) {
      widthIn = longest;
      heightIn = longest / aspect;
    } else {
      heightIn = longest;
      widthIn = longest * aspect;
    }
    return {
      widthIn: roundInches(widthIn),
      heightIn: roundInches(heightIn),
      quantity: input.quantity,
    };
  }

  if (input.quantity < 1 || !Number.isInteger(input.quantity)) {
    throw new Error("Quantity must be a positive integer");
  }
  let { widthIn, heightIn } = input;
  if (widthIn <= 0 || heightIn <= 0) {
    throw new Error("Custom dimensions must be positive");
  }
  if (input.lockAspect) {
    // Prefer width as driver when both provided; adjust height to aspect
    heightIn = widthIn / aspect;
  }
  return {
    widthIn: roundInches(widthIn),
    heightIn: roundInches(heightIn),
    quantity: input.quantity,
  };
}

export function computePrintedAreaSqIn(items: DesignItem[]): number {
  const area = items.reduce(
    (sum, item) => sum + item.widthIn * item.heightIn * item.quantity,
    0,
  );
  return roundInches(area);
}

export function computePriceCents(
  areaSqIn: number,
  pricePerSqIn: number = DEFAULT_PRICE_PER_SQ_IN,
): number {
  if (areaSqIn < 0) throw new Error("Area cannot be negative");
  if (pricePerSqIn < 0) throw new Error("Price cannot be negative");
  return Math.round(areaSqIn * pricePerSqIn * 100);
}

export function buildPricingSnapshot(
  items: DesignItem[],
  pricePerSqIn: number = DEFAULT_PRICE_PER_SQ_IN,
): PricingSnapshot {
  const areaSqIn = computePrintedAreaSqIn(items);
  return {
    currency: "USD",
    pricePerSqIn,
    areaSqIn,
    totalCents: computePriceCents(areaSqIn, pricePerSqIn),
  };
}

/** Gang sheet products may use a fixed Shopify variant price instead of area pricing. */
export function buildGangSheetPricingSnapshot(
  items: DesignItem[],
  options: {
    pricePerSqIn?: number;
    variantPriceCents?: number | null;
  },
): PricingSnapshot {
  const areaSqIn = computePrintedAreaSqIn(items);
  if (options.variantPriceCents != null && options.variantPriceCents >= 0) {
    return {
      currency: "USD",
      pricePerSqIn: options.pricePerSqIn ?? DEFAULT_PRICE_PER_SQ_IN,
      areaSqIn,
      totalCents: options.variantPriceCents,
    };
  }
  return buildPricingSnapshot(items, options.pricePerSqIn ?? DEFAULT_PRICE_PER_SQ_IN);
}

/** Server-side verification: recomputed total must match client claim within 0¢ (exact). */
export function assertPriceMatches(
  items: DesignItem[],
  claimedTotalCents: number,
  pricePerSqIn: number = DEFAULT_PRICE_PER_SQ_IN,
): PricingSnapshot {
  const snapshot = buildPricingSnapshot(items, pricePerSqIn);
  if (snapshot.totalCents !== claimedTotalCents) {
    throw new Error(
      `Price mismatch: claimed ${claimedTotalCents}, server ${snapshot.totalCents}`,
    );
  }
  return snapshot;
}
