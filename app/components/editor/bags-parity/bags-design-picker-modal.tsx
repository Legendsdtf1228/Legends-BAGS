export type DesignPickerTab = "assigned" | "mine" | "archived";

export type DesignPickerItem = {
  id: string;
  name: string | null;
  version: number;
  pieceCount: number;
  sheetLabel: string;
  priceCents: number;
  updatedAt: string;
  archived: boolean;
  previewPath?: string | null;
  sourceOrderId?: string | null;
};

export type BagsDesignPickerModalProps = {
  open: boolean;
  onClose: () => void;
  activeTab: DesignPickerTab;
  onTabChange: (tab: DesignPickerTab) => void;
  designs: DesignPickerItem[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSelect: (designId: string, version: number) => void;
};

const TABS: { id: DesignPickerTab; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "mine", label: "My Designs" },
  { id: "archived", label: "Archived" },
];

function filterDesigns(designs: DesignPickerItem[], tab: DesignPickerTab) {
  if (tab === "assigned") return designs.filter((d) => Boolean(d.sourceOrderId));
  if (tab === "archived") return designs.filter((d) => d.archived);
  return designs.filter((d) => !d.archived && !d.sourceOrderId);
}

export function BagsDesignPickerModal(props: BagsDesignPickerModalProps) {
  const {
    open,
    onClose,
    activeTab,
    onTabChange,
    designs,
    loading,
    error,
    onRetry,
    onSelect,
  } = props;

  if (!open) return null;

  const visible = filterDesigns(designs, activeTab);

  return (
    <div className="bags-parity-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bags-parity-modal bags-design-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bags-design-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bags-modal-head">
          <h2 id="bags-design-picker-title">Open from previous designs</h2>
          <button type="button" className="bags-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="bags-modal-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`bags-modal-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bags-modal-body">
          {loading ? <p className="bags-modal-empty">Loading designs…</p> : null}
          {error ? (
            <p className="bags-modal-empty">
              {error}{" "}
              <button type="button" className="bags-link-btn" onClick={onRetry}>
                Retry
              </button>
            </p>
          ) : null}
          {!loading && !error && !visible.length ? (
            <p className="bags-modal-empty">
              {activeTab === "assigned"
                ? "No assigned designs yet."
                : activeTab === "archived"
                  ? "No archived designs."
                  : "No saved designs yet — save from the editor to build your library."}
            </p>
          ) : null}
          {!loading && !error && visible.length ? (
            <ul className="bags-design-picker-list">
              {visible.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="bags-design-picker-row"
                    onClick={() => onSelect(d.id, d.version)}
                  >
                    {d.previewPath ? (
                      <span className="bags-design-picker-thumb checkerboard">
                        <img src={d.previewPath} alt="" />
                      </span>
                    ) : (
                      <span className="bags-design-picker-thumb bags-design-picker-thumb-empty" aria-hidden>
                        GS
                      </span>
                    )}
                    <span className="bags-design-picker-copy">
                      <strong>{d.name || "Untitled design"}</strong>
                      <small>
                        {d.pieceCount} piece{d.pieceCount === 1 ? "" : "s"} · {d.sheetLabel} · v{d.version} · $
                        {(d.priceCents / 100).toFixed(2)} · {new Date(d.updatedAt).toLocaleDateString()}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
