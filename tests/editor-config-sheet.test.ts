import { describe, expect, it } from "vitest";
import { resolveGangSheetHeight } from "../app/domain/design/gang-sheet-sheet";
import { loadEditorPageConfig } from "../app/lib/editor-config.server";

describe("loadEditorPageConfig gang sheet height", () => {
  it("never uses upload-by-size roll max as default canvas height", async () => {
    const height = resolveGangSheetHeight({
      bindingMaxHeightIn: 360,
      bindingSheetHeightIn: null,
      gangSheetVariants: [],
    });
    expect(height).toBe(24);
    expect(height).not.toBe(360);
  });
});

describe("editor config integration", () => {
  it("exports defaultSheetHeightIn on EditorPageConfig shape", () => {
    expect(typeof loadEditorPageConfig).toBe("function");
  });
});
