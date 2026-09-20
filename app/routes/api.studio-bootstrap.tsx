import type { LoaderFunctionArgs } from "react-router";
import { assertCustomerApiContext } from "../domain/security/test-access";
import { loadEditorPageConfig } from "../lib/editor-config.server";
import { getDesignState } from "../services/design-service";
import prisma from "../db.server";
import { toVariantGid } from "../domain/builder/builder-launch-context";

/**
 * DEV-ONLY bootstrap for Gang Sheet Studio hosted under BAGS.
 * Returns ProductBinding sheet geometry + optional DesignStateV1 for reopen.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = assertCustomerApiContext(request);
  const url = new URL(request.url);
  const shop = ctx.shop;
  const productGid = url.searchParams.get("productGid") || "";
  const variantId =
    url.searchParams.get("variantId")?.replace(/\D/g, "") ||
    url.searchParams.get("variant")?.replace(/\D/g, "") ||
    "";
  const variantGid =
    url.searchParams.get("variantGid") ||
    (variantId ? toVariantGid(variantId) : undefined);
  const quantity = Math.max(1, Math.floor(Number(url.searchParams.get("quantity") || 1)) || 1);
  const parentOrigin = url.searchParams.get("parentOrigin") || "";
  const designId = url.searchParams.get("designId") || "";
  const designVersionRaw = url.searchParams.get("designVersion");
  const designVersion = designVersionRaw ? Number(designVersionRaw) : undefined;

  const pathname = url.pathname;
  const marker = "/apps/legends-bags";
  const apiBase = pathname.includes(marker)
    ? pathname.slice(0, pathname.indexOf(marker) + marker.length)
    : "";

  const editorConfig = await loadEditorPageConfig(
    shop,
    productGid || undefined,
    variantId || undefined,
  );

  let design: null | {
    designId: string;
    version: number;
    name: string | null;
    state: unknown;
    assets: Record<
      string,
      {
        widthPx: number;
        heightPx: number;
        dpi: number | null;
        contentType: string;
        previewUrl: string;
      }
    >;
  } = null;

  if (designId) {
    try {
      const loaded = await getDesignState(shop, designId, designVersion);
      const assetIds = [...new Set(loaded.state.items.map((item) => item.assetId))];
      const rows = await prisma.asset.findMany({
        where: { shop, id: { in: assetIds } },
      });
      const assets = Object.fromEntries(
        rows.map((row) => [
          row.id,
          {
            widthPx: row.widthPx,
            heightPx: row.heightPx,
            dpi: row.dpi,
            contentType: row.contentType,
            previewUrl: `${apiBase}/api/assets/${encodeURIComponent(row.id)}`,
          },
        ]),
      );
      design = {
        designId: loaded.design.id,
        version: designVersion ?? loaded.design.currentVersion,
        name: loaded.design.name,
        state: loaded.state,
        assets,
      };
    } catch {
      design = null;
    }
  }

  return Response.json({
    host: "bags",
    shop,
    productGid,
    variantId,
    variantGid,
    quantity,
    parentOrigin,
    apiBase,
    sheet: editorConfig.sheet,
    pricePerSqIn: editorConfig.pricePerSqIn,
    defaultSheetHeightIn: editorConfig.defaultSheetHeightIn,
    binding: editorConfig.binding
      ? {
          id: editorConfig.binding.id,
          builderType: editorConfig.binding.builderType,
          sheetWidthIn: editorConfig.binding.sheetWidthIn,
          sheetHeightIn: editorConfig.binding.sheetHeightIn,
          maxHeightIn: editorConfig.binding.maxHeightIn,
        }
      : null,
    design,
    productionOutput: {
      owner: "bags-render-pipeline",
      note:
        "Studio authors placements. On paid order, BAGS nestAndRenderDesign uses DesignStateV1 with layout=manual and does not re-run Studio packing. Do not invoke the legacy BAGS canvas/packer to reinterpret a Studio document.",
    },
  });
}
