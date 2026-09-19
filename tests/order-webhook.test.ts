import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  orderCustomerFields,
  orderNumberFromPayload,
  parseOrderDesignLines,
  shouldEnqueueOrderRender,
} from "../app/domain/shopify/order-webhook";

const linkOrderToDesigns = vi.hoisted(() => vi.fn());

vi.mock("../app/services/design-service", () => ({
  linkOrderToDesigns: (...args: unknown[]) => linkOrderToDesigns(...args),
}));

describe("parseOrderDesignLines", () => {
  it("extracts design metadata from line item properties", () => {
    const lines = parseOrderDesignLines([
      {
        id: 1001,
        admin_graphql_api_id: "gid://shopify/LineItem/1001",
        product_id: 200,
        variant_id: 300,
        quantity: 2,
        properties: [
          { name: "_lgs_design_id", value: "des_test" },
          { name: "_lgs_design_version", value: "4" },
          { name: "_lgs_builder_type", value: "gang_sheet" },
          { name: "_lgs_sheet_width", value: "22.5" },
          { name: "_lgs_sheet_height", value: "24" },
          { name: "_lgs_price_ref", value: "signed" },
        ],
      },
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      lineItemId: "gid://shopify/LineItem/1001",
      designId: "des_test",
      designVersion: 4,
      builderType: "gang_sheet",
      sheetWidthIn: 22.5,
      sheetHeightIn: 24,
      quantity: 2,
      productGid: "gid://shopify/Product/200",
      variantGid: "gid://shopify/ProductVariant/300",
    });
  });

  it("ignores unrelated line items", () => {
    expect(parseOrderDesignLines([{ id: 1, properties: [] }])).toEqual([]);
  });
});

describe("order payload helpers", () => {
  it("builds order number and customer fields", () => {
    expect(orderNumberFromPayload({ name: "#1042", order_number: 1042 })).toBe("#1042");
    expect(
      orderCustomerFields({
        customer: {
          id: 9,
          email: "buyer@example.com",
          first_name: "Alex",
          last_name: "Rivera",
        },
      }),
    ).toMatchObject({
      customerEmail: "buyer@example.com",
      customerName: "Alex Rivera",
      customerGid: "gid://shopify/Customer/9",
    });
  });
});

describe("shouldEnqueueOrderRender", () => {
  it("enqueues on paid and paid-create backup only", () => {
    expect(shouldEnqueueOrderRender("orders/paid")).toBe(true);
    expect(shouldEnqueueOrderRender("ORDERS_PAID")).toBe(true);
    expect(shouldEnqueueOrderRender("orders/create", "paid")).toBe(true);
    expect(shouldEnqueueOrderRender("ORDERS_CREATE", "paid")).toBe(true);
    expect(shouldEnqueueOrderRender("orders/create", "pending")).toBe(false);
    expect(shouldEnqueueOrderRender("orders/updated", "paid")).toBe(false);
    expect(shouldEnqueueOrderRender("orders/cancelled")).toBe(false);
  });
});

describe("ingestShopifyOrderWebhook", () => {
  beforeEach(() => {
    linkOrderToDesigns.mockReset();
    linkOrderToDesigns.mockResolvedValue({ duplicate: false, linked: ["des_test"] });
  });

  it("links design lines and enqueues render for orders/paid", async () => {
    const { ingestShopifyOrderWebhook } = await import("../app/lib/order-webhook.server");
    const result = await ingestShopifyOrderWebhook({
      shop: "legends-bags-in2lwdll.myshopify.com",
      topic: "orders/paid",
      webhookId: "wh-paid-1",
      payload: {
        id: 9001,
        financial_status: "paid",
        line_items: [
          {
            id: 11,
            properties: [
              { name: "_lgs_design_id", value: "des_test" },
              { name: "_lgs_design_version", value: "2" },
              { name: "_lgs_price_ref", value: "signed" },
            ],
          },
        ],
      },
    });

    expect(result.ignored).toBe(false);
    expect(linkOrderToDesigns).toHaveBeenCalledOnce();
    expect(linkOrderToDesigns.mock.calls[0][0]).toMatchObject({
      shop: "legends-bags-in2lwdll.myshopify.com",
      orderId: "9001",
      enqueueRender: true,
      topic: "orders/paid",
      webhookId: "wh-paid-1",
    });
    expect(linkOrderToDesigns.mock.calls[0][0].idempotencyKey).toBe(
      "legends-bags-in2lwdll.myshopify.com:wh-paid-1",
    );
  });

  it("is idempotent when linkOrderToDesigns reports a duplicate delivery", async () => {
    linkOrderToDesigns.mockResolvedValue({ duplicate: true, linked: [] });
    const { ingestShopifyOrderWebhook } = await import("../app/lib/order-webhook.server");
    const result = await ingestShopifyOrderWebhook({
      shop: "legends-bags-in2lwdll.myshopify.com",
      topic: "orders/paid",
      webhookId: "wh-paid-dup",
      payload: {
        id: 9002,
        financial_status: "paid",
        line_items: [{ id: 11, properties: { _lgs_design_id: "des_test" } }],
      },
    });
    expect(result).toMatchObject({ ignored: false, duplicate: true, linked: [] });
  });

  it("enqueues render on orders/create only when already paid", async () => {
    const { ingestShopifyOrderWebhook } = await import("../app/lib/order-webhook.server");
    await ingestShopifyOrderWebhook({
      shop: "legends-bags-in2lwdll.myshopify.com",
      topic: "orders/create",
      webhookId: "wh-create-paid",
      payload: {
        id: 9003,
        financial_status: "paid",
        line_items: [{ id: 11, properties: { _lgs_design_id: "des_test" } }],
      },
    });
    expect(linkOrderToDesigns.mock.calls[0][0].enqueueRender).toBe(true);

    linkOrderToDesigns.mockClear();
    await ingestShopifyOrderWebhook({
      shop: "legends-bags-in2lwdll.myshopify.com",
      topic: "orders/create",
      webhookId: "wh-create-pending",
      payload: {
        id: 9004,
        financial_status: "pending",
        line_items: [{ id: 11, properties: { _lgs_design_id: "des_test" } }],
      },
    });
    expect(linkOrderToDesigns.mock.calls[0][0].enqueueRender).toBe(false);
  });

  it("ignores orders with no design line properties", async () => {
    const { ingestShopifyOrderWebhook } = await import("../app/lib/order-webhook.server");
    const result = await ingestShopifyOrderWebhook({
      shop: "legends-bags-in2lwdll.myshopify.com",
      topic: "orders/paid",
      payload: { id: 1, line_items: [{ id: 2, properties: [] }] },
    });
    expect(result).toEqual({ ignored: true, reason: "no_design_lines" });
    expect(linkOrderToDesigns).not.toHaveBeenCalled();
  });
});

describe("order webhook routes", () => {
  it("verify Shopify HMAC via authenticate.webhook before ingest", () => {
    const routes = [
      "app/routes/webhooks.orders.paid.tsx",
      "app/routes/webhooks.orders.create.tsx",
      "app/routes/webhooks.orders.updated.tsx",
    ];
    for (const relative of routes) {
      const src = readFileSync(join(process.cwd(), relative), "utf8");
      expect(src).toContain("authenticate.webhook(request)");
      expect(src).toContain("ingestShopifyOrderWebhook");
      expect(src).toContain("X-Shopify-Webhook-Id");
    }
  });
});
