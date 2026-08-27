import { describe, expect, it } from "vitest";
import {
  signStorefrontSession,
  verifyStorefrontSession,
  parseAppProxyPath,
} from "../app/domain/security/storefront-access";
import {
  assertCustomerApiAccess,
  assertCustomerApiContext,
  assertTestAccess,
} from "../app/domain/security/test-access";

describe("storefront session", () => {
  const shop = "legends-bags-in2lwdll.myshopify.com";
  const secret = "dev-only-change-me-32chars";

  it("signs and verifies a storefront session", () => {
    process.env.FILE_SIGNING_SECRET = secret;
    const { token } = signStorefrontSession(shop, { secret, ttlSeconds: 3600 });
    const claims = verifyStorefrontSession(token, secret);
    expect(claims.shop).toBe(shop);
  });

  it("rejects tampered session tokens", () => {
    process.env.FILE_SIGNING_SECRET = secret;
    const { token } = signStorefrontSession(shop, { secret });
    expect(() => verifyStorefrontSession(token + "x", secret)).toThrow();
  });
});

describe("parseAppProxyPath", () => {
  it("parses known proxy routes", () => {
    expect(parseAppProxyPath("storefront-config")).toEqual({ kind: "storefront-config" });
    expect(parseAppProxyPath("session")).toEqual({ kind: "session" });
    expect(parseAppProxyPath("builder")).toEqual({ kind: "builder" });
    expect(parseAppProxyPath("lgs-launcher.full.js")).toEqual({ kind: "launcher-script" });
    expect(parseAppProxyPath("designs/abc123")).toEqual({
      kind: "design",
      designId: "abc123",
    });
  });

  it("returns null for unknown paths", () => {
    expect(parseAppProxyPath("uploads")).toBeNull();
    expect(parseAppProxyPath("designs/a/b")).toBeNull();
  });
});

describe("assertCustomerApiAccess", () => {
  const shop = "dev.myshopify.com";
  const secret = "dev-only-change-me-32chars";

  it("accepts storefront session cookie", () => {
    process.env.FILE_SIGNING_SECRET = secret;
    delete process.env.TEST_API_TOKEN;
    const { token } = signStorefrontSession(shop, {
      secret,
      customerKey: "guest:test-session",
    });
    const req = new Request("http://localhost/api/uploads", {
      headers: {
        Cookie: `lgs_storefront_session=${encodeURIComponent(token)}; lgs_shop=${encodeURIComponent(shop)}`,
      },
    });
    expect(assertCustomerApiAccess(req)).toBe(shop);
    expect(assertCustomerApiContext(req).customerKey).toBe("guest:test-session");
  });

  it("falls back to dev test token", () => {
    const token = "test-token-abc";
    process.env.TEST_API_TOKEN = token;
    const req = new Request("http://localhost/api/uploads", {
      headers: {
        "X-LGS-Test-Token": token,
        "X-LGS-Shop": shop,
      },
    });
    expect(assertCustomerApiAccess(req)).toBe(shop);
    expect(assertTestAccess(req)).toBe(shop);
  });
});
