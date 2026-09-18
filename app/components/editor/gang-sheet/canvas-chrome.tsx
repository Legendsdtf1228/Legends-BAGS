import type { ReactNode } from "react";
import { ToolbarIcon } from "./editor-toolbar-icons";
import {
  isActiveSheetTab,
  pieceCountLabel,
  rulerLabels,
  selectedCountLabel,
  sheetTabItems,
  type SelectionBounds,
  type SheetTabSource,
} from "./canvas-workspace";

function stopChromeEvent(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

export function CanvasMetaBar(props: {
  sheetWidth: number;
  sheetHeight: number;
  utilization: number;
  itemCount: number;
  selectedCount: number;
  snapEnabled: boolean;
  onSnapChange: (enabled: boolean) => void;
  zoomLabel: string;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitWidth: () => void;
  onFitSheet: () => void;
}) {
  const selectedLabel = selectedCountLabel(props.selectedCount);
  return (
    <div className="canvas-meta" data-canvas-chrome="meta">
      <div className="canvas-meta-readout">
        <strong>
          {props.sheetWidth} × {props.sheetHeight} in
        </strong>
        <span className="canvas-meta-sep" aria-hidden />
        <span className="canvas-meta-stat">
          {props.utilization}% used · {pieceCountLabel(props.itemCount)}
        </span>
        {selectedLabel ? (
          <>
            <span className="canvas-meta-sep" aria-hidden />
            <span className="canvas-meta-selected">{selectedLabel}</span>
          </>
        ) : null}
      </div>
      <label className="toggle-row inline">
        <input
          type="checkbox"
          checked={props.snapEnabled}
          onChange={(e) => props.onSnapChange(e.target.checked)}
        />{" "}
        Snap
      </label>
      <CanvasZoomControls
        zoomLabel={props.zoomLabel}
        onZoomOut={props.onZoomOut}
        onZoomIn={props.onZoomIn}
        onFitWidth={props.onFitWidth}
        onFitSheet={props.onFitSheet}
      />
    </div>
  );
}

export function CanvasZoomControls(props: {
  zoomLabel: string;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitWidth: () => void;
  onFitSheet: () => void;
}) {
  return (
    <div className="canvas-zoom" role="group" aria-label="Zoom" data-canvas-chrome="zoom">
      <button type="button" onClick={props.onZoomOut} title="Zoom out" aria-label="Zoom out">
        <ToolbarIcon name="zoomOut" />
      </button>
      <span className="canvas-zoom-label">{props.zoomLabel}</span>
      <button type="button" onClick={props.onZoomIn} title="Zoom in" aria-label="Zoom in">
        <ToolbarIcon name="zoomIn" />
      </button>
      <button
        type="button"
        className="canvas-zoom-fit"
        onClick={props.onFitWidth}
        title="Fit width"
        aria-label="Fit width"
      >
        Width
      </button>
      <button
        type="button"
        className="canvas-zoom-fit"
        onClick={props.onFitSheet}
        title="Fit full sheet"
        aria-label="Fit full sheet"
      >
        Fit
      </button>
    </div>
  );
}

export function CanvasRulers(props: { sheetWidth: number; sheetHeight: number }) {
  const hLabels = rulerLabels(props.sheetWidth);
  const vLabels = rulerLabels(props.sheetHeight, 48);
  return (
    <>
      <div className="ruler-corner" aria-hidden />
      <div className="ruler-h" aria-hidden>
        {hLabels.map((i) => (
          <span key={i} style={{ left: `${(i / props.sheetWidth) * 100}%` }}>
            {i}
          </span>
        ))}
      </div>
      <div className="ruler-v" aria-hidden>
        {vLabels.map((i) => (
          <span key={i} style={{ top: `${(i / props.sheetHeight) * 100}%` }}>
            {i}
          </span>
        ))}
      </div>
    </>
  );
}

export function CanvasEmptyState(props: {
  onUpload: () => void;
  onGallery: () => void;
  onText: () => void;
}) {
  return (
    <div className="empty canvas-empty" data-canvas-chrome="empty">
      <span className="canvas-empty-icon" aria-hidden>
        +
      </span>
      <strong>Empty sheet</strong>
      <small>
        Upload files, pick Gallery artwork, or add text — then drag pieces on this sheet.
      </small>
      <div className="canvas-empty-actions">
        <button
          type="button"
          className="primary"
          onClick={(e) => {
            e.stopPropagation();
            props.onUpload();
          }}
          onPointerDown={stopChromeEvent}
        >
          Upload files
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onGallery();
          }}
          onPointerDown={stopChromeEvent}
        >
          Gallery
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onText();
          }}
          onPointerDown={stopChromeEvent}
        >
          Add text
        </button>
      </div>
    </div>
  );
}

type AlignMode = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";

