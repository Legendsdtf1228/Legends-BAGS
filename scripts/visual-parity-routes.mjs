#!/usr/bin/env node
/**
 * Lists Legends BAGS routes and viewports for visual parity screenshots.
 * Capture manually or with your preferred browser automation tool.
 */
const routes = [
  { name: "dashboard", path: "/app", auth: "admin" },
  { name: "products", path: "/app/products", auth: "admin" },
  { name: "designs", path: "/app/designs", auth: "admin" },
  { name: "orders", path: "/app/orders", auth: "admin" },
  { name: "gallery", path: "/app/gallery", auth: "admin" },
  { name: "fonts", path: "/app/fonts", auth: "admin" },
  { name: "fitcheck", path: "/app/fitcheck", auth: "admin" },
  { name: "general", path: "/app/general", auth: "admin" },
  { name: "appearance", path: "/app/appearance", auth: "admin" },
  { name: "support", path: "/app/support", auth: "admin" },
  { name: "editor-gang-welcome", path: "/editor/gang-sheet?shop=legends-bags-in2lwdll.myshopify.com", auth: "editor" },
  { name: "editor-ubs-welcome", path: "/editor/upload-by-size?shop=legends-bags-in2lwdll.myshopify.com", auth: "editor" },
];

const viewports = [
  { label: "desktop", width: 1440, height: 1000 },
  { label: "laptop", width: 1280, height: 800 },
  { label: "mobile", width: 390, height: 844 },
];

console.log("# Visual parity capture plan\n");
console.log("Store screenshots under docs/qa/screenshots/{route}/{viewport}.png\n");
for (const vp of viewports) {
  console.log(`## ${vp.label} (${vp.width}x${vp.height})\n`);
  for (const route of routes) {
    console.log(`- [ ] ${route.name}: ${route.path} (${route.auth})`);
  }
  console.log("");
}
