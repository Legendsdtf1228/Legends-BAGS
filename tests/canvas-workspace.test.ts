import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CanvasAlignToolbar,
  CanvasEmptyState,
  CanvasMetaBar,
  CanvasRulers,
  CanvasSheetTabs,
} from "../app/components/editor/gang-sheet/canvas-chrome";
import { GANG_SHEET_EDITOR_CSS } from "../app/components/editor/gang-sheet/gang-sheet-editor-styles";
import { SHEET_TEMPLATES } from "../app/components/editor/gang-sheet/editor-data";
import {
  isActiveSheetTab,
  pieceCountLabel,
  rulerLabels,
  selectedCountLabel,
  selectionBounds,
  sheetTabItems,
} from "../app/components/editor/gang-sheet/canvas-workspace";

describe("canvas ruler labels", () => {
  it("matches the previous integer-inch generation", () => {
    expect(rulerLabels(22.5)).toEqual(
      Array.from({ length: Math.ceil(22.5) + 1 }, (_, i) => i),
    );
    expect(rulerLabels(250, 48)).toEqual(
      Array.from({ length: Math.min(Math.ceil(250) + 1, 48) }, (_, i) => i),
    );
  });
});

describe("canvas sheet tabs", () => {
  it("marks matching template as active and adds a current tab when custom", () => {
    const standard = sheetTabItems(SHEET_TEMPLATES, 22.5, 24);
    expect(standard.some((t) => isActiveSheetTab(t, 22.5, 24))).toBe(true);
    expect(standard.some((t) => t.id === "current")).toBe(false);

    const custom = sheetTabItems(SHEET_TEMPLATES, 24, 36);
    expect(custom.at(-1)).toMatchObject({
      id: "current",
      widthIn: 24,
      heightIn: 36,
    });
  });
});

describe("canvas selection chrome helpers", () => {
  it("returns union bounds only for multi-select", () => {
    const items = [
      { id: "a", xIn: 1, yIn: 2, widthIn: 3, heightIn: 4 },
      { id: "b", xIn: 6, yIn: 1, widthIn: 2, heightIn: 2 },
    ];
    expect(selectionBounds(items, ["a"])).toBeNull();
    expect(selectionBounds(items, ["a", "b"])).toEqual({
      xIn: 1,
      yIn: 1,
      widthIn: 7,
      heightIn: 5,
    });
  });

  it("labels piece and multi-select counts", () => {
    expect(pieceCountLabel(1)).toBe("1 piece");
    expect(pieceCountLabel(3)).toBe("3 pieces");
    expect(selectedCountLabel(1)).toBeNull();
    expect(selectedCountLabel(2)).toBe("2 selected");
  });
});

describe("canvas workspace CSS", () => {
  it("ships dark print-shop surround and gold selection accents", () => {
    expect(GANG_SHEET_EDITOR_CSS).toContain(".canvas-main");
    expect(GANG_SHEET_EDITOR_CSS).toContain("--gs-canvas-gold:#e89119");
    expect(GANG_SHEET_EDITOR_CSS).toContain("--gs-canvas-gold-bright:#ffd45e");
    expect(GANG_SHEET_EDITOR_CSS).toContain("--gs-canvas-surround:#14181e");
    expect(GANG_SHEET_EDITOR_CSS).toContain("canvas-sheet-tabs");
    expect(GANG_SHEET_EDITOR_CSS).toContain("canvas-align-bar");
    expect(GANG_SHEET_EDITOR_CSS).toContain("canvas-zoom");
  });
});

describe("canvas chrome markup", () => {
  it("renders size readout, snap, and zoom without renaming existing labels", () => {
    const html = renderToStaticMarkup(
      createElement(CanvasMetaBar, {
        sheetWidth: 22.5,
        sheetHeight: 24,
        utilization: 12,
        itemCount: 3,
        selectedCount: 2,
        snapEnabled: true,
        onSnapChange: () => undefined,
        zoomLabel: "100%",
        onZoomOut: () => undefined,
        onZoomIn: () => undefined,
        onFitWidth: () => undefined,
        onFitSheet: () => undefined,
      }),
    );
    expect(html).toContain("22.5 × 24 in");
    expect(html).toContain("12% used · 3 pieces");
    expect(html).toContain("2 selected");
    expect(html).toContain("Snap");
    expect(html).toContain("100%");
    expect(html).toContain('aria-label="Zoom out"');
    expect(html).toContain('aria-label="Fit width"');
  });

  it("renders the same ruler inch labels as before", () => {
    const html = renderToStaticMarkup(
      createElement(CanvasRulers, { sheetWidth: 22.5, sheetHeight: 24 }),
    );
    expect(html).toContain("ruler-corner");
    expect(html).toContain("ruler-h");
    expect(html).toContain("ruler-v");
    expect(html).toContain(">0<");
    expect(html).toContain(">22<");
    expect(html).toContain(">24<");
  });

  it("renders a useful empty state with add-artwork actions", () => {
    const html = renderToStaticMarkup(
      createElement(CanvasEmptyState, {
        onUpload: () => undefined,
        onGallery: () => undefined,
        onText: () => undefined,
      }),
    );
    expect(html).toContain('class="empty canvas-empty"');
    expect(html).toContain("Upload files");
    expect(html).toContain("Gallery");
    expect(html).toContain("Add text");
  });

  it("keeps distribute disabled until three items are selected", () => {
    const one = renderToStaticMarkup(
      createElement(CanvasAlignToolbar, {
        selectedCount: 1,
        onAlign: () => undefined,
        onDistribute: () => undefined,
      }),
    );
    expect(one).toContain('aria-label="Align left"');
    expect(one).toContain("disabled");

    const three = renderToStaticMarkup(
      createElement(CanvasAlignToolbar, {
        selectedCount: 3,
        onAlign: () => undefined,
        onDistribute: () => undefined,
      }),
    );
    expect(three).toContain('aria-label="Distribute horizontally"');
    expect(three).not.toContain("disabled");
  });

  it("renders production sheet tabs from templates", () => {
    const html = renderToStaticMarkup(
      createElement(CanvasSheetTabs, {
        templates: SHEET_TEMPLATES,
        sheetWidth: 22.5,
        sheetHeight: 24,
        onSelect: () => undefined,
      }),
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain("22.5 × 24");
    expect(html).toContain('aria-selected="true"');
  });
});
