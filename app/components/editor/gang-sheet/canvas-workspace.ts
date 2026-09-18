/** Pure helpers for canvas workspace chrome. Selection/transform behavior stays in the editor. */

export type SheetTabItem = {
  id: string;
  label: string;
  title: string;
  widthIn: number;
  heightIn: number;
};

export type SheetTabSource = {
  id: string;
  name: string;
  widthIn: number;
  heightIn: number;
};

export type CanvasRect = {
  id: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
};

export type SelectionBounds = {
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
};

/** Integer inch labels — same generation the canvas rulers already used. */
export function rulerLabels(lengthIn: number, maxLabels = Number.POSITIVE_INFINITY): number[] {
  return Array.from({ length: Math.min(Math.ceil(lengthIn) + 1, maxLabels) }, (_, i) => i);
}

export function sheetTabItems(
  templates: readonly SheetTabSource[],
  widthIn: number,
  heightIn: number,
): SheetTabItem[] {
  const tabs: SheetTabItem[] = templates.map((t) => ({
    id: t.id,
    label: `${t.widthIn} × ${t.heightIn}`,
    title: t.name,
    widthIn: t.widthIn,
    heightIn: t.heightIn,
  }));
  const matched = tabs.some((t) => t.widthIn === widthIn && t.heightIn === heightIn);
  if (!matched) {
    tabs.push({
      id: "current",
      label: `${widthIn} × ${heightIn}`,
      title: "Current sheet",
      widthIn,
      heightIn,
    });
  }
  return tabs;
}

export function isActiveSheetTab(tab: SheetTabItem, widthIn: number, heightIn: number): boolean {
  return tab.widthIn === widthIn && tab.heightIn === heightIn;
}

/** Union bounds for multi-select chrome only (no hit-testing). */
export function selectionBounds(
  items: readonly CanvasRect[],
  selectedIds: Iterable<string>,
): SelectionBounds | null {
  const ids = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  const selected = items.filter((i) => ids.has(i.id));
  if (selected.length < 2) return null;
  const left = Math.min(...selected.map((i) => i.xIn));
  const top = Math.min(...selected.map((i) => i.yIn));
  const right = Math.max(...selected.map((i) => i.xIn + i.widthIn));
  const bottom = Math.max(...selected.map((i) => i.yIn + i.heightIn));
  return {
    xIn: left,
    yIn: top,
    widthIn: right - left,
    heightIn: bottom - top,
  };
}

export function pieceCountLabel(count: number): string {
  return `${count} piece${count === 1 ? "" : "s"}`;
}

export function selectedCountLabel(count: number): string | null {
  if (count < 2) return null;
  return `${count} selected`;
}
