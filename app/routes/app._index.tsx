import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useLoaderData, useActionData } from "react-router";
import type { CSSProperties } from "react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { processNextRenderJob, recoverStuckJobs } from "../services/design-service";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  await prisma.shopConfig.upsert({
    where: { shop },
    create: { shop },
    update: {},
  });

  const config = await prisma.shopConfig.findUnique({ where: { shop } });

  const designs = await prisma.design.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const versionRows = await Promise.all(
    designs.map((d) =>
      prisma.designVersion.findUnique({
        where: {
          designId_version: { designId: d.id, version: d.currentVersion },
        },
      }),
    ),
  );

  const jobs = await prisma.renderJob.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const jobByDesign = new Map<string, (typeof jobs)[number]>();
  for (const j of jobs) {
    if (!jobByDesign.has(j.designId)) jobByDesign.set(j.designId, j);
  }

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
    rows: designs.map((d, i) => {
      const job = jobByDesign.get(d.id);
      let workflow = "upload_by_size";
      try {
        const parsed = JSON.parse(versionRows[i]?.stateJson ?? "{}") as {
          workflow?: string;
        };
        if (parsed.workflow) workflow = parsed.workflow;
      } catch {
        /* ignore */
      }
      return {
        id: d.id,
        status: d.status,
        workflow,
        updatedAt: d.updatedAt.toISOString(),
        jobStatus: job?.status ?? null,
        lastError: job?.lastError ?? null,
        widthPx: job?.widthPx ?? null,
        heightPx: job?.heightPx ?? null,
      };
    }),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  if (intent === "process_jobs") {
    const recovered = await recoverStuckJobs();
    const result = await processNextRenderJob();
    return { recovered, result };
  }
  if (intent === "save_config") {
    await prisma.shopConfig.update({
      where: { shop },
      data: {
        pricePerSqIn: parseFloat(String(form.get("pricePerSqIn") || "0.049")),
        sheetWidthIn: parseFloat(String(form.get("sheetWidthIn") || "22.5")),
        maxHeightIn: parseFloat(String(form.get("maxHeightIn") || "360")),
        imageMarginIn: parseFloat(String(form.get("imageMarginIn") || "0.15")),
        artboardMarginIn: parseFloat(String(form.get("artboardMarginIn") || "0.1")),
      },
    });
    return { savedConfig: true };
  }
  return null;
};

export default function GangSheetsDashboard() {
  const { shop, rows, appUrl, config } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <h1 style={h1}>Legends BAGS</h1>
          <p style={muted}>Merchant gang-sheet dashboard · {shop}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to="/app/setup" style={btnSecondary}>
            Setup product & theme
          </Link>
          <Form method="post">
            <input type="hidden" name="intent" value="process_jobs" />
            <button type="submit" style={btn}>
              Process next render job
            </button>
          </Form>
        </div>
      </header>

      {appUrl ? (
        <p style={muted}>
          Editor base URL for theme block: <code>{appUrl}</code>
        </p>
      ) : null}

      {actionData ? (
        <pre style={box}>{JSON.stringify(actionData, null, 2)}</pre>
      ) : null}

      <section style={{ ...box, marginBottom: 16 }}>
        <h2 style={h2}>Shop defaults</h2>
        <Form method="post" style={{ display: "grid", gap: 10, maxWidth: 420 }}>
          <input type="hidden" name="intent" value="save_config" />
          <label>
            Price per in²
            <input name="pricePerSqIn" type="number" step="0.001" defaultValue={config.pricePerSqIn} />
          </label>
          <label>
            Sheet width (in)
            <input name="sheetWidthIn" type="number" step="0.1" defaultValue={config.sheetWidthIn} />
          </label>
          <label>
            Max height (in)
            <input name="maxHeightIn" type="number" step="1" defaultValue={config.maxHeightIn} />
          </label>
          <label>
            Image margin (in)
            <input name="imageMarginIn" type="number" step="0.01" defaultValue={config.imageMarginIn} />
          </label>
          <label>
            Artboard margin (in)
            <input
              name="artboardMarginIn"
              type="number"
              step="0.01"
              defaultValue={config.artboardMarginIn}
            />
          </label>
          <button type="submit" style={btn}>
            Save shop config
          </button>
        </Form>
      </section>

      <section style={box}>
        <h2 style={h2}>Designs & processing</h2>
        <p style={muted}>
          Upload-by-Size and gang sheet designs from development checkouts.
        </p>
        {rows.length === 0 ? (
          <p>No designs yet. Use Setup to create the test product, then place a storefront order.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Design</th>
                  <th style={th}>Workflow</th>
                  <th style={th}>Status</th>
                  <th style={th}>Job</th>
                  <th style={th}>Output px</th>
                  <th style={th}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={td}>
                      <Link to={`/app/designs/${row.id}`}>{row.id}</Link>
                    </td>
                    <td style={td}>{row.workflow}</td>
                    <td style={td}>{row.status}</td>
                    <td style={td}>
                      {row.jobStatus ?? "—"}
                      {row.lastError ? (
                        <div style={{ color: "#8b1e1e", fontSize: 12 }}>
                          {row.lastError}
                        </div>
                      ) : null}
                    </td>
                    <td style={td}>
                      {row.widthPx && row.heightPx
                        ? `${row.widthPx}×${row.heightPx}`
                        : "—"}
                    </td>
                    <td style={td}>{row.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const page: CSSProperties = {
  padding: 24,
  maxWidth: 1100,
  margin: "0 auto",
  fontFamily: "system-ui, Segoe UI, sans-serif",
  color: "#1c1915",
};
const header: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  marginBottom: 16,
  flexWrap: "wrap",
};
const h1: CSSProperties = { margin: 0, fontSize: 28 };
const h2: CSSProperties = { margin: "0 0 8px", fontSize: 18 };
const muted: CSSProperties = { margin: "4px 0 0", opacity: 0.75 };
const box: CSSProperties = {
  border: "1px solid #d9d1c3",
  background: "#fffdf8",
  padding: 16,
  borderRadius: 8,
};
const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};
const th: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #d9d1c3",
  padding: "8px 6px",
};
const td: CSSProperties = {
  borderBottom: "1px solid #eee7da",
  padding: "8px 6px",
  verticalAlign: "top",
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
