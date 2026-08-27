export type BagsNavItem = {
  id: string;
  label: string;
  to: string;
  icon: string;
  section?: "main" | "builders" | "settings";
  matchPrefix?: string;
};

/** BAGS-style merchant sidebar — mirrors live app section names. */
export const BAGS_ADMIN_NAV: BagsNavItem[] = [
  { id: "home", label: "Home", to: "/app", icon: "⌂", section: "main" },
  { id: "products", label: "Products", to: "/app/products", icon: "▣", section: "main" },
  { id: "designs", label: "Designs", to: "/app/designs", icon: "◫", section: "main", matchPrefix: "/app/designs" },
  { id: "orders", label: "Orders", to: "/app/orders", icon: "☰", section: "main" },
  { id: "build-assign", label: "Build & Assign", to: "/app/build-assign", icon: "⊞", section: "main" },
  { id: "shop-builder", label: "Shop Builder", to: "/app/shop-builder", icon: "⚒", section: "main" },
  { id: "general", label: "General", to: "/app/general", icon: "⚙", section: "builders" },
  {
    id: "gangsheet-builder",
    label: "Gangsheet Builder",
    to: "/app/gangsheet-builder",
    icon: "▤",
    section: "builders",
  },
  {
    id: "image-to-sheet",
    label: "Image to Sheet",
    to: "/app/image-to-sheet",
    icon: "⇲",
    section: "builders",
  },
  { id: "appearance", label: "Appearance", to: "/app/appearance", icon: "◐", section: "builders" },
  { id: "gallery", label: "Gallery Settings", to: "/app/gallery", icon: "▦", section: "builders" },
  { id: "pod", label: "POD", to: "/app/pod", icon: "⎙", section: "builders" },
  { id: "transactions", label: "Activity", to: "/app/transactions", icon: "◎", section: "main" },
  { id: "fonts", label: "Fonts", to: "/app/fonts", icon: "A", section: "builders" },
  { id: "fitcheck", label: "FitCheck", to: "/app/fitcheck", icon: "◫", section: "builders" },
  { id: "changelog", label: "Changelog", to: "/app/changelog", icon: "≡", section: "settings" },
  { id: "support", label: "Support", to: "/app/support", icon: "?", section: "settings" },
  { id: "setup", label: "Setup", to: "/app/setup", icon: "✓", section: "settings" },
];

export function isNavActive(pathname: string, item: BagsNavItem): boolean {
  if (item.id === "home") return pathname === "/app" || pathname === "/app/";
  const prefix = item.matchPrefix ?? item.to;
  return pathname === item.to || pathname.startsWith(`${prefix}/`);
}
