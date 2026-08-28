import {
  numericIdFromGid,
  normalizeShopDomain,
  type BuilderType,
} from "../domain/builder/builder-launch-context";
import prisma from "../db.server";
import { buildBuilderLaunchUrl } from "./builder-links.server";
import { resolveAppUrl } from "./app-url.server";

export type BuilderRecoveryTarget = {
  shop: string;
  productId: string;
  productGid: string;
  variantId?: string;
  productTitle?: string | null;
  builderType: BuilderType;
  builderUrl: string;
};

/** Primary assigned product for recovery when builder is opened without product context. */
export async function resolveBuilderRecoveryTarget(
  shop: string,
  builderType: BuilderType = "gang_sheet",
): Promise<BuilderRecoveryTarget | null> {
  const binding = await prisma.productBinding.findFirst({
    where: { shop: normalizeShopDomain(shop), builderType },
    orderBy: [{ updatedAt: "desc" }, { sheetHeightIn: "asc" }],
  });
  if (!binding) return null;

  const productId = numericIdFromGid(binding.productGid);
  if (!productId) return null;

  const variantId = numericIdFromGid(binding.variantGid ?? undefined);
  const appUrl = resolveAppUrl();

  return {
    shop: normalizeShopDomain(shop),
    productId,
    productGid: binding.productGid,
    variantId,
    productTitle: binding.productTitle,
    builderType,
    builderUrl: buildBuilderLaunchUrl({
      appUrl,
      shop: normalizeShopDomain(shop),
      productId,
      variantId,
    }),
  };
}

export function builderTypeFromQueryHint(raw: string | null | undefined): BuilderType {
  if (raw === "upload_by_size") return "upload_by_size";
  return "gang_sheet";
}
