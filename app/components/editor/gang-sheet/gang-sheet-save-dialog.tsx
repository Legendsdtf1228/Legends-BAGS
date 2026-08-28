import type { QualitySummary } from "./dpi-quality";
import { ToolbarIcon } from "./editor-toolbar-icons";

export type GangSheetSaveDialogProps = {
  open: boolean;
  designName: string | null;
  onDesignNameChange: (name: string) => void;
  sheetWidth: number;
  sheetHeight: number;
  quantity: number;
  artworkCount: number;
  estimateUsd: number;
  overlapCount: number;
  oobCount: number;
  lowDpiCount: number;
  qualitySummary: QualitySummary;
  previewUrl?: string | null;
  saving: boolean;
  error?: string;
  requestId?: string;
  onCancel: () => void;
  onSaveOnly: () => void;
  onSaveAndCart: () => void;
};

export function GangSheetSaveDialog(props: GangSheetSaveDialogProps) {
  if (!props.open) return null;

  const {
    designName,
    onDesignNameChange,
    sheetWidth,
    sheetHeight,
    quantity,
    artworkCount,
    estimateUsd,
    overlapCount,
    oobCount,
    lowDpiCount,
    qualitySummary,
    previewUrl,
    saving,
    error,
    requestId,
    onCancel,
    onSaveOnly,
    onSaveAndCart,
  } = props;

  return (
    <div
      className="gs-save-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gs-save-dialog-title"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !saving) onCancel();
      }}
    >
      <div className="gs-save-dialog">
        <header className="gs-save-dialog-head">
          <h2 id="gs-save-dialog-title">Save gang sheet</h2>
          <button type="button" className="gs-icon-btn" onClick={onCancel} disabled={saving} aria-label="Close">
            <ToolbarIcon name="close" />
          </button>
        </header>

        <div className="gs-save-dialog-body">
          <div className="gs-save-preview">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="checkerboard" />
            ) : (
              <div className="gs-save-preview-empty">Preview unavailable</div>
            )}
          </div>

          <div className="gs-save-fields">
            <label className="gs-save-field">
              Design name
              <input
                type="text"
                value={designName ?? ""}
                placeholder="Untitled design"
                maxLength={80}
                onChange={(e) => onDesignNameChange(e.target.value)}
                aria-label="Design name"
              />
            </label>

            <dl className="gs-save-summary">
              <div>
                <dt>Sheet size</dt>
                <dd>
                  {sheetWidth} × {sheetHeight} in
                </dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{quantity}</dd>
              </div>
              <div>
                <dt>Artwork on sheet</dt>
                <dd>{artworkCount} piece{artworkCount === 1 ? "" : "s"}</dd>
              </div>
              <div>
                <dt>Verified price</dt>
                <dd>${estimateUsd.toFixed(2)}</dd>
              </div>
            </dl>

            <dl className="gs-save-summary gs-save-quality-summary">
              <div>
                <dt>DPI optimal</dt>
                <dd>{qualitySummary.optimal}</dd>
              </div>
              <div>
                <dt>DPI good</dt>
                <dd>{qualitySummary.good}</dd>
              </div>
              <div>
                <dt>DPI below good</dt>
                <dd>{qualitySummary.bad + qualitySummary.terrible + qualitySummary.minimum + qualitySummary.unknown}</dd>
              </div>
            </dl>

            {overlapCount > 0 ? (
              <p className="gs-save-warn" role="status">
                {overlapCount} overlapping piece{overlapCount === 1 ? "" : "s"} — you can still save, but review
                placement before printing.
              </p>
            ) : null}
            {oobCount > 0 ? (
              <p className="gs-save-warn gs-save-warn-danger" role="status">
                {oobCount} piece{oobCount === 1 ? "" : "s"} outside the printable margin.
              </p>
            ) : null}
            {lowDpiCount > 0 ? (
              <p className="gs-save-warn" role="status">
                {lowDpiCount} image{lowDpiCount === 1 ? "" : "s"} below recommended DPI — print quality may suffer.
              </p>
            ) : null}
            {error ? (
              <p className="gs-save-error" role="alert">
                {error}
                {requestId ? ` Reference: ${requestId}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="gs-save-dialog-foot">
          <button type="button" className="gs-ghost-btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="gs-secondary-btn" onClick={onSaveOnly} disabled={saving}>
            {saving ? "Saving…" : "Save only"}
          </button>
          <button type="button" className="gs-primary-btn" onClick={onSaveAndCart} disabled={saving}>
            {saving ? "Saving…" : "Save & Add to Cart"}
          </button>
        </footer>
      </div>
    </div>
  );
}
