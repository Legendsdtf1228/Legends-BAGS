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
    await prisma.asset.deleteMany({ where: { shop } });
  });

  it("creates categories without seeding hardcoded SVG artwork", async () => {
    const cat = await createGalleryCategory(shop, "Test Category");
    expect(cat.name).toBe("Test Category");
    const items = await listGalleryItems(shop);
    const seededSvg = items.some((i) => i.thumb.startsWith("data:image/svg"));
    expect(seededSvg).toBe(false);
    await deleteGalleryCategory(shop, cat.id);
  });

  it("returns shop-tenant Asset pixels for gallery items without inventing 300 DPI", async () => {
    const { createAssetFromUpload } = await import("../app/services/design-service");
    const { addGalleryAsset, listGalleryCategories } = await import("../app/services/gallery-service");
    const sharp = (await import("sharp")).default;
    const bytes = await sharp({
      create: {
        width: 900,
        height: 600,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();
    const asset = await createAssetFromUpload(shop, bytes);
    const categories = await listGalleryCategories(shop);
    const category = categories[0];
    await addGalleryAsset({
      shop,
      categoryId: category.id,
      assetId: asset.id,
      name: "Real mascot",
      widthIn: 3,
      heightIn: 2,
    });
    const items = await listGalleryItems(shop);
    const item = items.find((row) => row.name === "Real mascot");
    expect(item?.assetId).toBe(asset.id);
    expect(item?.widthPx).toBe(900);
    expect(item?.heightPx).toBe(600);
    expect(item?.widthIn).toBe(3);
    expect(item?.heightIn).toBe(2);
    expect(item?.dpi === null || typeof item?.dpi === "number").toBe(true);
    expect(item?.dpi).not.toBe(300);
  });
});
