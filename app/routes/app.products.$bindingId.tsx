import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { BagsAlert, BagsCard, BagsPageBody, BagsPageHeader, BagsStatusBadge } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const binding = await prisma.productBinding.findFirst({ where: { id: params.bindingId, shop: session.shop } });
  if (!binding) throw new Response("Product binding not found", { status: 404 });
  return {
    binding: {
      ...binding,
      createdAt: binding.createdAt.toISOString(),
      updatedAt: binding.updatedAt.toISOString(),
      shopifyUpdatedAt: binding.shopifyUpdatedAt?.toISOString() ?? null,
    },
    studioEnabled: process.env.USE_STUDIO_BUILDER === "1",
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const builderType = String(form.get("builderType") || "");
  const sheetWidthIn = Number(form.get("sheetWidthIn"));
  const maxHeightIn = Number(form.get("maxHeightIn"));
  const sheetHeightRaw = String(form.get("sheetHeightIn") || "").trim();
  const priceRaw = String(form.get("pricePerSqIn") || "").trim();
  if (!["gang_sheet", "upload_by_size"].includes(builderType) || !Number.isFinite(sheetWidthIn) || !Number.isFinite(maxHeightIn) || sheetWidthIn <= 0 || maxHeightIn <= 0) {
    return { saved: false, error: "Enter valid builder dimensions and type." };
  }
  const existing = await prisma.productBinding.findFirst({ where: { id: params.bindingId, shop: session.shop } });
  if (!existing) throw new Response("Product binding not found", { status: 404 });
  await prisma.productBinding.update({
    where: { id: existing.id },
    data: {
      builderType,
      sheetWidthIn,
      maxHeightIn,
      sheetHeightIn: sheetHeightRaw ? Number(sheetHeightRaw) : null,
      pricePerSqIn: priceRaw ? Number(priceRaw) : null,
      imageMarginIn: Number(form.get("imageMarginIn") || 0.15),
      artboardMarginIn: Number(form.get("artboardMarginIn") || 0.1),
      syncStatus: "manual",
    },
  });
  return { saved: true, error: null };
};

export default function ProductBindingDetailPage() {
  const { binding, studioEnabled } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  return (
    <>
      <BagsPageHeader title={binding.productTitle || "Builder product"} subtitle="Configure how this Shopify product launches the customer builder" actions={<Link to="/app/products" className="bags-admin-btn ghost">All products</Link>} />
      <div className="bags-admin-content"><BagsPageBody>
        {result?.saved ? <BagsAlert tone="success" title="Configuration saved">Customer launches will use the updated product binding.</BagsAlert> : null}
        {result?.error ? <BagsAlert tone="danger" title="Check the form">{result.error}</BagsAlert> : null}
        <div className="bags-admin-grid two">
          <BagsCard title="Builder configuration">
            <Form method="post" className="bags-admin-form bags-brand-form">
              <label>Builder mode<select name="builderType" defaultValue={binding.builderType}><option value="gang_sheet">Gang Sheet Studio</option><option value="upload_by_size">Upload by Size</option></select></label>
              <div className="bags-admin-grid two">
                <label>Sheet width (in)<input name="sheetWidthIn" type="number" min="1" step="0.1" required defaultValue={binding.sheetWidthIn ?? 22.5} /></label>
                <label>Maximum length (in)<input name="maxHeightIn" type="number" min="1" step="1" required defaultValue={binding.maxHeightIn ?? 360} /></label>
                <label>Fixed sheet length (optional)<input name="sheetHeightIn" type="number" min="1" step="0.1" defaultValue={binding.sheetHeightIn ?? ""} /></label>
                <label>Price per in² (optional)<input name="pricePerSqIn" type="number" min="0" step="0.001" defaultValue={binding.pricePerSqIn ?? ""} /></label>
                <label>Artwork spacing (in)<input name="imageMarginIn" type="number" min="0" step="0.01" defaultValue={binding.imageMarginIn ?? 0.15} /></label>
                <label>Artboard margin (in)<input name="artboardMarginIn" type="number" min="0" step="0.01" defaultValue={binding.artboardMarginIn ?? 0.1} /></label>
              </div>
              <button type="submit" className="bags-admin-btn primary">Save product configuration</button>
            </Form>
          </BagsCard>
          <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
            <BagsCard title="Launch readiness">
              <dl className="bags-definition-list">
                <div><dt>Shopify product</dt><dd><BagsStatusBadge status={binding.productStatus || "configured"} /></dd></div>
                <div><dt>Binding</dt><dd><BagsStatusBadge status="configured" /></dd></div>
                <div><dt>Studio bridge</dt><dd><BagsStatusBadge status={studioEnabled ? "connected" : "missing"} /></dd></div>
                <div><dt>Variant</dt><dd>{binding.variantTitle || "All variants"}</dd></div>
              </dl>
              {!studioEnabled && binding.builderType === "gang_sheet" ? <BagsAlert tone="warning" title="Bridge disabled">The binding is saved, but Gang Sheet Studio launches require the approved development bridge flag.</BagsAlert> : null}
            </BagsCard>
            <BagsCard title="Responsibility boundary">
              <p className="bags-admin-muted">Legends-BAGS configures and launches the builder. Gang Sheet Studio owns the customer canvas, uploads, sizing, Auto Build, and artwork tools.</p>
            </BagsCard>
          </div>
        </div>
      </BagsPageBody></div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);