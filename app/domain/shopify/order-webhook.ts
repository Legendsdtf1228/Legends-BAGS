import {
  CART_DESIGN_ID_PROPERTY,
  CART_DESIGN_VERSION_PROPERTY,
} from "../design/types";
import {
  CART_BUILDER_TYPE_PROPERTY,
  CART_PRICE_REF_PROPERTY,
  CART_SHEET_HEIGHT_PROPERTY,
  CART_SHEET_WIDTH_PROPERTY,
  CART_WORKFLOW_PROPERTY,
  readLineProperty,
  type ShopifyLineItem,
} from "./line-properties";

export type ParsedOrderDesignLine = {
  lineItemId: string;
  designId: string;
  designVersion?: number;
  priceRef?: string;
  builderType?: string;
  sheetWidthIn?: number;
  sheetHeightIn?: number;
  quantity: number;
  productGid?: string;
  variantGid?: string;
};

export type ShopifyOrderWebhookPayload = {
  id?: number | string;
  name?: string;
  order_number?: number | string;
  admin_graphql_api_id?: string;
  financial_status?: string;
  fulfillment_status?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  processed_at?: string | null;
  customer?: {
    id?: number | string;
    admin_graphql_api_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  line_items?: Array<
    ShopifyLineItem & {
      quantity?: number;
      product_id?: number | string;
      variant_id?: number | string;
      admin_graphql_api_id?: string;
    }
  >;
};

function toGid(kind: "Product" | "ProductVariant", id: number | string | undefined) {
  if (id == null || id === "") return undefined;
  const raw = String(id);
  if (raw.startsWith("gid://")) return raw;
  const numeric = raw.replace(/\D/g, "");
  if (!numeric) return undefined;
  return `gid://shopify/${kind}/${numeric}`;
}

function parseFloatProp(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseOrderDesignLines(
  lineItems: ShopifyOrderWebhookPayload["line_items"],
): ParsedOrderDesignLine[] {
  if (!lineItems?.length) return [];

  return lineItems
    .map((li) => {
      const designId = readLineProperty(li.properties, CART_DESIGN_ID_PROPERTY);
      if (!designId) return null;

      const versionRaw = readLineProperty(li.properties, CART_DESIGN_VERSION_PROPERTY);
      const builderType =
        readLineProperty(li.properties, CART_BUILDER_TYPE_PROPERTY) ??
        readLineProperty(li.properties, CART_WORKFLOW_PROPERTY);

      return {
        lineItemId: String(li.admin_graphql_api_id ?? li.id),
        designId,
        designVersion: versionRaw ? Number(versionRaw) : undefined,
        priceRef: readLineProperty(li.properties, CART_PRICE_REF_PROPERTY),
        builderType: builderType || undefined,
        sheetWidthIn: parseFloatProp(readLineProperty(li.properties, CART_SHEET_WIDTH_PROPERTY)),
        sheetHeightIn: parseFloatProp(readLineProperty(li.properties, CART_SHEET_HEIGHT_PROPERTY)),
        quantity: Math.max(1, Number(li.quantity) || 1),
        productGid: toGid("Product", li.product_id),
        variantGid: toGid("ProductVariant", li.variant_id),
      };
    })
    .filter(Boolean) as ParsedOrderDesignLine[];
}

export function orderCustomerFields(payload: ShopifyOrderWebhookPayload) {
  const customer = payload.customer;
  if (!customer) {
    return {
      customerGid: undefined,
      customerEmail: undefined,
      customerName: undefined,
    };
  }

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  return {
    customerGid:
      customer.admin_graphql_api_id ??
      (customer.id != null ? `gid://shopify/Customer/${customer.id}` : undefined),
    customerEmail: customer.email ?? undefined,
    customerName: name || undefined,
  };
}

export function orderNumberFromPayload(payload: ShopifyOrderWebhookPayload): string | undefined {
  if (payload.name) return payload.name;
  if (payload.order_number != null) return `#${payload.order_number}`;
  return undefined;
}

export function paidAtFromPayload(payload: ShopifyOrderWebhookPayload): Date | undefined {
  if (payload.financial_status !== "paid") return undefined;
  const raw = payload.processed_at ?? payload.created_at;
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function cancelledAtFromPayload(payload: ShopifyOrderWebhookPayload): Date | undefined {
  if (!payload.cancelled_at) return undefined;
  const date = new Date(payload.cancelled_at);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
