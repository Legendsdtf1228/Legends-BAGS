import { dpiQualityTier } from "../gang-sheet/dpi-quality";
import { SelectionToolbarIcon } from "./bags-selection-toolbar-icons";

export type BagsSelectionToolbarProps = {
  selected: {
    xIn: number;
    yIn: number;
    widthIn: number;
    heightIn: number;
    dpi?: number | null;
    lockAspect?: boolean;
    lockPosition?: boolean;
  };
  multiCount?: number;
  sheetWidth: number;
  sheetHeight: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onChange: (patch: Partial<BagsSelectionToolbarProps["selected"]>) => void;
  onAlign: (mode: string) => void;
  onDistribute: (axis: "horizontal" | "vertical") => void;
  onLayer: (action: "forward" | "backward") => void;
  onRotateCcw: () => void;
  onRotateCw: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onStretchWidth: () => void;
  onStretchHeight: () => void;
  onCenterH: () => void;
  onCenterV: () => void;
  onCenterBoth: () => void;
  onSnapLeft: () => void;
  onSnapRight: () => void;
  onSnapTop: () => void;
  onSnapBottom: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
};

function Num(props: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="bags-sel-field">
      <span>{props.label}</span>
      <input
        type="number"
        step={0.05}
        value={Math.round(props.value * 100) / 100}
        disabled={props.disabled}
        onChange={(e) => props.onChange(+e.target.value)}
        aria-label={props.label}
      />
    </label>
  );
}

function ToolBtn(props: {
  label: string;
  title: string;
  icon: Parameters<typeof SelectionToolbarIcon>[0]["name"];
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`bags-tool-btn ${props.danger ? "bags-tool-danger" : ""}`}
      onClick={props.onClick}
      title={props.title}
      aria-label={props.label}
      disabled={props.disabled}
    >
      <SelectionToolbarIcon name={props.icon} />
    </button>
  );
}

export function BagsSelectionToolbar(props: BagsSelectionToolbarProps) {
  const {
    selected,
    multiCount = 1,
    onChange,
    onAlign,
    onDistribute,
    onLayer,
    onRotateCcw,
    onRotateCw,
    onFlipH,
    onFlipV,
    onStretchWidth,
    onStretchHeight,
    onCenterH,
    onCenterV,
    onCenterBoth,
    onSnapLeft,
    onSnapRight,
    onDelete,
    onDuplicate,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
  } = props;

  const dpiInfo = selected.dpi != null ? dpiQualityTier(selected.dpi) : null;
  const distributeDisabled = multiCount < 3;

  return (
    <div className="bags-parity-selection-bar" role="toolbar" aria-label="Selected artwork">
      {multiCount > 1 ? (
        <span className="bags-sel-dpi" aria-live="polite">
          {multiCount} selected
        </span>
      ) : (
        <>
          <Num label="Left" value={selected.xIn} disabled={selected.lockPosition} onChange={(xIn) => onChange({ xIn })} />
          <Num label="Top" value={selected.yIn} disabled={selected.lockPosition} onChange={(yIn) => onChange({ yIn })} />
          <Num label="Width" value={selected.widthIn} onChange={(widthIn) => onChange({ widthIn })} />
          <Num label="Height" value={selected.heightIn} onChange={(heightIn) => onChange({ heightIn })} />
          <span className={`bags-sel-dpi bags-fitcheck-${dpiInfo?.tier ?? "unknown"}`} title={dpiInfo?.explanation}>
            {selected.dpi ? `${Math.round(selected.dpi)} DPI` : "DPI —"}
          </span>
        </>
      )}

      <div className="bags-sel-actions">
        <ToolBtn label="Align left" title="Align left" icon="alignLeft" onClick={() => onAlign("left")} />
        <ToolBtn label="Align center" title="Align center horizontally" icon="alignCenterH" onClick={() => onAlign("center-h")} />
        <ToolBtn label="Align right" title="Align right" icon="alignRight" onClick={() => onAlign("right")} />
        <ToolBtn label="Align top" title="Align top" icon="alignTop" onClick={() => onAlign("top")} />
        <ToolBtn label="Align middle" title="Align middle" icon="alignMiddle" onClick={() => onAlign("center-v")} />
        <ToolBtn label="Align bottom" title="Align bottom" icon="alignBottom" onClick={() => onAlign("bottom")} />
        <ToolBtn
          label="Distribute horizontally"
          title="Distribute horizontal spacing"
          icon="distributeH"
          onClick={() => onDistribute("horizontal")}
          disabled={distributeDisabled}
        />
        <ToolBtn
          label="Distribute vertically"
          title="Distribute vertical spacing"
          icon="distributeV"
          onClick={() => onDistribute("vertical")}
          disabled={distributeDisabled}
        />
        <ToolBtn label="Layer forward" title="Bring forward" icon="layerForward" onClick={() => onLayer("forward")} />
        <ToolBtn label="Layer backward" title="Send backward" icon="layerBackward" onClick={() => onLayer("backward")} />
        <ToolBtn label="Rotate counter-clockwise" title="Rotate 90° CCW" icon="rotateCcw" onClick={onRotateCcw} />
        <ToolBtn label="Rotate clockwise" title="Rotate 90° CW" icon="rotateCw" onClick={onRotateCw} />
        <ToolBtn label="Flip horizontal" title="Flip horizontal" icon="flipH" onClick={onFlipH} />
        <ToolBtn label="Flip vertical" title="Flip vertical" icon="flipV" onClick={onFlipV} />
        <ToolBtn label="Stretch to width" title="Stretch to artboard width" icon="stretchW" onClick={onStretchWidth} />
        <ToolBtn label="Stretch to height" title="Stretch to artboard height" icon="stretchH" onClick={onStretchHeight} />
        <ToolBtn label="Center horizontally" title="Center horizontally" icon="centerH" onClick={onCenterH} />
        <ToolBtn label="Center vertically" title="Center vertically" icon="centerV" onClick={onCenterV} />
        <ToolBtn label="Center both" title="Center both axes" icon="centerBoth" onClick={onCenterBoth} />
        <ToolBtn label="Snap left" title="Snap left edge" icon="snapLeft" onClick={onSnapLeft} />
        <ToolBtn label="Snap right" title="Snap right edge" icon="snapRight" onClick={onSnapRight} />
        <ToolBtn label="Duplicate" title="Duplicate" icon="duplicate" onClick={onDuplicate} />
        {onUndo ? (
          <ToolBtn label="Undo" title="Undo (Ctrl+Z)" icon="undo" onClick={onUndo} disabled={!canUndo} />
        ) : null}
        {onRedo ? (
          <ToolBtn label="Redo" title="Redo (Ctrl+Y)" icon="redo" onClick={onRedo} disabled={!canRedo} />
        ) : null}
        <ToolBtn label="Delete" title="Delete" icon="delete" onClick={onDelete} danger />
      </div>
    </div>
  );
}
