import {
  buildEditorLaunchUrl,
  numericIdFromGid,
  type BuilderLaunchContext,
  type BuilderType,
} from "../domain/builder/builder-launch-context";
import { resolveAppUrl } from "./app-url.server";

export type BuilderLinkRow = {
  id: string;
  builderType: BuilderType;
  productId: string;
  variantId?: string;
  sheetHeightIn: number | null;
  builderUrl: string;
};

export function buildBuilderLaunchUrl(params: {
  appUrl: string;
  shop: string;
  productId: string;
  variantId?: string;
  quantity?: number;
  shopMode?: string;
}): string {
  const base = (params.appUrl || resolveAppUrl()).replace(/\/$/, "");
  const url = new URL("/builder", `${base}/`);
  url.searchParams.set("shop", params.shop);
  url.searchParams.set("product", params.productId);
  url.searchParams.set("variant", params.variantId ?? "");
  url.searchParams.set("quantity", String(params.quantity ?? 1));
  url.searchParams.set("shop_mode", params.shopMode ?? "1");
  return url.toString();
}

export function builderLinksFromBindings(
  shop: string,
  appUrl: string,
  bindings: Array<{
    id: string;
    productGid: string;
    variantGid: string | null;
    builderType: string;
    sheetHeightIn: number | null;
  }>,
): BuilderLinkRow[] {
  const base = appUrl || resolveAppUrl();
  return bindings
    .map((row): BuilderLinkRow | null => {
      const builderType: BuilderType =
        row.builderType === "gang_sheet" ? "gang_sheet" : "upload_by_size";
      const productId = numericIdFromGid(row.productGid);
      if (!productId) return null;
      const variantId = numericIdFromGid(row.variantGid);
      return {
        id: row.id,
        builderType,
        productId,
        variantId,
        sheetHeightIn: row.sheetHeightIn,
        builderUrl: buildBuilderLaunchUrl({
          appUrl: base,
          shop,
          productId,
          variantId,
        }),
      };
    })
    .filter((row): row is BuilderLinkRow => row != null);
}

export function editorUrlFromContext(context: BuilderLaunchContext, appUrl?: string): string {
  return buildEditorLaunchUrl(appUrl || resolveAppUrl(), context);
}
