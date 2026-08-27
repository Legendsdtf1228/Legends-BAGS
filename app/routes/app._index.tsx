import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useLoaderData, useActionData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { processNextRenderJob, recoverStuckJobs } from "../services/design-service";
import { ensureShopConfig, listMerchantDesignRows } from "../lib/merchant-loaders.server";
import { getDashboardPayload, getDashboardStats, type DashboardRange } from "../lib/merchant-dashboard.server";
import { customerEditorUrls } from "../lib/editor-links.server";
import { BagsPageHeader, BagsCard, BagsStat, EditorTryCard } from "../components/merchant/bags-admin-ui";

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

  return (
    <>
      <BagsPageHeader
        title="Home"
        subtitle={`Operations dashboard · ${shop}`}
        actions={
          <>
            <Link to="/app/setup" className="bags-admin-btn ghost">
              Setup
            </Link>
            <Form method="post">
              <input type="hidden" name="intent" value="process_jobs" />
              <button type="submit" className="bags-admin-btn primary">
                Process next render job
              </button>
            </Form>
          </>
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
          <BagsStat label="Designs" value={stats.designCount} />
          <BagsStat label="Ordered sheets" value={stats.orderedDesigns} />
          <BagsStat label="Completed renders" value={stats.completedRenders} />
          <BagsStat label="Failed renders" value={stats.failedRenders} />
          <BagsStat label="Linked orders" value={stats.orderLinks} />
          <BagsStat label="Revenue (designed)" value={`$${(stats.grossRevenueCents / 100).toFixed(2)}`} />
          <BagsStat label="Product bindings" value={stats.bindings} />
          {stats.storageBytes ? (
            <BagsStat label="Storage" value={`${(stats.storageBytes / (1024 * 1024)).toFixed(1)} MB`} />
          ) : null}
        </div>

        <div className="bags-admin-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
          <BagsCard title="Usage by workflow">
            <ul className="bags-admin-muted" style={{ margin: 0, paddingLeft: 18 }}>
              <li>Gang Sheet: {stats.workflowCounts.gang_sheet}</li>
              <li>Upload by Size: {stats.workflowCounts.upload_by_size}</li>
              <li>Image to Sheet: {stats.workflowCounts.image_to_sheet}</li>
              <li>Staff-built: {stats.workflowCounts.staff}</li>
              <li>Reorders: {stats.workflowCounts.reorder}</li>
            </ul>
          </BagsCard>
          <BagsCard title="Pipeline health">
            <ul className="bags-admin-muted" style={{ margin: 0, paddingLeft: 18 }}>
              <li>Queued: {stats.queuedJobs}</li>
              <li>Processing: {stats.processingJobs}</li>
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
          </BagsCard>
        </div>

        <div className="bags-admin-grid" style={{ gridTemplateColumns: "1.2fr 1fr", marginBottom: 16 }}>
          <BagsCard title="Shop defaults">
            <p className="bags-admin-muted">
              ${config.pricePerSqIn.toFixed(3)}/in² · {config.sheetWidthIn}″ width · {config.maxHeightIn}″ max
              height · {config.imageMarginIn}″ image margin
            </p>
            <div className="bags-admin-actions" style={{ marginTop: 12 }}>
              <Link to="/app/general" className="bags-admin-btn ghost">
                Edit general settings
              </Link>
              <Link to="/app/image-to-sheet" className="bags-admin-btn ghost">
                Image to Sheet
              </Link>
              <Link to="/app/gangsheet-builder" className="bags-admin-btn ghost">
                Gangsheet Builder
              </Link>
            </div>
          </BagsCard>
          <BagsCard title="Editor base URL">
            <p className="bags-admin-muted">Paste into theme block settings on each builder product.</p>
            <code style={{ display: "block", marginTop: 8, wordBreak: "break-all", fontSize: 12 }}>
              {appUrl || "(Set SHOPIFY_APP_URL — run shopify app dev)"}
            </code>
          </BagsCard>
        </div>

        <EditorTryCard
          uploadBySizeUrl={editors.uploadBySize}
          gangSheetUrl={editors.gangSheet}
          style={{ marginBottom: 16 }}
        />

        {actionData ? (
          <BagsCard title="Job processor" style={{ marginBottom: 16 }}>
            <pre style={{ margin: 0, fontSize: 12, overflow: "auto" }}>
              {JSON.stringify(actionData, null, 2)}
            </pre>
          </BagsCard>
        ) : null}

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

        <BagsCard title="Recent designs">
          {recent.length === 0 ? (
            <p className="bags-admin-muted">
              No designs yet. Use <Link to="/app/setup">Setup</Link> to create test products, then place a
              storefront order.
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
                        <Link to={`/app/designs/${row.id}`}>{row.name || row.id.slice(0, 12) + "…"}</Link>
                      </td>
                      <td>{row.workflow}</td>
                      <td>{row.status}</td>
                      <td>{row.jobStatus ?? "—"}</td>
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
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
