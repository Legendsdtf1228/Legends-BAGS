import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { editorAuthCookieBase, buildEditorAuthHeaders } from "../app/lib/editor-auth.server";
import { galleryRecordToAsset } from "../app/components/editor/gang-sheet/gallery-placement";
import { effectiveDpi, placementDpi } from "../app/components/editor/gang-sheet/dpi-quality";
import { artworkPrintQuality } from "../app/components/editor/gang-sheet/artwork-inspector-quality";
import { galleryCardDpi } from "../app/components/editor/gang-sheet/artwork-library/artwork-library-model";
import { GANG_SHEET_EDITOR_CSS } from "../app/components/editor/gang-sheet/gang-sheet-editor-styles";
import { GS_EDITOR_TOKENS } from "../app/components/editor/gang-sheet/editor-tokens";
import { PRODUCTION_WORKFLOW_CSS } from "../app/components/editor/workflow/workflow-styles";
import { buildProductionReview, countMissingArtwork } from "../app/components/editor/gang-sheet/production-review";

const ROUTE_SRC = readFileSync("app/routes/editor.gang-sheet.tsx", "utf8");

describe("gallery placement uses existing assets", () => {
  it("maps a shop GalleryAsset onto the existing Asset id and pixels", () => {
    const placed = galleryRecordToAsset({
      assetId: "asset_real_1",
      widthPx: 1200,
      heightPx: 800,
      dpi: 72,
      contentType: "image/png",
      thumb: "/api/assets/asset_real_1",
      widthIn: 6,
      heightIn: 4,
    });
    expect(placed.asset.assetId).toBe("asset_real_1");
    expect(placed.asset.widthPx).toBe(1200);
    expect(placed.asset.heightPx).toBe(800);
    expect(placed.asset.dpi).toBe(72);
    expect(placed.printDpi).toBe(effectiveDpi(1200, 800, 6, 4));
    expect(placed.printDpi).toBe(200);
    expect(placed.printDpi).not.toBe(300);
  });

  it("refuses placeholder thumbs that are not linked to an Asset", () => {
    expect(() =>
      galleryRecordToAsset({
        widthIn: 3,
        heightIn: 3,
        thumb: "data:image/svg+xml,fake",
      }),
    ).toThrow(/not linked to a shop asset/i);
  });

  it("does not invent a favorites contract", () => {
    expect(ROUTE_SRC.toLowerCase()).not.toContain("favorite");
    expect(readFileSync("app/components/editor/gang-sheet/artwork-library/gallery-panel.tsx", "utf8").toLowerCase()).not.toContain("favorite");
  });

  it("does not rasterize gallery thumbs at invented 300 DPI", () => {
    expect(ROUTE_SRC).not.toContain("rasterizeGalleryItem");
    expect(ROUTE_SRC).not.toContain("galleryThumbToAsset");
    expect(ROUTE_SRC).toContain("galleryRecordToAsset");
    expect(ROUTE_SRC).not.toContain("widthIn * 300");
  });
});

describe("honest DPI display", () => {
  it("marks gallery cards unavailable when pixels are missing", () => {
    expect(galleryCardDpi({ widthIn: 3, heightIn: 3 }).tier).toBe("unknown");
    expect(galleryCardDpi({ widthIn: 3, heightIn: 3 }).label).toBe("DPI n/a");
    expect(galleryCardDpi({ widthPx: 900, heightPx: 900, widthIn: 3, heightIn: 3 }).label).toBe("300 DPI");
  });

  it("changes print DPI when physical size changes", () => {
    const base = { widthPx: 900, heightPx: 900, widthIn: 3, heightIn: 3, dpi: 300 };
    expect(artworkPrintQuality(base)?.printDpi).toBe(300);
    expect(artworkPrintQuality({ ...base, widthIn: 6, heightIn: 6 })?.printDpi).toBe(150);
    expect(placementDpi({ ...base, widthIn: 6, heightIn: 6 })).toBe(150);
  });
});

