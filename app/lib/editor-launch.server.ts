/** Shared editor launch context parsing for customer-facing editors. */
import {
  parseEditorLaunchParams,
  type BuilderLaunchContext,
} from "../domain/builder/builder-launch-context";

export type EditorLaunchPageContext = Omit<BuilderLaunchContext, "builderType"> & {
  designId: string;
  designVersion: string;
  parentOrigin: string;
};

export function readEditorLaunchContext(request: Request): EditorLaunchPageContext | null {
  const url = new URL(request.url);
  const launch = parseEditorLaunchParams(url.searchParams);
  if (!launch) return null;
  return {
    ...launch,
    designId: url.searchParams.get("designId") ?? "",
    designVersion: url.searchParams.get("designVersion") ?? "",
    parentOrigin: url.searchParams.get("parentOrigin") ?? "",
  };
}

export function mergeEditorLaunchFromUrl(
  request: Request,
  fallbackShop: string,
): {
  shop: string;
  productGid: string;
  variantId: string;
  quantity: number;
  shopMode?: string;
  designId: string;
  designVersion: string;
  parentOrigin: string;
} {
  const url = new URL(request.url);
  const launch = parseEditorLaunchParams(url.searchParams);

  return {
    shop: launch?.shop || url.searchParams.get("shop") || fallbackShop,
    productGid:
      launch?.productGid ||
      url.searchParams.get("productGid") ||
      "",
    variantId:
      launch?.variantId ||
      url.searchParams.get("variantId")?.replace(/\D/g, "") ||
      url.searchParams.get("variant")?.replace(/\D/g, "") ||
      "",
    quantity: launch?.quantity ?? 1,
    shopMode: launch?.shopMode || url.searchParams.get("shop_mode") || undefined,
    designId: url.searchParams.get("designId") ?? "",
    designVersion: url.searchParams.get("designVersion") ?? "",
    parentOrigin: url.searchParams.get("parentOrigin") ?? "",
  };
}
