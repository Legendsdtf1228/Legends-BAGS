/** Browser/canvas image adjustment helpers for the BAGS image editor. */

export type ImageAdjustments = {
  gamma: number;
  contrast: number;
  brightness: number;
  /** Halftone dot size in px (0 = off). */
  halftoneDotSize: number;
  halftoneAngle: number;
};

export const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  gamma: 1,
  contrast: 1,
  brightness: 1,
  halftoneDotSize: 0,
  halftoneAngle: 45,
};

export type CropRect = {
  /** Normalized 0–1 within source image. */
  x: number;
  y: number;
  w: number;
  h: number;
};

export const DEFAULT_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

export function clampAdjust(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** CSS filter string for live preview (gamma approximated via brightness curve). */
export function adjustmentsToCssFilter(adj: ImageAdjustments): string {
  const parts: string[] = [];
  if (adj.brightness !== 1) parts.push(`brightness(${adj.brightness})`);
  if (adj.contrast !== 1) parts.push(`contrast(${adj.contrast})`);
  if (adj.gamma !== 1) {
    const approx = Math.pow(adj.gamma, 0.45);
    parts.push(`brightness(${approx})`);
  }
  return parts.length ? parts.join(" ") : "none";
}

/** Apply adjustments + optional crop to an image via canvas. Returns PNG blob URL. */
export async function renderAdjustedPreview(
  sourceUrl: string,
  adj: ImageAdjustments,
  crop: CropRect = DEFAULT_CROP,
  maxSize = 1200,
): Promise<string> {
  const img = await loadImage(sourceUrl);
  const sx = Math.round(crop.x * img.width);
  const sy = Math.round(crop.y * img.height);
  const sw = Math.max(1, Math.round(crop.w * img.width));
  const sh = Math.max(1, Math.round(crop.h * img.height));
  const scale = Math.min(1, maxSize / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.filter = adjustmentsToCssFilter(adj);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
  ctx.filter = "none";

  if (adj.halftoneDotSize > 0) {
    applyHalftone(ctx, dw, dh, adj.halftoneDotSize, adj.halftoneAngle);
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Preview render failed"))), "image/png"),
  );
  return URL.createObjectURL(blob);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

/** Simple ordered dither halftone overlay for browser preview. */
export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dotSize: number,
  angleDeg: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const step = Math.max(2, Math.round(dotSize));
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      const threshold = ((Math.sin(rx * 0.15) + Math.sin(ry * 0.15)) * 0.5 + 0.5) * 255;
      for (let dy = 0; dy < step && y + dy < height; dy++) {
        for (let dx = 0; dx < step && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const on = lum < threshold;
          if (on) {
            data[idx] = 0;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
          } else {
            data[idx + 3] = Math.min(255, data[idx + 3]);
          }
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Count grid copies that fit on a sheet (auto-fill preview). */
export function autoFillCopyCount(
  widthIn: number,
  heightIn: number,
  sheetWidth: number,
  sheetHeight: number,
  gap: number,
  max = 250,
): number {
  if (widthIn <= 0 || heightIn <= 0) return 0;
  let count = 0;
  for (let y = 0.1; y + heightIn <= sheetHeight; y += heightIn + gap) {
    for (let x = 0.1; x + widthIn <= sheetWidth; x += widthIn + gap) {
      count++;
      if (count >= max) return max;
    }
  }
  return count;
}
