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

  it("passes cart-edit designId through to the editor URL", () => {
    const url = buildEditorLaunchUrl("https://upload-by-size-production.up.railway.app", {
      shop: DEV_SHOP,
      productId: "123",
      productGid: "gid://shopify/Product/123",
      variantId: "456",
      variantGid: "gid://shopify/ProductVariant/456",
      quantity: 1,
      shopMode: "1",
      builderType: "gang_sheet",
    }, {
      designId: "des_reopen",
      designVersion: "4",
      lgs_customer_key: "guest:cart-edit",
    });
    expect(url).toContain("designId=des_reopen");
    expect(url).toContain("designVersion=4");
    expect(url).toContain("lgs_customer_key=guest%3Acart-edit");
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
          productStatus: "ACTIVE",
          sheetHeightIn: 24,
          variantPriceCents: 1700,
        },
        {
          shop,
          productGid: ubsProductGid,
          variantGid: "gid://shopify/ProductVariant/ubs-var-1",
          builderType: "upload_by_size",
          productStatus: "ACTIVE",
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

  it("does not launch a disabled product binding", async () => {
    await prisma.productBinding.updateMany({
      where: { shop, productGid: gangProductGid },
      data: { enabled: false },
    });
    const result = await resolveBuilderLaunch({
      shop,
      product: numericIdFromGid(gangProductGid)!,
      variant: numericIdFromGid(gangVariantGid)!,
      quantity: "1",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("binding_not_found");
  });

  it("does not fall through from a disabled requested variant to another enabled variant", async () => {
    await prisma.productBinding.updateMany({
      where: { shop, productGid: gangProductGid, variantGid: gangVariantGid },
      data: { enabled: false },
    });
    await prisma.productBinding.create({
      data: {
        shop,
        productGid: gangProductGid,
        variantGid: "gid://shopify/ProductVariant/other-enabled",
        builderType: "gang_sheet",
        productStatus: "ACTIVE",
        sheetHeightIn: 24,
        enabled: true,
      },
    });
    const result = await resolveBuilderLaunch({
      shop,
      product: numericIdFromGid(gangProductGid)!,
      variant: numericIdFromGid(gangVariantGid)!,
      quantity: "1",
    });
    expect(result.ok).toBe(false);
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
    process.env.FILE_SIGNING_SECRET = "test-signing-secret-32chars!!";
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
  it("defaults gang_sheet /builder to /editor/studio when the Studio bridge is present", async () => {
    vi.stubEnv("DEV_SHOP", DEV_SHOP);
    vi.stubEnv("SHOPIFY_APP_URL", "https://upload-by-size-production.up.railway.app");
    delete process.env.USE_STUDIO_BUILDER;

    const gangProductGid = "gid://shopify/Product/900010";
    const gangVariantGid = "gid://shopify/ProductVariant/900011";
    await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: gangProductGid } });
    await prisma.productBinding.create({
      data: {
        shop: DEV_SHOP,
        productGid: gangProductGid,
        variantGid: gangVariantGid,
        builderType: "gang_sheet",
        productStatus: "ACTIVE",
        sheetHeightIn: 24,
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
      expect(location).toContain("/editor/studio");
      expect(location).not.toContain("/editor/gang-sheet");
      expect(location).toContain("shop_mode=1");
      expect(location).toContain("variantId=900011");
    } finally {
      await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: gangProductGid } });
      vi.unstubAllEnvs();
    }
  });

  it("rolls gang_sheet /builder back to /editor/gang-sheet when USE_STUDIO_BUILDER=0", async () => {
    vi.stubEnv("DEV_SHOP", DEV_SHOP);
    vi.stubEnv("SHOPIFY_APP_URL", "https://upload-by-size-production.up.railway.app");
    vi.stubEnv("USE_STUDIO_BUILDER", "0");

    const gangProductGid = "gid://shopify/Product/900012";
    const gangVariantGid = "gid://shopify/ProductVariant/900013";
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
          `https://upload-by-size-production.up.railway.app/builder?shop=${DEV_SHOP}&product=900012&variant=900013&quantity=1&shop_mode=1`,
        ),
        params: {},
        context: {},
      } as never);
      expect.unreachable("expected redirect");
    } catch (error) {
      const response = error as Response;
      const location = response.headers.get("Location") || "";
      expect(location).toContain("/editor/gang-sheet");
      expect(location).not.toContain("/editor/studio");
    } finally {
      await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: gangProductGid } });
      vi.unstubAllEnvs();
    }
  });

  it("keeps upload_by_size /builder on the UBS editor", async () => {
    vi.stubEnv("DEV_SHOP", DEV_SHOP);
    vi.stubEnv("SHOPIFY_APP_URL", "https://upload-by-size-production.up.railway.app");
    delete process.env.USE_STUDIO_BUILDER;

    const ubsProductGid = "gid://shopify/Product/900030";
    await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: ubsProductGid } });
    await prisma.productBinding.create({
      data: {
        shop: DEV_SHOP,
        productGid: ubsProductGid,
        variantGid: "gid://shopify/ProductVariant/900031",
        builderType: "upload_by_size",
        pricePerSqIn: 0.049,
      },
    });

    const { loader } = await import("../app/routes/builder");
    try {
      await loader({
        request: new Request(
          `https://upload-by-size-production.up.railway.app/builder?shop=${DEV_SHOP}&product=900030&variant=900031&quantity=1`,
        ),
        params: {},
        context: {},
      } as never);
      expect.unreachable("expected redirect");
    } catch (error) {
      const response = error as Response;
      const location = response.headers.get("Location") || "";
      expect(location).toContain("/editor/upload-by-size");
      expect(location).not.toContain("/editor/studio");
      expect(location).not.toContain("/editor/gang-sheet");
    } finally {
      await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: ubsProductGid } });
      vi.unstubAllEnvs();
    }
  });

  it("routes gang_sheet /builder to /editor/studio when USE_STUDIO_BUILDER=1", async () => {
    vi.stubEnv("DEV_SHOP", DEV_SHOP);
    vi.stubEnv("SHOPIFY_APP_URL", "https://upload-by-size-production.up.railway.app");
    process.env.USE_STUDIO_BUILDER = "1";
    const gangProductGid = "gid://shopify/Product/900020";
    await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: gangProductGid } });
    await prisma.productBinding.create({
      data: {
        shop: DEV_SHOP,
        productGid: gangProductGid,
        variantGid: "gid://shopify/ProductVariant/900021",
        builderType: "gang_sheet",
        productStatus: "ACTIVE",
        sheetWidthIn: 22.5,
        sheetHeightIn: 24,
      },
    });
    try {
      const { loader } = await import("../app/routes/builder");
      await loader({
        request: new Request(
          `https://upload-by-size-production.up.railway.app/builder?shop=${DEV_SHOP}&product=900020&variant=900021&quantity=1&shop_mode=1`,
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
      expect(location).toContain("/editor/studio");
      expect(location).not.toContain("/editor/gang-sheet");
      expect(location).toContain("variantId=900021");
    } finally {
      delete process.env.USE_STUDIO_BUILDER;
      await prisma.productBinding.deleteMany({ where: { shop: DEV_SHOP, productGid: gangProductGid } });
      vi.unstubAllEnvs();
    }
  });
});

