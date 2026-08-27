import { authenticate } from "../shopify.server";
import { parseAppProxyPath } from "../domain/security/storefront-access";

export { parseAppProxyPath } from "../domain/security/storefront-access";
export {
  signStorefrontSession,
  verifyStorefrontSession,
  STOREFRONT_SESSION_COOKIE,
  STOREFRONT_SESSION_HEADER,
} from "../domain/security/storefront-access";
export type { AppProxyRoute, StorefrontSessionClaims } from "../domain/security/storefront-access";

/** Verify Shopify app proxy HMAC and return the shop domain from query params. */
export async function verifyAppProxyShop(request: Request): Promise<string> {
  await authenticate.public.appProxy(request);
  const shop = new URL(request.url).searchParams.get("shop")?.trim();
  if (!shop) {
    throw new Response(JSON.stringify({ error: "shop required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  return shop;
}
