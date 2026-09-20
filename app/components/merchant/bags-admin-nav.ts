export type BagsNavItem = {
  id: string;
  label: string;
  to: string;
  icon: string;
  section?: "main" | "settings" | "support";
  matchPrefix?: string;
};

/** BAGS-style merchant sidebar — mirrors live app section names and order. */
export const BAGS_ADMIN_NAV: BagsNavItem[] = [
  { id: "home", label: "Dashboard", to: "/app", icon: "home", section: "main" },
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
    id: "settings",
    label: "Settings",
    to: "/app/settings",
    icon: "general",
    section: "settings",
    matchPrefix: "/app/settings",
  },
  { id: "support", label: "Support", to: "/app/support", icon: "support", section: "support" },
];

export function isNavActive(pathname: string, item: BagsNavItem): boolean {
  if (item.id === "home") return pathname === "/app" || pathname === "/app/";
  const prefix = item.matchPrefix ?? item.to;
  return pathname === item.to || pathname.startsWith(`${prefix}/`);
}
