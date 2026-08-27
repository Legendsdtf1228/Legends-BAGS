import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { listMerchantDesignRows } from "../lib/merchant-loaders.server";
import { BagsPageHeader, BagsCard, BagsStatusBadge } from "../components/merchant/bags-admin-ui";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const rows = await listMerchantDesignRows(session.shop, {
    q: url.searchParams.get("q")?.trim() ?? undefined,
    workflow: url.searchParams.get("workflow") || undefined,
    status: url.searchParams.get("status") || undefined,
    includeArchived: url.searchParams.get("archived") === "1",
  });

  return {
    rows,
    filters: {
      q: url.searchParams.get("q") ?? "",
      workflow: url.searchParams.get("workflow") ?? "",
      status: url.searchParams.get("status") ?? "",
      includeArchived: url.searchParams.get("archived") === "1",
    },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") !== "bulk-download") return null;

  const designIds = form.getAll("designId").map(String).filter(Boolean);
  if (!designIds.length) return { error: "Select at least one design." };

  const completed = await prisma.renderJob.count({
    where: {
      shop: session.shop,
      designId: { in: designIds },
      status: "completed",
      outputKey: { not: null },
    },
  });
  if (!completed) return { error: "Selected designs have no completed print files." };
  return { ok: true };
};

export default function DesignsPage() {
  const { rows, filters } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  return (
    <>
      <BagsPageHeader title="Designs" subtitle="Customer and staff designs · preview, download, reorder" />
      <div className="bags-admin-content">
        <BagsCard>
          {actionData && "error" in actionData && actionData.error ? (
            <p style={{ color: "#b42318", margin: "0 0 12px" }}>{actionData.error}</p>
          ) : null}
          <Form method="get" className="bags-admin-form bags-admin-actions" style={{ marginBottom: 16 }}>
            <input name="q" type="search" placeholder="Search name or ID…" defaultValue={filters.q} />
            <select name="workflow" defaultValue={filters.workflow}>
              <option value="">All workflows</option>
              <option value="gang_sheet">Gang sheet</option>
              <option value="upload_by_size">Image to Sheet</option>
            </select>
            <select name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="ordered">Ordered</option>
              <option value="completed">Completed</option>
            </select>
            <label style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <input type="checkbox" name="archived" value="1" defaultChecked={filters.includeArchived} />
              Archived
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Filter
            </button>
            {searchParams.toString() ? (
              <Link to="/app/designs" className="bags-admin-btn ghost">
                Clear
              </Link>
            ) : null}
          </Form>

          {rows.length ? (
            <Form
              method="post"
              action="/app/bulk-download"
              className="bags-admin-actions"
              style={{ marginBottom: 12 }}
            >
              <button type="button" className="bags-admin-btn ghost" onClick={toggleAll}>
                {selected.size === rows.length ? "Clear all" : "Select all"}
              </button>
              {selected.size ? (
                <>
                  {Array.from(selected).map((id) => (
                    <input key={id} type="hidden" name="designId" value={id} />
                  ))}
                  <button type="submit" className="bags-admin-btn primary">
                    Bulk download ({selected.size})
                  </button>
                </>
              ) : (
                <span className="bags-admin-muted">Select rows to bulk download print PNGs.</span>
              )}
            </Form>
          ) : null}

          {rows.length === 0 ? (
            <p className="bags-admin-muted">No designs match these filters.</p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }} />
                  <th>Preview</th>
                  <th>Design</th>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th>Job</th>
                  <th>Order</th>
                  <th>Output</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                        aria-label={`Select ${row.name || row.id}`}
                      />
                    </td>
                    <td>
                      {row.previewPath ? (
                        <img src={row.previewPath} alt="" style={{ width: 48, height: 48, objectFit: "contain" }} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Link to={`/app/designs/${row.id}`}>{row.name || row.id.slice(0, 12) + "…"}</Link>
                      {row.archived ? <div className="bags-admin-muted">Archived</div> : null}
                    </td>
                    <td>{row.workflow === "gang_sheet" ? "Gang sheet" : "Upload by Size"}</td>
                    <td>
                      <BagsStatusBadge status={row.status} />
                    </td>
                    <td>
                      {row.jobStatus ? <BagsStatusBadge status={row.jobStatus} /> : "—"}
                      {row.lastError ? (
                        <div style={{ color: "#b42318", fontSize: 12 }}>{row.lastError}</div>
                      ) : null}
                    </td>
                    <td>{row.orderId ?? "—"}</td>
                    <td>
                      {row.widthPx && row.heightPx ? `${row.widthPx}×${row.heightPx}` : "—"}
                    </td>
                    <td>{new Date(row.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
