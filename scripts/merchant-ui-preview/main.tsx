import { createRoot } from "react-dom/client";
import { createMemoryRouter, Link, RouterProvider, useLoaderData } from "react-router";
import { BagsAdminShell } from "../../app/components/merchant/bags-admin-shell";
import { BagsDashboardPage, type BagsDashboardPageProps } from "../../app/components/merchant/bags-dashboard-page";

const sample: BagsDashboardPageProps = {
  range: "30d",
  loadError: null,
  stats: {
    designCount: 128,
    orderedDesigns: 86,
    orderLinks: 42,
    completedRenders: 81,
    failedRenders: 2,
    grossRevenueCents: 426800,
    bindings: 6,
    storageBytes: 0,
    queuedJobs: 8,
    processingJobs: 3,
    completedJobs: 81,
    failedJobs: 2,
    stuckJobs: 0,
    workflowCounts: { gang_sheet: 74, upload_by_size: 36, staff: 12, reorder: 6 },
  },
  recentOrders: [
    { orderId: "1048", lineCount: 3, renderStatus: "completed", createdAt: "2026-09-17T10:00:00" },
    { orderId: "1047", lineCount: 2, renderStatus: "processing", createdAt: "2026-09-17T09:15:00" },
  ],
  recent: [
    {
      id: "sample1",
      name: "Fall team collection",
      workflow: "gang_sheet",
      status: "ordered",
      jobStatus: "completed",
      updatedAt: "2026-09-17T10:00:00",
    },
    {
      id: "sample2",
      name: "Shop logo transfers",
      workflow: "upload_by_size",
      status: "draft",
      jobStatus: null,
      updatedAt: "2026-09-17T09:00:00",
    },
  ],
};

const empty: BagsDashboardPageProps = {
  range: "30d",
  loadError: null,
  stats: {
    designCount: 0,
    orderedDesigns: 0,
    orderLinks: 0,
    completedRenders: 0,
    failedRenders: 0,
    grossRevenueCents: 0,
    bindings: 0,
    storageBytes: 0,
    queuedJobs: 0,
    processingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    stuckJobs: 0,
    workflowCounts: { gang_sheet: 0, upload_by_size: 0, staff: 0, reorder: 0 },
  },
  recentOrders: [],
  recent: [],
};

function PreviewBanner() {
  return (
    <div className="bags-ui-preview-banner">
      Local UI preview using sample data — not live shop metrics.
      <Link to="/app">Dashboard</Link>
      <Link to="/app?empty=1">Empty state</Link>
    </div>
  );
}

function dashboardLoader({ request }: { request: Request }): BagsDashboardPageProps {
  const url = new URL(request.url);
  const range = (url.searchParams.get("range") || "30d") as BagsDashboardPageProps["range"];
  const base = url.searchParams.get("empty") === "1" ? empty : sample;
  return { ...base, range };
}

function DashboardRoute() {
  const data = useLoaderData() as BagsDashboardPageProps;
  return (
    <>
      <PreviewBanner />
      <BagsAdminShell shop="preview-store.myshopify.com">
        <BagsDashboardPage {...data} />
      </BagsAdminShell>
    </>
  );
}

const router = createMemoryRouter(
  [
    { path: "/app", loader: dashboardLoader, Component: DashboardRoute },
    {
      path: "*",
      element: (
        <>
          <PreviewBanner />
          <BagsAdminShell shop="preview-store.myshopify.com">
            <div className="bags-admin-content" style={{ padding: 32 }}>
              <h1>Navigation destination</h1>
              <p>UI preview only. Live page content is not connected here.</p>
              <Link to="/app" className="bags-admin-btn primary">
                Back to dashboard
              </Link>
            </div>
          </BagsAdminShell>
        </>
      ),
    },
  ],
  { initialEntries: ["/app"] },
);

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(<RouterProvider router={router} />);
