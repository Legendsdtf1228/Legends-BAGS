import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  createFitCheckTemplate,
  duplicateFitCheckTemplate,
  listFitCheckTemplates,
  updateFitCheckTemplate,
} from "../services/fitcheck-service";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { templates: await listFitCheckTemplates(session.shop) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  try {
    if (intent === "create") {
      await createFitCheckTemplate(session.shop, {
        name: String(form.get("name") || ""),
        regionWidthIn: Number(form.get("regionWidthIn") || 10),
        regionHeightIn: Number(form.get("regionHeightIn") || 10),
        productGids: String(form.get("productGids") || ""),
      });
      return { ok: true, message: "Template created." };
    }
    if (intent === "archive") {
      await updateFitCheckTemplate(session.shop, String(form.get("templateId")), { archived: true });
      return { ok: true, message: "Template archived." };
    }
    if (intent === "duplicate") {
      await duplicateFitCheckTemplate(session.shop, String(form.get("templateId")));
      return { ok: true, message: "Template duplicated." };
    }
    if (intent === "toggle") {
      await updateFitCheckTemplate(session.shop, String(form.get("templateId")), {
        active: form.get("active") === "1",
      });
      return { ok: true, message: "Template updated." };
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Action failed" };
  }
  return null;
};

export default function FitCheckPage() {
  const { templates } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title="FitCheck Templates"
        subtitle="Rectangular printable regions for product preview (cylindrical wrap not enabled)"
      />
      <div className="bags-admin-content">
        {actionData?.message ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted">{actionData.message}</p>
          </BagsCard>
        ) : null}
        <BagsCard title="Create template">
          <Form method="post" className="bags-admin-form" style={{ display: "grid", gap: 10, maxWidth: 480 }}>
            <input type="hidden" name="intent" value="create" />
            <label>
              Name
              <input name="name" type="text" required placeholder="T-shirt front" />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label>
                Region width (in)
                <input name="regionWidthIn" type="number" step="0.1" defaultValue="10" />
              </label>
              <label>
                Region height (in)
                <input name="regionHeightIn" type="number" step="0.1" defaultValue="10" />
              </label>
            </div>
            <label>
              Product GIDs (comma-separated, optional)
              <input name="productGids" type="text" placeholder="gid://shopify/Product/…" />
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Create template
            </button>
          </Form>
        </BagsCard>
        <BagsCard title={`Templates (${templates.length})`} style={{ marginTop: 16 }}>
          {templates.length === 0 ? (
            <p className="bags-admin-muted">No templates yet.</p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Region</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>
                      {t.regionWidthIn}×{t.regionHeightIn}″ @ ({t.regionX}, {t.regionY})
                    </td>
                    <td style={{ fontSize: 11 }}>{t.productGids || "—"}</td>
                    <td>{t.active ? "Active" : "Inactive"}</td>
                    <td>
                      <div className="bags-admin-actions">
                        <Form method="post">
                          <input type="hidden" name="intent" value="toggle" />
                          <input type="hidden" name="templateId" value={t.id} />
                          <input type="hidden" name="active" value={t.active ? "0" : "1"} />
                          <button type="submit" className="bags-admin-btn ghost">
                            {t.active ? "Deactivate" : "Activate"}
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="duplicate" />
                          <input type="hidden" name="templateId" value={t.id} />
                          <button type="submit" className="bags-admin-btn ghost">
                            Duplicate
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="archive" />
                          <input type="hidden" name="templateId" value={t.id} />
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
