/**
 * End-to-end API flow against the running shopify app dev tunnel.
 * Synthetic artwork only.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";

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
};

function signDownload(objectKey) {
  const exp = Math.floor(Date.now() / 1000) + 300;
  const payload = `${shop}\n${objectKey}\n${exp}`;
  const sig = createHmac("sha256", signing).update(payload).digest("base64url");
  const tokenBody = Buffer.from(
    JSON.stringify({ shop, objectKey, exp, sig }),
    "utf8",
  ).toString("base64url");
  return tokenBody;
}

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
  form.append("file", new Blob([png], { type: "image/png" }), "synth.png");

  const up = await fetch(`${base}/api/uploads`, { method: "POST", headers, body: form });
  const upJson = await up.json();
  if (!up.ok) throw new Error(`upload failed: ${JSON.stringify(upJson)}`);

  const designRes = await fetch(`${base}/api/designs`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      assetId: upJson.assetId,
      size: { mode: "preset", presetId: "4in", quantity: 2 },
      productGid: "gid://shopify/Product/0",
    }),
  });
  const designJson = await designRes.json();
  if (!designRes.ok) throw new Error(`design failed: ${JSON.stringify(designJson)}`);

  const prisma = new PrismaClient();
  const orderId = `test-${Date.now()}`;
  const link = await prisma.orderLink.create({
    data: {
      shop,
      orderId,
      lineItemId: "li-1",
      designId: designJson.designId,
      designVersion: designJson.version,
    },
  });
  await prisma.renderJob.create({
    data: {
      shop,
      designId: designJson.designId,
      orderLinkId: link.id,
      status: "queued",
    },
  });
  await prisma.design.update({
    where: { id: designJson.designId },
    data: { status: "processing" },
  });

  // Simulate duplicate webhook idempotency via WebhookDelivery
  await prisma.webhookDelivery.create({
    data: {
      shop,
      topic: "orders/paid",
      webhookId: `wh-${orderId}`,
      orderId,
      payloadHash: "e2e",
      idempotencyKey: `${shop}:wh-${orderId}`,
      status: "processed",
    },
  });
  const dup = await prisma.webhookDelivery.findUnique({
    where: { idempotencyKey: `${shop}:wh-${orderId}` },
  });

  const tick = await fetch(`${base}/api/worker/tick`, {
    method: "POST",
    headers: { "X-LGS-Test-Token": token },
  });
  const tickJson = await tick.json();
  if (!tick.ok) throw new Error(`worker failed: ${JSON.stringify(tickJson)}`);

  const job = await prisma.renderJob.findFirst({
    where: { designId: designJson.designId },
    orderBy: { createdAt: "desc" },
  });

  let downloadOk = false;
  let meta = null;
  if (job?.status === "completed" && job.outputKey) {
    const dl = signDownload(job.outputKey);
    const dlRes = await fetch(
      `${base}/api/files/download?token=${encodeURIComponent(dl)}`,
    );
    downloadOk = dlRes.ok;
    if (dlRes.ok) {
      const buf = Buffer.from(await dlRes.arrayBuffer());
      const outPath = path.join("storage", "local", "_e2e-last.png");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, buf);
      meta = await sharp(buf).metadata();
    }
  }

  await prisma.$disconnect();

  console.log(
    JSON.stringify(
      {
        ok: job?.status === "completed" && downloadOk && Boolean(dup),
        designId: designJson.designId,
        cartProperties: designJson.cartProperties,
        priceCents: designJson.state.pricing.totalCents,
        areaSqIn: designJson.state.pricing.areaSqIn,
        jobStatus: job?.status,
        lastError: job?.lastError ?? null,
        widthPx: job?.widthPx,
        heightPx: job?.heightPx,
        sheetIn: { w: job?.sheetWidthIn, h: job?.sheetHeightIn },
        downloadOk,
        webhookIdempotentRow: Boolean(dup),
        png: meta
          ? { width: meta.width, height: meta.height, hasAlpha: meta.hasAlpha }
          : null,
        worker: tickJson,
      },
      null,
      2,
    ),
  );

  if (!(job?.status === "completed" && downloadOk)) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
