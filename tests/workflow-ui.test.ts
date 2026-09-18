import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRODUCTION_WORKFLOW_CSS } from "../app/components/editor/workflow/workflow-styles";
import {
  FILL_MAX_COPIES,
  FILL_ORIGIN_IN,
  defaultRosterPlate,
  findDuplicateRosterNumbers,
  parseRosterCsv,
  planFillSheetCopies,
  planRosterPlacements,
  productionAlert,
  summarizeRequestedVsPlaced,
} from "../app/components/editor/workflow/workflow-helpers";

describe("planFillSheetCopies", () => {
  it("uses the same left-to-right, top-to-bottom scan as Fill sheet", () => {
    const plan = planFillSheetCopies({
      widthIn: 3,
      heightIn: 3,
      sheetWidth: 10,
      sheetHeight: 10,
      gap: 0.15,
    });
    expect(plan.copies[0]).toEqual({ xIn: FILL_ORIGIN_IN, yIn: FILL_ORIGIN_IN });
    expect(plan.copies[1].xIn).toBeCloseTo(3.25);
    expect(plan.copies[1].yIn).toBe(FILL_ORIGIN_IN);
    expect(plan.capacity).toBe(9);
    expect(plan.placed).toBe(9);
    expect(plan.remaining).toBe(0);
  });

  it("caps copies at requested without changing cell geometry", () => {
    const full = planFillSheetCopies({
      widthIn: 2,
      heightIn: 2,
      sheetWidth: 22.5,
      sheetHeight: 24,
      gap: 0.15,
    });
    const limited = planFillSheetCopies({
      widthIn: 2,
      heightIn: 2,
      sheetWidth: 22.5,
      sheetHeight: 24,
      gap: 0.15,
      requested: 5,
    });
    expect(limited.copies).toEqual(full.copies.slice(0, 5));
    expect(limited.placed).toBe(5);
    expect(limited.remaining).toBe(0);
    expect(limited.capacity).toBe(full.capacity);
  });

  it("reports remaining when requested exceeds what fits", () => {
    const plan = planFillSheetCopies({
      widthIn: 8,
      heightIn: 8,
      sheetWidth: 22.5,
      sheetHeight: 24,
      gap: 0.15,
      requested: 20,
    });
    expect(plan.placed).toBe(plan.capacity);
    expect(plan.remaining).toBe(20 - plan.capacity);
    expect(plan.placed).toBeGreaterThan(0);
    expect(plan.placed).toBeLessThanOrEqual(FILL_MAX_COPIES);
  });
});

describe("names & numbers roster", () => {
  it("parses CSV and tab rows", () => {
    expect(parseRosterCsv("Smith, 12\nJones\t7\n\n")).toEqual([
      { name: "Smith", number: "12" },
      { name: "Jones", number: "7" },
    ]);
  });

  it("finds duplicate numbers", () => {
    expect(
      findDuplicateRosterNumbers([
        { name: "A", number: "12" },
        { name: "B", number: "7" },
        { name: "C", number: "12" },
      ]),
    ).toEqual(["12"]);
  });

  it("stacks plates with the original origin and stride", () => {
    const plan = planRosterPlacements({
      rows: [
        { name: "Smith", number: "12" },
        { name: "Jones", number: "7" },
      ],
      sheetWidth: 22.5,
      sheetHeight: 24,
      gap: 0.15,
      widthIn: 6,
      heightIn: 0.5,
    });
    expect(plan.placements[0]).toMatchObject({
      label: "Smith #12",
      xIn: 0.2,
      yIn: 0.2,
      widthIn: 6,
      heightIn: 0.5,
      onSheet: true,
    });
    expect(plan.placements[1].yIn).toBeCloseTo(0.85);
    expect(plan.requested).toBe(2);
    expect(plan.onSheet).toBe(2);
  });

  it("keeps off-sheet rows in the plan (generator still places them)", () => {
    const plan = planRosterPlacements({
      rows: [
        { name: "A", number: "1" },
        { name: "B", number: "2" },
        { name: "C", number: "3" },
      ],
      sheetWidth: 10,
      sheetHeight: 1,
      gap: 0.15,
      widthIn: 6,
      heightIn: 0.5,
    });
    expect(plan.requested).toBe(3);
    expect(plan.placements).toHaveLength(3);
    expect(plan.offSheet).toBeGreaterThan(0);
  });

  it("defaults plate size the same way as the old generator", () => {
    expect(defaultRosterPlate(22.5, 24)).toEqual({
      widthIn: 6,
      heightIn: Math.max(0.4, 24 / 72),
    });
  });
});

describe("requested vs placed + production errors", () => {
  it("marks a shortfall as warn and a full place as ok", () => {
    const short = summarizeRequestedVsPlaced(12, 10);
    expect(short.tone).toBe("warn");
    expect(short.headline).toContain("10 of 12");
    expect(short.remaining).toBe(2);
    const ok = summarizeRequestedVsPlaced(4, 4);
    expect(ok.tone).toBe("ok");
    expect(ok.remaining).toBe(0);
  });

  it("uses production language for nest and roster failures", () => {
    expect(productionAlert("Could not generate nest preview", "auto-build").title).toMatch(/nest/i);
    expect(productionAlert("Upload at least one design for Auto Build", "auto-build").body).toMatch(
      /PNG or JPEG/i,
    );
    expect(productionAlert("Duplicate numbers found: 12", "names").body).toMatch(/Fix the roster/);
    expect(productionAlert("Quote failed", "images-by-size").title).toMatch(/price/i);
  });
});

describe("production workflow chrome", () => {
  it("ships shared tally, lock, and primary action styles", () => {
    expect(PRODUCTION_WORKFLOW_CSS).toContain(".prod-wf-tally");
    expect(PRODUCTION_WORKFLOW_CSS).toContain(".prod-wf-lock");
    expect(PRODUCTION_WORKFLOW_CSS).toContain(".prod-wf-btn-primary");
    expect(PRODUCTION_WORKFLOW_CSS).toContain(".prod-wf-progress");
    expect(PRODUCTION_WORKFLOW_CSS).not.toContain("purple");
  });

  it("keeps existing Auto Build and Fill sheet labels", () => {
    const gang = readFileSync("app/routes/editor.gang-sheet.tsx", "utf8");
    const autoBuild = readFileSync("app/components/editor/workflow/auto-build-screen.tsx", "utf8");
    const inspector = readFileSync("app/components/editor/gang-sheet/artwork-inspector.tsx", "utf8");
    expect(inspector).toContain('aria-label="Fill sheet with copies"');
    expect(gang).toContain('aria-label="Roster CSV"');
    expect(gang).toContain("AutoBuildScreen");
    expect(gang).toContain("AutoFillScreen");
    expect(gang).toContain("NamesNumbersScreen");
    expect(autoBuild).toContain('aria-label="Undo auto nest result"');
    expect(autoBuild).toContain('aria-label="Accept nest and continue to editor"');
    expect(autoBuild).toContain('aria-label="Regenerate nest preview"');
  });
});
