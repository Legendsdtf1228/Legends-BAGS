import { describe, expect, it, beforeAll } from "vitest";
import {
  signDesignAccess,
  signPriceRef,
  verifyDesignAccessToken,
  verifyPriceRef,
} from "../app/domain/security/design-access";

beforeAll(() => {
  process.env.FILE_SIGNING_SECRET = "test-signing-secret-32chars!!";
});

describe("design access tokens", () => {
  it("signs and verifies design access", () => {
    const { token } = signDesignAccess({
      shop: "legends-bags-in2lwdll.myshopify.com",
      designId: "des_1",
      version: 2,
    });
    const claims = verifyDesignAccessToken(token);
    expect(claims.shop).toBe("legends-bags-in2lwdll.myshopify.com");
    expect(claims.designId).toBe("des_1");
    expect(claims.version).toBe(2);
  });

  it("rejects tampered tokens", () => {
    const { token } = signDesignAccess({ shop: "a.myshopify.com", designId: "x" });
    expect(() => verifyDesignAccessToken(token + "x")).toThrow();
  });
});

describe("price reference tokens", () => {
  it("round-trips price ref", () => {
    const token = signPriceRef({
      shop: "legends-bags-in2lwdll.myshopify.com",
      designId: "des_1",
      version: 1,
      priceCents: 499,
    });
    const ref = verifyPriceRef(token);
    expect(ref.priceCents).toBe(499);
  });
});
