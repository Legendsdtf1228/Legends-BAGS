/** Resolve public app URL from SHOPIFY_APP_URL or Railway-injected domain. */
export function resolveAppUrl(): string {
  const explicit = process.env.SHOPIFY_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    const url = railwayDomain.startsWith("http")
      ? railwayDomain
      : `https://${railwayDomain}`;
    return url.replace(/\/$/, "");
  }

  return "";
}

/** Set process.env.SHOPIFY_APP_URL when Railway provides a domain but the var was omitted. */
export function bootstrapAppUrlEnv(): void {
  if (process.env.SHOPIFY_APP_URL?.trim()) return;
  const resolved = resolveAppUrl();
  if (resolved) process.env.SHOPIFY_APP_URL = resolved;
}
