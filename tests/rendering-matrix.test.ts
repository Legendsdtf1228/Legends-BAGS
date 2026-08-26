import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { nestRectangles } from "../app/domain/nesting";
import { renderSheetPng } from "../app/domain/rendering";
import { renderSheetPngTiled } from "../app/domain/rendering/tiled";
import { inchesToPx, DEFAULT_UPLOAD_BY_SIZE_SHEET } from "../app/domain/design/types";

async function png(
  w: number,
  h: number,
  rgba: { r: number; g: number; b: number; alpha: number },
) {
  return sharp({
    create: { width: w, height: h, channels: 4, background: rgba },
  })
    .png()
    .toBuffer();
}

describe("transparency & orientation matrix", () => {
  const cases = [
    {
      name: "landscape transparent",
      w: 120,
      h: 40,
      rgba: { r: 255, g: 0, b: 0, alpha: 0 },
      widthIn: 3,
      heightIn: 1,
    },
    {
      name: "portrait opaque",
      w: 40,
      h: 120,
      rgba: { r: 0, g: 255, b: 0, alpha: 1 },
      widthIn: 1,
      heightIn: 3,
    },
    {
      name: "square partial alpha",
      w: 80,
      h: 80,
      rgba: { r: 0, g: 0, b: 255, alpha: 0.4 },
      widthIn: 2,
      heightIn: 2,
    },
  ];

  for (const c of cases) {
    it(`renders ${c.name} at exact inch→px size`, async () => {
      const art = await png(c.w, c.h, c.rgba);
      const nest = nestRectangles(
        [
          {
            assetId: "a",
            widthIn: c.widthIn,
            heightIn: c.heightIn,
            quantity: 1,
            rotationDeg: 0,
          },
        ],
        { ...DEFAULT_UPLOAD_BY_SIZE_SHEET, widthIn: 8, maxHeightIn: 20 },
      );
      const out = await renderSheetPng({
        nest,
        assets: new Map([["a", { assetId: "a", bytes: art }]]),
      });
      expect(out.widthPx).toBe(inchesToPx(nest.sheetWidthIn));
      expect(out.heightPx).toBe(inchesToPx(nest.sheetHeightIn));
      expect(out.placementsPx[0].width).toBe(inchesToPx(c.widthIn));
      expect(out.placementsPx[0].height).toBe(inchesToPx(c.heightIn));
    });
  }
});

describe("tiled renderer", () => {
  it("matches single-pass dimensions for a multi-row sheet", async () => {
    const art = await png(50, 50, { r: 10, g: 20, b: 30, alpha: 1 });
    const nest = nestRectangles(
      [
        {
          assetId: "a",
          widthIn: 4,
          heightIn: 4,
          quantity: 6,
          rotationDeg: 0,
        },
      ],
      { ...DEFAULT_UPLOAD_BY_SIZE_SHEET, widthIn: 10, maxHeightIn: 80 },
    );

    const single = await renderSheetPng({
      nest,
      assets: new Map([["a", { assetId: "a", bytes: art }]]),
    });
    const tiled = await renderSheetPngTiled({
      nest,
      assets: new Map([["a", { assetId: "a", bytes: art }]]),
      tileHeightPx: 800,
    });

    expect(tiled.widthPx).toBe(single.widthPx);
    expect(tiled.heightPx).toBe(single.heightPx);
    expect(tiled.dpi).toBe(300);
  });
});
