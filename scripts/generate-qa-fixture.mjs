#!/usr/bin/env node
/** Generate dev-only QA reference artwork (11×11.28″ @ 90 DPI ≈ 990×1015 px). */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "tests/fixtures");
const outPath = join(outDir, "qa-reference-11x11.png");

const width = 990;
const height = 1015;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f97316"/>
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="#fff" stroke="#202124" stroke-width="4"/>
  <text x="50%" y="46%" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="#1a73e8">QA</text>
  <text x="50%" y="56%" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" fill="#5f6368">11.00 × 11.28 in</text>
  <text x="50%" y="64%" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#5f6368">tests/fixtures/qa-reference-11x11.png</text>
</svg>`;

await mkdir(outDir, { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log(`Wrote ${outPath} (${width}×${height}px)`);
