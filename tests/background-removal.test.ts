import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { nestRectangles } from "../app/domain/nesting";
import { renderSheetPng } from "../app/domain/rendering";
import { DEFAULT_UPLOAD_BY_SIZE_SHEET } from "../app/domain/design/types";
import {
  composeRgbaFromMask,
  encodeRgbaPng,
  parseBackgroundPrompt,
  removeBackgroundFromBytes,
} from "../app/domain/image/background-removal";

const BG_REMOVAL_TUNING = {
  prompt: "white background",
  threshold: 40,
  keepMargin: 0,
  feather: 0,
} as const;

/** Solid background with a centered red square — used across transparency tests. */
async function createForegroundOnWhiteBg(size = 120, square = 48) {
  const offset = Math.floor((size - square) / 2);
  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  });
  const fg = await sharp({
    create: {
      width: square,
      height: square,
      channels: 3,
      background: { r: 180, g: 20, b: 20 },
    },
  })
    .png()
    .toBuffer();
  return base.composite([{ input: fg, left: offset, top: offset }]).png().toBuffer();
}

type RgbaStats = {
  width: number;
  height: number;
  channels: number;
  transparentCount: number;
  opaqueCount: number;
  cornerAlpha: number;
  centerAlpha: number;
  cornerRgb: { r: number; g: number; b: number };
  centerRgb: { r: number; g: number; b: number };
  allCornersOpaqueWhite: boolean;
  allCornersOpaqueBlack: boolean;
};

async function analyzeRgba(bytes: Buffer, size?: number): Promise<RgbaStats> {
  const meta = await sharp(bytes).metadata();
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const { width, height, channels } = info;
  let transparentCount = 0;
  let opaqueCount = 0;
  for (let i = 3; i < data.length; i += channels) {
    if (data[i] === 0) transparentCount++;
    else if (data[i] === 255) opaqueCount++;
  }

  const dim = size ?? width;
  const cornerAlpha = data[3];
  const centerIdx = (Math.floor(dim / 2) * width + Math.floor(dim / 2)) * channels;
  const centerAlpha = data[centerIdx + 3];

  const cornerSamples = [
    0,
    (width - 1) * channels,
    (height - 1) * width * channels,
    ((height - 1) * width + (width - 1)) * channels,
  ];
  let allCornersOpaqueWhite = true;
  let allCornersOpaqueBlack = true;
  for (const idx of cornerSamples) {
    const a = data[idx + 3];
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    if (!(a === 255 && r === 255 && g === 255 && b === 255)) allCornersOpaqueWhite = false;
    if (!(a === 255 && r === 0 && g === 0 && b === 0)) allCornersOpaqueBlack = false;
  }

  return {
    width,
    height,
    channels,
    transparentCount,
    opaqueCount,
    cornerAlpha,
    centerAlpha,
    cornerRgb: { r: data[0], g: data[1], b: data[2] },
    centerRgb: {
      r: data[centerIdx],
      g: data[centerIdx + 1],
      b: data[centerIdx + 2],
    },
    allCornersOpaqueWhite,
    allCornersOpaqueBlack,
  };
}

describe("parseBackgroundPrompt", () => {
  it("detects white background and keep-more hints", () => {
    const hints = parseBackgroundPrompt("white background — keep logo shadow");
    expect(hints.backgroundColor).toEqual({ r: 255, g: 255, b: 255 });
    expect(hints.keepMarginAdjust).toBeGreaterThan(0);
    expect(hints.thresholdAdjust).toBeLessThan(0);
  });

  it("detects aggressive removal hints", () => {
    const hints = parseBackgroundPrompt("remove more of the backdrop");
    expect(hints.keepMarginAdjust).toBeLessThan(0);
    expect(hints.thresholdAdjust).toBeGreaterThan(0);
  });
});

describe("composeRgbaFromMask / encodeRgbaPng", () => {
  it("preserves alpha without flattening RGB", async () => {
    const width = 2;
    const height = 1;
    const rgbSource = Buffer.from([255, 0, 0, 0, 255, 0]); // red, green
    const alpha = Buffer.from([0, 255]);
    const rgba = composeRgbaFromMask(rgbSource, 3, alpha, width, height);
    const png = await encodeRgbaPng(rgba, width, height);
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({
      resolveWithObject: true,
    });

    expect(info.channels).toBe(4);
    expect(data[0]).toBe(255); // first pixel red
    expect(data[3]).toBe(0); // first pixel transparent
    expect(data[5]).toBe(255); // second pixel green
    expect(data[7]).toBe(255); // second pixel opaque
  });
});

