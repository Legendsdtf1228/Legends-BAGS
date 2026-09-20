/**
 * Register tunnel-backed, shop-specific webhooks for a development store.
 * Production should use app-specific subscriptions from shopify.app.toml.
 */
/* global process */
import { PrismaClient } from "@prisma/client";

const shop = process.env.DEV_SHOP;
const base = (process.env.LGS_APP_URL || process.env.SHOPIFY_APP_URL)?.replace(/\/$/, "");
if (!shop || !base) {
  console.error("Set DEV_SHOP and LGS_APP_URL before running setup:dev-webhooks.");
  process.exit(1);
}
if (!base.startsWith("https://")) {
  console.error("Refusing to register dev webhooks without an HTTPS app URL.");
  process.exit(1);
}

const prisma = new PrismaClient();
const session = await prisma.session.findFirst({
  where: { shop, isOnline: false },
  orderBy: { expires: "desc" },
});
if (!session?.accessToken) {
  console.error(`No offline app session found for ${shop}. Open the app in Admin first.`);
  await prisma.$disconnect();
  process.exit(1);
}

async function graphql(query, variables = {}) {
  const response = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors || json));
  }
  return json.data;
}

const topics = [
  { topic: "ORDERS_CREATE", uri: `${base}/webhooks/orders/create` },
  { topic: "ORDERS_PAID", uri: `${base}/webhooks/orders/paid` },
  { topic: "ORDERS_UPDATED", uri: `${base}/webhooks/orders/updated` },
  { topic: "ORDERS_CANCELLED", uri: `${base}/webhooks/orders/cancelled` },
  { topic: "PRODUCTS_CREATE", uri: `${base}/webhooks/products` },
  { topic: "PRODUCTS_UPDATE", uri: `${base}/webhooks/products` },
  { topic: "PRODUCTS_DELETE", uri: `${base}/webhooks/products` },
];

const existing = await graphql(`#graphql
  query DevWebhookSubscriptions {
    webhookSubscriptions(first: 100, topics: [ORDERS_CREATE, ORDERS_PAID, ORDERS_UPDATED, ORDERS_CANCELLED, PRODUCTS_CREATE, PRODUCTS_UPDATE, PRODUCTS_DELETE]) {
      nodes { id topic uri }
    }
  }
`);

for (const wanted of topics) {
  const matches = existing.webhookSubscriptions.nodes.filter(
    (node) => node.topic === wanted.topic,
  );
  for (const node of matches) {
    await graphql(`#graphql
      mutation DeleteDevWebhook($id: ID!) {
        webhookSubscriptionDelete(id: $id) { deletedWebhookSubscriptionId userErrors { message } }
      }
    `, { id: node.id });
  }
  const created = await graphql(`#graphql
    mutation CreateDevWebhook($topic: WebhookSubscriptionTopic!, $input: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $input) {
        webhookSubscription { id topic uri }
        userErrors { field message }
      }
    }
  `, { topic: wanted.topic, input: { uri: wanted.uri, format: "JSON" } });
  const payload = created.webhookSubscriptionCreate;
  if (payload.userErrors.length || !payload.webhookSubscription) {
    throw new Error(JSON.stringify(payload.userErrors));
  }
  console.log(`${payload.webhookSubscription.topic} -> ${payload.webhookSubscription.uri}`);
}

await prisma.$disconnect();
