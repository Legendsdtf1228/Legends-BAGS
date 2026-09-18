import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const previewRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(previewRoot, "../..");

export default defineConfig({
  root: previewRoot,
  plugins: [tsconfigPaths({ root: repoRoot })],
  server: {
    port: 4177,
    host: true,
    fs: { allow: [repoRoot] },
  },
});
