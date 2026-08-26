import { describe, expect, it } from "vitest";
import { assertTestAccess } from "../app/domain/security/test-access";

describe("test access gate", () => {
  const token = "test-token-abc";
  const shop = "dev.myshopify.com";

  it("accepts header auth", () => {
    const req = new Request("http://localhost/api/uploads", {
      headers: {
        "X-LGS-Test-Token": token,
        "X-LGS-Shop": shop,
      },
    });
    process.env.TEST_API_TOKEN = token;
    expect(assertTestAccess(req)).toBe(shop);
  });

  it("accepts cookie auth", () => {
    const req = new Request("http://localhost/api/uploads", {
      headers: {
        Cookie: `lgs_test_token=${encodeURIComponent(token)}; lgs_shop=${encodeURIComponent(shop)}`,
      },
    });
    process.env.TEST_API_TOKEN = token;
    expect(assertTestAccess(req)).toBe(shop);
  });

  it("rejects bad token", () => {
    const req = new Request("http://localhost/api/uploads", {
      headers: { "X-LGS-Test-Token": "wrong", "X-LGS-Shop": shop },
    });
    process.env.TEST_API_TOKEN = token;
    expect(() => assertTestAccess(req)).toThrow();
  });
});
