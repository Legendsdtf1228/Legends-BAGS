import { describe, expect, it } from "vitest";
import { GANG_SHEET_EDITOR_CSS } from "../app/components/editor/gang-sheet/gang-sheet-editor-styles";
import { GANG_SHEET_SHELL_CSS } from "../app/components/editor/gang-sheet/gang-sheet-shell-styles";
import { GS_EDITOR_TOKENS } from "../app/components/editor/gang-sheet/editor-tokens";
import { SHEET_TEMPLATES } from "../app/components/editor/gang-sheet/editor-data";

describe("gang sheet editor shell", () => {
  it("ships v2 command bar and save dialog styles", () => {
    expect(GANG_SHEET_EDITOR_CSS).toContain(".gs-command-bar");
    expect(GANG_SHEET_EDITOR_CSS).toContain(".gs-save-dialog");
    expect(GANG_SHEET_EDITOR_CSS).toContain("gs-editor-v2");
  });

  it("ships v2 shell grid and hides mobile dock on desktop", () => {
    expect(GANG_SHEET_SHELL_CSS).toContain(".mobile-bar{display:none!important}");
    expect(GANG_SHEET_SHELL_CSS).toContain(".workspace.has-properties");
    expect(GANG_SHEET_SHELL_CSS).toContain("grid-template-columns:var(--gs-rail-w) var(--gs-panel-w) minmax(0,1fr)");
  });

  it("defines layout tokens for bar, rail, and panel", () => {
    expect(GS_EDITOR_TOKENS.commandBarHeight).toBe("60px");
    expect(GS_EDITOR_TOKENS.railWidth).toBe("72px");
    expect(GS_EDITOR_TOKENS.panelWidth).toBe("300px");
    expect(GS_EDITOR_TOKENS.propertiesWidth).toBe("300px");
  });

  it("includes sheet templates for sidebar Templates panel", () => {
    expect(SHEET_TEMPLATES.length).toBeGreaterThan(0);
    expect(SHEET_TEMPLATES[0]).toMatchObject({
      id: expect.any(String),
      widthIn: expect.any(Number),
      heightIn: expect.any(Number),
    });
  });
});
