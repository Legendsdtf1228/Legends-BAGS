import { Form, Link } from "react-router";
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
  BagsSectionHeader,
  BagsDateRange,
} from "./bags-admin-ui";

export type DashboardRange = "today" | "7d" | "30d" | "90d" | "all";

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export type BagsDashboardPageProps = {
  range: DashboardRange;
  loadError: string | null;
  stats: {
    designCount: number;
    orderedDesigns: number;
    orderLinks: number;
    completedRenders: number;
    failedRenders: number;
    grossRevenueCents: number;
    bindings: number;
    storageBytes: number;
    queuedJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    stuckJobs: number;
    workflowCounts: Record<string, number>;
  };
  recent: Array<{
    id: string;
    name: string | null;
    workflow: string;
    status: string;
    jobStatus: string | null;
    updatedAt: string;
  }>;
  recentOrders: Array<{
    orderId: string;
    lineCount: number;
    renderStatus: string;
    createdAt: string;
  }>;
};

export function BagsDashboardPage(props: BagsDashboardPageProps) {
  const { stats, recent, recentOrders, range, loadError } = props;

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
        title="Dashboard"
        subtitle="Your designs, orders and production at a glance."
        actions={
          <>
            <Link to="/app/setup" className="bags-admin-btn ghost">
              Store setup
            </Link>
            <Link to="/app/designs" className="bags-admin-btn primary">
              View designs <span aria-hidden>↗</span>
            </Link>
          </>
        }
      />
      <div className="bags-admin-content">
        <BagsPageBody>
          {loadError ? (
            <BagsAlert tone="danger" title="Dashboard unavailable">
              {loadError}
            </BagsAlert>
          ) : null}

          <BagsSectionHeader
            title="Shop overview"
            description="Activity for your selected period"
            actions={
              <Form method="get">
                <BagsDateRange value={range} options={RANGE_OPTIONS} />
              </Form>
            }
          />

          <div className="bags-admin-grid stats" style={{ marginBottom: 16 }}>
            <BagsStat label="Designs" value={stats.designCount} accent="orange" />
            <BagsStat label="Ordered sheets" value={stats.orderedDesigns} accent="blue" />
            <BagsStat label="Linked orders" value={stats.orderLinks} accent="blue" />
            <BagsStat label="Completed renders" value={stats.completedRenders} accent="green" />
            {stats.failedRenders > 0 ? (
              <BagsStat label="Failed renders" value={stats.failedRenders} accent="red" />
            ) : null}
            <BagsStat
              label="Revenue (designed)"
              value={`$${(stats.grossRevenueCents / 100).toFixed(2)}`}
              accent="purple"
            />
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
                  subtitle: "Manage your products and sheet options",
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
                  title: "Gang Sheet Builder",
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
              <div className="bags-workflow-grid">
                <div>
                  <strong>{stats.workflowCounts.gang_sheet ?? 0}</strong>
                  <span className="bags-admin-muted">Gang Sheet</span>
                </div>
                <div>
                  <strong>{stats.workflowCounts.upload_by_size ?? 0}</strong>
                  <span className="bags-admin-muted">Upload by Size</span>
                </div>
                <div>
                  <strong>{stats.workflowCounts.staff ?? 0}</strong>
                  <span className="bags-admin-muted">Staff-built</span>
                </div>
                <div>
                  <strong>{stats.workflowCounts.reorder ?? 0}</strong>
                  <span className="bags-admin-muted">Reorders</span>
                </div>
              </div>
            </BagsCard>

            <BagsCard title="Production queue">
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
                description="Orders linked to your designs will appear here when customers check out."
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
                        <td>
                          <BagsStatusBadge status={order.renderStatus} />
                        </td>
                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                        <td>
                          <Link to="/app/orders" className="bags-admin-btn ghost sm">
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
                          <td>{row.workflow === "gang_sheet" ? "Gang sheet" : "Upload by Size"}</td>
                          <td>
                            <BagsStatusBadge status={row.status} />
                          </td>
                          <td>{row.jobStatus ? <BagsStatusBadge status={row.jobStatus} /> : "—"}</td>
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
