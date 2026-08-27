import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  parseBackgroundPrompt,
  removeBackgroundFromBytes,
} from "../app/domain/image/background-removal";

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

describe("removeBackgroundFromBytes", () => {
  it("makes white border transparent around a colored square", async () => {
    const size = 120;
    const square = 48;
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
    const input = await base
      .composite([{ input: fg, left: offset, top: offset }])
      .png()
      .toBuffer();

    const out = await removeBackgroundFromBytes(input, {
      prompt: "white background",
      threshold: 40,
      keepMargin: 0,
      feather: 0,
    });
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({
      resolveWithObject: true,
    });
    const cornerAlpha = data[3];
    const centerIdx = (Math.floor(size / 2) * size + Math.floor(size / 2)) * info.channels + 3;
    const centerAlpha = data[centerIdx];

    expect(cornerAlpha).toBeLessThan(32);
    expect(centerAlpha).toBeGreaterThan(200);
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
});
