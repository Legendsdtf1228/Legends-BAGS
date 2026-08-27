import prisma from "../db.server";

export async function listDesignAssignments(shop: string) {
  const rows = await prisma.designAssignment.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const designIds = [...new Set(rows.map((r) => r.designId))];
  const designs = await prisma.design.findMany({
    where: { id: { in: designIds } },
    select: { id: true, name: true, staffSheet: true, status: true },
  });
  const byId = new Map(designs.map((d) => [d.id, d]));
  return rows.map((r) => ({
    ...r,
    designName: byId.get(r.designId)?.name ?? r.designId.slice(0, 12),
    designStatus: byId.get(r.designId)?.status ?? "unknown",
    staffSheet: byId.get(r.designId)?.staffSheet ?? false,
  }));
}

export async function createDesignAssignment(params: {
  shop: string;
  designId: string;
  assigneeName: string;
  assigneeEmail?: string;
  notes?: string;
}) {
  const design = await prisma.design.findFirst({
    where: { id: params.designId, shop: params.shop },
  });
  if (!design) throw new Error("Design not found");
  const name = params.assigneeName.trim();
  if (!name) throw new Error("Assignee name required");
  return prisma.designAssignment.create({
    data: {
      shop: params.shop,
      designId: design.id,
      assigneeName: name,
      assigneeEmail: params.assigneeEmail?.trim() || null,
      notes: params.notes?.trim() || null,
      status: "pending",
    },
  });
}

export async function updateAssignmentStatus(
  shop: string,
  assignmentId: string,
  status: "pending" | "completed",
) {
  const row = await prisma.designAssignment.findFirst({
    where: { id: assignmentId, shop },
  });
  if (!row) throw new Error("Assignment not found");
  return prisma.designAssignment.update({
    where: { id: row.id },
    data: { status },
  });
}

export async function updateDesignAssignment(
  shop: string,
  assignmentId: string,
  patch: { assigneeName?: string; assigneeEmail?: string | null; notes?: string | null },
) {
  const row = await prisma.designAssignment.findFirst({
    where: { id: assignmentId, shop },
  });
  if (!row) throw new Error("Assignment not found");
  return prisma.designAssignment.update({
    where: { id: row.id },
    data: {
      ...(patch.assigneeName !== undefined ? { assigneeName: patch.assigneeName.trim() } : {}),
      ...(patch.assigneeEmail !== undefined
        ? { assigneeEmail: patch.assigneeEmail?.trim() || null }
        : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes?.trim() || null } : {}),
    },
  });
}

export async function deleteDesignAssignment(shop: string, assignmentId: string) {
  const row = await prisma.designAssignment.findFirst({
    where: { id: assignmentId, shop },
  });
  if (!row) throw new Error("Assignment not found");
  await prisma.designAssignment.delete({ where: { id: row.id } });
}
