import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { enqueueRenderJob, processNextRenderJob } from "../services/design-service";
import { shopifyOrderAdminUrl } from "../lib/shopify-admin-links";
import { BagsPageHeader, BagsCard, BagsStatusBadge } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const builder = url.searchParams.get("builder") ?? "";
  const payment = url.searchParams.get("payment") ?? "";
  const render = url.searchParams.get("render") ?? "";
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
      jobId: job?.id ?? null,
      paidAt: l.paidAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    };
  });

  if (render) {
    rows = rows.filter((r) => (r.renderStatus ?? "none") === render);
  }

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const store = session.shop.replace(".myshopify.com", "");

  return {
    q,
    builder,
    payment,
    render,
    page,
    pageCount: Math.max(1, Math.ceil(rows.length / pageSize)),
    total: rows.length,
    shop: session.shop,
    adminStore: store,
    rows: paged,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "retry-render") {
    const designId = String(form.get("designId") || "");
    const orderLinkId = String(form.get("orderLinkId") || "");
    if (!designId || !orderLinkId) return { error: "Missing render target" };

    const link = await prisma.orderLink.findFirst({
      where: { id: orderLinkId, shop: session.shop, designId },
    });
    if (!link) return { error: "Order line not found" };

    await enqueueRenderJob({ shop: session.shop, designId, orderLinkId: link.id });
    if (process.env.RENDER_INLINE_ON_WEBHOOK === "1") {
      await processNextRenderJob();
    }
    return { retried: true };
  }

  return null;
};

export default function OrdersPage() {
  const { rows, q, builder, payment, render, page, pageCount, total, adminStore } =
    useLoaderData<typeof loader>();

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
            <button type="submit" className="bags-admin-btn primary">
              Filter
            </button>
            {q || builder || payment || render ? (
              <Link to="/app/orders" className="bags-admin-btn ghost">
                Clear
              </Link>
            ) : null}
          </Form>

          <p className="bags-admin-muted" style={{ marginTop: 0 }}>
            {total} order line{total === 1 ? "" : "s"}
          </p>

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
                        {row.renderStatus ? <BagsStatusBadge status={row.renderStatus} /> : "—"}
                        {row.renderError ? (
                          <div className="bags-admin-muted" style={{ fontSize: 11 }}>
                            {row.renderError.slice(0, 80)}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {row.outputKey ? (
                          <Link to={`/api/downloads/${row.designId}?version=${row.designVersion}`}>
                            Download
                          </Link>
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
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pageCount > 1 ? (
                <div className="bags-admin-actions" style={{ marginTop: 12 }}>
                  {page > 1 ? (
                    <Link
                      to={`/app/orders?page=${page - 1}&q=${encodeURIComponent(q)}&builder=${builder}&payment=${payment}&render=${render}`}
                      className="bags-admin-btn ghost"
                    >
                      Previous
                    </Link>
                  ) : null}
                  <span className="bags-admin-muted">
                    Page {page} of {pageCount}
                  </span>
                  {page < pageCount ? (
                    <Link
                      to={`/app/orders?page=${page + 1}&q=${encodeURIComponent(q)}&builder=${builder}&payment=${payment}&render=${render}`}
                      className="bags-admin-btn ghost"
                    >
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
