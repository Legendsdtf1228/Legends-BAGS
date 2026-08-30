import { StepperField } from "../bags-ui";

export type BagsCustomerAccount = {
  name: string;
  email: string;
  avatarInitials?: string;
};

export type BagsGangSheetHeaderProps = {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  estimateUsd: number;
  saving: boolean;
  hasItems: boolean;
  onSaveAndCart: () => void;
  onSave: () => void;
  onClose: () => void;
  customer?: BagsCustomerAccount | null;
  onSwitchAccount?: () => void;
  onMyDesigns?: () => void;
  logoLabel?: string;
};

export function BagsGangSheetHeader(props: BagsGangSheetHeaderProps) {
  const {
    quantity,
    onQuantityChange,
    estimateUsd,
    saving,
    hasItems,
    onSaveAndCart,
    onSave,
    onClose,
    customer,
    onSwitchAccount,
    onMyDesigns,
    logoLabel = "L",
  } = props;

  const display = customer ?? { name: "Guest", email: "", avatarInitials: "G" };
  const initials =
    display.avatarInitials ??
    display.name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <header className="bags-parity-header" role="banner">
      <div className="bags-parity-header-left">
        <span className="bags-parity-logo" aria-hidden>
          {logoLabel.slice(0, 1).toUpperCase()}
        </span>
        <div className="bags-parity-qty">
          <span className="bags-parity-qty-label">Qty</span>
          <StepperField
            label=""
            value={quantity}
            step={1}
            min={1}
            onChange={(v) => onQuantityChange(Math.max(1, Math.round(v)))}
          />
        </div>
      </div>

      <div className="bags-parity-header-actions">
        <button
          type="button"
          className="bags-btn bags-btn-primary"
          onClick={onSaveAndCart}
          disabled={saving || !hasItems}
        >
          {saving ? "Saving…" : "Save & Add to Cart"}
        </button>
        <button
          type="button"
          className="bags-btn bags-btn-secondary"
          onClick={onSave}
          disabled={saving || !hasItems}
        >
          Save
        </button>
        <button type="button" className="bags-btn bags-btn-danger" onClick={onClose} aria-label="Close editor">
          Close
        </button>
      </div>

      <div className="bags-parity-price" aria-live="polite">
        <strong>${estimateUsd.toFixed(2)}</strong>
        <span>USD</span>
      </div>

      <details className="bags-parity-account">
        <summary className="bags-parity-account-trigger">
          <span className="bags-parity-avatar" aria-hidden>
            {initials}
          </span>
          <span className="bags-parity-account-text">
            <strong>{display.name}</strong>
            {display.email ? <small>{display.email}</small> : null}
          </span>
        </summary>
        <div className="bags-parity-account-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => onSwitchAccount?.()}>
            Switch Account
          </button>
          <button type="button" role="menuitem" onClick={() => onMyDesigns?.()}>
            My Designs
          </button>
        </div>
      </details>
    </header>
  );
}
