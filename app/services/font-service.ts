import prisma from "../db.server";

const SYSTEM_FONTS = [
  { name: "Inter", family: "Inter, sans-serif", category: "sans-serif" },
  { name: "Arial", family: "Arial, sans-serif", category: "sans-serif" },
  { name: "Helvetica", family: "Helvetica, Arial, sans-serif", category: "sans-serif" },
  { name: "Georgia", family: "Georgia, serif", category: "serif" },
  { name: "Times New Roman", family: "'Times New Roman', Times, serif", category: "serif" },
  { name: "Impact", family: "Impact, Haettenschweiler, sans-serif", category: "display" },
  { name: "Courier New", family: "'Courier New', monospace", category: "monospace" },
];

export async function ensureDefaultFonts(shop: string) {
  const count = await prisma.shopFont.count({ where: { shop } });
  if (count > 0) return;
  for (const font of SYSTEM_FONTS) {
    await prisma.shopFont.create({
      data: {
        shop,
        name: font.name,
        family: font.family,
        source: "system",
        category: font.category,
        enabled: true,
        isDefault: font.name === "Inter",
        licenseAcknowledged: true,
      },
    });
  }
}

export async function listShopFonts(shop: string) {
  await ensureDefaultFonts(shop);
  return prisma.shopFont.findMany({
    where: { shop },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function updateShopFont(
  shop: string,
  fontId: string,
  patch: {
    enabled?: boolean;
    category?: string;
    isDefault?: boolean;
    previewText?: string;
    licenseAcknowledged?: boolean;
  },
) {
  const row = await prisma.shopFont.findFirst({ where: { id: fontId, shop } });
  if (!row) throw new Error("Font not found");
  if (patch.isDefault) {
    await prisma.shopFont.updateMany({ where: { shop }, data: { isDefault: false } });
  }
  return prisma.shopFont.update({
    where: { id: row.id },
    data: {
      enabled: patch.enabled ?? undefined,
      category: patch.category ?? undefined,
      isDefault: patch.isDefault ?? undefined,
      previewText: patch.previewText ?? undefined,
      licenseAcknowledged: patch.licenseAcknowledged ?? undefined,
    },
  });
}

export async function getEnabledFonts(shop: string) {
  await ensureDefaultFonts(shop);
  return prisma.shopFont.findMany({
    where: { shop, enabled: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}