export function CanvasAlignToolbar(props: {
  selectedCount: number;
  onAlign: (mode: AlignMode) => void;
  onDistribute: (axis: "horizontal" | "vertical") => void;
}) {
  if (props.selectedCount < 1) return null;
  const canDistribute = props.selectedCount >= 3;
  return (
    <div
      className="canvas-align-bar"
      role="toolbar"
      aria-label="Align selection"
      data-canvas-chrome="align"
      onClick={stopChromeEvent}
      onPointerDown={stopChromeEvent}
    >
      <div className="canvas-align-group">
        <span className="canvas-align-label">Align</span>
        <AlignButton label="Align left" onClick={() => props.onAlign("left")}>
          <AlignLeftIcon />
        </AlignButton>
        <AlignButton label="Align center" onClick={() => props.onAlign("center-h")}>
          <AlignCenterHIcon />
        </AlignButton>
        <AlignButton label="Align right" onClick={() => props.onAlign("right")}>
          <AlignRightIcon />
        </AlignButton>
        <AlignButton label="Align top" onClick={() => props.onAlign("top")}>
          <AlignTopIcon />
        </AlignButton>
        <AlignButton label="Align middle" onClick={() => props.onAlign("center-v")}>
          <AlignMiddleIcon />
        </AlignButton>
        <AlignButton label="Align bottom" onClick={() => props.onAlign("bottom")}>
          <AlignBottomIcon />
        </AlignButton>
      </div>
      <div className="canvas-align-group">
        <span className="canvas-align-label">Dist</span>
        <button
          type="button"
          className="canvas-align-text"
          disabled={!canDistribute}
          title={canDistribute ? "Distribute horizontally" : "Select at least 3 items to distribute"}
          aria-label="Distribute horizontally"
          onClick={() => props.onDistribute("horizontal")}
        >
          H
        </button>
        <button
          type="button"
          className="canvas-align-text"
          disabled={!canDistribute}
          title={canDistribute ? "Distribute vertically" : "Select at least 3 items to distribute"}
          aria-label="Distribute vertically"
          onClick={() => props.onDistribute("vertical")}
        >
          V
        </button>
      </div>
    </div>
  );
}

function AlignButton(props: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" title={props.label} aria-label={props.label} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

function AlignLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path fill="currentColor" d="M2 1h1.2v14H2zM5 4h9v3H5zM5 9h6v3H5z" />
    </svg>
  );
}
function AlignCenterHIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path fill="currentColor" d="M7.4 1h1.2v14H7.4zM4 4h8v3H4zM5.5 9h5v3h-5z" />
    </svg>
  );
}
function AlignRightIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path fill="currentColor" d="M12.8 1H14v14h-1.2zM2 4h9v3H2zM5 9h6v3H5z" />
    </svg>
  );
}
function AlignTopIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path fill="currentColor" d="M1 2h14v1.2H1zM4 5h3v9H4zM9 5h3v6H9z" />
    </svg>
  );
}
function AlignMiddleIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path fill="currentColor" d="M1 7.4h14v1.2H1zM4 3h3v10H4zM9 5h3v6H9z" />
    </svg>
  );
}
function AlignBottomIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path fill="currentColor" d="M1 12.8h14V14H1zM4 2h3v9H4zM9 5h3v6H9z" />
    </svg>
  );
}

export function CanvasSheetTabs(props: {
  templates: readonly SheetTabSource[];
  sheetWidth: number;
  sheetHeight: number;
  onSelect: (widthIn: number, heightIn: number) => void;
}) {
  const tabs = sheetTabItems(props.templates, props.sheetWidth, props.sheetHeight);
  return (
    <div className="canvas-sheet-tabs" role="tablist" aria-label="Sheet size" data-canvas-chrome="tabs">
      {tabs.map((tab) => {
        const active = isActiveSheetTab(tab, props.sheetWidth, props.sheetHeight);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? "active" : ""}
            title={tab.title}
            onClick={() => props.onSelect(tab.widthIn, tab.heightIn)}
          >
            {tab.label}″
          </button>
        );
      })}
    </div>
  );
}

export function CanvasSelectionBounds(props: {
  bounds: SelectionBounds | null;
  sheetWidth: number;
  sheetHeight: number;
}) {
  if (!props.bounds) return null;
  return (
    <div
      className="canvas-select-bounds"
      data-canvas-chrome="multi-bounds"
      aria-hidden
      style={{
        left: `${(props.bounds.xIn / props.sheetWidth) * 100}%`,
        top: `${(props.bounds.yIn / props.sheetHeight) * 100}%`,
        width: `${(props.bounds.widthIn / props.sheetWidth) * 100}%`,
        height: `${(props.bounds.heightIn / props.sheetHeight) * 100}%`,
      }}
    />
  );
}
