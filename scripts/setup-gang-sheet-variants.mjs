/**
 * Provisions 13 BAGS-style gang sheet height variants on the dev gang sheet product
 * and creates ProductBinding rows (one per variant).
 *
 * Run after setup-dev-store.mjs and with an offline Admin session installed.
 */
import { PrismaClient } from "@prisma/client";

const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const API = `https://${shop}/admin/api/2025-10/graphql.json`;
const HANDLE = process.env.GANG_SHEET_HANDLE || "lgs-dev-gang-sheet-test";

/** Height (in) → fixed price (USD) matching BAGS demo catalog ($17–$195). */
const CATALOG = [
  [24, 17],
  [36, 25],
  [48, 33],
  [60, 41],
  [72, 49],
  [84, 57],
  [96, 65],
  [108, 73],
  [132, 89],
  [150, 101],
  [168, 113],
  [192, 129],
  [250, 195],
];

async function gql(token, query, variables) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

function optionLabel(heightIn) {
  return `${heightIn} in`;
}

async function findProduct(token) {
  const data = await gql(
    token,
    `query($q: String!) {
      products(first: 1, query: $q) {
        nodes {
          id
          title
          handle
          options { id name }
          variants(first: 50) {
            nodes {
              id
              title
              price
              selectedOptions { name value }
            }
          }
        }
      }
    }`,
    { q: `handle:${HANDLE}` },
  );
  return data.products?.nodes?.[0] ?? null;
}

async function ensureHeightOption(token, product) {
  const hasHeight = product.options?.some((o) => o.name === "Height");
  if (hasHeight) return product;

  const optionValues = CATALOG.map(([h]) => ({ name: optionLabel(h) }));
  const updated = await gql(
    token,
    `mutation($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          options { id name }
          variants(first: 50) {
            nodes {
              id
              title
              price
              selectedOptions { name value }
            }
          }
        }
        userErrors { field message }
      }
    }`,
    {
      product: {
        id: product.id,
        productOptions: [{ name: "Height", values: optionValues }],
      },
    },
  );
  const next = updated.productUpdate?.product;
  const errs = updated.productUpdate?.userErrors;
  if (errs?.length) throw new Error(JSON.stringify(errs));
  if (!next) throw new Error("productUpdate did not return product");
  return next;
}

async function syncVariantPrices(token, product) {
  const byHeight = new Map(
    product.variants.nodes.map((v) => {
      const heightOpt = v.selectedOptions?.find((o) => o.name === "Height");
      const height = heightOpt ? Number.parseFloat(heightOpt.value) : NaN;
      return [height, v];
    }),
  );

  const missing = CATALOG.filter(([h]) => !byHeight.has(h));
  if (missing.length) {
    const create = await gql(
      token,
      `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
          productVariants { id selectedOptions { name value } price }
          userErrors { field message }
        }
      }`,
      {
        productId: product.id,
        variants: missing.map(([h, price]) => ({
          price: price.toFixed(2),
          optionValues: [{ optionName: "Height", name: optionLabel(h) }],
        })),
      },
    );
    const errs = create.productVariantsBulkCreate?.userErrors;
    if (errs?.length) throw new Error(JSON.stringify(errs));
    product = await findProduct(token);
  }

  const updates = [];
  for (const [h, price] of CATALOG) {
    const variant = product.variants.nodes.find((v) => {
      const opt = v.selectedOptions?.find((o) => o.name === "Height");
      return opt && Number.parseFloat(opt.value) === h;
    });
    if (variant && variant.price !== price.toFixed(2)) {
      updates.push({ id: variant.id, price: price.toFixed(2) });
    }
  }
  if (updates.length) {
    await gql(
      token,
      `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { field message }
        }
      }`,
      { productId: product.id, variants: updates },
    );
    product = await findProduct(token);
  }
  return product;
}

async function syncBindings(prisma, product) {
  for (const [heightIn, priceUsd] of CATALOG) {
    const variant = product.variants.nodes.find((v) => {
      const opt = v.selectedOptions?.find((o) => o.name === "Height");
      return opt && Number.parseFloat(opt.value) === heightIn;
    });
    if (!variant?.id) {
      console.warn(`No variant for ${heightIn} in — skipping binding`);
      continue;
    }
    await prisma.productBinding.upsert({
      where: { shop_variantGid: { shop, variantGid: variant.id } },
      create: {
        shop,
        productGid: product.id,
        variantGid: variant.id,
        builderType: "gang_sheet",
        sheetWidthIn: 22.5,
        maxHeightIn: heightIn,
        sheetHeightIn: heightIn,
        variantPriceCents: Math.round(priceUsd * 100),
      },
      update: {
        productGid: product.id,
        builderType: "gang_sheet",
        sheetWidthIn: 22.5,
        maxHeightIn: heightIn,
        sheetHeightIn: heightIn,
        variantPriceCents: Math.round(priceUsd * 100),
      },
    });
  }
}

async function main() {
  const prisma = new PrismaClient();
  const session = await prisma.session.findFirst({
    where: { shop },
    orderBy: { id: "asc" },
  });
  if (!session?.accessToken) {
    console.error("No Admin session — open Legends BAGS Dev from Shopify Admin first.");
    process.exit(1);
  }

  let product = await findProduct(session.accessToken);
  if (!product) {
    console.error(`Product handle:${HANDLE} not found — run setup-dev-store.mjs first.`);
    process.exit(1);
  }

  product = await ensureHeightOption(session.accessToken, product);
  product = await syncVariantPrices(session.accessToken, product);
  await syncBindings(prisma, product);

  await prisma.$disconnect();
  console.log(
    JSON.stringify(
      {
        ok: true,
        shop,
        productGid: product.id,
        handle: product.handle,
        variantCount: product.variants.nodes.length,
        bindings: CATALOG.length,
        adminUrl: `https://${shop}/admin/products/${String(product.id).split("/").pop()}`,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
