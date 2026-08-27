import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { hashPayload } from "../domain/design/pipeline";
import { webhookIdempotencyKey } from "../domain/jobs";
import prisma from "../db.server";
import { applyShopifyProductWebhook } from "../services/shopify-product-sync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  const raw = JSON.stringify(payload);
  const payloadHash = hashPayload(raw);
  const webhookId = request.headers.get("X-Shopify-Webhook-Id");

  const idempotencyKey = webhookIdempotencyKey({
    shop,
    webhookId,
    topic,
    payloadHash,
  });

  const existing = await prisma.webhookDelivery.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    return new Response();
  }

  await applyShopifyProductWebhook({
    shop,
    topic,
    payload: payload as Parameters<typeof applyShopifyProductWebhook>[0]["payload"],
  });

  await prisma.webhookDelivery.create({
    data: {
      shop,
      topic,
      webhookId: webhookId ?? undefined,
      payloadHash,
      idempotencyKey,
      status: "processed",
    },
  });

  return new Response();
};
