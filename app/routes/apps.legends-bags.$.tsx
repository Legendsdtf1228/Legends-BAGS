import type { LoaderFunctionArgs } from "react-router";
import {
  buildDesignApiResponse,
  parseDesignApiQuery,
  resolveDesignApiShop,
} from "../lib/design-api.server";
import { createStorefrontSessionResponse } from "../lib/editor-auth.server";
import { normalizeCustomerKey } from "../domain/security/customer-key";
import { loadStorefrontConfig } from "../lib/storefront-config.server";
import {
  parseAppProxyPath,
  verifyAppProxyShop,
} from "../lib/storefront-access.server";

/**
 * Shopify app proxy — HMAC-verified storefront APIs at /apps/legends-bags/*
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const shop = await verifyAppProxyShop(request);
  const path = params["*"]?.replace(/\/$/, "") ?? "";
  const route = parseAppProxyPath(path);

  if (!route) {
    return new Response("Not found", { status: 404 });
  }

  if (route.kind === "storefront-config") {
    const productGid =
      new URL(request.url).searchParams.get("productGid")?.trim() || undefined;
    const payload = await loadStorefrontConfig(shop, productGid);
    return Response.json(payload, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  if (route.kind === "session") {
    const customerKey = normalizeCustomerKey(
      new URL(request.url).searchParams.get("customerKey"),
    );
    return createStorefrontSessionResponse(shop, customerKey);
  }

  if (route.kind === "design") {
    const query = parseDesignApiQuery(request);
    const resolvedShop = resolveDesignApiShop(route.designId, query, shop);
    return buildDesignApiResponse(resolvedShop, route.designId, query);
  }

  return new Response("Not found", { status: 404 });
}
