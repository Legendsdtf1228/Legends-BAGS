import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  duplicateDesignForReorder,
  listDesignLibrary,
  saveDesignToLibrary,
  updateDesignLibraryEntry,
} from "../services/design-service";
import { assertCustomerApiContext } from "../domain/security/test-access";
import { buildCartLineProperties } from "../domain/shopify/line-properties";
import { getDesignState } from "../services/design-service";

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = assertCustomerApiContext(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? undefined;
  const sort = (url.searchParams.get("sort") as "recent" | "name") || "recent";
  const includeArchived = url.searchParams.get("archived") === "1";
  const workflow = url.searchParams.get("workflow") as "upload_by_size" | "gang_sheet" | null;
  const productGid = url.searchParams.get("productGid")?.trim() || undefined;
  const rows = await listDesignLibrary({
    shop: ctx.shop,
    customerKey: ctx.customerKey,
    search,
    sort,
    includeArchived,
    productGid,
    workflow: workflow ?? undefined,
  });
  return Response.json({ designs: rows });
}

export async function action({ request }: ActionFunctionArgs) {
  const ctx = assertCustomerApiContext(request);
  const shop = ctx.shop;
  const customerKey = ctx.customerKey;
  const body = (await request.json()) as {
    intent?: string;
    designId?: string;
    name?: string;
    archived?: boolean;
    sourceDesignId?: string;
    sourceVersion?: number;
    sourceOrderId?: string;
    productGid?: string;
    variantGid?: string;
  };

  try {
    if (body.intent === "save") {
      if (!body.designId || !body.name) {
        return Response.json({ error: "designId and name required" }, { status: 400 });
      }
      const design = await saveDesignToLibrary({
        shop,
        designId: body.designId,
        name: body.name,
        customerKey,
      });
      const { state } = await getDesignState(shop, design.id);
      return Response.json({
        designId: design.id,
        name: design.name,
        version: design.currentVersion,
        cartProperties: buildCartLineProperties({
          shop,
          designId: design.id,
          version: design.currentVersion,
          state,
          designName: design.name,
        }),
      });
    }

    if (body.intent === "rename") {
      if (!body.designId || !body.name) {
        return Response.json({ error: "designId and name required" }, { status: 400 });
      }
      const design = await updateDesignLibraryEntry({
        shop,
        designId: body.designId,
        name: body.name,
        customerKey,
      });
      return Response.json({ designId: design.id, name: design.name });
    }

    if (body.intent === "archive") {
      if (!body.designId) {
        return Response.json({ error: "designId required" }, { status: 400 });
      }
      const design = await updateDesignLibraryEntry({
        shop,
        designId: body.designId,
        archived: body.archived ?? true,
        customerKey,
      });
      return Response.json({ designId: design.id, archived: design.archived });
    }

    if (body.intent === "reorder" || body.intent === "duplicate") {
      if (!body.sourceDesignId) {
        return Response.json({ error: "sourceDesignId required" }, { status: 400 });
      }
      const result = await duplicateDesignForReorder({
        shop,
        sourceDesignId: body.sourceDesignId,
        sourceVersion: body.sourceVersion,
        sourceOrderId: body.sourceOrderId,
        name: body.name,
        productGid: body.productGid,
        variantGid: body.variantGid,
        customerKey,
      });
      return Response.json({
        designId: result.design.id,
        version: result.version,
        name: result.design.name,
        sourceDesignId: result.sourceDesignId,
        sourceVersion: result.sourceVersion,
        state: result.state,
        cartProperties: buildCartLineProperties({
          shop,
          designId: result.design.id,
          version: result.version,
          state: result.state,
          designName: result.design.name,
        }),
      });
    }

    return Response.json({ error: "Unknown intent" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
