import { describe, expect, it } from "vitest";
import { bagsAdminStyles } from "../app/components/merchant/bags-admin-ui";

describe("BAGS admin shell CSS", () => {
  it("does not force-show the mobile nav after hiding it", () => {
    expect(bagsAdminStyles).toContain(".bags-admin-nav{display:none");
    expect(bagsAdminStyles).toContain(".bags-admin-sidebar.is-mobile-open .bags-admin-nav{display:flex");
    expect(bagsAdminStyles).toContain("@media(max-width:960px)");
    expect(bagsAdminStyles).toMatch(/@media\(max-width:960px\)\{[\s\S]*\.bags-admin-sidebar,\.bags-admin-sidebar\.is-collapsed\{width:100%/);
    expect(bagsAdminStyles).not.toContain(
      ".bags-admin-sidebar.is-mobile-open .bags-admin-nav{display:block}\n  .bags-admin-nav{display:flex",
    );
  });

  it("includes collapse, skip-link, and keyboard focus styles", () => {
    expect(bagsAdminStyles).toContain(".bags-collapse-toggle");
    expect(bagsAdminStyles).toContain(".bags-admin-skip");
    expect(bagsAdminStyles).toContain(":focus-visible");
    expect(bagsAdminStyles).toContain(".bags-admin-date-range .bags-admin-btn[aria-pressed=true]");
  });
});
