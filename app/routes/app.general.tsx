import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useLoaderData, useActionData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { ensureShopConfig } from "../lib/merchant-loaders.server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const config = await ensureShopConfig(session.shop);
  return {
    config: config ?? {
      pricePerSqIn: 0.049,
      sheetWidthIn: 22.5,
      maxHeightIn: 360,
      imageMarginIn: 0.15,
      artboardMarginIn: 0.1,
    },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") !== "save_config") return null;

  await prisma.shopConfig.update({
    where: { shop: session.shop },
    data: {
      pricePerSqIn: parseFloat(String(form.get("pricePerSqIn") || "0.049")),
      sheetWidthIn: parseFloat(String(form.get("sheetWidthIn") || "22.5")),
      maxHeightIn: parseFloat(String(form.get("maxHeightIn") || "360")),
      imageMarginIn: parseFloat(String(form.get("imageMarginIn") || "0.15")),
      artboardMarginIn: parseFloat(String(form.get("artboardMarginIn") || "0.1")),
    },
  });
  return { saved: true };
};

export default function GeneralSettingsPage() {
  const { config } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader title="General" subtitle="Shop-wide defaults for all builder products" />
      <div className="bags-admin-content">
        <BagsCard title="Print & pricing defaults">
          <Form method="post" className="bags-admin-form" style={{ display: "grid", gap: 12, maxWidth: 420 }}>
            <input type="hidden" name="intent" value="save_config" />
            <label>
              Price per in² (USD)
              <input name="pricePerSqIn" type="number" step="0.001" defaultValue={config.pricePerSqIn} />
            </label>
            <label>
              Sheet width (in)
              <input name="sheetWidthIn" type="number" step="0.1" defaultValue={config.sheetWidthIn} />
            </label>
            <label>
              Max sheet height (in)
              <input name="maxHeightIn" type="number" step="1" defaultValue={config.maxHeightIn} />
            </label>
            <label>
              Image margin (in)
              <input name="imageMarginIn" type="number" step="0.01" defaultValue={config.imageMarginIn} />
            </label>
            <label>
              Artboard margin (in)
              <input name="artboardMarginIn" type="number" step="0.01" defaultValue={config.artboardMarginIn} />
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Save general settings
            </button>
            {actionData?.saved ? (
              <p className="bags-admin-muted" role="status">
                Settings saved.
              </p>
            ) : null}
          </Form>
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
