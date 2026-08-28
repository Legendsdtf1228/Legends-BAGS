#!/usr/bin/env node
/**
 * Capture gang sheet editor BAGS parity screenshots at 1280×720.
 *
 * Usage:
 *   node scripts/capture-gang-sheet-screenshots.mjs
 *   node scripts/capture-gang-sheet-screenshots.mjs parity-1280x720
 *
 * Env:
 *   BASE_URL=http://localhost:56497
 *   DEV_SHOP=legends-bags-in2lwdll.myshopify.com
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const phase = process.argv[2] || "parity-1280x720";
const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const base = (process.env.BASE_URL || "http://localhost:56497").replace(/\/$/, "");
const root = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.resolve(root, "..", "docs/qa/screenshots/gang-sheet-editor", phase);
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
  const buildBtn = page.getByRole("button", { name: /Build a Gang Sheet/i });
  if (await buildBtn.count()) {
    await buildBtn.click();
  }
  await page.locator(".bags-parity-editor").waitFor({ timeout: 30_000 });
}

async function capture(page, filePath) {
  await page.screenshot({ path: filePath, fullPage: false });
}

async function run() {
  const { chromium } = await loadPlaywright();
  await mkdir(outRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const manifest = { phase, base, shop, editorUrl, capturedAt: new Date().toISOString(), shots: [] };

  const shots = [
    { name: "01-empty-editor.png", action: async () => openCanvas(page) },
    {
      name: "03-add-image-modal.png",
      action: async () => {
        await page.getByRole("button", { name: "Add Image" }).click();
        await page.locator(".bags-parity-modal").waitFor({ timeout: 5000 });
      },
    },
    {
      name: "04-names-numbers-modal.png",
      action: async () => {
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Names & Numbers" }).click();
        await page.locator(".bags-names-modal").waitFor({ timeout: 5000 });
      },
    },
    {
      name: "05-settings-modal.png",
      action: async () => {
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Settings" }).click();
        await page.locator(".bags-settings-modal").waitFor({ timeout: 5000 });
      },
    },
    {
      name: "09-active-sheets-drawer.png",
      action: async () => {
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Select" }).click();
        await page.locator(".bags-active-sheets").waitFor({ timeout: 5000 });
      },
    },
  ];

  try {
    for (const shot of shots) {
      await shot.action();
      const filePath = path.join(outRoot, shot.name);
      await capture(page, filePath);
      manifest.shots.push({ file: shot.name, path: filePath });
    }
  } catch (err) {
    manifest.error = String(err);
    await page.screenshot({ path: path.join(outRoot, "_error.png") }).catch(() => {});
  }

  await browser.close();
  await writeFile(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Captured ${manifest.shots.length} shots → ${outRoot}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
