import { useEffect, useState } from "react";
import type { AlignMode } from "../gang-sheet-helpers";
import { round } from "../gang-sheet-helpers";
import {
  artworkPrintQuality,
  DEFAULT_ARTWORK_TREATMENT,
  type ArtworkTreatmentPreview,
} from "./artwork-inspector-quality";

export type ArtworkInspectorItem = {
  id: string;
  name: string;
  previewUrl: string;
  assetId: string;
  kind?: "image" | "text";
  widthPx: number;
  heightPx: number;
  dpi?: number | null;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg: 0 | 90;
  flipX?: boolean;
  flipY?: boolean;
  lockPosition?: boolean;
  lockAspect?: boolean;
  textContent?: string;
  fontSize?: number;
  fontFamily?: string;
};

export type ArtworkInspectorProps = {
  selected: ArtworkInspectorItem | null;
  gap: number;
  usedArea: number;
  utilization: number;
  estimate: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onChange: (patch: Partial<ArtworkInspectorItem>) => void;
  onDuplicate: () => void;
  onRotate: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onDelete: () => void;
  onFillSheet: () => void;
  onRemoveBackground: () => void;
  onAlign: (mode: AlignMode) => void;
  onDistribute: (axis: "horizontal" | "vertical") => void;
  onLayer: (mode: "forward" | "backward" | "front" | "back") => void;
  onGapChange: (gap: number) => void;
  onSaveToLibrary: () => void;
};

function canRemoveBackground(item: ArtworkInspectorItem) {
  return item.kind !== "text" && !item.assetId.startsWith("text-");
}

function aspectLocked(item: ArtworkInspectorItem) {
  return item.lockAspect !== false && item.kind !== "text";
}

function pieceTransform(item: ArtworkInspectorItem) {
  return `rotate(${item.rotationDeg}deg) scaleX(${item.flipX ? -1 : 1}) scaleY(${item.flipY ? -1 : 1})`;
}

