import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useLoaderData, useActionData } from "react-router";
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
  EditorTryCard,
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
  const { shop, appUrl, editors, config, stats, recent, recentOrders, range, loadError } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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
        subtitle={`Legends BAGS operations dashboard · ${shop}`}
        actions={
          <Link to="/app/setup" className="bags-admin-btn primary">
            Setup & install
          </Link>
        }
      />
      <div className="bags-admin-content">
        {loadError ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p style={{ color: "#b42318", margin: 0 }}>{loadError}</p>
          </BagsCard>
        ) : null}

        <Form method="get" className="bags-admin-actions" style={{ marginBottom: 16 }}>
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

        <div className="bags-admin-grid two" style={{ marginBottom: 16 }}>
          <BagsCard title="Usage by workflow">
            <ul className="bags-admin-muted" style={{ margin: 0, paddingLeft: 18 }}>
              <li>Gang Sheet: {stats.workflowCounts.gang_sheet}</li>
              <li>Upload by Size: {stats.workflowCounts.upload_by_size}</li>
              <li>Image to Sheet: {stats.workflowCounts.image_to_sheet}</li>
              <li>Staff-built: {stats.workflowCounts.staff}</li>
              <li>Reorders: {stats.workflowCounts.reorder}</li>
            </ul>
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
            <ul className="bags-admin-muted" style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 12 }}>
              <li>Stuck: {stats.stuckJobs}</li>
              <li>
                Last webhook:{" "}
                {stats.lastWebhookAt
                  ? `${new Date(stats.lastWebhookAt).toLocaleString()} (${stats.lastWebhookTopic})`
                  : "—"}
              </li>
              <li>
                Last render:{" "}
                {stats.lastCompletedRenderAt
                  ? new Date(stats.lastCompletedRenderAt).toLocaleString()
                  : "—"}
              </li>
            </ul>
            <div className="bags-admin-actions" style={{ marginTop: 14 }}>
              <Link to="/app/designs?status=ordered" className="bags-admin-btn ghost">
                View ordered designs
              </Link>
            </div>
          </BagsCard>
        </div>

        <div className="bags-admin-grid two" style={{ marginBottom: 16 }}>
          <BagsCard title="Shop defaults">
            <p className="bags-admin-muted">
              ${config.pricePerSqIn.toFixed(3)}/in² · {config.sheetWidthIn}″ sheet width ·{" "}
              {config.maxHeightIn}″ max height · {config.imageMarginIn}″ image margin
            </p>
            <div className="bags-admin-actions" style={{ marginTop: 12 }}>
              <Link to="/app/general" className="bags-admin-btn ghost">
                General settings
              </Link>
              <Link to="/app/build-assign" className="bags-admin-btn ghost">
                Build & Assign
              </Link>
            </div>
            <p className="bags-admin-muted" style={{ marginTop: 14 }}>
              Editor base URL for theme blocks:
            </p>
            <code style={{ display: "block", marginTop: 6, wordBreak: "break-all", fontSize: 12 }}>
              {appUrl || "(Set SHOPIFY_APP_URL — run shopify app dev)"}
            </code>
          </BagsCard>
        </div>

        <EditorTryCard
          uploadBySizeUrl={editors.uploadBySize}
          gangSheetUrl={editors.gangSheet}
          style={{ marginBottom: 16 }}
        />

        <BagsCard title="Recent orders" style={{ marginBottom: 16 }}>
          {recentOrders.length === 0 ? (
            <p className="bags-admin-muted">No linked orders in this period.</p>
          ) : (
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
          )}
        </BagsCard>

        <BagsCard title="Recent designs" style={{ marginBottom: 16 }}>          {recent.length === 0 ? (
            <p className="bags-admin-muted">
              No designs yet. Use <Link to="/app/setup">Setup</Link> to create test products, then
              open a storefront editor and place an order.
            </p>
          ) : (
            <>
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
              <div className="bags-admin-actions" style={{ marginTop: 12 }}>
                <Link to="/app/designs" className="bags-admin-btn primary">
                  View all designs
                </Link>
              </div>
            </>
          )}
        </BagsCard>

        <BagsCard title="Developer tools">
          <p className="bags-admin-muted">
            Manually drain the render queue when testing without a background worker.
          </p>
          <Form method="post" className="bags-admin-actions" style={{ marginTop: 12 }}>
            <input type="hidden" name="intent" value="process_jobs" />
            <button type="submit" className="bags-admin-btn ghost">
              Process next render job
            </button>
          </Form>
          {actionData ? (
            <pre style={{ margin: "12px 0 0", fontSize: 12, overflow: "auto" }}>
              {JSON.stringify(actionData, null, 2)}
            </pre>
          ) : null}
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
