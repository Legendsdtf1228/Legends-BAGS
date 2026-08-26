import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

export interface ObjectStore {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
}

export function shopStoragePrefix(shop: string): string {
  return createHash("sha256").update(shop).digest("hex").slice(0, 16);
}

export function assetKey(shop: string, assetId: string): string {
  return `${shopStoragePrefix(shop)}/assets/${assetId}/original`;
}

export function outputKey(
  shop: string,
  designId: string,
  jobId: string,
): string {
  return `${shopStoragePrefix(shop)}/designs/${designId}/outputs/${jobId}/sheet.png`;
}

export function previewKey(
  shop: string,
  designId: string,
  jobId: string,
): string {
  return `${shopStoragePrefix(shop)}/designs/${designId}/outputs/${jobId}/preview.png`;
}

export class LocalObjectStore implements ObjectStore {
  constructor(private readonly rootDir: string) {}

  private resolve(key: string): string {
    if (key.includes("..") || path.isAbsolute(key)) {
      throw new Error("Invalid object key");
    }
    const full = path.resolve(this.rootDir, key);
    if (!full.startsWith(path.resolve(this.rootDir))) {
      throw new Error("Object key escapes storage root");
    }
    return full;
  }

  async put(key: string, data: Buffer, _contentType: string): Promise<void> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}

let singleton: LocalObjectStore | null = null;

export function getObjectStore(): ObjectStore {
  if (!singleton) {
    const root =
      process.env.LOCAL_STORAGE_ROOT ??
      path.join(process.cwd(), "storage", "local");
    singleton = new LocalObjectStore(root);
  }
  return singleton;
}
