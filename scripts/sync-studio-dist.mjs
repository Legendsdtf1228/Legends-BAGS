/**
 * Copy a built Gang Sheet Studio dist into public/studio for DEV embedding.
 *
 * Usage (from Legends-BAGS repo):
 *   STUDIO_DIST=/path/to/Gang-Sheet-Studio/artifacts/gang-sheet-studio/dist/public \
 *     node scripts/sync-studio-dist.mjs
 *
 * Build Studio first with relative asset base:
 *   PORT=4179 BASE_PATH=./ pnpm run build
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "public", "studio");
const source =
  process.env.STUDIO_DIST ||
  path.resolve(root, "../Gang-Sheet-Studio/artifacts/gang-sheet-studio/dist/public");

if (!existsSync(source)) {
  console.error(`Studio dist not found at ${source}`);
  console.error("Build Studio with PORT=4179 BASE_PATH=./ pnpm run build, then set STUDIO_DIST.");
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

writeFileSync(
  path.join(target, "BRIDGE_README.txt"),
  [
    "DEV-ONLY Gang Sheet Studio embed served by Legends-BAGS.",
    "Synced by scripts/sync-studio-dist.mjs",
    `Source: ${source}`,
    `Synced at: ${new Date().toISOString()}`,
    "",
  ].join("\n"),
);

console.log(`Synced Studio dist → ${target}`);
