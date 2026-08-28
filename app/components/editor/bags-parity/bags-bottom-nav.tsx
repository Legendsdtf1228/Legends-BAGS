import { EditorRailIcon } from "../editor-rail-icons";

export type BagsBottomNavTab = "select" | "add-image" | "names-numbers" | "settings";

export type BagsBottomNavProps = {
  active: BagsBottomNavTab | null;
  onSelect: (tab: BagsBottomNavTab) => void;
};

const TABS: { id: BagsBottomNavTab; label: string; icon: string }[] = [
  { id: "select", label: "Select", icon: "sheet" },
  { id: "add-image", label: "Add Image", icon: "uploads" },
  { id: "names-numbers", label: "Names & Numbers", icon: "names" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function BagsBottomNav(props: BagsBottomNavProps) {
  const { active, onSelect } = props;

  return (
    <nav className="bags-parity-bottom-nav" aria-label="Editor navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bags-bottom-nav-btn ${active === tab.id ? "active" : ""}`}
          onClick={() => onSelect(tab.id)}
          aria-current={active === tab.id ? "page" : undefined}
        >
          <span className="bags-bottom-nav-icon" aria-hidden>
            <EditorRailIcon name={tab.icon} label={tab.label} />
          </span>
          <span className="bags-bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
