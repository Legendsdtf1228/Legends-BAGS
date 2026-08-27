/** Resolve public app URL from SHOPIFY_APP_URL or Railway-injected domain. */
export function normalizeAppUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "");
    return `${url.origin}${url.pathname}`.replace(/\/$/, "") || url.origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

/** Resolve public app URL from SHOPIFY_APP_URL or Railway-injected domain. */
export function resolveAppUrl(): string {
  const explicit = process.env.SHOPIFY_APP_URL?.trim();
  if (explicit) return normalizeAppUrl(explicit);

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    const url = railwayDomain.startsWith("http")
      ? railwayDomain
      : `https://${railwayDomain}`;
    return normalizeAppUrl(url);
  }

  return "";
}

/** Set process.env.SHOPIFY_APP_URL when Railway provides a domain but the var was omitted. */
export function bootstrapAppUrlEnv(): void {
  if (process.env.SHOPIFY_APP_URL?.trim()) return;
  const resolved = resolveAppUrl();
  if (resolved) process.env.SHOPIFY_APP_URL = resolved;
}
