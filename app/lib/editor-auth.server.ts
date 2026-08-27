import {
  signStorefrontSession,
  STOREFRONT_SESSION_COOKIE,
  verifyStorefrontSession,
} from "../domain/security/storefront-access";

const COOKIE_BASE = "Path=/; SameSite=None; Secure; HttpOnly";

/** Set editor API cookies from storefront session query param or dev test token. */
export function buildEditorAuthHeaders(request: Request, shop: string): {
  headers: Headers;
  hasApiAuth: boolean;
} {
  const headers = new Headers();
  const url = new URL(request.url);
  const sessionParam = url.searchParams.get("lgs_session")?.trim();

  if (sessionParam && shop) {
    try {
      const claims = verifyStorefrontSession(sessionParam);
      if (claims.shop === shop) {
        headers.append(
          "Set-Cookie",
          `${STOREFRONT_SESSION_COOKIE}=${encodeURIComponent(sessionParam)}; ${COOKIE_BASE}`,
        );
        headers.append("Set-Cookie", `lgs_shop=${encodeURIComponent(shop)}; ${COOKIE_BASE}`);
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
    return { headers, hasApiAuth: true };
  }

  return { headers, hasApiAuth: false };
}

/** Issue session JSON payload for app proxy /session endpoint. */
export function createStorefrontSessionResponse(shop: string) {
  const { token, exp } = signStorefrontSession(shop);
  return Response.json({
    shop,
    sessionToken: token,
    expiresAt: exp,
  });
}
