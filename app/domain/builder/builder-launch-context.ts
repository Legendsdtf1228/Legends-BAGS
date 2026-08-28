export type BuilderType = "gang_sheet" | "upload_by_size";

export type BuilderLaunchContext = {
  shop: string;
  productId: string;
  productGid: string;
  variantId?: string;
  variantGid?: string;
  quantity: number;
  shopMode?: string;
  builderType: BuilderType;
};

export type BuilderLaunchQuery = {
  shop?: string | null;
  product?: string | null;
  variant?: string | null;
  quantity?: string | null;
  shop_mode?: string | null;
  /** Internal redirect params (preserved from /builder → editor). */
  productGid?: string | null;
  variantId?: string | null;
  variantGid?: string | null;
  shopMode?: string | null;
};

export type BuilderLaunchParseError = {
  ok: false;
  code:
    | "missing_shop"
    | "invalid_shop"
    | "shop_not_allowed"
    | "missing_product"
    | "invalid_product"
    | "invalid_variant"
    | "invalid_quantity";
  message: string;
};

export type BuilderLaunchParseResult =
  | { ok: true; input: Omit<BuilderLaunchContext, "builderType"> }
  | BuilderLaunchParseError;

const MYShopifySuffix = ".myshopify.com";

export function isMyshopifyDomain(shop: string): boolean {
  const normalized = shop.trim().toLowerCase();
  return normalized.endsWith(MYShopifySuffix) && normalized.length > MYShopifySuffix.length;
}

export function normalizeShopDomain(shop: string): string {
  return shop.trim().toLowerCase();
}

export function assertDevShopAllowed(shop: string): BuilderLaunchParseError | null {
  const allowed = process.env.DEV_SHOP?.trim().toLowerCase();
  if (!allowed) {
    return {
      ok: false,
      code: "shop_not_allowed",
      message: "This environment is not configured for storefront builder access yet.",
    };
  }
  if (normalizeShopDomain(shop) !== allowed.toLowerCase()) {
    return {
      ok: false,
      code: "shop_not_allowed",
      message: "This builder is only available on the configured development store.",
    };
  }
  return null;
}

export function toProductGid(productId: string): string {
  const id = productId.trim();
  if (id.startsWith("gid://shopify/Product/")) return id;
  return `gid://shopify/Product/${id.replace(/\D/g, "")}`;
}

export function toVariantGid(variantId: string): string | undefined {
  const id = variantId.trim();
  if (!id) return undefined;
  if (id.startsWith("gid://shopify/ProductVariant/")) return id;
  const numeric = id.replace(/\D/g, "");
  if (!numeric) return undefined;
  return `gid://shopify/ProductVariant/${numeric}`;
}

export function numericIdFromGid(gid: string | undefined | null): string | undefined {
  if (!gid) return undefined;
  const match = gid.match(/(\d+)$/);
  return match?.[1];
}

function parseQuantity(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return 1;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) return null;
  return n;
}

function parseProductId(input: BuilderLaunchQuery): string | null {
  if (input.product?.trim()) return input.product.trim().replace(/\D/g, "");
  const fromGid = numericIdFromGid(input.productGid ?? undefined);
  return fromGid ?? null;
}

function parseVariantId(input: BuilderLaunchQuery): string | undefined {
  if (input.variant?.trim()) {
    const numeric = input.variant.trim().replace(/\D/g, "");
    return numeric || undefined;
  }
  if (input.variantId?.trim()) {
    const numeric = input.variantId.trim().replace(/\D/g, "");
    return numeric || undefined;
  }
  const fromGid = numericIdFromGid(input.variantGid ?? undefined);
  return fromGid;
}

