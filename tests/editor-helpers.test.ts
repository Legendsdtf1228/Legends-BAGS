import { describe, expect, it } from "vitest";
import {
  aabbOverlap,
  isArtboardViolation,
  nextZIndex,
  reorderLayer,
  draftStorageKey,
} from "../app/components/editor/gang-sheet-helpers";
import {
  CART_DESIGN_ID_PROPERTY,
  CART_DESIGN_VERSION_PROPERTY,
} from "../app/domain/design/types";

describe("gang-sheet editor helpers", () => {
  it("detects AABB overlap", () => {
    expect(
      aabbOverlap(
        { id: "a", xIn: 0, yIn: 0, widthIn: 4, heightIn: 4 },
        { id: "b", xIn: 3, yIn: 3, widthIn: 4, heightIn: 4 },
      ),
    ).toBe(true);
    expect(
      aabbOverlap(
        { id: "a", xIn: 0, yIn: 0, widthIn: 2, heightIn: 2 },
        { id: "b", xIn: 2.1, yIn: 0, widthIn: 2, heightIn: 2 },
      ),
    ).toBe(false);
  });

  it("flags artboard margin violations", () => {
    expect(
      isArtboardViolation(
        { id: "a", xIn: 0, yIn: 0, widthIn: 2, heightIn: 2 },
        22.5,
        24,
      ),
    ).toBe(true);
    expect(
      isArtboardViolation(
        { id: "a", xIn: 0.1, yIn: 0.1, widthIn: 2, heightIn: 2 },
        22.5,
        24,
      ),
    ).toBe(false);
  });

  it("reorders zIndex bring-forward / send-back", () => {
    const items = [
      { id: "a", zIndex: 1 },
      { id: "b", zIndex: 2 },
      { id: "c", zIndex: 3 },
    ];
    const forward = reorderLayer(items, "b", "forward");
    expect(forward).not.toBeNull();
    expect(forward!.find((i) => i.id === "b")?.zIndex).toBe(3);
    expect(forward!.find((i) => i.id === "c")?.zIndex).toBe(2);
    expect(nextZIndex([{ zIndex: 1 }, { zIndex: 4 }])).toBe(5);
  });

  it("scopes draft keys per shop without secrets", () => {
    expect(draftStorageKey("legends-bags-in2lwdll.myshopify.com")).toBe(
      "lgs_gang_draft_legends-bags-in2lwdll.myshopify.com",
    );
  });
});

describe("cart design properties", () => {
  it("uses stable cart property names", () => {
    expect(CART_DESIGN_ID_PROPERTY).toBe("_lgs_design_id");
    expect(CART_DESIGN_VERSION_PROPERTY).toBe("_lgs_design_version");
  });
});
