import prisma from "../db.server";
import { getShopAppearance } from "./shop-appearance.server";

export async function loadStorefrontConfig(shop: string, productGid?: string) {
  const appearance = await getShopAppearance(shop);
  const gangSheetVariants = productGid
    ? await prisma.productBinding.findMany({
        where: { shop, productGid, builderType: "gang_sheet" },
        orderBy: { sheetHeightIn: "asc" },
        select: {
          variantGid: true,
          sheetHeightIn: true,
          variantPriceCents: true,
        },
      })
    : [];

  return {
    appearance: {
      accentColor: appearance.accentColor,
      accentColorDark: appearance.accentColorDark,
      launcherOpenLabel: appearance.launcherOpenLabel,
      launcherEditLabel: appearance.launcherEditLabel,
      welcomeTitle: appearance.welcomeTitle,
      welcomeSubtitle: appearance.welcomeSubtitle,
    },
    gangSheetVariants: gangSheetVariants.map((v) => ({
      variantGid: v.variantGid,
      variantId: v.variantGid?.replace("gid://shopify/ProductVariant/", "") ?? null,
      sheetHeightIn: v.sheetHeightIn,
      priceCents: v.variantPriceCents,
    })),
  };
}
