import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { verifyDownloadToken } from "../app/domain/security/signed-urls";
import {
  filterOrderRowsByFulfillment,
  fulfillmentBucket,
  matchesFulfillmentFilter,
  orderRowDownloadPath,
  parseFulfillmentFilter,
  SIGNED_FILE_DOWNLOAD_PATH,
  signedFileDownloadPath,
} from "../app/lib/order-download.server";

const SECRET = "test-signing-secret-32chars!!";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function readRepoFile(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("signed order download path", () => {
  it("mints HMAC /api/files/download and never /api/downloads/", () => {
    const path = signedFileDownloadPath(
      "orders.myshopify.com",
      "shop/outputs/job-1/print.png",
      SECRET,
    );
    expect(path.startsWith(`${SIGNED_FILE_DOWNLOAD_PATH}?token=`)).toBe(true);
    expect(path).not.toContain("/api/downloads/");

    const token = new URL(path, "https://admin.example").searchParams.get("token");
    expect(token).toBeTruthy();
    const claims = verifyDownloadToken(token!, SECRET);
    expect(claims.shop).toBe("orders.myshopify.com");
    expect(claims.objectKey).toBe("shop/outputs/job-1/print.png");
  });

  it("returns no download URL when a completed output is missing", () => {
    expect(orderRowDownloadPath("orders.myshopify.com", null, SECRET)).toBeNull();
    expect(orderRowDownloadPath("orders.myshopify.com", undefined, SECRET)).toBeNull();
    expect(orderRowDownloadPath("orders.myshopify.com", "", SECRET)).toBeNull();
  });

  it("orders and design-detail reuse the same signed helper", () => {
    const helper = readRepoFile("app/lib/order-download.server.ts");
    const orders = readRepoFile("app/routes/app.orders.tsx");
    const designDetail = readRepoFile("app/routes/app.designs.$designId.tsx");

    expect(helper).toContain('SIGNED_FILE_DOWNLOAD_PATH = "/api/files/download"');
    expect(helper).not.toMatch(/["'`]\/api\/downloads\//);

    expect(orders).toContain("orderRowDownloadPath");
    expect(orders).toContain("../lib/order-download.server");
    expect(orders).not.toMatch(/["'`]\/api\/downloads\//);
    expect(orders).toContain("row.downloadPath");

    expect(designDetail).toContain("signedFileDownloadPath");
    expect(designDetail).toContain("../lib/order-download.server");
    expect(designDetail).not.toContain("signDownload");
    expect(designDetail).not.toMatch(/["'`]\/api\/downloads\//);
  });
});

describe("fulfillment filter", () => {
  const rows = [
    { id: "paid-done", fulfillmentStatus: "fulfilled" },
    { id: "open-explicit", fulfillmentStatus: "unfulfilled" },
    { id: "open-shopify-null", fulfillmentStatus: null },
    { id: "open-empty", fulfillmentStatus: "" },
    { id: "partial", fulfillmentStatus: "partial" },
    { id: "restocked", fulfillmentStatus: "restocked" },
  ];

  it("parses only known fulfillment query values", () => {
    expect(parseFulfillmentFilter("fulfilled")).toBe("fulfilled");
    expect(parseFulfillmentFilter("Unfulfilled")).toBe("unfulfilled");
    expect(parseFulfillmentFilter("unknown")).toBe("unknown");
    expect(parseFulfillmentFilter("")).toBe("");
    expect(parseFulfillmentFilter("bogus")).toBe("");
  });

  it("buckets Shopify null/empty as unfulfilled", () => {
    expect(fulfillmentBucket("fulfilled")).toBe("fulfilled");
    expect(fulfillmentBucket("unfulfilled")).toBe("unfulfilled");
    expect(fulfillmentBucket(null)).toBe("unfulfilled");
    expect(fulfillmentBucket("")).toBe("unfulfilled");
    expect(fulfillmentBucket("partial")).toBe("unfulfilled");
    expect(fulfillmentBucket("restocked")).toBe("unknown");
  });

  it("filters fulfilled vs unfulfilled rows", () => {
    const fulfilled = filterOrderRowsByFulfillment(rows, "fulfilled").map((r) => r.id);
    const unfulfilled = filterOrderRowsByFulfillment(rows, "unfulfilled").map((r) => r.id);
    const unknown = filterOrderRowsByFulfillment(rows, "unknown").map((r) => r.id);

    expect(fulfilled).toEqual(["paid-done"]);
    expect(unfulfilled).toEqual([
      "open-explicit",
      "open-shopify-null",
      "open-empty",
      "partial",
    ]);
    expect(unknown).toEqual(["restocked"]);
    expect(filterOrderRowsByFulfillment(rows, "").map((r) => r.id)).toEqual(
      rows.map((r) => r.id),
    );
  });

  it("does not leak fulfilled rows into the unfulfilled filter", () => {
    expect(matchesFulfillmentFilter("fulfilled", "unfulfilled")).toBe(false);
    expect(matchesFulfillmentFilter("unfulfilled", "fulfilled")).toBe(false);
    expect(matchesFulfillmentFilter(null, "fulfilled")).toBe(false);
    expect(matchesFulfillmentFilter("restocked", "unfulfilled")).toBe(false);
  });
});
