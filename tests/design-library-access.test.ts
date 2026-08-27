import { describe, expect, it } from "vitest";
import { assertDesignCustomerAccess } from "../app/services/design-service";

describe("assertDesignCustomerAccess", () => {
  it("allows unassigned drafts for any session customer", () => {
    expect(() =>
      assertDesignCustomerAccess({ customerKey: null }, "guest:a"),
    ).not.toThrow();
  });

  it("requires matching customerKey when assigned", () => {
    expect(() =>
      assertDesignCustomerAccess({ customerKey: "guest:a" }, "guest:a"),
    ).not.toThrow();
    expect(() =>
      assertDesignCustomerAccess({ customerKey: "guest:a" }, "guest:b"),
    ).toThrow("Design not found");
    expect(() =>
      assertDesignCustomerAccess({ customerKey: "guest:a" }, null),
    ).toThrow("Design not found");
  });
});
