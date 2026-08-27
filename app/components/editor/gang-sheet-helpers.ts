/** Pure helpers for the gang-sheet customer editor. */

export const ARTBOARD_MARGIN_IN = 0.1;
export const NUDGE_IN = 0.05;
export const NUDGE_SHIFT_IN = 0.25;
export const DRAFT_VERSION = 1 as const;

export type RectIn = {
  id: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
};

export type DraftItemV1 = {
  assetId: string;
  name: string;
  widthPx: number;
  heightPx: number;
  dpi?: number | null;
  contentType: string;
  widthIn: number;
  heightIn: number;
  xIn: number;
  yIn: number;
  rotationDeg: 0 | 90;
  zIndex: number;
  kind?: "image" | "text";
  textContent?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  lockAspect?: boolean;
  lockPosition?: boolean;
};

export type GangDraftV1 = {
  v: typeof DRAFT_VERSION;
  sheetWidth: number;
  sheetHeight: number;
  gap: number;
  items: DraftItemV1[];
  savedAt: number;
};

export function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

export function round(v: number) {
  return Math.round(v * 100) / 100;
}

export function inside<T extends RectIn & { widthIn: number; heightIn: number }>(
  i: T,
  w: number,
  h: number,
): T {
  const iw = clamp(i.widthIn, 0.1, w);
  const ih = clamp(i.heightIn, 0.1, h);
  return {
    ...i,
    widthIn: iw,
    heightIn: ih,
    xIn: clamp(i.xIn, 0, w - iw),
    yIn: clamp(i.yIn, 0, h - ih),
  };
}

export function aabbOverlap(a: RectIn, b: RectIn, eps = 1e-6): boolean {
  return !(
    a.xIn + a.widthIn <= b.xIn + eps ||
    b.xIn + b.widthIn <= a.xIn + eps ||
    a.yIn + a.heightIn <= b.yIn + eps ||
    b.yIn + b.heightIn <= a.yIn + eps
  );
}

/** True when piece violates the 0.1 in artboard margin or sits outside the sheet. */
export function isArtboardViolation(
  i: RectIn,
  sheetW: number,
  sheetH: number,
  margin = ARTBOARD_MARGIN_IN,
  eps = 1e-4,
): boolean {
  if (i.xIn < -eps || i.yIn < -eps) return true;
  if (i.xIn + i.widthIn > sheetW + eps || i.yIn + i.heightIn > sheetH + eps) return true;
  if (i.xIn < margin - eps || i.yIn < margin - eps) return true;
  if (i.xIn + i.widthIn > sheetW - margin + eps) return true;
  if (i.yIn + i.heightIn > sheetH - margin + eps) return true;
  return false;
}

export function findOverlappingIds(items: RectIn[]): Set<string> {
  const ids = new Set<string>();
  for (let a = 0; a < items.length; a++) {
    for (let b = a + 1; b < items.length; b++) {
      if (aabbOverlap(items[a], items[b])) {
        ids.add(items[a].id);
        ids.add(items[b].id);
      }
    }
  }
  return ids;
}

export function findOobIds(
  items: RectIn[],
  sheetW: number,
  sheetH: number,
): Set<string> {
  const ids = new Set<string>();
  for (const i of items) {
    if (isArtboardViolation(i, sheetW, sheetH)) ids.add(i.id);
  }
  return ids;
}

export function draftStorageKey(shop: string) {
  return `lgs_gang_draft_${shop || "default"}`;
}

export function readDraft(shop: string): GangDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftStorageKey(shop));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GangDraftV1;
    if (parsed?.v !== DRAFT_VERSION || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDraft(shop: string, draft: GangDraftV1) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(draftStorageKey(shop), JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function clearDraft(shop: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftStorageKey(shop));
  } catch {
    /* ignore */
  }
}

export function nextZIndex(items: { zIndex: number }[]): number {
  if (!items.length) return 1;
  return items.reduce((m, i) => Math.max(m, i.zIndex), 0) + 1;
}

export function sortByZIndex<T extends { zIndex: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.zIndex - b.zIndex || 0);
}

export function reorderLayer<T extends { id: string; zIndex: number }>(
  items: T[],
  selectedId: string,
  mode: "forward" | "backward" | "front" | "back",
): T[] | null {
  const sorted = sortByZIndex(items);
  const idx = sorted.findIndex((i) => i.id === selectedId);
  if (idx < 0) return null;

  if (mode === "forward") {
    if (idx >= sorted.length - 1) return null;
    const a = sorted[idx];
    const b = sorted[idx + 1];
    return items.map((i) => {
      if (i.id === a.id) return { ...i, zIndex: b.zIndex };
      if (i.id === b.id) return { ...i, zIndex: a.zIndex };
      return i;
    });
  }

  if (mode === "backward") {
    if (idx <= 0) return null;
    const a = sorted[idx];
    const b = sorted[idx - 1];
    return items.map((i) => {
      if (i.id === a.id) return { ...i, zIndex: b.zIndex };
      if (i.id === b.id) return { ...i, zIndex: a.zIndex };
      return i;
    });
  }

  if (mode === "front") {
    const max = sorted[sorted.length - 1].zIndex;
    if (sorted[idx].zIndex >= max && idx === sorted.length - 1) return null;
    return items.map((i) =>
      i.id === selectedId ? { ...i, zIndex: max + 1 } : i,
    );
  }

  // back
  const min = sorted[0].zIndex;
  if (sorted[idx].zIndex <= min && idx === 0) return null;
  return items.map((i) =>
    i.id === selectedId ? { ...i, zIndex: min - 1 } : i,
  );
}

