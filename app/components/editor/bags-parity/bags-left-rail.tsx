import { EditorRailIcon } from "../editor-rail-icons";

export type BagsLeftRailTab =
  | "home"
  | "products"
  | "uploads"
  | "gallery"
  | "canva"
  | "dropbox"
  | "names-numbers"
  | "settings";

export type BagsLeftRailProps = {
  active: BagsLeftRailTab | null;
  onSelect: (tab: BagsLeftRailTab) => void;
  uploadCount?: number;
};

const TABS: { id: BagsLeftRailTab; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "products", label: "Products", icon: "products" },
  { id: "uploads", label: "Uploads", icon: "uploads" },
  { id: "gallery", label: "Gallery", icon: "gallery" },
  { id: "canva", label: "Canva", icon: "canva" },
  { id: "dropbox", label: "Dropbox", icon: "dropbox" },
  { id: "names-numbers", label: "Names & Numbers", icon: "names" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function BagsLeftRail(props: BagsLeftRailProps) {
  const { active, onSelect, uploadCount = 0 } = props;

  return (
    <nav className="bags-parity-left-rail" aria-label="Editor tools">
      <div className="bags-left-rail-main">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`bags-left-rail-btn ${active === tab.id ? "active" : ""}`}
            onClick={() => onSelect(tab.id)}
            aria-current={active === tab.id ? "page" : undefined}
            title={tab.label}
          >
            <EditorRailIcon name={tab.icon} label={tab.label} />
            <span className="bags-left-rail-label">{tab.label}</span>
            {tab.id === "uploads" && uploadCount > 0 ? (
              <span className="bags-left-rail-badge" aria-label={`${uploadCount} uploads`}>
                {uploadCount > 99 ? "99+" : uploadCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="bags-left-rail-footer">
        <select className="bags-left-rail-lang" defaultValue="en" aria-label="Language">
          <option value="en">EN</option>
          <option value="es">ES</option>
          <option value="fr">FR</option>
        </select>
        <span className="bags-left-rail-powered">Powered by Build a Gang Sheet</span>
      </div>
    </nav>
  );
}

export function isBagsLeftRailPanelTab(tab: BagsLeftRailTab | null): tab is "uploads" | "gallery" | "products" {
  return tab === "uploads" || tab === "gallery" || tab === "products";
}
