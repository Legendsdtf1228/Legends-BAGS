import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { hashPayload } from "../domain/design/pipeline";
import { webhookIdempotencyKey } from "../domain/jobs";
import { extractDesignLines } from "../domain/shopify/line-properties";
import { linkOrderToDesigns } from "../services/design-service";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  const raw = JSON.stringify(payload);
  const payloadHash = hashPayload(raw);
  const order = payload as {
    id?: number | string;
    admin_graphql_api_id?: string;
    line_items?: Parameters<typeof extractDesignLines>[0];
  };

  const webhookId = request.headers.get("X-Shopify-Webhook-Id");
  const orderId = order.id != null ? String(order.id) : undefined;
  if (!orderId) return new Response("Ignored", { status: 200 });

  const lines = extractDesignLines(order.line_items);

  await linkOrderToDesigns({
    shop,
    orderId,
    orderGid: order.admin_graphql_api_id,
    lines,
    idempotencyKey: webhookIdempotencyKey({
      shop,
      webhookId,
      topic,
      payloadHash,
    }),
    topic,
    webhookId: webhookId ?? undefined,
    payloadHash,
  });

  return new Response();
};
