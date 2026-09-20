import { useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  DEFAULT_APPEARANCE,
  getShopAppearance,
  updateShopAppearance,
  validateShopAppearance,
} from "../lib/shop-appearance.server";
import {
  BagsAlert,
  BagsCard,
  BagsPageBody,
  BagsPageHeader,
} from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { appearance: await getShopAppearance(session.shop) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "reset") {
    await updateShopAppearance(session.shop, DEFAULT_APPEARANCE);
    return { saved: true, reset: true, errors: null };
  }
  if (intent !== "save") return null;

  const patch = {
    businessName: String(form.get("businessName") || "").trim(),
    logoUrl: String(form.get("logoUrl") || "").trim() || null,
    logoLightUrl: String(form.get("logoLightUrl") || "").trim() || null,
    logoDarkUrl: String(form.get("logoDarkUrl") || "").trim() || null,
    faviconUrl: String(form.get("faviconUrl") || "").trim() || null,
    accentColor: String(form.get("accentColor") || ""),
    accentColorDark: String(form.get("accentColorDark") || ""),
    backgroundColor: String(form.get("backgroundColor") || ""),
    buttonColor: String(form.get("buttonColor") || ""),
    textColor: String(form.get("textColor") || ""),
    launcherOpenLabel: String(form.get("launcherOpenLabel") || "").trim(),
    launcherEditLabel: String(form.get("launcherEditLabel") || "").trim(),
    welcomeTitle: String(form.get("welcomeTitle") || "").trim(),
    welcomeSubtitle: String(form.get("welcomeSubtitle") || "").trim(),
  };
  const errors = validateShopAppearance(patch);
  if (Object.keys(errors).length) return { saved: false, reset: false, errors };

  await updateShopAppearance(session.shop, patch);
  return { saved: true, reset: false, errors: null };
};

type PreviewState = {
  businessName: string;
  logoUrl: string;
  accentColor: string;
  backgroundColor: string;
  buttonColor: string;
  textColor: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  launcherOpenLabel: string;
};

