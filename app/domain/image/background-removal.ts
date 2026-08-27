import sharp from "sharp";

export type BackgroundRemovalTuning = {
  /** Natural-language hint, e.g. "white background, keep logo shadow" */
  prompt?: string;
  /** -30..30 px — positive keeps more foreground when removal is too aggressive */
  keepMargin?: number;
  /** 0..15 — edge softness */
  feather?: number;
  /** 5..95 — higher removes more similar colors */
  threshold?: number;
};

export type ParsedPromptHints = {
  backgroundColor?: { r: number; g: number; b: number };
  keepMarginAdjust: number;
  thresholdAdjust: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

/** Parse customer prompt into tuning hints for mask refinement. */
export function parseBackgroundPrompt(prompt: string): ParsedPromptHints {
  const lower = prompt.toLowerCase().trim();
  let keepMarginAdjust = 0;
  let thresholdAdjust = 0;
  let backgroundColor: ParsedPromptHints["backgroundColor"];

  if (/white\s*(bg|background)|on white/.test(lower)) {
    backgroundColor = { r: 255, g: 255, b: 255 };
  } else if (/black\s*(bg|background)/.test(lower)) {
    backgroundColor = { r: 0, g: 0, b: 0 };
  } else if (/green\s*screen|chroma\s*key/.test(lower)) {
    backgroundColor = { r: 0, g: 177, b: 64 };
  } else if (/gray|grey\s*(bg|background)/.test(lower)) {
    backgroundColor = { r: 240, g: 240, b: 240 };
  }

  if (
    /keep\s+(more|shadow|detail|edge|text|logo)|don't remove|too much|restore|bring back/.test(
      lower,
    )
  ) {
    keepMarginAdjust += 14;
    thresholdAdjust -= 18;
  }
  if (/remove\s+more|aggressive|cleaner|stricter/.test(lower)) {
    keepMarginAdjust -= 12;
    thresholdAdjust += 18;
  }

  return { backgroundColor, keepMarginAdjust, thresholdAdjust };
}

function sampleCornerBackground(
  rgba: Buffer,
  width: number,
  height: number,
  channels: number,
): { r: number; g: number; b: number } {
  const margin = Math.max(2, Math.floor(Math.min(width, height) * 0.04));
  const samples: Array<{ r: number; g: number; b: number }> = [];
  const corners = [
    [0, 0],
    [width - margin, 0],
    [0, height - margin],
    [width - margin, height - margin],
  ] as const;

  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + margin && y < height; y++) {
      for (let x = cx; x < cx + margin && x < width; x++) {
        const i = (y * width + x) * channels;
        samples.push({ r: rgba[i], g: rgba[i + 1], b: rgba[i + 2] });
      }
    }
  }

  const rs = samples.map((s) => s.r).sort((a, b) => a - b);
  const gs = samples.map((s) => s.g).sort((a, b) => a - b);
  const bs = samples.map((s) => s.b).sort((a, b) => a - b);
  const mid = Math.floor(rs.length / 2);
  return { r: rs[mid], g: gs[mid], b: bs[mid] };
}

async function refineAlphaChannel(
  alpha: Buffer,
  width: number,
  height: number,
  keepMargin: number,
  feather: number,
) {
  let refined = alpha;
  if (keepMargin !== 0) {
    const blur = Math.abs(keepMargin) * 0.75 + 0.5;
    let pipeline = sharp(refined, { raw: { width, height, channels: 1 } }).blur(blur);
    pipeline =
      keepMargin > 0 ? pipeline.linear(1.12, 12) : pipeline.linear(0.88, -12);
    refined = await pipeline.raw().toBuffer();
  }
  if (feather > 0) {
    refined = await sharp(refined, { raw: { width, height, channels: 1 } })
      .blur(feather * 0.65)
      .raw()
      .toBuffer();
  }
  return refined;
}

async function removeBackgroundViaRemoveBg(bytes: Buffer, apiKey: string): Promise<Buffer> {
  const form = new FormData();
  form.append("image_file", new Blob([new Uint8Array(bytes)]), "upload.png");
  form.append("size", "auto");
  form.append("format", "png");
  form.append("type", "auto");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `remove.bg failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function refineExistingAlphaPng(
  pngBytes: Buffer,
  tuning: BackgroundRemovalTuning,
  hints: ParsedPromptHints,
): Promise<Buffer> {
  const keepMargin = clamp((tuning.keepMargin ?? 0) + hints.keepMarginAdjust, -30, 30);
  const feather = clamp(tuning.feather ?? 2, 0, 15);

  const { data, info } = await sharp(pngBytes).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const { width, height, channels } = info;
  const alphaOnly = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaOnly[i] = data[i * channels + 3];
  }

  const refinedAlpha = await refineAlphaChannel(alphaOnly, width, height, keepMargin, feather);
  const rgb = await sharp(pngBytes).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = rgb[i * 3];
    rgba[i * 4 + 1] = rgb[i * 3 + 1];
    rgba[i * 4 + 2] = rgb[i * 3 + 2];
    rgba[i * 4 + 3] = refinedAlpha[i];
  }
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function removeBackgroundLocal(
  bytes: Buffer,
  opts: {
    backgroundColor?: { r: number; g: number; b: number };
    keepMargin: number;
    feather: number;
    threshold: number;
  },
): Promise<Buffer> {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const { width, height, channels } = info;
  const bg = opts.backgroundColor ?? sampleCornerBackground(data, width, height, channels);
  const thresholdDist = 12 + (opts.threshold / 100) * 88;
  const soft = thresholdDist * 0.35;

  const alpha = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const dist = colorDistance(data[o], data[o + 1], data[o + 2], bg.r, bg.g, bg.b);
    let opacity: number;
    if (dist <= thresholdDist - soft) opacity = 0;
    else if (dist >= thresholdDist + soft) opacity = 1;
    else opacity = (dist - (thresholdDist - soft)) / (2 * soft);
    alpha[i] = Math.round(opacity * 255);
  }

  const refinedAlpha = await refineAlphaChannel(
    alpha,
    width,
    height,
    opts.keepMargin,
    opts.feather,
  );

  const rgb = await sharp(bytes).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = rgb[i * 3];
    rgba[i * 4 + 1] = rgb[i * 3 + 1];
    rgba[i * 4 + 2] = rgb[i * 3 + 2];
    rgba[i * 4 + 3] = refinedAlpha[i];
  }
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/** Remove background and return PNG bytes with alpha. */
export async function removeBackgroundFromBytes(
  inputBytes: Buffer,
  tuning: BackgroundRemovalTuning = {},
): Promise<Buffer> {
  const hints = parseBackgroundPrompt(tuning.prompt ?? "");
  const keepMargin = clamp((tuning.keepMargin ?? 0) + hints.keepMarginAdjust, -30, 30);
  const feather = clamp(tuning.feather ?? 2, 0, 15);
  const threshold = clamp((tuning.threshold ?? 45) + hints.thresholdAdjust, 5, 95);

  const apiKey = process.env.REMOVE_BG_API_KEY?.trim();
  if (apiKey) {
    try {
      const cutout = await removeBackgroundViaRemoveBg(inputBytes, apiKey);
      return refineExistingAlphaPng(cutout, tuning, hints);
    } catch {
      /* fall through to local segmentation */
    }
  }

  return removeBackgroundLocal(inputBytes, {
    backgroundColor: hints.backgroundColor,
    keepMargin,
    feather,
    threshold,
  });
}
