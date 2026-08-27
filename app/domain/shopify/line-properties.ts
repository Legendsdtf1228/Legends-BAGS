import {
  CART_DESIGN_ID_PROPERTY,
  CART_DESIGN_VERSION_PROPERTY,
  type DesignStateV1,
} from "../design/types";
import { signDesignAccess, signPriceRef } from "../security/design-access";

export const CART_WORKFLOW_PROPERTY = "_lgs_workflow" as const;
export const CART_SHEET_SIZE_PROPERTY = "_lgs_sheet_size" as const;
export const CART_PIECE_COUNT_PROPERTY = "_lgs_piece_count" as const;
export const CART_DESIGN_NAME_PROPERTY = "Design" as const;
export const CART_PRICE_REF_PROPERTY = "_lgs_price_ref" as const;
export const CART_DESIGN_TOKEN_PROPERTY = "_lgs_design_token" as const;

export type ShopifyLineItem = {
  id: number | string;
  properties?: Array<{ name: string; value: string }> | Record<string, string>;
};

export function readLineProperty(
  properties: ShopifyLineItem["properties"],
  key: string,
): string | undefined {
  if (!properties) return undefined;
  if (Array.isArray(properties)) {
    return properties.find((p) => p.name === key)?.value;
  }
  return properties[key];
}

export function extractDesignLines(lineItems: ShopifyLineItem[] | undefined) {
  if (!lineItems?.length) return [];
  return lineItems
    .map((li) => {
      const designId = readLineProperty(li.properties, CART_DESIGN_ID_PROPERTY);
      if (!designId) return null;
      const versionRaw = readLineProperty(
        li.properties,
        CART_DESIGN_VERSION_PROPERTY,
      );
      return {
        lineItemId: String(li.id),
        designId,
        designVersion: versionRaw ? Number(versionRaw) : undefined,
        priceRef: readLineProperty(li.properties, CART_PRICE_REF_PROPERTY),
      };
    })
    .filter(Boolean) as Array<{
    lineItemId: string;
    designId: string;
    designVersion?: number;
    priceRef?: string;
  }>;
}

export function sheetSizeLabel(state: DesignStateV1): string {
  const w = state.sheet.widthIn;
  const h = state.sheet.maxHeightIn;
  return `${w}″ × ${h}″`;
}

export function pieceCount(state: DesignStateV1): number {
  return state.items.reduce((n, i) => n + (i.quantity || 1), 0);
}

export function workflowLabel(workflow: DesignStateV1["workflow"]): string {
  return workflow === "gang_sheet" ? "Gang Sheet" : "Upload by Size";
}

/** Customer-visible cart line properties + hidden verification refs. */
export function buildCartLineProperties(params: {
  shop: string;
  designId: string;
  version: number;
  state: DesignStateV1;
  designName?: string | null;
}): Record<string, string> {
  const { shop, designId, version, state, designName } = params;
  const priceRef = signPriceRef({
    shop,
    designId,
    version,
    priceCents: state.pricing.totalCents,
  });
  const { token: designToken } = signDesignAccess({ shop, designId, version });
  const props: Record<string, string> = {
    [CART_DESIGN_ID_PROPERTY]: designId,
    [CART_DESIGN_VERSION_PROPERTY]: String(version),
    [CART_WORKFLOW_PROPERTY]: state.workflow,
    [CART_SHEET_SIZE_PROPERTY]: sheetSizeLabel(state),
    [CART_PIECE_COUNT_PROPERTY]: String(pieceCount(state)),
    [CART_PRICE_REF_PROPERTY]: priceRef,
    [CART_DESIGN_TOKEN_PROPERTY]: designToken,
  };
  if (designName?.trim()) {
    props[CART_DESIGN_NAME_PROPERTY] = designName.trim();
  }
  return props;
}
