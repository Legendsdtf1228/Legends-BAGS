/**
 * Verify theme stub size and sync full launcher to public/ for the web app.
 */
import { copyFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "extensions", "upload-by-size", "assets", "lgs-launcher.full.js");
const publicPath = path.join(root, "public", "lgs-launcher.full.js");
const stubPath = path.join(root, "extensions", "upload-by-size", "assets", "lgs-launcher.js");

copyFileSync(sourcePath, publicPath);

const stubBytes = statSync(stubPath).size;
if (stubBytes > 10000) {
  console.error(`Theme stub too large: ${stubBytes} B (max 10000 B)`);
  process.exit(1);
}

console.log(`Theme stub lgs-launcher.js: ${stubBytes} B`);
console.log(`Synced full launcher to public/: ${statSync(publicPath).size} B`);