export default function AppearancePage() {
  const { appearance } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [preview, setPreview] = useState<PreviewState>({
    businessName: appearance.businessName,
    logoUrl: appearance.logoUrl ?? "",
    accentColor: appearance.accentColor,
    backgroundColor: appearance.backgroundColor,
    buttonColor: appearance.buttonColor,
    textColor: appearance.textColor,
    welcomeTitle: appearance.welcomeTitle,
    welcomeSubtitle: appearance.welcomeSubtitle,
    launcherOpenLabel: appearance.launcherOpenLabel,
  });

  function updatePreview(name: keyof PreviewState, value: string) {
    setPreview((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <BagsPageHeader
        title="Branding"
        subtitle="Configure the customer-facing identity passed to Gang Sheet Studio"
      />
      <div className="bags-admin-content">
        <BagsPageBody>
          {actionData?.saved ? (
            <BagsAlert tone="success" title={actionData.reset ? "Defaults restored" : "Branding saved"}>
              The branding contract is ready for customer-facing integrations.
            </BagsAlert>
          ) : null}
          <div className="bags-admin-grid two">
            <BagsCard title="Brand identity">
              <Form method="post" className="bags-admin-form bags-brand-form">
                <input type="hidden" name="intent" value="save" />
                <label>
                  Business display name
                  <input
                    name="businessName"
                    type="text"
                    required
                    defaultValue={appearance.businessName}
                    onChange={(event) => updatePreview("businessName", event.target.value)}
                  />
                  {actionData?.errors?.businessName ? <span className="bags-field-error">{actionData.errors.businessName}</span> : null}
                </label>
                <div className="bags-admin-grid two">
                  <UrlField label="Primary logo URL" name="logoUrl" value={appearance.logoUrl} error={actionData?.errors?.logoUrl} onChange={(value) => updatePreview("logoUrl", value)} />
                  <UrlField label="Favicon URL" name="faviconUrl" value={appearance.faviconUrl} error={actionData?.errors?.faviconUrl} />
                  <UrlField label="Logo for light backgrounds" name="logoLightUrl" value={appearance.logoLightUrl} error={actionData?.errors?.logoLightUrl} />
                  <UrlField label="Logo for dark backgrounds" name="logoDarkUrl" value={appearance.logoDarkUrl} error={actionData?.errors?.logoDarkUrl} />
                </div>
                <p className="bags-admin-muted">
                  Use hosted HTTPS assets. Direct file uploads remain future integration work so private files are not exposed accidentally.
                </p>
                <div className="bags-color-grid">
                  <ColorField label="Primary" name="accentColor" value={appearance.accentColor} error={actionData?.errors?.accentColor} onChange={(value) => updatePreview("accentColor", value)} />
                  <ColorField label="Secondary" name="accentColorDark" value={appearance.accentColorDark} error={actionData?.errors?.accentColorDark} />
                  <ColorField label="Background" name="backgroundColor" value={appearance.backgroundColor} error={actionData?.errors?.backgroundColor} onChange={(value) => updatePreview("backgroundColor", value)} />
                  <ColorField label="Button" name="buttonColor" value={appearance.buttonColor} error={actionData?.errors?.buttonColor} onChange={(value) => updatePreview("buttonColor", value)} />
                  <ColorField label="Text" name="textColor" value={appearance.textColor} error={actionData?.errors?.textColor} onChange={(value) => updatePreview("textColor", value)} />
                </div>
                <label>
                  Welcome title
                  <input name="welcomeTitle" type="text" defaultValue={appearance.welcomeTitle} onChange={(event) => updatePreview("welcomeTitle", event.target.value)} />
                </label>
                <label>
                  Welcome subtitle
                  <textarea name="welcomeSubtitle" rows={3} defaultValue={appearance.welcomeSubtitle} onChange={(event) => updatePreview("welcomeSubtitle", event.target.value)} />
                </label>
                <div className="bags-admin-grid two">
                  <label>
                    Launcher open label
                    <input name="launcherOpenLabel" type="text" defaultValue={appearance.launcherOpenLabel} onChange={(event) => updatePreview("launcherOpenLabel", event.target.value)} />
                  </label>
                  <label>
                    Launcher edit label
                    <input name="launcherEditLabel" type="text" defaultValue={appearance.launcherEditLabel} />
                  </label>
                </div>
                <div className="bags-admin-actions">
                  <button type="submit" className="bags-admin-btn primary">Save branding</button>
                </div>
              </Form>
              <Form method="post" style={{ marginTop: 12 }}>
                <input type="hidden" name="intent" value="reset" />
                <button type="submit" className="bags-admin-btn ghost">Reset to Legends defaults</button>
              </Form>
            </BagsCard>

            <div className="bags-brand-preview-column">
              <BagsCard title="Live customer preview">
                <div className="bags-brand-preview" style={{ background: preview.backgroundColor, color: preview.textColor }}>
                  <div className="bags-brand-preview-header">
                    {preview.logoUrl ? <img src={preview.logoUrl} alt="" /> : <span className="bags-brand-preview-mark">L</span>}
                    <strong>{preview.businessName || "Your business"}</strong>
                  </div>
                  <div className="bags-brand-preview-stage">
                    <span className="bags-brand-preview-kicker" style={{ color: preview.accentColor }}>CUSTOM GANG SHEETS</span>
                    <h3>{preview.welcomeTitle || "Build your gang sheet"}</h3>
                    <p>{preview.welcomeSubtitle}</p>
                    <button type="button" style={{ background: preview.buttonColor, color: "#fff" }}>{preview.launcherOpenLabel || "Start building"}</button>
                  </div>
                  <small>Powered by Legends-BAGS</small>
                </div>
              </BagsCard>
              <BagsAlert tone="info" title="Contract-ready integration">
                These values are persisted and returned by the BAGS Studio bootstrap API. Gang Sheet Studio must opt in to rendering the new branding contract.
              </BagsAlert>
            </div>
          </div>
        </BagsPageBody>
      </div>
    </>
  );
}

function UrlField(props: { label: string; name: string; value: string | null; error?: string; onChange?: (value: string) => void }) {
  return (
    <label>
      {props.label}
      <input name={props.name} type="url" placeholder="https://…" defaultValue={props.value ?? ""} onChange={(event) => props.onChange?.(event.target.value)} />
      {props.error ? <span className="bags-field-error">{props.error}</span> : null}
    </label>
  );
}

function ColorField(props: { label: string; name: string; value: string; error?: string; onChange?: (value: string) => void }) {
  return (
    <label>
      {props.label}
      <span className="bags-color-control">
        <input name={props.name} type="color" defaultValue={props.value} onChange={(event) => props.onChange?.(event.target.value)} />
        <span>{props.value}</span>
      </span>
      {props.error ? <span className="bags-field-error">{props.error}</span> : null}
    </label>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);