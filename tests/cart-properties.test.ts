import { describe, expect, it, beforeAll } from "vitest";
import {
  buildCartLineProperties,
  CART_DESIGN_NAME_PROPERTY,
  CART_PIECE_COUNT_PROPERTY,
  CART_SHEET_SIZE_PROPERTY,
  pieceCount,
  sheetSizeLabel,
} from "../app/domain/shopify/line-properties";
import type { DesignStateV1 } from "../app/domain/design/types";

const state: DesignStateV1 = {
  schemaVersion: 1,
  workflow: "gang_sheet",
  sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
  items: [
    { assetId: "a1", widthIn: 4, heightIn: 4, quantity: 2, rotationDeg: 0, xIn: 0, yIn: 0 },
  ],
  pricing: { currency: "USD", pricePerSqIn: 0.049, areaSqIn: 32, totalCents: 157 },
  layout: "manual",
};

describe("cart line properties", () => {
  beforeAll(() => {
    process.env.FILE_SIGNING_SECRET = "test-signing-secret-32chars!!";
  });

  it("builds customer-visible summary fields", () => {
    const props = buildCartLineProperties({
      shop: "legends-bags-in2lwdll.myshopify.com",
      designId: "des_1",
      version: 3,
      state,
      designName: "Team Sheet",
    });
    expect(props._lgs_design_id).toBe("des_1");
    expect(props._lgs_design_version).toBe("3");
    expect(props._lgs_builder_type).toBe("gang_sheet");
    expect(props._lgs_sheet_width).toBe("22.5");
    expect(props._lgs_sheet_height).toBe("24");
    expect(props._lgs_render_status).toBe("pending");
    expect(props[CART_SHEET_SIZE_PROPERTY]).toBe(sheetSizeLabel(state));
    expect(props[CART_PIECE_COUNT_PROPERTY]).toBe(String(pieceCount(state)));
    expect(props[CART_DESIGN_NAME_PROPERTY]).toBe("Team Sheet");
    expect(props._lgs_price_ref).toBeTruthy();
  });
});
