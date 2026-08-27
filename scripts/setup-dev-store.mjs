/**
 * Creates both LGS dev test products via offline Admin session.
 */
import { PrismaClient } from "@prisma/client";

const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const API = `https://${shop}/admin/api/2025-10/graphql.json`;

const PRODUCTS = [
  {
    title: "[LGS DEV] Upload by Size — Test Gang Sheet",
    handle: "lgs-dev-upload-by-size-test",
    price: "0.00",
    tags: ["lgs-dev", "upload-by-size"],
    builderType: "upload_by_size",
    metafields: [
      { key: "builder_type", type: "single_line_text_field", value: "upload_by_size" },
      { key: "price_per_sq_in", type: "number_decimal", value: "0.049" },
      { key: "sheet_width_in", type: "number_decimal", value: "22.5" },
    ],
  },
  {
    title: "[LGS DEV] Gang Sheet Builder — Test",
    handle: "lgs-dev-gang-sheet-test",
    price: "17.00",
    tags: ["lgs-dev", "gang-sheet"],
    builderType: "gang_sheet",
    metafields: [
      { key: "builder_type", type: "single_line_text_field", value: "gang_sheet" },
      { key: "sheet_width_in", type: "number_decimal", value: "22.5" },
    ],
  },
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

async function ensureProduct(token, spec) {
  let data = await gql(
    token,
    `mutation($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product { id title handle variants(first:1){ nodes { id } } }
        userErrors { message }
      }
    }`,
    {
      product: {
        title: spec.title,
        handle: spec.handle,
        status: "ACTIVE",
        productType: "DTF Gang Sheet",
        vendor: "Legends BAGS Dev",
        tags: spec.tags,
      },
    },
  );
  let product = data.productCreate?.product;
  if (!product) {
    const found = await gql(
      token,
      `query($q: String!) { products(first:1, query:$q) { nodes { id title handle variants(first:1){ nodes { id } } } } }`,
      { q: `handle:${spec.handle}` },
    );
    product = found.products?.nodes?.[0];
  }
  if (!product?.id) throw new Error(`Could not create ${spec.handle}`);

  const variantId = product.variants?.nodes?.[0]?.id;
  if (variantId) {
    await gql(
      token,
      `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { message } }
      }`,
      { productId: product.id, variants: [{ id: variantId, price: spec.price }] },
    );
  }

  await gql(
    token,
    `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { message } }
    }`,
    {
      metafields: spec.metafields.map((m) => ({
        ownerId: product.id,
        namespace: "lgs",
        ...m,
      })),
    },
  );

  return { ...product, variantId, builderType: spec.builderType };
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

  const created = [];
  for (const spec of PRODUCTS) {
    const p = await ensureProduct(session.accessToken, spec);
    await prisma.productBinding.upsert({
      where: { shop_variantGid: { shop, variantGid: p.variantId } },
      create: {
        shop,
        productGid: p.id,
        variantGid: p.variantId,
        builderType: spec.builderType,
        pricePerSqIn: spec.builderType === "upload_by_size" ? 0.049 : null,
        sheetWidthIn: 22.5,
        maxHeightIn: spec.builderType === "gang_sheet" ? 24 : 360,
        sheetHeightIn: spec.builderType === "gang_sheet" ? 24 : null,
        variantPriceCents: spec.builderType === "gang_sheet" ? 1700 : null,
      },
      update: {
        variantGid: p.variantId,
        builderType: spec.builderType,
        pricePerSqIn: spec.builderType === "upload_by_size" ? 0.049 : null,
        sheetHeightIn: spec.builderType === "gang_sheet" ? 24 : null,
        variantPriceCents: spec.builderType === "gang_sheet" ? 1700 : null,
      },
    });
    created.push({
      title: p.title,
      handle: p.handle,
      builderType: spec.builderType,
      adminUrl: `https://${shop}/admin/products/${String(p.id).split("/").pop()}`,
      storeUrl: `https://${shop}/products/${p.handle}`,
    });
  }

  await prisma.$disconnect();
  console.log(
    JSON.stringify(
      {
        ok: true,
        shop,
        editorBaseUrl: process.env.SHOPIFY_APP_URL || process.env.LGS_APP_URL || "(tunnel URL)",
        products: created,
        themeSteps: [
          "Open each product in Online Store → Customize",
          "Add LGS Upload by Size or LGS Gang Sheet Builder block",
          "Set Editor base URL to current tunnel",
        ],
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
