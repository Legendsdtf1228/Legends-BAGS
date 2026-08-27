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
  { id: "home", label: "Home", to: "/app", icon: "home", section: "main" },
  { id: "products", label: "Products", to: "/app/products", icon: "products", section: "main" },
  {
    id: "designs",
    label: "Designs",
    to: "/app/designs",
    icon: "designs",
    section: "main",
    matchPrefix: "/app/designs",
  },
  { id: "orders", label: "Orders", to: "/app/orders", icon: "orders", section: "main" },
  {
    id: "build-assign",
    label: "Build & Assign",
    to: "/app/build-assign",
    icon: "build-assign",
    section: "main",
  },
  {
    id: "shop-builder",
    label: "Shop Builder",
    to: "/app/shop-builder",
    icon: "shop-builder",
    section: "main",
  },
  { id: "general", label: "General", to: "/app/general", icon: "general", section: "builders" },
  {
    id: "gangsheet-builder",
    label: "Gangsheet Builder",
    to: "/app/gangsheet-builder",
    icon: "gangsheet-builder",
    section: "builders",
  },
  {
    id: "image-to-sheet",
    label: "Upload by Size",
    to: "/app/image-to-sheet",
    icon: "image-to-sheet",
    section: "builders",
  },
  { id: "appearance", label: "Appearance", to: "/app/appearance", icon: "appearance", section: "builders" },
  { id: "gallery", label: "Gallery Settings", to: "/app/gallery", icon: "gallery", section: "builders" },
  { id: "pod", label: "POD", to: "/app/pod", icon: "pod", section: "builders" },
  { id: "transactions", label: "Activity", to: "/app/transactions", icon: "transactions", section: "main" },
  { id: "fonts", label: "Fonts", to: "/app/fonts", icon: "fonts", section: "builders" },
  { id: "fitcheck", label: "FitCheck", to: "/app/fitcheck", icon: "fitcheck", section: "builders" },
  { id: "changelog", label: "Changelog", to: "/app/changelog", icon: "changelog", section: "settings" },
  { id: "support", label: "Support", to: "/app/support", icon: "support", section: "settings" },
  { id: "setup", label: "Setup", to: "/app/setup", icon: "setup", section: "settings" },
];

export function isNavActive(pathname: string, item: BagsNavItem): boolean {
  if (item.id === "home") return pathname === "/app" || pathname === "/app/";
  const prefix = item.matchPrefix ?? item.to;
  return pathname === item.to || pathname.startsWith(`${prefix}/`);
}
