import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24h for storefront guest access

export type DesignAccessClaims = {
  shop: string;
  designId: string;
  version?: number;
  exp: number;
};

function requireSecret(secret?: string): string {
  const s = secret ?? process.env.FILE_SIGNING_SECRET ?? process.env.TEST_API_TOKEN;
  if (!s || s.length < 16) {
    throw new Error("Design access signing secret missing or too short");
  }
  return s;
}

function payload(claims: DesignAccessClaims): string {
  return `${claims.shop}\n${claims.designId}\n${claims.version ?? ""}\n${claims.exp}`;
}

export function signDesignAccess(
  claims: Omit<DesignAccessClaims, "exp"> & { ttlSeconds?: number },
  secret?: string,
): { token: string; exp: number } {
  const exp =
    Math.floor(Date.now() / 1000) + (claims.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const full: DesignAccessClaims = {
    shop: claims.shop,
    designId: claims.designId,
    version: claims.version,
    exp,
  };
  const sig = createHmac("sha256", requireSecret(secret))
    .update(payload(full))
    .digest("base64url");
  const token = Buffer.from(JSON.stringify({ ...full, sig }), "utf8").toString(
    "base64url",
  );
  return { token, exp };
}

export function verifyDesignAccessToken(
  token: string,
  secret?: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): DesignAccessClaims {
  let parsed: DesignAccessClaims & { sig: string };
  try {
    parsed = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8"),
    ) as DesignAccessClaims & { sig: string };
  } catch {
    throw new Error("Invalid design access token");
  }

  if (!parsed?.shop || !parsed?.designId || typeof parsed.exp !== "number" || !parsed.sig) {
    throw new Error("Invalid design access token");
  }
  if (parsed.exp < nowSeconds) {
    throw new Error("Design access token expired");
  }

  const expected = createHmac("sha256", requireSecret(secret))
    .update(
      payload({
        shop: parsed.shop,
        designId: parsed.designId,
        version: parsed.version,
        exp: parsed.exp,
      }),
    )
    .digest("base64url");

  const a = Buffer.from(expected);
  const b = Buffer.from(parsed.sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid design access token");
  }

  return {
    shop: parsed.shop,
    designId: parsed.designId,
    version: parsed.version,
    exp: parsed.exp,
  };
}

export type PriceRefClaims = {
  shop: string;
  designId: string;
  version: number;
  priceCents: number;
  exp: number;
};

function pricePayload(claims: PriceRefClaims): string {
  return `${claims.shop}\n${claims.designId}\n${claims.version}\n${claims.priceCents}\n${claims.exp}`;
}

export function signPriceRef(
  claims: Omit<PriceRefClaims, "exp"> & { ttlSeconds?: number },
  secret?: string,
): string {
  const exp =
    Math.floor(Date.now() / 1000) + (claims.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const full: PriceRefClaims = { ...claims, exp };
  const sig = createHmac("sha256", requireSecret(secret))
    .update(pricePayload(full))
    .digest("base64url");
  return Buffer.from(JSON.stringify({ ...full, sig }), "utf8").toString("base64url");
}

export function verifyPriceRef(
  token: string,
  secret?: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): PriceRefClaims {
  let parsed: PriceRefClaims & { sig: string };
  try {
    parsed = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8"),
    ) as PriceRefClaims & { sig: string };
  } catch {
    throw new Error("Invalid price reference");
  }
  if (
    !parsed?.shop ||
    !parsed?.designId ||
    typeof parsed.version !== "number" ||
    typeof parsed.priceCents !== "number" ||
    typeof parsed.exp !== "number" ||
    !parsed.sig
  ) {
    throw new Error("Invalid price reference");
  }
  if (parsed.exp < nowSeconds) throw new Error("Price reference expired");

  const expected = createHmac("sha256", requireSecret(secret))
    .update(pricePayload(parsed))
    .digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(parsed.sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid price reference");
  }
  return parsed;
}
