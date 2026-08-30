import {
  signStorefrontSession,
  STOREFRONT_SESSION_COOKIE,
  verifyStorefrontSession,
  type StorefrontSessionClaims,
} from "../domain/security/storefront-access";
import {
  CUSTOMER_KEY_COOKIE,
  normalizeCustomerKey,
} from "../domain/security/customer-key";

const COOKIE_BASE = "Path=/; SameSite=None; Secure; HttpOnly";

/** Set editor API cookies from storefront session query param or dev test token. */
export function buildEditorAuthHeaders(request: Request, shop: string): {
  headers: Headers;
  hasApiAuth: boolean;
} {
  const headers = new Headers();
  const url = new URL(request.url);
  const sessionParam = url.searchParams.get("lgs_session")?.trim();
  const customerKey = normalizeCustomerKey(url.searchParams.get("lgs_customer_key"));

  if (sessionParam && shop) {
    try {
      const claims = verifyStorefrontSession(sessionParam);
      if (claims.shop === shop) {
        headers.append(
          "Set-Cookie",
          `${STOREFRONT_SESSION_COOKIE}=${encodeURIComponent(sessionParam)}; ${COOKIE_BASE}`,
        );
        headers.append("Set-Cookie", `lgs_shop=${encodeURIComponent(shop)}; ${COOKIE_BASE}`);
        const resolvedCustomerKey = normalizeCustomerKey(claims.customerKey ?? customerKey);
        if (resolvedCustomerKey) {
          headers.append(
            "Set-Cookie",
            `${CUSTOMER_KEY_COOKIE}=${encodeURIComponent(resolvedCustomerKey)}; ${COOKIE_BASE}`,
          );
        }
        return { headers, hasApiAuth: true };
      }
    } catch {
      /* fall through to dev token */
    }
  }

  const testToken = process.env.TEST_API_TOKEN || "";
  if (testToken && shop) {
    headers.append("Set-Cookie", `lgs_shop=${encodeURIComponent(shop)}; ${COOKIE_BASE}`);
    headers.append(
      "Set-Cookie",
      `lgs_test_token=${encodeURIComponent(testToken)}; ${COOKIE_BASE}`,
    );
    if (customerKey) {
      headers.append(
        "Set-Cookie",
        `${CUSTOMER_KEY_COOKIE}=${encodeURIComponent(customerKey)}; ${COOKIE_BASE}`,
      );
    }
    return { headers, hasApiAuth: true };
  }

  return { headers, hasApiAuth: false };
}

/** Read verified storefront session claims from URL param or cookie. */
export function readStorefrontSessionClaims(request: Request): StorefrontSessionClaims | null {
  const url = new URL(request.url);
  const sessionParam =
    url.searchParams.get("lgs_session")?.trim() ||
    parseCookieValue(request.headers.get("Cookie"), STOREFRONT_SESSION_COOKIE);
  if (!sessionParam) return null;
  try {
    return verifyStorefrontSession(sessionParam);
  } catch {
    return null;
  }
}

function parseCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/** Issue session JSON payload for app proxy /session endpoint. */
export function createStorefrontSessionResponse(
  shop: string,
  customerKey?: string | null,
  customer?: { customerName?: string | null; customerEmail?: string | null },
) {
  const normalized = normalizeCustomerKey(customerKey);
  const { token, exp } = signStorefrontSession(shop, {
    customerKey: normalized,
    customerName: customer?.customerName,
    customerEmail: customer?.customerEmail,
  });
  return Response.json({
    shop,
    sessionToken: token,
    expiresAt: exp,
    customerKey: normalized,
    customerName: customer?.customerName?.trim() || null,
    customerEmail: customer?.customerEmail?.trim() || null,
  });
}
