/** Presentational helpers for Uploads/Gallery — maps existing pool/gallery data, not a second store. */

import { dpiQualityTier, effectiveDpi } from "../dpi-quality";

export const ARTWORK_PAGE_SIZE = 8;
export const UPLOAD_ACCEPT = "image/png,image/jpeg";
export const UPLOAD_SORTS = ["recent", "name", "dpi", "size"] as const;
export const GALLERY_SORTS = ["default", "name", "size", "category"] as const;

export type UploadSort = (typeof UPLOAD_SORTS)[number];
export type GallerySort = (typeof GALLERY_SORTS)[number];

export type DpiTier = "excellent" | "good" | "low" | "poor" | "unknown";

export type UploadLibraryItem = {
  id: string;
  name: string;
  previewUrl: string;
  uploadedAt: number;
  asset: {
    assetId: string;
    widthPx: number;
    heightPx: number;
    dpi?: number | null;
  };
  onSheetCount: number;
};

export type GalleryLibraryItem = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  thumb: string;
  widthIn: number;
  heightIn: number;
  assetId?: string;
  widthPx?: number | null;
  heightPx?: number | null;
  dpi?: number | null;
  contentType?: string | null;
};

export function paginateList<T>(items: T[], page: number, pageSize = ARTWORK_PAGE_SIZE) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    total,
    items: items.slice(start, start + pageSize),
    start: total ? start + 1 : 0,
    end: Math.min(start + pageSize, total),
  };
}

export function formatInches(widthIn: number, heightIn: number) {
  return `${formatInch(widthIn)}×${formatInch(heightIn)}″`;
}

export function formatInch(n: number) {
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatPixels(widthPx: number, heightPx: number) {
  if (!widthPx || !heightPx) return "";
  return `${Math.round(widthPx)}×${Math.round(heightPx)}px`;
}

export function nativePrintInches(widthPx: number, heightPx: number, dpi?: number | null) {
  if (!dpi || dpi <= 0 || !widthPx || !heightPx) return null;
  return {
    widthIn: widthPx / dpi,
    heightIn: heightPx / dpi,
  };
}

export function dpiDisplay(dpi?: number | null): { label: string; value: string; tier: DpiTier } {
  const info = dpiQualityTier(dpi);
  if (dpi == null || !Number.isFinite(dpi)) {
    return { label: "DPI n/a", value: "", tier: "unknown" };
  }
  const rounded = Math.round(dpi);
  return { label: `${rounded} DPI`, value: String(rounded), tier: info.tier };
}

/** Print DPI at gallery default inches when source pixels exist; otherwise unavailable. */
export function galleryCardDpi(item: Pick<GalleryLibraryItem, "widthPx" | "heightPx" | "widthIn" | "heightIn">) {
  if (!item.widthPx || !item.heightPx) return dpiDisplay(null);
  return dpiDisplay(effectiveDpi(item.widthPx, item.heightPx, item.widthIn, item.heightIn));
}

export function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, Math.round(value)));
}

export function sortUploads(items: UploadLibraryItem[], sort: UploadSort) {
  const list = [...items];
  list.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "dpi") return (b.asset.dpi ?? -1) - (a.asset.dpi ?? -1);
    if (sort === "size") {
      return b.asset.widthPx * b.asset.heightPx - a.asset.widthPx * a.asset.heightPx;
    }
    return b.uploadedAt - a.uploadedAt;
  });
  return list;
}

export function sortGallery(items: GalleryLibraryItem[], sort: GallerySort) {
  if (sort === "default") return items;
  const list = [...items];
  list.sort((a, b) => {
    if (sort === "size") return b.widthIn * b.heightIn - a.widthIn * a.heightIn;
    if (sort === "category") {
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
  return list;
}

export const UPLOAD_SORT_LABELS: Record<UploadSort, string> = {
  recent: "Recent",
  name: "Name",
  dpi: "DPI",
  size: "Pixels",
};

export const GALLERY_SORT_LABELS: Record<GallerySort, string> = {
  default: "Default",
  name: "Name",
  size: "Size",
  category: "Category",
};
