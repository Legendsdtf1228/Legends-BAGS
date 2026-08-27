import prisma from "../db.server";

export type AuditListRow = {
  id: string;
  action: string;
  actorType: string;
  entityType: string;
  entityId: string;
  metaJson: string;
  createdAt: string;
};

export async function listAuditEvents(
  shop: string,
  opts?: { limit?: number; action?: string; entityType?: string },
): Promise<AuditListRow[]> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      shop,
      ...(opts?.action ? { action: opts.action } : {}),
      ...(opts?.entityType ? { entityType: opts.entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
  });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorType: r.actorType,
    entityType: r.entityType,
    entityId: r.entityId,
    metaJson: sanitizeMeta(r.metaJson),
    createdAt: r.createdAt.toISOString(),
  }));
}

function sanitizeMeta(metaJson: string): string {
  try {
    const parsed = JSON.parse(metaJson) as Record<string, unknown>;
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const lower = key.toLowerCase();
      if (
        lower.includes("token") ||
        lower.includes("secret") ||
        lower.includes("password") ||
        lower.includes("accesstoken")
      ) {
        continue;
      }
      if (typeof value === "string" && value.includes("/data/storage/")) {
        safe[key] = "[storage]";
        continue;
      }
      safe[key] = value;
    }
    return JSON.stringify(safe);
  } catch {
    return "{}";
  }
}
