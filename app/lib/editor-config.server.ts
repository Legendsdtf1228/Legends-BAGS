import prisma from "../db.server";
import {
  DEFAULT_PRICE_PER_SQ_IN,
  DEFAULT_UPLOAD_BY_SIZE_SHEET,
  type SheetConfig,
} from "../domain/design/types";
import { resolveGangSheetHeight } from "../domain/design/gang-sheet-sheet";
import { ensureShopConfig } from "./merchant-loaders.server";
import { getShopAppearance, type ShopAppearance } from "./shop-appearance.server";

export type EditorBindingConfig = {
  id: string;
  productGid: string;
  variantGid: string | null;
  builderType: string;
  enabled: boolean;
  pricePerSqIn: number | null;
  variantPriceCents: number | null;
  sheetWidthIn: number | null;
  maxHeightIn: number | null;
  sheetHeightIn: number | null;
  imageMarginIn: number | null;
  artboardMarginIn: number | null;
};

export type EditorPageConfig = {
  pricePerSqIn: number;
  sheet: SheetConfig;
  /** Gang sheet canvas height — never the upload-by-size roll cap (360 in). */
  defaultSheetHeightIn: number;
  appearance: ShopAppearance;
  binding: EditorBindingConfig | null;
  gangSheetVariants: EditorBindingConfig[];
};

function toVariantGid(variantId: string | undefined): string | undefined {
  if (!variantId) return undefined;
  if (variantId.startsWith("gid://")) return variantId;
  return `gid://shopify/ProductVariant/${variantId}`;
}

export async function resolveProductBinding(
  shop: string,
  productGid?: string,
  variantGid?: string,
) {
  if (variantGid) {
    const byVariant = await prisma.productBinding.findFirst({
      where: {
        shop,
        variantGid,
        enabled: true,
        productStatus: "ACTIVE",
        AND: [
          {
            OR: [
              { builderType: { not: "gang_sheet" } },
              { sheetHeightIn: { gt: 0 } },
            ],
          },
        ],
      },
    });
    if (byVariant) return byVariant;
    return prisma.productBinding.findFirst({
      where: {
        shop,
        productGid,
        variantGid: null,
        enabled: true,
        productStatus: "ACTIVE",
        AND: [
          {
            OR: [
              { builderType: { not: "gang_sheet" } },
              { sheetHeightIn: { gt: 0 } },
            ],
          },
        ],
      },
    });
  }
  if (productGid) {
    return prisma.productBinding.findFirst({
      where: {
        shop,
        productGid,
        enabled: true,
        productStatus: "ACTIVE",
        AND: [
          {
            OR: [
              { builderType: { not: "gang_sheet" } },
              { sheetHeightIn: { gt: 0 } },
            ],
          },
        ],
      },
    });
  }
  return null;
}

function mapBinding(row: NonNullable<Awaited<ReturnType<typeof resolveProductBinding>>>): EditorBindingConfig {
  return {
    id: row.id,
    productGid: row.productGid,
    variantGid: row.variantGid,
    builderType: row.builderType,
    enabled: row.enabled,
    pricePerSqIn: row.pricePerSqIn,
    variantPriceCents: row.variantPriceCents,
    sheetWidthIn: row.sheetWidthIn,
    maxHeightIn: row.maxHeightIn,
    sheetHeightIn: row.sheetHeightIn,
    imageMarginIn: row.imageMarginIn,
    artboardMarginIn: row.artboardMarginIn,
  };
}

export async function loadEditorPageConfig(
  shop: string,
  productGid?: string,
  variantId?: string,
): Promise<EditorPageConfig> {
  const variantGid = toVariantGid(variantId);
  const [config, binding, appearance, gangRows] = await Promise.all([
    ensureShopConfig(shop),
    resolveProductBinding(shop, productGid, variantGid),
    getShopAppearance(shop),
    productGid
      ? prisma.productBinding.findMany({
          where: { shop, productGid, builderType: "gang_sheet", enabled: true },
          orderBy: { sheetHeightIn: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const gangSheetVariants = gangRows.map(mapBinding);
  const defaultSheetHeightIn = resolveGangSheetHeight({
    variantId,
    bindingSheetHeightIn: binding?.sheetHeightIn,
    bindingMaxHeightIn: binding?.maxHeightIn,
    gangSheetVariants,
  });

  const sheet: SheetConfig = {
    widthIn: binding?.sheetWidthIn ?? config?.sheetWidthIn ?? DEFAULT_UPLOAD_BY_SIZE_SHEET.widthIn,
    maxHeightIn:
      binding?.builderType === "gang_sheet"
        ? defaultSheetHeightIn
        : binding?.maxHeightIn ?? config?.maxHeightIn ?? DEFAULT_UPLOAD_BY_SIZE_SHEET.maxHeightIn,
    imageMarginIn:
      binding?.imageMarginIn ?? config?.imageMarginIn ?? DEFAULT_UPLOAD_BY_SIZE_SHEET.imageMarginIn,
    artboardMarginIn:
      binding?.artboardMarginIn ??
      config?.artboardMarginIn ??
      DEFAULT_UPLOAD_BY_SIZE_SHEET.artboardMarginIn,
  };

  return {
    pricePerSqIn: binding?.pricePerSqIn ?? config?.pricePerSqIn ?? DEFAULT_PRICE_PER_SQ_IN,
    sheet,
    defaultSheetHeightIn,
    appearance,
    binding: binding ? mapBinding(binding) : null,
    gangSheetVariants,
  };
}
