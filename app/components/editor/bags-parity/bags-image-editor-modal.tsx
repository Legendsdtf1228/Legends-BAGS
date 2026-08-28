import { useCallback, useEffect, useState } from "react";
import {
  adjustmentsToCssFilter,
  DEFAULT_CROP,
  DEFAULT_IMAGE_ADJUSTMENTS,
  type CropRect,
  type ImageAdjustments,
  renderAdjustedPreview,
} from "../../../domain/image/image-adjustments";

export type BagsImageEditorTab = "enhance" | "halftone" | "crop" | "colors";

export type BagsImageEditorResult = {
  previewUrl: string;
  adjustments: ImageAdjustments;
  crop: CropRect;
};

export type BagsImageEditorModalProps = {
  open: boolean;
  sourcePreviewUrl: string;
  sourceName: string;
  onClose: () => void;
  onApply: (result: BagsImageEditorResult) => void;
  onRemoveBg?: () => void;
  onUpscale?: () => void;
  upscaling?: boolean;
};

const TABS: { id: BagsImageEditorTab; label: string }[] = [
  { id: "enhance", label: "Enhance" },
  { id: "halftone", label: "Halftone" },
  { id: "crop", label: "Crop" },
  { id: "colors", label: "Colors" },
];

const PREVIEW_BGS = [
  { id: "checkerboard", label: "Checkerboard" },
  { id: "white", label: "White" },
  { id: "black", label: "Black" },
  { id: "gray", label: "Gray" },
] as const;

