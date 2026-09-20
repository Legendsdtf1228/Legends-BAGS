import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { buildEditorAuthHeaders } from "../lib/editor-auth.server";
import { mergeEditorLaunchFromUrl } from "../lib/editor-launch.server";
import { isMerchantStudioLaunchEnabled } from "../lib/studio-builder.server";

/**
 * BAGS → Gang Sheet Studio launch shim (customer and merchant).
 * Sets the same API cookies as the legacy gang-sheet editor, then
 * redirects into the static Studio build at /studio/?host=bags&…
 * Legacy /editor/gang-sheet remains as a compatibility fallback only when
 * the synced Studio dist is missing.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const launch = mergeEditorLaunchFromUrl(request, process.env.DEV_SHOP || "");

  if (!isMerchantStudioLaunchEnabled()) {
    const legacy = new URL("/editor/gang-sheet", request.url);
    legacy.search = new URL(request.url).search;
    if (!legacy.searchParams.get("shop") && launch.shop) {
      legacy.searchParams.set("shop", launch.shop);
    }
    throw redirect(legacy.toString());
  }

  const { headers, hasApiAuth } = buildEditorAuthHeaders(request, launch.shop);

  if (!hasApiAuth) {
    headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(
      `<!DOCTYPE html><html><body style="font:14px system-ui;padding:24px">
        <h1>Studio builder auth missing</h1>
        <p>Set <code>DEV_SHOP</code> and <code>TEST_API_TOKEN</code>, or open via the storefront session link.</p>
      </body></html>`,
      { status: 401, headers },
    );
  }

  const studio = new URL("/studio/", request.url);
  const src = new URL(request.url);
  for (const [key, value] of src.searchParams.entries()) {
    studio.searchParams.set(key, value);
  }
  studio.searchParams.set("host", "bags");
  if (launch.shop) studio.searchParams.set("shop", launch.shop);
  if (launch.productGid) studio.searchParams.set("productGid", launch.productGid);
  if (launch.variantId) {
    studio.searchParams.set("variantId", launch.variantId);
    studio.searchParams.set("variant", launch.variantId);
  }
  studio.searchParams.set("quantity", String(launch.quantity || 1));
  if (launch.parentOrigin) studio.searchParams.set("parentOrigin", launch.parentOrigin);
  if (launch.designId) studio.searchParams.set("designId", launch.designId);
  if (launch.designVersion) studio.searchParams.set("designVersion", launch.designVersion);

  headers.set("Location", `${studio.pathname}${studio.search}`);
  return new Response(null, { status: 302, headers });
}

export default function StudioBuilderLaunch() {
  return null;
}
