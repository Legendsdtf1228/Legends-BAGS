import type { CSSProperties, ReactNode } from "react";
import type { ShopAppearance } from "../../../lib/shop-appearance.server";

export type BagsWelcomeCenterProps = {
  appearance: ShopAppearance;
  appearanceVars: CSSProperties;
  welcomeTitle: string;
  welcomeSubtitle: string;
  sheetWidth: number;
  sheetHeight: number;
  sheetWidths: readonly number[];
  sheetHeights: readonly number[];
  onSheetWidthChange: (width: number) => void;
  onSheetHeightChange: (height: number) => void;
  priceLabel: string;
  hasDevAuth: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

/** BAGS-style Welcome Center — centered card, no Legends left icon rail. */
export function BagsWelcomeCenter(props: BagsWelcomeCenterProps) {
  const {
    appearanceVars,
    welcomeTitle,
    welcomeSubtitle,
    sheetWidth,
    sheetHeight,
    sheetWidths,
    sheetHeights,
    onSheetWidthChange,
    onSheetHeightChange,
    priceLabel,
    hasDevAuth,
    children,
    footer,
  } = props;

  return (
    <div className="bags bags-welcome-center lgs-editor" style={appearanceVars}>
      <div className="bags-welcome-shell">
        <header className="bags-welcome-top">
          <div className="bags-welcome-brand">
            <span className="bags-welcome-logo" aria-hidden>
              L
            </span>
            <span>
              <strong>Build a Gang Sheet</strong>
              <small>Welcome Center</small>
            </span>
          </div>
        </header>

        <main className="bags-welcome-card">
          <h1>{welcomeTitle}</h1>
          <p className="bags-welcome-lead">{welcomeSubtitle}</p>
          {!hasDevAuth ? (
            <p className="error block">Dev auth not configured — check DEV_SHOP / TEST_API_TOKEN.</p>
          ) : null}

          <div className="bags-welcome-sheet-row">
            <label>
              Width
              <select
                value={sheetWidth}
                onChange={(e) => onSheetWidthChange(+e.target.value)}
                aria-label="Sheet width"
              >
                {sheetWidths.map((w) => (
                  <option key={w} value={w}>
                    {w}″
                  </option>
                ))}
              </select>
            </label>
            <label>
              Length
              <select
                value={sheetHeight}
                onChange={(e) => onSheetHeightChange(+e.target.value)}
                aria-label="Sheet length"
              >
                {sheetHeights.map((h) => (
                  <option key={h} value={h}>
                    {h}″
                  </option>
                ))}
              </select>
            </label>
            <div className="bags-welcome-price">
              <span>Est. sheet</span>
              <strong>{priceLabel}</strong>
            </div>
          </div>

          <div className="bags-welcome-actions">{children}</div>
          {footer}
        </main>
      </div>
    </div>
  );
}

export type BagsWelcomeActionProps = {
  title: string;
  description: string;
  icon: ReactNode;
  featured?: boolean;
  disabled?: boolean;
  busy?: boolean;
  href?: string;
  onClick?: () => void;
};

export function BagsWelcomeAction(props: BagsWelcomeActionProps) {
  const { title, description, icon, featured, disabled, busy, href, onClick } = props;
  const className = `bags-welcome-action${featured ? " featured" : ""}${disabled ? " disabled" : ""}`;

  const body = (
    <>
      <div className="bags-welcome-action-icon">{icon}</div>
      <strong>{title}</strong>
      <span>{description}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <a className={className} href={href}>
        {body}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {body}
    </button>
  );
}
