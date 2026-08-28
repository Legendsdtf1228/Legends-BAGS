import prisma from "../db.server";
import type { Prisma } from "@prisma/client";
import {
  buildUploadBySizeState,
  buildUploadBySizeStateFromLines,
  nestAndRenderDesign,
} from "../domain/design/pipeline";
import type { DesignStateV1 } from "../domain/design/types";
import { DEFAULT_PRICE_PER_SQ_IN, DESIGN_STATE_SCHEMA_VERSION } from "../domain/design/types";
import { buildGangSheetPricingSnapshot, buildPricingSnapshot } from "../domain/pricing";
import { validateUpload } from "../domain/design/upload";
import { canEnqueue, shouldRequeueStuckProcessing, type JobStatus } from "../domain/jobs";
import type { SizeInput } from "../domain/pricing";
import { assetKey, getObjectStore } from "../domain/storage";
import { assertDesignStateV1 } from "../domain/design/types";
import { verifyPriceRef } from "../domain/security/design-access";
import { signDownload } from "../domain/security/signed-urls";
import { removeBackgroundFromBytes, type BackgroundRemovalTuning } from "../domain/image/background-removal";
import { resolveProductBinding } from "../lib/editor-config.server";
import sharp from "sharp";

/** Storefront library ownership — unassigned drafts remain editable in-session. */
export function assertDesignCustomerAccess(
  design: { customerKey: string | null },
  customerKey: string | null,
) {
  if (!design.customerKey) return;
  if (!customerKey || design.customerKey !== customerKey) {
    throw new Error("Design not found");
  }
}

function assignCustomerKeyOnCreate(customerKey?: string | null) {
  return customerKey ? { customerKey } : {};
}

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

async function gangSheetPricingForDesign(
  shop: string,
  items: DesignStateV1["items"],
  productGid?: string,
  variantGid?: string,
) {
  const config = await prisma.shopConfig.findUnique({ where: { shop } });
  const binding = await resolveProductBinding(shop, productGid, variantGid);
  return buildGangSheetPricingSnapshot(items, {
    pricePerSqIn: binding?.pricePerSqIn ?? config?.pricePerSqIn ?? DEFAULT_PRICE_PER_SQ_IN,
    variantPriceCents: binding?.variantPriceCents ?? null,
  });
}