describe("removeBackgroundFromBytes", () => {
  it("makes white border transparent around a colored square", async () => {
    const size = 120;
    const input = await createForegroundOnWhiteBg(size);
    const out = await removeBackgroundFromBytes(input, BG_REMOVAL_TUNING);
    const stats = await analyzeRgba(out, size);

    expect(stats.cornerAlpha).toBeLessThan(32);
    expect(stats.centerAlpha).toBeGreaterThan(200);
  });

  it("outputs PNG with 4 channels", async () => {
    const input = await createForegroundOnWhiteBg();
    const out = await removeBackgroundFromBytes(input, BG_REMOVAL_TUNING);
    const meta = await sharp(out).metadata();
    const stats = await analyzeRgba(out);

    expect(meta.format).toBe("png");
    expect(stats.channels).toBe(4);
  });

  it("has fully transparent removed pixels", async () => {
    const input = await createForegroundOnWhiteBg();
    const out = await removeBackgroundFromBytes(input, BG_REMOVAL_TUNING);
    const stats = await analyzeRgba(out);

    expect(stats.transparentCount).toBeGreaterThan(0);
    expect(stats.cornerAlpha).toBe(0);
  });

  it("keeps foreground pixels opaque", async () => {
    const input = await createForegroundOnWhiteBg();
    const out = await removeBackgroundFromBytes(input, BG_REMOVAL_TUNING);
    const stats = await analyzeRgba(out);

    expect(stats.centerAlpha).toBeGreaterThan(200);
    expect(stats.opaqueCount).toBeGreaterThan(0);
  });

  it("does not bake a solid white background", async () => {
    const input = await createForegroundOnWhiteBg();
    const out = await removeBackgroundFromBytes(input, BG_REMOVAL_TUNING);
    const stats = await analyzeRgba(out);

    expect(stats.allCornersOpaqueWhite).toBe(false);
    expect(stats.cornerAlpha).toBe(0);
  });

  it("does not bake a solid black background", async () => {
    const size = 120;
    const square = 48;
    const offset = Math.floor((size - square) / 2);
    const input = await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: square,
              height: square,
              channels: 3,
              background: { r: 180, g: 20, b: 20 },
            },
          })
            .png()
            .toBuffer(),
          left: offset,
          top: offset,
        },
      ])
      .png()
      .toBuffer();

    const out = await removeBackgroundFromBytes(input, {
      prompt: "black background",
      threshold: 40,
      keepMargin: 0,
      feather: 0,
    });
    const stats = await analyzeRgba(out, size);

    expect(stats.allCornersOpaqueBlack).toBe(false);
    expect(stats.cornerAlpha).toBe(0);
  });

  it("preserves original dimensions", async () => {
    const size = 120;
    const input = await createForegroundOnWhiteBg(size);
    const inputMeta = await sharp(input).metadata();
    const out = await removeBackgroundFromBytes(input, BG_REMOVAL_TUNING);
    const stats = await analyzeRgba(out);

    expect(stats.width).toBe(inputMeta.width);
    expect(stats.height).toBe(inputMeta.height);
  });

  it("keeps transparent PNG passthrough transparent (not flattened)", async () => {
    const size = 120;
    const square = 48;
    const offset = Math.floor((size - square) / 2);
    const transparent = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: square,
              height: square,
              channels: 4,
              background: { r: 180, g: 20, b: 20, alpha: 1 },
            },
          })
            .png()
            .toBuffer(),
          left: offset,
          top: offset,
        },
      ])
      .png()
      .toBuffer();

    const out = await removeBackgroundFromBytes(transparent, {
      threshold: 40,
      keepMargin: 0,
      feather: 0,
    });
    const stats = await analyzeRgba(out, size);

    expect(stats.cornerAlpha).toBe(0);
    expect(stats.centerAlpha).toBeGreaterThan(200);
    expect(stats.allCornersOpaqueWhite).toBe(false);
    expect(stats.allCornersOpaqueBlack).toBe(false);
  });

  it("keeps more foreground when keepMargin is increased", async () => {
    const input = await sharp({
      create: {
        width: 80,
        height: 80,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 60,
              height: 60,
              channels: 3,
              background: { r: 230, g: 230, b: 230 },
            },
          })
            .png()
            .toBuffer(),
          left: 10,
          top: 10,
        },
      ])
      .jpeg()
      .toBuffer();

    const strict = await removeBackgroundFromBytes(input, { threshold: 70, keepMargin: -8 });
    const lenient = await removeBackgroundFromBytes(input, { threshold: 70, keepMargin: 18 });

    const avgAlpha = async (bytes: Buffer) => {
      const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({
        resolveWithObject: true,
      });
      let sum = 0;
      for (let i = 3; i < data.length; i += info.channels) sum += data[i];
      return sum / (data.length / info.channels);
    };

    expect(await avgAlpha(lenient)).toBeGreaterThan(await avgAlpha(strict));
  });

  it("renders on gang sheet with transparency around artwork", async () => {
    const input = await createForegroundOnWhiteBg(100, 40);
    const cutout = await removeBackgroundFromBytes(input, BG_REMOVAL_TUNING);
    const cutoutStats = await analyzeRgba(cutout);
    expect(cutoutStats.transparentCount).toBeGreaterThan(0);

    const nest = nestRectangles(
      [
        {
          assetId: "cutout",
          widthIn: 2,
          heightIn: 2,
          quantity: 1,
          rotationDeg: 0,
        },
      ],
      { ...DEFAULT_UPLOAD_BY_SIZE_SHEET, widthIn: 6, maxHeightIn: 10 },
    );

    const sheet = await renderSheetPng({
      nest,
      assets: new Map([["cutout", { assetId: "cutout", bytes: cutout }]]),
    });

    const { data, info } = await sharp(sheet.png).ensureAlpha().raw().toBuffer({
      resolveWithObject: true,
    });
    expect(info.channels).toBe(4);

    // Sheet margin corner stays transparent
    expect(data[3]).toBe(0);

    // Region outside the placed artwork (far from nest origin) stays transparent
    const farIdx = (50 * info.width + 50) * info.channels + 3;
    expect(data[farIdx]).toBe(0);
  });
});
