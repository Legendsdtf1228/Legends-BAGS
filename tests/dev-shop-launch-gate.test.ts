import { afterEach, describe, expect, it } from "vitest";
import { parseBuilderLaunchQuery } from "../app/domain/builder/builder-launch-context";

describe("DEV_SHOP launch gate", () => {
  const original = process.env.DEV_SHOP;

  afterEach(() => {
    process.env.DEV_SHOP = original;
  });

  it("allows the DEV storefront when DEV_SHOP is unset", () => {
    delete process.env.DEV_SHOP;
    const parsed = parseBuilderLaunchQuery({
      shop: "legends-bags-in2lwdll.myshopify.com",
      product: "10294398320888",
    });
    expect(parsed.ok).toBe(true);
  });

  it("still rejects a different shop when DEV_SHOP is unset", () => {
    delete process.env.DEV_SHOP;
    const parsed = parseBuilderLaunchQuery({
      shop: "other-store.myshopify.com",
      product: "10294398320888",
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("shop_not_allowed");
  });
});
