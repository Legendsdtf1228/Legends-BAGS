/** Pure helpers for Auto Build, Auto Fill, Names & Numbers, and Images by Size UI. */

export {
  FILL_MAX_COPIES,
  FILL_ORIGIN_IN,
  commitAutoFill,
  occupiedForAutoFill,
  planFillSheetCopies,
  type FillCopy,
  type FillOccupied,
  type FillPlan,
} from "./auto-fill-placement";

export const ROSTER_ORIGIN_IN = 0.2;
export const SIZE_PRESET_INCHES = [2, 3, 4, 5, 6, 8, 10, 12] as const;
export const WORKFLOW_SIZE_PRESETS = SIZE_PRESET_INCHES;

export type WorkflowPhase = "setup" | "review";

export type RequestedVsPlaced = {
  requested: number;
  placed: number;
  remaining: number;
  tone: "ok" | "warn" | "error";
  headline: string;
  detail: string;
};

export type ProductionAlert = {
  title: string;
  body: string;
};

export type RosterRow = {
  name: string;
  number: string;
};

export type RosterPlacement = {
  label: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  onSheet: boolean;
};

export function parseRosterCsv(csv: string): RosterRow[] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      return { name: parts[0] ?? "", number: parts[1] ?? "" };
    })
    .filter((r) => r.name || r.number);
}

export function findDuplicateRosterNumbers(rows: RosterRow[]): string[] {
  return [
    ...new Set(
      rows
        .filter((r, i) => rows.findIndex((x) => x.number && x.number === r.number) !== i)
        .map((r) => r.number)
        .filter(Boolean),
    ),
  ];
}

/**
 * Names & Numbers row stack — same origin and stride as generateRoster.
 * Off-sheet rows are still returned (the generator still places them).
 */
export function planRosterPlacements(input: {
  rows: RosterRow[];
  sheetWidth: number;
  sheetHeight: number;
  gap: number;
  widthIn: number;
  heightIn: number;
}): {
  placements: RosterPlacement[];
  requested: number;
  onSheet: number;
  offSheet: number;
} {
  const widthIn = Math.min(input.widthIn, Math.max(0.1, input.sheetWidth - 0.4));
  const heightIn = Math.max(0.1, input.heightIn);
  const placements = input.rows.map((row, idx) => {
    const label = `${row.name}${row.number ? ` #${row.number}` : ""}`.trim();
    const xIn = ROSTER_ORIGIN_IN;
    const yIn = ROSTER_ORIGIN_IN + idx * (heightIn + input.gap);
    const onSheet = xIn + widthIn <= input.sheetWidth && yIn + heightIn <= input.sheetHeight;
    return { label, xIn, yIn, widthIn, heightIn, onSheet };
  });
  return {
    placements,
    requested: input.rows.length,
    onSheet: placements.filter((p) => p.onSheet).length,
    offSheet: placements.filter((p) => !p.onSheet).length,
  };
}

export function summarizeRequestedVsPlaced(
  requested: number,
  placed: number,
  unit = "copies",
): RequestedVsPlaced {
  const remaining = Math.max(0, requested - placed);
  if (requested <= 0 && placed <= 0) {
    return {
      requested,
      placed,
      remaining,
      tone: "error",
      headline: "Nothing to place",
      detail: "Add artwork and a quantity, then Apply again.",
    };
  }
  if (placed <= 0) {
    return {
      requested,
      placed,
      remaining,
      tone: "error",
      headline: `0 of ${requested} ${unit} placed`,
      detail: "Nothing fit on this sheet. Reduce size or quantity, or pick a longer sheet, then Apply again.",
    };
  }
  if (remaining > 0) {
    return {
      requested,
      placed,
      remaining,
      tone: "warn",
      headline: `${placed} of ${requested} ${unit} placed`,
      detail: `${remaining} ${unit} did not fit. Reduce size/quantity or increase sheet length, then Apply again.`,
    };
  }
  return {
    requested,
    placed,
    remaining: 0,
    tone: "ok",
    headline: `${placed} of ${requested} ${unit} placed`,
    detail: "Requested quantity is on the sheet.",
  };
}

export function productionAlert(
  raw: string,
  context: "auto-build" | "auto-fill" | "names" | "images-by-size",
): ProductionAlert {
  const text = raw.trim();
  const lower = text.toLowerCase();

  if (context === "auto-build") {
    if (lower.includes("at least one") || lower.includes("no artwork") || lower.includes("waiting")) {
      return {
        title: "No artwork to build",
        body: "Upload a PNG or JPEG, set width × height and quantity, then Apply.",
      };
    }
    if (lower.includes("nest") || lower.includes("preview") || lower.includes("fit")) {
      return {
        title: "Could not nest these copies",
        body: "Reduce quantity, shrink width × height, or pick a longer sheet, then Apply again.",
      };
    }
    if (lower.includes("increase max") || lower.includes("length")) {
      return {
        title: "Sheet is too short",
        body: text,
      };
    }
  }

  if (context === "auto-fill") {
    if (lower.includes("select")) {
      return {
        title: "Select artwork first",
        body: "Click a design on the sheet, then open Auto Fill.",
      };
    }
    if (lower.includes("nothing") || lower.includes("fit")) {
      return {
        title: "Nothing fits on this sheet",
        body: "Reduce width × height or increase sheet length, then Apply again.",
      };
    }
  }

  if (context === "names") {
    if (lower.includes("duplicate")) {
      return {
        title: "Duplicate numbers in roster",
        body: `${text} Fix the roster, then Apply again.`,
      };
    }
    if (lower.includes("add roster") || lower.includes("row")) {
      return {
        title: "Roster is empty",
        body: "Paste one player per line (Name, Number), set plate size, then Apply.",
      };
    }
  }

  if (context === "images-by-size") {
    if (lower.includes("empty") || lower.includes("at least one")) {
      return {
        title: "No images in this order",
        body: "Upload a PNG or JPEG, set size and quantity, then Add to cart.",
      };
    }
    if (lower.includes("quote")) {
      return {
        title: "Could not price these sizes",
        body: "Check width, height, and quantity, then try again.",
      };
    }
    if (lower.includes("upload")) {
      return {
        title: "Upload failed",
        body: "Use PNG or JPEG and try again. Transparent PNG is recommended for DTF.",
      };
    }
    if (lower.includes("save") || lower.includes("design")) {
      return {
        title: "Could not save this order",
        body: "Check sizes and quantities, then try Add to cart again.",
      };
    }
  }

  return {
    title: text || "Something went wrong",
    body: "Fix the highlighted fields, then Apply again.",
  };
}

export function defaultRosterPlate(sheetWidth: number, fontSize: number) {
  return {
    widthIn: Math.min(6, Math.max(0.1, sheetWidth - 0.4)),
    heightIn: Math.max(0.4, fontSize / 72),
  };
}

export function roundIn(value: number) {
  return Math.round(value * 100) / 100;
}
