import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useLoaderData, useActionData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { processNextRenderJob, recoverStuckJobs } from "../services/design-service";
import { ensureShopConfig, getHomeStats, listMerchantDesignRows } from "../lib/merchant-loaders.server";
import { BagsPageHeader, BagsCard, BagsStat } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const config = await ensureShopConfig(shop);
  const stats = await getHomeStats(shop);
  const recent = await listMerchantDesignRows(shop, { limit: 6 });

  return {
    shop,
    appUrl: process.env.SHOPIFY_APP_URL || "",
    config: config ?? {
      pricePerSqIn: 0.049,
      sheetWidthIn: 22.5,
      maxHeightIn: 360,
      imageMarginIn: 0.15,
      artboardMarginIn: 0.1,
    },
    stats,
    recent,
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
  const { shop, appUrl, config, stats, recent } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title="Home"
        subtitle={`Welcome back · ${shop}`}
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
        <div className="bags-admin-grid stats" style={{ marginBottom: 16 }}>
          <BagsStat label="Active designs" value={stats.designCount} />
          <BagsStat label="Linked orders" value={stats.orderCount} />
          <BagsStat label="Queued jobs" value={stats.queuedJobs} />
          <BagsStat label="Completed renders" value={stats.completedJobs} />
          <BagsStat label="Product bindings" value={stats.bindings} />
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

        {actionData ? (
          <BagsCard title="Job processor" style={{ marginBottom: 16 }}>
            <pre style={{ margin: 0, fontSize: 12, overflow: "auto" }}>
              {JSON.stringify(actionData, null, 2)}
            </pre>
          </BagsCard>
        ) : null}

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
