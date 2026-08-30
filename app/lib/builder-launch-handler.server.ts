import { redirect } from "react-router";
import {
  buildEditorLaunchUrl,
  isMyshopifyDomain,
  normalizeShopDomain,
  parseBuilderLaunchQuery,
  type BuilderLaunchParseError,
} from "../domain/builder/builder-launch-context";
import {
  builderTypeFromQueryHint,
  resolveBuilderRecoveryTarget,
  type BuilderRecoveryTarget,
} from "./builder-recovery.server";
import { resolveBuilderLaunch } from "./builder-launch.server";
import { resolveAppUrl } from "./app-url.server";

function passthroughFromRequest(url: URL) {
  return {
    embedded: url.searchParams.get("embedded"),
    parentOrigin: url.searchParams.get("parentOrigin"),
    lgs_session: url.searchParams.get("lgs_session"),
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
    case "missing_product":
      return "Product required";
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

function builderRecoveryHtml(props: {
  title: string;
  message: string;
  recovery: BuilderRecoveryTarget;
  attemptedProductId?: string;
}): string {
  const label = props.recovery.productTitle?.trim() || `Product ${props.recovery.productId}`;
  const storefrontUrl = `https://${props.recovery.shop}/products/${props.recovery.productId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(props.title)} · Legends BAGS</title>
  <style>
    body{margin:0;font:15px/1.5 Inter,Segoe UI,system-ui,sans-serif;background:#eef1f5;color:#111827}
    .wrap{min-height:100vh;display:grid;place-items:center;padding:24px}
    .card{max-width:560px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;box-shadow:0 8px 30px #34405418}
    .logo{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:900 22px Georgia,serif;margin-bottom:12px}
    h1{margin:0 0 8px;font-size:22px}
    p{margin:0 0 12px;color:#667085}
    .actions{display:flex;flex-direction:column;gap:10px;margin-top:20px}
    a.btn{display:inline-block;text-align:center;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:600}
    a.primary{background:#1a73e8;color:#fff}
    a.secondary{background:#f8fafc;color:#344054;border:1px solid #e4e7ec}
    .hint{margin-top:16px;font-size:13px;color:#475467}
    .diag{margin-top:18px;padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #e4e7ec;font-size:12px;color:#475467}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="logo" aria-hidden="true">L</div>
      <h1>${escapeHtml(props.title)}</h1>
      <p>${escapeHtml(props.message)}</p>
      <p>Open the gang sheet builder from an assigned product page so we know which sheet size and price to use.</p>
      <div class="actions">
        <a class="btn primary" href="${escapeHtml(storefrontUrl)}">View assigned product — ${escapeHtml(label)}</a>
        <a class="btn secondary" href="${escapeHtml(props.recovery.builderUrl)}">Open builder with assigned product</a>
      </div>
      <p class="hint">Assigned product ID ${escapeHtml(props.recovery.productId)}${props.attemptedProductId ? ` (you tried ${escapeHtml(props.attemptedProductId)})` : ""}.</p>
    </div>
  </div>
</body>
</html>`;
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

async function recoveryResponse(
  request: Request,
  props: {
    title: string;
    message: string;
    attemptedProductId?: string;
  },
): Promise<Response | null> {
  const url = new URL(request.url);
  const shopRaw = url.searchParams.get("shop")?.trim();
  if (!shopRaw || !isMyshopifyDomain(shopRaw)) return null;

  const builderType = builderTypeFromQueryHint(url.searchParams.get("type"));
  const recovery = await resolveBuilderRecoveryTarget(normalizeShopDomain(shopRaw), builderType);
  if (!recovery) return null;

  return new Response(
    builderRecoveryHtml({
      title: props.title,
      message: props.message,
      recovery,
      attemptedProductId: props.attemptedProductId,
    }),
    { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

/** Shared /builder and app-proxy builder launch handler. */
export async function handleBuilderLaunchRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = queryFromUrl(url);
  const parsed = parseBuilderLaunchQuery(query);

  if (!parsed.ok) {
    if (parsed.code === "missing_product") {
      const recovery = await recoveryResponse(request, {
        title: errorTitle(parsed.code),
        message: parsed.message,
      });
      if (recovery) return recovery;
    }

    return new Response(
      builderErrorHtml({ title: errorTitle(parsed.code), message: parsed.message }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const result = await resolveBuilderLaunch(query);

  if (!result.ok) {
    if (result.code === "binding_not_found") {
      const recovery = await recoveryResponse(request, {
        title: errorTitle(result.code),
        message: result.message,
        attemptedProductId: result.diagnostic?.productId,
      });
      if (recovery) return recovery;

      return new Response(
        builderErrorHtml({
          title: errorTitle(result.code),
          message: result.message,
          diagnostic: result.diagnostic,
        }),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    const parseErr = result;
    return new Response(
      builderErrorHtml({
        title: errorTitle(parseErr.code),
        message: parseErr.message,
      }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const appUrl = resolveAppUrl() || url.origin;
  const editorUrl = buildEditorLaunchUrl(appUrl, result.context, passthroughFromRequest(url));
  throw redirect(editorUrl);
}
