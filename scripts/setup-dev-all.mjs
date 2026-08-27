/**
 * Run full dev-store bootstrap: products → gang sheet variants → webhooks.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

function run(label: string, cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n==> ${label}`);
    const child = spawn(cmd, args, {
      cwd: path.join(root, ".."),
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit ${code}`));
    });
  });
}

await run("Create dev test products", "npm", ["run", "setup:dev-store"]);
await run("Bind gang sheet height variants", "npm", ["run", "setup:gang-sheet-variants"]);

try {
  await run("Register dev webhooks", "npm", ["run", "setup:dev-webhooks"]);
} catch (err) {
  console.warn(
    "\nWebhook registration skipped or failed (requires trycloudflare tunnel + LGS_APP_URL).",
  );
  console.warn(String(err));
}

console.log("\nDev bootstrap complete.");
try {
  await run("Print /builder URLs", "npm", ["run", "print:builder-urls"]);
} catch (err) {
  console.warn("\nCould not print /builder URLs (set LGS_APP_URL and DEV_SHOP).");
  console.warn(String(err));
}
