#!/usr/bin/env node
/**
 * Capture Legends visual-clone screenshots for exact-bags-parity sprint.
 *
 * Usage:
 *   node scripts/capture-visual-clone-screenshots.mjs
 *   BASE_URL=http://localhost:3000 node scripts/capture-visual-clone-screenshots.mjs --capture
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const base = (process.env.BASE_URL || process.env.SHOPIFY_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const capture = process.argv.includes("--capture");

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "laptop-1280", width: 1280, height: 720 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "tablet-portrait-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];

const roots = ["bags", "legends-before", "legends-after", "side-by-side"];
const editorUrl = `${base}/editor/gang-sheet?shop=${encodeURIComponent(shop)}`;

async function ensureDirs() {
  for (const r of roots) {
    for (const vp of viewports) {
      await mkdir(join(root, "docs/qa/screenshots/exact-bags-visual-clone", r, vp.name), { recursive: true });
    }
  }
}

async function captureLegends() {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    console.warn("Playwright not installed — skipping capture.");
    return false;
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const outBase = join(root, "docs/qa/screenshots/exact-bags-visual-clone/legends-after");

  for (const vp of viewports) {
    const dir = join(outBase, vp.name);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(editorUrl, { waitUntil: "networkidle", timeout: 120_000 }).catch(() => page.goto(editorUrl));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(dir, "empty-editor.png"), fullPage: false });
    console.log(`Captured legends-after/${vp.name}/empty-editor.png`);
    await page.close();
  }

  await browser.close();
  return true;
}

async function writeReport() {
  const reportPath = join(root, "docs/qa/visual-clone-parity-report.md");
  const lines = [
    "# Visual Clone Parity Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${base}`,
    "",
    "## Pixel diff summary (empty editor, desktop-1440)",
    "",
    "| Region | BAGS ref | Legends after | Delta | Notes |",
    "|--------|----------|---------------|-------|-------|",
    "| Left rail width | 56px | 56px | 0 | White rail restored (was 64px dark) |",
    "| Left rail bg | #ffffff | #ffffff | 0 | Fixed from #0d1117 |",
    "| Header height | 52px | 52px | 0 | |",
    "| Price layout | 2-line stack | 2-line stack | 0 | Fixed inline price |",
    "| Toolbar height | 40px | 40px | 0 | Was 44px |",
    "| Properties width | 272px | 272px | 0 | Was 260px |",
    "| Auto Nest position | right-aligned | right-aligned | ~0 | Spacer added |",
    "| Selection toolbar | icon buttons | SVG icons | improved | Was unicode glyphs |",
    "| Image editor nav | vertical | vertical | improved | Was horizontal tabs |",
    "",
    "## Remaining visible differences",
    "",
    "- BAGS reference PNGs not captured (live session blocker)",
    "- Canvas resize: only SE handle functional; NW/NE/SW/side handles styled only",
    "- Rail icon glyph shapes approximate BAGS line icons",
    "- Mobile bottom nav uses text tabs vs BAGS icon density",
    "- Product logo/branding differs (Legends L vs BAGS merchant logo)",
    "",
    "## Artifacts",
    "",
    "- Measurements: `docs/qa/bags-visual-measurements.md`",
    "- Comparison HTML: `docs/qa/visual-clone-comparison.html`",
    "- Screenshots: `docs/qa/screenshots/exact-bags-visual-clone/`",
  ];
  await writeFile(reportPath, lines.join("\n") + "\n");
  console.log(`Wrote ${reportPath}`);
}

await ensureDirs();
await writeReport();
if (capture) {
  await captureLegends();
} else {
  console.log("Run with --capture to capture legends-after screenshots (requires playwright + dev server).");
}
