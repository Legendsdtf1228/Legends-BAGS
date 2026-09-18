import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GALLERY_ITEMS } from "../app/components/editor/gang-sheet/editor-data";
import { ARTWORK_LIBRARY_CSS } from "../app/components/editor/gang-sheet/artwork-library/artwork-library-css";
import {
  ARTWORK_PAGE_SIZE,
  UPLOAD_ACCEPT,
  clampQuantity,
  dpiDisplay,
  formatInches,
  formatPixels,
  nativePrintInches,
  paginateList,
  sortGallery,
  sortUploads,
  type UploadLibraryItem,
} from "../app/components/editor/gang-sheet/artwork-library/artwork-library-model";
import { ArtworkCard } from "../app/components/editor/gang-sheet/artwork-library/artwork-card";
import { GalleryPanel } from "../app/components/editor/gang-sheet/artwork-library/gallery-panel";
import { UploadsPanel } from "../app/components/editor/gang-sheet/artwork-library/uploads-panel";
import { GANG_SHEET_EDITOR_CSS } from "../app/components/editor/gang-sheet/gang-sheet-editor-styles";

const noop = () => {};

const sampleUploads: UploadLibraryItem[] = [
  {
    id: "u1",
    name: "eagle.png",
    previewUrl: GALLERY_ITEMS[0].thumb,
    uploadedAt: 30,
    asset: { assetId: "a1", widthPx: 900, heightPx: 900, dpi: 300 },
    onSheetCount: 2,
  },
  {
    id: "u2",
    name: "badge.png",
    previewUrl: GALLERY_ITEMS[1].thumb,
    uploadedAt: 20,
    asset: { assetId: "a2", widthPx: 400, heightPx: 400, dpi: 150 },
    onSheetCount: 0,
  },
  {
    id: "u3",
    name: "wide.png",
    previewUrl: GALLERY_ITEMS[2].thumb,
    uploadedAt: 10,
    asset: { assetId: "a3", widthPx: 2400, heightPx: 800, dpi: 250 },
    onSheetCount: 0,
  },
];

describe("artwork library helpers", () => {
  it("paginates without dropping items and clamps the page", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const first = paginateList(items, 1, 8);
    expect(first.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(first.pageCount).toBe(3);
    expect(paginateList(items, 99, 8).page).toBe(3);
    expect(paginateList(items, 0, 8).page).toBe(1);
    expect(ARTWORK_PAGE_SIZE).toBe(8);
  });

  it("formats production dimensions and DPI", () => {
    expect(formatInches(3, 2.5)).toBe("3×2.5″");
    expect(formatPixels(1200, 1500)).toBe("1200×1500px");
    expect(nativePrintInches(900, 900, 300)).toEqual({ widthIn: 3, heightIn: 3 });
    expect(dpiDisplay(300).label).toBe("300 DPI");
    expect(dpiDisplay(300).tier).toBe("excellent");
    expect(dpiDisplay(150).tier).toBe("poor");
    expect(dpiDisplay(null).tier).toBe("unknown");
  });

  it("clamps quantity for Add to Sheet", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(4.6)).toBe(5);
    expect(clampQuantity(200)).toBe(99);
  });

  it("sorts uploads by recent, name, dpi, and pixel size", () => {
    expect(sortUploads(sampleUploads, "recent").map((i) => i.id)).toEqual(["u1", "u2", "u3"]);
    expect(sortUploads(sampleUploads, "name").map((i) => i.name)).toEqual([
      "badge.png",
      "eagle.png",
      "wide.png",
    ]);
    expect(sortUploads(sampleUploads, "dpi").map((i) => i.id)).toEqual(["u1", "u3", "u2"]);
    expect(sortUploads(sampleUploads, "size")[0].id).toBe("u3");
  });

  it("sorts gallery by name/size/category without mutating default order", () => {
    const original = GALLERY_ITEMS.map((g) => g.id);
    expect(sortGallery(GALLERY_ITEMS, "default").map((g) => g.id)).toEqual(original);
    const bySize = sortGallery(GALLERY_ITEMS, "size");
    expect(bySize[0].widthIn * bySize[0].heightIn).toBeGreaterThanOrEqual(
      bySize[1].widthIn * bySize[1].heightIn,
    );
    const byName = sortGallery(GALLERY_ITEMS, "name");
    expect(byName[0].name <= byName[1].name).toBe(true);
  });
});

describe("artwork library panels", () => {
  it("keeps PNG/JPEG accept and existing auto-build pool styles intact", () => {
    expect(UPLOAD_ACCEPT).toBe("image/png,image/jpeg");
    expect(GANG_SHEET_EDITOR_CSS).toContain(".pool-item");
    expect(ARTWORK_LIBRARY_CSS).toContain(".lgs-artlib-add");
    expect(ARTWORK_LIBRARY_CSS).toContain("--gs-accent");
  });

  it("renders upload cards with dimensions, DPI, quantity, and Add to Sheet", () => {
    const html = renderToStaticMarkup(
      createElement(UploadsPanel, {
        items: sampleUploads,
        totalCount: sampleUploads.length,
        search: "",
        sort: "recent",
        uploading: false,
        inputRef: { current: null },
        onSearchChange: noop,
        onSortChange: noop,
        onRefresh: noop,
        onFiles: noop,
        onAddToSheet: noop,
        onRename: noop,
        onRemoveBackground: noop,
        onDelete: noop,
      }),
    );
    expect(html).toContain("Add to Sheet");
    expect(html).toContain("Search uploads");
    expect(html).toContain("300 DPI");
    expect(html).toContain("900×900px");
    expect(html).toContain("3×3″");
    expect(html).toContain("2 on sheet");
    expect(html).toContain("Rename upload");
    expect(html).toContain("Drop PNG/JPEG");
    expect(html).toContain("image/png,image/jpeg");
  });

  it("renders gallery search, categories, sizes, and Add to Sheet", () => {
    const html = renderToStaticMarkup(
      createElement(GalleryPanel, {
        items: GALLERY_ITEMS,
        categories: ["All", "Sports", "Mascots"],
        category: "All",
        search: "",
        sort: "default",
        loading: false,
        error: "",
        uploading: false,
        onSearchChange: noop,
        onCategoryChange: noop,
        onSortChange: noop,
        onRefresh: noop,
        onAddToSheet: noop,
      }),
    );
    expect(html).toContain("Search gallery");
    expect(html).toContain("Sports");
    expect(html).toContain("Add to Sheet");
    expect(html).toContain("3×3″");
    expect(html).toContain("Basketball");
    expect(html).toContain("Merchant artwork");
    expect(html).not.toContain("Favorite");
  });

  it("keeps Add to Sheet as the card primary action", () => {
    const html = renderToStaticMarkup(
      createElement(ArtworkCard, {
        id: "x",
        name: "logo.png",
        thumbUrl: GALLERY_ITEMS[0].thumb,
        dimLabel: "4×4″",
        dpiLabel: "300 DPI",
        dpiTier: "excellent",
        onAddToSheet: noop,
      }),
    );
    expect(html).toContain("Add to Sheet");
    expect(html).toContain("4×4″");
    expect(html).toContain("300 DPI");
    expect(html).toContain("Quantity for logo.png");
  });
});
