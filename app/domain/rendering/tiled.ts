import sharp from "sharp";
import { inchesToPx, OUTPUT_DPI } from "../design/types";
import type { NestResult } from "../nesting";
import type { RenderAsset, RenderOutput } from "./index";

export type TileRenderInput = {
  nest: NestResult;
  assets: Map<string, RenderAsset>;
  /** Max tile height in pixels (width is full sheet width). */
  tileHeightPx?: number;
};

const DEFAULT_TILE_HEIGHT = 4000;

/**
 * Stream-friendly tiled sheet render for tall gang sheets.
 * Composites row-by-row tiles then joins vertically — keeps peak memory bounded.
 */
export async function renderSheetPngTiled(
  input: TileRenderInput,
): Promise<RenderOutput> {
  const widthPx = inchesToPx(input.nest.sheetWidthIn);
  const heightPx = inchesToPx(input.nest.sheetHeightIn);
  const tileHeight = input.tileHeightPx ?? DEFAULT_TILE_HEIGHT;

  const placementsPx = input.nest.placements.map((p) => ({
    assetId: p.assetId,
    x: inchesToPx(p.xIn),
    y: inchesToPx(p.yIn),
    width: inchesToPx(p.widthIn),
    height: inchesToPx(p.heightIn),
    rotationDeg: p.rotationDeg,
  }));

  const placedBuffers: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    buffer: Buffer;
  }> = [];

  for (const p of placementsPx) {
    const asset = input.assets.get(p.assetId);
    if (!asset) throw new Error(`Missing asset ${p.assetId}`);
    let img = sharp(asset.bytes, { failOn: "none" }).ensureAlpha();
    if (p.rotationDeg === 90) img = img.rotate(90);
    const buffer = await img
      .resize(p.width, p.height, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();
    placedBuffers.push({
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      buffer,
    });
  }

  const tiles: Buffer[] = [];
  for (let top = 0; top < heightPx; top += tileHeight) {
    const h = Math.min(tileHeight, heightPx - top);
    const overlays: sharp.OverlayOptions[] = [];

    for (const pb of placedBuffers) {
      const pbBottom = pb.y + pb.height;
      if (pbBottom <= top || pb.y >= top + h) continue;

      const srcTop = Math.max(0, top - pb.y);
      const srcBottom = Math.min(pb.height, top + h - pb.y);
      const cropHeight = srcBottom - srcTop;
      if (cropHeight <= 0) continue;

      const cropped = await sharp(pb.buffer)
        .extract({
          left: 0,
          top: srcTop,
          width: pb.width,
          height: cropHeight,
        })
        .png()
        .toBuffer();

      overlays.push({
        input: cropped,
        left: pb.x,
        top: pb.y + srcTop - top,
      });
    }

    const tile = await sharp({
      create: {
        width: widthPx,
        height: h,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(overlays)
      .png()
      .toBuffer();
    tiles.push(tile);
  }

  let y = 0;
  const tileOverlays: sharp.OverlayOptions[] = [];
  for (const tile of tiles) {
    tileOverlays.push({ input: tile, left: 0, top: y });
    const meta = await sharp(tile).metadata();
    y += meta.height ?? 0;
  }

  const joined = await sharp({
    create: {
      width: widthPx,
      height: heightPx,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(tileOverlays)
    .png({ compressionLevel: 9 })
    .withMetadata({ density: OUTPUT_DPI })
    .toBuffer();

  return {
    png: joined,
    widthPx,
    heightPx,
    dpi: OUTPUT_DPI,
    placementsPx,
  };
}
