import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { BagsAlert, BagsCard, BagsPageBody, BagsPageHeader, BagsStatusBadge } from "../components/merchant/bags-admin-ui";
import { merchantProductBuilderUrl } from "../lib/app-href";
import { resolveAppUrl } from "../lib/app-url.server";
import { studioBridgePresent } from "../lib/studio-builder.server";

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
    studioEnabled: studioBridgePresent(),
    openBuilderUrl: merchantProductBuilderUrl({
      appUrl: resolveAppUrl(),
      shop: session.shop,
      builderType: binding.builderType,
      productGid: binding.productGid,
      variantGid: binding.variantGid,
    }),
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");
  const existing = await prisma.productBinding.findFirst({ where: { id: params.bindingId, shop: session.shop } });
  if (!existing) throw new Response("Product binding not found", { status: 404 });

  if (intent === "unbind") {
    await prisma.productBinding.delete({ where: { id: existing.id } });
    return Response.redirect(new URL("/app/products?removed=1", request.url));
  }
  if (intent !== "save") return { saved: false, error: "Unsupported action." };

  const builderType = String(form.get("builderType") || "");
  const enabled = form.get("enabled") === "on";
  const sheetWidthIn = Number(form.get("sheetWidthIn"));
  const maxHeightIn = Number(form.get("maxHeightIn"));
  const sheetHeightRaw = String(form.get("sheetHeightIn") || "").trim();
  const priceRaw = String(form.get("pricePerSqIn") || "").trim();
  const variantPriceRaw = String(form.get("variantPrice") || "").trim();
  const imageMarginIn = Number(form.get("imageMarginIn"));
  const artboardMarginIn = Number(form.get("artboardMarginIn"));
  const sheetHeightIn = sheetHeightRaw ? Number(sheetHeightRaw) : null;
  const pricePerSqIn = priceRaw ? Number(priceRaw) : null;
  const variantPrice = variantPriceRaw ? Number(variantPriceRaw) : null;
  if (
    !["gang_sheet", "upload_by_size"].includes(builderType) ||
    ![sheetWidthIn, maxHeightIn, imageMarginIn, artboardMarginIn].every(Number.isFinite) ||
    sheetWidthIn <= 0 ||
    maxHeightIn <= 0 ||
    imageMarginIn < 0 ||
    artboardMarginIn < 0 ||
    (sheetHeightIn !== null && (!Number.isFinite(sheetHeightIn) || sheetHeightIn <= 0)) ||
    (pricePerSqIn !== null && (!Number.isFinite(pricePerSqIn) || pricePerSqIn < 0)) ||
    (variantPrice !== null && (!Number.isFinite(variantPrice) || variantPrice < 0))
  ) {
    return { saved: false, error: "Enter valid builder dimensions and type." };
  }
  if (enabled && builderType === "gang_sheet" && sheetHeightIn === null) {
    return { saved: false, error: "Set a fixed sheet length before enabling Gang Sheet Studio." };
  }
  await prisma.productBinding.update({
    where: { id: existing.id },
    data: {
      builderType,
      enabled,
      sheetWidthIn,
      maxHeightIn,
      sheetHeightIn,
      pricePerSqIn,
      variantPriceCents: variantPrice === null ? null : Math.round(variantPrice * 100),
      imageMarginIn,
      artboardMarginIn,
      syncStatus: "manual",
    },
  });
  return { saved: true, error: null };
};

