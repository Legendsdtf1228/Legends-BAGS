import { describe, expect, it } from "vitest";
import { joinAppHref, resolveHrefBase, staffSheetEditorUrl } from "../app/lib/app-href";

const DEV_SHOP = "legends-bags-in2lwdll.myshopify.com";
const RAILWAY_HOST = "legends-bags-production.up.railway.app";

describe("Shop Builder editor URLs", () => {
  it("throws Invalid URL when a scheme-less Railway host is used as new URL base", () => {
    // Exact DEV crash: loader passed raw SHOPIFY_APP_URL (hostname, no protocol)
    // into new URL("/editor/gang-sheet", appUrl) inside sheets.map.
    expect(() => new URL("/editor/gang-sheet", RAILWAY_HOST)).toThrowError(
      /Invalid URL|Invalid base URL/,
    );
  });

  it("builds staff editor links from a scheme-less Railway domain without crashing", () => {
    const sheets = [{ id: "des_alpha" }, { id: "des_beta" }];
    const hrefs = sheets.map((sheet) =>
      staffSheetEditorUrl({
        appUrl: RAILWAY_HOST,
        shop: DEV_SHOP,
        designId: sheet.id,
      }),
    );

    expect(hrefs).toEqual([
      `https://${RAILWAY_HOST}/editor/gang-sheet?shop=${encodeURIComponent(DEV_SHOP)}&designId=des_alpha&embedded=1`,
      `https://${RAILWAY_HOST}/editor/gang-sheet?shop=${encodeURIComponent(DEV_SHOP)}&designId=des_beta&embedded=1`,
    ]);
  });

  it("keeps valid absolute app URLs", () => {
    expect(
      staffSheetEditorUrl({
        appUrl: `https://${RAILWAY_HOST}/`,
        shop: DEV_SHOP,
        designId: "des_1",
      }),
    ).toBe(
      `https://${RAILWAY_HOST}/editor/gang-sheet?shop=${encodeURIComponent(DEV_SHOP)}&designId=des_1&embedded=1`,
    );
  });

  it("falls back to an application-relative path when the base is empty or relative", () => {
    expect(
      staffSheetEditorUrl({
        appUrl: "",
        shop: DEV_SHOP,
        designId: "des_1",
      }),
    ).toBe(
      `/editor/gang-sheet?shop=${encodeURIComponent(DEV_SHOP)}&designId=des_1&embedded=1`,
    );
    expect(
      staffSheetEditorUrl({
        appUrl: "/apps/legends-bags",
        shop: DEV_SHOP,
        designId: "des_1",
      }),
    ).toMatch(/^\/editor\/gang-sheet\?/);
  });

  it("passes through absolute Shopify asset URLs", () => {
    const shopifyImage =
      "https://cdn.shopify.com/s/files/1/0000/0001/products/logo.png";
    expect(joinAppHref(shopifyImage, RAILWAY_HOST)).toBe(shopifyImage);
    expect(resolveHrefBase(RAILWAY_HOST)).toBe(`https://${RAILWAY_HOST}`);
    expect(resolveHrefBase("0.0.0.0")).toBe("https://0.0.0.0");
  });
});
