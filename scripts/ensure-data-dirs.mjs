import { mkdir } from "node:fs/promises";
import path from "node:path";

function sqliteFilePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) return null;
  const raw = databaseUrl.slice("file:".length);
  if (!raw || raw === ":memory:") return null;
  return raw.startsWith("/") ? raw : path.resolve(process.cwd(), raw);
}

const storageRoot =
  process.env.LOCAL_STORAGE_ROOT ??
  path.join(process.cwd(), "storage", "local");

await mkdir(storageRoot, { recursive: true });

const dbPath = sqliteFilePath(process.env.DATABASE_URL);
if (dbPath) {
  await mkdir(path.dirname(dbPath), { recursive: true });
}

if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PUBLIC_DOMAIN) {
  await mkdir("/data", { recursive: true });
}
