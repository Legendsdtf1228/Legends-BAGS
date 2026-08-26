import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import type { CSSProperties } from "react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { upsertProductBinding } from "../services/design-service";

const UBS_TITLE = "[LGS DEV] Upload by Size — Test Gang Sheet";
const UBS_HANDLE = "lgs-dev-upload-by-size-test";
const GS_TITLE = "[LGS DEV] Gang Sheet Builder — Test";
const GS_HANDLE = "lgs-dev-gang-sheet-test";

async function ensureProduct(
  admin: Awaited<ReturnType<typeof authenticate.admin>>["admin"],
  input: {
    title: string;
    handle: string;
    descriptionHtml: string;
    tags: string[];
    basePrice: string;
    metafields: Array<{
      key: string;
      type: string;
      value: string;
    }>;
  },
) {
  const createRes = await admin.graphql(
    `#graphql
    mutation CreateTestProduct($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product {
          id
          title
          handle
          variants(first: 1) { nodes { id price } }
        }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        product: {
          title: input.title,
          handle: input.handle,
          status: "ACTIVE",
          descriptionHtml: input.descriptionHtml,
          productType: "DTF Gang Sheet",
          vendor: "Legends BAGS Dev",
          tags: input.tags,
        },
      },
    },
  );
  const createJson = await createRes.json();
  const errors = createJson.data?.productCreate?.userErrors ?? [];
  if (errors.length) {
    return { ok: false as const, errors };
  }

  let product = createJson.data?.productCreate?.product;
  if (!product?.id) {
    const findRes = await admin.graphql(
      `#graphql
      query FindByHandle($query: String!) {
        products(first: 1, query: $query) {
          nodes { id title handle variants(first: 1) { nodes { id price } } }
        }
      }`,
      { variables: { query: `handle:${input.handle}` } },
    );
    const findJson = await findRes.json();
    product = findJson.data?.products?.nodes?.[0];
  }
  if (!product?.id) return { ok: false as const, errors: [{ message: "Product missing" }] };

  const variantId = product.variants?.nodes?.[0]?.id;
  if (variantId) {
    await admin.graphql(
      `#graphql
      mutation SetVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { message }
        }
      }`,
      {
        variables: {
          productId: product.id,
          variants: [{ id: variantId, price: input.basePrice }],
        },
      },
    );
  }

  await admin.graphql(
    `#graphql
    mutation SetMeta($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { message }
      }
    }`,
    {
      variables: {
        metafields: input.metafields.map((m) => ({
          ownerId: product.id,
          namespace: "lgs",
          key: m.key,
          type: m.type,
          value: m.value,
        })),
      },
    },
  );

  return { ok: true as const, product, variantId };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return {
    shop: session.shop,
    appUrl: process.env.SHOPIFY_APP_URL || "",
    testApiConfigured: Boolean(process.env.TEST_API_TOKEN),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "create_upload_by_size") {
    const result = await ensureProduct(admin, {
      title: UBS_TITLE,
      handle: UBS_HANDLE,
      descriptionHtml:
        "<p>Development Upload-by-Size test product. Synthetic artwork only. Area pricing verified server-side.</p>",
      tags: ["lgs-dev", "upload-by-size"],
      basePrice: "0.00",
      metafields: [
        { key: "builder_type", type: "single_line_text_field", value: "upload_by_size" },
        { key: "price_per_sq_in", type: "number_decimal", value: "0.049" },
        { key: "sheet_width_in", type: "number_decimal", value: "22.5" },
      ],
    });
    if (!result.ok) return { ok: false as const, step: "upload_by_size", errors: result.errors };

    await upsertProductBinding({
      shop: session.shop,
      productGid: result.product.id,
      variantGid: result.variantId,
      builderType: "upload_by_size",
      pricePerSqIn: 0.049,
      sheetWidthIn: 22.5,
      maxHeightIn: 360,
    });

    return {
      ok: true as const,
      kind: "upload_by_size" as const,
      product: result.product,
      themeBlock: "LGS Upload by Size",
      storeUrl: `https://${session.shop}/products/${result.product.handle}`,
    };
  }

  if (intent === "create_gang_sheet") {
    const result = await ensureProduct(admin, {
      title: GS_TITLE,
      handle: GS_HANDLE,
      descriptionHtml:
        "<p>Development gang sheet builder test product. Drag-and-drop canvas with manual layout.</p>",
      tags: ["lgs-dev", "gang-sheet"],
      basePrice: "17.00",
      metafields: [
        { key: "builder_type", type: "single_line_text_field", value: "gang_sheet" },
        { key: "sheet_width_in", type: "number_decimal", value: "22.5" },
      ],
    });
    if (!result.ok) return { ok: false as const, step: "gang_sheet", errors: result.errors };

    await upsertProductBinding({
      shop: session.shop,
      productGid: result.product.id,
      variantGid: result.variantId,
      builderType: "gang_sheet",
      sheetWidthIn: 22.5,
      maxHeightIn: 360,
    });

    return {
      ok: true as const,
      kind: "gang_sheet" as const,
      product: result.product,
      themeBlock: "LGS Gang Sheet Builder",
      storeUrl: `https://${session.shop}/products/${result.product.handle}`,
    };
  }

  return { ok: false as const, step: "unknown", errors: [] };
};

