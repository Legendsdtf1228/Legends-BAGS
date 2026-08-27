import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { processNextRenderJob, recoverStuckJobs } from "../services/design-service";
import { ensureShopConfig } from "../lib/merchant-loaders.server";
import { getDashboardPayload, getDashboardStats, type DashboardRange } from "../lib/merchant-dashboard.server";
import { customerEditorUrls } from "../lib/editor-links.server";
import {
  BagsPageHeader,
  BagsCard,
  BagsStat,
  BagsQuickActions,
  BagsPipeline,
  BagsStatusBadge,
  BagsPageBody,
  BagsAlert,
  BagsEmptyState,
  BagsTableWrap,
} from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const range = (url.searchParams.get("range") || "30d") as import("../lib/merchant-dashboard.server").DashboardRange;
  const config = await ensureShopConfig(shop);

  let dashboard;
  let loadError: string | null = null;
  try {
    dashboard = await getDashboardPayload(shop, range);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Dashboard data unavailable";
    dashboard = { stats: await getDashboardStats(shop, "all"), recentDesigns: [], recentOrders: [] };
  }

  return {
    shop,
    range,
    loadError,
    appUrl: process.env.SHOPIFY_APP_URL || "",
    editors: customerEditorUrls(shop, process.env.SHOPIFY_APP_URL || ""),
    config: config ?? {
      pricePerSqIn: 0.049,
      sheetWidthIn: 22.5,
      maxHeightIn: 360,
      imageMarginIn: 0.15,
      artboardMarginIn: 0.1,
    },
    stats: dashboard.stats,
    recent: dashboard.recentDesigns,
    recentOrders: dashboard.recentOrders,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") === "process_jobs") {
    const recovered = await recoverStuckJobs();
    const result = await processNextRenderJob();
    return { recovered, result };
  }
  return null;
};

