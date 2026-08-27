import type { ActionFunctionArgs } from "react-router";
import { upscaleAssetForPrint } from "../services/design-service";
import { assertCustomerApiAccess } from "../domain/security/test-access";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const shop = assertCustomerApiAccess(request);
  const assetId = params.assetId;
  if (!assetId) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as {
    widthIn?: number;
    heightIn?: number;
  };

  try {
    const asset = await upscaleAssetForPrint({
      shop,
      assetId,
      widthIn: Number(body.widthIn),
      heightIn: Number(body.heightIn),
    });
    return Response.json({
      assetId: asset.id,
      widthPx: asset.widthPx,
      heightPx: asset.heightPx,
      dpi: asset.dpi,
      contentType: asset.contentType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upscale failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
