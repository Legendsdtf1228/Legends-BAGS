import type { ChangeEvent, DragEvent, RefObject } from "react";
import { ToolbarIcon } from "../gang-sheet/editor-toolbar-icons";
import { dpiQualityTier, isLowQualityTier } from "../gang-sheet/dpi-quality";

export type UploadPoolItem = {
  id: string;
  name: string;
  previewUrl: string;
  asset: { assetId: string; dpi?: number | null };
};

export type BagsUploadsPanelProps = {
  uploadPool: UploadPoolItem[];
  filteredPool: UploadPoolItem[];
  uploadSearch: string;
  onUploadSearchChange: (value: string) => void;
  uploadSort: "recent" | "name";
  onUploadSortChange: (value: "recent" | "name") => void;
  uploadView: "grid" | "list";
  onUploadViewChange: (value: "grid" | "list") => void;
  uploading: boolean;
  uploadProgress?: string | null;
  poolTick: number;
  sidebarUploadRef: RefObject<HTMLInputElement>;
  onRefresh: () => void;
  onUploadFiles: (files: File[]) => void;
  onPlace: (poolId: string) => void;
  onRename: (poolId: string, name: string) => void;
  onRemoveBg: (assetId: string, previewUrl: string) => void;
  onDelete: (poolId: string) => void;
  sheetCountForAsset: (assetId: string) => number;
  onAddText?: () => void;
};

export function BagsUploadsPanel(props: BagsUploadsPanelProps) {
  const {
    uploadPool,
    filteredPool,
    uploadSearch,
    onUploadSearchChange,
    uploadSort,
    onUploadSortChange,
    uploadView,
    onUploadViewChange,
    uploading,
    uploadProgress,
    poolTick,
    sidebarUploadRef,
    onRefresh,
    onUploadFiles,
    onPlace,
    onRename,
    onRemoveBg,
    onDelete,
    sheetCountForAsset,
    onAddText,
  } = props;

  function onDrop(e: DragEvent) {
    e.preventDefault();
    onUploadFiles(Array.from(e.dataTransfer.files ?? []));
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    onUploadFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  return (
    <>
      <div className="heading">
        <span>
          <strong>Uploads</strong>
          <small>{uploadPool.length} file{uploadPool.length === 1 ? "" : "s"}</small>
        </span>
        <button type="button" className="refresh-btn" title="Refresh uploads" aria-label="Refresh uploads" onClick={onRefresh}>
          <ToolbarIcon name="refresh" />
        </button>
      </div>

      <div className="sidebar-tools">
        <input
          type="search"
          placeholder="Search uploads…"
          value={uploadSearch}
          onChange={(e) => onUploadSearchChange(e.target.value)}
          aria-label="Search uploads"
        />
        <select value={uploadSort} onChange={(e) => onUploadSortChange(e.target.value as "recent" | "name")} aria-label="Sort uploads">
          <option value="recent">Recent</option>
          <option value="name">Name</option>
        </select>
        <div className="bags-upload-view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={uploadView === "grid" ? "active" : ""}
            onClick={() => onUploadViewChange("grid")}
            aria-pressed={uploadView === "grid"}
          >
            Grid
          </button>
          <button
            type="button"
            className={uploadView === "list" ? "active" : ""}
            onClick={() => onUploadViewChange("list")}
            aria-pressed={uploadView === "list"}
          >
            List
          </button>
        </div>
      </div>

      <p className="sidebar-hint">PNG, JPEG, or WebP — drag here or browse. Click or drag a thumbnail onto the sheet.</p>

      {uploading ? (
        <p className="bags-upload-progress" role="status">
          {uploadProgress ?? "Uploading…"}
        </p>
      ) : null}

      <label className="sidebar-upload-btn drop-target" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        {uploading ? "Uploading…" : "Upload image(s)"}
        <input ref={sidebarUploadRef} type="file" multiple accept="image/png,image/jpeg,image/webp" hidden onChange={onFileInput} />
      </label>

      {onAddText ? (
        <button type="button" className="sidebar-upload-btn bags-add-text-btn" onClick={onAddText}>
          Add Text
        </button>
      ) : null}

      {!filteredPool.length ? (
        <label className="drop compact drop-target" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <strong>{uploadPool.length ? "No matches" : "No uploads yet"}</strong>
          <small>Drop PNG/JPEG/WebP files here or browse above</small>
          <input type="file" multiple accept="image/png,image/jpeg,image/webp" hidden onChange={onFileInput} />
        </label>
      ) : (
        <div className={`pool-grid ${uploadView === "list" ? "list-view" : ""}`} key={poolTick}>
          {filteredPool.map((p) => {
            const dpiInfo = dpiQualityTier(p.asset.dpi);
            const onSheet = sheetCountForAsset(p.asset.assetId);
            return (
              <div key={p.id} className="pool-item-wrap">
                <button
                  type="button"
                  className="pool-item"
                  onClick={() => onPlace(p.id)}
                  title="Click to place on gang sheet"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/pool-id", p.id)}
                >
                  <img src={p.previewUrl} alt="" className="checkerboard" />
                  <span>{p.name}</span>
                  {onSheet ? <em className="on-sheet qty-badge">{onSheet}×</em> : null}
                  {dpiInfo && isLowQualityTier(dpiInfo.tier) ? (
                    <em className={`dpi-badge tier-${dpiInfo.tier}`}>{dpiInfo.label} DPI</em>
                  ) : (
                    <em className={`dpi-badge tier-${dpiInfo.tier}`}>{dpiInfo.label}</em>
                  )}
                </button>
                <div className="pool-item-actions">
                  <input
                    type="text"
                    defaultValue={p.name}
                    aria-label="Rename upload"
                    onBlur={(e) => onRename(p.id, e.target.value || p.name)}
                  />
                  <button type="button" aria-label="Remove background" title="Remove background" onClick={() => onRemoveBg(p.asset.assetId, p.previewUrl)}>
                    Cut
                  </button>
                  <button type="button" aria-label="Delete upload" onClick={() => onDelete(p.id)}>
                    Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
