import { describe, expect, it } from "vitest";
import { BAGS_PARITY_EDITOR_CSS } from "../app/components/editor/bags-parity/bags-parity-editor-styles";
import { BAGS_STOREFRONT_TOKENS } from "../app/components/editor/bags-parity/bags-storefront-tokens";
import { BAGS_ADMIN_NAV } from "../app/components/merchant/bags-admin-nav";
import { GANG_SHEET_HEIGHTS } from "../app/domain/design/gang-sheet-sheet";

describe("exact BAGS parity foundation", () => {
  it("ships BAGS storefront shell styles", () => {
    expect(BAGS_PARITY_EDITOR_CSS).toContain("bags-parity-editor");
    expect(BAGS_PARITY_EDITOR_CSS).toContain("bags-parity-bottom-nav");
    expect(BAGS_PARITY_EDITOR_CSS).toContain("bags-parity-header");
    expect(BAGS_PARITY_EDITOR_CSS).toContain("bags-quality-legend");
    expect(BAGS_PARITY_EDITOR_CSS).toContain("bags-drawer-right");
  });

  it("uses BAGS primary blue for customer actions", () => {
    expect(BAGS_STOREFRONT_TOKENS.primaryBlue).toBe("#1a73e8");
  });

  it("lists production gang sheet heights including 24 not 360", () => {
    expect(GANG_SHEET_HEIGHTS).toContain(24);
    expect(GANG_SHEET_HEIGHTS).toContain(250);
    expect(GANG_SHEET_HEIGHTS).not.toContain(360);
  });

  it("aligns admin nav labels with BAGS terminology", () => {
    const labels = BAGS_ADMIN_NAV.map((n) => n.label);
    expect(labels).toContain("Welcome");
    expect(labels).toContain("Set up");
    expect(labels).toContain("Gallery Settings");
    expect(labels).toContain("Print on Demand");
    expect(labels).toContain("Support Ticket");
  });
});
