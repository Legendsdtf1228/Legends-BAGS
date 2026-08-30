import type { ReactNode } from "react";

export type AddImageTab = "recent" | "uploads" | "gallery" | "canva";

export type BagsAddImageModalProps = {
  open: boolean;
  onClose: () => void;
  activeTab: AddImageTab;
  onTabChange: (tab: AddImageTab) => void;
  canvaEnabled: boolean;
  dropboxEnabled: boolean;
  recentPanel: ReactNode;
  uploadsPanel: ReactNode;
  galleryPanel: ReactNode;
  onConnectCanva?: () => void;
};

const TABS: { id: AddImageTab; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "uploads", label: "Uploads" },
  { id: "gallery", label: "Gallery" },
  { id: "canva", label: "Canva" },
];

export function BagsAddImageModal(props: BagsAddImageModalProps) {
  const {
    open,
    onClose,
    activeTab,
    onTabChange,
    canvaEnabled,
    recentPanel,
    uploadsPanel,
    galleryPanel,
    onConnectCanva,
  } = props;

  if (!open) return null;

  return (
    <div className="bags-parity-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bags-parity-modal bags-add-image-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bags-add-image-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bags-modal-head">
          <h2 id="bags-add-image-title">Add Image</h2>
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

        <p className="bags-modal-hint">Minimum recommended upload size: 300 × 300 px at 300 DPI.</p>

        <div className="bags-modal-body">
          {activeTab === "recent" ? recentPanel : null}
          {activeTab === "uploads" ? uploadsPanel : null}
          {activeTab === "gallery" ? galleryPanel : null}
          {activeTab === "canva" ? (
            canvaEnabled ? (
              <p className="bags-modal-empty">Canva import is configured for this shop.</p>
            ) : (
              <div className="bags-modal-connect">
                <p>Connect Canva to import designs directly into your gang sheet.</p>
                <button type="button" className="bags-btn bags-btn-primary" onClick={() => onConnectCanva?.()}>
                  Connect Canva
                </button>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
