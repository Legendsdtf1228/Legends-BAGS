import { createHash } from "node:crypto";
import {
  DEFAULT_PRICE_PER_SQ_IN,
  DEFAULT_UPLOAD_BY_SIZE_SHEET,
  DESIGN_STATE_SCHEMA_VERSION,
  type DesignStateV1,
} from "../design/types";
import { nestRectangles } from "../nesting";
import { buildPricingSnapshot, resolvePhysicalSize, type SizeInput } from "../pricing";
import {
  assertNotUsingOutputAsSource,
  renderPreviewPng,
  renderSheetPng,
} from "../rendering";
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

  const nest = nestRectangles(params.state.items, sheet, {
    allowRotate90: params.state.allowRotate90 === true,
  });

  const assets = new Map<
    string,
    { assetId: string; bytes: Buffer }
  >();

  for (const item of params.state.items) {
    if (assets.has(item.assetId)) continue;
    const key = assetKey(params.shop, item.assetId);
    assertNotUsingOutputAsSource(key, "/outputs/");
    const bytes = await params.store.get(key);
    assets.set(item.assetId, { assetId: item.assetId, bytes });
  }

  const rendered = await renderSheetPng({ nest, assets });
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

export function buildUploadBySizeState(params: {
  assetId: string;
  sourceWidthPx: number;
  sourceHeightPx: number;
  size: SizeInput;
  pricePerSqIn?: number;
  sheet?: DesignStateV1["sheet"];
}): DesignStateV1 {
  const resolved = resolvePhysicalSize(
    params.size,
    params.sourceWidthPx,
    params.sourceHeightPx,
  );
  const items = [
    {
      assetId: params.assetId,
      widthIn: resolved.widthIn,
      heightIn: resolved.heightIn,
      quantity: resolved.quantity,
      rotationDeg: 0 as const,
    },
  ];
  const pricing = buildPricingSnapshot(
    items,
    params.pricePerSqIn ?? DEFAULT_PRICE_PER_SQ_IN,
  );
  return {
    schemaVersion: DESIGN_STATE_SCHEMA_VERSION,
    workflow: "upload_by_size",
    sheet: params.sheet ?? DEFAULT_UPLOAD_BY_SIZE_SHEET,
    items,
    pricing,
    allowRotate90: true,
  };
}

export function hashPayload(body: string | Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}
