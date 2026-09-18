import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { artworkPrintQuality, DEFAULT_ARTWORK_TREATMENT } from "../app/components/editor/gang-sheet/artwork-inspector-quality";
import { ARTWORK_INSPECTOR_CSS } from "../app/components/editor/gang-sheet/artwork-inspector-styles";

const INSPECTOR_SRC = readFileSync("app/components/editor/gang-sheet/artwork-inspector.tsx", "utf8");
const ROUTE_SRC = readFileSync("app/routes/editor.gang-sheet.tsx", "utf8");
const MODAL_SRC = readFileSync("app/components/editor/background-removal-modal.tsx", "utf8");

describe("artwork inspector print quality", () => {
  it("warns when print DPI is poor for the current size", () => {
    const q = artworkPrintQuality({
      widthPx: 300,
      heightPx: 300,
      widthIn: 4,
      heightIn: 4,
      dpi: 300,
    });
    expect(q).not.toBeNull();
    expect(q!.printDpi).toBe(75);
    expect(q!.info.tier).toBe("poor");
    expect(q!.warn).toBe(true);
    expect(q!.taggedDpi).toBe(300);
  });

  it("marks excellent at 300 print DPI and skips text", () => {
    const q = artworkPrintQuality({
      widthPx: 900,
      heightPx: 900,
      widthIn: 3,
      heightIn: 3,
    });
    expect(q!.info.tier).toBe("excellent");
    expect(q!.warn).toBe(false);
    expect(
      artworkPrintQuality({
        kind: "text",
        widthPx: 1,
        heightPx: 1,
        widthIn: 2,
        heightIn: 2,
      }),
    ).toBeNull();
  });
});

describe("artwork inspector panel UX", () => {
  it("keeps common path controls immediately visible", () => {
    for (const label of [
      "Width (in)",
      "Height (in)",
      "Rotate selected",
      "Flip horizontal",
      "Flip vertical",
      "Duplicate selected",
      "Delete selected",
      "Lock aspect ratio",
    ]) {
      expect(INSPECTOR_SRC).toContain(`aria-label="${label}"`);
    }
    expect(INSPECTOR_SRC).toContain("gs-art-primary");
    expect(INSPECTOR_SRC).toContain("gs-art-dup");
  });

  it("nests trim, overlay, and halftone under Advanced without processing calls", () => {
    expect(INSPECTOR_SRC).toContain('className="gs-art-advanced"');
    expect(INSPECTOR_SRC).toContain("Trim / crop");
    expect(INSPECTOR_SRC).toContain("Color overlay");
    expect(INSPECTOR_SRC).toContain("Halftone");
    expect(INSPECTOR_SRC).toContain("print output is unchanged");
    expect(INSPECTOR_SRC).not.toContain("/api/assets/");
    expect(INSPECTOR_SRC).not.toContain("fetch(");
    expect(DEFAULT_ARTWORK_TREATMENT.trimPct).toBe(0);
    expect(DEFAULT_ARTWORK_TREATMENT.overlayAmount).toBe(0);
    expect(DEFAULT_ARTWORK_TREATMENT.halftone).toBe(false);
  });

  it("keeps existing apply-step cutout aria and DPI warning chrome", () => {
    expect(INSPECTOR_SRC).toContain('aria-label="Remove background"');
    expect(INSPECTOR_SRC).toContain("gs-art-dpi");
    expect(INSPECTOR_SRC).toContain("dpi-warn");
    expect(ARTWORK_INSPECTOR_CSS).toContain(".gs-art-dpi.tier-poor");
    expect(ARTWORK_INSPECTOR_CSS).toContain("#ffd45e");
  });

  it("is wired into the gang sheet editor properties slot", () => {
    expect(ROUTE_SRC).toContain("<ArtworkInspector");
    expect(ROUTE_SRC).toContain("ARTWORK_INSPECTOR_CSS");
    expect(ROUTE_SRC).toContain("onDuplicate={duplicate}");
    expect(ROUTE_SRC).toContain("onRotate={rotate}");
    expect(ROUTE_SRC).not.toContain("<strong>Properties</strong>");
  });
});

describe("cutout apply preview chrome", () => {
  it("styles a large Apply action without changing the processing endpoint", () => {
    expect(MODAL_SRC).toContain(".btn.primary{background:#ffd45e");
    expect(MODAL_SRC).toContain("/remove-background");
    expect(MODAL_SRC).toContain("Apply");
  });
});
