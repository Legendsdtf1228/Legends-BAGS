/**
 * Extended E2E: upload-by-size (multi + quote), gang sheet manual + auto nest preview, render.
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
  return Buffer.from(JSON.stringify({ shop, objectKey, exp, sig }), "utf8").toString(
    "base64url",
  );
}

async function synthPng(w, h) {
  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 128, b: 255, alpha: 0.6 },
    },
  })
    .png()
    .toBuffer();
}

async function uploadPng(buf, name) {
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/png" }), name);
  const up = await fetch(`${base}/api/uploads`, { method: "POST", headers, body: form });
  const json = await up.json();
  if (!up.ok) throw new Error(`upload failed: ${JSON.stringify(json)}`);
  return json;
}

async function renderDesign(designId, version) {
  const prisma = new PrismaClient();
  const orderId = `e2e-${designId.slice(-6)}-${Date.now()}`;
  const link = await prisma.orderLink.create({
    data: {
      shop,
      orderId,
      lineItemId: `li-${designId.slice(-4)}`,
      designId,
      designVersion: version,
    },
  });
  await prisma.renderJob.create({
    data: { shop, designId, orderLinkId: link.id, status: "queued" },
  });
  await prisma.design.update({
    where: { id: designId },
    data: { status: "processing" },
  });
  const tick = await fetch(`${base}/api/worker/tick`, {
    method: "POST",
    headers: { "X-LGS-Test-Token": token },
  });
  const tickJson = await tick.json();
  if (!tick.ok) throw new Error(`worker failed: ${JSON.stringify(tickJson)}`);
  const job = await prisma.renderJob.findFirst({
    where: { designId },
    orderBy: { createdAt: "desc" },
  });
  await prisma.$disconnect();
  return job;
}

async function main() {
  const results = {};

  // 1) Single upload-by-size (baseline)
  const png1 = await synthPng(120, 60);
  const a1 = await uploadPng(png1, "synth-a.png");
  const d1 = await (
    await fetch(`${base}/api/designs`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: a1.assetId,
        size: { mode: "preset", presetId: "4in", quantity: 2 },
      }),
    })
  ).json();
  if (!d1.designId) throw new Error(`single UBS failed: ${JSON.stringify(d1)}`);
  results.uploadBySizeSingle = {
    designId: d1.designId,
    priceCents: d1.state.pricing.totalCents,
    workflow: d1.state.workflow,
  };

  // 2) Multi upload + quote
  const png2 = await synthPng(200, 100);
  const a2 = await uploadPng(png2, "synth-b.png");
  const quote = await (
    await fetch(`${base}/api/quote`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        uploads: [
          { assetId: a1.assetId, size: { mode: "preset", presetId: "4in", quantity: 1 } },
          { assetId: a2.assetId, size: { mode: "preset", presetId: "6in", quantity: 1 } },
        ],
      }),
    })
  ).json();
  if (!quote.pricing) throw new Error(`quote failed: ${JSON.stringify(quote)}`);
  const dMulti = await (
    await fetch(`${base}/api/designs`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        uploads: [
          { assetId: a1.assetId, size: { mode: "preset", presetId: "4in", quantity: 1 } },
          { assetId: a2.assetId, size: { mode: "preset", presetId: "6in", quantity: 1 } },
        ],
      }),
    })
  ).json();
  if (!dMulti.designId) throw new Error(`multi UBS failed: ${JSON.stringify(dMulti)}`);
  results.uploadBySizeMulti = {
    designId: dMulti.designId,
    itemCount: dMulti.state.items.length,
    priceCents: dMulti.state.pricing.totalCents,
    quoteCents: quote.pricing.totalCents,
  };

  // 3) Nest preview (Auto Build path)
  const nest = await (
    await fetch(`${base}/api/nest/preview`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          { assetId: a1.assetId, widthIn: 4, heightIn: 2, quantity: 2, rotationDeg: 0 },
          { assetId: a2.assetId, widthIn: 5, heightIn: 2.5, quantity: 1, rotationDeg: 0 },
        ],
        sheet: {
          widthIn: 22.5,
          maxHeightIn: 48,
          imageMarginIn: 0.15,
          artboardMarginIn: 0.1,
        },
        allowRotate90: true,
      }),
    })
  ).json();
  if (!nest.placements?.length) throw new Error(`nest preview failed: ${JSON.stringify(nest)}`);
  results.nestPreview = {
    placements: nest.placements.length,
    sheetHeightIn: nest.sheetHeightIn,
  };

  // 4) Gang sheet manual layout
  const dGs = await (
    await fetch(`${base}/api/designs`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        sheet: {
          widthIn: 22.5,
          maxHeightIn: 24,
          imageMarginIn: 0.15,
          artboardMarginIn: 0.1,
        },
        items: [
          {
            assetId: a1.assetId,
            widthIn: 4,
            heightIn: 2,
            xIn: 0.2,
            yIn: 0.2,
            rotationDeg: 0,
            quantity: 1,
          },
          {
            assetId: a2.assetId,
            widthIn: 5,
            heightIn: 2.5,
            xIn: 5,
            yIn: 0.2,
            rotationDeg: 0,
            quantity: 1,
          },
        ],
      }),
    })
  ).json();
  if (!dGs.designId) throw new Error(`gang sheet failed: ${JSON.stringify(dGs)}`);
  results.gangSheet = {
    designId: dGs.designId,
    workflow: dGs.state.workflow,
    layout: dGs.state.layout,
  };

  // 5) Render gang sheet design
  const job = await renderDesign(dGs.designId, dGs.version);
  let downloadOk = false;
  let meta = null;
  if (job?.status === "completed" && job.outputKey) {
    const dl = signDownload(job.outputKey);
    const dlRes = await fetch(`${base}/api/files/download?token=${encodeURIComponent(dl)}`);
    downloadOk = dlRes.ok;
    if (dlRes.ok) {
      const buf = Buffer.from(await dlRes.arrayBuffer());
      const outPath = path.join("storage", "local", "_e2e-gang-sheet.png");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, buf);
      meta = await sharp(buf).metadata();
    }
  }
  results.render = {
    jobStatus: job?.status,
    widthPx: job?.widthPx,
    heightPx: job?.heightPx,
    downloadOk,
    png: meta ? { width: meta.width, height: meta.height, hasAlpha: meta.hasAlpha } : null,
  };

  // 6) Editor routes reachable
  const editors = {};
  for (const path of ["/editor/upload-by-size", "/editor/gang-sheet"]) {
    const res = await fetch(`${base}${path}?shop=${encodeURIComponent(shop)}&embedded=1`);
    editors[path] = res.status;
  }
  results.editors = editors;

  const ok =
    job?.status === "completed" &&
    downloadOk &&
    dGs.state.workflow === "gang_sheet" &&
    editors["/editor/gang-sheet"] === 200;

  console.log(JSON.stringify({ ok, results }, null, 2));
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
