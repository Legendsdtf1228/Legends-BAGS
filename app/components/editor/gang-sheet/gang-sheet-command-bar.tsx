import type { ReactNode } from "react";
import { ToolbarIcon } from "./editor-toolbar-icons";

export type OverflowAction =
  | "arrange"
  | "duplicate-design"
  | "clear-sheet"
  | "shortcuts"
  | "help"
  | "library"
  | "exit";

export type GangSheetCommandBarProps = {
  designName: string | null;
  onDesignNameChange: (name: string) => void;
  dirty: boolean;
  saved: boolean;
  sheetWidth: number;
  sheetHeight: number;
  sheetWidths: readonly number[];
  sheetHeights: readonly number[];
  onSheetSizeChange: (width: number, height: number) => void;
  estimateUsd: number;
  zoomLabel: string;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitWidth: () => void;
  onFitSheet: () => void;
  panMode: boolean;
  onTogglePan: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onHome: () => void;
  onPreview?: () => void;
  onSaveOnly: () => void;
  onSaveAndCart: () => void;
  saving: boolean;
  hasItems: boolean;
  onOverflowAction?: (action: OverflowAction) => void;
  qualityButton?: ReactNode;
};

export function GangSheetCommandBar(props: GangSheetCommandBarProps) {
  const {
    designName,
    onDesignNameChange,
    dirty,
    saved,
    sheetWidth,
    sheetHeight,
    sheetWidths,
    sheetHeights,
    onSheetSizeChange,
    estimateUsd,
    zoomLabel,
    onZoomOut,
    onZoomIn,
    onFitWidth,
    onFitSheet,
    panMode,
    onTogglePan,
    gridVisible,
    onToggleGrid,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onHome,
    onPreview,
    onSaveOnly,
    onSaveAndCart,
    saving,
    hasItems,
    onOverflowAction,
    qualityButton,
  } = props;

  const saveState =
    saving ? "Saving…" : saved && !dirty ? "Saved" : dirty ? "Unsaved changes" : "Saved";

  return (
    <header className="gs-command-bar" role="banner">
      <div className="gs-command-left">
        <span className="gs-command-logo" aria-hidden>
          L
        </span>
        <button type="button" className="gs-ghost-btn gs-back-btn" onClick={onHome} title="Welcome Center" aria-label="Back to Welcome Center">
          <ToolbarIcon name="home" />
        </button>
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
        <span className={`gs-save-state ${dirty ? "dirty" : "clean"}`} aria-live="polite">
          {saveState}
        </span>
      </div>

      <div className="gs-command-center">
        <div className="gs-history-group">
          <button type="button" className="gs-icon-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
            <ToolbarIcon name="undo" />
          </button>
          <button type="button" className="gs-icon-btn" onClick={onRedo} disabled={!canRedo} title="Redo" aria-label="Redo">
            <ToolbarIcon name="redo" />
          </button>
        </div>

        <div className="gs-zoom-group" role="group" aria-label="Zoom">
          <button type="button" className="gs-icon-btn" onClick={onZoomOut} title="Zoom out" aria-label="Zoom out">
            <ToolbarIcon name="zoomOut" />
          </button>
          <span className="gs-zoom-label">{zoomLabel}</span>
          <button type="button" className="gs-icon-btn" onClick={onZoomIn} title="Zoom in" aria-label="Zoom in">
            <ToolbarIcon name="zoomIn" />
          </button>
          <button type="button" className="gs-ghost-btn gs-zoom-mode-btn" onClick={onFitWidth} title="Fit width" aria-label="Fit width">
            Width
          </button>
          <button type="button" className="gs-icon-btn gs-fit-btn" onClick={onFitSheet} title="Fit full sheet" aria-label="Fit full sheet">
            <ToolbarIcon name="fit" />
          </button>
        </div>

        <button
          type="button"
          className={`gs-icon-btn ${panMode ? "active" : ""}`}
          onClick={onTogglePan}
          title="Pan mode (hold Space)"
          aria-label="Toggle pan mode"
          aria-pressed={panMode}
        >
          <ToolbarIcon name="pan" />
        </button>

        <button
          type="button"
          className={`gs-icon-btn ${gridVisible ? "active" : ""}`}
          onClick={onToggleGrid}
          title="Toggle grid"
          aria-label="Toggle grid"
          aria-pressed={gridVisible}
        >
          <ToolbarIcon name="grid" />
        </button>

        {onPreview ? (
          <button type="button" className="gs-ghost-btn" onClick={onPreview} title="Preview sheet">
            <ToolbarIcon name="preview" />
            <span>Preview</span>
          </button>
        ) : null}

        {qualityButton}
      </div>

      <nav className="gs-command-right" aria-label="Editor actions">
        <div className="gs-sheet-meta">
          <label className="gs-sheet-select">
            <span>Size</span>
            <select
              value={`${sheetWidth}x${sheetHeight}`}
              aria-label="Sheet size"
              onChange={(e) => {
                const [w, h] = e.target.value.split("x").map(Number);
                if (w && h) onSheetSizeChange(w, h);
              }}
            >
              {sheetWidths.flatMap((w) =>
                sheetHeights.map((h) => (
                  <option key={`${w}-${h}`} value={`${w}x${h}`}>
                    {w} × {h}″
                  </option>
                )),
              )}
            </select>
          </label>
        </div>

        <div className="gs-price-pill" aria-label={`Estimated price ${estimateUsd.toFixed(2)} dollars`}>
          <strong>${estimateUsd.toFixed(2)}</strong>
        </div>

        <button
          type="button"
          className="gs-secondary-btn"
          onClick={onSaveOnly}
          disabled={saving || !hasItems}
          aria-label="Save design"
        >
          <ToolbarIcon name="save" />
          {saving ? "Saving…" : "Save"}
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
            <button type="button" role="menuitem" disabled={!hasItems} onClick={() => onOverflowAction?.("arrange")}>
              Auto Arrange…
            </button>
            <button type="button" role="menuitem" disabled={!hasItems} onClick={() => onOverflowAction?.("duplicate-design")}>
              Duplicate design
            </button>
            <button type="button" role="menuitem" disabled={!hasItems} onClick={() => onOverflowAction?.("clear-sheet")}>
              Clear sheet…
            </button>
            <button type="button" role="menuitem" onClick={() => onOverflowAction?.("library")}>
              Save to library…
            </button>
            <button type="button" role="menuitem" onClick={() => onOverflowAction?.("shortcuts")}>
              Keyboard shortcuts
            </button>
            <button type="button" role="menuitem" onClick={() => onOverflowAction?.("help")}>
              Help
            </button>
            <button type="button" role="menuitem" onClick={() => onOverflowAction?.("exit")}>
              Exit to Welcome Center
            </button>
          </div>
        </details>
      </nav>
    </header>
  );
}
