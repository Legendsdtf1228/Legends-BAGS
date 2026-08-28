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
