import { describe, expect, it } from "vitest";
import { validateUpload } from "../app/domain/design/upload";
import sharp from "sharp";

describe("upload validation", () => {
  it("accepts transparent PNG", async () => {
    const bytes = await sharp({
      create: {
        width: 64,
        height: 32,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();
    const v = await validateUpload(bytes);
    expect(v.contentType).toBe("image/png");
    expect(v.widthPx).toBe(64);
    expect(v.heightPx).toBe(32);
  });

  it("accepts JPEG", async () => {
    const bytes = await sharp({
      create: {
        width: 40,
        height: 40,
        channels: 3,
        background: { r: 20, g: 20, b: 20 },
      },
    })
      .jpeg()
      .toBuffer();
    const v = await validateUpload(bytes);
    expect(v.contentType).toBe("image/jpeg");
  });

  it("rejects non-image bytes", async () => {
    await expect(validateUpload(Buffer.from("%PDF-1.4"))).rejects.toThrow(
      /PNG and JPEG/,
    );
  });
});
