import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { listShopFonts, updateShopFont } from "../services/font-service";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  try {
    return { fonts: await listShopFonts(session.shop), loadError: null as string | null };
  } catch (err) {
    return {
      fonts: [] as Awaited<ReturnType<typeof listShopFonts>>,
      loadError: err instanceof Error ? err.message : "Fonts are temporarily unavailable.",
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  try {
    if (intent === "toggle") {
      await updateShopFont(session.shop, String(form.get("fontId")), {
        enabled: form.get("enabled") === "1",
      });
      return { ok: true, message: "Font updated." };
    }
    if (intent === "default") {
      await updateShopFont(session.shop, String(form.get("fontId")), { isDefault: true });
      return { ok: true, message: "Default font set." };
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Update failed" };
  }
  return null;
};

export default function FontsPage() {
  const { fonts, loadError } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title="Fonts"
        subtitle="Enabled fonts for Text and Names & Numbers in the customer editor"
      />
      <div className="bags-admin-content">
        {loadError ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p style={{ color: "#b42318", margin: 0 }}>{loadError}</p>
            <p className="bags-admin-muted" style={{ margin: "8px 0 0" }}>
              Run <code>npm run setup</code>, then restart <code>shopify app dev</code>.
            </p>
          </BagsCard>
        ) : null}
        {actionData?.message ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted">{actionData.message}</p>
          </BagsCard>
        ) : null}
        <BagsCard title={`Available fonts (${fonts.length})`}>
          <table className="bags-admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Preview</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fonts.map((font) => (
                <tr key={font.id}>
                  <td>
                    <strong>{font.name}</strong>
                    {font.isDefault ? <div className="bags-admin-muted">Default</div> : null}
                  </td>
                  <td>{font.category}</td>
                  <td style={{ fontFamily: font.family }}>{font.previewText}</td>
                  <td>{font.enabled ? "Enabled" : "Disabled"}</td>
                  <td>
                    <div className="bags-admin-actions">
                      <Form method="post">
                        <input type="hidden" name="intent" value="toggle" />
                        <input type="hidden" name="fontId" value={font.id} />
                        <input type="hidden" name="enabled" value={font.enabled ? "0" : "1"} />
                        <button type="submit" className="bags-admin-btn ghost">
                          {font.enabled ? "Disable" : "Enable"}
                        </button>
                      </Form>
                      {!font.isDefault ? (
                        <Form method="post">
                          <input type="hidden" name="intent" value="default" />
                          <input type="hidden" name="fontId" value={font.id} />
                          <button type="submit" className="bags-admin-btn ghost">
                            Set default
                          </button>
                        </Form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="bags-admin-muted" style={{ marginTop: 12 }}>
            Custom font uploads require licensing acknowledgment and are not enabled in this sprint build.
            Production rendering uses the same font family as the editor preview.
          </p>
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