describe("editor API cookies", () => {
  it("uses Lax cookies on HTTP so local editor auth can stick", () => {
    const http = new Request("http://localhost:3000/editor/gang-sheet");
    expect(editorAuthCookieBase(http)).toContain("SameSite=Lax");
    expect(editorAuthCookieBase(http)).not.toContain("Secure");
  });

  it("keeps SameSite=None; Secure for HTTPS storefront iframes", () => {
    const https = new Request("https://app.example/editor/gang-sheet");
    expect(editorAuthCookieBase(https)).toContain("SameSite=None");
    expect(editorAuthCookieBase(https)).toContain("Secure");
  });

  it("sets shop + test-token cookies when TEST_API_TOKEN is configured", () => {
    process.env.TEST_API_TOKEN = "token-for-cookie-test";
    const { headers, hasApiAuth } = buildEditorAuthHeaders(
      new Request("http://localhost/editor/gang-sheet"),
      "dev.myshopify.com",
    );
    expect(hasApiAuth).toBe(true);
    const cookies: string[] = [];
    headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") cookies.push(value);
    });
    const joined = cookies.join("\n");
    expect(joined).toContain("lgs_shop=");
    expect(joined).toContain("lgs_test_token=");
    expect(joined).toContain("SameSite=Lax");
  });
});

describe("tablet workspace 768–900", () => {
  it("defines a tablet band distinct from phone 767 and desktop 900+", () => {
    expect(GS_EDITOR_TOKENS.breakpoint.tabletMin).toBe("768px");
    expect(GS_EDITOR_TOKENS.breakpoint.tabletMax).toBe("900px");
    expect(GS_EDITOR_TOKENS.breakpoint.phone).toBe("767px");
    expect(GANG_SHEET_EDITOR_CSS).toContain("@media(min-width:768px) and (max-width:900px)");
    expect(GANG_SHEET_EDITOR_CSS).toContain("@media(max-width:767px)");
    expect(GANG_SHEET_EDITOR_CSS).toContain("nav.mobile-bar{display:none}");
  });
});

describe("visual remnants", () => {
  it("does not use orange --accent fallback on Auto Build upload", () => {
    expect(PRODUCTION_WORKFLOW_CSS).not.toContain("#f97316");
    expect(PRODUCTION_WORKFLOW_CSS).toContain(".prod-wf-btn-upload{background:var(--gs-accent");
  });
});

describe("production review with a real non-empty placement", () => {
  it("still blocks save on an empty sheet", () => {
    expect(ROUTE_SRC).toContain("if (!items.length)");
    expect(ROUTE_SRC).toContain("Add artwork before saving.");
    expect(ROUTE_SRC).toContain('disabled={saving || !items.length}');
    const empty = buildProductionReview({
      sheetWidthIn: 22.5,
      sheetHeightIn: 24,
      quantity: 1,
      artworkCount: 0,
      missingArtworkCount: 0,
      overlapCount: 0,
      oobCount: 0,
      lowDpiCount: 0,
    });
    expect(empty.canExport).toBe(false);
    expect(empty.blocking[0]?.id).toBe("empty-sheet");
  });

  it("reports ready for a valid in-bounds placement with sufficient print DPI", () => {
    const item = {
      id: "piece-1",
      name: "mascot.png",
      assetId: "asset_real_1",
      kind: "image" as const,
      widthPx: 900,
      heightPx: 900,
      widthIn: 3,
      heightIn: 3,
      dpi: 72,
    };
    const quality = artworkPrintQuality(item);
    expect(quality?.printDpi).toBe(300);
    expect(quality?.info.tier).toBe("excellent");
    expect(countMissingArtwork([item])).toBe(0);
    const review = buildProductionReview({
      sheetWidthIn: 22.5,
      sheetHeightIn: 18,
      quantity: 1,
      artworkCount: 1,
      missingArtworkCount: 0,
      overlapCount: 0,
      oobCount: 0,
      lowDpiCount: quality?.warn ? 1 : 0,
    });
    expect(review.readiness).toBe("ready");
    expect(review.canExport).toBe(true);
  });
});
