import prisma from "../db.server";
import type { authenticate } from "../shopify.server";
import type { ShopifyOrderWebhookPayload } from "../domain/shopify/order-webhook";
import { ingestShopifyOrderWebhook } from "../lib/order-webhook.server";

type AdminClient = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

const ORDERS_PAGE = `#graphql
  query LegendsBagsRecentOrders($cursor: String) {
    orders(first: 25, after: $cursor, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        legacyResourceId
        displayFinancialStatus
        displayFulfillmentStatus
        processedAt
        cancelledAt
        customer {
          id
          legacyResourceId
          email
          firstName
          lastName
        }
        lineItems(first: 50) {
          nodes {
            id
            legacyResourceId
            quantity
            customAttributes {
              key
              value
            }
            product {
              legacyResourceId
            }
            variant {
              legacyResourceId
            }
          }
        }
      }
    }
  }
`;

function mapFinancialStatus(status: string | null | undefined): string | undefined {
  if (!status) return undefined;
  return status.toLowerCase().replace(/_/g, "_");
}

function toRestPayload(node: {
  id: string;
  name: string;
  legacyResourceId: string;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  processedAt?: string | null;
  cancelledAt?: string | null;
  customer?: {
    id: string;
    legacyResourceId?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  lineItems: {
    nodes: Array<{
      id: string;
      legacyResourceId?: string | null;
      quantity: number;
      customAttributes: Array<{ key: string; value: string }>;
      product?: { legacyResourceId?: string | null } | null;
      variant?: { legacyResourceId?: string | null } | null;
    }>;
  };
}): ShopifyOrderWebhookPayload {
  return {
    id: node.legacyResourceId,
    name: node.name,
    order_number: node.name?.replace("#", ""),
    admin_graphql_api_id: node.id,
    financial_status: mapFinancialStatus(node.displayFinancialStatus ?? undefined),
    fulfillment_status: node.displayFulfillmentStatus?.toLowerCase() ?? null,
    cancelled_at: node.cancelledAt ?? null,
    processed_at: node.processedAt ?? null,
    customer: node.customer
      ? {
          id: node.customer.legacyResourceId ?? node.customer.id,
          admin_graphql_api_id: node.customer.id,
          email: node.customer.email ?? undefined,
          first_name: node.customer.firstName ?? undefined,
          last_name: node.customer.lastName ?? undefined,
        }
      : null,
    line_items: node.lineItems.nodes.map((li) => ({
      id: li.legacyResourceId ?? li.id,
      admin_graphql_api_id: li.id,
      quantity: li.quantity,
      product_id: li.product?.legacyResourceId ?? undefined,
      variant_id: li.variant?.legacyResourceId ?? undefined,
      properties: li.customAttributes.map((a) => ({ name: a.key, value: a.value })),
    })),
  };
}

export async function importRecentShopifyOrders(params: {
  shop: string;
  admin: AdminClient;
  maxPages?: number;
}) {
  let cursor: string | null = null;
  let pages = 0;
  const maxPages = params.maxPages ?? 2;
  let imported = 0;
  let skipped = 0;

  while (pages < maxPages) {
    const res: Response = await params.admin.graphql(ORDERS_PAGE, { variables: { cursor } });
    const json = (await res.json()) as {
      data?: {
        orders?: {
          nodes?: Array<Parameters<typeof toRestPayload>[0]>;
          pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }

    const connection = json.data?.orders;
    if (!connection?.nodes?.length) break;

    for (const node of connection.nodes) {
      const payload = toRestPayload(node);
      const topic =
        payload.financial_status === "paid"
          ? "orders/paid"
          : payload.cancelled_at
            ? "orders/cancelled"
            : "orders/updated";
      const result = await ingestShopifyOrderWebhook({
        shop: params.shop,
        topic,
        payload,
        webhookId: `import:${node.id}`,
        enqueueRender: topic === "orders/paid",
      });
      if (result.ignored) skipped += 1;
      else imported += 1;
    }

    if (!connection.pageInfo?.hasNextPage) break;
    cursor = connection.pageInfo.endCursor ?? null;
    pages += 1;
  }

  await prisma.shopConfig.upsert({
    where: { shop: params.shop },
    create: { shop: params.shop, lastOrderSyncAt: new Date(), lastOrderSyncError: null },
    update: { lastOrderSyncAt: new Date(), lastOrderSyncError: null },
  });

  return { imported, skipped, pages: pages + 1 };
}
