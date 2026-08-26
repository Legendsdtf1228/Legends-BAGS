/**
 * Job claim / recovery helpers — pure functions for testability.
 */

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type JobRecord = {
  id: string;
  status: JobStatus;
  attempt: number;
  updatedAt: Date;
  leaseExpiresAt?: Date | null;
};

export function shouldRequeueStuckProcessing(
  job: JobRecord,
  now: Date = new Date(),
): boolean {
  if (job.status !== "processing") return false;
  if (!job.leaseExpiresAt) {
    // If no lease recorded, treat 15 minutes since update as stuck
    return now.getTime() - job.updatedAt.getTime() > 15 * 60 * 1000;
  }
  return job.leaseExpiresAt.getTime() < now.getTime();
}

export function nextAttempt(job: JobRecord): number {
  return job.attempt + 1;
}

export function canEnqueue(
  existing: Array<{ status: JobStatus }>,
): boolean {
  return !existing.some(
    (j) => j.status === "queued" || j.status === "processing",
  );
}

export function webhookIdempotencyKey(parts: {
  shop: string;
  webhookId?: string | null;
  topic: string;
  payloadHash: string;
}): string {
  if (parts.webhookId) return `${parts.shop}:${parts.webhookId}`;
  return `${parts.shop}:${parts.topic}:${parts.payloadHash}`;
}
