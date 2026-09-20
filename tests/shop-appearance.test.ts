import { afterAll, describe, expect, it } from "vitest";
import prisma from "../app/db.server";
import {
  DEFAULT_APPEARANCE,
  getShopAppearance,
  updateShopAppearance,
  validateShopAppearance,
} from "../app/lib/shop-appearance.server";

const shop = "merchant-branding-test.myshopify.com";

describe("shop appearance", () => {
  afterAll(async () => {
    await prisma.shopConfig.deleteMany({ where: { shop } });
  });

  it("returns safe Legends defaults for an unconfigured shop", async () => {
    await prisma.shopConfig.deleteMany({ where: { shop } });
    await expect(getShopAppearance(shop)).resolves.toEqual(DEFAULT_APPEARANCE);
  });

  it("validates branding colors and asset URLs", () => {
    expect(validateShopAppearance({ accentColor: "gold" })).toHaveProperty("accentColor");
    expect(validateShopAppearance({ logoUrl: "/private/logo.png" })).toHaveProperty("logoUrl");
    expect(validateShopAppearance({ accentColor: "#C9A227", logoUrl: "https://example.com/logo.png" })).toEqual({});
  });

  it("persists shop-level branding without exposing platform controls", async () => {
    await updateShopAppearance(shop, {
      businessName: "Test Print Shop",
      accentColor: "#B28A22",
      logoUrl: "https://example.com/logo.png",
    });
    const appearance = await getShopAppearance(shop);
    expect(appearance.businessName).toBe("Test Print Shop");
    expect(appearance.accentColor).toBe("#B28A22");
    expect(appearance.logoUrl).toBe("https://example.com/logo.png");
    expect(appearance).not.toHaveProperty("attributionEnabled");
  });
});