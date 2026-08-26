import { describe, expect, it } from "vitest";
import { extractDesignLines } from "../app/domain/shopify/line-properties";

describe("cart line design extraction", () => {
  it("reads array-shaped Shopify properties", () => {
    const lines = extractDesignLines([
      {
        id: 11,
        properties: [
          { name: "_lgs_design_id", value: "des_a" },
          { name: "_lgs_design_version", value: "2" },
        ],
      },
      { id: 12, properties: [{ name: "Note", value: "no design" }] },
    ]);
    expect(lines).toEqual([
      { lineItemId: "11", designId: "des_a", designVersion: 2 },
    ]);
  });

  it("reads object-shaped properties", () => {
    const lines = extractDesignLines([
      {
        id: "gid://shopify/LineItem/9",
        properties: { _lgs_design_id: "des_b" },
      },
    ]);
    expect(lines[0].designId).toBe("des_b");
  });
});
