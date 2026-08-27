import { createHash } from "node:crypto";
import sharp from "sharp";

export type ValidatedUpload = {
  contentType: "image/png" | "image/jpeg";
  widthPx: number;
  heightPx: number;
  dpi: number | null;
  byteSize: number;
  checksumSha256: string;
  bytes: Buffer;
};

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB (matches live BAGS limit)
const MAX_EDGE_PX = 30000;

function sniffContentType(buf: Buffer): "image/png" | "image/jpeg" | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

function isSvg(buf: Buffer): boolean {
  const head = buf.subarray(0, Math.min(buf.length, 512)).toString("utf8").trim();
  return head.includes("<svg") || head.startsWith("<?xml");
}

async function rasterizeSvg(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes, { density: 300 }).png().toBuffer();
}

/** Validate customer upload. PNG/JPEG natively; SVG rasterized to PNG at 300 DPI. */
export async function validateUpload(bytes: Buffer): Promise<ValidatedUpload> {
  if (!bytes?.length) throw new Error("Empty upload");
  if (bytes.length > MAX_BYTES) throw new Error("File exceeds 100 MB limit");

  let working = bytes;
  if (isSvg(bytes)) {
    working = await rasterizeSvg(bytes);
  }

  const contentType = sniffContentType(working);
  if (!contentType) throw new Error("Only PNG, JPEG, and SVG uploads are supported");

  const meta = await sharp(working, { failOn: "none" }).metadata();
  if (!meta.width || !meta.height) throw new Error("Could not read image dimensions");
  if (meta.width > MAX_EDGE_PX || meta.height > MAX_EDGE_PX) {
    throw new Error("Image edge exceeds maximum allowed pixels");
  }

  const dpi =
    typeof meta.density === "number" && meta.density > 0 ? meta.density : null;

  return {
    contentType,
    widthPx: meta.width,
    heightPx: meta.height,
    dpi,
    byteSize: bytes.length,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: working,
  };
}
