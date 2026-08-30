import { describe, expect, it } from "vitest";
import { BAGS_PARITY_EDITOR_CSS } from "../app/components/editor/bags-parity/bags-parity-editor-styles";
import {
  alignSelected,
  distributeSelected,
  shelfPackLayout,
} from "../app/components/editor/gang-sheet-helpers";
import {
  applyCropToDimensions,
  autoFillCopyCount,
  DEFAULT_CROP,
  DEFAULT_IMAGE_ADJUSTMENTS,
} from "../app/domain/image/image-adjustments";
import { existsSync } from "node:fs";
import { join } from "node:path";

const QA_FIXTURE = join(process.cwd(), "tests/fixtures/qa-reference-11x11.png");

describe("selected-image workflow helpers", () => {
  it("recalculates inch dimensions when crop is applied", () => {
    const next = applyCropToDimensions(990, 1015, 11, 11.28, { x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    expect(next.widthIn).toBeCloseTo(8.8, 2);
    expect(next.heightIn).toBeCloseTo(9.024, 2);
    expect(next.widthPx).toBe(792);
    expect(next.heightPx).toBe(812);
  });

  it("ships QA reference fixture on disk", () => {
    expect(existsSync(QA_FIXTURE)).toBe(true);
  });
});

describe("selection toolbar transforms", () => {
  const items = [
    { id: "a", xIn: 1, yIn: 1, widthIn: 2, heightIn: 2 },
    { id: "b", xIn: 5, yIn: 1, widthIn: 2, heightIn: 2 },
    { id: "c", xIn: 9, yIn: 1, widthIn: 2, heightIn: 2 },
  ];

  it("aligns and distributes multi-select", () => {
    const aligned = alignSelected(items, new Set(["a", "b"]), "left", 22.5, 24);
    expect(aligned.find((i) => i.id === "a")!.xIn).toBe(aligned.find((i) => i.id === "b")!.xIn);
    const distributed = distributeSelected(items, new Set(["a", "b", "c"]), "horizontal", 22.5, 24);
    expect(distributed.find((i) => i.id === "a")!.xIn).toBeLessThan(distributed.find((i) => i.id === "c")!.xIn);
  });
});

describe("image editor state defaults", () => {
  it("starts from neutral adjustments and full crop", () => {
    expect(DEFAULT_IMAGE_ADJUSTMENTS.gamma).toBe(1);
    expect(DEFAULT_CROP).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });
});

describe("automation preview", () => {
  it("auto-fill counts four 11×11.28 copies on 22.5×24", () => {
    expect(autoFillCopyCount(11, 11.28, 22.5, 24, 0.15)).toBeGreaterThanOrEqual(4);
  });

  it("shelf-pack reports fitted vs remaining before apply", () => {
    const items = [
      { id: "1", xIn: 0, yIn: 0, widthIn: 11, heightIn: 11.28 },
      { id: "2", xIn: 0, yIn: 0, widthIn: 11, heightIn: 11.28 },
      { id: "3", xIn: 0, yIn: 0, widthIn: 11, heightIn: 11.28 },
      { id: "4", xIn: 0, yIn: 0, widthIn: 11, heightIn: 11.28 },
      { id: "5", xIn: 0, yIn: 0, widthIn: 11, heightIn: 11.28 },
    ];
    const preview = shelfPackLayout(items, 22.5, 24, 0.15);
    expect(preview.fittedCount).toBeGreaterThan(0);
    expect(preview.fittedCount + preview.remainingCount).toBe(items.length);
    expect(preview.placed.every((p) => p.yIn + p.heightIn <= 24 + 1e-6)).toBe(true);
  });
});

describe("responsive shell CSS", () => {
  it("includes breakpoints for 1280, 1024, and 768 viewports", () => {
    expect(BAGS_PARITY_EDITOR_CSS).toContain("@media(max-width:1280px)");
    expect(BAGS_PARITY_EDITOR_CSS).toContain("@media(max-width:1024px)");
    expect(BAGS_PARITY_EDITOR_CSS).toContain("@media(max-width:768px)");
    expect(BAGS_PARITY_EDITOR_CSS).toContain("properties.bags-parity-properties.mobile-open");
  });
});