/** Parse BAGS-style `/builder` query parameters. */
export function parseBuilderLaunchQuery(input: BuilderLaunchQuery): BuilderLaunchParseResult {
  const shopRaw = input.shop?.trim();
  if (!shopRaw) {
    return { ok: false, code: "missing_shop", message: "A shop domain is required to open the builder." };
  }
  if (!isMyshopifyDomain(shopRaw)) {
    return {
      ok: false,
      code: "invalid_shop",
      message: "The shop domain must be a valid myshopify.com store address.",
    };
  }

  const shopRestriction = assertDevShopAllowed(shopRaw);
  if (shopRestriction) return shopRestriction;

  const productId = parseProductId(input);
  if (!productId) {
    return {
      ok: false,
      code: "missing_product",
      message: "A product ID is required to open the builder.",
    };
  }

  const variantRaw = input.variant ?? input.variantId ?? "";
  if (variantRaw.trim() && !variantRaw.replace(/\D/g, "")) {
    return {
      ok: false,
      code: "invalid_variant",
      message: "The variant ID is not valid.",
    };
  }

  const quantity = parseQuantity(input.quantity);
  if (quantity == null) {
    return {
      ok: false,
      code: "invalid_quantity",
      message: "Quantity must be a whole number of at least 1.",
    };
  }

  const variantId = parseVariantId(input);
  const productGid = toProductGid(productId);
  const variantGid = variantId ? toVariantGid(variantId) : undefined;
  const shopMode = (input.shop_mode ?? input.shopMode)?.trim() || undefined;

  return {
    ok: true,
    input: {
      shop: normalizeShopDomain(shopRaw),
      productId,
      productGid,
      variantId,
      variantGid,
      quantity,
      shopMode,
    },
  };
}

export function builderTypeFromBinding(raw: string | null | undefined): BuilderType | null {
  if (raw === "gang_sheet" || raw === "upload_by_size") return raw;
  return null;
}

export function editorPathForBuilderType(builderType: BuilderType): string {
  return builderType === "gang_sheet" ? "/editor/gang-sheet" : "/editor/upload-by-size";
}

export type EditorLaunchPassthrough = {
  embedded?: string | null;
  parentOrigin?: string | null;
  lgs_session?: string | null;
  lgs_customer_key?: string | null;
  lgs_customer_name?: string | null;
  lgs_customer_email?: string | null;
  designId?: string | null;
  designVersion?: string | null;
};

/** Build editor URL from resolved launch context (server or client). */
export function buildEditorLaunchUrl(
  baseUrl: string,
  context: BuilderLaunchContext,
  passthrough: EditorLaunchPassthrough = {},
): string {
  const base = baseUrl.replace(/\/$/, "");
  const path = editorPathForBuilderType(context.builderType);
  const url = new URL(path, base.endsWith("/") ? base : `${base}/`);

  url.searchParams.set("shop", context.shop);
  url.searchParams.set("productGid", context.productGid);
  url.searchParams.set("product", context.productId);
  if (context.variantId) url.searchParams.set("variantId", context.variantId);
  if (context.variantId) url.searchParams.set("variant", context.variantId);
  url.searchParams.set("quantity", String(context.quantity));
  if (context.shopMode) url.searchParams.set("shop_mode", context.shopMode);

  if (passthrough.embedded) url.searchParams.set("embedded", passthrough.embedded);
  if (passthrough.parentOrigin) url.searchParams.set("parentOrigin", passthrough.parentOrigin);
  if (passthrough.lgs_session) url.searchParams.set("lgs_session", passthrough.lgs_session);
  if (passthrough.lgs_customer_key) {
    url.searchParams.set("lgs_customer_key", passthrough.lgs_customer_key);
  }
  if (passthrough.lgs_customer_name) {
    url.searchParams.set("lgs_customer_name", passthrough.lgs_customer_name);
  }
  if (passthrough.lgs_customer_email) {
    url.searchParams.set("lgs_customer_email", passthrough.lgs_customer_email);
  }
  if (passthrough.designId) url.searchParams.set("designId", passthrough.designId);
  if (passthrough.designVersion) url.searchParams.set("designVersion", passthrough.designVersion);

  return url.toString();
}

/** Parse editor URL search params into launch context fields (without builderType). */
export function parseEditorLaunchParams(searchParams: URLSearchParams): Omit<BuilderLaunchContext, "builderType"> | null {
  const parsed = parseBuilderLaunchQuery({
    shop: searchParams.get("shop"),
    product: searchParams.get("product"),
    variant: searchParams.get("variant"),
    quantity: searchParams.get("quantity"),
    shop_mode: searchParams.get("shop_mode"),
    productGid: searchParams.get("productGid"),
    variantId: searchParams.get("variantId"),
  });
  if (!parsed.ok) return null;
  return parsed.input;
}
