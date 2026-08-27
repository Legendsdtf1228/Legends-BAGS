import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shopA = "assign-test-a.myshopify.com";
const shopB = "assign-test-b.myshopify.com";

describe("design assignment service", () => {
  let prisma: typeof import("../app/db.server").default;
  let listDesignAssignments: typeof import("../app/services/assignment-service").listDesignAssignments;
  let createDesignAssignment: typeof import("../app/services/assignment-service").createDesignAssignment;
  let updateDesignAssignment: typeof import("../app/services/assignment-service").updateDesignAssignment;
  let updateAssignmentStatus: typeof import("../app/services/assignment-service").updateAssignmentStatus;
  let deleteDesignAssignment: typeof import("../app/services/assignment-service").deleteDesignAssignment;
  let designId: string;

  beforeAll(async () => {
    prisma = (await import("../app/db.server")).default;
    const svc = await import("../app/services/assignment-service");
    listDesignAssignments = svc.listDesignAssignments;
    createDesignAssignment = svc.createDesignAssignment;
    updateDesignAssignment = svc.updateDesignAssignment;
    updateAssignmentStatus = svc.updateAssignmentStatus;
    deleteDesignAssignment = svc.deleteDesignAssignment;

    const design = await prisma.design.create({
      data: {
        shop: shopA,
        status: "draft",
        staffSheet: true,
        name: "Staff test sheet",
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            stateJson: JSON.stringify({ workflow: "gang_sheet", items: [] }),
            priceCents: 0,
            areaSqIn: 0,
          },
        },
      },
    });
    designId = design.id;
  });

  afterAll(async () => {
    await prisma.designAssignment.deleteMany({ where: { shop: { in: [shopA, shopB] } } });
    await prisma.designVersion.deleteMany({ where: { design: { shop: { in: [shopA, shopB] } } } });
    await prisma.design.deleteMany({ where: { shop: { in: [shopA, shopB] } } });
  });

  it("lists empty assignments for a shop with no rows", async () => {
    const rows = await listDesignAssignments(shopB);
    expect(rows).toEqual([]);
  });

  it("creates an assignment linked to a design", async () => {
    const row = await createDesignAssignment({
      shop: shopA,
      designId,
      assigneeName: "Jane Customer",
      assigneeEmail: "jane@example.com",
      notes: "Order #1042",
    });
    expect(row.shop).toBe(shopA);
    expect(row.designId).toBe(designId);
    expect(row.assigneeName).toBe("Jane Customer");
    expect(row.status).toBe("pending");
  });

  it("lists assignments with design metadata", async () => {
    const rows = await listDesignAssignments(shopA);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const row = rows.find((r) => r.designId === designId);
    expect(row?.designName).toBe("Staff test sheet");
    expect(row?.staffSheet).toBe(true);
  });

  it("updates assignment fields", async () => {
    const rows = await listDesignAssignments(shopA);
    const id = rows.find((r) => r.designId === designId)!.id;
    const updated = await updateDesignAssignment(shopA, id, {
      assigneeName: "Jane D.",
      notes: "Updated notes",
    });
    expect(updated.assigneeName).toBe("Jane D.");
    expect(updated.notes).toBe("Updated notes");
  });

  it("updates assignment status", async () => {
    const rows = await listDesignAssignments(shopA);
    const id = rows.find((r) => r.designId === designId)!.id;
    await updateAssignmentStatus(shopA, id, "completed");
    const after = await listDesignAssignments(shopA);
    expect(after.find((r) => r.id === id)?.status).toBe("completed");
  });

  it("enforces cross-shop isolation", async () => {
    const rows = await listDesignAssignments(shopA);
    const id = rows[0]!.id;
    await expect(
      updateDesignAssignment(shopB, id, { assigneeName: "Hacker" }),
    ).rejects.toThrow(/not found/i);
    await expect(deleteDesignAssignment(shopB, id)).rejects.toThrow(/not found/i);
    const visible = await listDesignAssignments(shopB);
    expect(visible.some((r) => r.id === id)).toBe(false);
  });

  it("removes an assignment", async () => {
    const rows = await listDesignAssignments(shopA);
    const id = rows.find((r) => r.designId === designId)!.id;
    await deleteDesignAssignment(shopA, id);
    expect(await listDesignAssignments(shopA)).toEqual([]);
  });
});
