import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  BagsAlert,
  BagsCard,
  BagsPageBody,
  BagsPageHeader,
  BagsStatusBadge,
} from "../components/merchant/bags-admin-ui";
import { studioBridgePresent } from "../lib/studio-builder.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [config, bindingCount] = await Promise.all([
    prisma.shopConfig.findUnique({ where: { shop: session.shop } }),
    prisma.productBinding.count({ where: { shop: session.shop } }),
  ]);
  return {
    shop: session.shop,
    bindingCount,
    lastProductSyncAt: config?.lastProductSyncAt?.toISOString() ?? null,
    lastProductSyncError: config?.lastProductSyncError ?? null,
    lastOrderSyncAt: config?.lastOrderSyncAt?.toISOString() ?? null,
    lastOrderSyncError: config?.lastOrderSyncError ?? null,
    studioEnabled: studioBridgePresent(),
  };
};

export default function IntegrationsPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <BagsPageHeader title="Integrations" subtitle="Connection health without exposing credentials" actions={<Link to="/app/settings" className="bags-admin-btn ghost">Settings</Link>} />
      <div className="bags-admin-content">
        <BagsPageBody>
          <div className="bags-admin-grid two">
            <BagsCard title="Shopify">
              <div className="bags-integration-heading"><BagsStatusBadge status="connected" /><strong>{data.shop}</strong></div>
              <dl className="bags-definition-list">
                <div><dt>Builder products</dt><dd>{data.bindingCount}</dd></div>
                <div><dt>Last product sync</dt><dd>{data.lastProductSyncAt ? new Date(data.lastProductSyncAt).toLocaleString() : "Not run"}</dd></div>
                <div><dt>Last order sync</dt><dd>{data.lastOrderSyncAt ? new Date(data.lastOrderSyncAt).toLocaleString() : "Not run"}</dd></div>
              </dl>
              {data.lastProductSyncError || data.lastOrderSyncError ? <BagsAlert tone="danger" title="Sync needs attention">{data.lastProductSyncError || data.lastOrderSyncError}</BagsAlert> : null}
              <div className="bags-admin-actions"><Link to="/app/products" className="bags-admin-btn primary">Manage products</Link><Link to="/app/orders" className="bags-admin-btn ghost">View orders</Link></div>
            </BagsCard>
            <BagsCard title="Gang Sheet Studio">
              <div className="bags-integration-heading"><BagsStatusBadge status={data.studioEnabled ? "connected" : "missing"} /><strong>{data.studioEnabled ? "Bridge enabled" : "Needs setup"}</strong></div>
              <p className="bags-admin-muted">
                Studio remains the authoritative customer-facing canvas. Legends-BAGS configures launches, persists projects, links orders, and handles production.
              </p>
              <BagsAlert tone={data.studioEnabled ? "success" : "warning"} title={data.studioEnabled ? "Launch bridge ready" : "Studio dist missing"}>
                {data.studioEnabled ? "Configured builder products launch Gang Sheet Studio through /editor/studio." : "Sync public/studio before merchants can open the gang-sheet builder. Legacy /editor/gang-sheet is fallback-only."}
              </BagsAlert>
            </BagsCard>
          </div>
        </BagsPageBody>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);