import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ingestShopifyOrderWebhook } from "../lib/order-webhook.server";
import type { ShopifyOrderWebhookPayload } from "../domain/shopify/order-webhook";
import { processNextRenderJob } from "../services/design-service";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  const webhookId = request.headers.get("X-Shopify-Webhook-Id");

  await ingestShopifyOrderWebhook({
    shop,
    topic,
    payload: payload as ShopifyOrderWebhookPayload,
    webhookId,
    enqueueRender: false,
  });

  return new Response();
};