/** Upscale artwork toward 300 DPI effective at the given print size (max 4×). */
export async function upscaleAssetForPrint(params: {
  shop: string;
  assetId: string;
  widthIn: number;
  heightIn: number;
}) {
  const asset = await prisma.asset.findFirst({
    where: { id: params.assetId, shop: params.shop },
  });
  if (!asset) throw new Error("Asset not found");
  if (params.widthIn <= 0 || params.heightIn <= 0) {
    throw new Error("Print size must be positive");
  }

  const targetWidthPx = Math.round(params.widthIn * 300);
  const targetHeightPx = Math.round(params.heightIn * 300);
  const scale = Math.min(
    targetWidthPx / asset.widthPx,
    targetHeightPx / asset.heightPx,
    4,
  );
  if (scale <= 1.05) {
    throw new Error("Image already meets ~300 DPI at this size");
  }

  const bytes = await getObjectStore().get(asset.storageKey);
  const upscaled = await sharp(bytes)
    .resize(Math.round(asset.widthPx * scale), Math.round(asset.heightPx * scale), {
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  return createAssetFromUpload(params.shop, upscaled);
}

/** Remove image background; returns a new PNG asset with alpha. */
export async function removeBackgroundFromAsset(params: {
  shop: string;
  assetId: string;
  tuning?: BackgroundRemovalTuning;
}) {
  const asset = await prisma.asset.findFirst({
    where: { id: params.assetId, shop: params.shop },
  });
  if (!asset) throw new Error("Asset not found");

  const bytes = await getObjectStore().get(asset.storageKey);
  const cutout = await removeBackgroundFromBytes(bytes, params.tuning ?? {});
  return createAssetFromUpload(params.shop, cutout);
}

export async function createUploadBySizeDesign(params: {
  shop: string;
  assetId: string;
  size: SizeInput;
  productGid?: string;
  variantGid?: string;
  customerKey?: string | null;
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
      ...assignCustomerKeyOnCreate(params.customerKey),
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
  customerKey?: string | null;
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
      ...assignCustomerKeyOnCreate(params.customerKey),
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
  sheetHeightIn?: number;
  variantPriceCents?: number;
}) {
  if (!params.variantGid) {
    throw new Error("variantGid is required for product bindings");
  }
  return prisma.productBinding.upsert({
    where: {
      shop_variantGid: { shop: params.shop, variantGid: params.variantGid },
    },
    create: {
      shop: params.shop,
      productGid: params.productGid,
      variantGid: params.variantGid,
      builderType: params.builderType,
      pricePerSqIn: params.pricePerSqIn,
      sheetWidthIn: params.sheetWidthIn,
      maxHeightIn: params.maxHeightIn,
      sheetHeightIn: params.sheetHeightIn,
      variantPriceCents: params.variantPriceCents,
    },
    update: {
      variantGid: params.variantGid,
      builderType: params.builderType,
      pricePerSqIn: params.pricePerSqIn,
      sheetWidthIn: params.sheetWidthIn,
      maxHeightIn: params.maxHeightIn,
      sheetHeightIn: params.sheetHeightIn,
      variantPriceCents: params.variantPriceCents,
    },
  });
}

export async function createGangSheetDesign(params: {
  shop: string;
  items: DesignStateV1["items"];
  sheet: DesignStateV1["sheet"];
  productGid?: string;
  variantGid?: string;
  customerKey?: string | null;
}) {
  if (!params.items.length) throw new Error("Add at least one artwork item");
  const assetIds = [...new Set(params.items.map((item) => item.assetId))];
  const ownedAssets = await prisma.asset.count({
    where: { shop: params.shop, id: { in: assetIds } },
  });
  if (ownedAssets !== assetIds.length) throw new Error("One or more assets were not found");

  const normalizedItems = params.items.map((item, index) => {
    if (!Number.isFinite(item.xIn) || !Number.isFinite(item.yIn)) {
      throw new Error("Every gang sheet item requires finite xIn and yIn");
    }
    return {
      ...item,
      quantity: Math.max(1, Math.floor(item.quantity || 1)),
      widthIn: Math.round(item.widthIn * 1000) / 1000,
      heightIn: Math.round(item.heightIn * 1000) / 1000,
      xIn: Math.round(item.xIn! * 1000) / 1000,
      yIn: Math.round(item.yIn! * 1000) / 1000,
      zIndex: item.zIndex ?? index,
    };
  });
  const pricing = await gangSheetPricingForDesign(
    params.shop,
    normalizedItems,
    params.productGid,
    params.variantGid,
  );
  const state: DesignStateV1 = {
    schemaVersion: DESIGN_STATE_SCHEMA_VERSION,
    workflow: "gang_sheet",
    sheet: params.sheet,
    items: normalizedItems,
    pricing,
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
      ...assignCustomerKeyOnCreate(params.customerKey),
      versions: { create: { version: 1, stateJson: JSON.stringify(state), priceCents: state.pricing.totalCents, areaSqIn: state.pricing.areaSqIn } },
    },
  });
  await prisma.auditEvent.create({
    data: { shop: params.shop, action: "design.created", actorType: "customer", entityType: "design", entityId: design.id, metaJson: JSON.stringify({ workflow: "gang_sheet", itemCount: state.items.length }) },
  });
  return { design, state };
}

export async function getDesignStateAtVersion(
  shop: string,
  designId: string,
  version: number,
): Promise<{ design: NonNullable<Awaited<ReturnType<typeof prisma.design.findFirst>>>; state: DesignStateV1; versionRow: NonNullable<Awaited<ReturnType<typeof prisma.designVersion.findUnique>>> }> {
  const design = await prisma.design.findFirst({
    where: { id: designId, shop },
  });
  if (!design) throw new Error("Design not found");
  const versionRow = await prisma.designVersion.findUnique({
    where: { designId_version: { designId, version } },
  });
  if (!versionRow) throw new Error("Design version not found");
  const state = assertDesignStateV1(JSON.parse(versionRow.stateJson));
  return { design, state, versionRow };
}

