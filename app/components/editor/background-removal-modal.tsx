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
.bg-modal{position:fixed;inset:0;background:#0d111780;display:grid;place-items:center;z-index:40;padding:16px}
.bg-modal-card{background:#fff;border-radius:12px;padding:22px;max-width:760px;width:100%;max-height:92vh;overflow:auto;box-shadow:0 16px 40px #0004;display:grid;gap:14px}
.bg-modal-card h2{margin:0;font-size:18px}
.bg-modal-sub{margin:0;font-size:13px;color:#667085}
.bg-compare{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.bg-label{display:block;font-size:11px;font-weight:700;color:#667085;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em}
.bg-preview{display:grid;place-items:center;min-height:160px;border:1px solid var(--line,#dfe3e8);border-radius:8px;padding:10px}
.bg-preview img{max-width:100%;max-height:180px;object-fit:contain}
.bg-loading{font-size:12px;color:#667085}
.bg-prompt{display:grid;gap:6px;font-size:12px;color:#667085}
.bg-prompt input{padding:10px 12px;border:1px solid #ccd2da;border-radius:8px;font-size:14px;color:#111}
.bg-sliders{display:grid;gap:10px}
.bg-sliders label{display:grid;gap:4px;font-size:12px;color:#667085}
.bg-sliders input[type=range]{width:100%}
.bg-sliders small{font-size:11px;color:#98a2b3}
.bg-error{margin:0;color:#b42318;font-size:12px}
.bg-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.bg-modal-actions .btn{border:0;border-radius:7px;padding:10px 14px;font-weight:700;cursor:pointer;font:inherit}
.bg-modal-actions .btn.primary{background:var(--accent,#f97316);color:#fff}
.bg-modal-actions .btn.ghost{background:#fff;border:1px solid #ccd2da;color:#111}
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
            Use this version
          </button>
        </div>
      </div>
    </div>
  );
}
