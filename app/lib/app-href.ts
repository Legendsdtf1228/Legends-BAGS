/** Client-safe app href helpers. Do not import process.env here. */

const ABSOLUTE_HTTP = /^https?:\/\//i;

export function isAbsoluteHttpUrl(value: string): boolean {
  return ABSOLUTE_HTTP.test(value.trim());
}

/**
 * Normalize a configured app base so `new URL(path, base)` never receives a
 * scheme-less hostname (Railway domain, HOST=0.0.0.0) or a relative path.
 * Returns "" when the caller should emit an application-relative path instead.
 */
export function resolveHrefBase(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  if (ABSOLUTE_HTTP.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/\/+$/, "");
      return `${url.origin}${path}` || url.origin;
    } catch {
      return "";
    }
  }

  if (trimmed.startsWith("//")) {
    try {
      return new URL(`https:${trimmed}`).origin;
    } catch {
      return "";
    }
  }

  // Application-relative path — not a valid URL() base.
  if (trimmed.startsWith("/")) return "";

  try {
    const url = new URL(`https://${trimmed}`);
    if (!url.hostname) return "";
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${path}` || url.origin;
  } catch {
    return "";
  }
}

export function joinAppHref(
  path: string,
  baseUrl?: string | null,
  searchParams?: Record<string, string | null | undefined>,
): string {
  const trimmedPath = path.trim();
  if (isAbsoluteHttpUrl(trimmedPath)) {
    const url = new URL(trimmedPath);
    applySearchParams(url, searchParams);
    return url.toString();
  }

  const normalizedPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  const base = resolveHrefBase(baseUrl);
  const url = base
    ? new URL(normalizedPath, base.endsWith("/") ? base : `${base}/`)
    : new URL(normalizedPath, "https://app.invalid");

  applySearchParams(url, searchParams);
  if (!base) return `${url.pathname}${url.search}`;
  return url.toString();
}

/** Staff Shop Builder sheets — Gang Sheet Studio via the BAGS bridge, not the legacy canvas. */
export function staffSheetEditorUrl(params: {
  appUrl?: string | null;
  shop: string;
  designId: string;
}): string {
  return joinAppHref("/editor/studio", params.appUrl, {
    shop: params.shop,
    designId: params.designId,
    embedded: "1",
    shop_mode: "merchant",
    context: "merchant-preview",
  });
}

function numericIdFromGid(gid: string | null | undefined): string | undefined {
  if (!gid) return undefined;
  const match = gid.match(/(\d+)$/);
  return match?.[1];
}

/**
 * Merchant Products / Gangsheet Builder Open/Preview.
 * gang_sheet → /editor/studio (GSS). upload_by_size stays on the UBS editor.
 */
export function merchantProductBuilderUrl(params: {
  appUrl?: string | null;
  shop: string;
  builderType: string;
  productGid: string;
  variantGid?: string | null;
}): string {
  const productId = numericIdFromGid(params.productGid);
  const variantId = numericIdFromGid(params.variantGid);
  const path = params.builderType === "gang_sheet" ? "/editor/studio" : "/editor/upload-by-size";
  return joinAppHref(path, params.appUrl, {
    shop: params.shop,
    product: productId,
    productGid: params.productGid,
    variant: variantId,
    variantId,
    quantity: "1",
    shop_mode: "merchant",
    context: "merchant-preview",
  });
}

function applySearchParams(
  url: URL,
  searchParams?: Record<string, string | null | undefined>,
) {
  if (!searchParams) return;
  for (const [key, value] of Object.entries(searchParams)) {
    if (value != null && value !== "") url.searchParams.set(key, value);
  }
}
