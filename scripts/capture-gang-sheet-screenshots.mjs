#!/usr/bin/env node
/**
 * Capture BAGS parity screenshots with Playwright (optional) or print manual checklist.
 *
 * Usage:
 *   node scripts/capture-gang-sheet-screenshots.mjs
 *   BASE_URL=http://localhost:3000 node scripts/capture-gang-sheet-screenshots.mjs --capture
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const base = (process.env.BASE_URL || process.env.SHOPIFY_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const outDir = join(root, "docs/qa/screenshots/exact-bags-parity");
const capture = process.argv.includes("--capture");

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "laptop-1280", width: 1280, height: 720 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "tablet-portrait-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];

const screens = [
  { id: "empty-editor", path: `/editor/gang-sheet?shop=${encodeURIComponent(shop)}`, note: "Welcome / empty canvas" },
  { id: "uploads", manual: "Open Uploads rail" },
  { id: "uploaded-image", manual: "Place one image on sheet" },
  { id: "four-copy-layout", manual: "Auto Fill Sheet on 11×11.28″ reference image" },
  { id: "selected-properties", manual: "Select artwork — properties panel" },
  { id: "selection-toolbar", manual: "Selection toolbar visible" },
  { id: "enhance-modal", manual: "Open FitCheck / Image Editor → Enhance tab" },
  { id: "halftone-modal", manual: "Image Editor → Halftone tab" },
  { id: "crop-modal", manual: "Image Editor → Crop tab" },
  { id: "colors-modal", manual: "Image Editor → Colors tab" },
  { id: "names-modal", manual: "Bottom nav → Names & Numbers → Add Names" },
  { id: "numbers-modal", manual: "Names & Numbers → Add Numbers" },
  { id: "auto-fill", manual: "Properties → Auto Fill Sheet dialog" },
  { id: "auto-nest", manual: "Toolbar → Auto Nest dialog" },
  { id: "auto-build", manual: "Active sheets → Auto Build flow" },
  { id: "settings", manual: "Settings drawer" },
  { id: "mobile-editor", manual: "390×844 canvas with bottom nav" },
];

async function captureWithPlaywright() {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    console.warn("Playwright not installed — writing manual checklist only.");
    console.warn("Install with: npm i -D playwright && npx playwright install chromium");
    return false;
  }

  await mkdir(outDir, { recursive: true });
  const browser = await playwright.chromium.launch({ headless: true });
  const editorUrl = `${base}/editor/gang-sheet?shop=${encodeURIComponent(shop)}`;

  for (const vp of viewports) {
    const dir = join(outDir, vp.name);
    await mkdir(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(editorUrl, { waitUntil: "networkidle", timeout: 120_000 }).catch(() => page.goto(editorUrl));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(dir, "empty-editor.png"), fullPage: false });
    await page.close();
    console.log(`Captured ${vp.name}/empty-editor.png`);
  }

  await browser.close();
  return true;
}

async function writeChecklist() {
  await mkdir(outDir, { recursive: true });
  const lines = [
    "# Exact BAGS Parity Screenshots",
    "",
    `Base URL: ${base}`,
    `Shop: ${shop}`,
    `App proxy: https://${shop}/apps/legends-bags/`,
    "",
    "## Viewports",
    ...viewports.map((v) => `- ${v.name}: ${v.width}×${v.height}`),
    "",
    "## Screens",
    ...screens.map((s) => {
      const url = s.path ? `${base}${s.path}` : "(from editor UI)";
      return `- **${s.id}**: ${url}${s.manual ? ` — ${s.manual}` : ""}`;
    }),
    "",
    "Save PNGs under docs/qa/screenshots/exact-bags-parity/{viewport}/{screen}.png",
  ];
  const checklistPath = join(outDir, "README.md");
  await writeFile(checklistPath, lines.join("\n") + "\n");
  console.log(`Wrote ${checklistPath}`);
}

await writeChecklist();
if (capture) {
  const ok = await captureWithPlaywright();
  if (!ok) process.exitCode = 0;
} else {
  console.log("\nRun with --capture to attempt Playwright screenshots (requires playwright package).");
}
