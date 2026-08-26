import type { ActionFunctionArgs } from "react-router";
import { createAssetFromUpload } from "../services/design-service";
import { assertTestAccess } from "../domain/security/test-access";

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
