import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ensureShopConfig } from "../lib/merchant-loaders.server";
import { BagsAlert, BagsCard, BagsPageBody, BagsPageHeader } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { config: await ensureShopConfig(session.shop) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const sheetWidthIn = Number(form.get("sheetWidthIn"));
  const maxHeightIn = Number(form.get("maxHeightIn"));
  const imageMarginIn = Number(form.get("imageMarginIn"));
  const artboardMarginIn = Number(form.get("artboardMarginIn"));
  if (![sheetWidthIn, maxHeightIn, imageMarginIn, artboardMarginIn].every(Number.isFinite) || sheetWidthIn <= 0 || maxHeightIn <= 0) {
    return { saved: false, error: "Enter valid positive production dimensions." };
  }
  await prisma.shopConfig.update({
    where: { shop: session.shop },
    data: { sheetWidthIn, maxHeightIn, imageMarginIn, artboardMarginIn },
  });
  return { saved: true, error: null };
};

export default function ProductionPage() {
  const { config } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  return (
    <>
      <BagsPageHeader title="Production" subtitle="Printer-agnostic output defaults used by the BAGS render pipeline" actions={<Link to="/app/settings" className="bags-admin-btn ghost">Settings</Link>} />
      <div className="bags-admin-content"><BagsPageBody>
        {result?.saved ? <BagsAlert tone="success" title="Production settings saved">New jobs will use these shop defaults unless a product binding overrides them.</BagsAlert> : null}
        {result?.error ? <BagsAlert tone="danger" title="Check the form">{result.error}</BagsAlert> : null}
        <div className="bags-admin-grid two">
          <BagsCard title="Output geometry">
            <Form method="post" className="bags-admin-form bags-brand-form">
              <label>Usable sheet width (in)<input name="sheetWidthIn" type="number" min="1" step="0.1" required defaultValue={config?.sheetWidthIn ?? 22.5} /></label>
              <label>Maximum sheet height (in)<input name="maxHeightIn" type="number" min="1" step="1" required defaultValue={config?.maxHeightIn ?? 360} /></label>
              <label>Artwork spacing (in)<input name="imageMarginIn" type="number" min="0" step="0.01" required defaultValue={config?.imageMarginIn ?? 0.15} /></label>
              <label>Artboard margin (in)<input name="artboardMarginIn" type="number" min="0" step="0.01" required defaultValue={config?.artboardMarginIn ?? 0.1} /></label>
              <button type="submit" className="bags-admin-btn primary">Save production settings</button>
            </Form>
          </BagsCard>
          <BagsCard title="Output contract">
            <dl className="bags-definition-list">
              <div><dt>Format</dt><dd>Transparent PNG</dd></div>
              <div><dt>Resolution</dt><dd>300 DPI</dd></div>
              <div><dt>File access</dt><dd>Signed, private download</dd></div>
              <div><dt>Renderer</dt><dd>Legends-BAGS production pipeline</dd></div>
            </dl>
            <BagsAlert tone="info" title="Per-product overrides">
              Product bindings can override dimensions and pricing. These are safe shop defaults, not universal printer assumptions.
            </BagsAlert>
          </BagsCard>
        </div>
      </BagsPageBody></div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);