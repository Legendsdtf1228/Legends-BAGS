import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { ensureShopConfig } from "../lib/merchant-loaders.server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";
import { SIZE_PRESETS } from "../domain/design/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const config = await ensureShopConfig(session.shop);
  const bindings = await prisma.productBinding.findMany({
    where: { shop: session.shop, builderType: "upload_by_size" },
    orderBy: { updatedAt: "desc" },
  });
  return {
    config,
    bindings,
    presets: Object.entries(SIZE_PRESETS).map(([id, p]) => ({ id, label: p.label, inches: p.longestSideIn })),
  };
};

export default function ImageToSheetSettingsPage() {
  const { config, bindings, presets } = useLoaderData<typeof loader>();

  return (
    <>
      <BagsPageHeader
        title="Image to Sheet"
        subtitle="Upload by Size workflow · area pricing and automatic nesting"
      />
      <div className="bags-admin-content">
        <BagsCard title="Pricing & printer">
          <p className="bags-admin-muted">
            ${(config?.pricePerSqIn ?? 0.049).toFixed(3)} per square inch · printer width{" "}
            {config?.sheetWidthIn ?? 22.5}″ · roll max {config?.maxHeightIn ?? 360}″
          </p>
          <div className="bags-admin-actions" style={{ marginTop: 12 }}>
            <Link to="/app/general" className="bags-admin-btn ghost">
              Edit in General
            </Link>
          </div>
        </BagsCard>

        <BagsCard title="Size presets (customer editor)" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {presets.map((p) => (
              <span key={p.id} className="bags-admin-badge">
                {p.label} longest side
              </span>
            ))}
          </div>
        </BagsCard>

        <BagsCard title="Linked Image to Sheet products" style={{ marginTop: 16 }}>
          {bindings.length === 0 ? (
            <p className="bags-admin-muted">
              No upload-by-size products yet. <Link to="/app/setup">Create a test product</Link>.
            </p>
          ) : (
            <ul className="bags-admin-muted">
              {bindings.map((b) => (
                <li key={b.id} style={{ marginBottom: 6, wordBreak: "break-all" }}>
                  {b.productGid}
                  {b.pricePerSqIn != null ? ` · $${b.pricePerSqIn.toFixed(3)}/in²` : ""}
                </li>
              ))}
            </ul>
          )}
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
