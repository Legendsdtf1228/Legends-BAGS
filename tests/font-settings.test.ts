import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shop = "font-ops-test.myshopify.com";

describe("font settings service", () => {
  let listShopFonts: typeof import("../app/services/font-service").listShopFonts;
  let updateShopFont: typeof import("../app/services/font-service").updateShopFont;
  let prisma: typeof import("../app/db.server").default;

  beforeAll(async () => {
    prisma = (await import("../app/db.server")).default;
    const svc = await import("../app/services/font-service");
    listShopFonts = svc.listShopFonts;
    updateShopFont = svc.updateShopFont;
  });

  afterAll(async () => {
    await prisma.shopFont.deleteMany({ where: { shop } });
  });

  it("seeds system fonts and toggles enabled state", async () => {
    const fonts = await listShopFonts(shop);
    expect(fonts.length).toBeGreaterThan(0);
    const target = fonts[0]!;
    const updated = await updateShopFont(shop, target.id, { enabled: false });
    expect(updated.enabled).toBe(false);
  });
});
