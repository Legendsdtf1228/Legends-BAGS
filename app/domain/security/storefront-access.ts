import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60; // 1h editor session

export type StorefrontSessionClaims = {
  shop: string;
  exp: number;
  customerKey?: string | null;
};

export const STOREFRONT_SESSION_COOKIE = "lgs_storefront_session";
export const STOREFRONT_SESSION_HEADER = "X-LGS-Storefront-Session";

function requireSecret(secret?: string): string {
  const s = secret ?? process.env.FILE_SIGNING_SECRET ?? process.env.TEST_API_TOKEN;
  if (!s || s.length < 16) {
    throw new Error("Storefront session signing secret missing or too short");
  }
  return s;
}

function sessionPayload(claims: StorefrontSessionClaims): string {
  return `${claims.shop}\n${claims.exp}\n${claims.customerKey ?? ""}`;
}

/** Issue a short-lived HMAC session for storefront editor API calls. */
export function signStorefrontSession(
  shop: string,
  options?: { ttlSeconds?: number; secret?: string; customerKey?: string | null },
): { token: string; exp: number } {
  const exp =
    Math.floor(Date.now() / 1000) + (options?.ttlSeconds ?? DEFAULT_SESSION_TTL_SECONDS);
  const claims: StorefrontSessionClaims = {
    shop,
    exp,
    customerKey: options?.customerKey ?? null,
  };
  const sig = createHmac("sha256", requireSecret(options?.secret))
    .update(sessionPayload(claims))
    .digest("base64url");
  const token = Buffer.from(JSON.stringify({ ...claims, sig }), "utf8").toString("base64url");
  return { token, exp };
}

export function verifyStorefrontSession(
  token: string,
  secret?: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): StorefrontSessionClaims {
  let parsed: StorefrontSessionClaims & { sig: string };
  try {
    parsed = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8"),
    ) as StorefrontSessionClaims & { sig: string };
  } catch {
    throw new Error("Invalid storefront session");
  }

  if (!parsed?.shop || typeof parsed.exp !== "number" || !parsed.sig) {
    throw new Error("Invalid storefront session");
  }
  if (parsed.exp < nowSeconds) {
    throw new Error("Storefront session expired");
  }

  const expected = createHmac("sha256", requireSecret(secret))
    .update(
      sessionPayload({
        shop: parsed.shop,
        exp: parsed.exp,
        customerKey: parsed.customerKey ?? null,
      }),
    )
    .digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(parsed.sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid storefront session");
  }

  return {
    shop: parsed.shop,
    exp: parsed.exp,
    customerKey: parsed.customerKey ?? null,
  };
}

export type AppProxyRoute =
  | { kind: "storefront-config" }
  | { kind: "session" }
  | { kind: "builder" }
  | { kind: "launcher-script" }
  | { kind: "design"; designId: string };

/** Parse splat path from /apps/legends-bags/* proxy route. */
export function parseAppProxyPath(path: string): AppProxyRoute | null {
  const normalized = path.replace(/\/$/, "");
  if (normalized === "storefront-config") return { kind: "storefront-config" };
  if (normalized === "session") return { kind: "session" };
  if (normalized === "builder") return { kind: "builder" };
  if (normalized === "lgs-launcher.full.js") return { kind: "launcher-script" };
  const designMatch = /^designs\/([^/]+)$/.exec(normalized);
  if (designMatch) return { kind: "design", designId: decodeURIComponent(designMatch[1]) };
  return null;
}