/** Compute zoom % so the sheet fits inside a scroll viewport with padding. */
export function fitZoomPercent(
  viewportW: number,
  viewportH: number,
  sheetW: number,
  sheetH: number,
  paddingPx = 48,
): number {
  const availW = Math.max(80, viewportW - paddingPx * 2);
  const availH = Math.max(80, viewportH - paddingPx * 2);
  const aspect = sheetW / sheetH;
  const byWidth = availW;
  const byHeight = availH * aspect;
  const targetPx = Math.min(byWidth, byHeight);
  const pct = Math.floor((targetPx / Math.max(1, viewportW)) * 100);
  return clamp(pct, 20, 150);
}

export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
  return el.isContentEditable;
}

export function assetPreviewUrl(assetId: string) {
  return `/api/assets/${encodeURIComponent(assetId)}`;
}

export type SavedDesignV1 = {
  id: string;
  name: string;
  draft: GangDraftV1;
  savedAt: number;
};

function savedDesignsKey(shop: string) {
  return `lgs_saved_designs_${shop || "default"}`;
}

export function readSavedDesigns(shop: string): SavedDesignV1[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(savedDesignsKey(shop));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedDesignV1[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSavedDesigns(shop: string, designs: SavedDesignV1[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(savedDesignsKey(shop), JSON.stringify(designs.slice(0, 50)));
  } catch {
    /* quota */
  }
}

export function addSavedDesign(shop: string, name: string, draft: GangDraftV1): SavedDesignV1 {
  const entry: SavedDesignV1 = {
    id: crypto.randomUUID(),
    name,
    draft,
    savedAt: Date.now(),
  };
  const next = [entry, ...readSavedDesigns(shop).filter((d) => d.name !== name)].slice(0, 50);
  writeSavedDesigns(shop, next);
  return entry;
}

export type AlignMode = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";

export function alignSelected<T extends RectIn>(
  items: T[],
  ids: Set<string>,
  mode: AlignMode,
  sheetW: number,
  sheetH: number,
): T[] {
  if (!ids.size) return items;
  const sel = items.filter((i) => ids.has(i.id));
  if (!sel.length) return items;
  const minX = Math.min(...sel.map((i) => i.xIn));
  const maxX = Math.max(...sel.map((i) => i.xIn + i.widthIn));
  const minY = Math.min(...sel.map((i) => i.yIn));
  const maxY = Math.max(...sel.map((i) => i.yIn + i.heightIn));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  return items.map((i) => {
    if (!ids.has(i.id)) return i;
    let x = i.xIn;
    let y = i.yIn;
    if (mode === "left") x = minX;
    else if (mode === "right") x = maxX - i.widthIn;
    else if (mode === "center-h") x = midX - i.widthIn / 2;
    else if (mode === "top") y = minY;
    else if (mode === "bottom") y = maxY - i.heightIn;
    else if (mode === "center-v") y = midY - i.heightIn / 2;
    return inside({ ...i, xIn: x, yIn: y }, sheetW, sheetH);
  });
}

export function distributeSelected<T extends RectIn>(
  items: T[],
  ids: Set<string>,
  axis: "horizontal" | "vertical",
  sheetW: number,
  sheetH: number,
): T[] {
  const sel = items.filter((i) => ids.has(i.id));
  if (sel.length < 3) return items;
  const sorted =
    axis === "horizontal"
      ? [...sel].sort((a, b) => a.xIn - b.xIn)
      : [...sel].sort((a, b) => a.yIn - b.yIn);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span =
    axis === "horizontal"
      ? last.xIn + last.widthIn - first.xIn
      : last.yIn + last.heightIn - first.yIn;
  const totalSize = sorted.reduce(
    (s, i) => s + (axis === "horizontal" ? i.widthIn : i.heightIn),
    0,
  );
  const gap = (span - totalSize) / (sorted.length - 1);
  let cursor = axis === "horizontal" ? first.xIn : first.yIn;
  const pos = new Map<string, { xIn: number; yIn: number }>();
  for (const i of sorted) {
    pos.set(i.id, { xIn: axis === "horizontal" ? cursor : i.xIn, yIn: axis === "vertical" ? cursor : i.yIn });
    cursor += (axis === "horizontal" ? i.widthIn : i.heightIn) + gap;
  }
  return items.map((i) => {
    const p = pos.get(i.id);
    return p ? inside({ ...i, ...p }, sheetW, sheetH) : i;
  });
}
