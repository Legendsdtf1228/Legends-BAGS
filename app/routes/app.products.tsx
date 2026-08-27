import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { upsertProductBinding } from "../services/design-service";
import { BagsPageHeader, BagsCard, BagsStatusBadge } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const bindings = await prisma.productBinding.findMany({
    where: { shop: session.shop },
    orderBy: { updatedAt: "desc" },
  });

  return {
    bindings: bindings.map((b) => ({
      id: b.id,
      productGid: b.productGid,
      variantGid: b.variantGid,
      builderType: b.builderType,
      pricePerSqIn: b.pricePerSqIn,
      sheetWidthIn: b.sheetWidthIn,
      maxHeightIn: b.maxHeightIn,
      sheetHeightIn: b.sheetHeightIn,
      variantPriceCents: b.variantPriceCents,
      updatedAt: b.updatedAt.toISOString(),
    })),
    appUrl: process.env.SHOPIFY_APP_URL || "",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") !== "bind") return null;

  const productGid = String(form.get("productGid") || "").trim();
  const variantGidRaw = String(form.get("variantGid") || "").trim();
  const builderType = String(form.get("builderType") || "upload_by_size") as
    | "upload_by_size"
    | "gang_sheet";

  if (!productGid.startsWith("gid://shopify/Product/")) {
    return { error: "Product GID must look like gid://shopify/Product/…" };
  }

  const variantGid = variantGidRaw
    ? variantGidRaw.startsWith("gid://")
      ? variantGidRaw
      : `gid://shopify/ProductVariant/${variantGidRaw}`
    : undefined;

  const pricePerSqIn = form.get("pricePerSqIn")
    ? Number.parseFloat(String(form.get("pricePerSqIn")))
    : undefined;
  const variantPrice = form.get("variantPrice")
    ? Math.round(Number.parseFloat(String(form.get("variantPrice"))) * 100)
    : undefined;
  const sheetHeightIn = form.get("sheetHeightIn")
    ? Number.parseFloat(String(form.get("sheetHeightIn")))
    : undefined;

  try {
    if (variantGid) {
      const existing = await prisma.productBinding.findFirst({
        where: { shop: session.shop, variantGid },
      });
      if (existing) {
        await prisma.productBinding.update({
          where: { id: existing.id },
          data: {
            productGid,
            builderType,
            pricePerSqIn: Number.isFinite(pricePerSqIn!) ? pricePerSqIn : existing.pricePerSqIn,
            sheetHeightIn: Number.isFinite(sheetHeightIn!) ? sheetHeightIn : existing.sheetHeightIn,
            variantPriceCents:
              variantPrice != null && Number.isFinite(variantPrice)
                ? variantPrice
                : existing.variantPriceCents,
          },
        });
      } else {
        await prisma.productBinding.create({
          data: {
            shop: session.shop,
            productGid,
            variantGid,
            builderType,
            pricePerSqIn: Number.isFinite(pricePerSqIn!) ? pricePerSqIn : null,
            sheetHeightIn: Number.isFinite(sheetHeightIn!) ? sheetHeightIn : null,
            variantPriceCents:
              variantPrice != null && Number.isFinite(variantPrice) ? variantPrice : null,
            sheetWidthIn: 22.5,
            maxHeightIn: sheetHeightIn ?? 360,
          },
        });
      }
    } else {
      await upsertProductBinding({
        shop: session.shop,
        productGid,
        builderType,
        pricePerSqIn: Number.isFinite(pricePerSqIn!) ? pricePerSqIn : undefined,
      });
    }
    return { saved: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Bind failed" };
  }
};

export default function ProductsPage() {
  const { bindings, appUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title="Products"
        subtitle="Shopify products linked to Legends BAGS builders"
        actions={
          <Link to="/app/setup" className="bags-admin-btn primary">
            Create test products
          </Link>
        }
      />
      <div className="bags-admin-content">
        {actionData && "error" in actionData && actionData.error ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p style={{ color: "#b42318", margin: 0 }}>{actionData.error}</p>
          </BagsCard>
        ) : null}
        {actionData && "saved" in actionData && actionData.saved ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted" style={{ margin: 0 }}>
              Product binding saved.
            </p>
          </BagsCard>
        ) : null}

        <BagsCard title="Bind a product or variant">
          <Form method="post" className="bags-admin-form" style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <input type="hidden" name="intent" value="bind" />
            <label>
              Product GID
              <input name="productGid" type="text" required placeholder="gid://shopify/Product/…" />
            </label>
            <label>
              Variant GID or numeric ID (optional)
              <input name="variantGid" type="text" placeholder="gid://shopify/ProductVariant/…" />
            </label>
            <label>
              Builder type
              <select name="builderType" defaultValue="upload_by_size">
                <option value="upload_by_size">Image to Sheet</option>
                <option value="gang_sheet">Gangsheet Builder</option>
              </select>
            </label>
            <label>
              Price per in² (Upload-by-Size)
              <input name="pricePerSqIn" type="number" step="0.001" placeholder="0.049" />
            </label>
            <label>
              Sheet height in (gang sheet variant)
              <input name="sheetHeightIn" type="number" step="1" placeholder="24" />
            </label>
            <label>
              Fixed variant price USD (gang sheet)
              <input name="variantPrice" type="number" step="0.01" placeholder="17.00" />
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Save binding
            </button>
          </Form>
        </BagsCard>

        <BagsCard title="Product bindings" style={{ marginTop: 16 }}>
          {bindings.length === 0 ? (
            <p className="bags-admin-muted">No products bound yet.</p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Builder</th>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Height</th>
                  <th>Pricing</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {bindings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <BagsStatusBadge status={b.builderType} />
                    </td>
                    <td style={{ fontSize: 11, wordBreak: "break-all" }}>{b.productGid}</td>
                    <td style={{ fontSize: 11 }}>{b.variantGid ?? "—"}</td>
                    <td>{b.sheetHeightIn != null ? `${b.sheetHeightIn}″` : "—"}</td>
                    <td>
                      {b.variantPriceCents != null
                        ? `$${(b.variantPriceCents / 100).toFixed(2)} fixed`
                        : b.pricePerSqIn != null
                          ? `$${b.pricePerSqIn.toFixed(3)}/in²`
                          : "—"}
                    </td>
                    <td>{new Date(b.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </BagsCard>

        <BagsCard title="Theme blocks" style={{ marginTop: 16 }}>
          <p className="bags-admin-muted">
            Add <strong>LGS Upload by Size</strong> or <strong>LGS Gang Sheet Builder</strong> blocks on each
            product in the theme editor. Editor base URL:
          </p>
          <code style={{ display: "block", marginTop: 8, wordBreak: "break-all", fontSize: 12 }}>
            {appUrl || "(run shopify app dev)"}
          </code>
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
