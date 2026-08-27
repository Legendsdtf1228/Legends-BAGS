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
  return { appearance: await getShopAppearance(session.shop) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") !== "save") return null;

  await updateShopAppearance(session.shop, {
    podEnabled: form.get("podEnabled") === "1",
    podProviderNotes: String(form.get("podProviderNotes") || "") || null,
  });
  return { saved: true };
};

export default function PodPage() {
  const { appearance } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader title="POD" subtitle="Print on Demand module configuration" />
      <div className="bags-admin-content">
        <BagsCard title="Print on Demand">
          <p className="bags-admin-muted">
            Live BAGS exposes POD but Legends store had no active POD configuration during audit. Enable
            here when you connect a provider (Printful, Printify, custom API).
          </p>
          <Form method="post" className="bags-admin-form" style={{ display: "grid", gap: 12, maxWidth: 520, marginTop: 12 }}>
            <input type="hidden" name="intent" value="save" />
            <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                name="podEnabled"
                value="1"
                defaultChecked={appearance.podEnabled}
              />
              Enable POD module (placeholder — no provider wired yet)
            </label>
            <label>
              Provider notes / integration plan
              <textarea
                name="podProviderNotes"
                rows={4}
                defaultValue={appearance.podProviderNotes ?? ""}
                placeholder="Which provider, SKUs, webhook endpoints…"
              />
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Save POD settings
            </button>
            {actionData?.saved ? (
              <p className="bags-admin-muted" role="status">
                POD settings saved.
              </p>
            ) : null}
          </Form>
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