export function BagsImageEditorModal(props: BagsImageEditorModalProps) {
  const {
    open,
    sourcePreviewUrl,
    sourceName,
    onClose,
    onApply,
    onRemoveBg,
    onUpscale,
    upscaling,
  } = props;

  const [tab, setTab] = useState<BagsImageEditorTab>("enhance");
  const [adj, setAdj] = useState<ImageAdjustments>({ ...DEFAULT_IMAGE_ADJUSTMENTS });
  const [crop, setCrop] = useState<CropRect>({ ...DEFAULT_CROP });
  const [previewBg, setPreviewBg] = useState<(typeof PREVIEW_BGS)[number]["id"]>("checkerboard");
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setTab("enhance");
    setAdj({ ...DEFAULT_IMAGE_ADJUSTMENTS });
    setCrop({ ...DEFAULT_CROP });
    setPreviewBg("checkerboard");
    setZoom(100);
    setPreviewUrl(null);
    setRendering(false);
    setError("");
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    let cancelled = false;
    setRendering(true);
    setError("");
    const t = window.setTimeout(() => {
      void renderAdjustedPreview(sourcePreviewUrl, adj, crop)
        .then((url) => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          setPreviewUrl((prev) => {
            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
            return url;
          });
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Preview failed");
        })
        .finally(() => {
          if (!cancelled) setRendering(false);
        });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, sourcePreviewUrl, adj, crop, reset]);

  if (!open) return null;

  const cssFilter = adjustmentsToCssFilter(adj);
  const displayUrl = previewUrl ?? sourcePreviewUrl;

  function patchAdj(patch: Partial<ImageAdjustments>) {
    setAdj((a) => ({ ...a, ...patch }));
  }

  function resetCrop() {
    setCrop({ ...DEFAULT_CROP });
  }

  function applyCropPreset(aspect: number | null) {
    if (aspect == null) {
      resetCrop();
      return;
    }
    const w = aspect >= 1 ? 1 : aspect;
    const h = aspect >= 1 ? 1 / aspect : 1;
    const cw = Math.min(1, w);
    const ch = Math.min(1, h);
    setCrop({ x: (1 - cw) / 2, y: (1 - ch) / 2, w: cw, h: ch });
  }

  return (
    <div className="bags-parity-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bags-parity-modal bags-image-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bags-image-editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bags-modal-head">
          <h2 id="bags-image-editor-title">Image Editor — {sourceName}</h2>
          <button type="button" className="bags-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="bags-modal-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`bags-modal-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bags-image-editor-body">
          <div className="bags-image-editor-preview-col">
            <div className="bags-image-editor-preview-controls">
              <label>
                Preview bg
                <select
                  value={previewBg}
                  onChange={(e) => setPreviewBg(e.target.value as typeof previewBg)}
                  aria-label="Preview background"
                >
                  {PREVIEW_BGS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Zoom
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={10}
                  value={zoom}
                  onChange={(e) => setZoom(+e.target.value)}
                  aria-label="Preview zoom"
                />
                <span>{zoom}%</span>
              </label>
            </div>
            <div
              className={`bags-image-editor-preview bags-preview-bg-${previewBg}`}
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {rendering ? <p className="bags-modal-empty">Rendering preview…</p> : null}
              {error ? <p className="gs-save-error">{error}</p> : null}
              <img
                src={displayUrl}
                alt=""
                style={{ filter: tab === "colors" || tab === "enhance" ? cssFilter : undefined }}
                className={previewBg === "checkerboard" ? "checkerboard" : undefined}
              />
            </div>
          </div>

          <div className="bags-image-editor-controls">
            {tab === "enhance" ? (
              <>
                <p className="bags-modal-hint">Enhance artwork before placing on the sheet.</p>
                {onRemoveBg ? (
                  <button type="button" className="bags-btn bags-btn-secondary" onClick={onRemoveBg}>
                    Remove background
                  </button>
                ) : null}
                {onUpscale ? (
                  <button
                    type="button"
                    className="bags-btn bags-btn-secondary"
                    onClick={onUpscale}
                    disabled={upscaling}
                  >
                    {upscaling ? "Upscaling…" : "Upscale for print"}
                  </button>
                ) : null}
              </>
            ) : null}

            {tab === "halftone" ? (
              <>
                <label className="bags-field">
                  Dot size (px) — 0 = off
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={adj.halftoneDotSize}
                    onChange={(e) => patchAdj({ halftoneDotSize: +e.target.value })}
                  />
                  <span>{adj.halftoneDotSize}</span>
                </label>
                <label className="bags-field">
                  Angle
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={adj.halftoneAngle}
                    onChange={(e) => patchAdj({ halftoneAngle: +e.target.value })}
                  />
                  <span>{adj.halftoneAngle}°</span>
                </label>
                <p className="bags-modal-hint">Halftone preview runs in your browser. Final print may differ slightly.</p>
              </>
            ) : null}

            {tab === "crop" ? (
              <>
                <div className="bags-names-presets">
                  <button type="button" className="bags-chip" onClick={() => applyCropPreset(null)}>
                    Free
                  </button>
                  <button type="button" className="bags-chip" onClick={() => applyCropPreset(1)}>
                    1:1
                  </button>
                  <button type="button" className="bags-chip" onClick={() => applyCropPreset(4 / 3)}>
                    4:3
                  </button>
                  <button type="button" className="bags-chip" onClick={() => applyCropPreset(3 / 4)}>
                    3:4
                  </button>
                </div>
                <div className="bags-names-grid">
                  <label className="bags-field">
                    Left
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(crop.x * 100)}
                      onChange={(e) => setCrop((c) => ({ ...c, x: +e.target.value / 100 }))}
                    />
                  </label>
                  <label className="bags-field">
                    Top
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(crop.y * 100)}
                      onChange={(e) => setCrop((c) => ({ ...c, y: +e.target.value / 100 }))}
                    />
                  </label>
                  <label className="bags-field">
                    Width
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={Math.round(crop.w * 100)}
                      onChange={(e) => setCrop((c) => ({ ...c, w: +e.target.value / 100 }))}
                    />
                  </label>
                  <label className="bags-field">
                    Height
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={Math.round(crop.h * 100)}
                      onChange={(e) => setCrop((c) => ({ ...c, h: +e.target.value / 100 }))}
                    />
                  </label>
                </div>
                <button type="button" className="bags-btn bags-btn-secondary" onClick={resetCrop}>
                  Reset crop
                </button>
              </>
            ) : null}

            {tab === "colors" ? (
              <>
                <label className="bags-field">
                  Gamma
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={adj.gamma}
                    onChange={(e) => patchAdj({ gamma: +e.target.value })}
                  />
                  <span>{adj.gamma.toFixed(2)}</span>
                </label>
                <label className="bags-field">
                  Contrast
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={adj.contrast}
                    onChange={(e) => patchAdj({ contrast: +e.target.value })}
                  />
                  <span>{adj.contrast.toFixed(2)}</span>
                </label>
                <label className="bags-field">
                  Brightness
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={adj.brightness}
                    onChange={(e) => patchAdj({ brightness: +e.target.value })}
                  />
                  <span>{adj.brightness.toFixed(2)}</span>
                </label>
                <button
                  type="button"
                  className="bags-btn bags-btn-secondary"
                  onClick={() => setAdj({ ...DEFAULT_IMAGE_ADJUSTMENTS })}
                >
                  Reset colors
                </button>
              </>
            ) : null}
          </div>
        </div>

        <footer className="bags-modal-actions">
          <button type="button" className="bags-btn bags-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bags-btn bags-btn-primary"
            disabled={rendering || !!error || !previewUrl}
            onClick={() => {
              if (!previewUrl) return;
              onApply({ previewUrl, adjustments: adj, crop });
            }}
          >
            Apply
          </button>
        </footer>
      </div>
    </div>
  );
}
