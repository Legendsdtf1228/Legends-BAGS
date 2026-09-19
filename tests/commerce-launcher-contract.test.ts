import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HIDDEN_CART_LINE_PROPERTIES,
  VISIBLE_CART_LINE_PROPERTIES,
  cartAddPropertyFieldName,
} from "../app/domain/shopify/line-properties";
import {
  buildCartEditUrl,
  CART_EDIT_DESIGN_ID_PARAM,
  CART_EDIT_DESIGN_VERSION_PARAM,
  CART_EDIT_OPEN_PARAM,
  CART_EDIT_TOKEN_PARAM,
} from "../app/domain/shopify/cart-edit";
import { isCartAddUrl, mergeCartPropertiesIntoAddBody } from "../app/domain/shopify/cart-add";

const root = process.cwd();

function read(relative: string) {
  return readFileSync(join(root, relative), "utf8");
}

describe("cart edit reopen URL", () => {
  it("appends design query params without breaking an existing variant query", () => {
    const url = buildCartEditUrl({
      productUrl: "/products/gang-sheet?variant=456",
      designId: "des_reopen",
      version: 3,
      token: "tok_abc",
    });
    const parsed = new URL(url, "https://legends-bags-in2lwdll.myshopify.com");
    expect(parsed.searchParams.get("variant")).toBe("456");
    expect(parsed.searchParams.get(CART_EDIT_DESIGN_ID_PARAM)).toBe("des_reopen");
    expect(parsed.searchParams.get(CART_EDIT_DESIGN_VERSION_PARAM)).toBe("3");
    expect(parsed.searchParams.get(CART_EDIT_TOKEN_PARAM)).toBe("tok_abc");
    expect(parsed.searchParams.get(CART_EDIT_OPEN_PARAM)).toBe("1");
    expect(url.startsWith("/products/gang-sheet?")).toBe(true);
    expect(url).not.toContain("?lgs_design_id=");
  });

  it("cart-edit liquid uses the launcher hydrate query contract", () => {
    const liquid = read("extensions/upload-by-size/blocks/cart-edit-design.liquid");
    expect(liquid).toContain("item.properties['_lgs_design_id']");
    expect(liquid).toContain("item.properties['_lgs_design_version']");
    expect(liquid).toContain("item.properties['_lgs_design_token']");
    expect(liquid).toContain("item.properties['Design']");
    expect(liquid).toContain("lgs_design_id=");
    expect(liquid).toContain("lgs_design_version=");
    expect(liquid).toContain("lgs_token=");
    expect(liquid).toContain("lgs_open=1");
    expect(liquid).toContain("item.url contains '?'");
  });
});

describe("launcher cart/add attach", () => {
  it("recognizes Shopify cart add endpoints", () => {
    expect(isCartAddUrl("/cart/add")).toBe(true);
    expect(isCartAddUrl("https://shop.myshopify.com/cart/add.js")).toBe(true);
    expect(isCartAddUrl("/cart/change.js")).toBe(false);
  });

  it("merges the full property contract into Ajax JSON bodies", () => {
    const properties = {
      _lgs_design_id: "des_1",
      _lgs_design_version: "2",
      _lgs_price_ref: "ref",
      _lgs_design_token: "tok",
    };
    const merged = JSON.parse(
      mergeCartPropertiesIntoAddBody(
        JSON.stringify({ id: 456, quantity: 1 }),
        properties,
      ) as string,
    ) as { properties: Record<string, string> };
    expect(merged.properties).toMatchObject(properties);

    const form = new URLSearchParams("id=456&quantity=1");
    mergeCartPropertiesIntoAddBody(form, properties);
    expect(form.get(cartAddPropertyFieldName("_lgs_design_id"))).toBe("des_1");
    expect(form.get(cartAddPropertyFieldName("_lgs_design_token"))).toBe("tok");
  });

  it("theme launcher listens for lgs:design-ready and writes cart properties", () => {
    const launcher = read("extensions/upload-by-size/assets/lgs-launcher.full.js");
    expect(launcher).toContain('event.data.type !== "lgs:design-ready"');
    expect(launcher).toContain("event.data.cartProperties");
    expect(launcher).toContain('upsertHidden(form, "properties[" + key + "]", cartProperties[key])');
    expect(launcher).toContain('params.get("lgs_design_id")');
    expect(launcher).toContain('params.get("lgs_token")');
    expect(launcher).toContain('params.get("lgs_open")');
    expect(launcher).toContain("installCartAddFetchHook");
    expect(launcher).toContain("customerKey");
    expect(launcher).toContain("/session");
    for (const key of HIDDEN_CART_LINE_PROPERTIES) {
      expect(launcher).toContain(`"${key}"`);
    }
    for (const key of VISIBLE_CART_LINE_PROPERTIES) {
      expect(launcher).toContain(`"${key}"`);
    }
  });

  it("app proxy serves the same launcher script the theme stub loads", () => {
    const stub = read("extensions/upload-by-size/assets/lgs-launcher.js");
    const proxy = read("app/routes/apps.legends-bags.$.tsx");
    expect(stub).toContain("/lgs-launcher.full.js");
    expect(proxy).toContain('kind === "launcher-script"');
    expect(proxy).toContain("createStorefrontSessionResponse");
    expect(proxy).toContain("verifyAppProxyShop");
  });
});
