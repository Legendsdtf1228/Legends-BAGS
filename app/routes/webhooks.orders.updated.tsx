import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { hashPayload } from "../domain/design/pipeline";
import { webhookIdempotencyKey } from "../domain/jobs";
import {
  CART_DESIGN_ID_PROPERTY,
  CART_DESIGN_VERSION_PROPERTY,
} from "../domain/design/types";
import { linkOrderToDesigns } from "../services/design-service";

type ShopifyLineItem = {
  id: number | string;
  properties?: Array<{ name: string; value: string }> | Record<string, string>;
};

function readProperty(
  properties: ShopifyLineItem["properties"],
  key: string,
): string | undefined {
  if (!properties) return undefined;
  if (Array.isArray(properties)) {
    return properties.find((p) => p.name === key)?.value;
  }
  return properties[key];
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  const raw = JSON.stringify(payload);
  const payloadHash = hashPayload(raw);
  const order = payload as {
    id?: number | string;
    admin_graphql_api_id?: string;
    line_items?: ShopifyLineItem[];
  };

  const webhookId = request.headers.get("X-Shopify-Webhook-Id");
  const orderId = order.id != null ? String(order.id) : undefined;
  if (!orderId) return new Response("Ignored", { status: 200 });

  const lines =
    order.line_items
      ?.map((li) => {
        const designId = readProperty(li.properties, CART_DESIGN_ID_PROPERTY);
        if (!designId) return null;
        const versionRaw = readProperty(
          li.properties,
          CART_DESIGN_VERSION_PROPERTY,
        );
        return {
          lineItemId: String(li.id),
          designId,
          designVersion: versionRaw ? Number(versionRaw) : undefined,
        };
      })
      .filter(Boolean) ?? [];

  await linkOrderToDesigns({
    shop,
    orderId,
    orderGid: order.admin_graphql_api_id,
    lines: lines as Array<{
      lineItemId: string;
      designId: string;
      designVersion?: number;
    }>,
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
