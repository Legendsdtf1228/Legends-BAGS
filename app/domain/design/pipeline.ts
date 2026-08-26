import { createHash } from "node:crypto";
import {
  DEFAULT_PRICE_PER_SQ_IN,
  DEFAULT_UPLOAD_BY_SIZE_SHEET,
  DESIGN_STATE_SCHEMA_VERSION,
  type DesignStateV1,
} from "../design/types";
import { nestRectangles } from "../nesting";
import type { NestResult } from "../nesting";
import { buildPricingSnapshot, resolvePhysicalSize, type SizeInput } from "../pricing";
import {
  assertNotUsingOutputAsSource,
  renderPreviewPng,
  renderSheetPng,
} from "../rendering";
import { renderSheetPngTiled } from "../rendering/tiled";
import { assetKey, outputKey, previewKey, type ObjectStore } from "../storage";

export type PipelineAssetLoader = {
  loadOriginal(shop: string, assetId: string): Promise<Buffer>;
};

/**
 * Full nest+render from immutable design state + original assets.
 * Safe for retries and reprocess-width: never reads prior outputs as sources.
 */
export async function nestAndRenderDesign(params: {
  shop: string;
  designId: string;
  jobId: string;
  state: DesignStateV1;
  store: ObjectStore;
  /** Optional override sheet width for reprocess — applied to a copy of state.sheet */
  reprocessWidthIn?: number;
  /** Force tiled path (also auto-selected above maxPixels). */
  forceTiled?: boolean;
  maxPixels?: number;
}): Promise<{
  sheetWidthIn: number;
  sheetHeightIn: number;
  widthPx: number;
  heightPx: number;
  outputObjectKey: string;
  previewObjectKey: string;
}> {
  const sheet = {
    ...params.state.sheet,
    ...(params.reprocessWidthIn
      ? { widthIn: params.reprocessWidthIn }
      : {}),
  };

  const nest = buildNest(params.state, sheet);

  const assets = new Map<string, { assetId: string; bytes: Buffer }>();

  for (const item of params.state.items) {
    if (assets.has(item.assetId)) continue;
    const key = assetKey(params.shop, item.assetId);
    assertNotUsingOutputAsSource(key, "/outputs/");
    const bytes = await params.store.get(key);
    assets.set(item.assetId, { assetId: item.assetId, bytes });
  }

  const widthPx = Math.round(nest.sheetWidthIn * 300);
  const heightPx = Math.round(nest.sheetHeightIn * 300);
  const maxPixels = params.maxPixels ?? 40_000_000;
  const useTiled =
    params.forceTiled === true || widthPx * heightPx > maxPixels;

  const rendered = useTiled
    ? await renderSheetPngTiled({ nest, assets })
    : await renderSheetPng({ nest, assets, maxPixels });
  const preview = await renderPreviewPng(rendered.png);

  const outKey = outputKey(params.shop, params.designId, params.jobId);
  const prevKey = previewKey(params.shop, params.designId, params.jobId);
  await params.store.put(outKey, rendered.png, "image/png");
  await params.store.put(prevKey, preview, "image/png");

  return {
    sheetWidthIn: nest.sheetWidthIn,
    sheetHeightIn: nest.sheetHeightIn,
    widthPx: rendered.widthPx,
    heightPx: rendered.heightPx,
    outputObjectKey: outKey,
    previewObjectKey: prevKey,
  };
}

export function buildNest(
  state: DesignStateV1,
  sheet: DesignStateV1["sheet"],
): NestResult {
  if (
    state.layout !== "manual" ||
    state.items.some((item) => item.xIn == null || item.yIn == null)
  ) {
    return nestRectangles(state.items, sheet, {
      allowRotate90: state.allowRotate90 === true,
    });
  }

  const placements = state.items.map((item) => ({
    assetId: item.assetId,
    xIn: item.xIn!,
    yIn: item.yIn!,
    widthIn: item.widthIn,
    heightIn: item.heightIn,
    rotationDeg: item.rotationDeg,
  }));
  for (const p of placements) {
    if (
      p.xIn < 0 || p.yIn < 0 ||
      p.xIn + p.widthIn > sheet.widthIn + 1e-6 ||
      p.yIn + p.heightIn > sheet.maxHeightIn + 1e-6
    ) throw new Error(`Item ${p.assetId} is outside the sheet`);
  }
  const usedArea = placements.reduce((sum, p) => sum + p.widthIn * p.heightIn, 0);
  return {
    sheetWidthIn: sheet.widthIn,
    sheetHeightIn: sheet.maxHeightIn,
    placements,
    utilization: usedArea / (sheet.widthIn * sheet.maxHeightIn),
  };
}

export function buildUploadBySizeState(params: {
  assetId: string;
  sourceWidthPx: number;
  sourceHeightPx: number;
  size: SizeInput;
  pricePerSqIn?: number;
  sheet?: DesignStateV1["sheet"];
}): DesignStateV1 {
  return buildUploadBySizeStateFromLines(
    [
      {
        assetId: params.assetId,
        sourceWidthPx: params.sourceWidthPx,
        sourceHeightPx: params.sourceHeightPx,
        size: params.size,
      },
    ],
    {
      pricePerSqIn: params.pricePerSqIn,
      sheet: params.sheet,
    },
  );
}

export function buildUploadBySizeStateFromLines(
  lines: Array<{
    assetId: string;
    sourceWidthPx: number;
    sourceHeightPx: number;
    size: SizeInput;
  }>,
  options?: {
    pricePerSqIn?: number;
    sheet?: DesignStateV1["sheet"];
  },
): DesignStateV1 {
  if (!lines.length) throw new Error("At least one upload is required");
  const items = lines.map((line) => {
    const resolved = resolvePhysicalSize(
      line.size,
      line.sourceWidthPx,
      line.sourceHeightPx,
    );
    return {
      assetId: line.assetId,
      widthIn: resolved.widthIn,
      heightIn: resolved.heightIn,
      quantity: resolved.quantity,
      rotationDeg: 0 as const,
    };
  });
  const pricing = buildPricingSnapshot(
    items,
    options?.pricePerSqIn ?? DEFAULT_PRICE_PER_SQ_IN,
  );
  return {
    schemaVersion: DESIGN_STATE_SCHEMA_VERSION,
    workflow: "upload_by_size",
    sheet: options?.sheet ?? DEFAULT_UPLOAD_BY_SIZE_SHEET,
    items,
    pricing,
    allowRotate90: true,
    layout: "auto",
  };
}

export function hashPayload(body: string | Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}
