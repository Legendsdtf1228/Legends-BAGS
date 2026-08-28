import { describe, expect, it } from "vitest";
import { createRequestId, jsonError, jsonOk } from "../app/lib/request-context.server";

describe("request context helpers", () => {
  it("creates short correlation ids", () => {
    const id = createRequestId();
    expect(id).toHaveLength(8);
  });

  it("returns structured error payloads", async () => {
    const res = jsonError("Save failed", 400, "abc12345");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Save failed", requestId: "abc12345" });
  });

  it("returns structured success payloads", async () => {
    const res = jsonOk({ designId: "des_1" }, "xyz98765");
    const body = await res.json();
    expect(body).toEqual({ designId: "des_1", requestId: "xyz98765" });
  });
});
