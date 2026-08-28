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
  sheetWidth: number;
  sheetHeight: number;
  onChange: (patch: Partial<BagsSelectionToolbarProps["selected"]>) => void;
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
      />
    </label>
  );
}

export function BagsSelectionToolbar(props: BagsSelectionToolbarProps) {
  const {
    selected,
    onChange,
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
  } = props;

  return (
    <div className="bags-parity-selection-bar" role="toolbar" aria-label="Selected artwork">
      <Num label="Left" value={selected.xIn} disabled={selected.lockPosition} onChange={(xIn) => onChange({ xIn })} />
      <Num label="Top" value={selected.yIn} disabled={selected.lockPosition} onChange={(yIn) => onChange({ yIn })} />
      <Num label="Width" value={selected.widthIn} onChange={(widthIn) => onChange({ widthIn })} />
      <Num label="Height" value={selected.heightIn} onChange={(heightIn) => onChange({ heightIn })} />
      <span className="bags-sel-dpi">{selected.dpi ? `${Math.round(selected.dpi)} DPI` : "DPI —"}</span>

      <div className="bags-sel-actions">
        <button type="button" className="bags-tool-btn" onClick={onRotateCcw} title="Rotate 90° CCW">
          ↺
        </button>
        <button type="button" className="bags-tool-btn" onClick={onRotateCw} title="Rotate 90° CW">
          ↻
        </button>
        <button type="button" className="bags-tool-btn" onClick={onFlipH} title="Flip horizontal">
          ⇋
        </button>
        <button type="button" className="bags-tool-btn" onClick={onFlipV} title="Flip vertical">
          ⇅
        </button>
        <button type="button" className="bags-tool-btn" onClick={onStretchWidth} title="Stretch to artboard width">
          W
        </button>
        <button type="button" className="bags-tool-btn" onClick={onStretchHeight} title="Stretch to artboard height">
          H
        </button>
        <button type="button" className="bags-tool-btn" onClick={onCenterH} title="Center horizontally">
          ↔
        </button>
        <button type="button" className="bags-tool-btn" onClick={onCenterV} title="Center vertically">
          ↕
        </button>
        <button type="button" className="bags-tool-btn" onClick={onCenterBoth} title="Center both">
          ⊕
        </button>
        <button type="button" className="bags-tool-btn" onClick={onSnapLeft} title="Snap left">
          ⫷
        </button>
        <button type="button" className="bags-tool-btn" onClick={onSnapRight} title="Snap right">
          ⫸
        </button>
        <button type="button" className="bags-tool-btn" onClick={onSnapTop} title="Snap top">
          ⫠
        </button>
        <button type="button" className="bags-tool-btn" onClick={onSnapBottom} title="Snap bottom">
          ⫡
        </button>
        <button type="button" className="bags-tool-btn bags-tool-danger" onClick={onDelete} title="Delete">
          ⌫
        </button>
        <button type="button" className="bags-tool-btn" onClick={onDuplicate} title="Duplicate">
          ⧉
        </button>
      </div>
    </div>
  );
}
