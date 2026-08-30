import { ToolbarIcon } from "../gang-sheet/editor-toolbar-icons";

export type BagsSheetToolbarProps = {
  sheetWidth: number;
  sheetHeight: number;
  sheetWidths: readonly number[];
  sheetHeights: readonly number[];
  onSheetSizeChange: (width: number, height: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  panMode: boolean;
  onTogglePan: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  onAutoNest: () => void;
  zoomLabel: string;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitSheet: () => void;
};

export function BagsSheetToolbar(props: BagsSheetToolbarProps) {
  const {
    sheetWidth,
    sheetHeight,
    sheetWidths,
    sheetHeights,
    onSheetSizeChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    panMode,
    onTogglePan,
    gridVisible,
    onToggleGrid,
    onAutoNest,
    zoomLabel,
    onZoomOut,
    onZoomIn,
    onFitSheet,
  } = props;

  return (
    <div className="bags-parity-toolbar" role="toolbar" aria-label="Sheet tools">
      <label className="bags-parity-sheet-select">
        <span className="sr-only">Sheet size</span>
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

      <div className="bags-parity-tool-group">
        <button type="button" className="bags-tool-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
          <ToolbarIcon name="undo" />
        </button>
        <button type="button" className="bags-tool-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo">
          <ToolbarIcon name="redo" />
        </button>
      </div>

      <button
        type="button"
        className={`bags-tool-btn ${panMode ? "active" : ""}`}
        onClick={onTogglePan}
        title="Move / pan"
        aria-label="Toggle move and pan mode"
        aria-pressed={panMode}
      >
        <ToolbarIcon name="pan" />
      </button>

      <button
        type="button"
        className={`bags-tool-btn ${gridVisible ? "active" : ""}`}
        onClick={onToggleGrid}
        title="Grid view"
        aria-label="Toggle grid"
        aria-pressed={gridVisible}
      >
        <ToolbarIcon name="grid" />
      </button>

      <div className="bags-toolbar-spacer" aria-hidden />

      <button type="button" className="bags-tool-btn bags-tool-nest" onClick={onAutoNest} title="Auto Nest">
        Auto Nest
      </button>

      <div className="bags-parity-tool-group">
        <button type="button" className="bags-tool-btn" onClick={onZoomOut} aria-label="Zoom out">
          <ToolbarIcon name="zoomOut" />
        </button>
        <span className="bags-zoom-label">{zoomLabel}</span>
        <button type="button" className="bags-tool-btn" onClick={onZoomIn} aria-label="Zoom in">
          <ToolbarIcon name="zoomIn" />
        </button>
        <button type="button" className="bags-tool-btn" onClick={onFitSheet} title="Fit sheet to viewport" aria-label="Fit sheet">
          <ToolbarIcon name="fit" />
        </button>
      </div>
    </div>
  );
}
