import { describe, expect, it } from "vitest";
import { buildUploadBySizeStateFromLines } from "../app/domain/design/pipeline";
import type { SizeInput } from "../app/domain/pricing";

describe("multi upload by size", () => {
  it("combines multiple lines into one auto-nest design state", () => {
    const size: SizeInput = { mode: "preset", presetId: "4in", quantity: 2 };
    const state = buildUploadBySizeStateFromLines([
      {
        assetId: "a1",
        sourceWidthPx: 400,
        sourceHeightPx: 400,
        size,
      },
      {
        assetId: "a2",
        sourceWidthPx: 800,
        sourceHeightPx: 400,
        size: { mode: "preset", presetId: "4in", quantity: 1 },
      },
    ]);

    expect(state.workflow).toBe("upload_by_size");
    expect(state.layout).toBe("auto");
    expect(state.items).toHaveLength(2);
    expect(state.items[0].quantity).toBe(2);
    expect(state.pricing.areaSqIn).toBeGreaterThan(0);
    expect(state.pricing.totalCents).toBe(
      Math.round(state.pricing.areaSqIn * 0.049 * 100),
    );
  });
});
