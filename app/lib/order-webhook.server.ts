import { hashPayload } from "../domain/design/pipeline";
import { webhookIdempotencyKey } from "../domain/jobs";
import {
  cancelledAtFromPayload,
  orderCustomerFields,
  orderNumberFromPayload,
  paidAtFromPayload,
  parseOrderDesignLines,
  type ShopifyOrderWebhookPayload,
} from "../domain/shopify/order-webhook";
import { linkOrderToDesigns } from "../services/design-service";

export async function ingestShopifyOrderWebhook(params: {
  shop: string;
  topic: string;
  payload: ShopifyOrderWebhookPayload;
  webhookId?: string | null;
  enqueueRender: boolean;
}) {
  const raw = JSON.stringify(params.payload);
  const payloadHash = hashPayload(raw);
  const orderId = params.payload.id != null ? String(params.payload.id) : undefined;
  if (!orderId) {
    return { ignored: true as const };
  }

  const lines = parseOrderDesignLines(params.payload.line_items);
  if (!lines.length) {
    return { ignored: true as const, reason: "no_design_lines" as const };
  }

  const customer = orderCustomerFields(params.payload);
  const result = await linkOrderToDesigns({
    shop: params.shop,
    orderId,
    orderGid: params.payload.admin_graphql_api_id,
    orderNumber: orderNumberFromPayload(params.payload),
    financialStatus: params.payload.financial_status,
    fulfillmentStatus: params.payload.fulfillment_status,
    paidAt: paidAtFromPayload(params.payload),
    cancelledAt: cancelledAtFromPayload(params.payload),
    customerGid: customer.customerGid,
    customerEmail: customer.customerEmail,
    customerName: customer.customerName,
    lines,
    idempotencyKey: webhookIdempotencyKey({
      shop: params.shop,
      webhookId: params.webhookId,
      topic: params.topic,
      payloadHash,
    }),
    topic: params.topic,
    webhookId: params.webhookId ?? undefined,
    payloadHash,
    enqueueRender: params.enqueueRender,
  });

  return { ignored: false as const, ...result };
}
