import prisma from "../db.server";

export type GalleryListItem = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  thumb: string;
  widthIn: number;
  heightIn: number;
};

export async function ensureDefaultGallery(shop: string) {
  const existing = await prisma.galleryCategory.count({ where: { shop } });
  if (existing > 0) return;

  const names = ["Sports", "Mascots", "Numbers", "Seasonal"];
  for (let i = 0; i < names.length; i++) {
    await prisma.galleryCategory.create({
      data: { shop, name: names[i], sortOrder: i },
    });
  }
}

export async function listGalleryCategories(shop: string) {
  await ensureDefaultGallery(shop);
  return prisma.galleryCategory.findMany({
    where: { shop },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { assets: true } } },
  });
}

export async function listGalleryItems(
  shop: string,
  filters?: { category?: string; search?: string; includeInactive?: boolean },
): Promise<GalleryListItem[]> {
  await ensureDefaultGallery(shop);
  const rows = await prisma.galleryAsset.findMany({
    where: {
      shop,
      ...(filters?.includeInactive ? {} : { active: true }),
      ...(filters?.category && filters.category !== "All"
        ? { category: { name: filters.category } }
        : {}),
      ...(filters?.search?.trim()
        ? {
            OR: [
              { name: { contains: filters.search.trim() } },
              { tags: { contains: filters.search.trim() } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category.name,
    tags: row.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    thumb: row.thumbUrl || `/api/assets/${encodeURIComponent(row.assetId)}`,
    widthIn: row.defaultWidthIn,
    heightIn: row.defaultHeightIn,
  }));
}

export async function createGalleryCategory(shop: string, name: string) {
  const clean = name.trim();
  if (!clean) throw new Error("Category name required");
  return prisma.galleryCategory.create({
    data: { shop, name: clean, sortOrder: 99 },
  });
}

export async function deleteGalleryCategory(shop: string, categoryId: string) {
  const cat = await prisma.galleryCategory.findFirst({
    where: { id: categoryId, shop },
    include: { _count: { select: { assets: true } } },
  });
  if (!cat) throw new Error("Category not found");
  if (cat._count.assets > 0) throw new Error("Remove assets from category first");
  await prisma.galleryCategory.delete({ where: { id: cat.id } });
}

export async function addGalleryAsset(params: {
  shop: string;
  categoryId: string;
  assetId: string;
  name: string;
  tags?: string[];
  widthIn?: number;
  heightIn?: number;
}) {
  const category = await prisma.galleryCategory.findFirst({
    where: { id: params.categoryId, shop: params.shop },
  });
  if (!category) throw new Error("Category not found");

  const asset = await prisma.asset.findFirst({
    where: { id: params.assetId, shop: params.shop },
  });
  if (!asset) throw new Error("Asset not found");

  return prisma.galleryAsset.create({
    data: {
      shop: params.shop,
      categoryId: category.id,
      assetId: asset.id,
      name: params.name.trim() || "Gallery item",
      tags: (params.tags ?? []).join(","),
      defaultWidthIn: params.widthIn ?? 3,
      defaultHeightIn: params.heightIn ?? 3,
      active: true,
    },
  });
}

export async function updateGalleryAsset(
  shop: string,
  assetRowId: string,
  patch: { name?: string; tags?: string[]; active?: boolean; categoryId?: string },
) {
  const row = await prisma.galleryAsset.findFirst({ where: { id: assetRowId, shop } });
  if (!row) throw new Error("Gallery item not found");
  return prisma.galleryAsset.update({
    where: { id: row.id },
    data: {
      name: patch.name?.trim() || row.name,
      tags: patch.tags ? patch.tags.join(",") : undefined,
      active: patch.active ?? undefined,
      categoryId: patch.categoryId ?? undefined,
    },
  });
}

export async function deleteGalleryAsset(shop: string, assetRowId: string) {
  const row = await prisma.galleryAsset.findFirst({ where: { id: assetRowId, shop } });
  if (!row) throw new Error("Gallery item not found");
  await prisma.galleryAsset.delete({ where: { id: row.id } });
}

export async function listGalleryAdmin(shop: string) {
  await ensureDefaultGallery(shop);
  const categories = await listGalleryCategories(shop);
  const assets = await prisma.galleryAsset.findMany({
    where: { shop },
    include: { category: true },
    orderBy: [{ updatedAt: "desc" }],
  });
  return { categories, assets };
}
