import { describe, expect, it, vi } from "vitest";
import { resolveVariantGidForBinding } from "../app/services/shopify-product-sync.server";

describe("resolveVariantGidForBinding", () => {
  it("auto-selects the only variant", async () => {
    const admin = {
      graphql: vi.fn().mockResolvedValue({
        json: async () => ({
          data: {
            product: {
              variants: {
                nodes: [{ id: "gid://shopify/ProductVariant/50252592382200", title: "Default", price: "0.00" }],
              },
            },
          },
        }),
      }),
    };

    const result = await resolveVariantGidForBinding({
      admin,
      productGid: "gid://shopify/Product/10294398320888",
    });

    expect(result.variantGid).toBe("gid://shopify/ProductVariant/50252592382200");
    expect(result.variantCount).toBe(1);
  });

  it("requires explicit selection for multi-variant products", async () => {
    const admin = {
      graphql: vi.fn().mockResolvedValue({
        json: async () => ({
          data: {
            product: {
              variants: {
                nodes: [
                  { id: "gid://shopify/ProductVariant/1", title: "24 in", price: "17.00" },
                  { id: "gid://shopify/ProductVariant/2", title: "36 in", price: "25.00" },
                ],
              },
            },
          },
        }),
      }),
    };

    await expect(
      resolveVariantGidForBinding({
        admin,
        productGid: "gid://shopify/Product/100",
      }),
    ).rejects.toThrow(/Select a variant/);
  });
});
