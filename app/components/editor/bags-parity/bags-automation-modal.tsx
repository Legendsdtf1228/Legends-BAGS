export type AutomationKind = "auto-fill" | "auto-nest" | "auto-build";

export type BagsAutomationModalProps = {
  open: boolean;
  kind: AutomationKind;
  onClose: () => void;
  onApply: () => void;
  onRegenerate?: () => void;
  busy?: boolean;
  loading?: boolean;
  error?: string;
  /** Auto-fill: copies that will be placed. */
  copyCount?: number;
  /** Auto-nest / auto-build: fitted vs remaining. */
  fittedCount?: number;
  remainingCount?: number;
  utilization?: number;
  sheetLabel?: string;
  gap?: number;
  allowRotate?: boolean;
  onAllowRotateChange?: (v: boolean) => void;
  onGapChange?: (gap: number) => void;
};

const TITLES: Record<AutomationKind, string> = {
  "auto-fill": "Auto Fill Sheet",
  "auto-nest": "Auto Nest",
  "auto-build": "Auto Build",
};

export function BagsAutomationModal(props: BagsAutomationModalProps) {
  const {
    open,
    kind,
    onClose,
    onApply,
    onRegenerate,
    busy,
    loading,
    error,
    copyCount = 0,
    fittedCount,
    remainingCount,
    utilization,
    sheetLabel,
    gap,
    allowRotate,
    onAllowRotateChange,
    onGapChange,
  } = props;

  if (!open) return null;

  return (
    <div className="bags-parity-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bags-parity-modal bags-automation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bags-automation-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bags-modal-head">
          <h2 id="bags-automation-title">{TITLES[kind]}</h2>
          <button type="button" className="bags-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="bags-modal-body">
          {kind === "auto-fill" ? (
            <>
              <p>
                Fill the sheet with copies of the selected artwork using current spacing (
                {gap?.toFixed(2) ?? "0.15"}″ between pieces).
              </p>
              <p className="bags-automation-stat">
                <strong>{copyCount}</strong> cop{copyCount === 1 ? "y" : "ies"} will be placed
                {sheetLabel ? ` on ${sheetLabel}` : ""}.
              </p>
              {copyCount === 0 ? (
                <p className="gs-save-error">Selected artwork is too large to fit even one copy with current spacing.</p>
              ) : (
                <p className="bags-modal-hint">Apply pushes copies to the sheet. Undo with Ctrl+Z or the toolbar undo button.</p>
              )}
            </>
          ) : null}

          {kind === "auto-nest" || kind === "auto-build" ? (
            <>
              <p>
                {kind === "auto-nest"
                  ? "Repack all artwork on the current sheet for tighter layout."
                  : "Build a gang sheet from uploaded designs with quantities and nesting."}
              </p>
              {loading ? <p className="bags-modal-empty">Calculating layout…</p> : null}
              {error ? <p className="gs-save-error">{error}</p> : null}
              {fittedCount != null ? (
                <ul className="bags-automation-report">
                  <li>
                    <span>Fitted</span>
                    <strong>{fittedCount}</strong>
                  </li>
                  <li>
                    <span>Remaining</span>
                    <strong>{remainingCount ?? 0}</strong>
                  </li>
                  {utilization != null ? (
                    <li>
                      <span>Utilization</span>
                      <strong>{Math.round(utilization * 100)}%</strong>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              {(remainingCount ?? 0) > 0 ? (
                <p className="gs-save-error">
                  {remainingCount} piece{(remainingCount ?? 0) === 1 ? "" : "s"} could not fit — reduce sizes or
                  increase sheet length. Nothing will be dropped silently.
                </p>
              ) : fittedCount != null && fittedCount > 0 ? (
                <p className="bags-modal-hint">Apply rearranges the sheet. Undo with Ctrl+Z or the toolbar undo button.</p>
              ) : null}
              {onGapChange != null && gap != null ? (
                <label className="bags-field">
                  Spacing (in)
                  <input
                    type="range"
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={gap}
                    onChange={(e) => onGapChange(+e.target.value)}
                  />
                  <span>{gap.toFixed(2)}″</span>
                </label>
              ) : null}
              {onAllowRotateChange != null ? (
                <label className="bags-check">
                  <input
                    type="checkbox"
                    checked={Boolean(allowRotate)}
                    onChange={(e) => onAllowRotateChange(e.target.checked)}
                  />
                  Allow 90° rotation when nesting
                </label>
              ) : null}
            </>
          ) : null}
        </div>

        <footer className="bags-modal-actions">
          <button type="button" className="bags-btn bags-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {onRegenerate ? (
            <button
              type="button"
              className="bags-btn bags-btn-secondary"
              onClick={onRegenerate}
              disabled={loading || busy}
            >
              {loading ? "Regenerating…" : "Regenerate"}
            </button>
          ) : null}
          <button
            type="button"
            className="bags-btn bags-btn-primary"
            onClick={onApply}
            disabled={busy || loading || (kind === "auto-fill" && copyCount === 0)}
          >
            {busy ? "Applying…" : "Apply"}
          </button>
        </footer>
      </div>
    </div>
  );
}
