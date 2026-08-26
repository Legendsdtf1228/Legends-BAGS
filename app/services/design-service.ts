import prisma from "../db.server";
import {
  buildUploadBySizeState,
  buildUploadBySizeStateFromLines,
  nestAndRenderDesign,
} from "../domain/design/pipeline";
import type { DesignStateV1 } from "../domain/design/types";
import { DEFAULT_PRICE_PER_SQ_IN, DESIGN_STATE_SCHEMA_VERSION } from "../domain/design/types";
import { buildPricingSnapshot } from "../domain/pricing";
import { validateUpload } from "../domain/design/upload";
import { canEnqueue, shouldRequeueStuckProcessing, type JobStatus } from "../domain/jobs";
import type { SizeInput } from "../domain/pricing";
import { assetKey, getObjectStore } from "../domain/storage";

export async function createAssetFromUpload(shop: string, bytes: Buffer) {
  const validated = await validateUpload(bytes);
  const store = getObjectStore();
  // Pre-create id via prisma
  const asset = await prisma.asset.create({
    data: {
      shop,
      storageKey: "pending",
      contentType: validated.contentType,
      byteSize: validated.byteSize,
      widthPx: validated.widthPx,
      heightPx: validated.heightPx,
      dpi: validated.dpi,
      checksumSha256: validated.checksumSha256,
    },
  });
  const key = assetKey(shop, asset.id);
  await store.put(key, validated.bytes, validated.contentType);
  return prisma.asset.update({
    where: { id: asset.id },
    data: { storageKey: key },
  });
}

