import { useEffect, useMemo, useState, type DragEvent, type RefObject } from "react";
import { ToolbarIcon } from "../editor-toolbar-icons";
import { ArtworkCard } from "./artwork-card";
import { ArtworkDropZone } from "./drop-zone";
import { ArtworkPagination } from "./artwork-pagination";
import {
  dpiDisplay,
  formatInches,
  formatPixels,
  nativePrintInches,
  paginateList,
  UPLOAD_SORT_LABELS,
  type UploadLibraryItem,
  type UploadSort,
} from "./artwork-library-model";

type UploadsPanelProps = {
  items: UploadLibraryItem[];
  totalCount: number;
  search: string;
  sort: UploadSort;
  uploading: boolean;
  gridKey?: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onSortChange: (value: UploadSort) => void;
  onRefresh: () => void;
  onFiles: (files: File[]) => void;
  onAddToSheet: (id: string, quantity: number) => void;
  onRename: (id: string, name: string) => void;
  onRemoveBackground: (assetId: string, previewUrl: string) => void;
  onDelete: (id: string) => void;
};

export function UploadsPanel({
  items,
  totalCount,
  search,
  sort,
  uploading,
  gridKey,
  inputRef,
  onSearchChange,
  onSortChange,
  onRefresh,
  onFiles,
  onAddToSheet,
  onRename,
  onRemoveBackground,
  onDelete,
}: UploadsPanelProps) {
  const [page, setPage] = useState(1);
  const resetKey = `${search}|${sort}|${totalCount}|${items[0]?.id ?? ""}`;
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const paged = useMemo(() => paginateList(items, page), [items, page]);

  function dragStart(id: string) {
    return (event: DragEvent<HTMLElement>) => {
      event.dataTransfer.setData("text/pool-id", id);
    };
  }

  return (
    <div className="lgs-artlib">
      <div className="lgs-artlib-head">
        <span>
          <strong>Uploads</strong>
          <small>
            {totalCount} file{totalCount === 1 ? "" : "s"}
            {search.trim() && totalCount !== items.length ? ` · ${items.length} shown` : ""}
          </small>
        </span>
        <button
          type="button"
          className="lgs-artlib-iconbtn refresh-btn"
          title="Refresh uploads"
          aria-label="Refresh uploads"
          onClick={onRefresh}
        >
          <ToolbarIcon name="refresh" />
        </button>
      </div>
      <div className="lgs-artlib-tools sidebar-tools">
        <input
          type="search"
          placeholder="Search uploads…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search uploads"
        />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as UploadSort)}
          aria-label="Sort uploads"
        >
          {Object.entries(UPLOAD_SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <ArtworkDropZone
        compact={items.length > 0}
        empty={totalCount === 0}
        noMatches={totalCount > 0 && items.length === 0}
        uploading={uploading}
        inputRef={inputRef}
        onFiles={onFiles}
      />
      {!items.length && totalCount > 0 ? (
        <p className="lgs-artlib-empty sidebar-empty">
          <strong>No matches</strong>
          Clear search or drop new files.
        </p>
      ) : null}
      {items.length ? (
        <>
          <div className="lgs-artlib-grid" key={gridKey}>
            {paged.items.map((item) => {
              const dpi = dpiDisplay(item.asset.dpi);
              const print = nativePrintInches(item.asset.widthPx, item.asset.heightPx, item.asset.dpi);
              const dimLabel = print
                ? formatInches(print.widthIn, print.heightIn)
                : formatPixels(item.asset.widthPx, item.asset.heightPx) || "Size n/a";
              return (
                <ArtworkCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  thumbUrl={item.previewUrl}
                  dimLabel={dimLabel}
                  pixelLabel={formatPixels(item.asset.widthPx, item.asset.heightPx)}
                  dpiLabel={dpi.label}
                  dpiTier={dpi.tier}
                  onSheetCount={item.onSheetCount}
                  uploading={uploading}
                  draggable
                  onDragStart={dragStart(item.id)}
                  onAddToSheet={(qty) => onAddToSheet(item.id, qty)}
                  renameValue={item.name}
                  onRename={(name) => onRename(item.id, name)}
                  onRemoveBackground={() => onRemoveBackground(item.asset.assetId, item.previewUrl)}
                  onDelete={() => onDelete(item.id)}
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
