import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shop = "gallery-ops-test.myshopify.com";

describe("gallery CMS service", () => {
  let prisma: typeof import("../app/db.server").default;
  let createGalleryCategory: typeof import("../app/services/gallery-service").createGalleryCategory;
  let listGalleryItems: typeof import("../app/services/gallery-service").listGalleryItems;
  let deleteGalleryCategory: typeof import("../app/services/gallery-service").deleteGalleryCategory;

  beforeAll(async () => {
    prisma = (await import("../app/db.server")).default;
    const svc = await import("../app/services/gallery-service");
    createGalleryCategory = svc.createGalleryCategory;
    listGalleryItems = svc.listGalleryItems;
    deleteGalleryCategory = svc.deleteGalleryCategory;
  });

  afterAll(async () => {
    await prisma.galleryAsset.deleteMany({ where: { shop } });
    await prisma.galleryCategory.deleteMany({ where: { shop } });
  });

  it("creates categories without seeding hardcoded SVG artwork", async () => {
    const cat = await createGalleryCategory(shop, "Test Category");
    expect(cat.name).toBe("Test Category");
    const items = await listGalleryItems(shop);
    const seededSvg = items.some((i) => i.thumb.startsWith("data:image/svg"));
    expect(seededSvg).toBe(false);
    await deleteGalleryCategory(shop, cat.id);
  });
});
