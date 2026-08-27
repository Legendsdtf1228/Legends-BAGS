import sharp from "sharp";
import { inchesToPx, OUTPUT_DPI } from "../design/types";
import type { NestPlacement, NestResult } from "../nesting";

/** Ascending zIndex so higher layers composite last (on top). Stable by original index. */
export function sortPlacementsForPaint(
  placements: NestPlacement[],
): NestPlacement[] {
  if (!placements.some((p) => p.zIndex != null)) return placements;
  return placements
    .map((p, index) => ({ p, index }))
    .sort((a, b) => (a.p.zIndex ?? a.index) - (b.p.zIndex ?? b.index))
    .map(({ p }) => p);
}

export type RenderAsset = {
  assetId: string;
  /** Original bytes (PNG/JPEG). Must not be a prior sheet output. */
  bytes: Buffer;
};

export type RenderInput = {
  nest: NestResult;
  assets: Map<string, RenderAsset>;
  /** Soft max pixels for a single buffer (width*height). */
  maxPixels?: number;
};

export type RenderOutput = {
  png: Buffer;
  widthPx: number;
  heightPx: number;
  dpi: typeof OUTPUT_DPI;
  placementsPx: Array<{
    assetId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotationDeg: 0 | 90;
  }>;
};

const DEFAULT_MAX_PIXELS = 40_000_000; // ~40MP safety for in-process render

/**
 * Compose a transparent 300 DPI PNG from nest placements and original assets.
 * Always scales from originals — never from a previous sheet PNG.
 */
export async function renderSheetPng(input: RenderInput): Promise<RenderOutput> {
  const widthPx = inchesToPx(input.nest.sheetWidthIn);
  const heightPx = inchesToPx(input.nest.sheetHeightIn);
  const pixels = widthPx * heightPx;
  const maxPixels = input.maxPixels ?? DEFAULT_MAX_PIXELS;
  if (pixels > maxPixels) {
    throw new Error(
      `Sheet ${widthPx}×${heightPx}px exceeds maxPixels ${maxPixels}; use tiled renderer`,
    );
  }

  const orderedPlacements = sortPlacementsForPaint(input.nest.placements);
  const placementsPx = orderedPlacements.map((p) => ({
    assetId: p.assetId,
    x: inchesToPx(p.xIn),
    y: inchesToPx(p.yIn),
    width: inchesToPx(p.widthIn),
    height: inchesToPx(p.heightIn),
    rotationDeg: p.rotationDeg,
    flipX: p.flipX,
    flipY: p.flipY,
  }));

  const composites: sharp.OverlayOptions[] = [];

  for (const p of placementsPx) {
    const asset = input.assets.get(p.assetId);
    if (!asset) throw new Error(`Missing asset ${p.assetId}`);

    let img = sharp(asset.bytes, { failOn: "none" }).ensureAlpha();

    if (p.rotationDeg === 90) {
      img = img.rotate(90);
    }
    if (p.flipX) img = img.flop();
    if (p.flipY) img = img.flip();

    const resized = await img
      .resize(p.width, p.height, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();

    composites.push({
      input: resized,
      left: p.x,
      top: p.y,
    });
  }

  const png = await sharp({
    create: {
      width: widthPx,
      height: heightPx,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .withMetadata({ density: OUTPUT_DPI })
    .toBuffer();

  return {
    png,
    widthPx,
    heightPx,
    dpi: OUTPUT_DPI,
    placementsPx,
  };
}

/** Downscaled preview for merchant UI (not for print). */
export async function renderPreviewPng(
  sheetPng: Buffer,
  maxEdgePx = 1200,
): Promise<Buffer> {
  return sharp(sheetPng)
    .resize({
      width: maxEdgePx,
      height: maxEdgePx,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
}

/**
 * Guard against cumulative scaling bugs: regeneration must use original asset
 * bytes + design-state inches, not a previous output as source.
 */
export function assertNotUsingOutputAsSource(
  sourceKey: string,
  outputKeyPrefix: string,
): void {
  if (sourceKey.includes("/outputs/")) {
    throw new Error(
      "Refusing to render from a previous output; use original asset",
    );
  }
  if (sourceKey.startsWith(outputKeyPrefix)) {
    throw new Error("Source key collides with output prefix");
  }
}
