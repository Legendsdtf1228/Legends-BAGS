import { StepperField } from "../bags-ui";

export type BagsActiveSheetsDrawerProps = {
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  designName: string | null;
  onDesignNameChange: (name: string) => void;
  sheetWidth: number;
  sheetHeight: number;
  artworkCount: number;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onDuplicateSheet: () => void;
  onAddNewDesign: () => void;
  onOpenPreviousDesigns: () => void;
  onAutoBuild: () => void;
  onStartOver: () => void;
};

export function BagsActiveSheetsDrawer(props: BagsActiveSheetsDrawerProps) {
  const {
    open,
    collapsed,
    onToggleCollapse,
    onClose,
    designName,
    onDesignNameChange,
    sheetWidth,
    sheetHeight,
    artworkCount,
    quantity,
    onQuantityChange,
    onDuplicateSheet,
    onAddNewDesign,
    onOpenPreviousDesigns,
    onAutoBuild,
    onStartOver,
  } = props;

  if (!open) return null;

  return (
    <>
      <button type="button" className="bags-parity-drawer-backdrop" aria-label="Close drawer" onClick={onClose} />
      <aside
        className={`bags-parity-drawer bags-active-sheets bags-drawer-right ${collapsed ? "collapsed" : ""}`}
        aria-label="Active gang sheets"
      >
        <header className="bags-drawer-head">
          <div>
            <strong>Active Gang Sheets</strong>
            <small>1 sheet</small>
          </div>
          <div className="bags-drawer-head-actions">
            <button type="button" className="bags-icon-btn" onClick={onToggleCollapse} aria-label={collapsed ? "Expand" : "Collapse"}>
              {collapsed ? "▾" : "▴"}
            </button>
            <button type="button" className="bags-icon-btn" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </header>

        {!collapsed ? (
          <div className="bags-drawer-body">
            <article className="bags-sheet-card active">
              <label className="bags-field">
                Design name
                <input
                  type="text"
                  value={designName ?? ""}
                  placeholder="New Gang Sheet"
                  maxLength={80}
                  onChange={(e) => onDesignNameChange(e.target.value)}
                />
              </label>
              <p className="bags-sheet-meta-line">
                <span>Size</span>
                <strong>
                  {sheetWidth} × {sheetHeight}″
                </strong>
              </p>
              <p className="bags-sheet-meta-line">
                <span>Artwork</span>
                <strong>{artworkCount}</strong>
              </p>
              <StepperField label="Sheet quantity" value={quantity} step={1} min={1} onChange={onQuantityChange} />
              <div className="bags-sheet-card-actions">
                <button type="button" className="bags-btn bags-btn-secondary" onClick={onDuplicateSheet}>
                  Duplicate sheet
                </button>
                <button type="button" className="bags-btn bags-btn-secondary" onClick={onAddNewDesign}>
                  Add new design
                </button>
              </div>
            </article>

            <div className="bags-drawer-links">
              <button type="button" className="bags-link-btn" onClick={onOpenPreviousDesigns}>
                Open from previous designs
              </button>
              <button type="button" className="bags-link-btn bags-link-nest" onClick={onAutoBuild}>
                Auto Build
              </button>
              <button type="button" className="bags-link-btn bags-link-danger" onClick={onStartOver}>
                Start Over
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
