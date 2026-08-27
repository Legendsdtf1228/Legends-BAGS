import prisma from "../db.server";
import { signDownload } from "../domain/security/signed-urls";

export async function ensureShopConfig(shop: string) {
  await prisma.shopConfig.upsert({
    where: { shop },
    create: { shop },
    update: {},
  });
  return prisma.shopConfig.findUnique({ where: { shop } });
}

export async function getHomeStats(shop: string) {
  const [designCount, orderCount, queuedJobs, processingJobs, completedJobs, failedJobs, bindings] =
    await Promise.all([
      prisma.design.count({ where: { shop, archived: false } }),
      prisma.orderLink.count({ where: { shop } }),
      prisma.renderJob.count({ where: { shop, status: "queued" } }),
      prisma.renderJob.count({ where: { shop, status: "processing" } }),
      prisma.renderJob.count({ where: { shop, status: "completed" } }),
      prisma.renderJob.count({ where: { shop, status: "failed" } }),
      prisma.productBinding.count({ where: { shop } }),
    ]);

  return {
    designCount,
    orderCount,
    queuedJobs,
    processingJobs,
    completedJobs,
    failedJobs,
    bindings,
  };
}

export type DesignRow = {
  id: string;
  name: string | null;
  archived: boolean;
  status: string;
  workflow: string;
  updatedAt: string;
  jobStatus: string | null;
  lastError: string | null;
  widthPx: number | null;
  heightPx: number | null;
  previewPath: string | null;
  orderId: string | null;
};

export async function listMerchantDesignRows(
  shop: string,
  filters: { q?: string; workflow?: string; status?: string; includeArchived?: boolean; limit?: number },
): Promise<DesignRow[]> {
  const designs = await prisma.design.findMany({
    where: {
      shop,
      ...(filters.q
        ? { OR: [{ name: { contains: filters.q } }, { id: { contains: filters.q } }] }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.includeArchived ? {} : { archived: false }),
    },
    orderBy: { updatedAt: "desc" },
    take: filters.limit ?? 100,
  });

  const versionRows = await Promise.all(
    designs.map((d) =>
      prisma.designVersion.findUnique({
        where: { designId_version: { designId: d.id, version: d.currentVersion } },
      }),
    ),
  );

  const orderLinks = await prisma.orderLink.findMany({
    where: { shop, designId: { in: designs.map((d) => d.id) } },
    orderBy: { createdAt: "desc" },
  });
  const orderByDesign = new Map<string, (typeof orderLinks)[number]>();
  for (const link of orderLinks) {
    if (!orderByDesign.has(link.designId)) orderByDesign.set(link.designId, link);
  }

  const jobs = await prisma.renderJob.findMany({
    where: { shop, designId: { in: designs.map((d) => d.id) } },
    orderBy: { updatedAt: "desc" },
  });
  const jobByDesign = new Map<string, (typeof jobs)[number]>();
  for (const j of jobs) {
    if (!jobByDesign.has(j.designId)) jobByDesign.set(j.designId, j);
  }

  return designs
    .map((d, i) => {
      const job = jobByDesign.get(d.id);
      let workflow = "upload_by_size";
      try {
        const parsed = JSON.parse(versionRows[i]?.stateJson ?? "{}") as { workflow?: string };
        if (parsed.workflow) workflow = parsed.workflow;
      } catch {
        /* ignore */
      }
      const previewKey = d.previewKey ?? job?.previewKey ?? null;
      let previewPath: string | null = null;
      if (previewKey) {
        const { token } = signDownload({ shop, objectKey: previewKey });
        previewPath = `/api/files/download?token=${encodeURIComponent(token)}`;
      }
      return {
        id: d.id,
        name: d.name,
        archived: d.archived,
        status: d.status,
        workflow,
        updatedAt: d.updatedAt.toISOString(),
        jobStatus: job?.status ?? null,
        lastError: job?.lastError ?? null,
        widthPx: job?.widthPx ?? null,
        heightPx: job?.heightPx ?? null,
        previewPath,
        orderId: orderByDesign.get(d.id)?.orderId ?? null,
      };
    })
    .filter((row) => !filters.workflow || row.workflow === filters.workflow);
}
