import { redirect } from "react-router";
import {
  buildEditorLaunchUrl,
  type BuilderLaunchParseError,
  type BuilderLaunchContext,
  type EditorLaunchPassthrough,
} from "../domain/builder/builder-launch-context";
import { resolveBuilderLaunch } from "./builder-launch.server";
import { resolveAppUrl } from "./app-url.server";
import { isStudioBuilderEnabled, studioEditorPath } from "./studio-builder.server";

function passthroughFromRequest(url: URL) {
  return {
    embedded: url.searchParams.get("embedded"),
    parentOrigin: url.searchParams.get("parentOrigin"),
    lgs_session: url.searchParams.get("lgs_session"),
    lgs_customer_key: url.searchParams.get("lgs_customer_key"),
    designId: url.searchParams.get("designId"),
    designVersion: url.searchParams.get("designVersion"),
  };
}

function queryFromUrl(url: URL) {
  return {
    shop: url.searchParams.get("shop"),
    product: url.searchParams.get("product"),
    variant: url.searchParams.get("variant"),
    quantity: url.searchParams.get("quantity"),
    shop_mode: url.searchParams.get("shop_mode"),
    productGid: url.searchParams.get("productGid"),
    variantId: url.searchParams.get("variantId"),
    variantGid: url.searchParams.get("variantGid"),
  };
}

function errorTitle(code: BuilderLaunchParseError["code"] | "binding_not_found"): string {
  switch (code) {
    case "binding_not_found":
      return "Product not connected";
    case "shop_not_allowed":
      return "Store not available";
    case "invalid_shop":
    case "missing_shop":
      return "Invalid store";
    default:
      return "Unable to open builder";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function builderErrorHtml(props: {
  title: string;
  message: string;
  diagnostic?: {
    shop: string;
    productId: string;
    productGid: string;
    variantId?: string;
    variantGid?: string;
    bindingFound: false;
  };
}): string {
  const showDiagnostic = process.env.NODE_ENV !== "production" && props.diagnostic;
  const diag = props.diagnostic;
  const diagnosticBlock =
    showDiagnostic && diag
      ? `<dl class="diag">
        <dt>Development diagnostic</dt>
        <dd>bindingFound: false</dd>
        <dt>shop</dt><dd>${escapeHtml(diag.shop)}</dd>
        <dt>product</dt><dd>${escapeHtml(diag.productId)}</dd>
        <dt>productGid</dt><dd>${escapeHtml(diag.productGid)}</dd>
        <dt>variant</dt><dd>${escapeHtml(diag.variantId || "(blank)")}</dd>
        <dt>variantGid</dt><dd>${escapeHtml(diag.variantGid || "(blank)")}</dd>
      </dl>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(props.title)} · Legends BAGS</title>
  <style>
    body{margin:0;font:15px/1.5 Inter,Segoe UI,system-ui,sans-serif;background:#eef1f5;color:#111827}
    .wrap{min-height:100vh;display:grid;place-items:center;padding:24px}
    .card{max-width:520px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;box-shadow:0 8px 30px #34405418}
    .logo{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:900 22px Georgia,serif;margin-bottom:12px}
    h1{margin:0 0 8px;font-size:22px}
    p{margin:0;color:#667085}
    .diag{margin-top:18px;padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #e4e7ec;font-size:12px;color:#475467}
    .diag dt{font-weight:700;margin-top:8px}
    .diag dd{margin:2px 0 0;font-family:ui-monospace,Consolas,monospace;word-break:break-all}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="logo" aria-hidden="true">L</div>
      <h1>${escapeHtml(props.title)}</h1>
      <p>${escapeHtml(props.message)}</p>
      ${diagnosticBlock}
    </div>
  </div>
</body>
</html>`;
}

/** DEV: gang_sheet → Studio editor when USE_STUDIO_BUILDER is enabled. Legacy editor remains at /editor/gang-sheet. */
export function buildLaunchEditorUrl(
  baseUrl: string,
  context: BuilderLaunchContext,
  passthrough: EditorLaunchPassthrough = {},
): string {
  if (isStudioBuilderEnabled() && context.builderType === "gang_sheet") {
    const base = baseUrl.replace(/\/$/, "");
    const url = new URL(studioEditorPath(), base.endsWith("/") ? base : `${base}/`);
    url.searchParams.set("shop", context.shop);
    url.searchParams.set("productGid", context.productGid);
    url.searchParams.set("product", context.productId);
    if (context.variantId) url.searchParams.set("variantId", context.variantId);
    if (context.variantId) url.searchParams.set("variant", context.variantId);
    url.searchParams.set("quantity", String(context.quantity));
    if (context.shopMode) url.searchParams.set("shop_mode", context.shopMode);
    if (passthrough.embedded) url.searchParams.set("embedded", passthrough.embedded);
    if (passthrough.parentOrigin) url.searchParams.set("parentOrigin", passthrough.parentOrigin);
    if (passthrough.lgs_session) url.searchParams.set("lgs_session", passthrough.lgs_session);
    if (passthrough.lgs_customer_key) {
      url.searchParams.set("lgs_customer_key", passthrough.lgs_customer_key);
    }
    if (passthrough.designId) url.searchParams.set("designId", passthrough.designId);
    if (passthrough.designVersion) url.searchParams.set("designVersion", passthrough.designVersion);
    return url.toString();
  }
  return buildEditorLaunchUrl(baseUrl, context, passthrough);
}

/** Shared /builder and app-proxy builder launch handler. */
export async function handleBuilderLaunchRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const result = await resolveBuilderLaunch(queryFromUrl(url));

  if (!result.ok) {
    if (result.code === "binding_not_found") {
      return new Response(
        builderErrorHtml({
          title: errorTitle(result.code),
          message: result.message,
          diagnostic: result.diagnostic,
        }),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    const parseErr = result as BuilderLaunchParseError;
    return new Response(
      builderErrorHtml({
        title: errorTitle(parseErr.code),
        message: parseErr.message,
      }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const appUrl = resolveAppUrl() || url.origin;
  const editorUrl = buildLaunchEditorUrl(appUrl, result.context, passthroughFromRequest(url));
  throw redirect(editorUrl);
}
