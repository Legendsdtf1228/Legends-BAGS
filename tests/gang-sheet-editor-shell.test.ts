import { describe, expect, it } from "vitest";
import { GANG_SHEET_EDITOR_CSS } from "../app/components/editor/gang-sheet/gang-sheet-editor-styles";
import { GS_EDITOR_TOKEN_CSS, GS_EDITOR_TOKENS } from "../app/components/editor/gang-sheet/editor-tokens";
import { HELP_SHORTCUTS, SHEET_TEMPLATES } from "../app/components/editor/gang-sheet/editor-data";

describe("gang sheet editor shell", () => {
  it("ships v2 command bar and save dialog styles", () => {
    expect(GANG_SHEET_EDITOR_CSS).toContain(".gs-command-bar");
    expect(GANG_SHEET_EDITOR_CSS).toContain(".gs-save-dialog");
    expect(GANG_SHEET_EDITOR_CSS).toContain("gs-editor-v2");
    expect(GANG_SHEET_EDITOR_CSS).toContain(".pr-scope");
  });

  it("defines layout tokens for bar, rail, and panel", () => {
    expect(GS_EDITOR_TOKENS.commandBarHeight).toBe("56px");
    expect(GS_EDITOR_TOKENS.railWidth).toBe("68px");
    expect(GS_EDITOR_TOKENS.panelWidth).toBe("300px");
  });

  it("uses Legends logo gold/black for studio chrome", () => {
    expect(GS_EDITOR_TOKENS.color.accent).toBe("#e4b84a");
    expect(GS_EDITOR_TOKENS.color.accentDeep).toBe("#e89119");
    expect(GS_EDITOR_TOKENS.color.workspace).toBe("#121417");
    expect(GS_EDITOR_TOKENS.color.panel).toBe("#f4f4f2");
    expect(GS_EDITOR_TOKENS.color.rail).toBe("#0e1013");
  });

  it("exposes --gs-* variables for later surfaces", () => {
    expect(GS_EDITOR_TOKEN_CSS).toContain("--gs-workspace");
    expect(GS_EDITOR_TOKEN_CSS).toContain("--gs-accent");
    expect(GS_EDITOR_TOKEN_CSS).toContain("--gs-panel");
    expect(GS_EDITOR_TOKEN_CSS).toContain("--gs-space-1");
    expect(GANG_SHEET_EDITOR_CSS).toContain("--gs-workspace");
    expect(GANG_SHEET_EDITOR_CSS).toContain(".gs-primary-btn");
    expect(GANG_SHEET_EDITOR_CSS).toContain(".gs-danger-btn");
    expect(GANG_SHEET_EDITOR_CSS).toContain("nav.icon-rail");
    expect(GANG_SHEET_EDITOR_CSS).toContain("flex-direction:column");
  });

  it("keeps compact control density", () => {
    expect(GS_EDITOR_TOKENS.typography.label).toBe("11px");
    expect(GS_EDITOR_TOKENS.typography.control).toBe("12px");
    expect(GS_EDITOR_TOKENS.typography.title).toBe("16px");
    expect(GS_EDITOR_TOKENS.space[1]).toBe("4px");
    expect(GS_EDITOR_TOKENS.space[5]).toBe("24px");
    expect(GS_EDITOR_TOKENS.radius.md).toBe("6px");
  });

  it("includes panel collapse shortcuts in Help", () => {
    expect(HELP_SHORTCUTS.some((h) => h.keys === "[")).toBe(true);
    expect(HELP_SHORTCUTS.some((h) => h.keys === "]")).toBe(true);
  });

  it("includes sheet templates for sidebar Templates panel", () => {
    expect(SHEET_TEMPLATES.length).toBeGreaterThan(0);
    expect(SHEET_TEMPLATES[0]).toMatchObject({
      id: expect.any(String),
      widthIn: expect.any(Number),
      heightIn: expect.any(Number),
    });
  });

  it("includes canvas workspace chrome styles", () => {
    expect(GANG_SHEET_EDITOR_CSS).toContain("canvas-align-bar");
    expect(GANG_SHEET_EDITOR_CSS).toContain("canvas-sheet-tabs");
    expect(GANG_SHEET_EDITOR_CSS).toContain("--gs-canvas-surround");
  });

  it("keeps the mobile toolbar off desktop chrome", () => {
    expect(GANG_SHEET_EDITOR_CSS).toContain("nav.mobile-bar{display:none}");
  });
});