export default function SetupPage() {
  const data = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  return (
    <div style={page}>
      <h1 style={{ marginTop: 0 }}>Development setup</h1>
      <p style={muted}>Shop: {data.shop}. Synthetic test products only.</p>

      <section style={box}>
        <h2 style={h2}>1. Test products</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <strong>{UBS_TITLE}</strong>
            <Form method="post" style={{ marginTop: 8 }}>
              <input type="hidden" name="intent" value="create_upload_by_size" />
              <button type="submit" style={btn}>
                Create Upload-by-Size product
              </button>
            </Form>
          </div>
          <div>
            <strong>{GS_TITLE}</strong>
            <Form method="post" style={{ marginTop: 8 }}>
              <input type="hidden" name="intent" value="create_gang_sheet" />
              <button type="submit" style={btnAlt}>
                Create Gang Sheet Builder product
              </button>
            </Form>
          </div>
        </div>
      </section>

      <section style={{ ...box, marginTop: 16 }}>
        <h2 style={h2}>2. Theme blocks</h2>
        <p>Editor base URL (paste into each block):</p>
        <code style={code}>{data.appUrl || "(SHOPIFY_APP_URL — run shopify app dev)"}</code>
        <ol>
          <li>Open each test product in the Online Store theme editor.</li>
          <li>
            Add <strong>LGS Upload by Size</strong> or <strong>LGS Gang Sheet Builder</strong>.
          </li>
          <li>Set <strong>Editor base URL</strong> to the tunnel URL above.</li>
          <li>Hide the default Buy button if needed. Save.</li>
        </ol>
      </section>

      <section style={{ ...box, marginTop: 16 }}>
        <h2 style={h2}>3. Editor auth (dev)</h2>
        <p>
          Editors set HttpOnly cookies automatically when opened from the theme iframe. For direct
          URL testing, ensure <code>DEV_SHOP</code> and <code>TEST_API_TOKEN</code> are in{" "}
          <code>.env</code>.
        </p>
        <p style={muted}>
          TEST_API_TOKEN configured: {data.testApiConfigured ? "yes" : "no"}
        </p>
      </section>

      {result ? (
        <section style={{ ...box, marginTop: 16 }}>
          <h2 style={h2}>Result</h2>
          <pre style={pre}>{JSON.stringify(result, null, 2)}</pre>
        </section>
      ) : null}
    </div>
  );
}

const page: CSSProperties = {
  padding: 24,
  maxWidth: 860,
  margin: "0 auto",
  fontFamily: "system-ui, Segoe UI, sans-serif",
};
const box: CSSProperties = {
  border: "1px solid #d9d1c3",
  background: "#fffdf8",
  padding: 16,
  borderRadius: 8,
};
const h2: CSSProperties = { marginTop: 0, fontSize: 18 };
const muted: CSSProperties = { opacity: 0.75 };
const btn: CSSProperties = {
  background: "#0f5c4c",
  color: "#f4fffb",
  border: 0,
  padding: "10px 14px",
  cursor: "pointer",
  borderRadius: 6,
  font: "inherit",
};
const btnAlt: CSSProperties = { ...btn, background: "#2463eb" };
const code: CSSProperties = {
  display: "block",
  padding: 10,
  background: "#f3efe6",
  borderRadius: 6,
  margin: "8px 0 12px",
  wordBreak: "break-all",
};
const pre: CSSProperties = {
  background: "#f3efe6",
  padding: 12,
  borderRadius: 6,
  overflow: "auto",
  fontSize: 13,
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
