import { dpiQualityTier } from "../gang-sheet/dpi-quality";

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
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
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
      {props.children}
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
    onSnapTop,
    onSnapBottom,
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
            {selected.dpi ? `${Math.round(selected.dpi)} DPI · ${dpiInfo?.label ?? ""}` : "DPI —"}
          </span>
        </>
      )}

      <div className="bags-sel-actions">
        <ToolBtn label="Align left" title="Align left" onClick={() => onAlign("left")}>
          ⫷
        </ToolBtn>
        <ToolBtn label="Align center" title="Align center horizontally" onClick={() => onAlign("center-h")}>
          ⫿
        </ToolBtn>
        <ToolBtn label="Align right" title="Align right" onClick={() => onAlign("right")}>
          ⫸
        </ToolBtn>
        <ToolBtn label="Align top" title="Align top" onClick={() => onAlign("top")}>
          ⫠
        </ToolBtn>
        <ToolBtn label="Align middle" title="Align middle" onClick={() => onAlign("center-v")}>
          ⫟
        </ToolBtn>
        <ToolBtn label="Align bottom" title="Align bottom" onClick={() => onAlign("bottom")}>
          ⫡
        </ToolBtn>
        <ToolBtn
          label="Distribute horizontally"
          title="Distribute horizontal spacing"
          onClick={() => onDistribute("horizontal")}
          disabled={distributeDisabled}
        >
          ⋯
        </ToolBtn>
        <ToolBtn
          label="Distribute vertically"
          title="Distribute vertical spacing"
          onClick={() => onDistribute("vertical")}
          disabled={distributeDisabled}
        >
          ⋮
        </ToolBtn>
        <ToolBtn label="Layer forward" title="Bring forward" onClick={() => onLayer("forward")}>
          ▴
        </ToolBtn>
        <ToolBtn label="Layer backward" title="Send backward" onClick={() => onLayer("backward")}>
          ▾
        </ToolBtn>
        <ToolBtn label="Rotate counter-clockwise" title="Rotate 90° CCW" onClick={onRotateCcw}>
          ↺
        </ToolBtn>
        <ToolBtn label="Rotate clockwise" title="Rotate 90° CW" onClick={onRotateCw}>
          ↻
        </ToolBtn>
        <ToolBtn label="Flip horizontal" title="Flip horizontal" onClick={onFlipH}>
          ⇋
        </ToolBtn>
        <ToolBtn label="Flip vertical" title="Flip vertical" onClick={onFlipV}>
          ⇅
        </ToolBtn>
        <ToolBtn label="Stretch to width" title="Stretch to artboard width" onClick={onStretchWidth}>
          W
        </ToolBtn>
        <ToolBtn label="Stretch to height" title="Stretch to artboard height" onClick={onStretchHeight}>
          H
        </ToolBtn>
        <ToolBtn label="Center horizontally" title="Center horizontally" onClick={onCenterH}>
          ↔
        </ToolBtn>
        <ToolBtn label="Center vertically" title="Center vertically" onClick={onCenterV}>
          ↕
        </ToolBtn>
        <ToolBtn label="Center both" title="Center both axes" onClick={onCenterBoth}>
          ⊕
        </ToolBtn>
        <ToolBtn label="Snap left" title="Snap left edge" onClick={onSnapLeft}>
          ◧
        </ToolBtn>
        <ToolBtn label="Snap right" title="Snap right edge" onClick={onSnapRight}>
          ◨
        </ToolBtn>
        <ToolBtn label="Duplicate" title="Duplicate" onClick={onDuplicate}>
          ⧉
        </ToolBtn>
        {onUndo ? (
          <ToolBtn label="Undo" title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
            ↶
          </ToolBtn>
        ) : null}
        {onRedo ? (
          <ToolBtn label="Redo" title="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo}>
            ↷
          </ToolBtn>
        ) : null}
        <ToolBtn label="Delete" title="Delete" onClick={onDelete} danger>
          ⌫
        </ToolBtn>
      </div>
    </div>
  );
}