export async function createUploadBySizeDesign(params: {
  shop: string;
  assetId: string;
  size: SizeInput;
  productGid?: string;
  variantGid?: string;
}) {
  const asset = await prisma.asset.findFirst({
    where: { id: params.assetId, shop: params.shop },
  });
  if (!asset) throw new Error("Asset not found");

  const config = await prisma.shopConfig.findUnique({
    where: { shop: params.shop },
  });

  const state = buildUploadBySizeState({
    assetId: asset.id,
    sourceWidthPx: asset.widthPx,
    sourceHeightPx: asset.heightPx,
    size: params.size,
    pricePerSqIn: config?.pricePerSqIn,
    sheet: config
      ? {
          widthIn: config.sheetWidthIn,
          maxHeightIn: config.maxHeightIn,
          imageMarginIn: config.imageMarginIn,
          artboardMarginIn: config.artboardMarginIn,
        }
      : undefined,
  });

  const design = await prisma.design.create({
    data: {
      shop: params.shop,
      status: "draft",
      productGid: params.productGid,
      variantGid: params.variantGid,
      currentVersion: 1,
      versions: {
        create: {
          version: 1,
          stateJson: JSON.stringify(state),
          priceCents: state.pricing.totalCents,
          areaSqIn: state.pricing.areaSqIn,
        },
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      shop: params.shop,
      action: "design.created",
      actorType: "system",
      entityType: "design",
      entityId: design.id,
      metaJson: JSON.stringify({
        workflow: state.workflow,
        priceCents: state.pricing.totalCents,
      }),
    },
  });

  return { design, state };
}

export async function createMultiUploadBySizeDesign(params: {
  shop: string;
  uploads: Array<{ assetId: string; size: SizeInput }>;
  productGid?: string;
  variantGid?: string;
}) {
  if (!params.uploads.length) throw new Error("Add at least one artwork upload");

  const assetIds = [...new Set(params.uploads.map((u) => u.assetId))];
  const assets = await prisma.asset.findMany({
    where: { shop: params.shop, id: { in: assetIds } },
  });
  if (assets.length !== assetIds.length) throw new Error("One or more assets were not found");
  const assetById = new Map(assets.map((a) => [a.id, a]));

  const config = await prisma.shopConfig.findUnique({
    where: { shop: params.shop },
  });

  const state = buildUploadBySizeStateFromLines(
    params.uploads.map((upload) => {
      const asset = assetById.get(upload.assetId)!;
      return {
        assetId: asset.id,
        sourceWidthPx: asset.widthPx,
        sourceHeightPx: asset.heightPx,
        size: upload.size,
      };
    }),
    {
      pricePerSqIn: config?.pricePerSqIn,
      sheet: config
        ? {
            widthIn: config.sheetWidthIn,
            maxHeightIn: config.maxHeightIn,
            imageMarginIn: config.imageMarginIn,
            artboardMarginIn: config.artboardMarginIn,
          }
        : undefined,
    },
  );

  const design = await prisma.design.create({
    data: {
      shop: params.shop,
      status: "draft",
      productGid: params.productGid,
      variantGid: params.variantGid,
      currentVersion: 1,
      versions: {
        create: {
          version: 1,
          stateJson: JSON.stringify(state),
          priceCents: state.pricing.totalCents,
          areaSqIn: state.pricing.areaSqIn,
        },
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      shop: params.shop,
      action: "design.created",
      actorType: "customer",
      entityType: "design",
      entityId: design.id,
      metaJson: JSON.stringify({
        workflow: state.workflow,
        itemCount: state.items.length,
        priceCents: state.pricing.totalCents,
      }),
    },
  });

  return { design, state };
}

export async function quoteUploadBySize(params: {
  shop: string;
  uploads: Array<{ assetId: string; size: SizeInput }>;
}) {
  if (!params.uploads.length) throw new Error("At least one upload is required");

  const assetIds = [...new Set(params.uploads.map((u) => u.assetId))];
  const assets = await prisma.asset.findMany({
    where: { shop: params.shop, id: { in: assetIds } },
  });
  if (assets.length !== assetIds.length) throw new Error("One or more assets were not found");
  const assetById = new Map(assets.map((a) => [a.id, a]));

  const config = await prisma.shopConfig.findUnique({
    where: { shop: params.shop },
  });

  const state = buildUploadBySizeStateFromLines(
    params.uploads.map((upload) => {
      const asset = assetById.get(upload.assetId)!;
      return {
        assetId: asset.id,
        sourceWidthPx: asset.widthPx,
        sourceHeightPx: asset.heightPx,
        size: upload.size,
      };
    }),
    { pricePerSqIn: config?.pricePerSqIn },
  );

  const lines = state.items.map((item) => {
    const asset = assetById.get(item.assetId)!;
    const effectiveDpi = Math.min(
      asset.widthPx / item.widthIn,
      asset.heightPx / item.heightIn,
    );
    return {
      assetId: item.assetId,
      widthIn: item.widthIn,
      heightIn: item.heightIn,
      quantity: item.quantity,
      areaSqIn: item.widthIn * item.heightIn * item.quantity,
      effectiveDpi: Math.round(effectiveDpi),
      lowDpi: effectiveDpi < 200,
    };
  });

  return { pricing: state.pricing, lines };
}

export async function upsertProductBinding(params: {
  shop: string;
  productGid: string;
  variantGid?: string;
  builderType: "upload_by_size" | "gang_sheet";
  pricePerSqIn?: number;
  sheetWidthIn?: number;
  maxHeightIn?: number;
}) {
  return prisma.productBinding.upsert({
    where: {
      shop_productGid: { shop: params.shop, productGid: params.productGid },
    },
    create: {
      shop: params.shop,
      productGid: params.productGid,
      variantGid: params.variantGid,
      builderType: params.builderType,
      pricePerSqIn: params.pricePerSqIn,
      sheetWidthIn: params.sheetWidthIn,
      maxHeightIn: params.maxHeightIn,
    },
    update: {
      variantGid: params.variantGid,
      builderType: params.builderType,
      pricePerSqIn: params.pricePerSqIn,
      sheetWidthIn: params.sheetWidthIn,
      maxHeightIn: params.maxHeightIn,
    },
  });
}

export async function createGangSheetDesign(params: {
  shop: string;
  items: DesignStateV1["items"];
  sheet: DesignStateV1["sheet"];
  productGid?: string;
  variantGid?: string;
}) {
  if (!params.items.length) throw new Error("Add at least one artwork item");
  const assetIds = [...new Set(params.items.map((item) => item.assetId))];
  const ownedAssets = await prisma.asset.count({
    where: { shop: params.shop, id: { in: assetIds } },
  });
  if (ownedAssets !== assetIds.length) throw new Error("One or more assets were not found");

  const config = await prisma.shopConfig.findUnique({ where: { shop: params.shop } });
  const normalizedItems = params.items.map((item) => ({
    ...item,
    quantity: Math.max(1, Math.floor(item.quantity || 1)),
    widthIn: Math.round(item.widthIn * 1000) / 1000,
    heightIn: Math.round(item.heightIn * 1000) / 1000,
    xIn: Math.round((item.xIn ?? 0) * 1000) / 1000,
    yIn: Math.round((item.yIn ?? 0) * 1000) / 1000,
  }));
  const state: DesignStateV1 = {
    schemaVersion: DESIGN_STATE_SCHEMA_VERSION,
    workflow: "gang_sheet",
    sheet: params.sheet,
    items: normalizedItems,
    pricing: buildPricingSnapshot(normalizedItems, config?.pricePerSqIn ?? DEFAULT_PRICE_PER_SQ_IN),
    allowRotate90: false,
    layout: "manual",
  };
  const design = await prisma.design.create({
    data: {
      shop: params.shop,
      status: "draft",
      productGid: params.productGid,
      variantGid: params.variantGid,
      currentVersion: 1,
      versions: { create: { version: 1, stateJson: JSON.stringify(state), priceCents: state.pricing.totalCents, areaSqIn: state.pricing.areaSqIn } },
    },
  });
  await prisma.auditEvent.create({
    data: { shop: params.shop, action: "design.created", actorType: "customer", entityType: "design", entityId: design.id, metaJson: JSON.stringify({ workflow: "gang_sheet", itemCount: state.items.length }) },
  });
  return { design, state };
}

export async function getDesignState(
  shop: string,
  designId: string,
): Promise<{ design: NonNullable<Awaited<ReturnType<typeof prisma.design.findFirst>>>; state: DesignStateV1 }> {
  const design = await prisma.design.findFirst({
    where: { id: designId, shop },
  });
  if (!design) throw new Error("Design not found");
  const version = await prisma.designVersion.findUnique({
    where: {
      designId_version: {
        designId: design.id,
        version: design.currentVersion,
      },
    },
  });
  if (!version) throw new Error("Design version missing");
  return { design, state: JSON.parse(version.stateJson) as DesignStateV1 };
}

export async function enqueueRenderJob(params: {
  shop: string;
  designId: string;
  orderLinkId?: string;
}) {
  const existing = await prisma.renderJob.findMany({
    where: {
      shop: params.shop,
      designId: params.designId,
      orderLinkId: params.orderLinkId ?? null,
      status: { in: ["queued", "processing"] },
    },
  });
  if (!canEnqueue(existing.map((j) => ({ status: j.status as JobStatus })))) {
    return existing[0];
  }

  const job = await prisma.renderJob.create({
    data: {
      shop: params.shop,
      designId: params.designId,
      orderLinkId: params.orderLinkId,
      status: "queued",
      attempt: 0,
    },
  });

  await prisma.design.update({
    where: { id: params.designId },
    data: { status: "processing" },
  });

  return job;
}

export async function recoverStuckJobs(now = new Date()) {
  const processing = await prisma.renderJob.findMany({
    where: { status: "processing" },
  });
  let recovered = 0;
  for (const job of processing) {
    if (
      shouldRequeueStuckProcessing({
        id: job.id,
        status: job.status as "processing",
        attempt: job.attempt,
        updatedAt: job.updatedAt,
        leaseExpiresAt: job.leaseExpiresAt,
      }, now)
    ) {
      await prisma.renderJob.update({
        where: { id: job.id },
        data: {
          status: "queued",
          lastError: "Worker lease expired; requeued",
          leaseExpiresAt: null,
        },
      });
      recovered += 1;
    }
  }
  return recovered;
}

export async function processNextRenderJob(): Promise<
  | { ok: true; jobId: string }
  | { ok: false; reason: string }
  | { ok: true; jobId: string; failed: true; error: string }
> {
  await recoverStuckJobs();

  const job = await prisma.renderJob.findFirst({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return { ok: false, reason: "empty" };

  const leaseExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const claimed = await prisma.renderJob.updateMany({
    where: { id: job.id, status: "queued" },
    data: {
      status: "processing",
      attempt: job.attempt + 1,
      startedAt: new Date(),
      leaseExpiresAt,
    },
  });
  if (claimed.count !== 1) return { ok: false, reason: "race" };

  try {
    const { state } = await getDesignState(job.shop, job.designId);
    const result = await nestAndRenderDesign({
      shop: job.shop,
      designId: job.designId,
      jobId: job.id,
      state,
      store: getObjectStore(),
    });

    await prisma.renderJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        outputKey: result.outputObjectKey,
        previewKey: result.previewObjectKey,
        sheetWidthIn: result.sheetWidthIn,
        sheetHeightIn: result.sheetHeightIn,
        widthPx: result.widthPx,
        heightPx: result.heightPx,
        finishedAt: new Date(),
        leaseExpiresAt: null,
        lastError: null,
      },
    });

    await prisma.design.update({
      where: { id: job.designId },
      data: { status: "completed" },
    });

    await prisma.auditEvent.create({
      data: {
        shop: job.shop,
        action: "render.completed",
        actorType: "system",
        entityType: "render_job",
        entityId: job.id,
        metaJson: JSON.stringify({
          widthPx: result.widthPx,
          heightPx: result.heightPx,
        }),
      },
    });

    return { ok: true, jobId: job.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render failed";
    await prisma.renderJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        lastError: message.slice(0, 500),
        finishedAt: new Date(),
        leaseExpiresAt: null,
      },
    });
    await prisma.design.update({
      where: { id: job.designId },
      data: { status: "failed" },
    });
    return { ok: true, jobId: job.id, failed: true, error: message };
  }
}

