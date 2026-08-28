import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mergeEditorLaunchFromUrl } from "../app/lib/editor-launch.server";
import { signStorefrontSession } from "../app/domain/security/storefront-access";

const DEV_SHOP = "legends-bags-in2lwdll.myshopify.com";

describe("mergeEditorLaunchFromUrl", () => {
  const originalDevShop = process.env.DEV_SHOP;
  const originalSecret = process.env.FILE_SIGNING_SECRET;

  beforeEach(() => {
    process.env.DEV_SHOP = DEV_SHOP;
    process.env.FILE_SIGNING_SECRET = "test-signing-secret-32chars!!";
  });

  afterEach(() => {
    process.env.DEV_SHOP = originalDevShop;
    process.env.FILE_SIGNING_SECRET = originalSecret;
  });

  it("reads customer identity from verified storefront session", () => {
    const { token } = signStorefrontSession(DEV_SHOP, {
      customerKey: "gid://shopify/Customer/1",
      customerName: "Alex Rivera",
      customerEmail: "alex@example.com",
    });
    const request = new Request(
      `https://app.example/editor/gang-sheet?shop=${DEV_SHOP}&product=123&lgs_session=${encodeURIComponent(token)}&lgs_customer_name=Tampered&lgs_customer_email=tampered%40example.com&lgs_customer_key=gid%3A%2F%2Fshopify%2FCustomer%2F999`,
    );
    const launch = mergeEditorLaunchFromUrl(request, "");
    expect(launch.customerName).toBe("Alex Rivera");
    expect(launch.customerEmail).toBe("alex@example.com");
    expect(launch.customerKey).toBe("gid://shopify/Customer/1");
  });

  it("ignores unsigned URL customer params when session is absent", () => {
    const request = new Request(
      `https://app.example/editor/gang-sheet?shop=${DEV_SHOP}&product=123&lgs_customer_name=Alex+Rivera&lgs_customer_email=alex%40example.com&lgs_customer_key=gid%3A%2F%2Fshopify%2FCustomer%2F1`,
    );
    const launch = mergeEditorLaunchFromUrl(request, "");
    expect(launch.customerName).toBe("");
    expect(launch.customerEmail).toBe("");
    expect(launch.customerKey).toBe("");
  });

  it("falls back to storefront session when URL customer params are absent", () => {
    const { token } = signStorefrontSession(DEV_SHOP, {
      customerKey: "gid://shopify/Customer/42",
      customerName: "Session User",
      customerEmail: "session@example.com",
    });
    const request = new Request(
      `https://app.example/editor/gang-sheet?shop=${DEV_SHOP}&product=123&lgs_session=${encodeURIComponent(token)}`,
    );
    const launch = mergeEditorLaunchFromUrl(request, "");
    expect(launch.customerName).toBe("Session User");
    expect(launch.customerEmail).toBe("session@example.com");
    expect(launch.customerKey).toBe("gid://shopify/Customer/42");
  });
});
