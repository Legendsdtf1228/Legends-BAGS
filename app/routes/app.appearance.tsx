import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getShopAppearance, updateShopAppearance } from "../lib/shop-appearance.server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const appearance = await getShopAppearance(session.shop);
  return { appearance };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") !== "save") return null;

  await updateShopAppearance(session.shop, {
    accentColor: String(form.get("accentColor") || "#f97316"),
    accentColorDark: String(form.get("accentColorDark") || "#ea580c"),
    launcherOpenLabel: String(form.get("launcherOpenLabel") || ""),
    launcherEditLabel: String(form.get("launcherEditLabel") || ""),
    welcomeTitle: String(form.get("welcomeTitle") || ""),
    welcomeSubtitle: String(form.get("welcomeSubtitle") || ""),
  });
  return { saved: true };
};

export default function AppearancePage() {
  const { appearance } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader title="Appearance" subtitle="Editor branding, colors, and customer-facing labels" />
      <div className="bags-admin-content">
        <BagsCard title="Theme colors">
          <Form method="post" className="bags-admin-form" style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <input type="hidden" name="intent" value="save" />
            <label>
              Accent color
              <input name="accentColor" type="color" defaultValue={appearance.accentColor} />
            </label>
            <label>
              Accent dark
              <input name="accentColorDark" type="color" defaultValue={appearance.accentColorDark} />
            </label>
            <label>
              Launcher open label
              <input name="launcherOpenLabel" type="text" defaultValue={appearance.launcherOpenLabel} />
            </label>
            <label>
              Launcher edit label
              <input name="launcherEditLabel" type="text" defaultValue={appearance.launcherEditLabel} />
            </label>
            <label>
              Welcome title
              <input name="welcomeTitle" type="text" defaultValue={appearance.welcomeTitle} />
            </label>
            <label>
              Welcome subtitle
              <textarea name="welcomeSubtitle" rows={2} defaultValue={appearance.welcomeSubtitle} />
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Save appearance
            </button>
            {actionData?.saved ? (
              <p className="bags-admin-muted" role="status">
                Appearance saved — refresh the storefront editor to preview.
              </p>
            ) : null}
          </Form>
        </BagsCard>
        <BagsCard title="Preview" style={{ marginTop: 16 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: `linear-gradient(135deg, ${appearance.accentColor}22, #fff)`,
            }}
          >
            <strong style={{ color: appearance.accentColorDark }}>{appearance.welcomeTitle}</strong>
            <p className="bags-admin-muted">{appearance.welcomeSubtitle}</p>
            <button
              type="button"
              className="bags-admin-btn primary"
              style={{ background: appearance.accentColor }}
            >
              {appearance.launcherOpenLabel}
            </button>
          </div>
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
