import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { enqueueRenderJob, processNextRenderJob, recoverStuckJobs } from "../services/design-service";
import { importRecentShopifyOrders } from "../services/shopify-order-sync.server";
import { shopifyOrderAdminUrl } from "../lib/shopify-admin-links";
import {
  filterOrderRowsByFulfillment,
  orderRowDownloadPath,
  parseFulfillmentFilter,
} from "../lib/order-download.server";
import { BagsPageHeader, BagsCard, BagsStatusBadge } from "../components/merchant/bags-admin-ui";

function ordersListHref(params: {
  page?: number;
  q: string;
  builder: string;
  payment: string;
  render: string;
  fulfillment: string;
}) {
  const usp = new URLSearchParams();
  if (params.page && params.page > 1) usp.set("page", String(params.page));
  if (params.q) usp.set("q", params.q);
  if (params.builder) usp.set("builder", params.builder);
  if (params.payment) usp.set("payment", params.payment);
  if (params.render) usp.set("render", params.render);
  if (params.fulfillment) usp.set("fulfillment", params.fulfillment);
  const qs = usp.toString();
  return qs ? `/app/orders?${qs}` : "/app/orders";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const builder = url.searchParams.get("builder") ?? "";
  const payment = url.searchParams.get("payment") ?? "";
  const render = url.searchParams.get("render") ?? "";
  const fulfillment = parseFulfillmentFilter(url.searchParams.get("fulfillment"));
  const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
  const pageSize = 25;

  const links = await prisma.orderLink.findMany({
    where: {
      shop: session.shop,
      ...(builder ? { builderType: builder } : {}),
      ...(payment ? { financialStatus: payment } : {}),
      ...(q
        ? {
            OR: [
              { orderId: { contains: q } },
              { orderNumber: { contains: q } },
              { designId: { contains: q } },
              { customerEmail: { contains: q } },
              { customerName: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const designIds = [...new Set(links.map((l) => l.designId))];
  const designs = await prisma.design.findMany({
    where: { id: { in: designIds } },
    select: { id: true, name: true, status: true, previewKey: true },
  });
  const byDesign = new Map(designs.map((d) => [d.id, d]));

  const jobs = await prisma.renderJob.findMany({
    where: { shop: session.shop, orderLinkId: { in: links.map((l) => l.id) } },
    orderBy: { updatedAt: "desc" },
  });
  const jobByOrderLink = new Map<string, (typeof jobs)[number]>();
  for (const j of jobs) {
    if (j.orderLinkId && !jobByOrderLink.has(j.orderLinkId)) {
      jobByOrderLink.set(j.orderLinkId, j);
    }
  }

  let rows = links.map((l) => {
    const job = jobByOrderLink.get(l.id);
    return {
      id: l.id,
      orderId: l.orderId,
      orderGid: l.orderGid,
      orderNumber: l.orderNumber,
      lineItemId: l.lineItemId,
      designId: l.designId,
      designVersion: l.designVersion,
      designName: byDesign.get(l.designId)?.name,
      designStatus: byDesign.get(l.designId)?.status,
      previewKey: byDesign.get(l.designId)?.previewKey,
      builderType: l.builderType,
      sheetWidthIn: l.sheetWidthIn,
      sheetHeightIn: l.sheetHeightIn,
      quantity: l.quantity,
      customerName: l.customerName,
      customerEmail: l.customerEmail,
      financialStatus: l.financialStatus,
      fulfillmentStatus: l.fulfillmentStatus,
      renderStatus: job?.status ?? null,
      renderError: job?.lastError ?? null,
      outputKey: job?.outputKey ?? null,
      downloadPath: orderRowDownloadPath(session.shop, job?.outputKey),
      jobId: job?.id ?? null,
      paidAt: l.paidAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    };
  });

  if (render) {
    rows = rows.filter((r) => (r.renderStatus ?? "none") === render);
  }
  rows = filterOrderRowsByFulfillment(rows, fulfillment);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const store = session.shop.replace(".myshopify.com", "");
  const shopConfig = await prisma.shopConfig.findUnique({ where: { shop: session.shop } });

  return {
    q,
    builder,
    payment,
    render,
    fulfillment,
    page,
    pageCount: Math.max(1, Math.ceil(rows.length / pageSize)),
    total: rows.length,
    shop: session.shop,
    adminStore: store,
    lastOrderSyncAt: shopConfig?.lastOrderSyncAt?.toISOString() ?? null,
    lastOrderSyncError: shopConfig?.lastOrderSyncError ?? null,
    rows: paged,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "import-orders") {
    try {
      const result = await importRecentShopifyOrders({ shop: session.shop, admin });
      return { imported: result.imported, skipped: result.skipped };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Order import failed";
      await prisma.shopConfig.upsert({
        where: { shop: session.shop },
        create: { shop: session.shop, lastOrderSyncError: message },
        update: { lastOrderSyncError: message },
      });
      return { error: message };
    }
  }

  if (intent === "retry-render") {
    const designId = String(form.get("designId") || "");
    const orderLinkId = String(form.get("orderLinkId") || "");
    if (!designId || !orderLinkId) return { error: "Missing render target" };

    const link = await prisma.orderLink.findFirst({
      where: { id: orderLinkId, shop: session.shop, designId },
    });
    if (!link) return { error: "Order line not found" };

    await recoverStuckJobs(new Date(), session.shop);
    const latest = await prisma.renderJob.findFirst({
      where: { shop: session.shop, orderLinkId: link.id },
      orderBy: { createdAt: "desc" },
    });
    if (latest && latest.status !== "failed") {
      return { error: `A production render is already ${latest.status}.` };
    }
    await enqueueRenderJob({ shop: session.shop, designId, orderLinkId: link.id });
    if (process.env.RENDER_INLINE_ON_WEBHOOK === "1") {
      await processNextRenderJob(session.shop);
    }
    return { retried: true };
  }

  return null;
};

export default function OrdersPage() {
  const {
    rows,
    q,
    builder,
    payment,
    render,
    fulfillment,
    page,
    pageCount,
    total,
    adminStore,
    lastOrderSyncAt,
    lastOrderSyncError,
  } = useLoaderData<typeof loader>();
  const listHref = (pageNum?: number) =>
    ordersListHref({ page: pageNum, q, builder, payment, render, fulfillment });

  return (
    <>
      <BagsPageHeader title="Orders" subtitle="Synchronized Shopify orders with Legends BAGS designs" />
      <div className="bags-admin-content">
        <BagsCard>
          <Form method="get" className="bags-admin-actions" style={{ marginBottom: 16, flexWrap: "wrap" }}>
            <input
              name="q"
              type="search"
              placeholder="Order #, customer, design ID…"
              defaultValue={q}
            />
            <select name="builder" defaultValue={builder}>
              <option value="">All builders</option>
              <option value="upload_by_size">Upload by Size</option>
              <option value="gang_sheet">Gang Sheet</option>
            </select>
            <select name="payment" defaultValue={payment}>
              <option value="">All payment</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
            <select name="render" defaultValue={render}>
              <option value="">All render</option>
              <option value="completed">Completed</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
            <select name="fulfillment" defaultValue={fulfillment}>
              <option value="">All fulfillment</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="unfulfilled">Unfulfilled</option>
              <option value="unknown">Unknown</option>
            </select>
            <button type="submit" className="bags-admin-btn primary">
              Filter
            </button>
            {q || builder || payment || render || fulfillment ? (
              <Link to="/app/orders" className="bags-admin-btn ghost">
                Clear
              </Link>
            ) : null}
          </Form>

          <p className="bags-admin-muted" style={{ marginTop: 0 }}>
            {total} order line{total === 1 ? "" : "s"}
            {lastOrderSyncAt
              ? ` · Last import ${new Date(lastOrderSyncAt).toLocaleString()}`
              : " · Import recent orders to backfill missed webhooks"}
          </p>
          {lastOrderSyncError ? (
            <p style={{ color: "#b42318", margin: "0 0 12px" }}>{lastOrderSyncError}</p>
          ) : null}
          <Form method="post" style={{ marginBottom: 16 }}>
            <input type="hidden" name="intent" value="import-orders" />
            <button type="submit" className="bags-admin-btn secondary">
              Import recent orders
            </button>
          </Form>

          {rows.length === 0 ? (
            <p className="bags-admin-muted">
              No synchronized orders yet. Complete a dev-store checkout to test the pipeline.
            </p>
          ) : (
            <>
              <table className="bags-admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Design</th>
                    <th>Builder</th>
                    <th>Sheet</th>
                    <th>Qty</th>
                    <th>Payment</th>
                    <th>Fulfillment</th>
                    <th>Render</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <a
                          href={shopifyOrderAdminUrl(adminStore, row.orderId)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.orderNumber || row.orderId}
                        </a>
                        <div><Link to={`/app/orders/${row.id}`}>Production detail</Link></div>
                        <div style={{ fontSize: 11 }}>v{row.designVersion}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {row.customerName || "—"}
                        {row.customerEmail ? (
                          <div className="bags-admin-muted">{row.customerEmail}</div>
                        ) : null}
                      </td>
                      <td>
                        <Link to={`/app/designs/${row.designId}`}>
                          {row.designName || row.designId.slice(0, 10) + "…"}
                        </Link>
                      </td>
                      <td>
                        {row.builderType ? <BagsStatusBadge status={row.builderType} /> : "—"}
                      </td>
                      <td>
                        {row.sheetWidthIn != null && row.sheetHeightIn != null
                          ? `${row.sheetWidthIn}″ × ${row.sheetHeightIn}″`
                          : "—"}
                      </td>
                      <td>{row.quantity}</td>
                      <td>
                        {row.financialStatus ? (
                          <BagsStatusBadge status={row.financialStatus} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {row.fulfillmentStatus ? (
                          <BagsStatusBadge status={row.fulfillmentStatus} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {row.renderStatus ? <BagsStatusBadge status={row.renderStatus} /> : "—"}
                        {row.renderError ? (
                          <div className="bags-admin-muted" style={{ fontSize: 11 }}>
                            {row.renderError.slice(0, 80)}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {row.downloadPath ? (
                          <a href={row.downloadPath}>Download</a>
                        ) : row.renderStatus === "failed" ? (
                          <Form method="post" style={{ display: "inline" }}>
                            <input type="hidden" name="intent" value="retry-render" />
                            <input type="hidden" name="designId" value={row.designId} />
                            <input type="hidden" name="orderLinkId" value={row.id} />
                            <button type="submit" className="bags-admin-btn ghost">
                              Retry
                            </button>
                          </Form>
                        ) : (
                          <span className="bags-admin-muted">Not ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pageCount > 1 ? (
                <div className="bags-admin-actions" style={{ marginTop: 12 }}>
                  {page > 1 ? (
                    <Link to={listHref(page - 1)} className="bags-admin-btn ghost">
                      Previous
                    </Link>
                  ) : null}
                  <span className="bags-admin-muted">
                    Page {page} of {pageCount}
                  </span>
                  {page < pageCount ? (
                    <Link to={listHref(page + 1)} className="bags-admin-btn ghost">
                      Next
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
