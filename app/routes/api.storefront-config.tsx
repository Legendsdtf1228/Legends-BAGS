import type { LoaderFunctionArgs } from "react-router";
import { loadStorefrontConfig } from "../lib/storefront-config.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop")?.trim();
  if (!shop) {
    return Response.json({ error: "shop required" }, { status: 400 });
  }

  const productGid = url.searchParams.get("productGid")?.trim() || undefined;
  const payload = await loadStorefrontConfig(shop, productGid);

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}
