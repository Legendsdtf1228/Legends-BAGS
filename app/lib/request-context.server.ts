import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "X-LGS-Request-Id";

export function createRequestId(): string {
  return randomUUID().slice(0, 8);
}

export function jsonError(
  message: string,
  status: number,
  requestId: string,
  extra?: Record<string, unknown>,
) {
  return Response.json({ error: message, requestId, ...extra }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(body: T, requestId: string) {
  return Response.json({ ...body, requestId });
}
