import { describe, expect, it } from "vitest";
import { BAGS_ADMIN_NAV, isNavActive } from "../app/components/merchant/bags-admin-nav";

const byId = Object.fromEntries(BAGS_ADMIN_NAV.map((item) => [item.id, item]));

function nav(id: keyof typeof byId) {
  const item = byId[id];
  if (!item) throw new Error(`Missing nav item ${String(id)}`);
  return item;
}

describe("BAGS admin navigation", () => {
  it("groups merchant destinations the way BAGS/Drip dashboards do", () => {
    expect(BAGS_ADMIN_NAV.filter((item) => item.section === "main").map((item) => item.id)).toEqual([
      "home",
      "products",
      "designs",
      "orders",
      "build-assign",
      "shop-builder",
      "transactions",
    ]);
    expect(BAGS_ADMIN_NAV.filter((item) => item.section === "settings").map((item) => item.id)).toEqual([
      "general",
      "gangsheet-builder",
      "image-to-sheet",
      "appearance",
      "gallery",
      "pod",
      "fonts",
      "fitcheck",
    ]);
    expect(BAGS_ADMIN_NAV.filter((item) => item.section === "support").map((item) => item.id)).toEqual([
      "changelog",
      "support",
      "setup",
    ]);
  });

  it("marks Home active only on the dashboard route", () => {
    expect(isNavActive("/app", nav("home"))).toBe(true);
    expect(isNavActive("/app/", nav("home"))).toBe(true);
    expect(isNavActive("/app/products", nav("home"))).toBe(false);
    expect(isNavActive("/app/designs", nav("home"))).toBe(false);
  });

  it("keeps nested design routes selected", () => {
    expect(isNavActive("/app/designs", nav("designs"))).toBe(true);
    expect(isNavActive("/app/designs/abc", nav("designs"))).toBe(true);
    expect(isNavActive("/app/orders", nav("designs"))).toBe(false);
  });
});
