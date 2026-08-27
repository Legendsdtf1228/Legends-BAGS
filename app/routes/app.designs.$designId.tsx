import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { signDownload } from "../domain/security/signed-urls";
import {
  enqueueRenderJob,
  getDesignState,
  processNextRenderJob,
} from "../services/design-service";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const designId = params.designId!;
  const { design, state } = await getDesignState(shop, designId);
  const jobs = await prisma.renderJob.findMany({
    where: { shop, designId },
    orderBy: { createdAt: "desc" },
  });

  const latest = jobs[0];
  let downloadPath: string | null = null;
  let previewPath: string | null = null;
  if (latest?.outputKey) {
    const { token } = signDownload({ shop, objectKey: latest.outputKey });
    downloadPath = `/api/files/download?token=${encodeURIComponent(token)}`;
  }
  if (latest?.previewKey) {
    const { token } = signDownload({ shop, objectKey: latest.previewKey });
    previewPath = `/api/files/download?token=${encodeURIComponent(token)}`;
  }

  const audits = await prisma.auditEvent.findMany({
    where: {
      shop,
      OR: [
        { entityType: "design", entityId: designId },
        { entityType: "render_job", entityId: { in: jobs.map((j) => j.id) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return {
    design: {
      id: design.id,
      name: design.name,
      status: design.status,
      version: design.currentVersion,
    },
    state,
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      attempt: j.attempt,
      lastError: j.lastError,
      widthPx: j.widthPx,
      heightPx: j.heightPx,
      sheetWidthIn: j.sheetWidthIn,
      sheetHeightIn: j.sheetHeightIn,
      reprocessWidthIn: j.reprocessWidthIn,
      createdAt: j.createdAt.toISOString(),
    })),
    audits: audits.map((a) => ({
      id: a.id,
      action: a.action,
      actorType: a.actorType,
      entityType: a.entityType,
      createdAt: a.createdAt.toISOString(),
      metaJson: a.metaJson,
    })),
    downloadPath,
    previewPath,
    defaultSheetWidth: state.sheet.widthIn,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const designId = params.designId!;
  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  if (intent === "retry") {
    await enqueueRenderJob({ shop, designId });
    await processNextRenderJob();
  }
  if (intent === "reprocess") {
    const raw = String(form.get("reprocessWidthIn") || "").trim();
    const reprocessWidthIn = raw ? Number.parseFloat(raw) : undefined;
    if (reprocessWidthIn !== undefined && (!Number.isFinite(reprocessWidthIn) || reprocessWidthIn <= 0)) {
      return { error: "Enter a valid sheet width in inches." };
    }
    await enqueueRenderJob({ shop, designId, reprocessWidthIn });
    await processNextRenderJob();
  }
  if (intent === "reorder") {
    const { duplicateDesignForReorder } = await import("../services/design-service");
    const copy = await duplicateDesignForReorder({
      shop,
      sourceDesignId: designId,
      name: `Reorder from ${designId.slice(0, 8)}`,
    });
    return { reorderDesignId: copy.design.id };
  }
  return null;
};

export default function DesignDetail() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title={data.design.name || `Design ${data.design.id.slice(0, 12)}…`}
        subtitle={`${data.design.status} · v${data.design.version} · ${data.state.workflow}`}
        actions={
          <Link to="/app/designs" className="bags-admin-btn ghost">
            ← All designs
          </Link>
        }
      />
      <div className="bags-admin-content">
        {actionData && "error" in actionData && actionData.error ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p style={{ color: "#b42318", margin: 0 }}>{actionData.error}</p>
          </BagsCard>
        ) : null}
        <BagsCard>
          <p className="bags-admin-muted">
            Area {data.state.pricing.areaSqIn.toFixed(3)} in² · $
            {(data.state.pricing.totalCents / 100).toFixed(2)} · {data.state.items.length} piece
            {data.state.items.length === 1 ? "" : "s"}
          </p>
          <div className="bags-admin-actions" style={{ margin: "12px 0 16px" }}>
            {data.previewPath ? (
              <a href={data.previewPath} className="bags-admin-btn ghost">
                Preview
              </a>
            ) : null}
            {data.downloadPath ? (
              <a href={data.downloadPath} className="bags-admin-btn primary">
                Download print PNG
              </a>
            ) : null}
            <Form method="post">
              <input type="hidden" name="intent" value="retry" />
              <button type="submit" className="bags-admin-btn secondary">
                Retry / regenerate
              </button>
            </Form>
            <Form method="post">
              <input type="hidden" name="intent" value="reorder" />
              <button type="submit" className="bags-admin-btn ghost">
                Reorder (new copy)
              </button>
            </Form>
          </div>

          <Form method="post" className="bags-admin-form" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}>
            <input type="hidden" name="intent" value="reprocess" />
            <label>
              Reprocess at width (in)
              <input
                name="reprocessWidthIn"
                type="number"
                step="0.1"
                min="1"
                defaultValue={data.defaultSheetWidth}
                style={{ width: 100 }}
              />
            </label>
            <button type="submit" className="bags-admin-btn ghost">
              Reprocess width
            </button>
          </Form>

          {data.previewPath ? (
            <img
              src={data.previewPath}
              alt="Sheet preview"
              style={{
                maxWidth: "100%",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background:
                  "linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0,0 10px,10px -10px 0",
              }}
            />
          ) : null}
        </BagsCard>

        <BagsCard title="Render jobs" style={{ marginTop: 16 }}>
          <ul className="bags-admin-muted">
            {data.jobs.map((j) => (
              <li key={j.id} style={{ marginBottom: 8 }}>
                <strong>{j.status}</strong> · attempt {j.attempt}
                {j.reprocessWidthIn ? ` · reprocess ${j.reprocessWidthIn}″` : ""}
                {j.widthPx ? ` · ${j.widthPx}×${j.heightPx}px` : ""}
                {j.sheetWidthIn ? ` · ${j.sheetWidthIn}×${j.sheetHeightIn} in` : ""}
                {j.lastError ? ` · ${j.lastError}` : ""}
                <div style={{ fontSize: 11 }}>{new Date(j.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </BagsCard>

        <BagsCard title="Audit history" style={{ marginTop: 16 }}>
          {data.audits.length === 0 ? (
            <p className="bags-admin-muted">No audit events yet.</p>
          ) : (
            <ul className="bags-admin-muted">
              {data.audits.map((a) => (
                <li key={a.id} style={{ marginBottom: 8 }}>
                  <strong>{a.action}</strong> · {a.actorType} · {a.entityType}
                  <div style={{ fontSize: 11 }}>{new Date(a.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
