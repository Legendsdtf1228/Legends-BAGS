import { afterEach, describe, expect, it, vi } from "vitest";
import { customerEditorUrls } from "../app/lib/editor-links.server";
import {
  isMerchantStudioLaunchEnabled,
  isStudioBuilderEnabled,
  studioBridgePresent,
  studioEditorPath,
} from "../app/lib/studio-builder.server";

const DEV_SHOP = "legends-bags-in2lwdll.myshopify.com";

describe("studio builder bridge", () => {
  const original = process.env.USE_STUDIO_BUILDER;

  afterEach(() => {
    process.env.USE_STUDIO_BUILDER = original;
  });

  it("detects the synced Studio dist", () => {
    expect(studioBridgePresent()).toBe(true);
    expect(studioEditorPath()).toBe("/editor/studio");
  });

  it("defaults customer Studio routing on when the bridge exists", () => {
    delete process.env.USE_STUDIO_BUILDER;
    expect(isStudioBuilderEnabled()).toBe(true);
  });

  it("honors explicit USE_STUDIO_BUILDER=0 for customer /builder rollback", () => {
    process.env.USE_STUDIO_BUILDER = "0";
    expect(isStudioBuilderEnabled()).toBe(false);
    expect(isMerchantStudioLaunchEnabled()).toBe(true);
  });

  it("keeps merchant Studio launch on while the bridge exists", () => {
    process.env.USE_STUDIO_BUILDER = "0";
    expect(isMerchantStudioLaunchEnabled()).toBe(true);
    process.env.USE_STUDIO_BUILDER = "1";
    expect(isMerchantStudioLaunchEnabled()).toBe(true);
  });
});

describe("merchant /editor/studio shim", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads /studio/ for merchant preview even when USE_STUDIO_BUILDER=0", async () => {
    vi.stubEnv("USE_STUDIO_BUILDER", "0");
    vi.stubEnv("DEV_SHOP", DEV_SHOP);
    vi.stubEnv("TEST_API_TOKEN", "test-token");

    const { loader } = await import("../app/routes/editor.studio");
    const response = await loader({
      request: new Request(
        `http://localhost/editor/studio?shop=${DEV_SHOP}&productGid=${encodeURIComponent("gid://shopify/Product/1")}&product=1&shop_mode=merchant`,
      ),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(302);
    const location = response.headers.get("Location") || "";
    expect(location).toContain("/studio/");
    expect(location).toContain("host=bags");
    expect(location).toContain("shop_mode=merchant");
    expect(location).not.toContain("/editor/gang-sheet");
  });
});

describe("setup/home customer editor try links", () => {
  it("points gang sheet try-links at the Studio bridge", () => {
    const urls = customerEditorUrls(DEV_SHOP, "https://example.com");
    expect(urls.gangSheet).toBe(`https://example.com/editor/studio?shop=${encodeURIComponent(DEV_SHOP)}`);
    expect(urls.uploadBySize).toBe(
      `https://example.com/editor/upload-by-size?shop=${encodeURIComponent(DEV_SHOP)}`,
    );
  });
});
