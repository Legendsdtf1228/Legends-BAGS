import { dpiQualityTier, isLowQualityTier } from "../gang-sheet/dpi-quality";
import type { ImageAdjustments } from "../../../domain/image/image-adjustments";

export type BagsPropertiesSelection = {
  id: string;
  name: string;
  previewUrl: string;
  kind?: "image" | "text";
  assetId: string;
  widthPx: number;
  heightPx: number;
  dpi?: number | null;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg: 0 | 90;
  lockAspect?: boolean;
  lockPosition?: boolean;
  quantity?: number;
  textContent?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  adjustments?: ImageAdjustments;
};

export type BagsPropertiesPanelProps = {
  selected: BagsPropertiesSelection | null;
  multiCount?: number;
  sheetWidth: number;
  sheetHeight: number;
  gap: number;
  artboardMarginEnabled: boolean;
  artboardMarginIn: number;
  onArtboardMarginChange: (enabled: boolean, value: number) => void;
  onChange: (patch: Partial<BagsPropertiesSelection>) => void;
  onAlign: (mode: string) => void;
  onDistribute: (axis: "horizontal" | "vertical") => void;
  onDuplicate: () => void;
  onRotate: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onRemoveBg?: () => void;
  onUpscale?: () => void;
  upscaling?: boolean;
  onOpenImageEditor?: () => void;
  onAutoFill: () => void;
  onDelete: () => void;
  onLayer: (action: "forward" | "backward" | "front" | "back") => void;
  onGapChange: (gap: number) => void;
  round: (n: number) => number;
};

