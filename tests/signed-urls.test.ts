import { describe, expect, it } from "vitest";
import {
  signDownload,
  verifyDownloadToken,
} from "../app/domain/security/signed-urls";

const SECRET = "test-signing-secret-32chars!!";

describe("signed downloads", () => {
  it("round-trips a valid token", () => {
    const { token, exp } = signDownload(
      { shop: "a.myshopify.com", objectKey: "abc/assets/1/original", ttlSeconds: 60 },
      SECRET,
    );
    const claims = verifyDownloadToken(token, SECRET, exp - 10);
    expect(claims.shop).toBe("a.myshopify.com");
    expect(claims.objectKey).toBe("abc/assets/1/original");
  });

  it("rejects expired tokens", () => {
    const { token, exp } = signDownload(
      { shop: "a.myshopify.com", objectKey: "k", ttlSeconds: 1 },
      SECRET,
    );
    expect(() => verifyDownloadToken(token, SECRET, exp + 5)).toThrow(/expired/);
  });

  it("rejects tampered tokens", () => {
    const { token } = signDownload(
      { shop: "a.myshopify.com", objectKey: "k", ttlSeconds: 60 },
      SECRET,
    );
    const raw = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    raw.objectKey = "evil";
    const evil = Buffer.from(JSON.stringify(raw), "utf8").toString("base64url");
    expect(() => verifyDownloadToken(evil, SECRET)).toThrow(/Invalid/);
  });
});
