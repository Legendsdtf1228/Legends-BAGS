/**
 * Checkout path smoke test: design API → linkOrderToDesigns (webhook handler logic).
 */
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { linkOrderToDesigns, processNextRenderJob } from "../app/services/design-service";
import { buildCartLineProperties, CART_PRICE_REF_PROPERTY } from "../app/domain/shopify/line-properties";
import {
  CART_DESIGN_ID_PROPERTY,
  CART_DESIGN_VERSION_PROPERTY,
  type DesignStateV1,
} from "../app/domain/design/types";

const base = process.env.LGS_APP_URL;
const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const token = process.env.TEST_API_TOKEN;
const signing = process.env.FILE_SIGNING_SECRET;

if (!base || !token || !signing) {
  console.error("Set LGS_APP_URL, TEST_API_TOKEN, FILE_SIGNING_SECRET");
  process.exit(1);
}

const headers = {
  "X-LGS-Shop": shop,
  "X-LGS-Test-Token": token,
  "X-LGS-Customer-Key": "guest:e2e-checkout",
};

async function main() {
  const png = await sharp({
    create: {
      width: 120,
      height: 60,
      channels: 4,
      background: { r: 0, g: 128, b: 255, alpha: 0.6 },
    },
  })
    .png()
    .toBuffer();

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), "synth.png");
  const up = await fetch(`${base}/api/uploads`, { method: "POST", headers, body: form });
  const upJson = (await up.json()) as { assetId?: string; error?: string };
  if (!up.ok || !upJson.assetId) throw new Error(`upload failed: ${JSON.stringify(upJson)}`);

  const designRes = await fetch(`${base}/api/designs`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      assetId: upJson.assetId,
      size: { mode: "preset", presetId: "4in", quantity: 1 },
      productGid: "gid://shopify/Product/0",
    }),
  });
  const designJson = (await designRes.json()) as {
    designId?: string;
    version?: number;
    state?: DesignStateV1;
    cartProperties?: Record<string, string>;
    error?: string;
  };
  if (!designRes.ok || !designJson.designId || !designJson.version || !designJson.state) {
    throw new Error(`design failed: ${JSON.stringify(designJson)}`);
  }

  const cartProperties =
    designJson.cartProperties ??
    buildCartLineProperties({
      shop,
      designId: designJson.designId,
      version: designJson.version,
      state: designJson.state,
    });

  const orderId = `e2e-checkout-${Date.now()}`;
  const lineItemId = "10001";
  const result = await linkOrderToDesigns({
    shop,
    orderId,
    orderGid: `gid://shopify/Order/${orderId}`,
    lines: [
      {
        lineItemId,
        designId: designJson.designId,
        designVersion: designJson.version,
        priceRef: cartProperties[CART_PRICE_REF_PROPERTY],
      },
    ],
    idempotencyKey: `e2e-checkout:${orderId}`,
    topic: "orders/paid",
    payloadHash: "e2e-checkout",
  });

  if (!result.linked.length) {
    throw new Error("linkOrderToDesigns did not link any designs");
  }

  if (process.env.RENDER_INLINE_ON_WEBHOOK === "1") {
    await processNextRenderJob();
  }

  const prisma = new PrismaClient();
  const design = await prisma.design.findFirst({ where: { id: designJson.designId, shop } });
  const orderLink = await prisma.orderLink.findFirst({
    where: { shop, orderId, designId: designJson.designId },
  });
  await prisma.$disconnect();

  if (design?.status !== "ordered") {
    throw new Error(`Expected design status ordered, got ${design?.status}`);
  }
  if (!orderLink) {
    throw new Error("OrderLink row missing");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        orderId,
        designId: designJson.designId,
        version: designJson.version,
        designStatus: design.status,
        orderLinkId: orderLink.id,
        cartProperties: {
          [CART_DESIGN_ID_PROPERTY]: cartProperties[CART_DESIGN_ID_PROPERTY],
          [CART_DESIGN_VERSION_PROPERTY]: cartProperties[CART_DESIGN_VERSION_PROPERTY],
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
