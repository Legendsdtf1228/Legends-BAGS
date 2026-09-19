export const CART_EDIT_DESIGN_ID_PARAM = "lgs_design_id" as const;
export const CART_EDIT_DESIGN_VERSION_PARAM = "lgs_design_version" as const;
export const CART_EDIT_TOKEN_PARAM = "lgs_token" as const;
export const CART_EDIT_OPEN_PARAM = "lgs_open" as const;

/**
 * Product-page URL that hydrates the theme launcher and reopens the saved design.
 * Preserves an existing `?variant=` query on Shopify `item.url`.
 */
export function buildCartEditUrl(params: {
  productUrl: string;
  designId: string;
  version?: string | number;
  token?: string | null;
  openEditor?: boolean;
}): string {
  const raw = params.productUrl.trim();
  if (!raw || !params.designId.trim()) return raw;

  const absolute = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  const url = new URL(raw, "https://lgs-cart-edit.invalid");
  url.searchParams.set(CART_EDIT_DESIGN_ID_PARAM, params.designId);
  url.searchParams.set(CART_EDIT_DESIGN_VERSION_PARAM, String(params.version ?? 1));
  if (params.token?.trim()) {
    url.searchParams.set(CART_EDIT_TOKEN_PARAM, params.token.trim());
  }
  if (params.openEditor !== false) {
    url.searchParams.set(CART_EDIT_OPEN_PARAM, "1");
  }

  if (absolute) return url.toString();
  return `${url.pathname}${url.search}${url.hash}`;
}
