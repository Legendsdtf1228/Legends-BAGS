import type { ActionFunctionArgs } from "react-router";
import { removeBackgroundFromAsset } from "../services/design-service";
import { assertCustomerApiAccess } from "../domain/security/test-access";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const shop = assertCustomerApiAccess(request);
  const assetId = params.assetId;
  if (!assetId) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as {
    prompt?: string;
    keepMargin?: number;
    feather?: number;
    threshold?: number;
  };

  try {
    const asset = await removeBackgroundFromAsset({
      shop,
      assetId,
      tuning: {
        prompt: body.prompt,
        keepMargin: body.keepMargin,
        feather: body.feather,
        threshold: body.threshold,
      },
    });
    return Response.json({
      assetId: asset.id,
      widthPx: asset.widthPx,
      heightPx: asset.heightPx,
      dpi: asset.dpi,
      contentType: asset.contentType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Background removal failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
