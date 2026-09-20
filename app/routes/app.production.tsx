import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ensureShopConfig } from "../lib/merchant-loaders.server";
import { enqueueRenderJob, processNextRenderJob, recoverStuckJobs } from "../services/design-service";
import { BagsAlert, BagsCard, BagsPageBody, BagsPageHeader, BagsStatusBadge } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [config, jobs, counts] = await Promise.all([
    ensureShopConfig(session.shop),
    prisma.renderJob.findMany({
      where: { shop: session.shop, status: { in: ["queued", "processing", "failed"] } },
      include: { design: { select: { name: true } }, orderLink: { select: { orderNumber: true } } },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.renderJob.groupBy({
      by: ["status"],
      where: { shop: session.shop, status: { in: ["queued", "processing", "failed"] } },
      _count: { _all: true },
    }),
  ]);
  return {
    config,
    counts: Object.fromEntries(counts.map((row) => [row.status, row._count._all])),
    jobs: jobs.map((job) => ({
      id: job.id,
      designId: job.designId,
      designName: job.design.name,
      orderLinkId: job.orderLinkId,
      orderNumber: job.orderLink?.orderNumber ?? null,
      status: job.status,
      attempt: job.attempt,
      lastError: job.lastError,
      updatedAt: job.updatedAt.toISOString(),
      stale: job.status === "processing" && Boolean(job.leaseExpiresAt && job.leaseExpiresAt < new Date()),
    })),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");
  if (intent === "retry") {
    const jobId = String(form.get("jobId") || "");
    await recoverStuckJobs(new Date(), session.shop);
    const job = await prisma.renderJob.findFirst({ where: { id: jobId, shop: session.shop } });
    if (!job) return { saved: false, retried: false, error: "Production job not found." };
    if (!["failed", "queued"].includes(job.status)) {
      return { saved: false, retried: false, error: `This job is currently ${job.status}.` };
    }
    await enqueueRenderJob({
      shop: session.shop,
      designId: job.designId,
      ...(job.orderLinkId ? { orderLinkId: job.orderLinkId } : {}),
      ...(job.reprocessWidthIn ? { reprocessWidthIn: job.reprocessWidthIn } : {}),
    });
    if (process.env.RENDER_INLINE_ON_WEBHOOK === "1") await processNextRenderJob(session.shop);
    return { saved: false, retried: true, error: null };
  }
  if (intent !== "save") return { saved: false, retried: false, error: "Unsupported action." };
  const sheetWidthIn = Number(form.get("sheetWidthIn"));
  const maxHeightIn = Number(form.get("maxHeightIn"));
  const imageMarginIn = Number(form.get("imageMarginIn"));
  const artboardMarginIn = Number(form.get("artboardMarginIn"));
  if (![sheetWidthIn, maxHeightIn, imageMarginIn, artboardMarginIn].every(Number.isFinite) || sheetWidthIn <= 0 || maxHeightIn <= 0) {
    return { saved: false, retried: false, error: "Enter valid positive production dimensions." };
  }
  await prisma.shopConfig.update({
    where: { shop: session.shop },
    data: { sheetWidthIn, maxHeightIn, imageMarginIn, artboardMarginIn },
  });
  return { saved: true, retried: false, error: null };
};

export default function ProductionPage() {
  const { config, counts, jobs } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  return (
    <>
      <BagsPageHeader title="Production" subtitle="Printer-agnostic output defaults used by the BAGS render pipeline" actions={<Link to="/app/settings" className="bags-admin-btn ghost">Settings</Link>} />
      <div className="bags-admin-content"><BagsPageBody>
        {result?.saved ? <BagsAlert tone="success" title="Production settings saved">New jobs will use these shop defaults unless a product binding overrides them.</BagsAlert> : null}
        {result?.retried ? <BagsAlert tone="success" title="Production job queued">The render will be processed by the configured worker.</BagsAlert> : null}
        {result?.error ? <BagsAlert tone="danger" title="Check the form">{result.error}</BagsAlert> : null}
        <div className="bags-admin-grid two">
          <BagsCard title="Output geometry">
            <Form method="post" className="bags-admin-form bags-brand-form">
              <input type="hidden" name="intent" value="save" />
              <label>Usable sheet width (in)<input name="sheetWidthIn" type="number" min="1" step="0.1" required defaultValue={config?.sheetWidthIn ?? 22.5} /></label>
              <label>Maximum sheet height (in)<input name="maxHeightIn" type="number" min="1" step="1" required defaultValue={config?.maxHeightIn ?? 360} /></label>
              <label>Artwork spacing (in)<input name="imageMarginIn" type="number" min="0" step="0.01" required defaultValue={config?.imageMarginIn ?? 0.15} /></label>
              <label>Artboard margin (in)<input name="artboardMarginIn" type="number" min="0" step="0.01" required defaultValue={config?.artboardMarginIn ?? 0.1} /></label>
              <button type="submit" className="bags-admin-btn primary">Save production settings</button>
            </Form>
          </BagsCard>
          <BagsCard title="Output contract">
            <dl className="bags-definition-list">
              <div><dt>Format</dt><dd>Transparent PNG</dd></div>
              <div><dt>Resolution</dt><dd>300 DPI</dd></div>
              <div><dt>File access</dt><dd>Signed, private download</dd></div>
              <div><dt>Renderer</dt><dd>Legends-BAGS production pipeline</dd></div>
            </dl>
            <BagsAlert tone="info" title="Per-product overrides">
              Product bindings can override dimensions and pricing. These are safe shop defaults, not universal printer assumptions.
            </BagsAlert>
          </BagsCard>
        </div>
        <BagsCard title="Production queue" style={{ marginTop: 16 }}>
          <div className="bags-admin-actions" style={{ marginBottom: 12 }}>
            <BagsStatusBadge status={`queued ${counts.queued ?? 0}`} />
            <BagsStatusBadge status={`processing ${counts.processing ?? 0}`} />
            <BagsStatusBadge status={`failed ${counts.failed ?? 0}`} />
          </div>
          {jobs.length === 0 ? (
            <p className="bags-admin-muted">No queued, processing, or failed production jobs.</p>
          ) : (
            <table className="bags-admin-table">
              <thead><tr><th>Design / order</th><th>Status</th><th>Attempt</th><th>Updated</th><th>Action</th></tr></thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <Link to={`/app/designs/${job.designId}`}>{job.designName || job.designId.slice(0, 12)}</Link>
                      {job.orderLinkId ? <div><Link to={`/app/orders/${job.orderLinkId}`}>Order {job.orderNumber || "detail"}</Link></div> : null}
                      {job.lastError ? <small className="bags-field-error">{job.lastError}</small> : null}
                    </td>
                    <td><BagsStatusBadge status={job.stale ? "stale" : job.status} /></td>
                    <td>{job.attempt}</td>
                    <td>{new Date(job.updatedAt).toLocaleString()}</td>
                    <td>
                      {job.status === "failed" || job.stale ? (
                        <Form method="post">
                          <input type="hidden" name="intent" value="retry" />
                          <input type="hidden" name="jobId" value={job.id} />
                          <button type="submit" className="bags-admin-btn secondary">Retry</button>
                        </Form>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </BagsCard>
      </BagsPageBody></div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);