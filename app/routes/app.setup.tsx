import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { upsertProductBinding } from "../services/design-service";
import { publishProductToOnlineStore } from "../services/shopify-publish.server";
import {
  DEFAULT_GANG_SHEET_HEIGHT_IN,
  UPLOAD_BY_SIZE_ROLL_MAX_IN,
} from "../domain/design/gang-sheet-sheet";
import { customerEditorUrls } from "../lib/editor-links.server";
import { builderLinksFromBindings, buildBuilderLaunchUrl } from "../lib/builder-links.server";
import { numericIdFromGid } from "../domain/builder/builder-launch-context";
import prisma from "../db.server";
import { BagsPageHeader, BagsCard, EditorTryCard } from "../components/merchant/bags-admin-ui";

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

async function publishDevProduct(
  admin: Awaited<ReturnType<typeof authenticate.admin>>["admin"],
  productGid: string,
) {
  const result = await publishProductToOnlineStore(admin, productGid);
  if (!result.ok) {
    return { published: false as const, error: result.error };
  }
  return { published: true as const };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const appUrl = process.env.SHOPIFY_APP_URL || "";
  const bindings = await prisma.productBinding.findMany({
    where: { shop: session.shop },
    orderBy: [{ builderType: "asc" }, { sheetHeightIn: "asc" }],
    take: 20,
  });

  return {
    shop: session.shop,
    appUrl,
    editors: customerEditorUrls(session.shop, appUrl),
    builderLinks: builderLinksFromBindings(session.shop, appUrl, bindings),
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
      maxHeightIn: UPLOAD_BY_SIZE_ROLL_MAX_IN,
    });

    const published = await publishDevProduct(admin, result.product.id);

    return {
      ok: true as const,
      kind: "upload_by_size" as const,
      product: result.product,
      published,
      themeBlock: "LGS Upload by Size",
      storeUrl: `https://${session.shop}/products/${result.product.handle}`,
      builderUrl: buildBuilderLaunchUrl({
        appUrl: process.env.SHOPIFY_APP_URL || "",
        shop: session.shop,
        productId: numericIdFromGid(result.product.id) || "",
        variantId: numericIdFromGid(result.variantId),
      }),
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
      sheetHeightIn: DEFAULT_GANG_SHEET_HEIGHT_IN,
      maxHeightIn: DEFAULT_GANG_SHEET_HEIGHT_IN,
    });

    const published = await publishDevProduct(admin, result.product.id);

    return {
      ok: true as const,
      kind: "gang_sheet" as const,
      product: result.product,
      published,
      themeBlock: "LGS Gang Sheet Builder",
      storeUrl: `https://${session.shop}/products/${result.product.handle}`,
      builderUrl: buildBuilderLaunchUrl({
        appUrl: process.env.SHOPIFY_APP_URL || "",
        shop: session.shop,
        productId: numericIdFromGid(result.product.id) || "",
        variantId: numericIdFromGid(result.variantId),
      }),
    };
  }

  if (intent === "publish_dev_products") {
    const handles = [UBS_HANDLE, GS_HANDLE];
    const results: Array<{ handle: string; published: boolean; error?: string }> = [];
    for (const handle of handles) {
      const findRes = await admin.graphql(
        `#graphql
        query FindDevProduct($query: String!) {
          products(first: 1, query: $query) {
            nodes { id handle title }
          }
        }`,
        { variables: { query: `handle:${handle}` } },
      );
      const findJson = await findRes.json();
      const product = findJson.data?.products?.nodes?.[0];
      if (!product?.id) {
        results.push({ handle, published: false, error: "Product not found" });
        continue;
      }
      const pub = await publishDevProduct(admin, product.id);
      results.push({
        handle,
        published: pub.published,
        error: pub.published ? undefined : pub.error,
      });
    }
    return { ok: true as const, kind: "publish" as const, results };
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

        <BagsCard title="2. Theme blocks & app proxy" style={{ marginTop: 16 }}>
          <p className="bags-admin-muted">
            Storefront blocks launch the editor through the stable Shopify app proxy at{" "}
            <code>/apps/legends-bags/</code>. Leave <strong>Editor base URL</strong> blank in theme
            block settings — no tunnel URL updates are required when the dev tunnel rotates.
          </p>
          <p className="bags-admin-muted" style={{ marginTop: 8 }}>
            App URL (admin / webhooks only):{" "}
            <code style={{ wordBreak: "break-all", fontSize: 12 }}>
              {data.appUrl || "(SHOPIFY_APP_URL — run shopify app dev)"}
            </code>
          </p>
          <ol className="bags-admin-muted" style={{ marginTop: 12, paddingLeft: 20 }}>
            <li>Publish dev test products to Online Store (button below).</li>
            <li>Open each test product in the Online Store theme editor.</li>
            <li>Add LGS Upload by Size or LGS Gang Sheet Builder block.</li>
            <li>Leave Editor base URL empty unless previewing outside the dev store.</li>
            <li>Add LGS Cart Edit Design block to the cart template.</li>
          </ol>
          <Form method="post" style={{ marginTop: 12 }}>
            <input type="hidden" name="intent" value="publish_dev_products" />
            <button type="submit" className="bags-admin-btn secondary">
              Publish dev test products to Online Store
            </button>
          </Form>
          {data.builderLinks.length ? (
            <div style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 13 }}>Bound product /builder URLs</strong>
              <ul className="bags-admin-muted" style={{ marginTop: 8, paddingLeft: 20 }}>
                {data.builderLinks.map((link) => (
                  <li key={link.id} style={{ marginBottom: 8 }}>
                    {link.builderType === "gang_sheet" ? "Gang sheet" : "Upload by Size"}
                    {link.sheetHeightIn ? ` · ${link.sheetHeightIn}″` : ""}
                    <br />
                    <a href={link.builderUrl} target="_blank" rel="noopener noreferrer">
                      {link.builderUrl}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="bags-admin-muted" style={{ marginTop: 12 }}>
              Create test products above to generate /builder URLs.
            </p>
          )}
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

        <BagsCard title="4. Gang sheet variants" style={{ marginTop: 16 }}>
          <p className="bags-admin-muted">
            After creating the gang sheet product, run{" "}
            <code>npm run setup:gang-sheet-variants</code> locally to bind 13 sheet-height variants
            ($17–$195). The storefront block shows a sheet-height picker when multiple variants are bound.
          </p>
        </BagsCard>

        <BagsCard title="5. Railway staging" style={{ marginTop: 16 }}>
          <p className="bags-admin-muted">
            Deploy the web app to Railway for a stable public URL (SQLite + volume at{" "}
            <code>/data</code>). Follow <code>docs/operations/railway-deploy.md</code> in the repo for
            env vars, volume mount, and Shopify Partner URL updates.
          </p>
          <p className="bags-admin-muted" style={{ marginTop: 8 }}>
            Current app URL: {data.appUrl || "(set SHOPIFY_APP_URL or deploy to Railway)"}
          </p>
        </BagsCard>

        <EditorTryCard
          uploadBySizeUrl={data.editors.uploadBySize}
          gangSheetUrl={data.editors.gangSheet}
          style={{ marginTop: 16 }}
        />

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
