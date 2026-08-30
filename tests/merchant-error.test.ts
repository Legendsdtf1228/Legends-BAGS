import { describe, expect, it } from "vitest";
import { merchantActionError } from "../app/lib/merchant-error.server";

describe("merchantActionError", () => {
  it("maps publication scope errors to reauthorization guidance", () => {
    const result = merchantActionError(
      new Error("Access denied for publications field. Required access: read_publications"),
    );
    expect(result.error).toContain("read_publications");
    expect(result.error).toContain("Reauthorize");
    expect(result.requestId).toHaveLength(8);
    expect(result.error).not.toContain("/app/");
  });
});
