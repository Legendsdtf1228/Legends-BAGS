export type BagsBottomNavTab = "select" | "add-image" | "names-numbers" | "settings";

export type BagsBottomNavProps = {
  active: BagsBottomNavTab | null;
  onSelect: (tab: BagsBottomNavTab) => void;
};

const TABS: { id: BagsBottomNavTab; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "add-image", label: "Add Image" },
  { id: "names-numbers", label: "Names & Numbers" },
  { id: "settings", label: "Settings" },
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
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
