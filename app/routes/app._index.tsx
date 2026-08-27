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
  const config = await ensureShopConfig(shop);
  const stats = await getHomeStats(shop);
  const recent = await listMerchantDesignRows(shop, { limit: 6 });

  return {
    shop,
    appUrl: process.env.SHOPIFY_APP_URL || "",
    editors: customerEditorUrls(shop, process.env.SHOPIFY_APP_URL || ""),
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
  const { shop, appUrl, editors, config, stats, recent } = useLoaderData<typeof loader>();
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
        subtitle={`Legends BAGS merchant dashboard · ${shop}`}
        actions={
          <Link to="/app/setup" className="bags-admin-btn primary">
            Setup & install
          </Link>
        }
      />
      <div className="bags-admin-content">
        <div className="bags-admin-grid stats" style={{ marginBottom: 16 }}>
          <BagsStat label="Active designs" value={stats.designCount} accent="orange" />
          <BagsStat label="Linked orders" value={stats.orderCount} accent="blue" />
          <BagsStat label="Queued jobs" value={stats.queuedJobs} accent="purple" />
          <BagsStat label="Completed renders" value={stats.completedJobs} accent="green" />
          {stats.failedJobs > 0 ? (
            <BagsStat label="Failed jobs" value={stats.failedJobs} accent="red" />
          ) : null}
          <BagsStat label="Product bindings" value={stats.bindings} accent="blue" />
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
          <BagsCard title="Render pipeline">
            <BagsPipeline
              rows={[
                { label: "Queued", value: stats.queuedJobs, max: pipelineMax },
                { label: "Processing", value: stats.processingJobs, max: pipelineMax },
                { label: "Completed", value: stats.completedJobs, max: pipelineMax },
                { label: "Failed", value: stats.failedJobs, max: pipelineMax },
              ]}
            />
            <div className="bags-admin-actions" style={{ marginTop: 14 }}>
              <Link to="/app/designs?status=ordered" className="bags-admin-btn ghost">
                View ordered designs
              </Link>
            </div>
          </BagsCard>

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

        <BagsCard title="Recent designs" style={{ marginBottom: 16 }}>
          {recent.length === 0 ? (
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
