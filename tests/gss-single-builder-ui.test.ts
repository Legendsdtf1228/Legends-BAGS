import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { merchantProductBuilderUrl, staffSheetEditorUrl } from "../app/lib/app-href";
import { customerEditorUrls } from "../app/lib/editor-links.server";

const ROOT = process.cwd();
const DEV_SHOP = "legends-bags-in2lwdll.myshopify.com";
const LEGACY = "/editor/gang-sheet";
/** Route hrefs only — not `components/editor/gang-sheet/` imports. */
const LEGACY_HREF = /["'`]\/editor\/gang-sheet(?:\?|["'`])/;

const LAUNCH_UI_FILES = [
  "app/routes/app.products.tsx",
  "app/routes/app.products.$bindingId.tsx",
  "app/routes/app.gangsheet-builder.tsx",
  "app/routes/app.shop-builder.tsx",
  "app/routes/app._index.tsx",
  "app/routes/app.setup.tsx",
  "app/routes/app.designs.tsx",
  "app/routes/app.designs.$designId.tsx",
  "app/routes/app.settings.tsx",
  "app/routes/app.integrations.tsx",
  "app/routes/_index/route.tsx",
  "app/routes/editor.upload-by-size.tsx",
  "app/components/merchant/bags-admin-ui.tsx",
  "app/components/merchant/bags-admin-nav.ts",
  "app/lib/editor-links.server.ts",
  "app/lib/app-href.ts",
];

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "build" || name === ".git") continue;
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walkTsFiles(full));
    else if (/\.(ts|tsx|js|jsx|liquid)$/.test(name)) out.push(full);
  }
  return out;
}

describe("one authoritative gang-sheet builder (GSS)", () => {
  it("does not expose /editor/gang-sheet from normal merchant or customer launch UI", () => {
    const hits: string[] = [];
    for (const rel of LAUNCH_UI_FILES) {
      const full = path.join(ROOT, rel);
      if (!existsSync(full)) continue;
      const src = readFileSync(full, "utf8");
      if (LEGACY_HREF.test(src) || src.includes(`"${LEGACY}"`) || src.includes(`\`${LEGACY}`)) {
        hits.push(rel);
      }
    }
    expect(hits).toEqual([]);
  });

  it("keeps customer gang_sheet Open/Build on the Studio bridge", () => {
    const urls = customerEditorUrls(DEV_SHOP, "https://example.com");
    expect(urls.gangSheet).toContain("/editor/studio");
    expect(urls.gangSheet).not.toContain(LEGACY);
    expect(urls.uploadBySize).toContain("/editor/upload-by-size");
  });

  it("routes merchant Open Builder (gang_sheet) through /editor/studio with shop_mode=merchant", () => {
    const url = merchantProductBuilderUrl({
      appUrl: "https://example.com",
      shop: DEV_SHOP,
      builderType: "gang_sheet",
      productGid: "gid://shopify/Product/10088258109734",
      variantGid: "gid://shopify/ProductVariant/987654321",
    });
    expect(url).toContain("/editor/studio");
    expect(url).not.toContain(LEGACY);
    expect(url).toContain("shop_mode=merchant");
  });

  it("routes merchant Preview Builder (upload_by_size) to UBS, not the legacy canvas", () => {
    const url = merchantProductBuilderUrl({
      appUrl: "https://example.com",
      shop: DEV_SHOP,
      builderType: "upload_by_size",
      productGid: "gid://shopify/Product/111",
    });
    expect(url).toContain("/editor/upload-by-size");
    expect(url).not.toContain("/editor/studio");
    expect(url).not.toContain(LEGACY);
  });

  it("routes Shop Builder Edit through /editor/studio", () => {
    const url = staffSheetEditorUrl({
      appUrl: "https://example.com",
      shop: DEV_SHOP,
      designId: "des_staff",
    });
    expect(url).toContain("/editor/studio");
    expect(url).toContain("shop_mode=merchant");
    expect(url).not.toContain(LEGACY);
  });

  it("keeps the theme storefront CTA on /builder (not the legacy canvas)", () => {
    const launcher = readFileSync(path.join(ROOT, "extensions/upload-by-size/assets/lgs-launcher.full.js"), "utf8");
    expect(launcher).toContain('storefrontApiUrl("/builder")');
    expect(launcher).not.toContain(LEGACY);
  });
});

describe("legacy /editor/gang-sheet is fallback-only", () => {
  it("documents the route as a deprecation/fallback path", () => {
    const src = readFileSync(path.join(ROOT, "app/routes/editor.gang-sheet.tsx"), "utf8");
    expect(src).toMatch(/FALLBACK ONLY/i);
  });

  it("does not appear as a launch href outside fallback + tests + scripts + docs", () => {
    const allowed = [
      path.normalize("app/routes/editor.gang-sheet.tsx"),
      path.normalize("app/routes/editor.studio.tsx"),
      path.normalize("app/domain/builder/builder-launch-context.ts"),
      path.normalize("app/lib/builder-launch-handler.server.ts"),
      path.normalize("app/lib/studio-builder.server.ts"),
    ];
    const hits: string[] = [];
    for (const file of walkTsFiles(path.join(ROOT, "app"))) {
      const rel = path.relative(ROOT, file);
      if (allowed.includes(path.normalize(rel))) continue;
      const src = readFileSync(file, "utf8");
      if (LEGACY_HREF.test(src)) hits.push(rel.replaceAll("\\", "/"));
    }
    expect(hits).toEqual([]);
  });
});
