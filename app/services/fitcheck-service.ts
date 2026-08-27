import prisma from "../db.server";

export async function listFitCheckTemplates(shop: string, includeArchived = false) {
  return prisma.fitCheckTemplate.findMany({
    where: { shop, ...(includeArchived ? {} : { archived: false }) },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
  });
}

export async function createFitCheckTemplate(
  shop: string,
  data: {
    name: string;
    regionWidthIn?: number;
    regionHeightIn?: number;
    productGids?: string;
  },
) {
  const name = data.name.trim();
  if (!name) throw new Error("Template name required");
  return prisma.fitCheckTemplate.create({
    data: {
      shop,
      name,
      regionWidthIn: data.regionWidthIn ?? 10,
      regionHeightIn: data.regionHeightIn ?? 10,
      productGids: data.productGids ?? "",
      active: true,
    },
  });
}

export async function updateFitCheckTemplate(
  shop: string,
  id: string,
  patch: Partial<{
    name: string;
    regionX: number;
    regionY: number;
    regionWidthIn: number;
    regionHeightIn: number;
    regionShape: string;
    rotationDeg: number;
    cylindrical: boolean;
    productGids: string;
    active: boolean;
    archived: boolean;
  }>,
) {
  const row = await prisma.fitCheckTemplate.findFirst({ where: { id, shop } });
  if (!row) throw new Error("Template not found");
  return prisma.fitCheckTemplate.update({ where: { id: row.id }, data: patch });
}

export async function duplicateFitCheckTemplate(shop: string, id: string) {
  const row = await prisma.fitCheckTemplate.findFirst({ where: { id, shop } });
  if (!row) throw new Error("Template not found");
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = row;
  return prisma.fitCheckTemplate.create({
    data: { ...rest, name: `${row.name} (copy)`, active: false },
  });
}
