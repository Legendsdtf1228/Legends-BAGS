import type { ActionFunctionArgs } from "react-router";
import { createUploadBySizeDesign } from "../services/design-service";
import type { SizeInput } from "../domain/pricing";

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
  const body = (await request.json()) as {
    assetId: string;
    size: SizeInput;
    productGid?: string;
    variantGid?: string;
  };

  if (!body.assetId || !body.size) {
    return Response.json({ error: "assetId and size required" }, { status: 400 });
  }

  try {
    const { design, state } = await createUploadBySizeDesign({
      shop,
      assetId: body.assetId,
      size: body.size,
      productGid: body.productGid,
      variantGid: body.variantGid,
    });
    return Response.json({
      designId: design.id,
      version: design.currentVersion,
      status: design.status,
      state,
      cartProperties: {
        _lgs_design_id: design.id,
        _lgs_design_version: String(design.currentVersion),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
