import { describe, expect, it } from "vitest";
import {
  guestCustomerKey,
  normalizeCustomerKey,
  shopifyCustomerKey,
} from "../app/domain/security/customer-key";

describe("customer-key", () => {
  it("normalizes Shopify customer ids", () => {
    expect(normalizeCustomerKey("12345")).toBe("gid://shopify/Customer/12345");
    expect(shopifyCustomerKey(99)).toBe("gid://shopify/Customer/99");
  });

  it("normalizes guest keys", () => {
    expect(guestCustomerKey("abc")).toBe("guest:abc");
    expect(normalizeCustomerKey("guest:abc")).toBe("guest:abc");
  });
});

describe("storefront session with customerKey", () => {
  it("round-trips customerKey in session token", async () => {
    const { signStorefrontSession, verifyStorefrontSession } = await import(
      "../app/domain/security/storefront-access"
    );
    process.env.FILE_SIGNING_SECRET = "dev-only-change-me-32chars";
    const shop = "dev.myshopify.com";
    const customerKey = guestCustomerKey("test-guest");
    const { token } = signStorefrontSession(shop, { customerKey });
    const claims = verifyStorefrontSession(token);
    expect(claims.shop).toBe(shop);
    expect(claims.customerKey).toBe(customerKey);
  });
});
