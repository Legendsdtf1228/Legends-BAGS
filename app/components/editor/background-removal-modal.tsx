import { useCallback, useEffect, useState } from "react";

export type ProcessedAsset = {
  assetId: string;
  widthPx: number;
  heightPx: number;
  dpi?: number | null;
  contentType: string;
};

type BackgroundRemovalModalProps = {
  open: boolean;
  sourceAssetId: string;
  sourcePreviewUrl: string;
  requestHeaders?: Record<string, string>;
  onClose: () => void;
  onApply: (asset: ProcessedAsset, previewUrl: string) => void;
};

function assetPreviewUrl(assetId: string) {
  return `/api/assets/${encodeURIComponent(assetId)}`;
}

export const BACKGROUND_REMOVAL_MODAL_CSS = `
.bg-modal{position:fixed;inset:0;background:#0d1117cc;display:grid;place-items:center;z-index:40;padding:16px}
.bg-modal-card{background:#171c24;color:#e8eaed;border-radius:10px;padding:0;max-width:760px;width:100%;max-height:92vh;overflow:auto;box-shadow:0 16px 40px #0008;display:grid;border:1px solid #2c3542}
.bg-modal-card h2{margin:0;padding:14px 18px 0;font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:#ffd45e;box-shadow:inset 0 2px 0 #ffd45e}
.bg-modal-sub{margin:6px 18px 14px;font-size:12px;color:#8b95a5}
.bg-compare{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 18px}
.bg-label{display:block;font-size:10px;font-weight:700;color:#8b95a5;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em}
.bg-preview{display:grid;place-items:center;min-height:160px;border:1px solid #2c3542;border-radius:8px;padding:10px;background:#0d1117}
.bg-preview img{max-width:100%;max-height:180px;object-fit:contain}
.bg-loading{font-size:12px;color:#8b95a5}
.bg-prompt{display:grid;gap:6px;font-size:12px;color:#8b95a5;padding:14px 18px 0}
.bg-prompt input{padding:10px 12px;border:1px solid #3d4a5c;border-radius:8px;font-size:14px;color:#e8eaed;background:#0d1117}
.bg-sliders{display:grid;gap:10px;padding:12px 18px}
.bg-sliders label{display:grid;gap:4px;font-size:12px;color:#8b95a5}
.bg-sliders input[type=range]{width:100%;accent-color:#e89119}
.bg-sliders small{font-size:11px;color:#8b95a5}
.bg-error{margin:0 18px;color:#f0a8a8;font-size:12px}
.bg-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;padding:14px 18px 18px;border-top:1px solid #2c3542;background:#12171e}
.bg-modal-actions .btn{border:0;border-radius:8px;padding:12px 16px;font-weight:800;cursor:pointer;font:inherit}
.bg-modal-actions .btn.primary{background:#ffd45e;color:#111;min-width:120px;font-size:14px}
.bg-modal-actions .btn.ghost{background:transparent;border:1px solid #3d4a5c;color:#e8eaed}
.bg-modal-actions .btn:disabled{opacity:.5;cursor:not-allowed}
@media(max-width:720px){.bg-compare{grid-template-columns:1fr}}
`;

export function BackgroundRemovalModal({
  open,
  sourceAssetId,
  sourcePreviewUrl,
  requestHeaders,
  onClose,
  onApply,
}: BackgroundRemovalModalProps) {
  const [prompt, setPrompt] = useState("");
  const [keepMargin, setKeepMargin] = useState(0);
  const [feather, setFeather] = useState(2);
  const [threshold, setThreshold] = useState(45);
  const [previewAsset, setPreviewAsset] = useState<ProcessedAsset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setPrompt("");
    setKeepMargin(0);
    setFeather(2);
    setThreshold(45);
    setPreviewAsset(null);
    setPreviewUrl(null);
    setProcessing(false);
    setError("");
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    reset();
  }, [open, sourceAssetId, reset]);

  const runPreview = useCallback(async () => {
    setProcessing(true);
    setError("");
    setPreviewAsset(null);
    setPreviewUrl(null);
    try {
      const res = await fetch(
        `/api/assets/${encodeURIComponent(sourceAssetId)}/remove-background`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(requestHeaders ?? {}),
          },
          body: JSON.stringify({ prompt, keepMargin, feather, threshold }),
        },
      );
      const json = (await res.json()) as ProcessedAsset & { error?: string };
      if (!res.ok) throw new Error(json.error || "Background removal failed");
      setPreviewAsset(json);
      setPreviewUrl(assetPreviewUrl(json.assetId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Background removal failed");
    } finally {
      setProcessing(false);
    }
  }, [feather, keepMargin, prompt, requestHeaders, sourceAssetId, threshold]);

  useEffect(() => {
    if (!open || previewAsset || processing) return;
    void runPreview();
  }, [open, sourceAssetId]); // eslint-disable-line react-hooks/exhaustive-deps -- initial preview on open

  if (!open) return null;

  return (
    <div className="bg-modal" role="dialog" aria-modal="true" aria-labelledby="bg-modal-title">
      <div className="bg-modal-card">
        <h2 id="bg-modal-title">Remove background</h2>
        <p className="bg-modal-sub">
          Preview the cutout, then describe what to keep or remove if the result is too aggressive.
        </p>

        <div className="bg-compare">
          <div>
            <span className="bg-label">Original</span>
            <div className="bg-preview checkerboard">
              <img src={sourcePreviewUrl} alt="Original artwork" />
            </div>
          </div>
          <div>
            <span className="bg-label">Preview</span>
            <div className="bg-preview checkerboard">
              {previewUrl ? (
                <img src={previewUrl} alt="Background removed preview" />
              ) : (
                <span className="bg-loading">{processing ? "Processing…" : "—"}</span>
              )}
            </div>
          </div>
        </div>

        <label className="bg-prompt">
          <span>Adjustment prompt</span>
          <input
            type="text"
            value={prompt}
            placeholder="e.g. white background, keep logo shadow"
            disabled={processing}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runPreview();
              }
            }}
          />
        </label>

        <div className="bg-sliders">
          <label>
            <span>
              Keep detail ({keepMargin > 0 ? "+" : ""}
              {keepMargin})
            </span>
            <input
              type="range"
              min={-20}
              max={30}
              step={1}
              value={keepMargin}
              disabled={processing}
              onChange={(e) => setKeepMargin(Number(e.target.value))}
            />
            <small>Increase if too much was removed</small>
          </label>
          <label>
            <span>Removal strength ({threshold})</span>
            <input
              type="range"
              min={10}
              max={90}
              step={1}
              value={threshold}
              disabled={processing}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Edge softness ({feather})</span>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={feather}
              disabled={processing}
              onChange={(e) => setFeather(Number(e.target.value))}
            />
          </label>
        </div>

        {error ? (
          <p className="bg-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="bg-modal-actions">
          <button type="button" className="btn ghost" disabled={processing} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn ghost" disabled={processing} onClick={() => void runPreview()}>
            {processing ? "Updating…" : "Update preview"}
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={processing || !previewAsset}
            onClick={() => {
              if (!previewAsset || !previewUrl) return;
              onApply(previewAsset, previewUrl);
              onClose();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
