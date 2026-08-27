import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  archiveStaffSheet,
  createStaffSheet,
  duplicateStaffSheet,
  enqueueRenderJob,
  listStaffSheets,
  processNextRenderJob,
  renameStaffSheet,
} from "../services/design-service";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

const SHEET_LENGTHS = [24, 36, 48, 60, 72, 84, 96, 108, 132, 150, 168, 192, 250];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim() ?? "";
  const sheets = await listStaffSheets(session.shop, search || undefined);
  return {
    shop: session.shop,
    appUrl: process.env.SHOPIFY_APP_URL || "",
    sheets,
    search,
    sheetLengths: SHEET_LENGTHS,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  try {
    if (intent === "create") {
      const name = String(form.get("name") || "");
      const sheetHeightIn = Number(form.get("sheetHeightIn") || 24);
      await createStaffSheet({ shop, name, sheetHeightIn });
      return { ok: true, message: "Shop sheet created." };
    }
    if (intent === "rename") {
      await renameStaffSheet(shop, String(form.get("designId")), String(form.get("name") || ""));
      return { ok: true, message: "Renamed." };
    }
    if (intent === "archive") {
      await archiveStaffSheet(shop, String(form.get("designId")));
      return { ok: true, message: "Sheet archived." };
    }
    if (intent === "duplicate") {
      await duplicateStaffSheet(shop, String(form.get("designId")));
      return { ok: true, message: "Duplicate created." };
    }
    if (intent === "generate") {
      const designId = String(form.get("designId"));
      await enqueueRenderJob({ shop, designId });
      await processNextRenderJob();
      return { ok: true, message: "Render job queued and processed." };
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Action failed" };
  }

  return null;
};

export default function ShopBuilderPage() {
  const { shop, appUrl, sheets, search, sheetLengths } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  function editorUrl(designId: string) {
    const u = new URL("/editor/gang-sheet", appUrl || "http://localhost");
    u.searchParams.set("shop", shop);
    u.searchParams.set("designId", designId);
    u.searchParams.set("embedded", "1");
    return u.toString();
  }

  return (
    <>
      <BagsPageHeader
        title="Shop Builder"
        subtitle="Staff gang sheets — build, generate, and download without a customer cart"
      />
      <div className="bags-admin-content">
        {actionData?.message ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted" role="status">
              {actionData.message}
            </p>
          </BagsCard>
        ) : null}

        <BagsCard title="Create blank sheet">
          <Form method="post" className="bags-admin-form" style={{ display: "grid", gap: 10, maxWidth: 480 }}>
            <input type="hidden" name="intent" value="create" />
            <label>
              Sheet name
              <input name="name" type="text" placeholder="e.g. Friday restock — logos" required />
            </label>
            <label>
              Sheet length (in)
              <select name="sheetHeightIn" defaultValue="24">
                {sheetLengths.map((inches) => (
                  <option key={inches} value={inches}>
                    22.5 × {inches}″
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Create shop sheet
            </button>
          </Form>
        </BagsCard>

        <BagsCard title="Staff sheets" style={{ marginTop: 16 }}>
          <Form method="get" className="bags-admin-actions" style={{ marginBottom: 12 }}>
            <input name="q" type="search" placeholder="Search…" defaultValue={search} />
            <button type="submit" className="bags-admin-btn ghost">
              Search
            </button>
          </Form>

          {sheets.length === 0 ? (
            <p className="bags-admin-muted">No staff sheets yet. Create one above to get started.</p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Name</th>
                  <th>Sheet</th>
                  <th>Pieces</th>
                  <th>Job</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map((sheet) => (
                  <tr key={sheet.id}>
                    <td>
                      {sheet.previewPath ? (
                        <img src={sheet.previewPath} alt="" style={{ width: 48, height: 48, objectFit: "contain" }} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <strong>{sheet.name || "Untitled"}</strong>
                      <div style={{ fontSize: 11, opacity: 0.65 }}>{sheet.id.slice(0, 12)}…</div>
                    </td>
                    <td>{sheet.sheetLabel || "—"}</td>
                    <td>{sheet.pieceCount}</td>
                    <td>{sheet.jobStatus ?? "—"}</td>
                    <td>{new Date(sheet.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className="bags-admin-actions">
                        {appUrl ? (
                          <a
                            href={editorUrl(sheet.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="bags-admin-btn ghost"
                          >
                            Edit
                          </a>
                        ) : null}
                        {sheet.downloadPath ? (
                          <a href={sheet.downloadPath} className="bags-admin-btn primary">
                            Download
                          </a>
                        ) : (
                          <Form method="post">
                            <input type="hidden" name="intent" value="generate" />
                            <input type="hidden" name="designId" value={sheet.id} />
                            <button type="submit" className="bags-admin-btn secondary">
                              Generate
                            </button>
                          </Form>
                        )}
                        <Form method="post">
                          <input type="hidden" name="intent" value="duplicate" />
                          <input type="hidden" name="designId" value={sheet.id} />
                          <button type="submit" className="bags-admin-btn ghost">
                            Duplicate
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="archive" />
                          <input type="hidden" name="designId" value={sheet.id} />
                          <button type="submit" className="bags-admin-btn ghost">
                            Archive
                          </button>
                        </Form>
                      </div>
                    </td>
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