export default function ProductBindingDetailPage() {
  const { binding, studioEnabled, openBuilderUrl } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const shopifyActive = !binding.productStatus || binding.productStatus === "ACTIVE";
  const configurationComplete =
    binding.builderType !== "gang_sheet" || Boolean(binding.sheetHeightIn);
  const launchReady =
    binding.enabled &&
    shopifyActive &&
    configurationComplete &&
    (binding.builderType !== "gang_sheet" || studioEnabled);
  return (
    <>
      <BagsPageHeader title={binding.productTitle || "Builder product"} subtitle="Configure how this Shopify product launches the customer builder" actions={<Link to="/app/products" className="bags-admin-btn ghost">All products</Link>} />
      <div className="bags-admin-content"><BagsPageBody>
        {result?.saved ? <BagsAlert tone="success" title="Configuration saved">Customer launches will use the updated product binding.</BagsAlert> : null}
        {result?.error ? <BagsAlert tone="danger" title="Check the form">{result.error}</BagsAlert> : null}
        <div className="bags-admin-grid two">
          <BagsCard title="Builder configuration">
            <Form method="post" className="bags-admin-form bags-brand-form">
              <input type="hidden" name="intent" value="save" />
              <label className="bags-admin-actions" style={{ justifyContent: "flex-start" }}>
                <input name="enabled" type="checkbox" defaultChecked={binding.enabled} />
                Enable the customer builder for this product
              </label>
              <label>Builder mode<select name="builderType" defaultValue={binding.builderType}><option value="gang_sheet">Gang Sheet Studio</option><option value="upload_by_size">Upload by Size</option></select></label>
              <div className="bags-admin-grid two">
                <label>Sheet width (in)<input name="sheetWidthIn" type="number" min="1" step="0.1" required defaultValue={binding.sheetWidthIn ?? 22.5} /></label>
                <label>Maximum length (in)<input name="maxHeightIn" type="number" min="1" step="1" required defaultValue={binding.maxHeightIn ?? 360} /></label>
                <label>Fixed sheet length (optional)<input name="sheetHeightIn" type="number" min="1" step="0.1" defaultValue={binding.sheetHeightIn ?? ""} /></label>
                <label>Price per in² (optional)<input name="pricePerSqIn" type="number" min="0" step="0.001" defaultValue={binding.pricePerSqIn ?? ""} /></label>
                <label>Fixed variant price USD (optional)<input name="variantPrice" type="number" min="0" step="0.01" defaultValue={binding.variantPriceCents != null ? (binding.variantPriceCents / 100).toFixed(2) : ""} /></label>
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
                <div><dt>Binding</dt><dd><BagsStatusBadge status={binding.enabled ? "enabled" : "disabled"} /></dd></div>
                <div><dt>Studio bridge</dt><dd><BagsStatusBadge status={studioEnabled ? "connected" : "missing"} /></dd></div>
                <div><dt>Launch status</dt><dd><BagsStatusBadge status={launchReady ? "ready" : "needs_attention"} /></dd></div>
                <div><dt>Variant</dt><dd>{binding.variantTitle || "All variants"}</dd></div>
              </dl>
              {!configurationComplete ? <BagsAlert tone="warning" title="Sheet length required">Set a fixed sheet length before enabling this Gang Sheet Studio product.</BagsAlert> : null}
              {!shopifyActive ? <BagsAlert tone="warning" title="Shopify product is not active">Activate the product in Shopify before launching the customer builder.</BagsAlert> : null}
              {!studioEnabled && binding.builderType === "gang_sheet" ? <BagsAlert tone="warning" title="Studio dist missing">Gang Sheet Studio files are not present under public/studio. Open Builder stays unavailable until the Studio dist is synced. The legacy /editor/gang-sheet route is fallback-only.</BagsAlert> : null}
              {studioEnabled ? (
                <div className="bags-admin-actions" style={{ marginTop: 12 }}>
                  <a href={openBuilderUrl} target="_blank" rel="noopener noreferrer" className="bags-admin-btn primary">
                    {binding.builderType === "gang_sheet" ? "Open Builder" : "Preview Builder"}
                  </a>
                </div>
              ) : null}
            </BagsCard>
            <BagsCard title="Remove connection">
              <p className="bags-admin-muted">Removing this binding disables builder launches for this variant. Existing designs and orders are preserved.</p>
              <Form method="post" onSubmit={(event) => { if (!window.confirm("Remove this product binding? Existing designs and orders will remain.")) event.preventDefault(); }}>
                <input type="hidden" name="intent" value="unbind" />
                <button type="submit" className="bags-admin-btn ghost">Remove product binding</button>
              </Form>
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