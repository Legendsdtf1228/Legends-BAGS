import { effectiveDpi } from "./dpi-quality";

/** Maps a shop-tenant GalleryAsset + Asset row onto the editor's existing Asset shape. */
export type GalleryAssetRef = {
  assetId?: string | null;
  widthPx?: number | null;
  heightPx?: number | null;
  dpi?: number | null;
  contentType?: string | null;
  thumb?: string | null;
  widthIn: number;
  heightIn: number;
};

export type GalleryPlacementAsset = {
  assetId: string;
  widthPx: number;
  heightPx: number;
  dpi: number | null;
  contentType: string;
};

/** Use the existing Asset — do not rasterize thumbs or invent 300 DPI. */
export function galleryRecordToAsset(g: GalleryAssetRef): {
  asset: GalleryPlacementAsset;
  previewUrl: string;
  printDpi: number | null;
} {
  const assetId = g.assetId?.trim();
  if (!assetId) {
    throw new Error("This gallery item is not linked to a shop asset.");
  }
  if (!g.widthPx || !g.heightPx || g.widthPx <= 0 || g.heightPx <= 0) {
    throw new Error("This gallery item is missing pixel dimensions.");
  }
  if (g.widthIn <= 0 || g.heightIn <= 0) {
    throw new Error("This gallery item is missing physical size.");
  }
  return {
    asset: {
      assetId,
      widthPx: g.widthPx,
      heightPx: g.heightPx,
      dpi: g.dpi != null && Number.isFinite(g.dpi) && g.dpi > 0 ? g.dpi : null,
      contentType: g.contentType || "image/png",
    },
    previewUrl: g.thumb || `/api/assets/${encodeURIComponent(assetId)}`,
    printDpi: effectiveDpi(g.widthPx, g.heightPx, g.widthIn, g.heightIn),
  };
}
