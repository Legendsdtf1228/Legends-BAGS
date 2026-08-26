import type { ActionFunctionArgs } from "react-router";
import { createAssetFromUpload } from "../services/design-service";

/**
 * Dev/test upload endpoint. Production will use authenticated app proxy / theme session.
 * Requires headers: X-LGS-Shop, X-LGS-Test-Token matching env TEST_API_TOKEN.
 */
function assertTestAccess(request: Request) {
  const shop = request.headers.get("X-LGS-Shop");
  const token = request.headers.get("X-LGS-Test-Token");
  const expected = process.env.TEST_API_TOKEN;
  if (!expected || token !== expected) {
    throw new Response("Unauthorized", { status: 401 });
  }
  if (!shop) throw new Response("Missing shop", { status: 400 });
  return shop;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const shop = assertTestAccess(request);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file required" }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const asset = await createAssetFromUpload(shop, bytes);
    return Response.json({
      assetId: asset.id,
      widthPx: asset.widthPx,
      heightPx: asset.heightPx,
      dpi: asset.dpi,
      contentType: asset.contentType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
