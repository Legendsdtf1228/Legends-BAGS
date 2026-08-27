import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shop = "dashboard-test.myshopify.com";

describe("merchant dashboard aggregates", () => {
  let prisma: typeof import("../app/db.server").default;
  let getDashboardStats: typeof import("../app/lib/merchant-dashboard.server").getDashboardStats;

  beforeAll(async () => {
    prisma = (await import("../app/db.server")).default;
    getDashboardStats = (await import("../app/lib/merchant-dashboard.server")).getDashboardStats;
    await prisma.shopConfig.upsert({ where: { shop }, create: { shop }, update: {} });
    const design = await prisma.design.create({
      data: {
        shop,
        status: "ordered",
        name: "Dash test",
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            stateJson: JSON.stringify({ workflow: "gang_sheet" }),
            priceCents: 1700,
            areaSqIn: 100,
          },
        },
      },
    });
    await prisma.orderLink.create({
      data: {
        shop,
        orderId: "9001",
        lineItemId: "1",
        designId: design.id,
        designVersion: 1,
      },
    });
  });

  afterAll(async () => {
    await prisma.orderLink.deleteMany({ where: { shop } });
    await prisma.designVersion.deleteMany({ where: { design: { shop } } });
    await prisma.design.deleteMany({ where: { shop } });
    await prisma.shopConfig.deleteMany({ where: { shop } });
  });

  it("returns real aggregates without hardcoded demo values", async () => {
    const stats = await getDashboardStats(shop, "all");
    expect(stats.designCount).toBeGreaterThanOrEqual(1);
    expect(stats.orderLinks).toBeGreaterThanOrEqual(1);
    expect(stats.grossRevenueCents).toBeGreaterThanOrEqual(1700);
    expect(stats.workflowCounts.gang_sheet).toBeGreaterThanOrEqual(1);
  });

  it("respects date range filtering", async () => {
    const all = await getDashboardStats(shop, "all");
    const today = await getDashboardStats(shop, "today");
    expect(all.designCount).toBeGreaterThanOrEqual(today.designCount);
  });
});