export default function MerchantHomePage() {
  const { stats, recent, recentOrders, range, loadError } = useLoaderData<typeof loader>();

  const pipelineMax = Math.max(
    stats.queuedJobs,
    stats.processingJobs,
    stats.completedJobs,
    stats.failedJobs,
    1,
  );

  return (
    <>
      <BagsPageHeader
        title="Home"
        subtitle="Operations overview"
        actions={
          <Link to="/app/setup" className="bags-admin-btn ghost">
            Setup
          </Link>
        }
      />
      <div className="bags-admin-content">
        <BagsPageBody>
        {loadError ? (
          <BagsAlert tone="danger" title="Dashboard unavailable">
            {loadError}
          </BagsAlert>
        ) : null}

        <Form method="get" className="bags-admin-date-range" style={{ marginBottom: 14 }}>
          {(["today", "7d", "30d", "90d", "all"] as DashboardRange[]).map((r) => (
            <button
              key={r}
              type="submit"
              name="range"
              value={r}
              className={`bags-admin-btn ${range === r ? "primary" : "ghost"}`}
            >
              {r === "today" ? "Today" : r === "all" ? "All time" : `Last ${r.replace("d", " days")}`}
            </button>
          ))}
        </Form>

        <div className="bags-admin-grid stats" style={{ marginBottom: 16 }}>
          <BagsStat label="Designs" value={stats.designCount} accent="orange" />
          <BagsStat label="Ordered sheets" value={stats.orderedDesigns} accent="blue" />
          <BagsStat label="Linked orders" value={stats.orderLinks} accent="blue" />
          <BagsStat label="Completed renders" value={stats.completedRenders} accent="green" />
          {stats.failedRenders > 0 ? (
            <BagsStat label="Failed renders" value={stats.failedRenders} accent="red" />
          ) : null}
          <BagsStat label="Revenue (designed)" value={`$${(stats.grossRevenueCents / 100).toFixed(2)}`} accent="purple" />
          <BagsStat label="Product bindings" value={stats.bindings} accent="blue" />
          {stats.storageBytes ? (
            <BagsStat label="Storage" value={`${(stats.storageBytes / (1024 * 1024)).toFixed(1)} MB`} />
          ) : null}
        </div>

        <BagsCard title="Quick actions" style={{ marginBottom: 16 }}>
          <BagsQuickActions
            items={[
              {
                to: "/app/products",
                icon: "products",
                title: "Products",
                subtitle: "Bind builder products and variants",
              },
              {
                to: "/app/designs",
                icon: "designs",
                title: "Designs",
                subtitle: "Preview, download, and manage customer art",
              },
              {
                to: "/app/orders",
                icon: "orders",
                title: "Orders",
                subtitle: "View linked Shopify orders",
              },
              {
                to: "/app/gangsheet-builder",
                icon: "gangsheet-builder",
                title: "Gangsheet Builder",
                subtitle: "Sheet sizes, margins, and builder defaults",
              },
              {
                to: "/app/image-to-sheet",
                icon: "image-to-sheet",
                title: "Upload by Size",
                subtitle: "Presets, pricing, and size limits",
              },
              {
                to: "/app/appearance",
                icon: "appearance",
                title: "Appearance",
                subtitle: "Welcome text and accent colors",
              },
            ]}
          />
        </BagsCard>

        <div className="bags-admin-grid two" style={{ marginBottom: 14 }}>
          <BagsCard title="Workflow breakdown">
            <div className="bags-admin-grid stats" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
              <div><strong>{stats.workflowCounts.gang_sheet}</strong><span className="bags-admin-muted"> Gang Sheet</span></div>
              <div><strong>{stats.workflowCounts.upload_by_size}</strong><span className="bags-admin-muted"> Upload by Size</span></div>
              <div><strong>{stats.workflowCounts.staff}</strong><span className="bags-admin-muted"> Staff-built</span></div>
              <div><strong>{stats.workflowCounts.reorder}</strong><span className="bags-admin-muted"> Reorders</span></div>
            </div>
          </BagsCard>

          <BagsCard title="Render pipeline">
            <BagsPipeline
              rows={[
                { label: "Queued", value: stats.queuedJobs, max: pipelineMax },
                { label: "Processing", value: stats.processingJobs, max: pipelineMax },
                { label: "Completed", value: stats.completedJobs, max: pipelineMax },
                { label: "Failed", value: stats.failedJobs, max: pipelineMax },
              ]}
            />
            {stats.failedJobs > 0 || stats.stuckJobs > 0 ? (
              <BagsAlert tone="warning" title="Pipeline attention">
                {stats.failedJobs > 0 ? `${stats.failedJobs} failed render(s). ` : ""}
                {stats.stuckJobs > 0 ? `${stats.stuckJobs} stuck job(s).` : ""}
              </BagsAlert>
            ) : null}
            <div className="bags-admin-actions" style={{ marginTop: 12 }}>
              <Link to="/app/orders?render=failed" className="bags-admin-btn ghost sm">
                View failed
              </Link>
              <Link to="/app/designs?status=ordered" className="bags-admin-btn ghost sm">
                Ordered designs
              </Link>
            </div>
          </BagsCard>
        </div>

        <BagsCard title="Recent orders" style={{ marginBottom: 14 }}>
          {recentOrders.length === 0 ? (
            <BagsEmptyState
              title="No orders yet"
              description="Complete a dev-store checkout to see synchronized Shopify orders here."
              action={
                <Link to="/app/orders" className="bags-admin-btn primary">
                  Open Orders
                </Link>
              }
            />
          ) : (
            <BagsTableWrap>
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Lines</th>
                  <th>Render</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td>#{order.orderId}</td>
                    <td>{order.lineCount}</td>
                    <td>{order.renderStatus}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>
                      <Link to="/app/orders" className="bags-admin-btn ghost">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </BagsTableWrap>
          )}
        </BagsCard>

        <BagsCard title="Recent designs" style={{ marginBottom: 14 }}>
          {recent.length === 0 ? (
            <BagsEmptyState
              title="No designs yet"
              description="Customer designs appear here after storefront editor sessions and checkout."
              action={
                <Link to="/app/designs" className="bags-admin-btn primary">
                  Browse designs
                </Link>
              }
            />
          ) : (
            <>
            <BagsTableWrap>
              <table className="bags-admin-table">
                <thead>
                  <tr>
                    <th>Design</th>
                    <th>Workflow</th>
                    <th>Status</th>
                    <th>Job</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link to={`/app/designs/${row.id}`}>
                          {row.name || row.id.slice(0, 12) + "…"}
                        </Link>
                      </td>
                      <td>
                        {row.workflow === "gang_sheet" ? "Gang sheet" : "Upload by Size"}
                      </td>
                      <td>
                        <BagsStatusBadge status={row.status} />
                      </td>
                      <td>
                        {row.jobStatus ? <BagsStatusBadge status={row.jobStatus} /> : "—"}
                      </td>
                      <td>{new Date(row.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </BagsTableWrap>
              <div className="bags-admin-actions" style={{ marginTop: 12 }}>
                <Link to="/app/designs" className="bags-admin-btn primary sm">
                  View all designs
                </Link>
              </div>
            </>
          )}
        </BagsCard>
        </BagsPageBody>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
