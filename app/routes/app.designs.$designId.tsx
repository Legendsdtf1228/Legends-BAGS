import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useLoaderData } from "react-router";
import type { CSSProperties } from "react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { signDownload } from "../domain/security/signed-urls";
import {
  enqueueRenderJob,
  getDesignState,
  processNextRenderJob,
} from "../services/design-service";

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

  return {
    design: {
      id: design.id,
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
    })),
    downloadPath,
    previewPath,
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
  return (
    <div style={page}>
      <p>
        <Link to="/app">← Gang sheets</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>Design {data.design.id}</h1>
      <p>
        Status: <strong>{data.design.status}</strong> · Version{" "}
        {data.design.version}
      </p>
      <p>
        Area: {data.state.pricing.areaSqIn} in² · Price: $
        {(data.state.pricing.totalCents / 100).toFixed(2)}
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {data.previewPath ? (
          <a href={data.previewPath} style={btnSecondary}>
            Preview (signed)
          </a>
        ) : null}
        {data.downloadPath ? (
          <a href={data.downloadPath} style={btnSecondary}>
            Download print PNG (signed)
          </a>
        ) : null}
        <Form method="post">
          <input type="hidden" name="intent" value="retry" />
          <button type="submit" style={btn}>
            Retry / regenerate
          </button>
        </Form>
        <Form method="post">
          <input type="hidden" name="intent" value="reorder" />
          <button type="submit" style={btnSecondary}>
            Reorder (new copy)
          </button>
        </Form>
      </div>

      {data.previewPath ? (
        <img
          src={data.previewPath}
          alt="Sheet preview"
          style={{
            maxWidth: "100%",
            border: "1px solid #d9d1c3",
            background:
              "linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
          }}
        />
      ) : null}

      <h2>Jobs</h2>
      <ul>
        {data.jobs.map((j) => (
          <li key={j.id}>
            {j.id} — {j.status} (attempt {j.attempt})
            {j.widthPx ? ` · ${j.widthPx}×${j.heightPx}px` : ""}
            {j.sheetWidthIn
              ? ` · ${j.sheetWidthIn}×${j.sheetHeightIn} in`
              : ""}
            {j.lastError ? ` · ${j.lastError}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

const page: CSSProperties = {
  padding: 24,
  maxWidth: 900,
  margin: "0 auto",
  fontFamily: "system-ui, Segoe UI, sans-serif",
};
const btn: CSSProperties = {
  background: "#0f5c4c",
  color: "#f4fffb",
  border: 0,
  padding: "10px 14px",
  cursor: "pointer",
  borderRadius: 6,
  font: "inherit",
};
const btnSecondary: CSSProperties = {
  ...btn,
  background: "#1c1915",
  textDecoration: "none",
  display: "inline-block",
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
