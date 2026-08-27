import prisma from "../db.server";
import { listMerchantDesignRows } from "./merchant-loaders.server";

export type DashboardRange = "today" | "7d" | "30d" | "90d" | "all";

export function rangeStart(range: DashboardRange): Date | null {
  const now = new Date();
  if (range === "all") return null;
  const d = new Date(now);
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  d.setDate(d.getDate() - days);
  return d;
}

export async function getDashboardStats(shop: string, range: DashboardRange = "30d") {
  const since = rangeStart(range);
  const dateFilter = since ? { gte: since } : undefined;

  const [
    designCount,
    orderedDesigns,
    completedRenders,
    failedRenders,
    queuedJobs,
    processingJobs,
    stuckJobs,
    orderLinks,
    bindings,
    webhookCount,
    lastWebhook,
    lastCompletedRender,
    workflowRows,
    statusRows,
    storageBytes,
  ] = await Promise.all([
    prisma.design.count({
      where: { shop, archived: false, ...(dateFilter ? { updatedAt: dateFilter } : {}) },
    }),
    prisma.design.count({
      where: {
        shop,
        status: { in: ["ordered", "completed"] },
        ...(dateFilter ? { updatedAt: dateFilter } : {}),
      },
    }),
    prisma.renderJob.count({
      where: { shop, status: "completed", ...(dateFilter ? { finishedAt: dateFilter } : {}) },
    }),
    prisma.renderJob.count({
      where: { shop, status: "failed", ...(dateFilter ? { updatedAt: dateFilter } : {}) },
    }),
    prisma.renderJob.count({ where: { shop, status: "queued" } }),
    prisma.renderJob.count({ where: { shop, status: "processing" } }),
    prisma.renderJob.count({
      where: {
        shop,
        status: "processing",
        leaseExpiresAt: { lt: new Date() },
      },
    }),
    prisma.orderLink.count({
      where: { shop, ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.productBinding.count({ where: { shop } }),
    prisma.webhookDelivery.count({
      where: { shop, ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.webhookDelivery.findFirst({
      where: { shop, status: "processed" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, topic: true },
    }),
    prisma.renderJob.findFirst({
      where: { shop, status: "completed" },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    }),
    prisma.designVersion.findMany({
      where: {
        design: { shop, ...(dateFilter ? { updatedAt: dateFilter } : {}) },
      },
      select: { stateJson: true },
      take: 500,
      orderBy: { createdAt: "desc" },
    }),
    prisma.design.groupBy({
      by: ["status"],
      where: { shop, archived: false, ...(dateFilter ? { updatedAt: dateFilter } : {}) },
      _count: true,
    }),
    prisma.asset.aggregate({
      where: { shop, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { byteSize: true },
    }),
  ]);

  const workflowCounts: Record<string, number> = {
    gang_sheet: 0,
    upload_by_size: 0,
    image_to_sheet: 0,
    staff: 0,
    reorder: 0,
    unknown: 0,
  };
  for (const row of workflowRows) {
    try {
      const parsed = JSON.parse(row.stateJson) as { workflow?: string };
      const wf = parsed.workflow ?? "upload_by_size";
      if (wf in workflowCounts) workflowCounts[wf as keyof typeof workflowCounts]++;
      else workflowCounts.unknown++;
    } catch {
      workflowCounts.unknown++;
    }
  }

  const statusCounts = Object.fromEntries(statusRows.map((r) => [r.status, r._count]));

  // Revenue from ordered design versions in range
  const versionRevenue = await prisma.designVersion.aggregate({
    where: {
      design: {
        shop,
        status: { in: ["ordered", "completed"] },
        ...(dateFilter ? { updatedAt: dateFilter } : {}),
      },
    },
    _sum: { priceCents: true },
  });

  return {
    range,
    designCount,
    orderedDesigns,
    completedRenders,
    failedRenders,
    queuedJobs,
    processingJobs,
    stuckJobs,
    orderLinks,
    bindings,
    webhookCount,
    lastWebhookAt: lastWebhook?.createdAt?.toISOString() ?? null,
    lastWebhookTopic: lastWebhook?.topic ?? null,
    lastCompletedRenderAt: lastCompletedRender?.finishedAt?.toISOString() ?? null,
    grossRevenueCents: versionRevenue._sum.priceCents ?? 0,
    storageBytes: storageBytes._sum.byteSize ?? 0,
    workflowCounts,
    statusCounts,
    // Aliases for dashboard UI components from main branch
    orderCount: orderLinks,
    completedJobs: completedRenders,
    failedJobs: failedRenders,
  };
}

export async function listRecentOrders(shop: string, limit = 8) {
  const links = await prisma.orderLink.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: limit * 3,
  });
  const byOrder = new Map<string, typeof links>();
  for (const link of links) {
    const list = byOrder.get(link.orderId) ?? [];
    list.push(link);
    byOrder.set(link.orderId, list);
  }

  const orderIds = [...byOrder.keys()].slice(0, limit);
  const designIds = [...new Set(links.map((l) => l.designId))];
  const designs = await prisma.design.findMany({
    where: { id: { in: designIds } },
    select: { id: true, name: true, status: true },
  });
  const designMap = new Map(designs.map((d) => [d.id, d]));

  const jobs = await prisma.renderJob.findMany({
    where: { shop, designId: { in: designIds } },
    orderBy: { updatedAt: "desc" },
  });
  const jobByDesign = new Map<string, (typeof jobs)[number]>();
  for (const j of jobs) {
    if (!jobByDesign.has(j.designId)) jobByDesign.set(j.designId, j);
  }

  return orderIds.map((orderId) => {
    const lines = byOrder.get(orderId)!;
    const latest = lines[0]!;
    const renderStatuses = lines.map((l) => jobByDesign.get(l.designId)?.status ?? "none");
    const hasFailed = renderStatuses.some((s) => s === "failed");
    const allCompleted = renderStatuses.every((s) => s === "completed");
    return {
      orderId,
      orderGid: latest.orderGid,
      lineCount: lines.length,
      createdAt: latest.createdAt.toISOString(),
      designs: lines.map((l) => ({
        designId: l.designId,
        name: designMap.get(l.designId)?.name,
        status: designMap.get(l.designId)?.status,
        version: l.designVersion,
        renderStatus: jobByDesign.get(l.designId)?.status ?? null,
      })),
      renderStatus: hasFailed ? "failed" : allCompleted ? "completed" : "pending",
    };
  });
}

export async function getDashboardPayload(shop: string, range: DashboardRange = "30d") {
  const [stats, recentDesigns, recentOrders] = await Promise.all([
    getDashboardStats(shop, range),
    listMerchantDesignRows(shop, { limit: 8 }),
    listRecentOrders(shop, 8),
  ]);
  return { stats, recentDesigns, recentOrders };
}
