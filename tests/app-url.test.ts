import { afterEach, describe, expect, it } from "vitest";
import { bootstrapAppUrlEnv, resolveAppUrl } from "../app/lib/app-url.server";

describe("app-url.server", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("prefers SHOPIFY_APP_URL", () => {
    process.env.SHOPIFY_APP_URL = "https://custom.example/";
    process.env.RAILWAY_PUBLIC_DOMAIN = "ignored.up.railway.app";
    expect(resolveAppUrl()).toBe("https://custom.example");
  });

  it("derives from RAILWAY_PUBLIC_DOMAIN", () => {
    delete process.env.SHOPIFY_APP_URL;
    process.env.RAILWAY_PUBLIC_DOMAIN = "legends-bags.up.railway.app";
    expect(resolveAppUrl()).toBe("https://legends-bags.up.railway.app");
  });

  it("bootstrapAppUrlEnv sets SHOPIFY_APP_URL from Railway domain", () => {
    delete process.env.SHOPIFY_APP_URL;
    process.env.RAILWAY_PUBLIC_DOMAIN = "legends-bags.up.railway.app";
    bootstrapAppUrlEnv();
    expect(process.env.SHOPIFY_APP_URL).toBe("https://legends-bags.up.railway.app");
  });
});
