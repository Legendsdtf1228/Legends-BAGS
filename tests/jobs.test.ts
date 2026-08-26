import { describe, expect, it } from "vitest";
import {
  canEnqueue,
  shouldRequeueStuckProcessing,
  webhookIdempotencyKey,
} from "../app/domain/jobs";
import { hashPayload } from "../app/domain/design/pipeline";

describe("jobs & webhook idempotency", () => {
  it("prevents duplicate active enqueue", () => {
    expect(canEnqueue([{ status: "queued" }])).toBe(false);
    expect(canEnqueue([{ status: "processing" }])).toBe(false);
    expect(canEnqueue([{ status: "failed" }, { status: "completed" }])).toBe(
      true,
    );
  });

  it("requeues stuck processing after lease expiry", () => {
    const now = new Date("2026-08-26T12:00:00Z");
    expect(
      shouldRequeueStuckProcessing(
        {
          id: "1",
          status: "processing",
          attempt: 1,
          updatedAt: new Date("2026-08-26T11:00:00Z"),
          leaseExpiresAt: new Date("2026-08-26T11:30:00Z"),
        },
        now,
      ),
    ).toBe(true);
  });

  it("uses webhook id when present for idempotency", () => {
    const a = webhookIdempotencyKey({
      shop: "s",
      webhookId: "wh1",
      topic: "orders/paid",
      payloadHash: "x",
    });
    const b = webhookIdempotencyKey({
      shop: "s",
      webhookId: "wh1",
      topic: "orders/paid",
      payloadHash: "different",
    });
    expect(a).toBe(b);
    expect(hashPayload("{\"id\":1}")).toHaveLength(64);
  });
});
