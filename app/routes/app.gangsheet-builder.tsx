import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { ensureShopConfig } from "../lib/merchant-loaders.server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

const SHEET_LENGTHS = [24, 36, 48, 60, 72, 84, 96, 108, 132, 150, 168, 192, 250];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const config = await ensureShopConfig(session.shop);
  const bindings = await prisma.productBinding.findMany({
    where: { shop: session.shop, builderType: "gang_sheet" },
    orderBy: { updatedAt: "desc" },
  });
  return { config, bindings, sheetLengths: SHEET_LENGTHS };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") !== "price") return null;

  const bindingId = String(form.get("bindingId") || "");
  const cents = Math.round(Number.parseFloat(String(form.get("variantPrice") || "0")) * 100);
  if (!bindingId || !Number.isFinite(cents) || cents < 0) {
    return { error: "Enter a valid price." };
  }

  const row = await prisma.productBinding.findFirst({
    where: { id: bindingId, shop: session.shop },
  });
  if (!row) return { error: "Binding not found." };

  await prisma.productBinding.update({
    where: { id: row.id },
    data: { variantPriceCents: cents },
  });
  return { saved: true };
};

export default function GangsheetBuilderSettingsPage() {
  const { config, bindings, sheetLengths } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title="Gangsheet Builder"
        subtitle="Manual canvas + Auto Build · fixed-length variants"
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
              Variant price saved.
            </p>
          </BagsCard>
        ) : null}

        <BagsCard title="Canvas defaults">
          <p className="bags-admin-muted">
            Width {config?.sheetWidthIn ?? 22.5}″ · max height {config?.maxHeightIn ?? 360}″ · margins{" "}
            {config?.imageMarginIn ?? 0.15}″ / {config?.artboardMarginIn ?? 0.1}″
          </p>
          <div className="bags-admin-actions" style={{ marginTop: 12 }}>
            <Link to="/app/general" className="bags-admin-btn ghost">
              Edit in General
            </Link>
          </div>
        </BagsCard>

        <BagsCard title="Standard sheet lengths (live BAGS catalog)" style={{ marginTop: 16 }}>
          <p className="bags-admin-muted">
            Legends store uses 13 fixed heights with variant pricing ($17–$195).
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {sheetLengths.map((inches) => (
              <span key={inches} className="bags-admin-badge">
                22.5 × {inches}″
              </span>
            ))}
          </div>
        </BagsCard>

        <BagsCard title="Linked gang sheet products" style={{ marginTop: 16 }}>
          {bindings.length === 0 ? (
            <p className="bags-admin-muted">
              No gang sheet products yet. <Link to="/app/setup">Create a test product</Link>.
            </p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Set price (USD)</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                {bindings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ wordBreak: "break-all", fontSize: 12 }}>{b.productGid}</td>
                    <td style={{ wordBreak: "break-all", fontSize: 12 }}>{b.variantGid ?? "—"}</td>
                    <td>
                      <Form method="post" className="bags-admin-form" style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                        <input type="hidden" name="intent" value="price" />
                        <input type="hidden" name="bindingId" value={b.id} />
                        <input
                          name="variantPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={
                            b.variantPriceCents != null ? (b.variantPriceCents / 100).toFixed(2) : ""
                          }
                          placeholder="0.00"
                          style={{ width: 90 }}
                        />
                        <button type="submit" className="bags-admin-btn ghost">
                          Save
                        </button>
                      </Form>
                    </td>
                    <td>{b.variantPriceCents != null ? `$${(b.variantPriceCents / 100).toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
