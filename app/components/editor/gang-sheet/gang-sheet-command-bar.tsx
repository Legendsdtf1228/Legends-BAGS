import { ToolbarIcon } from "./editor-toolbar-icons";

export type GangSheetCommandBarProps = {
  designName: string | null;
  onDesignNameChange: (name: string) => void;
  sheetWidth: number;
  sheetHeight: number;
  sheetWidths: readonly number[];
  sheetHeights: readonly number[];
  onSheetSizeChange: (width: number, height: number) => void;
  estimateUsd: number;
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onHome: () => void;
  onPreview?: () => void;
  onSaveOnly: () => void;
  onSaveAndCart: () => void;
  saving: boolean;
  saved: boolean;
  hasItems: boolean;
  uploading: boolean;
  onAddFiles: (files: FileList | null) => void;
  onOverflowAction?: (action: "arrange" | "library") => void;
};

export function GangSheetCommandBar(props: GangSheetCommandBarProps) {
  const {
    designName,
    onDesignNameChange,
    sheetWidth,
    sheetHeight,
    sheetWidths,
    sheetHeights,
    onSheetSizeChange,
    estimateUsd,
    zoom,
    onZoomOut,
    onZoomIn,
    onFit,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onHome,
    onPreview,
    onSaveOnly,
    onSaveAndCart,
    saving,
    saved,
    hasItems,
    uploading,
    onAddFiles,
    onOverflowAction,
  } = props;

  return (
    <header className="gs-command-bar" role="banner">
      <div className="gs-command-brand">
        <span className="gs-command-logo" aria-hidden>
          L
        </span>
        <div className="gs-command-brand-text">
          <strong>Legends BAGS</strong>
          <small>Gang Sheet Builder</small>
        </div>
      </div>

      <div className="gs-command-center">
        <label className="gs-design-name-field">
          <span className="sr-only">Design name</span>
          <input
            type="text"
            value={designName ?? ""}
            placeholder="Untitled design"
            maxLength={80}
            onChange={(e) => onDesignNameChange(e.target.value)}
            aria-label="Design name"
          />
        </label>

        <div className="gs-command-divider" aria-hidden />

        <div className="gs-sheet-meta">
          <label className="gs-sheet-select">
            <span>Width</span>
            <select
              value={sheetWidth}
              aria-label="Sheet width"
              onChange={(e) => onSheetSizeChange(+e.target.value, sheetHeight)}
            >
              {sheetWidths.map((w) => (
                <option key={w} value={w}>
                  {w}″
                </option>
              ))}
            </select>
          </label>
          <span className="gs-sheet-times" aria-hidden>
            ×
          </span>
          <label className="gs-sheet-select">
            <span>Length</span>
            <select
              value={sheetHeight}
              aria-label="Sheet length"
              onChange={(e) => onSheetSizeChange(sheetWidth, +e.target.value)}
            >
              {sheetHeights.map((h) => (
                <option key={h} value={h}>
                  {h}″
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="gs-price-pill" aria-label={`Estimated price ${estimateUsd.toFixed(2)} dollars`}>
          <span>Est.</span>
          <strong>${estimateUsd.toFixed(2)}</strong>
        </div>

        <div className="gs-command-divider" aria-hidden />

        <div className="gs-history-group">
          <button
            type="button"
            className="gs-icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            aria-label="Undo"
          >
            <ToolbarIcon name="undo" />
          </button>
          <button
            type="button"
            className="gs-icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            aria-label="Redo"
          >
            <ToolbarIcon name="redo" />
          </button>
        </div>

        <div className="gs-zoom-group" role="group" aria-label="Zoom">
          <button type="button" className="gs-icon-btn" onClick={onZoomOut} title="Zoom out" aria-label="Zoom out">
            <ToolbarIcon name="zoomOut" />
          </button>
          <span className="gs-zoom-label">{zoom}%</span>
          <button type="button" className="gs-icon-btn" onClick={onZoomIn} title="Zoom in" aria-label="Zoom in">
            <ToolbarIcon name="zoomIn" />
          </button>
          <button type="button" className="gs-icon-btn gs-fit-btn" onClick={onFit} title="Fit to viewport" aria-label="Fit to viewport">
            <ToolbarIcon name="fit" />
          </button>
        </div>

        {onPreview ? (
          <button type="button" className="gs-ghost-btn" onClick={onPreview} title="Preview sheet">
            <ToolbarIcon name="preview" />
            <span>Preview</span>
          </button>
        ) : null}
      </div>

      <nav className="gs-command-actions" aria-label="Editor actions">
        <button type="button" className="gs-ghost-btn" onClick={onHome} title="Welcome center" aria-label="Home">
          <ToolbarIcon name="home" />
          <span className="gs-hide-mobile">Home</span>
        </button>

        <label className="gs-add-btn">
          {uploading ? "Uploading…" : "Add"}
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg"
            hidden
            onChange={(e) => {
              onAddFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          className="gs-secondary-btn"
          onClick={onSaveOnly}
          disabled={saving || !hasItems}
          aria-label="Save design"
        >
          <ToolbarIcon name="save" />
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          className="gs-primary-btn"
          onClick={onSaveAndCart}
          disabled={saving || !hasItems}
          aria-label="Save and add to cart"
        >
          <ToolbarIcon name="cart" />
          {saving ? "Saving…" : "Save & Add to Cart"}
        </button>

        <details className="gs-overflow-menu">
          <summary className="gs-icon-btn" aria-label="More actions">
            <ToolbarIcon name="more" />
          </summary>
          <div className="gs-overflow-panel" role="menu">
            <button
              type="button"
              role="menuitem"
              disabled={!hasItems}
              onClick={() => onOverflowAction?.("arrange")}
            >
              Auto arrange
            </button>
            <button type="button" role="menuitem" onClick={() => onOverflowAction?.("library")}>
              Save to library…
            </button>
          </div>
        </details>
      </nav>
    </header>
  );
}
