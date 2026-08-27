import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { upsertProductBinding } from "../services/design-service";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

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
    metafields: Array<{ key: string; type: string; value: string }>;
  },
) {
  const createRes = await admin.graphql(
    `#graphql
    mutation CreateTestProduct($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product { id title handle variants(first: 1) { nodes { id price } } }
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
  if (errors.length) return { ok: false as const, errors };

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
    <>
      <BagsPageHeader title="Setup" subtitle={`Install helpers · ${data.shop}`} />
      <div className="bags-admin-content">
        <BagsCard title="1. Test products">
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <strong>{UBS_TITLE}</strong>
              <p className="bags-admin-muted">Image to Sheet · area pricing</p>
              <Form method="post" style={{ marginTop: 8 }}>
                <input type="hidden" name="intent" value="create_upload_by_size" />
                <button type="submit" className="bags-admin-btn primary">
                  Create Image to Sheet product
                </button>
              </Form>
            </div>
            <div>
              <strong>{GS_TITLE}</strong>
              <p className="bags-admin-muted">Gangsheet Builder · canvas layout</p>
              <Form method="post" style={{ marginTop: 8 }}>
                <input type="hidden" name="intent" value="create_gang_sheet" />
                <button type="submit" className="bags-admin-btn secondary">
                  Create Gangsheet product
                </button>
              </Form>
            </div>
          </div>
        </BagsCard>

        <BagsCard title="2. Theme blocks" style={{ marginTop: 16 }}>
          <p className="bags-admin-muted">Editor base URL (paste into each block):</p>
          <code style={{ display: "block", marginTop: 8, wordBreak: "break-all", fontSize: 12 }}>
            {data.appUrl || "(SHOPIFY_APP_URL — run shopify app dev)"}
          </code>
          <ol className="bags-admin-muted" style={{ marginTop: 12, paddingLeft: 20 }}>
            <li>Open each test product in the Online Store theme editor.</li>
            <li>Add LGS Upload by Size or LGS Gang Sheet Builder block.</li>
            <li>Set Editor base URL to the tunnel URL above.</li>
            <li>Add LGS Cart Edit Design block to the cart template.</li>
          </ol>
        </BagsCard>

        <BagsCard title="3. Editor auth (dev)" style={{ marginTop: 16 }}>
          <p className="bags-admin-muted">
            Editors set HttpOnly cookies from the theme iframe. For direct URL testing, set DEV_SHOP and
            TEST_API_TOKEN in .env.
          </p>
          <p className="bags-admin-muted">
            TEST_API_TOKEN configured: {data.testApiConfigured ? "yes" : "no"}
          </p>
        </BagsCard>

        {result ? (
          <BagsCard title="Result" style={{ marginTop: 16 }}>
            <pre style={{ margin: 0, fontSize: 12, overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>
          </BagsCard>
        ) : null}
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
