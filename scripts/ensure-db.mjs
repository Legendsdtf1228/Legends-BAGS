#!/usr/bin/env node
/**
 * Apply pending migrations and regenerate Prisma client before dev/build.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: "pipe", env: process.env, encoding: "utf8" });
    return { ok: true, output: "" };
  } catch (err) {
    const output = [
      err instanceof Error && "stdout" in err ? String(err.stdout ?? "") : "",
      err instanceof Error && "stderr" in err ? String(err.stderr ?? "") : "",
      err instanceof Error ? err.message : String(err),
    ].join("\n");
    return { ok: false, output };
  }
}

console.log("[ensure-db] Applying migrations…");
const migrate = run("npx prisma migrate deploy");
if (!migrate.ok) {
  console.error(migrate.output);
  process.exit(1);
}
if (migrate.output.trim()) console.log(migrate.output.trim());

console.log("[ensure-db] Generating Prisma client…");
const generate = run("npx prisma generate");
if (!generate.ok) {
  if (/EPERM|operation not permitted/i.test(generate.output)) {
    console.warn(
      "[ensure-db] prisma generate hit a file lock — stop shopify app dev, then run npm run setup again.",
    );
  } else {
    console.error(generate.output);
    process.exit(1);
  }
} else if (generate.output.trim()) {
  console.log(generate.output.trim());
}

console.log("[ensure-db] Done.");