export function BagsPropertiesPanel(props: BagsPropertiesPanelProps) {
  const {
    selected,
    multiCount = 0,
    sheetWidth,
    sheetHeight,
    gap,
    artboardMarginEnabled,
    artboardMarginIn,
    onArtboardMarginChange,
    onChange,
    onAlign,
    onDistribute,
    onDuplicate,
    onRotate,
    onFlipH,
    onFlipV,
    onRemoveBg,
    onUpscale,
    upscaling,
    onOpenImageEditor,
    onAutoFill,
    onDelete,
    onLayer,
    onGapChange,
    round,
  } = props;

  if (!selected) {
    return (
      <>
        <div className="heading">
          <span>
            <strong>Properties</strong>
            <small>Select artwork</small>
          </span>
        </div>
        <div className="none">
          <p>Click artwork on the sheet to edit size, position, DPI, and transforms.</p>
        </div>
      </>
    );
  }

  const dpiTier = selected.kind !== "text" ? dpiQualityTier(selected.dpi) : null;
  const aspect = selected.widthIn / Math.max(0.01, selected.heightIn);
  const adj = selected.adjustments;

  return (
    <>
      <div className="heading">
        <span>
          <strong>Properties</strong>
          <small>
            {multiCount > 1 ? `${multiCount} selected` : selected.kind === "text" ? "Text" : "Image"}
          </small>
        </span>
      </div>

      <div className="preview">
        {selected.kind === "text" ? (
          <span className="text-preview">{selected.textContent ?? selected.name}</span>
        ) : (
          <img src={selected.previewUrl} alt="" className="checkerboard" />
        )}
        <strong>{selected.name}</strong>
        <small>
          {selected.kind === "text"
            ? `${selected.fontFamily} · ${selected.fontSize}pt`
            : `${selected.widthPx} × ${selected.heightPx}px${selected.dpi ? ` · ${Math.round(selected.dpi)} DPI` : ""}`}
        </small>
        {dpiTier ? (
          <span className={`bags-fitcheck bags-fitcheck-${dpiTier.tier}`} role="status">
            Fit check: {dpiTier.label}
            {isLowQualityTier(dpiTier.tier) ? " — consider upscaling or reducing size" : ""}
          </span>
        ) : null}
      </div>

      <div className="fields grid-2">
        <label>
          Width (in)
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={round(selected.widthIn)}
            onChange={(e) => {
              const w = +e.target.value;
              if (selected.kind === "text" || selected.lockAspect === false) onChange({ widthIn: w });
              else onChange({ widthIn: w, heightIn: w / (selected.widthPx / Math.max(1, selected.heightPx)) });
            }}
          />
        </label>
        <label>
          Height (in)
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={round(selected.heightIn)}
            onChange={(e) => {
              const h = +e.target.value;
              if (selected.kind === "text" || selected.lockAspect === false) onChange({ heightIn: h });
              else onChange({ heightIn: h, widthIn: h * (selected.widthPx / Math.max(1, selected.heightPx)) });
            }}
          />
        </label>
        <label>
          Aspect
          <input type="text" readOnly value={aspect.toFixed(2)} aria-label="Aspect ratio" />
        </label>
        <label>
          Qty
          <input
            type="number"
            min={1}
            max={999}
            value={selected.quantity ?? 1}
            onChange={(e) => onChange({ quantity: Math.max(1, Math.round(+e.target.value || 1)) })}
            aria-label="Quantity per placement"
          />
        </label>
        <label>
          Left (in)
          <input
            type="number"
            step={0.05}
            value={round(selected.xIn)}
            disabled={selected.lockPosition}
            onChange={(e) => onChange({ xIn: +e.target.value })}
          />
        </label>
        <label>
          Top (in)
          <input
            type="number"
            step={0.05}
            value={round(selected.yIn)}
            disabled={selected.lockPosition}
            onChange={(e) => onChange({ yIn: +e.target.value })}
          />
        </label>
      </div>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={selected.lockAspect !== false && selected.kind !== "text"}
          onChange={(e) => onChange({ lockAspect: e.target.checked })}
        />
        Lock aspect ratio
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={Boolean(selected.lockPosition)}
          onChange={(e) => onChange({ lockPosition: e.target.checked })}
        />
        Lock position
      </label>

      <fieldset className="bags-settings-group">
        <legend>Artboard margin</legend>
        <label className="bags-check">
          <input
            type="checkbox"
            checked={artboardMarginEnabled}
            onChange={(e) => onArtboardMarginChange(e.target.checked, artboardMarginIn)}
          />
          Show margin guides ({artboardMarginIn}″)
        </label>
      </fieldset>

      {selected.kind === "text" ? (
        <div className="fields">
          <label>
            Text color
            <input type="color" value={selected.textColor ?? "#111827"} onChange={(e) => onChange({ textColor: e.target.value })} />
          </label>
        </div>
      ) : (
        <fieldset className="bags-settings-group">
          <legend>Color adjustments</legend>
          <label className="bags-field">
            Gamma
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={adj?.gamma ?? 1}
              onChange={(e) =>
                onChange({
                  adjustments: { gamma: +e.target.value, contrast: adj?.contrast ?? 1, brightness: adj?.brightness ?? 1, halftoneDotSize: adj?.halftoneDotSize ?? 0, halftoneAngle: adj?.halftoneAngle ?? 45 },
                })
              }
            />
          </label>
          <label className="bags-field">
            Contrast
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={adj?.contrast ?? 1}
              onChange={(e) =>
                onChange({
                  adjustments: { gamma: adj?.gamma ?? 1, contrast: +e.target.value, brightness: adj?.brightness ?? 1, halftoneDotSize: adj?.halftoneDotSize ?? 0, halftoneAngle: adj?.halftoneAngle ?? 45 },
                })
              }
            />
          </label>
          <label className="bags-field">
            Brightness
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={adj?.brightness ?? 1}
              onChange={(e) =>
                onChange({
                  adjustments: { gamma: adj?.gamma ?? 1, contrast: adj?.contrast ?? 1, brightness: +e.target.value, halftoneDotSize: adj?.halftoneDotSize ?? 0, halftoneAngle: adj?.halftoneAngle ?? 45 },
                })
              }
            />
          </label>
        </fieldset>
      )}

      <div className="align-row">
        <span>Align</span>
        <button type="button" onClick={() => onAlign("left")} aria-label="Align left" title="Align left">
          ⫷
        </button>
        <button type="button" onClick={() => onAlign("center-h")} aria-label="Align center" title="Align center">
          ⫿
        </button>
        <button type="button" onClick={() => onAlign("right")} aria-label="Align right" title="Align right">
          ⫸
        </button>
        <button type="button" onClick={() => onAlign("top")} aria-label="Align top" title="Align top">
          ⫠
        </button>
        <button type="button" onClick={() => onAlign("center-v")} aria-label="Align middle" title="Align middle">
          ⫟
        </button>
        <button type="button" onClick={() => onAlign("bottom")} aria-label="Align bottom" title="Align bottom">
          ⫡
        </button>
      </div>

      <div className="actions">
        <button type="button" onClick={onDuplicate}>
          Duplicate Image
        </button>
        <button type="button" onClick={onRotate}>
          Rotate
        </button>
        <button type="button" onClick={onFlipH}>
          Flip H
        </button>
        <button type="button" onClick={onFlipV}>
          Flip V
        </button>
        {selected.kind !== "text" && onOpenImageEditor ? (
          <button type="button" onClick={onOpenImageEditor}>
            FitCheck / Image Editor
          </button>
        ) : null}
        {selected.kind !== "text" && onRemoveBg ? (
          <button type="button" onClick={onRemoveBg}>
            Remove BG
          </button>
        ) : null}
        {selected.kind !== "text" && onUpscale ? (
          <button type="button" onClick={onUpscale} disabled={upscaling}>
            {upscaling ? "Upscaling…" : "Upscale"}
          </button>
        ) : null}
        <button type="button" onClick={onAutoFill}>
          Auto Fill Sheet
        </button>
        <button type="button" className="bags-tool-danger" onClick={onDelete}>
          Delete
        </button>
      </div>

      <div className="layer-actions">
        <span>Layer</span>
        <button type="button" onClick={() => onLayer("forward")} title="Bring forward">
          Forward
        </button>
        <button type="button" onClick={() => onLayer("backward")} title="Send backward">
          Backward
        </button>
        <button type="button" onClick={() => onLayer("front")} title="Bring to front">
          To front
        </button>
        <button type="button" onClick={() => onLayer("back")} title="Send to back">
          To back
        </button>
      </div>

      <div className="align-row">
        <span>Distribute</span>
        <button type="button" onClick={() => onDistribute("horizontal")} title="Distribute horizontally" disabled={multiCount > 0 && multiCount < 3}>
          Horizontal
        </button>
        <button type="button" onClick={() => onDistribute("vertical")} title="Distribute vertically" disabled={multiCount > 0 && multiCount < 3}>
          Vertical
        </button>
      </div>

      <label className="spacing">
        Piece spacing <span>{gap.toFixed(2)} in</span>
        <input type="range" min={0} max={0.5} step={0.05} value={gap} aria-label="Spacing between pieces" onChange={(e) => onGapChange(+e.target.value)} />
      </label>

      <p className="sidebar-hint">
        Sheet {sheetWidth}″ × {sheetHeight}″ — resize to recalculate live DPI tier.
      </p>
    </>
  );
}
