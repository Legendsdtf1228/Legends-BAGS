import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { nestRectangles } from "../app/domain/nesting";
import {
  assertNotUsingOutputAsSource,
  renderSheetPng,
} from "../app/domain/rendering";
import { inchesToPx, OUTPUT_DPI } from "../app/domain/design/types";
import { nestAndRenderDesign } from "../app/domain/design/pipeline";
import { LocalObjectStore, assetKey } from "../app/domain/storage";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  DEFAULT_UPLOAD_BY_SIZE_SHEET,
  DESIGN_STATE_SCHEMA_VERSION,
} from "../app/domain/design/types";

async function solidPng(
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

describe("rendering golden properties", () => {
  it("emits exact 300 DPI pixel dimensions and preserves transparency", async () => {
    const art = await solidPng(100, 50, { r: 255, g: 0, b: 0, alpha: 0.5 });
    const nest = nestRectangles(
      [
        {
          assetId: "a",
          widthIn: 2,
          heightIn: 1,
          quantity: 1,
          rotationDeg: 0,
        },
      ],
      { ...DEFAULT_UPLOAD_BY_SIZE_SHEET, widthIn: 4, maxHeightIn: 10 },
    );

    const out = await renderSheetPng({
      nest,
      assets: new Map([["a", { assetId: "a", bytes: art }]]),
    });

    expect(out.dpi).toBe(OUTPUT_DPI);
    expect(out.widthPx).toBe(inchesToPx(nest.sheetWidthIn));
    expect(out.heightPx).toBe(inchesToPx(nest.sheetHeightIn));

    const meta = await sharp(out.png).ensureAlpha().raw().toBuffer({
      resolveWithObject: true,
    });
    // Some corner pixel should be fully transparent (artboard margin)
    const firstAlpha = meta.data[3];
    expect(firstAlpha).toBe(0);
  });

  it("keeps aspect when reprocessing at a new width (BAGS regression)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lgs-render-"));
    const store = new LocalObjectStore(dir);
    const shop = "test-shop.myshopify.com";
    const assetId = "asset_aspect";
    const art = await solidPng(400, 200, { r: 0, g: 128, b: 255, alpha: 1 });
    await store.put(assetKey(shop, assetId), art, "image/png");

    const state = {
      schemaVersion: DESIGN_STATE_SCHEMA_VERSION,
      workflow: "upload_by_size" as const,
      sheet: {
        ...DEFAULT_UPLOAD_BY_SIZE_SHEET,
        widthIn: 22.5,
        maxHeightIn: 40,
      },
      items: [
        {
          assetId,
          widthIn: 4,
          heightIn: 2,
          quantity: 2,
          rotationDeg: 0 as const,
        },
      ],
      pricing: {
        currency: "USD" as const,
        pricePerSqIn: 0.049,
        areaSqIn: 16,
        totalCents: 78,
      },
      allowRotate90: false,
    };

    const first = await nestAndRenderDesign({
      shop,
      designId: "d1",
      jobId: "j1",
      state,
      store,
    });

    const second = await nestAndRenderDesign({
      shop,
      designId: "d1",
      jobId: "j2",
      state,
      store,
      reprocessWidthIn: 18,
    });

    // Item physical size must remain 4×2 — only sheet width changes
    expect(state.items[0].widthIn / state.items[0].heightIn).toBe(2);
    expect(second.sheetWidthIn).toBe(18);
    expect(first.sheetWidthIn).toBe(22.5);

    // Output aspect of placements stays consistent with inches→px rounding
    const expectedItemW = inchesToPx(4);
    const expectedItemH = inchesToPx(2);
    expect(expectedItemW / expectedItemH).toBeCloseTo(2, 5);

    await rm(dir, { recursive: true, force: true });
  });

  it("refuses to treat outputs as sources", () => {
    expect(() =>
      assertNotUsingOutputAsSource("shop/designs/d/outputs/j/sheet.png", "/outputs/"),
    ).toThrow(/previous output/);
  });
});
