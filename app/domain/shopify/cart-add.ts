/** True for Shopify cart add form posts and Ajax `/cart/add.js`. */
export function isCartAddUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(String(url), "https://lgs-cart-add.invalid");
    return /\/cart\/add(?:\.js)?\/?$/i.test(parsed.pathname);
  } catch {
    return /\/cart\/add/i.test(String(url));
  }
}

/**
 * Merge Legends cart line properties into a Shopify `/cart/add` body.
 * Supports FormData, URLSearchParams, JSON, and application/x-www-form-urlencoded.
 */
export function mergeCartPropertiesIntoAddBody(
  body: unknown,
  properties: Record<string, string>,
): unknown {
  const keys = Object.keys(properties);
  if (!keys.length || body == null) return body;

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    for (const key of keys) {
      body.set(`properties[${key}]`, properties[key]);
    }
    return body;
  }

  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    for (const key of keys) {
      body.set(`properties[${key}]`, properties[key]);
    }
    return body;
  }

  if (typeof body === "string") {
    try {
      const json = JSON.parse(body) as Record<string, unknown>;
      if (json && typeof json === "object") {
        const existing =
          json.properties && typeof json.properties === "object"
            ? (json.properties as Record<string, string>)
            : {};
        json.properties = { ...existing, ...properties };
        return JSON.stringify(json);
      }
    } catch {
      const params = new URLSearchParams(body);
      for (const key of keys) {
        params.set(`properties[${key}]`, properties[key]);
      }
      return params.toString();
    }
  }

  if (typeof body === "object") {
    const rec = body as Record<string, unknown>;
    const existing =
      rec.properties && typeof rec.properties === "object"
        ? (rec.properties as Record<string, string>)
        : {};
    rec.properties = { ...existing, ...properties };
    return rec;
  }

  return body;
}
