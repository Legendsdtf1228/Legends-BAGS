import prisma from "../db.server";
import type { authenticate } from "../shopify.server";

type AdminClient = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

export type ShopifyCatalogProduct = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  imageUrl?: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    updatedAt: string;
  }>;
};

const PRODUCTS_PAGE = `#graphql
  query LegendsBagsProducts($cursor: String, $query: String) {
    products(first: 50, after: $cursor, query: $query, sortKey: UPDATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        status
        updatedAt
        featuredImage {
          url
        }
        variants(first: 100) {
          nodes {
            id
            title
            price
            updatedAt
          }
        }
      }
    }
  }
`;

function mapProduct(node: {
  id: string;
  title: string;
  handle: string;
  status: string;
  updatedAt: string;
  featuredImage?: { url?: string | null } | null;
  variants: { nodes: Array<{ id: string; title: string; price: string; updatedAt: string }> };
}): ShopifyCatalogProduct {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    status: node.status,
    updatedAt: node.updatedAt,
    imageUrl: node.featuredImage?.url ?? undefined,
    variants: node.variants.nodes.map((v) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      updatedAt: v.updatedAt,
    })),
  };
}

export async function fetchShopifyCatalog(
  admin: AdminClient,
  options?: { query?: string; maxPages?: number },
): Promise<ShopifyCatalogProduct[]> {
  const products: ShopifyCatalogProduct[] = [];
  let cursor: string | null = null;
  let pages = 0;
  const maxPages = options?.maxPages ?? 20;

  while (pages < maxPages) {
    const res: Response = await admin.graphql(PRODUCTS_PAGE, {
      variables: { cursor, query: options?.query ?? null },
    });
    const json = (await res.json()) as {
      data?: {
        products?: {
          nodes?: Array<Parameters<typeof mapProduct>[0]>;
          pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
        };
      };
    };
    const connection = json.data?.products;
    if (!connection) break;

    for (const node of connection.nodes ?? []) {
      products.push(mapProduct(node));
    }

    if (!connection.pageInfo?.hasNextPage) break;
    cursor = connection.pageInfo.endCursor ?? null;
    pages += 1;
  }

  return products;
}

const PRODUCT_VARIANTS = `#graphql
  query LegendsBagsProductVariants($id: ID!) {
    product(id: $id) {
      id
      title
      variants(first: 100) {
        nodes {
          id
          title
          price
        }
      }
    }
  }
`;

export async function fetchShopifyProductVariants(
  admin: AdminClient,
  productGid: string,
): Promise<Array<{ id: string; title: string; price: string }>> {
  const res = await admin.graphql(PRODUCT_VARIANTS, { variables: { id: productGid } });
  const json = (await res.json()) as {
    data?: {
      product?: {
        variants?: { nodes?: Array<{ id: string; title: string; price: string }> };
      };
    };
    errors?: Array<{ message: string }>;
  };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data?.product?.variants?.nodes ?? [];
}

function normalizeVariantGid(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("gid://") ? trimmed : `gid://shopify/ProductVariant/${trimmed}`;
}

export async function resolveVariantGidForBinding(params: {
  admin: AdminClient;
  productGid: string;
  variantGidRaw?: string;
}): Promise<{ variantGid: string; variantTitle?: string; variantCount: number }> {
  const explicit = params.variantGidRaw ? normalizeVariantGid(params.variantGidRaw) : "";
  if (explicit) {
    const variants = await fetchShopifyProductVariants(params.admin, params.productGid);
    const match = variants.find((v) => v.id === explicit);
    return {
      variantGid: explicit,
      variantTitle: match?.title,
      variantCount: variants.length,
    };
  }

  const variants = await fetchShopifyProductVariants(params.admin, params.productGid);
  if (variants.length === 1) {
    return {
      variantGid: variants[0].id,
      variantTitle: variants[0].title,
      variantCount: 1,
    };
  }
  if (variants.length === 0) {
    throw new Error("This product has no variants.");
  }
  throw new Error("Select a variant — this product has multiple variants.");
}

export async function reconcileProductBindings(params: {
  shop: string;
  admin: AdminClient;
}) {
  const catalog = await fetchShopifyCatalog(params.admin);
  const byProductGid = new Map(catalog.map((p) => [p.id, p]));
  const bindings = await prisma.productBinding.findMany({ where: { shop: params.shop } });

  let updated = 0;
  let missing = 0;

  for (const binding of bindings) {
    const product = byProductGid.get(binding.productGid);
    if (!product) {
      await prisma.productBinding.update({
        where: { id: binding.id },
        data: { syncStatus: "missing", productStatus: "DELETED" },
      });
      missing += 1;
      continue;
    }

    const variant = binding.variantGid
      ? product.variants.find((v) => v.id === binding.variantGid)
      : undefined;

    await prisma.productBinding.update({
      where: { id: binding.id },
      data: {
        productTitle: product.title,
        productStatus: product.status,
        productImageUrl: product.imageUrl,
        variantTitle: variant?.title,
        shopifyUpdatedAt: new Date(product.updatedAt),
        syncStatus: "synced",
      },
    });
    updated += 1;
  }

  await prisma.shopConfig.upsert({
    where: { shop: params.shop },
    create: { shop: params.shop, lastProductSyncAt: new Date(), lastProductSyncError: null },
    update: { lastProductSyncAt: new Date(), lastProductSyncError: null },
  });

  return { updated, missing, catalogCount: catalog.length };
}

export async function applyShopifyProductWebhook(params: {
  shop: string;
  topic: string;
  payload: {
    id?: number | string;
    admin_graphql_api_id?: string;
    title?: string;
    status?: string;
    updated_at?: string;
    image?: { src?: string | null } | null;
    variants?: Array<{
      admin_graphql_api_id?: string;
      id?: number | string;
      title?: string;
    }>;
  };
}) {
  const productGid =
    params.payload.admin_graphql_api_id ??
    (params.payload.id != null ? `gid://shopify/Product/${params.payload.id}` : undefined);
  if (!productGid) return { ignored: true as const };

  if (params.topic === "products/delete") {
    await prisma.productBinding.updateMany({
      where: { shop: params.shop, productGid },
      data: { syncStatus: "missing", productStatus: "DELETED" },
    });
    return { deleted: true as const };
  }

  const bindings = await prisma.productBinding.findMany({
    where: { shop: params.shop, productGid },
  });
  if (!bindings.length) return { ignored: true as const };

  const variantTitleByGid = new Map<string, string>();
  for (const variant of params.payload.variants ?? []) {
    const gid =
      variant.admin_graphql_api_id ??
      (variant.id != null ? `gid://shopify/ProductVariant/${variant.id}` : undefined);
    if (gid && variant.title) variantTitleByGid.set(gid, variant.title);
  }

  for (const binding of bindings) {
    await prisma.productBinding.update({
      where: { id: binding.id },
      data: {
        productTitle: params.payload.title,
        productStatus: params.payload.status,
        productImageUrl: params.payload.image?.src ?? undefined,
        variantTitle: binding.variantGid
          ? variantTitleByGid.get(binding.variantGid) ?? binding.variantTitle
          : binding.variantTitle,
        shopifyUpdatedAt: params.payload.updated_at
          ? new Date(params.payload.updated_at)
          : undefined,
        syncStatus: "synced",
      },
    });
  }

  return { updated: bindings.length };
}
