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
import { createRequestId, jsonError, jsonOk } from "../lib/request-context.server";

export async function action({ request }: ActionFunctionArgs) {
  const requestId = createRequestId();
  if (request.method !== "POST") {
    return jsonError("Method not allowed", 405, requestId);
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
    return jsonOk(
      {
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
      },
      requestId,
    );
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
      return jsonError(message, 400, requestId);
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
      return jsonError(message, 400, requestId);
    }
  }

  if (!body.assetId || !body.size) {
    return jsonError("assetId and size required", 400, requestId);
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
    return jsonError(message, 400, requestId);
  }
}