export async function linkOrderToDesigns(params: {
  shop: string;
  orderId: string;
  orderGid?: string;
  lines: Array<{ lineItemId: string; designId: string; designVersion?: number }>;
  idempotencyKey: string;
  topic: string;
  webhookId?: string;
  payloadHash: string;
}) {
  const existing = await prisma.webhookDelivery.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) {
    return { duplicate: true as const, linked: [] as string[] };
  }

  await prisma.webhookDelivery.create({
    data: {
      shop: params.shop,
      topic: params.topic,
      webhookId: params.webhookId,
      orderId: params.orderId,
      payloadHash: params.payloadHash,
      idempotencyKey: params.idempotencyKey,
      status: "processed",
    },
  });

  const linked: string[] = [];
  for (const line of params.lines) {
    const design = await prisma.design.findFirst({
      where: { id: line.designId, shop: params.shop },
    });
    if (!design) continue;

    const orderLink = await prisma.orderLink.upsert({
      where: {
        shop_orderId_lineItemId_designId: {
          shop: params.shop,
          orderId: params.orderId,
          lineItemId: line.lineItemId,
          designId: line.designId,
        },
      },
      create: {
        shop: params.shop,
        orderId: params.orderId,
        orderGid: params.orderGid,
        lineItemId: line.lineItemId,
        designId: line.designId,
        designVersion: line.designVersion ?? design.currentVersion,
      },
      update: {
        orderGid: params.orderGid,
      },
    });

    await prisma.design.update({
      where: { id: design.id },
      data: { status: "ordered" },
    });

    await enqueueRenderJob({
      shop: params.shop,
      designId: design.id,
      orderLinkId: orderLink.id,
    });
    linked.push(design.id);
  }

  return { duplicate: false as const, linked };
}
