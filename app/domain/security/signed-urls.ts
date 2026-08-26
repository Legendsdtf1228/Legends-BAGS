import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 15;

export type SignedDownloadClaims = {
  shop: string;
  objectKey: string;
  exp: number; // unix seconds
};

function requireSecret(secret?: string): string {
  const s = secret ?? process.env.FILE_SIGNING_SECRET;
  if (!s || s.length < 16) {
    throw new Error("FILE_SIGNING_SECRET missing or too short");
  }
  return s;
}

function payload(claims: SignedDownloadClaims): string {
  return `${claims.shop}\n${claims.objectKey}\n${claims.exp}`;
}

export function signDownload(
  claims: Omit<SignedDownloadClaims, "exp"> & { ttlSeconds?: number },
  secret?: string,
): { token: string; exp: number } {
  const exp =
    Math.floor(Date.now() / 1000) + (claims.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const full: SignedDownloadClaims = {
    shop: claims.shop,
    objectKey: claims.objectKey,
    exp,
  };
  const sig = createHmac("sha256", requireSecret(secret))
    .update(payload(full))
    .digest("base64url");
  const token = Buffer.from(
    JSON.stringify({ ...full, sig }),
    "utf8",
  ).toString("base64url");
  return { token, exp };
}

export function verifyDownloadToken(
  token: string,
  secret?: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): SignedDownloadClaims {
  let parsed: SignedDownloadClaims & { sig: string };
  try {
    parsed = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8"),
    ) as SignedDownloadClaims & { sig: string };
  } catch {
    throw new Error("Invalid download signature");
  }

  if (
    !parsed?.shop ||
    !parsed?.objectKey ||
    typeof parsed.exp !== "number" ||
    !parsed.sig
  ) {
    throw new Error("Invalid download signature");
  }

  if (parsed.exp < nowSeconds) {
    throw new Error("Download signature expired");
  }

  const expected = createHmac("sha256", requireSecret(secret))
    .update(
      payload({
        shop: parsed.shop,
        objectKey: parsed.objectKey,
        exp: parsed.exp,
      }),
    )
    .digest("base64url");

  const a = Buffer.from(expected);
  const b = Buffer.from(parsed.sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid download signature");
  }

  return {
    shop: parsed.shop,
    objectKey: parsed.objectKey,
    exp: parsed.exp,
  };
}
