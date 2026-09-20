import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { enqueueRenderJob, processNextRenderJob, recoverStuckJobs } from "../services/design-service";
import { orderRowDownloadPath } from "../lib/order-download.server";
import { shopifyOrderAdminUrl } from "../lib/shopify-admin-links";
import { BagsAlert, BagsCard, BagsPageBody, BagsPageHeader, BagsStatusBadge } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const link = await prisma.orderLink.findFirst({
    where: { id: params.orderLinkId, shop: session.shop },
    include: { design: true, renderJobs: { orderBy: { updatedAt: "desc" } } },
  });
  if (!link) throw new Response("Order line not found", { status: 404 });
  const latest = link.renderJobs[0];
  const latestCompleted = link.renderJobs.find((job) => job.status === "completed" && job.outputKey);
  return {
    link: {
      id: link.id,
      orderId: link.orderId,
      orderNumber: link.orderNumber,
      lineItemId: link.lineItemId,
      designId: link.designId,
      designName: link.design.name,
      designVersion: link.designVersion,
      builderType: link.builderType,
      customerName: link.customerName,
      customerEmail: link.customerEmail,
      sheetWidthIn: link.sheetWidthIn,
      sheetHeightIn: link.sheetHeightIn,
      quantity: link.quantity,
      financialStatus: link.financialStatus,
      fulfillmentStatus: link.fulfillmentStatus,
      createdAt: link.createdAt.toISOString(),
    },
    job: latest ? { id: latest.id, status: latest.status, lastError: latest.lastError, widthPx: latest.widthPx, heightPx: latest.heightPx, updatedAt: latest.updatedAt.toISOString() } : null,
    downloadPath: orderRowDownloadPath(session.shop, latestCompleted?.outputKey),
    adminUrl: shopifyOrderAdminUrl(session.shop.replace(".myshopify.com", ""), link.orderId),
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") !== "retry") {
    return { retried: false, error: "Unsupported action." };
  }
  const link = await prisma.orderLink.findFirst({ where: { id: params.orderLinkId, shop: session.shop } });
  if (!link) throw new Response("Order line not found", { status: 404 });
  await recoverStuckJobs(new Date(), session.shop);
  const latest = await prisma.renderJob.findFirst({
    where: { shop: session.shop, orderLinkId: link.id },
    orderBy: { createdAt: "desc" },
  });
  if (latest && latest.status !== "failed") {
    return { retried: false, error: `A production render is already ${latest.status}.` };
  }
  await enqueueRenderJob({ shop: session.shop, designId: link.designId, orderLinkId: link.id });
  if (process.env.RENDER_INLINE_ON_WEBHOOK === "1") await processNextRenderJob(session.shop);
  return { retried: true, error: null };
};

export default function OrderDetailPage() {
  const { link, job, downloadPath, adminUrl } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const needsAttention = !job || job.status === "failed";
  return (
    <>
      <BagsPageHeader title={`Order ${link.orderNumber || link.orderId}`} subtitle="Production detail and linked customer project" actions={<Link to="/app/orders" className="bags-admin-btn ghost">All orders</Link>} />
      <div className="bags-admin-content"><BagsPageBody>
        {result?.retried ? <BagsAlert tone="success" title="Render queued">The production file is being regenerated.</BagsAlert> : null}
        {result?.error ? <BagsAlert tone="danger" title="Render not queued">{result.error}</BagsAlert> : null}
        {needsAttention ? <BagsAlert tone="warning" title="Production needs attention">{job?.lastError || "No production render has been created for this order line."}</BagsAlert> : null}
        <div className="bags-admin-grid two">
          <BagsCard title="Order">
            <dl className="bags-definition-list">
              <div><dt>Customer</dt><dd>{link.customerName || "Not available"}{link.customerEmail ? <small style={{ display: "block" }}>{link.customerEmail}</small> : null}</dd></div>
              <div><dt>Payment</dt><dd>{link.financialStatus ? <BagsStatusBadge status={link.financialStatus} /> : "—"}</dd></div>
              <div><dt>Fulfillment</dt><dd>{link.fulfillmentStatus ? <BagsStatusBadge status={link.fulfillmentStatus} /> : "Unfulfilled"}</dd></div>
              <div><dt>Quantity</dt><dd>{link.quantity}</dd></div>
              <div><dt>Created</dt><dd>{new Date(link.createdAt).toLocaleString()}</dd></div>
            </dl>
            <a href={adminUrl} target="_blank" rel="noreferrer" className="bags-admin-btn ghost">Open in Shopify</a>
          </BagsCard>
          <BagsCard title="Customer design">
            <dl className="bags-definition-list">
              <div><dt>Project</dt><dd><Link to={`/app/designs/${link.designId}`}>{link.designName || link.designId.slice(0, 12)}</Link></dd></div>
              <div><dt>Version</dt><dd>{link.designVersion}</dd></div>
              <div><dt>Builder</dt><dd>{link.builderType ? <BagsStatusBadge status={link.builderType} /> : "—"}</dd></div>
              <div><dt>Sheet</dt><dd>{link.sheetWidthIn && link.sheetHeightIn ? `${link.sheetWidthIn}″ × ${link.sheetHeightIn}″` : "Not recorded"}</dd></div>
            </dl>
          </BagsCard>
          <BagsCard title="Production output" style={{ gridColumn: "1 / -1" }}>
            <div className="bags-admin-actions">
              {job ? <BagsStatusBadge status={job.status} /> : <BagsStatusBadge status="missing" />}
              {job?.widthPx && job.heightPx ? <span className="bags-admin-muted">{job.widthPx} × {job.heightPx}px</span> : null}
              {downloadPath ? <a href={downloadPath} className="bags-admin-btn primary">Download production PNG</a> : null}
               {(!job || job.status === "failed") ? <Form method="post"><input type="hidden" name="intent" value="retry" /><button type="submit" className="bags-admin-btn secondary">{job?.status === "failed" ? "Retry render" : "Create production file"}</button></Form> : null}
            </div>
            {job?.lastError ? <p className="bags-field-error">{job.lastError}</p> : null}
          </BagsCard>
        </div>
      </BagsPageBody></div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);