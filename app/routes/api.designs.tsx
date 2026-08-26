import type { ActionFunctionArgs } from "react-router";
import {
  createGangSheetDesign,
  createMultiUploadBySizeDesign,
  createUploadBySizeDesign,
} from "../services/design-service";
import type { DesignStateV1 } from "../domain/design/types";
import type { SizeInput } from "../domain/pricing";
import { assertTestAccess } from "../domain/security/test-access";

function cartProperties(designId: string, version: number) {
  return {
    _lgs_design_id: designId,
    _lgs_design_version: String(version),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const shop = assertTestAccess(request);
  const body = (await request.json()) as {
    assetId?: string;
    size?: SizeInput;
    productGid?: string;
    variantGid?: string;
    uploads?: Array<{ assetId: string; size: SizeInput }>;
    items?: DesignStateV1["items"];
    sheet?: DesignStateV1["sheet"];
  };

  if (body.uploads?.length) {
    try {
      const { design, state } = await createMultiUploadBySizeDesign({
        shop,
        uploads: body.uploads,
        productGid: body.productGid,
        variantGid: body.variantGid,
      });
      return Response.json({
        designId: design.id,
        version: design.currentVersion,
        status: design.status,
        state,
        cartProperties: cartProperties(design.id, design.currentVersion),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  if (body.items && body.sheet) {
    try {
      const { design, state } = await createGangSheetDesign({
        shop,
        items: body.items,
        sheet: body.sheet,
        productGid: body.productGid,
        variantGid: body.variantGid,
      });
      return Response.json({
        designId: design.id,
        version: design.currentVersion,
        status: design.status,
        state,
        cartProperties: cartProperties(design.id, design.currentVersion),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      return Response.json({ error: message }, { status: 400 });
    }
  }

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
      cartProperties: cartProperties(design.id, design.currentVersion),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
