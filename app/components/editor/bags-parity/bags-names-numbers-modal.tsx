import type { ReactNode } from "react";

export type BagsNamesNumbersModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function BagsNamesNumbersModal(props: BagsNamesNumbersModalProps) {
  const { open, onClose, children } = props;
  if (!open) return null;

  return (
    <div className="bags-parity-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bags-parity-modal bags-names-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bags-names-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bags-modal-head">
          <h2 id="bags-names-title">Names &amp; Numbers</h2>
          <button type="button" className="bags-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="bags-modal-body">{children}</div>
      </div>
    </div>
  );
}