export async function getDesignState(
  shop: string,
  designId: string,
  version?: number,
): Promise<{ design: NonNullable<Awaited<ReturnType<typeof prisma.design.findFirst>>>; state: DesignStateV1 }> {
  const design = await prisma.design.findFirst({
    where: { id: designId, shop },
  });
  if (!design) throw new Error("Design not found");
  const v = version ?? design.currentVersion;
  const versionRow = await prisma.designVersion.findUnique({
    where: { designId_version: { designId: design.id, version: v } },
  });
  if (!versionRow) throw new Error("Design version missing");
  return { design, state: assertDesignStateV1(JSON.parse(versionRow.stateJson)) };
}

export async function saveGangSheetNewVersion(params: {
  shop: string;
  designId: string;
  items: DesignStateV1["items"];
  sheet: DesignStateV1["sheet"];
  productGid?: string;
  variantGid?: string;
  name?: string;
  saveToLibrary?: boolean;
  customerKey?: string | null;
}) {
  const existing = await prisma.design.findFirst({
    where: { id: params.designId, shop: params.shop },
  });
  if (!existing) throw new Error("Design not found");
  assertDesignCustomerAccess(existing, params.customerKey ?? null);
  if (existing.status === "ordered") {
    throw new Error("Ordered designs are immutable — duplicate to reorder");
  }

  const assetIds = [...new Set(params.items.map((item) => item.assetId))];
  const ownedAssets = await prisma.asset.count({
    where: { shop: params.shop, id: { in: assetIds } },
  });
  if (ownedAssets !== assetIds.length) throw new Error("One or more assets were not found");

  const normalizedItems = params.items.map((item, index) => {
    if (!Number.isFinite(item.xIn) || !Number.isFinite(item.yIn)) {
      throw new Error("Every gang sheet item requires finite xIn and yIn");
    }
    return {
      ...item,
      quantity: Math.max(1, Math.floor(item.quantity || 1)),
      widthIn: Math.round(item.widthIn * 1000) / 1000,
      heightIn: Math.round(item.heightIn * 1000) / 1000,
      xIn: Math.round(item.xIn! * 1000) / 1000,
      yIn: Math.round(item.yIn! * 1000) / 1000,
      zIndex: item.zIndex ?? index,
    };
  });
  const pricing = await gangSheetPricingForDesign(
    params.shop,
    normalizedItems,
    params.productGid ?? existing.productGid ?? undefined,
    params.variantGid ?? existing.variantGid ?? undefined,
  );

  const state: DesignStateV1 = {
    schemaVersion: DESIGN_STATE_SCHEMA_VERSION,
    workflow: "gang_sheet",
    sheet: params.sheet,
    items: normalizedItems,
    pricing,
    allowRotate90: false,
    layout: "manual",
  };

  const nextVersion = existing.currentVersion + 1;
  const design = await prisma.design.update({
    where: { id: existing.id },
    data: {
      currentVersion: nextVersion,
      status: "draft",
      productGid: params.productGid ?? existing.productGid,
      variantGid: params.variantGid ?? existing.variantGid,
      name: params.saveToLibrary && params.name ? params.name : existing.name,
      archived: false,
      updatedAt: new Date(),
      versions: {
        create: {
          version: nextVersion,
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
      action: "design.version_saved",
      actorType: "customer",
      entityType: "design",
      entityId: design.id,
      metaJson: JSON.stringify({ version: nextVersion, itemCount: state.items.length }),
    },
  });

  return { design, state, version: nextVersion };
}

export async function saveUploadBySizeNewVersion(params: {
  shop: string;
  designId: string;
  uploads: Array<{ assetId: string; size: SizeInput }>;
  productGid?: string;
  variantGid?: string;
  name?: string;
  saveToLibrary?: boolean;
  customerKey?: string | null;
}) {
  const existing = await prisma.design.findFirst({
    where: { id: params.designId, shop: params.shop },
  });
  if (!existing) throw new Error("Design not found");
  assertDesignCustomerAccess(existing, params.customerKey ?? null);
  if (existing.status === "ordered") {
    throw new Error("Ordered designs are immutable — duplicate to reorder");
  }

  const assetIds = [...new Set(params.uploads.map((u) => u.assetId))];
  const assets = await prisma.asset.findMany({
    where: { shop: params.shop, id: { in: assetIds } },
  });
  if (assets.length !== assetIds.length) throw new Error("One or more assets were not found");
  const assetById = new Map(assets.map((a) => [a.id, a]));

  const config = await prisma.shopConfig.findUnique({ where: { shop: params.shop } });
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

  const nextVersion = existing.currentVersion + 1;
  const design = await prisma.design.update({
    where: { id: existing.id },
    data: {
      currentVersion: nextVersion,
      status: "draft",
      productGid: params.productGid ?? existing.productGid,
      variantGid: params.variantGid ?? existing.variantGid,
      name: params.saveToLibrary && params.name ? params.name : existing.name,
      archived: false,
      versions: {
        create: {
          version: nextVersion,
          stateJson: JSON.stringify(state),
          priceCents: state.pricing.totalCents,
          areaSqIn: state.pricing.areaSqIn,
        },
      },
    },
  });

  return { design, state, version: nextVersion };
}

export async function listDesignLibrary(params: {
  shop: string;
  customerKey?: string | null;
  productGid?: string;
  workflow?: "upload_by_size" | "gang_sheet";
  search?: string;
  sort?: "recent" | "name";
  includeArchived?: boolean;
  limit?: number;
}) {
  const where: Prisma.DesignWhereInput = {
    shop: params.shop,
    staffSheet: false,
    name: params.search?.trim()
      ? { not: null, contains: params.search.trim() }
      : { not: null },
    ...(params.includeArchived ? {} : { archived: false }),
    ...(params.customerKey ? { customerKey: params.customerKey } : {}),
    ...(params.productGid
      ? { OR: [{ productGid: params.productGid }, { productGid: null }] }
      : {}),
  };

  const rows = await prisma.design.findMany({
    where,
    orderBy: params.sort === "name" ? { name: "asc" } : { updatedAt: "desc" },
    take: params.limit ?? 50,
  });

  const designs = await Promise.all(
    rows.map(async (d) => {
      const v = await prisma.designVersion.findUnique({
        where: { designId_version: { designId: d.id, version: d.currentVersion } },
      });
      let workflow = "upload_by_size";
      let pieceCount = 0;
      let sheetLabel = "";
      if (v) {
        try {
          const state = JSON.parse(v.stateJson) as DesignStateV1;
          workflow = state.workflow;
          pieceCount = state.items.reduce((n, i) => n + (i.quantity || 1), 0);
          sheetLabel = `${state.sheet.widthIn}″ × ${state.sheet.maxHeightIn}″`;
        } catch {
          /* ignore */
        }
      }
      let previewPath: string | null = null;
      const previewKey =
        d.previewKey ??
        (
          await prisma.renderJob.findFirst({
            where: { shop: params.shop, designId: d.id, previewKey: { not: null } },
            orderBy: { createdAt: "desc" },
            select: { previewKey: true },
          })
        )?.previewKey;
      if (previewKey) {
        const { token } = signDownload({ shop: params.shop, objectKey: previewKey });
        previewPath = `/api/files/download?token=${encodeURIComponent(token)}`;
      }

      return {
        id: d.id,
        name: d.name,
        workflow,
        version: d.currentVersion,
        status: d.status,
        archived: d.archived,
        pieceCount,
        sheetLabel,
        priceCents: v?.priceCents ?? 0,
        updatedAt: d.updatedAt.toISOString(),
        createdAt: d.createdAt.toISOString(),
        sourceDesignId: d.sourceDesignId,
        sourceOrderId: d.sourceOrderId,
        previewPath,
      };
    }),
  );
  if (params.workflow) {
    return designs.filter((d) => d.workflow === params.workflow);
  }
  return designs;
}

export async function createStaffSheet(params: {
  shop: string;
  name: string;
  sheetWidthIn?: number;
  sheetHeightIn?: number;
}) {
  const config = await prisma.shopConfig.findUnique({ where: { shop: params.shop } });
  const sheet = {
    widthIn: params.sheetWidthIn ?? config?.sheetWidthIn ?? 22.5,
    maxHeightIn: params.sheetHeightIn ?? 24,
    imageMarginIn: config?.imageMarginIn ?? 0.15,
    artboardMarginIn: config?.artboardMarginIn ?? 0.1,
  };
  const state: DesignStateV1 = {
    schemaVersion: DESIGN_STATE_SCHEMA_VERSION,
    workflow: "gang_sheet",
    sheet,
    items: [],
    pricing: {
      currency: "USD",
      pricePerSqIn: config?.pricePerSqIn ?? DEFAULT_PRICE_PER_SQ_IN,
      areaSqIn: 0,
      totalCents: 0,
    },
    allowRotate90: false,
    layout: "manual",
  };
  const cleanName = params.name.trim() || "Untitled shop sheet";
  const design = await prisma.design.create({
    data: {
      shop: params.shop,
      status: "draft",
      staffSheet: true,
      name: cleanName,
      currentVersion: 1,
      versions: {
        create: {
          version: 1,
          stateJson: JSON.stringify(state),
          priceCents: 0,
          areaSqIn: 0,
        },
      },
    },
  });
  await prisma.auditEvent.create({
    data: {
      shop: params.shop,
      action: "staff_sheet.created",
      actorType: "merchant",
      entityType: "design",
      entityId: design.id,
      metaJson: JSON.stringify({ name: cleanName, sheet }),
    },
  });
  return { design, state };
}

export async function listStaffSheets(shop: string, search?: string) {
  const designs = await prisma.design.findMany({
    where: {
      shop,
      staffSheet: true,
      archived: false,
      ...(search?.trim()
        ? { OR: [{ name: { contains: search.trim() } }, { id: { contains: search.trim() } }] }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const jobs = await prisma.renderJob.findMany({
    where: { shop, designId: { in: designs.map((d) => d.id) } },
    orderBy: { createdAt: "desc" },
  });
  const jobByDesign = new Map<string, (typeof jobs)[number]>();
  for (const j of jobs) {
    if (!jobByDesign.has(j.designId)) jobByDesign.set(j.designId, j);
  }

  return Promise.all(
    designs.map(async (d) => {
      const v = await prisma.designVersion.findUnique({
        where: { designId_version: { designId: d.id, version: d.currentVersion } },
      });
      let pieceCount = 0;
      let sheetLabel = "";
      if (v) {
        try {
          const state = JSON.parse(v.stateJson) as DesignStateV1;
          pieceCount = state.items.length;
          sheetLabel = `${state.sheet.widthIn}″ × ${state.sheet.maxHeightIn}″`;
        } catch {
          /* ignore */
        }
      }
      const job = jobByDesign.get(d.id);
      let previewPath: string | null = null;
      const previewKey = d.previewKey ?? job?.previewKey ?? null;
      if (previewKey) {
        const { token } = signDownload({ shop, objectKey: previewKey });
        previewPath = `/api/files/download?token=${encodeURIComponent(token)}`;
      }
      let downloadPath: string | null = null;
      if (job?.outputKey) {
        const { token } = signDownload({ shop, objectKey: job.outputKey });
        downloadPath = `/api/files/download?token=${encodeURIComponent(token)}`;
      }
      return {
        id: d.id,
        name: d.name,
        status: d.status,
        version: d.currentVersion,
        pieceCount,
        sheetLabel,
        updatedAt: d.updatedAt.toISOString(),
        jobStatus: job?.status ?? null,
        previewPath,
        downloadPath,
      };
    }),
  );
}

export async function renameStaffSheet(shop: string, designId: string, name: string) {
  const design = await prisma.design.findFirst({
    where: { id: designId, shop, staffSheet: true },
  });
  if (!design) throw new Error("Staff sheet not found");
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Name required");
  return prisma.design.update({
    where: { id: design.id },
    data: { name: cleanName },
  });
}

export async function archiveStaffSheet(shop: string, designId: string) {
  const design = await prisma.design.findFirst({
    where: { id: designId, shop, staffSheet: true },
  });
  if (!design) throw new Error("Staff sheet not found");
  return prisma.design.update({
    where: { id: design.id },
    data: { archived: true },
  });
}

export async function duplicateStaffSheet(shop: string, designId: string) {
  const { design, state } = await getDesignState(shop, designId);
  if (!design.staffSheet) throw new Error("Not a staff sheet");
  const copy = await createStaffSheet({
    shop,
    name: `${design.name || "Shop sheet"} (copy)`,
    sheetWidthIn: state.sheet.widthIn,
    sheetHeightIn: state.sheet.maxHeightIn,
  });
  if (state.items.length) {
    await saveGangSheetNewVersion({
      shop,
      designId: copy.design.id,
      items: state.items,
      sheet: state.sheet,
    });
  }
  return copy.design;
}

export async function updateDesignLibraryEntry(params: {
  shop: string;
  designId: string;
  name?: string;
  archived?: boolean;
  customerKey?: string | null;
}) {
  const design = await prisma.design.findFirst({
    where: { id: params.designId, shop: params.shop },
  });
  if (!design) throw new Error("Design not found");
  assertDesignCustomerAccess(design, params.customerKey ?? null);
  return prisma.design.update({
    where: { id: design.id },
    data: {
      ...(params.name !== undefined ? { name: params.name } : {}),
      ...(params.archived !== undefined ? { archived: params.archived } : {}),
    },
  });
}

export async function duplicateDesignForReorder(params: {
  shop: string;
  sourceDesignId: string;
  sourceVersion?: number;
  sourceOrderId?: string;
  name?: string;
  productGid?: string;
  variantGid?: string;
  customerKey?: string | null;
}) {
  const sourceDesign = await prisma.design.findFirst({
    where: { id: params.sourceDesignId, shop: params.shop },
  });
  if (!sourceDesign) throw new Error("Source design not found");
  assertDesignCustomerAccess(sourceDesign, params.customerKey ?? null);

  const source = await getDesignStateAtVersion(
    params.shop,
    params.sourceDesignId,
    params.sourceVersion ?? sourceDesign.currentVersion,
  );

  const assetIds = [...new Set(source.state.items.map((i) => i.assetId))];
  const ownedAssets = await prisma.asset.count({
    where: { shop: params.shop, id: { in: assetIds } },
  });
  if (ownedAssets !== assetIds.length) {
    throw new Error("Source design assets are missing — cannot reorder");
  }

  const copyName =
    params.name?.trim() ||
    `${source.design.name || "Design"} (reorder ${new Date().toLocaleDateString()})`;

  const design = await prisma.design.create({
    data: {
      shop: params.shop,
      status: "draft",
      productGid: params.productGid ?? source.design.productGid,
      variantGid: params.variantGid ?? source.design.variantGid,
      currentVersion: 1,
      name: copyName,
      customerKey: params.customerKey ?? sourceDesign.customerKey,
      sourceDesignId: params.sourceDesignId,
      sourceDesignVersion: source.versionRow.version,
      sourceOrderId: params.sourceOrderId ?? source.design.sourceOrderId,
      versions: {
        create: {
          version: 1,
          stateJson: source.versionRow.stateJson,
          priceCents: source.versionRow.priceCents,
          areaSqIn: source.versionRow.areaSqIn,
        },
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      shop: params.shop,
      action: "design.reorder_copy",
      actorType: "system",
      entityType: "design",
      entityId: design.id,
      metaJson: JSON.stringify({
        sourceDesignId: params.sourceDesignId,
        sourceVersion: source.versionRow.version,
        sourceOrderId: params.sourceOrderId,
      }),
    },
  });

  return {
    design,
    state: source.state,
    version: 1,
    sourceDesignId: params.sourceDesignId,
    sourceVersion: source.versionRow.version,
  };
}

export async function validateDesignForCheckout(params: {
  shop: string;
  designId: string;
  designVersion: number;
  productGid?: string;
  variantGid?: string;
  priceRef?: string;
}) {
  const { design, state, versionRow } = await getDesignStateAtVersion(
    params.shop,
    params.designId,
    params.designVersion,
  );

  if (design.archived) throw new Error("Design has been archived");
  if (design.status === "failed") throw new Error("Design is invalid");
  if (params.productGid && design.productGid && design.productGid !== params.productGid) {
    throw new Error("Design does not match this product");
  }
  if (params.variantGid && design.variantGid && design.variantGid !== params.variantGid) {
    throw new Error("Design does not match this variant");
  }

  if (params.priceRef) {
    const ref = verifyPriceRef(params.priceRef);
    if (ref.shop !== params.shop || ref.designId !== params.designId) {
      throw new Error("Price reference mismatch");
    }
    if (ref.version !== params.designVersion) {
      throw new Error("Price reference version mismatch");
    }
    if (ref.priceCents !== versionRow.priceCents) {
      throw new Error("Price no longer matches saved design");
    }
  }

  return { design, state, versionRow };
}

export async function saveDesignToLibrary(params: {
  shop: string;
  designId: string;
  name: string;
  customerKey?: string | null;
}) {
  const design = await prisma.design.findFirst({
    where: { id: params.designId, shop: params.shop },
  });
  if (!design) throw new Error("Design not found");
  assertDesignCustomerAccess(design, params.customerKey ?? null);
  if (!params.name.trim()) throw new Error("Design name is required");
  return prisma.design.update({
    where: { id: design.id },
    data: {
      name: params.name.trim(),
      archived: false,
      ...(params.customerKey && !design.customerKey ? { customerKey: params.customerKey } : {}),
    },
  });
}

export async function enqueueRenderJob(params: {
  shop: string;
  designId: string;
  orderLinkId?: string;
  reprocessWidthIn?: number;
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
      reprocessWidthIn: params.reprocessWidthIn ?? null,
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
      reprocessWidthIn: job.reprocessWidthIn ?? undefined,
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
      data: {
        status: "completed",
        previewKey: result.previewObjectKey,
      },
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
  orderNumber?: string;
  financialStatus?: string;
  fulfillmentStatus?: string | null;
  paidAt?: Date;
  cancelledAt?: Date;
  customerGid?: string;
  customerEmail?: string;
  customerName?: string;
  lines: Array<{
    lineItemId: string;
    designId: string;
    designVersion?: number;
    priceRef?: string;
    builderType?: string;
    sheetWidthIn?: number;
    sheetHeightIn?: number;
    quantity?: number;
    productGid?: string;
    variantGid?: string;
  }>;
  idempotencyKey: string;
  topic: string;
  webhookId?: string;
  payloadHash: string;
  enqueueRender?: boolean;
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
  const enqueueRender = params.enqueueRender ?? true;
  for (const line of params.lines) {
    const design = await prisma.design.findFirst({
      where: { id: line.designId, shop: params.shop },
    });
    if (!design) continue;

    const version = line.designVersion ?? design.currentVersion;
    try {
      await validateDesignForCheckout({
        shop: params.shop,
        designId: line.designId,
        designVersion: version,
        priceRef: line.priceRef,
      });
    } catch {
      continue;
    }

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
        orderNumber: params.orderNumber,
        lineItemId: line.lineItemId,
        designId: line.designId,
        designVersion: line.designVersion ?? design.currentVersion,
        productGid: line.productGid,
        variantGid: line.variantGid,
        customerGid: params.customerGid,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        builderType: line.builderType,
        sheetWidthIn: line.sheetWidthIn,
        sheetHeightIn: line.sheetHeightIn,
        quantity: line.quantity ?? 1,
        financialStatus: params.financialStatus,
        fulfillmentStatus: params.fulfillmentStatus ?? undefined,
        paidAt: params.paidAt,
        cancelledAt: params.cancelledAt,
      },
      update: {
        orderGid: params.orderGid,
        orderNumber: params.orderNumber,
        designVersion: line.designVersion ?? design.currentVersion,
        productGid: line.productGid,
        variantGid: line.variantGid,
        customerGid: params.customerGid,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        builderType: line.builderType,
        sheetWidthIn: line.sheetWidthIn,
        sheetHeightIn: line.sheetHeightIn,
        quantity: line.quantity ?? 1,
        financialStatus: params.financialStatus,
        fulfillmentStatus: params.fulfillmentStatus ?? undefined,
        paidAt: params.paidAt ?? undefined,
        cancelledAt: params.cancelledAt ?? undefined,
      },
    });

    if (enqueueRender) {
      await prisma.design.update({
        where: { id: design.id },
        data: { status: "ordered" },
      });

      await enqueueRenderJob({
        shop: params.shop,
        designId: design.id,
        orderLinkId: orderLink.id,
      });
    }
    linked.push(design.id);
  }

  return { duplicate: false as const, linked };
}
