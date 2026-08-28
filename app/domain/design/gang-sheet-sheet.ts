/** Supported gang sheet length presets (inches). */
export const GANG_SHEET_HEIGHTS = [
  24, 36, 48, 60, 72, 84, 96, 108, 132, 150, 168, 192, 250,
] as const;

export const GANG_SHEET_WIDTHS = [22.5, 24, 30] as const;

export const DEFAULT_GANG_SHEET_HEIGHT_IN = 24;

/** Roll cap for upload-by-size — must never be used as gang sheet canvas height. */
export const UPLOAD_BY_SIZE_ROLL_MAX_IN = 360;

export type GangSheetVariantBinding = {
  sheetHeightIn?: number | null;
  variantGid?: string | null;
};

export function isGangSheetHeightIn(h: number | null | undefined): h is number {
  return (
    h != null &&
    Number.isFinite(h) &&
    h >= 1 &&
    h <= GANG_SHEET_HEIGHTS[GANG_SHEET_HEIGHTS.length - 1]
  );
}

/**
 * Resolve the gang sheet canvas height from bindings.
 * Never treats upload-by-size roll max (360 in) as a canvas height.
 */
export function resolveGangSheetHeight(params: {
  variantId?: string | null;
  bindingSheetHeightIn?: number | null;
  bindingMaxHeightIn?: number | null;
  gangSheetVariants?: GangSheetVariantBinding[];
}): number {
  const { variantId, bindingSheetHeightIn, bindingMaxHeightIn, gangSheetVariants = [] } = params;

  if (variantId && gangSheetVariants.length) {
    const suffix = `/${variantId}`;
    const byVariant = gangSheetVariants.find(
      (v) => v.variantGid?.endsWith(suffix) && isGangSheetHeightIn(v.sheetHeightIn),
    );
    if (byVariant?.sheetHeightIn != null) return byVariant.sheetHeightIn;
  }

  if (isGangSheetHeightIn(bindingSheetHeightIn)) return bindingSheetHeightIn;

  if (isGangSheetHeightIn(bindingMaxHeightIn)) return bindingMaxHeightIn;

  for (const v of gangSheetVariants) {
    if (isGangSheetHeightIn(v.sheetHeightIn)) return v.sheetHeightIn;
  }

  return DEFAULT_GANG_SHEET_HEIGHT_IN;
}

/** Gang sheet design state stores canvas length in sheet.maxHeightIn. */
export const DEFAULT_GANG_SHEET_ARTBOARD_MARGIN_IN = 0.125;

/** Migrate legacy 0.1″ default to BAGS 0.125″ unless the user chose another value. */
export function normalizeArtboardMarginIn(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return DEFAULT_GANG_SHEET_ARTBOARD_MARGIN_IN;
  if (Math.abs(value - 0.1) < 0.001) return DEFAULT_GANG_SHEET_ARTBOARD_MARGIN_IN;
  return value;
}

export function gangSheetDesignSheet(widthIn: number, heightIn: number) {
  return {
    widthIn,
    maxHeightIn: heightIn,
    imageMarginIn: 0.15,
    artboardMarginIn: DEFAULT_GANG_SHEET_ARTBOARD_MARGIN_IN,
  };
}

/** Restrict sheet width choices to the product binding (e.g. 22.5″ only). */
export function resolveAllowedSheetWidths(productWidthIn?: number | null): readonly number[] {
  if (productWidthIn != null && Number.isFinite(productWidthIn) && productWidthIn > 0) {
    const exact = GANG_SHEET_WIDTHS.find((w) => w === productWidthIn);
    return exact != null ? [exact] : [productWidthIn];
  }
  return GANG_SHEET_WIDTHS;
}

/** Restrict length presets to variants configured for this product when present. */
export function resolveAllowedSheetHeights(
  gangSheetVariants: GangSheetVariantBinding[] = [],
): readonly number[] {
  const fromVariants = gangSheetVariants
    .map((v) => v.sheetHeightIn)
    .filter(isGangSheetHeightIn);
  if (fromVariants.length) {
    return [...new Set(fromVariants)].sort((a, b) => a - b);
  }
  return GANG_SHEET_HEIGHTS;
}

export function gangSheetAreaPriceUsd(
  widthIn: number,
  heightIn: number,
  pricePerSqIn: number,
): number {
  return Math.round(widthIn * heightIn * pricePerSqIn * 100) / 100;
}

export type GangSheetVariantPriceBinding = {
  sheetHeightIn?: number | null;
  variantPriceCents?: number | null;
};

/** Normalize sheet height for stable variant lookup (DB floats vs UI integers). */
export function normalizeSheetHeightIn(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 1000) / 1000;
}

/** Resolve configured flat variant price for the active sheet height. */
export function resolveGangSheetVariantPriceCents(params: {
  gangSheetVariants?: GangSheetVariantPriceBinding[];
  sheetHeightIn: number;
  fallbackVariantPriceCents?: number | null;
}): number | null {
  const { gangSheetVariants = [], sheetHeightIn, fallbackVariantPriceCents } = params;
  const targetHeight = normalizeSheetHeightIn(sheetHeightIn);
  const byHeight = gangSheetVariants.find((v) => {
    const h = normalizeSheetHeightIn(v.sheetHeightIn);
    return h != null && targetHeight != null && h === targetHeight;
  });
  if (byHeight?.variantPriceCents != null && byHeight.variantPriceCents >= 0) {
    return byHeight.variantPriceCents;
  }
  if (fallbackVariantPriceCents != null && fallbackVariantPriceCents >= 0) {
    return fallbackVariantPriceCents;
  }
  const firstPriced = gangSheetVariants.find(
    (v) => v.variantPriceCents != null && v.variantPriceCents >= 0,
  );
  return firstPriced?.variantPriceCents ?? null;
}
