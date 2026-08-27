import type { ActionFunctionArgs } from "react-router";
import {
  createGangSheetDesign,
  createMultiUploadBySizeDesign,
  createUploadBySizeDesign,
  saveDesignToLibrary,
} from "../services/design-service";
import type { DesignStateV1 } from "../domain/design/types";
import type { SizeInput } from "../domain/pricing";
import { assertCustomerApiContext } from "../domain/security/test-access";
import { buildCartLineProperties } from "../domain/shopify/line-properties";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const ctx = assertCustomerApiContext(request);
  const shop = ctx.shop;
  const customerKey = ctx.customerKey;
  const body = (await request.json()) as {
    assetId?: string;
    size?: SizeInput;
    productGid?: string;
    variantGid?: string;
    uploads?: Array<{ assetId: string; size: SizeInput }>;
    items?: DesignStateV1["items"];
    sheet?: DesignStateV1["sheet"];
    name?: string;
    saveToLibrary?: boolean;
  };

  function respond(
    design: { id: string; currentVersion: number; name: string | null },
    state: DesignStateV1,
  ) {
    return Response.json({
      designId: design.id,
      version: design.currentVersion,
      status: "draft",
      state,
      name: design.name,
      cartProperties: buildCartLineProperties({
        shop,
        designId: design.id,
        version: design.currentVersion,
        state,
        designName: design.name,
      }),
    });
  }

  if (body.uploads?.length) {
    try {
      const { design, state } = await createMultiUploadBySizeDesign({
        shop,
        uploads: body.uploads,
        productGid: body.productGid,
        variantGid: body.variantGid,
        customerKey,
      });
      if (body.saveToLibrary && body.name) {
        await saveDesignToLibrary({ shop, designId: design.id, name: body.name, customerKey });
      }
      return respond(design, state);
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
        customerKey,
      });
      if (body.saveToLibrary && body.name) {
        const named = await saveDesignToLibrary({
          shop,
          designId: design.id,
          name: body.name,
          customerKey,
        });
        return respond({ ...design, name: named.name }, state);
      }
      return respond(design, state);
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
      customerKey,
    });
    if (body.saveToLibrary && body.name) {
      const named = await saveDesignToLibrary({
        shop,
        designId: design.id,
        name: body.name,
        customerKey,
      });
      return respond({ ...design, name: named.name }, state);
    }
    return respond(design, state);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
