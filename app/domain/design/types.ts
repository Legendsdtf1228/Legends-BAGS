/** Design state schema — frozen Phase 1 contract. schemaVersion bumps require ADR. */

export const DESIGN_STATE_SCHEMA_VERSION = 1 as const;
export const OUTPUT_DPI = 300 as const;
export const CART_DESIGN_ID_PROPERTY = "_lgs_design_id" as const;
export const CART_DESIGN_VERSION_PROPERTY = "_lgs_design_version" as const;

export type Workflow = "upload_by_size";

export type SheetConfig = {
  widthIn: number;
  maxHeightIn: number;
  imageMarginIn: number;
  artboardMarginIn: number;
};

export type DesignItem = {
  assetId: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
  /** Preferred rotation hint; nesting may override when allowRotate90 is true */
  rotationDeg: 0 | 90;
};

export type PricingSnapshot = {
  currency: "USD";
  pricePerSqIn: number;
  areaSqIn: number;
  totalCents: number;
};

export type DesignStateV1 = {
  schemaVersion: typeof DESIGN_STATE_SCHEMA_VERSION;
  workflow: Workflow;
  sheet: SheetConfig;
  items: DesignItem[];
  pricing: PricingSnapshot;
  /** When true, nesting may rotate items by 90° to improve pack */
  allowRotate90?: boolean;
};

export const DEFAULT_UPLOAD_BY_SIZE_SHEET: SheetConfig = {
  widthIn: 22.5,
  maxHeightIn: 360,
  imageMarginIn: 0.15,
  artboardMarginIn: 0.1,
};

export const DEFAULT_PRICE_PER_SQ_IN = 0.049;

/** Named presets — longest-side sizing (matches live Upload-by-Size behavior). */
export const SIZE_PRESETS: Record<
  string,
  { label: string; longestSideIn: number }
> = {
  "2in": { label: '2"', longestSideIn: 2 },
  "3in": { label: '3"', longestSideIn: 3 },
  "4in": { label: '4"', longestSideIn: 4 },
  "5in": { label: '5"', longestSideIn: 5 },
  "6in": { label: '6"', longestSideIn: 6 },
  "8in": { label: '8"', longestSideIn: 8 },
  "10in": { label: '10"', longestSideIn: 10 },
  "12in": { label: '12"', longestSideIn: 12 },
  "14in": { label: '14"', longestSideIn: 14 },
  "16in": { label: '16"', longestSideIn: 16 },
};

export function inchesToPx(inches: number, dpi: number = OUTPUT_DPI): number {
  return Math.round(inches * dpi);
}

export function pxToInches(px: number, dpi: number = OUTPUT_DPI): number {
  return px / dpi;
}

export function assertDesignStateV1(state: unknown): DesignStateV1 {
  if (!state || typeof state !== "object") {
    throw new Error("Invalid design state");
  }
  const s = state as DesignStateV1;
  if (s.schemaVersion !== 1 || s.workflow !== "upload_by_size") {
    throw new Error("Unsupported design state version");
  }
  if (!Array.isArray(s.items) || s.items.length === 0) {
    throw new Error("Design state requires at least one item");
  }
  return s;
}
