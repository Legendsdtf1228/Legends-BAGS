import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  buildDesignApiResponse,
  parseDesignApiQuery,
  resolveDesignApiShop,
} from "../lib/design-api.server";
import { assertCustomerApiContext } from "../domain/security/test-access";
import {
  saveGangSheetNewVersion,
  saveUploadBySizeNewVersion,
  validateDesignForCheckout,
} from "../services/design-service";
import { signDesignAccess } from "../domain/security/design-access";
import { buildCartLineProperties } from "../domain/shopify/line-properties";
import type { DesignStateV1 } from "../domain/design/types";
import type { SizeInput } from "../domain/pricing";
import { createRequestId, jsonError, jsonOk } from "../lib/request-context.server";

function designResponse(
  shop: string,
  design: {
    id: string;
    currentVersion: number;
    name: string | null;
    status: string;
    productGid: string | null;
    variantGid: string | null;
    sourceDesignId: string | null;
    sourceDesignVersion: number | null;
    sourceOrderId: string | null;
    archived: boolean;
  },
  state: DesignStateV1,
  version: number,
) {
  const { token: accessToken } = signDesignAccess({
    shop,
    designId: design.id,
    version,
  });
  return {
    designId: design.id,
    version,
    status: design.status,
    name: design.name,
    archived: design.archived,
    productGid: design.productGid,
    variantGid: design.variantGid,
    sourceDesignId: design.sourceDesignId,
    sourceDesignVersion: design.sourceDesignVersion,
    sourceOrderId: design.sourceOrderId,
    state,
    accessToken,
    cartProperties: buildCartLineProperties({
      shop,
      designId: design.id,
      version,
      state,
      designName: design.name,
    }),
  };
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const designId = params.designId;
  if (!designId) throw new Response("Not found", { status: 404 });

  const query = parseDesignApiQuery(request);
  let shop: string;
  let customerKey: string | null = null;
  if (query.accessToken) {
    shop = resolveDesignApiShop(designId, query);
  } else {
    const ctx = assertCustomerApiContext(request);
    shop = ctx.shop;
    customerKey = ctx.customerKey;
  }

  return buildDesignApiResponse(shop, designId, query, { customerKey });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const requestId = createRequestId();
  if (request.method !== "PUT" && request.method !== "POST") {
    return jsonError("Method not allowed", 405, requestId);
  }
  const ctx = assertCustomerApiContext(request);
  const shop = ctx.shop;
  const customerKey = ctx.customerKey;
  const designId = params.designId;
  if (!designId) return jsonError("Not found", 404, requestId);

  const body = (await request.json()) as {
    intent?: string;
    items?: DesignStateV1["items"];
    sheet?: DesignStateV1["sheet"];
    uploads?: Array<{ assetId: string; size: SizeInput }>;
    productGid?: string;
    variantGid?: string;
    name?: string;
    saveToLibrary?: boolean;
    designVersion?: number;
    productGidValidate?: string;
    variantGidValidate?: string;
    priceRef?: string;
  };

  if (body.intent === "validate") {
    try {
      const v = body.designVersion;
      if (!v) return jsonError("designVersion required", 400, requestId);
      const result = await validateDesignForCheckout({
        shop,
        designId,
        designVersion: v,
        productGid: body.productGidValidate,
        variantGid: body.variantGidValidate,
        priceRef: body.priceRef,
      });
      return jsonOk(
        {
          ok: true,
          designId: result.design.id,
          version: result.versionRow.version,
          priceCents: result.versionRow.priceCents,
        },
        requestId,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation failed";
      return jsonError(message, 400, requestId);
    }
  }

  try {
    if (body.items && body.sheet) {
      const { design, state, version } = await saveGangSheetNewVersion({
        shop,
        designId,
        items: body.items,
        sheet: body.sheet,
        productGid: body.productGid,
        variantGid: body.variantGid,
        name: body.name,
        saveToLibrary: body.saveToLibrary,
        customerKey,
      });
      return jsonOk(designResponse(shop, design, state, version), requestId);
    }

    if (body.uploads?.length) {
      const { design, state, version } = await saveUploadBySizeNewVersion({
        shop,
        designId,
        uploads: body.uploads,
        productGid: body.productGid,
        variantGid: body.variantGid,
        name: body.name,
        saveToLibrary: body.saveToLibrary,
        customerKey,
      });
      return jsonOk(designResponse(shop, design, state, version), requestId);
    }

    return jsonError("No update payload", 400, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    const status = message.includes("not found") ? 404 : 400;
    return jsonError(message, status, requestId);
  }
}
