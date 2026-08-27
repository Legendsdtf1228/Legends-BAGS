import {
  STOREFRONT_SESSION_COOKIE,
  STOREFRONT_SESSION_HEADER,
  verifyStorefrontSession,
} from "./storefront-access";
import {
  CUSTOMER_KEY_COOKIE,
  normalizeCustomerKey,
} from "./customer-key";

export type CustomerApiContext = {
  shop: string;
  customerKey: string | null;
  isDevToken: boolean;
};

/** Shared gate for Phase-1 customer/dev APIs. */
export function assertTestAccess(request: Request): string {
  const expected = process.env.TEST_API_TOKEN;
  if (!expected) {
    throw new Response("TEST_API_TOKEN not configured", { status: 500 });
  }

  const headerShop = request.headers.get("X-LGS-Shop");
  const headerToken = request.headers.get("X-LGS-Test-Token");
  const cookie = request.headers.get("Cookie") || "";
  const cookieShop = readCookie(cookie, "lgs_shop");
  const cookieToken = readCookie(cookie, "lgs_test_token");

  const token = headerToken || cookieToken;
  const shop = headerShop || cookieShop || process.env.DEV_SHOP || "";

  if (token !== expected) {
    throw new Response("Unauthorized", { status: 401 });
  }
  if (!shop) {
    throw new Response("Missing shop", { status: 400 });
  }
  return shop;
}

function readStorefrontSessionToken(request: Request): string | undefined {
  const header = request.headers.get(STOREFRONT_SESSION_HEADER)?.trim();
  if (header) return header;
  const cookie = request.headers.get("Cookie") || "";
  return readCookie(cookie, STOREFRONT_SESSION_COOKIE);
}

function readCustomerKeyHint(request: Request): string | null {
  const cookie = request.headers.get("Cookie") || "";
  const fromCookie = readCookie(cookie, CUSTOMER_KEY_COOKIE);
  const fromHeader = request.headers.get("X-LGS-Customer-Key");
  return normalizeCustomerKey(fromHeader ?? fromCookie);
}

/** Dev test token or signed storefront session from app proxy bootstrap. */
export function assertCustomerApiContext(request: Request): CustomerApiContext {
  const sessionToken = readStorefrontSessionToken(request);
  if (sessionToken) {
    try {
      const claims = verifyStorefrontSession(sessionToken);
      const headerShop = request.headers.get("X-LGS-Shop");
      const cookieShop = readCookie(request.headers.get("Cookie") || "", "lgs_shop");
      const hintedShop = headerShop || cookieShop;
      if (hintedShop && hintedShop !== claims.shop) {
        throw new Response("Forbidden", { status: 403 });
      }
      const customerKey = normalizeCustomerKey(claims.customerKey ?? readCustomerKeyHint(request));
      return { shop: claims.shop, customerKey, isDevToken: false };
    } catch (err) {
      if (err instanceof Response) throw err;
      /* fall through to dev gate */
    }
  }

  const shop = assertTestAccess(request);
  return {
    shop,
    customerKey: readCustomerKeyHint(request),
    isDevToken: true,
  };
}

/** Dev test token or signed storefront session from app proxy bootstrap. */
export function assertCustomerApiAccess(request: Request): string {
  return assertCustomerApiContext(request).shop;
}

export function readCookie(cookieHeader: string, name: string): string | undefined {
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(name + "=")) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return undefined;
}
