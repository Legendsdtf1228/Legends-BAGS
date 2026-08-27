import { describe, expect, it } from "vitest";
import {
  orderCustomerFields,
  orderNumberFromPayload,
  parseOrderDesignLines,
} from "../app/domain/shopify/order-webhook";

describe("parseOrderDesignLines", () => {
  it("extracts design metadata from line item properties", () => {
    const lines = parseOrderDesignLines([
      {
        id: 1001,
        admin_graphql_api_id: "gid://shopify/LineItem/1001",
        product_id: 200,
        variant_id: 300,
        quantity: 2,
        properties: [
          { name: "_lgs_design_id", value: "des_test" },
          { name: "_lgs_design_version", value: "4" },
          { name: "_lgs_builder_type", value: "gang_sheet" },
          { name: "_lgs_sheet_width", value: "22.5" },
          { name: "_lgs_sheet_height", value: "24" },
          { name: "_lgs_price_ref", value: "signed" },
        ],
      },
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      lineItemId: "gid://shopify/LineItem/1001",
      designId: "des_test",
      designVersion: 4,
      builderType: "gang_sheet",
      sheetWidthIn: 22.5,
      sheetHeightIn: 24,
      quantity: 2,
      productGid: "gid://shopify/Product/200",
      variantGid: "gid://shopify/ProductVariant/300",
    });
  });

  it("ignores unrelated line items", () => {
    expect(parseOrderDesignLines([{ id: 1, properties: [] }])).toEqual([]);
  });
});

describe("order payload helpers", () => {
  it("builds order number and customer fields", () => {
    expect(orderNumberFromPayload({ name: "#1042", order_number: 1042 })).toBe("#1042");
    expect(
      orderCustomerFields({
        customer: {
          id: 9,
          email: "buyer@example.com",
          first_name: "Alex",
          last_name: "Rivera",
        },
      }),
    ).toMatchObject({
      customerEmail: "buyer@example.com",
      customerName: "Alex Rivera",
      customerGid: "gid://shopify/Customer/9",
    });
  });
});