export function ArtworkInspector(props: ArtworkInspectorProps) {
  const { selected } = props;
  const quality = selected ? artworkPrintQuality(selected) : null;
  const locked = selected ? aspectLocked(selected) : false;
  const [treatment, setTreatment] = useState<ArtworkTreatmentPreview>(DEFAULT_ARTWORK_TREATMENT);

  useEffect(() => {
    setTreatment(DEFAULT_ARTWORK_TREATMENT);
  }, [selected?.id]);

  const previewClip =
    treatment.trimPct > 0 ? `inset(${treatment.trimPct}% ${treatment.trimPct}% ${treatment.trimPct}% ${treatment.trimPct}%)` : undefined;
  const showOverlay = selected?.kind !== "text" && treatment.overlayAmount > 0;
  const showHalftone = selected?.kind !== "text" && treatment.halftone;
  const previewOnly = showOverlay || showHalftone || treatment.trimPct > 0;

  return (
    <aside className={`properties gs-art-panel ${props.mobileOpen ? "mobile-open" : ""}`}>
      <button
        type="button"
        className="mobile-drawer-close"
        onClick={props.onCloseMobile}
        aria-label="Close properties panel"
      >
        ×
      </button>
      <div className="gs-art-head">
        <span>
          <strong>Artwork</strong>
          <small>{selected ? selected.name : "Select an item"}</small>
        </span>
      </div>

      <div className="gs-art-scroll">
        {selected ? (
          <>
            <div className="gs-art-preview">
              <div className="gs-art-preview-frame checkerboard">
                {selected.kind === "text" ? (
                  <span className="gs-art-text-preview text-preview">{selected.textContent ?? selected.name}</span>
                ) : (
                  <div className="gs-art-preview-stack" style={{ clipPath: previewClip, transform: pieceTransform(selected) }}>
                    <img src={selected.previewUrl} alt="" className="checkerboard" />
                    {showOverlay ? (
                      <span
                        className="gs-art-overlay"
                        style={{ background: treatment.overlayColor, opacity: treatment.overlayAmount / 100 }}
                      />
                    ) : null}
                    {showHalftone ? (
                      <span
                        className="gs-art-halftone"
                        style={{ backgroundSize: `${Math.max(3, Math.round(72 / Math.max(8, treatment.halftoneLpi)))}px` }}
                      />
                    ) : null}
                  </div>
                )}
              </div>
              {previewOnly ? <p className="gs-art-preview-note">Panel preview only — print output is unchanged</p> : null}
              <div className="gs-art-preview-meta">
                <strong>{selected.name}</strong>
                <small>
                  {selected.kind === "text"
                    ? `${selected.fontFamily} · ${selected.fontSize}pt`
                    : `${selected.widthPx} × ${selected.heightPx}px`}
                </small>
              </div>
            </div>

            {quality ? (
              <div className={`gs-art-dpi dpi-warn tier-${quality.info.tier}`} role="status">
                <div className="gs-art-dpi-row">
                  <span className="gs-art-dpi-kicker">Print quality</span>
                  <span className={`gs-art-dpi-badge dpi-badge tier-${quality.info.tier}`}>
                    {quality.info.label}
                    {quality.printDpi != null ? ` · ${Math.round(quality.printDpi)} DPI` : ""}
                  </span>
                </div>
                {quality.warn ? <p className="gs-art-dpi-copy">{quality.info.explanation}</p> : null}
                <p className="gs-art-dpi-meta">
                  {quality.taggedDpi != null ? `Tagged ${Math.round(quality.taggedDpi)} DPI · ` : "DPI not tagged · "}
                  at {round(selected.widthIn)} × {round(selected.heightIn)} in
                </p>
              </div>
            ) : null}

            <section className="gs-art-section" aria-label="Size">
              <span className="gs-art-section-label">Size</span>
              <div className="gs-art-size">
                <label className="gs-art-num">
                  W
                  <span className="gs-art-num-wrap">
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={round(selected.widthIn)}
                      aria-label="Width (in)"
                      onChange={(e) => {
                        const w = +e.target.value;
                        if (selected.kind === "text" || selected.lockAspect === false) {
                          props.onChange({ widthIn: w });
                        } else {
                          props.onChange({
                            widthIn: w,
                            heightIn: w / (selected.widthPx / selected.heightPx),
                          });
                        }
                      }}
                    />
                    <span className="gs-art-unit">in</span>
                  </span>
                </label>
                <button
                  type="button"
                  className="gs-art-lock lock-aspect"
                  aria-label="Lock aspect ratio"
                  aria-pressed={locked}
                  disabled={selected.kind === "text"}
                  title={locked ? "Aspect ratio locked" : "Unlock aspect ratio"}
                  onClick={() => {
                    if (selected.kind === "text") return;
                    props.onChange({ lockAspect: !locked });
                  }}
                >
                  {locked ? "⛓" : "╌"}
                </button>
                <label className="gs-art-num">
                  H
                  <span className="gs-art-num-wrap">
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={round(selected.heightIn)}
                      aria-label="Height (in)"
                      onChange={(e) => {
                        const h = +e.target.value;
                        if (selected.kind === "text" || selected.lockAspect === false) {
                          props.onChange({ heightIn: h });
                        } else {
                          props.onChange({
                            heightIn: h,
                            widthIn: h * (selected.widthPx / selected.heightPx),
                          });
                        }
                      }}
                    />
                    <span className="gs-art-unit">in</span>
                  </span>
                </label>
              </div>
            </section>

            <section className="gs-art-section" aria-label="Transform">
              <span className="gs-art-section-label">Rotate &amp; flip</span>
              <div className="gs-art-transform">
                <div className="gs-art-seg" role="group" aria-label="Rotation">
                  <button
                    type="button"
                    aria-pressed={selected.rotationDeg === 0}
                    onClick={() => props.onChange({ rotationDeg: 0 })}
                  >
                    0°
                  </button>
                  <button
                    type="button"
                    aria-pressed={selected.rotationDeg === 90}
                    onClick={() => props.onChange({ rotationDeg: 90 })}
                  >
                    90°
                  </button>
                </div>
                <button type="button" className="gs-art-tool" onClick={props.onRotate} aria-label="Rotate selected">
                  ↻ Rotate
                </button>
                <button
                  type="button"
                  className="gs-art-tool"
                  aria-pressed={Boolean(selected.flipX)}
                  onClick={props.onFlipHorizontal}
                  aria-label="Flip horizontal"
                >
                  ⇋ Flip H
                </button>
                <button
                  type="button"
                  className="gs-art-tool"
                  aria-pressed={Boolean(selected.flipY)}
                  onClick={props.onFlipVertical}
                  aria-label="Flip vertical"
                >
                  ⇅ Flip V
                </button>
              </div>
            </section>

            <div className="gs-art-primary">
              <button type="button" className="gs-art-dup" onClick={props.onDuplicate} aria-label="Duplicate selected">
                Duplicate
              </button>
              <button type="button" className="gs-art-del" onClick={props.onDelete} aria-label="Delete selected">
                Delete
              </button>
            </div>

            <details className="gs-art-advanced">
              <summary>Advanced</summary>
              <div className="gs-art-advanced-body">
                <span className="gs-art-sublabel">Placement</span>
                <div className="gs-art-grid-2">
                  <label className="gs-art-num">
                    X
                    <span className="gs-art-num-wrap">
                      <input
                        type="number"
                        step={0.05}
                        value={round(selected.xIn)}
                        disabled={selected.lockPosition}
                        aria-label="X (in)"
                        onChange={(e) => props.onChange({ xIn: +e.target.value })}
                      />
                      <span className="gs-art-unit">in</span>
                    </span>
                  </label>
                  <label className="gs-art-num">
                    Y
                    <span className="gs-art-num-wrap">
                      <input
                        type="number"
                        step={0.05}
                        value={round(selected.yIn)}
                        disabled={selected.lockPosition}
                        aria-label="Y (in)"
                        onChange={(e) => props.onChange({ yIn: +e.target.value })}
                      />
                      <span className="gs-art-unit">in</span>
                    </span>
                  </label>
                </div>
                <label className="gs-art-check toggle-row">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.lockPosition)}
                    onChange={(e) => props.onChange({ lockPosition: e.target.checked })}
                  />
                  Lock position
                </label>

                <span className="gs-art-sublabel">Align</span>
                <div className="gs-art-grid-3 align-row">
                  <button type="button" className="gs-art-tool" onClick={() => props.onAlign("left")} aria-label="Align left">
                    Left
                  </button>
                  <button
                    type="button"
                    className="gs-art-tool"
                    onClick={() => props.onAlign("center-h")}
                    aria-label="Align center"
                  >
                    Center
                  </button>
                  <button type="button" className="gs-art-tool" onClick={() => props.onAlign("right")} aria-label="Align right">
                    Right
                  </button>
                  <button type="button" className="gs-art-tool" onClick={() => props.onAlign("top")} aria-label="Align top">
                    Top
                  </button>
                  <button
                    type="button"
                    className="gs-art-tool"
                    onClick={() => props.onAlign("center-v")}
                    aria-label="Align middle"
                  >
                    Middle
                  </button>
                  <button
                    type="button"
                    className="gs-art-tool"
                    onClick={() => props.onAlign("bottom")}
                    aria-label="Align bottom"
                  >
                    Bottom
                  </button>
                </div>
                <span className="gs-art-sublabel">Distribute</span>
                <div className="gs-art-grid-2">
                  <button type="button" className="gs-art-tool" onClick={() => props.onDistribute("horizontal")}>
                    Horizontal
                  </button>
                  <button type="button" className="gs-art-tool" onClick={() => props.onDistribute("vertical")}>
                    Vertical
                  </button>
                </div>

                {selected.kind !== "text" ? (
                  <>
                    <span className="gs-art-sublabel">Trim / crop</span>
                    <label className="gs-art-range">
                      Trim edges <span>{treatment.trimPct}%</span>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={treatment.trimPct}
                        aria-label="Trim edges"
                        onChange={(e) => setTreatment((t) => ({ ...t, trimPct: +e.target.value }))}
                      />
                    </label>
                    {canRemoveBackground(selected) ? (
                      <button
                        type="button"
                        className="gs-art-apply"
                        onClick={props.onRemoveBackground}
                        aria-label="Remove background"
                      >
                        Preview &amp; apply cutout
                      </button>
                    ) : null}
                    <p className="gs-art-hint">
                      Edge trim is a panel preview only. Cutout opens a before/after and is not applied until you confirm.
                    </p>

                    <span className="gs-art-sublabel">Color overlay</span>
                    <div className="gs-art-grid-2">
                      <label className="gs-art-num">
                        Color
                        <input
                          type="color"
                          className="gs-art-color"
                          value={treatment.overlayColor}
                          aria-label="Overlay color"
                          onChange={(e) => setTreatment((t) => ({ ...t, overlayColor: e.target.value }))}
                        />
                      </label>
                      <label className="gs-art-range">
                        Strength <span>{treatment.overlayAmount}%</span>
                        <input
                          type="range"
                          min={0}
                          max={80}
                          step={5}
                          value={treatment.overlayAmount}
                          aria-label="Overlay strength"
                          onChange={(e) => setTreatment((t) => ({ ...t, overlayAmount: +e.target.value }))}
                        />
                      </label>
                    </div>

                    <span className="gs-art-sublabel">Halftone</span>
                    <label className="gs-art-check">
                      <input
                        type="checkbox"
                        checked={treatment.halftone}
                        aria-label="Halftone preview"
                        onChange={(e) => setTreatment((t) => ({ ...t, halftone: e.target.checked }))}
                      />
                      Preview dots
                    </label>
                    <label className="gs-art-range">
                      LPI <span>{treatment.halftoneLpi}</span>
                      <input
                        type="range"
                        min={20}
                        max={65}
                        step={5}
                        value={treatment.halftoneLpi}
                        disabled={!treatment.halftone}
                        aria-label="Halftone LPI"
                        onChange={(e) => setTreatment((t) => ({ ...t, halftoneLpi: +e.target.value }))}
                      />
                    </label>
                    <p className="gs-art-hint">Overlay and halftone preview on this panel only. They are not written to the sheet or export.</p>
                  </>
                ) : null}

                <span className="gs-art-sublabel">Step &amp; repeat</span>
                <label className="gs-art-range spacing">
                  Spacing <span>{props.gap.toFixed(2)} in</span>
                  <input
                    type="range"
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={props.gap}
                    aria-label="Spacing between pieces"
                    onChange={(e) => props.onGapChange(+e.target.value)}
                  />
                </label>
                <button type="button" className="gs-art-ghost" onClick={props.onFillSheet} aria-label="Fill sheet with copies">
                  Fill sheet
                </button>

                <span className="gs-art-sublabel">Layer</span>
                <div className="gs-art-grid-2 layer-actions">
                  <button type="button" className="gs-art-tool" onClick={() => props.onLayer("forward")} aria-label="Bring forward">
                    Forward
                  </button>
                  <button type="button" className="gs-art-tool" onClick={() => props.onLayer("backward")} aria-label="Send backward">
                    Backward
                  </button>
                  <button type="button" className="gs-art-tool" onClick={() => props.onLayer("front")} aria-label="Bring to front">
                    To front
                  </button>
                  <button type="button" className="gs-art-tool" onClick={() => props.onLayer("back")} aria-label="Send to back">
                    To back
                  </button>
                </div>

                <button type="button" className="gs-art-ghost ghost-save-btn" onClick={props.onSaveToLibrary}>
                  Save to library
                </button>
              </div>
            </details>
          </>
        ) : (
          <div className="gs-art-empty none">
            <b>↖</b>
            <p>Click artwork on the sheet to resize, rotate, duplicate, or fill the sheet.</p>
          </div>
        )}
      </div>

      <section className="gs-art-sheet summary">
        <p>
          <span>Printed area</span>
          <strong>{props.usedArea.toFixed(2)} in²</strong>
        </p>
        <p>
          <span>Sheet usage</span>
          <strong>{props.utilization}%</strong>
        </p>
        <p className="total">
          <span>Estimated total</span>
          <strong>${props.estimate.toFixed(2)}</strong>
        </p>
      </section>
    </aside>
  );
}
