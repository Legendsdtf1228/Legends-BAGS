import type { ReactNode } from "react";

export type BagsSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function BagsSettingsModal(props: BagsSettingsModalProps) {
  const { open, onClose, children } = props;
  if (!open) return null;

  return (
    <div className="bags-parity-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bags-parity-modal bags-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bags-settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bags-modal-head">
          <h2 id="bags-settings-title">Settings</h2>
          <button type="button" className="bags-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="bags-modal-body">{children}</div>
      </div>
    </div>
  );
}
