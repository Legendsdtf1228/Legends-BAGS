import { describe, expect, it } from "vitest";
import { isPrismaClientReady, probeMerchantDb, PRISMA_SCHEMA_TOKEN } from "../app/db.server";

describe("merchant database readiness", () => {
  it("exposes required Prisma delegates after generate", () => {
    expect(PRISMA_SCHEMA_TOKEN).toContain("admin_ops");
    expect(isPrismaClientReady()).toBe(true);
  });

  it("probes merchant models without throwing", async () => {
    const result = await probeMerchantDb();
    expect(result.ok).toBe(true);
  });
});
