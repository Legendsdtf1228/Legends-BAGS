import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEditorLaunchUrl,
  numericIdFromGid,
  parseBuilderLaunchQuery,
  toProductGid,
  toVariantGid,
} from "../app/domain/builder/builder-launch-context";
import { resolveBuilderLaunch } from "../app/lib/builder-launch.server";
import { normalizeAppUrl } from "../app/lib/app-url.server";
import { buildCartLineProperties } from "../app/domain/shopify/line-properties";
import { DESIGN_STATE_SCHEMA_VERSION } from "../app/domain/design/types";
import prisma from "../app/db.server";

const DEV_SHOP = "legends-bags-in2lwdll.myshopify.com";

describe("builder-launch-context", () => {
  const originalDevShop = process.env.DEV_SHOP;

  beforeEach(() => {
    process.env.DEV_SHOP = DEV_SHOP;
  });

  afterEach(() => {
    process.env.DEV_SHOP = originalDevShop;
  });

  it("accepts valid product with no variant", () => {
    const parsed = parseBuilderLaunchQuery({
      shop: DEV_SHOP,
      product: "10088258109734",
      variant: "",
      quantity: "1",
      shop_mode: "1",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.input.productGid).toBe("gid://shopify/Product/10088258109734");
    expect(parsed.input.variantId).toBeUndefined();
    expect(parsed.input.quantity).toBe(1);
    expect(parsed.input.shopMode).toBe("1");
  });

  it("accepts valid product with variant", () => {
    const parsed = parseBuilderLaunchQuery({
      shop: DEV_SHOP,
      product: "10088258109734",
      variant: "987654321",
      quantity: "2",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.input.variantId).toBe("987654321");
    expect(parsed.input.variantGid).toBe("gid://shopify/ProductVariant/987654321");
    expect(parsed.input.quantity).toBe(2);
  });

  it("rejects missing product", () => {
    const parsed = parseBuilderLaunchQuery({ shop: DEV_SHOP, product: "" });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("missing_product");
  });

  it("rejects invalid shop domain", () => {
    const parsed = parseBuilderLaunchQuery({
      shop: "not-a-real-shop.com",
      product: "123",
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("invalid_shop");
  });

  it("rejects invalid quantity", () => {
    const parsed = parseBuilderLaunchQuery({
      shop: DEV_SHOP,
      product: "123",
      quantity: "0",
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("invalid_quantity");
  });

  it("rejects shops outside DEV_SHOP", () => {
    const parsed = parseBuilderLaunchQuery({
      shop: "other-store.myshopify.com",
      product: "123",
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("shop_not_allowed");
  });

  it("builds gang sheet editor redirect URL", () => {
    const url = buildEditorLaunchUrl("https://upload-by-size-production.up.railway.app", {
      shop: DEV_SHOP,
      productId: "123",
      productGid: "gid://shopify/Product/123",
      variantId: "456",
      variantGid: "gid://shopify/ProductVariant/456",
      quantity: 1,
      shopMode: "1",
      builderType: "gang_sheet",
    });
    expect(url).toContain("/editor/gang-sheet");
    expect(url).toContain("shop=legends-bags-in2lwdll.myshopify.com");
    expect(url).toContain("productGid=gid%3A%2F%2Fshopify%2FProduct%2F123");
    expect(url).toContain("variantId=456");
    expect(url).toContain("quantity=1");
    expect(url).toContain("shop_mode=1");
  });

  it("preserves storefront customer params in editor URL", () => {
    const url = buildEditorLaunchUrl(
      "https://upload-by-size-production.up.railway.app",
      {
        shop: DEV_SHOP,
        productId: "123",
        productGid: "gid://shopify/Product/123",
        variantId: "456",
        variantGid: "gid://shopify/ProductVariant/456",
        quantity: 1,
        builderType: "gang_sheet",
      },
      {
        lgs_customer_key: "gid://shopify/Customer/998877",
        lgs_customer_name: "Alex Rivera",
        lgs_customer_email: "alex@example.com",
      },
    );
    expect(url).toContain("lgs_customer_key=gid%3A%2F%2Fshopify%2FCustomer%2F998877");
    expect(url).toContain("lgs_customer_name=Alex+Rivera");
    expect(url).toContain("lgs_customer_email=alex%40example.com");
  });

  it("builds upload-by-size editor redirect URL", () => {
    const url = buildEditorLaunchUrl("https://upload-by-size-production.up.railway.app/", {
      shop: DEV_SHOP,
      productId: "123",
      productGid: "gid://shopify/Product/123",
      quantity: 3,
      builderType: "upload_by_size",
    });
    expect(url).toContain("/editor/upload-by-size");
    expect(url).toContain("quantity=3");
  });

  it("converts numeric IDs to GIDs", () => {
    expect(toProductGid("10088258109734")).toBe("gid://shopify/Product/10088258109734");
    expect(toVariantGid("987654321")).toBe("gid://shopify/ProductVariant/987654321");
    expect(numericIdFromGid("gid://shopify/Product/10088258109734")).toBe("10088258109734");
  });

  it("builds storefront /builder URL", async () => {
    const { buildBuilderLaunchUrl } = await import("../app/lib/builder-links.server");
    const url = buildBuilderLaunchUrl({
      appUrl: "https://upload-by-size-production.up.railway.app",
      shop: DEV_SHOP,
      productId: "10088258109734",
      variantId: "987654321",
      quantity: 1,
    });
    expect(url).toContain("/builder?");
    expect(url).toContain("product=10088258109734");
    expect(url).toContain("variant=987654321");
    expect(url).toContain("shop_mode=1");
  });
});

describe("resolveBuilderLaunch", () => {
  const originalDevShop = process.env.DEV_SHOP;
  const shop = DEV_SHOP;
  const gangProductGid = "gid://shopify/Product/900001";
  const ubsProductGid = "gid://shopify/Product/900003";
  const gangVariantGid = "gid://shopify/ProductVariant/900002";

  beforeEach(async () => {
    process.env.DEV_SHOP = DEV_SHOP;
    await prisma.productBinding.deleteMany({
      where: { shop, productGid: { in: [gangProductGid, ubsProductGid] } },
    });
    await prisma.productBinding.createMany({
      data: [
        {
          shop,
          productGid: gangProductGid,
          variantGid: gangVariantGid,
          builderType: "gang_sheet",
          sheetHeightIn: 24,
          variantPriceCents: 1700,
        },
        {
          shop,
          productGid: ubsProductGid,
          variantGid: "gid://shopify/ProductVariant/ubs-var-1",
          builderType: "upload_by_size",
          pricePerSqIn: 0.049,
        },
      ],
    });
  });

  afterEach(async () => {
    process.env.DEV_SHOP = originalDevShop;
    await prisma.productBinding.deleteMany({
      where: { shop, productGid: { in: [gangProductGid, ubsProductGid] } },
    });
  });

  it("resolves gang sheet binding by variant", async () => {
    const result = await resolveBuilderLaunch({
      shop,
      product: numericIdFromGid(gangProductGid)!,
      variant: numericIdFromGid(gangVariantGid)!,
      quantity: "1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.context.builderType).toBe("gang_sheet");
  });

  it("resolves upload-by-size binding by product", async () => {
    const result = await resolveBuilderLaunch({
      shop,
      product: numericIdFromGid(ubsProductGid)!,
      variant: "",
      quantity: "1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.context.builderType).toBe("upload_by_size");
  });

  it("returns clean error for unknown binding", async () => {
    const result = await resolveBuilderLaunch({
      shop,
      product: "999999999999",
      variant: "",
      quantity: "1",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("binding_not_found");
    expect(result.message).toContain("not been connected");
  });
});

describe("builder recovery", () => {
  const originalDevShop = process.env.DEV_SHOP;
  const shop = DEV_SHOP;

  beforeEach(async () => {
    process.env.DEV_SHOP = DEV_SHOP;
    process.env.SHOPIFY_APP_URL = "https://upload-by-size-production.up.railway.app";
    await prisma.productBinding.deleteMany({
      where: { shop, productGid: "gid://shopify/Product/900099" },
    });
    await prisma.productBinding.create({
      data: {
        shop,
        productGid: "gid://shopify/Product/900099",
        variantGid: "gid://shopify/ProductVariant/900100",
        builderType: "gang_sheet",
        sheetHeightIn: 24,
        variantPriceCents: 1700,
        productTitle: "Dev Gang Sheet Test",
      },
    });
  });

  afterEach(async () => {
    process.env.DEV_SHOP = originalDevShop;
    await prisma.productBinding.deleteMany({
      where: { shop, productGid: "gid://shopify/Product/900099" },
    });
  });

  it("shows recovery screen when product ID is missing", async () => {
    const { handleBuilderLaunchRequest } = await import("../app/lib/builder-launch-handler.server");
    const response = await handleBuilderLaunchRequest(
      new Request(
        `https://upload-by-size-production.up.railway.app/builder?shop=${shop}&type=gang_sheet`,
      ),
    );
    expect(response.status).toBe(400);
    const html = await response.text();
    expect(html).toContain("Dev Gang Sheet Test");
    expect(html).toContain("product=900099");
  });
});

describe("app-url normalization", () => {
  it("strips trailing slashes and duplicate path slashes", () => {
    expect(normalizeAppUrl("https://upload-by-size-production.up.railway.app/")).toBe(
      "https://upload-by-size-production.up.railway.app",
    );
    expect(normalizeAppUrl("https://upload-by-size-production.up.railway.app//")).toBe(
      "https://upload-by-size-production.up.railway.app",
    );
  });
});

describe("builder cart metadata compatibility", () => {
  it("keeps paid-order pipeline line properties", () => {
    const props = buildCartLineProperties({
      shop: DEV_SHOP,
      designId: "design_123",
      version: 2,
      designName: "Test sheet",
      state: {
        schemaVersion: DESIGN_STATE_SCHEMA_VERSION,
        workflow: "gang_sheet",
        sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
        items: [{ assetId: "a1", widthIn: 4, heightIn: 4, quantity: 1, rotationDeg: 0, xIn: 0, yIn: 0 }],
        pricing: { totalCents: 1700, areaSqIn: 16, pricePerSqIn: 0.049, currency: "USD" },
      },
    });
    expect(props._lgs_design_id).toBe("design_123");
    expect(props._lgs_design_version).toBe("2");
    expect(props._lgs_workflow).toBe("gang_sheet");
    expect(props._lgs_price_ref).toBeTruthy();
  });
});

describe("builder route loader", () => {
  it("redirects gang sheet products to the gang sheet editor", async () => {
    vi.stubEnv("DEV_SHOP", DEV_SHOP);
    vi.stubEnv("SHOPIFY_APP_URL", "https://upload-by-size-production.up.railway.app");

    const gangProductGid = "gid://shopify/Product/900010";
    const gangVariantGid = "gid://shopify/ProductVariant/900011";
    await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: gangProductGid } });
    await prisma.productBinding.create({
      data: {
        shop: DEV_SHOP,
        productGid: gangProductGid,
        variantGid: gangVariantGid,
        builderType: "gang_sheet",
      },
    });

    const { loader } = await import("../app/routes/builder");
    try {
      await loader({
        request: new Request(
          `https://upload-by-size-production.up.railway.app/builder?shop=${DEV_SHOP}&product=900010&variant=900011&quantity=1&shop_mode=1`,
        ),
        params: {},
        context: {},
      } as never);
      expect.unreachable("expected redirect");
    } catch (error) {
      expect(error).toMatchObject({
        status: 302,
        headers: expect.objectContaining({
          get: expect.any(Function),
        }),
      });
      const response = error as Response;
      const location = response.headers.get("Location") || "";
      expect(location).toContain("/editor/gang-sheet");
      expect(location).toContain("shop_mode=1");
      expect(location).toContain("variantId=900011");
    } finally {
      await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: gangProductGid } });
      vi.unstubAllEnvs();
    }
  });
});
