/**
 * Dev helper: create test product using offline session in Prisma.
 * Does not print access tokens.
 */
import { PrismaClient } from "@prisma/client";

const shop = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const TITLE = "[LGS DEV] Upload by Size — Test Gang Sheet";
const HANDLE = "lgs-dev-upload-by-size-test";

async function main() {
  const prisma = new PrismaClient();
  const session = await prisma.session.findFirst({
    where: { shop, isOnline: false },
    orderBy: { id: "asc" },
  });
  if (!session?.accessToken) {
    // try any session for shop
    const any = await prisma.session.findFirst({ where: { shop } });
    if (!any?.accessToken) {
      console.error("No session for shop. Open the Admin app once, then retry.");
      process.exit(1);
    }
    await createWithToken(any.accessToken);
  } else {
    await createWithToken(session.accessToken);
  }
  await prisma.$disconnect();
}

async function createWithToken(token) {
  const endpoint = `https://${shop}/admin/api/2025-10/graphql.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: `mutation($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product { id title handle status variants(first:1){ nodes { id } } }
          userErrors { message field }
        }
      }`,
      variables: {
        product: {
          title: TITLE,
          handle: HANDLE,
          status: "ACTIVE",
          descriptionHtml:
            "<p>Development-only Upload-by-Size test product. Synthetic artwork only. Area pricing $0.049/in² in editor.</p>",
          productType: "DTF Gang Sheet",
          vendor: "Legends BAGS Dev",
          tags: ["lgs-dev", "upload-by-size", "do-not-use-production"],
        },
      },
    }),
  });
  const json = await res.json();
  const errors = json.data?.productCreate?.userErrors || json.errors;
  let product = json.data?.productCreate?.product;
  if (errors?.length && !product) {
    // fetch existing by handle
    const find = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query: `query { products(first:1, query:"handle:${HANDLE}") { nodes { id title handle status variants(first:1){ nodes { id } } } } }`,
      }),
    });
    const findJson = await find.json();
    product = findJson.data?.products?.nodes?.[0];
  }

  if (!product) {
    console.error("Product create failed", JSON.stringify(errors || json, null, 2));
    process.exit(1);
  }

  const variantId = product.variants?.nodes?.[0]?.id;
  if (variantId) {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query: `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { message }
          }
        }`,
        variables: {
          productId: product.id,
          variants: [{ id: variantId, price: "17.00" }],
        },
      }),
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: product.id,
        title: product.title,
        handle: product.handle,
        adminUrl: `https://${shop}/admin/products/${String(product.id).split("/").pop()}`,
        storeUrl: `https://${shop}/products/${product.handle}`,
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