describe("buildLaunchEditorUrl studio flag", () => {
  const original = process.env.USE_STUDIO_BUILDER;

  afterEach(() => {
    process.env.USE_STUDIO_BUILDER = original;
  });

  it("keeps legacy gang-sheet path when USE_STUDIO_BUILDER=0", async () => {
    process.env.USE_STUDIO_BUILDER = "0";
    const { buildLaunchEditorUrl } = await import("../app/lib/builder-launch-handler.server");
    const url = buildLaunchEditorUrl("https://example.com", {
      shop: DEV_SHOP,
      productId: "1",
      productGid: "gid://shopify/Product/1",
      quantity: 1,
      builderType: "gang_sheet",
    });
    expect(url).toContain("/editor/gang-sheet");
  });

  it("defaults gang_sheet to /editor/studio when the flag is unset and the bridge exists", async () => {
    delete process.env.USE_STUDIO_BUILDER;
    const { buildLaunchEditorUrl } = await import("../app/lib/builder-launch-handler.server");
    const url = buildLaunchEditorUrl("https://example.com", {
      shop: DEV_SHOP,
      productId: "1",
      productGid: "gid://shopify/Product/1",
      quantity: 1,
      builderType: "gang_sheet",
    });
    expect(url).toContain("/editor/studio");
    expect(url).not.toContain("/editor/gang-sheet");
  });

  it("uses /editor/studio for gang_sheet when USE_STUDIO_BUILDER=1", async () => {
    process.env.USE_STUDIO_BUILDER = "1";
    const { buildLaunchEditorUrl } = await import("../app/lib/builder-launch-handler.server");
    const url = buildLaunchEditorUrl("https://example.com", {
      shop: DEV_SHOP,
      productId: "1",
      productGid: "gid://shopify/Product/1",
      variantId: "2",
      variantGid: "gid://shopify/ProductVariant/2",
      quantity: 1,
      shopMode: "1",
      builderType: "gang_sheet",
    }, { designId: "des_1", designVersion: "3" });
    expect(url).toContain("/editor/studio");
    expect(url).toContain("designId=des_1");
    expect(url).toContain("designVersion=3");
  });
});
