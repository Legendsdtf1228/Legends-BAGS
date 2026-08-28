#!/usr/bin/env node
/**
 * Capture gang sheet editor screenshots for QA / PR acceptance.
 *
 * Usage:
 *   node scripts/capture-gang-sheet-screenshots.mjs after
 *   node scripts/capture-gang-sheet-screenshots.mjs before
 *
 * Env:
 *   BASE_URL=http://localhost:56497
 *   DEV_SHOP=legends-bags-in2lwdll.myshopify.com
 *   OUT_DIR=docs/qa/screenshots/gang-sheet-editor
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const phase = process.argv[2] || "after";
const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const base = (process.env.BASE_URL || "http://localhost:56497").replace(/\/$/, "");
const root = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.resolve(root, "..", process.env.OUT_DIR || "docs/qa/screenshots/gang-sheet-editor", phase);

const viewports = [
  { id: "1440x1000", width: 1440, height: 1000 },
  { id: "1280x800", width: 1280, height: 800 },
  { id: "1024x768", width: 1024, height: 768 },
  { id: "768x1024", width: 768, height: 1024 },
  { id: "430x932", width: 430, height: 932 },
  { id: "390x844", width: 390, height: 844 },
];

const editorUrl = `${base}/editor/gang-sheet?shop=${encodeURIComponent(shop)}`;

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    console.error("Install Playwright first: npm install -D playwright && npx playwright install chromium");
    process.exit(1);
  }
}

async function openCanvas(page) {
  await page.goto(editorUrl, { waitUntil: "networkidle", timeout: 120_000 });
  await page.getByRole("button", { name: /Build a Gang Sheet/i }).click();
  await page.locator(".gs-command-bar").waitFor({ timeout: 30_000 });
}

async function capture(page, filePath) {
  await page.screenshot({ path: filePath, fullPage: false });
}

async function run() {
  const { chromium } = await loadPlaywright();
  await mkdir(outRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const manifest = { phase, base, shop, editorUrl, capturedAt: new Date().toISOString(), shots: [] };

  for (const vp of viewports) {
    const dir = path.join(outRoot, vp.id);
    await mkdir(dir, { recursive: true });
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    try {
      await openCanvas(page);
      const emptyPath = path.join(dir, "empty-canvas.png");
      await capture(page, emptyPath);
      manifest.shots.push({ viewport: vp.id, state: "empty-canvas", file: emptyPath });

      await page.getByRole("button", { name: /^Uploads$/ }).first().click();
      await page.locator(".sidebar-panel .heading strong").filter({ hasText: "Uploads" }).waitFor();
      const uploadsPath = path.join(dir, "uploads-panel.png");
      await capture(page, uploadsPath);
      manifest.shots.push({ viewport: vp.id, state: "uploads-panel", file: uploadsPath });

      await page.getByRole("button", { name: /^Layers$/ }).first().click();
      const layersPath = path.join(dir, "layers-panel.png");
      await capture(page, layersPath);
      manifest.shots.push({ viewport: vp.id, state: "layers-panel", file: layersPath });

      const qualityBtn = page.locator(".gs-quality-btn");
      if (await qualityBtn.count()) {
        await qualityBtn.click();
        await page.locator(".gs-quality-panel, .gs-quality-backdrop").first().waitFor({ timeout: 5000 }).catch(() => {});
        const qualityPath = path.join(dir, "quality-inspector.png");
        await capture(page, qualityPath);
        manifest.shots.push({ viewport: vp.id, state: "quality-inspector", file: qualityPath });
        await page.keyboard.press("Escape");
      }

      await page.getByRole("banner").getByRole("button", { name: /^Save$/ }).click().catch(() => {});
      await page.locator(".gs-save-dialog").waitFor({ timeout: 5000 }).catch(() => {});
      const savePath = path.join(dir, "save-dialog.png");
      await capture(page, savePath);
      manifest.shots.push({ viewport: vp.id, state: "save-dialog", file: savePath });
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: /Back to Welcome Center|Home/i }).first().click();
      await page.locator(".welcome-card").waitFor({ timeout: 10_000 });
      await page.locator(".welcome-opt").filter({ hasText: "Auto Arrange" }).click();
      await page.locator(".auto-mode, .auto-upload-panel").first().waitFor({ timeout: 15_000 });
      const autoPath = path.join(dir, "auto-arrange.png");
      await capture(page, autoPath);
      manifest.shots.push({ viewport: vp.id, state: "auto-arrange", file: autoPath });
    } catch (err) {
      manifest.shots.push({ viewport: vp.id, state: "error", error: String(err) });
      const errPath = path.join(dir, "_error.png");
      await page.screenshot({ path: errPath }).catch(() => {});
    }

    await context.close();
  }

  await browser.close();
  const manifestPath = path.join(outRoot, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Captured ${manifest.shots.length} entries → ${outRoot}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
