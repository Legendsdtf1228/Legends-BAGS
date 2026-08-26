import { afterAll, beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

/**
 * End-to-end domain pipeline against Prisma + local object store.
 * Uses a dedicated shop id and temp storage root — no customer data.
 */
describe("vertical slice pipeline", () => {
  const shop = "lgs-pipeline-test.myshopify.com";
  let storageRoot: string;
  let createAssetFromUpload: typeof import("../app/services/design-service").createAssetFromUpload;
  let createUploadBySizeDesign: typeof import("../app/services/design-service").createUploadBySizeDesign;
  let linkOrderToDesigns: typeof import("../app/services/design-service").linkOrderToDesigns;
  let processNextRenderJob: typeof import("../app/services/design-service").processNextRenderJob;
  let prisma: typeof import("../app/db.server").default;
  let getObjectStore: typeof import("../app/domain/storage").getObjectStore;

  beforeAll(async () => {
    storageRoot = await mkdtemp(path.join(tmpdir(), "lgs-pipe-"));
    process.env.LOCAL_STORAGE_ROOT = storageRoot;
    process.env.FILE_SIGNING_SECRET = "pipeline-test-signing-secret!!";

    // Fresh module graph so storage singleton picks up env
    const storage = await import("../app/domain/storage");
    getObjectStore = storage.getObjectStore;
    prisma = (await import("../app/db.server")).default;
    const svc = await import("../app/services/design-service");
    createAssetFromUpload = svc.createAssetFromUpload;
    createUploadBySizeDesign = svc.createUploadBySizeDesign;
    linkOrderToDesigns = svc.linkOrderToDesigns;
    processNextRenderJob = svc.processNextRenderJob;

    await prisma.shopConfig.upsert({
      where: { shop },
      create: { shop },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.renderJob.deleteMany({ where: { shop } });
    await prisma.orderLink.deleteMany({ where: { shop } });
    await prisma.designVersion.deleteMany({
      where: { design: { shop } },
    });
    await prisma.design.deleteMany({ where: { shop } });
    await prisma.asset.deleteMany({ where: { shop } });
    await prisma.webhookDelivery.deleteMany({ where: { shop } });
    await prisma.auditEvent.deleteMany({ where: { shop } });
    await rm(storageRoot, { recursive: true, force: true });
  });

  it("upload → design → webhook → nest/render → completed output", async () => {
    const bytes = await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const asset = await createAssetFromUpload(shop, bytes);
    const { design, state } = await createUploadBySizeDesign({
      shop,
      assetId: asset.id,
      size: { mode: "preset", presetId: "4in", quantity: 2 },
    });

    expect(state.pricing.totalCents).toBeGreaterThan(0);
    expect(state.items[0].quantity).toBe(2);

    const link1 = await linkOrderToDesigns({
      shop,
      orderId: "1001",
      lines: [{ lineItemId: "li1", designId: design.id }],
      idempotencyKey: `${shop}:wh-pipe-1`,
      topic: "orders/paid",
      webhookId: "wh-pipe-1",
      payloadHash: "abc",
    });
    expect(link1.duplicate).toBe(false);

    const link2 = await linkOrderToDesigns({
      shop,
      orderId: "1001",
      lines: [{ lineItemId: "li1", designId: design.id }],
      idempotencyKey: `${shop}:wh-pipe-1`,
      topic: "orders/paid",
      webhookId: "wh-pipe-1",
      payloadHash: "abc",
    });
    expect(link2.duplicate).toBe(true);

    const result = await processNextRenderJob();
    expect(result.ok).toBe(true);
    if (!result.ok || "failed" in result && result.failed) {
      throw new Error("render failed");
    }

    const job = await prisma.renderJob.findFirst({
      where: { shop, designId: design.id },
      orderBy: { createdAt: "desc" },
    });
    expect(job?.status).toBe("completed");
    expect(job?.widthPx).toBe(Math.round((job?.sheetWidthIn ?? 0) * 300));
    expect(job?.outputKey).toBeTruthy();

    const store = getObjectStore();
    const png = await store.get(job!.outputKey!);
    const meta = await sharp(png).metadata();
    expect(meta.width).toBe(job!.widthPx);
    expect(meta.height).toBe(job!.heightPx);
    expect(meta.hasAlpha).toBe(true);
  });
});
