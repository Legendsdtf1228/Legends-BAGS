import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

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
      updatedAt: b.updatedAt.toISOString(),
    })),
    appUrl: process.env.SHOPIFY_APP_URL || "",
  };
};

export default function ProductsPage() {
  const { bindings, appUrl } = useLoaderData<typeof loader>();

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
        <BagsCard title="Product bindings">
          {bindings.length === 0 ? (
            <p className="bags-admin-muted">
              No products bound yet. Use Setup to create dev products, or bind live products from Gangsheet
              Builder / Image to Sheet settings.
            </p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Builder</th>
                  <th>Product GID</th>
                  <th>Variant</th>
                  <th>Pricing / sheet</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {bindings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.builderType === "gang_sheet" ? "Gangsheet Builder" : "Image to Sheet"}</td>
                    <td style={{ fontSize: 11, wordBreak: "break-all" }}>{b.productGid}</td>
                    <td style={{ fontSize: 11 }}>{b.variantGid ?? "—"}</td>
                    <td>
                      {b.pricePerSqIn != null ? `$${b.pricePerSqIn.toFixed(3)}/in²` : "Variant pricing"}
                      {b.sheetWidthIn != null ? ` · ${b.sheetWidthIn}″ wide` : ""}
                      {b.maxHeightIn != null ? ` · ${b.maxHeightIn}″ max` : ""}
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
