import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { loadStorefrontConfig } from "../lib/storefront-config.server";

/**
 * Shopify app proxy — storefront reads config via /apps/legends-bags/storefront-config
 * (HMAC verified by authenticate.public.appProxy).
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticate.public.appProxy(request);

  const shop = new URL(request.url).searchParams.get("shop")?.trim();
  if (!shop) {
    return Response.json({ error: "shop required" }, { status: 400 });
  }

  const path = params["*"]?.replace(/\/$/, "") ?? "";
  if (path !== "storefront-config") {
    return new Response("Not found", { status: 404 });
  }

  const productGid =
    new URL(request.url).searchParams.get("productGid")?.trim() || undefined;
  const payload = await loadStorefrontConfig(shop, productGid);

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}
