import { ToolbarIcon } from "./editor-toolbar-icons";

export type GangSheetSaveDialogProps = {
  open: boolean;
  designName: string | null;
  onDesignNameChange: (name: string) => void;
  sheetWidth: number;
  sheetHeight: number;
  estimateUsd: number;
  overlapCount: number;
  oobCount: number;
  lowDpiCount: number;
  previewUrl?: string | null;
  saving: boolean;
  error?: string;
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
    estimateUsd,
    overlapCount,
    oobCount,
    lowDpiCount,
    previewUrl,
    saving,
    error,
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
                <dt>Estimated price</dt>
                <dd>${estimateUsd.toFixed(2)}</dd>
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
