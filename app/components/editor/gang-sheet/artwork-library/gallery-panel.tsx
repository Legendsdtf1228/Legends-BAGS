import { useEffect, useMemo, useState } from "react";
import { ToolbarIcon } from "../editor-toolbar-icons";
import { ArtworkCard } from "./artwork-card";
import {
  formatInches,
  formatPixels,
  galleryCardDpi,
  GALLERY_SORT_LABELS,
  paginateList,
  type GalleryLibraryItem,
  type GallerySort,
} from "./artwork-library-model";
import { ArtworkPagination } from "./artwork-pagination";

type GalleryPanelProps = {
  items: GalleryLibraryItem[];
  categories: string[];
  category: string;
  search: string;
  sort: GallerySort;
  loading: boolean;
  error: string;
  uploading: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: GallerySort) => void;
  onRefresh: () => void;
  onAddToSheet: (item: GalleryLibraryItem, quantity: number) => void;
};

export function GalleryPanel({
  items,
  categories,
  category,
  search,
  sort,
  loading,
  error,
  uploading,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onRefresh,
  onAddToSheet,
}: GalleryPanelProps) {
  const [page, setPage] = useState(1);
  const resetKey = `${search}|${category}|${sort}|${items.length}|${items[0]?.id ?? ""}`;
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const paged = useMemo(() => paginateList(items, page), [items, page]);

  return (
    <div className="lgs-artlib">
      <div className="lgs-artlib-head">
        <span>
          <strong>Gallery</strong>
          <small>Merchant artwork · {items.length} shown</small>
        </span>
        <button
          type="button"
          className="lgs-artlib-iconbtn refresh-btn"
          aria-label="Refresh gallery"
          onClick={onRefresh}
        >
          <ToolbarIcon name="refresh" />
        </button>
      </div>
      <p className="lgs-artlib-lead panel-lead">
        Artwork from your shop&apos;s Gallery Settings — not sample placeholders.
      </p>
      <div className="lgs-artlib-tools sidebar-tools">
        <input
          type="search"
          placeholder="Search gallery…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search gallery"
        />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as GallerySort)}
          aria-label="Sort gallery"
        >
          {Object.entries(GALLERY_SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="lgs-artlib-chips chip-row">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={category === cat ? "lgs-artlib-chip chip active" : "lgs-artlib-chip chip"}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      {loading ? <p className="lgs-artlib-status sidebar-empty">Loading gallery…</p> : null}
      {error ? (
        <p className="lgs-artlib-error gs-save-error">
          {error}{" "}
          <button type="button" className="gs-ghost-btn" onClick={onRefresh}>
            Retry
          </button>
        </p>
      ) : null}
      {!loading && !items.length ? (
        <p className="lgs-artlib-empty sidebar-empty">
          <strong>No gallery artwork yet</strong>
          Add images in Gallery Settings.
        </p>
      ) : null}
      {paged.items.length ? (
        <>
          <div className="lgs-artlib-grid">
            {paged.items.map((item) => {
              const dpi = galleryCardDpi(item);
              return (
                <ArtworkCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  thumbUrl={item.thumb}
                  dimLabel={formatInches(item.widthIn, item.heightIn)}
                  pixelLabel={formatPixels(item.widthPx ?? 0, item.heightPx ?? 0)}
                  dpiLabel={dpi.label}
                  dpiTier={dpi.tier}
                  category={item.category}
                  uploading={uploading}
                  onAddToSheet={(qty) => onAddToSheet(item, qty)}
                />
              );
            })}
          </div>
          <ArtworkPagination
            page={paged.page}
            pageCount={paged.pageCount}
            start={paged.start}
            end={paged.end}
            total={paged.total}
            onPage={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
