export type BagsNavItem = {
  id: string;
  label: string;
  to: string;
  icon: string;
  section?: "main" | "settings" | "support";
  matchPrefix?: string;
};

/** BAGS-style merchant sidebar — exact terminology from live BAGS admin. */
export const BAGS_ADMIN_NAV: BagsNavItem[] = [
  { id: "home", label: "Welcome", to: "/app", icon: "home", section: "main" },
  { id: "setup", label: "Set up", to: "/app/setup", icon: "setup", section: "main" },
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
  {
    id: "transactions",
    label: "Transactions",
    to: "/app/transactions",
    icon: "transactions",
    section: "main",
  },
  { id: "general", label: "General", to: "/app/general", icon: "general", section: "settings" },
  {
    id: "gangsheet-builder",
    label: "Gang Sheet",
    to: "/app/gangsheet-builder",
    icon: "gangsheet-builder",
    section: "settings",
  },
  {
    id: "gangsheet-output",
    label: "Builder",
    to: "/app/gangsheet-builder",
    icon: "gangsheet-builder",
    section: "settings",
  },
  {
    id: "image-to-sheet",
    label: "Image to Sheet",
    to: "/app/image-to-sheet",
    icon: "image-to-sheet",
    section: "settings",
  },
  { id: "appearance", label: "Appearance", to: "/app/appearance", icon: "appearance", section: "settings" },
  { id: "gallery", label: "Gallery Settings", to: "/app/gallery", icon: "gallery", section: "settings" },
  { id: "pod", label: "Print on Demand", to: "/app/pod", icon: "pod", section: "settings" },
  { id: "fonts", label: "Fonts", to: "/app/fonts", icon: "fonts", section: "settings" },
  { id: "fitcheck", label: "FitCheck Templates", to: "/app/fitcheck", icon: "fitcheck", section: "settings" },
  { id: "changelog", label: "Changelog", to: "/app/changelog", icon: "changelog", section: "support" },
  { id: "support", label: "Support Ticket", to: "/app/support", icon: "support", section: "support" },
];

export function isNavActive(pathname: string, item: BagsNavItem): boolean {
  if (item.id === "home") return pathname === "/app" || pathname === "/app/";
  const prefix = item.matchPrefix ?? item.to;
  return pathname === item.to || pathname.startsWith(`${prefix}/`);
}
