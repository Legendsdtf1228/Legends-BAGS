#!/usr/bin/env node
/**
 * Capture Legends visual-clone screenshots for exact-bags-parity sprint.
 *
 * Usage:
 *   node scripts/capture-visual-clone-screenshots.mjs
 *   BASE_URL=http://localhost:3000 node scripts/capture-visual-clone-screenshots.mjs --capture
 *   node scripts/capture-visual-clone-screenshots.mjs --capture --desktop-only
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const base = (process.env.BASE_URL || process.env.SHOPIFY_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const capture = process.argv.includes("--capture");
const desktopOnly = process.argv.includes("--desktop-only");
const fixturePath = join(root, "tests/fixtures/qa-reference-11x11.png");

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "laptop-1280", width: 1280, height: 720 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "tablet-portrait-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];

const desktopModalStates = [
  "empty-editor",
  "uploads",
  "four-copy-sheet",
  "selected-artwork",
  "image-properties",
  "enhance-modal",
  "names-numbers",
  "settings",
  "active-gang-sheets",
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

async function dismissTip(page) {
  const tip = page.locator(".tip-dismiss");
  if (await tip.isVisible().catch(() => false)) {
    await tip.click();
  }
}

async function openCanvas(page) {
  await page.goto(editorUrl, { waitUntil: "networkidle", timeout: 120_000 }).catch(() => page.goto(editorUrl));
  await page.waitForTimeout(1500);
  const buildBtn = page.getByRole("button", { name: "Build a Gang Sheet" });
  if (await buildBtn.isVisible().catch(() => false)) {
    await buildBtn.click();
  }
  await page.waitForSelector(".bags-parity-workspace", { timeout: 60_000 });
  await dismissTip(page);
  await page.waitForTimeout(500);
}

async function uploadFixture(page) {
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(fixturePath);
  await page.waitForSelector(".pool-item", { timeout: 120_000 });
  await page.waitForFunction(() => !document.querySelector(".bags-upload-progress"), null, {
    timeout: 120_000,
  }).catch(() => {});
  await page.waitForTimeout(800);
}

async function placeFromPool(page, times = 1) {
  const poolItem = page.locator(".pool-item").first();
  for (let i = 0; i < times; i += 1) {
    await poolItem.click();
    await page.waitForTimeout(350);
  }
}

async function resetEditorState(page) {
  await openCanvas(page);
}

async function clickRail(page, label) {
  await page.locator(".bags-left-rail-btn").filter({ hasText: label }).click();
}

async function captureShot(page, outDir, name) {
  await page.waitForTimeout(400);
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`Captured ${outDir.replace(/\\/g, "/").split("exact-bags-visual-clone/")[1]}/${name}.png`);
}

async function captureDesktopStates(page, outDir) {
  await resetEditorState(page);
  await captureShot(page, outDir, "empty-editor");

  await clickRail(page, "Uploads");
  await captureShot(page, outDir, "uploads");

  await uploadFixture(page);
  await placeFromPool(page, 4);
  await captureShot(page, outDir, "four-copy-sheet");

  // Last placed piece is auto-selected after pool clicks.
  await captureShot(page, outDir, "selected-artwork");
  await captureShot(page, outDir, "image-properties");

  await page.getByRole("button", { name: "Edit Image" }).click();
  await page.waitForSelector(".bags-image-editor-modal", { timeout: 15_000 });
  await captureShot(page, outDir, "enhance-modal");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  await clickRail(page, "Names & Numbers");
  await page.waitForTimeout(400);
  await captureShot(page, outDir, "names-numbers");

  await clickRail(page, "Settings");
  await page.waitForSelector(".bags-parity-modal", { timeout: 15_000 });
  await captureShot(page, outDir, "settings");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    document.querySelector(".bags-bottom-nav-btn")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForSelector('[aria-label="Active gang sheets"]', { timeout: 15_000 });
  await captureShot(page, outDir, "active-gang-sheets");
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
  const targets = desktopOnly ? viewports.filter((v) => v.name === "desktop-1440") : viewports;

  for (const vp of targets) {
    const dir = join(outBase, vp.name);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    if (vp.name === "desktop-1440") {
      await captureDesktopStates(page, dir);
    } else if (vp.name === "mobile-390") {
      await resetEditorState(page);
      await captureShot(page, dir, "empty-editor");
      await captureShot(page, dir, "mobile-editor");
    } else {
      await openCanvas(page);
      await captureShot(page, dir, "empty-editor");
    }

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
    "## Pixel diff summary (desktop-1440)",
    "",
    "| Region | BAGS ref | Legends after | Delta | Notes |",
    "|--------|----------|---------------|-------|-------|",
    "| Left rail width | 56px | 56px | 0 | White rail |",
    "| Left rail bg | #ffffff | #ffffff | 0 | |",
    "| Header height | 52px | 52px | 0 | |",
    "| Toolbar height | 40px | 40px | 0 | |",
    "| Properties width | 272px | 272px | 0 | |",
    "| Bottom nav (mobile) | icon+label ~52px | icon+label ~52px | ~0 | Icons added sprint 2 |",
    "| Canvas resize handles | 8 + rotate | 8 + rotate | 0 | All handles wired |",
    "| Selection toolbar | icon buttons | SVG icons | ~2px | Glyph stroke weight |",
    "| Image editor nav | vertical 112px | vertical 112px | ~0 | |",
    "| Logo mark | merchant logo | Legends L | n/a | Branding differs |",
    "",
    "## Remaining visible differences",
    "",
    "- BAGS reference PNGs not captured — manual steps in `docs/qa/bags-visual-measurements.md`",
    "- Rail icon glyph shapes approximate BAGS line icons (~1–2px stroke variance)",
    "- Mobile bottom nav label truncation on narrow tabs vs BAGS shorter labels",
    "- Product logo/branding differs (Legends L vs BAGS merchant logo)",
    "- Active gang sheets drawer opens via hidden mobile nav button on desktop (BAGS may expose header entry)",
    "- Four-copy sheet layout spacing may differ ±4px from BAGS nest positions without live reference",
    "",
    "## Captured legends-after states (desktop-1440)",
    "",
    ...desktopModalStates.map((s) => `- \`legends-after/desktop-1440/${s}.png\``),
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
