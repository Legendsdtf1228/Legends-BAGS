#!/usr/bin/env node
/**
 * Print gang sheet editor URLs for manual screenshot capture at fixed viewports.
 * Run while `npm run dev` (or deployed preview) is reachable.
 *
 * Usage:
 *   node scripts/gang-sheet-editor-screenshots.mjs
 *   BASE_URL=https://your-preview.example node scripts/gang-sheet-editor-screenshots.mjs
 */
const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const base =
  process.env.BASE_URL ||
  process.env.SHOPIFY_APP_URL ||
  "http://localhost:3000";

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
];

const screens = [
  { id: "welcome", path: `/editor/gang-sheet?shop=${encodeURIComponent(shop)}` },
  { id: "canvas-empty", path: `/editor/gang-sheet?shop=${encodeURIComponent(shop)}#canvas` },
  { id: "uploads", note: "Open Uploads rail after canvas loads" },
  { id: "gallery", note: "Open Gallery rail" },
  { id: "text", note: "Open Text rail" },
  { id: "names", note: "Open Names rail" },
  { id: "auto-build", path: `/editor/gang-sheet?shop=${encodeURIComponent(shop)}`, note: "Click Auto Build from welcome" },
  { id: "layers", note: "Open Layers rail with items on sheet" },
  { id: "templates", note: "Open Templates rail" },
  { id: "properties", note: "Select artwork for properties panel" },
  { id: "save-dialog", note: "Click Save & Add to Cart" },
  { id: "tall-sheet", note: "Set length 120in+ and scroll canvas" },
  { id: "mobile-panel", note: "390×844 — open bottom tool drawer" },
];

console.log("# Gang Sheet Editor screenshot routes\n");
console.log(`Base: ${base}`);
console.log(`Shop: ${shop}\n`);
console.log("## Viewports\n");
for (const v of viewports) {
  console.log(`- ${v.name}: ${v.width}×${v.height}`);
}
console.log("\n## Storefront launcher (dev)\n");
console.log(`https://${shop}/apps/legends-bags/builder?type=gang_sheet`);
console.log("\n## Direct editor URLs\n");
for (const s of screens) {
  const url = s.path ? `${base.replace(/\/$/, "")}${s.path}` : "(from editor UI)";
  console.log(`- **${s.id}**: ${url}${s.note ? ` — ${s.note}` : ""}`);
}
console.log("\nSave PNGs under docs/qa/screenshots/gang-sheet-editor/{viewport}/{screen}.png");
console.log("Compare with BAGS at the same viewport before updating docs/qa/gang-sheet-editor-parity.md checkboxes.\n");
