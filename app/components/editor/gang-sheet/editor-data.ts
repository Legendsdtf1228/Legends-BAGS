/** Dev gallery + template seed data (merchant CMS replaces in production). */

export type GalleryItem = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  /** SVG data URL or placeholder color block for dev */
  thumb: string;
  widthIn: number;
  heightIn: number;
};

export type SheetTemplate = {
  id: string;
  name: string;
  description: string;
  widthIn: number;
  heightIn: number;
  category: string;
};

export const GALLERY_CATEGORIES = [
  "All",
  "Sports",
  "Mascots",
  "Numbers",
  "Seasonal",
] as const;

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g-ball",
    name: "Basketball",
    category: "Sports",
    tags: ["ball", "sports"],
    thumb: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#f97316"/><path d="M32 4v56M4 32h56" stroke="#7c2d12" stroke-width="2"/></svg>'),
    widthIn: 3,
    heightIn: 3,
  },
  {
    id: "g-star",
    name: "Star badge",
    category: "Mascots",
    tags: ["star", "badge"],
    thumb: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,4 39,24 60,24 43,38 49,58 32,46 15,58 21,38 4,24 25,24" fill="#ffd45e"/></svg>'),
    widthIn: 2.5,
    heightIn: 2.5,
  },
  {
    id: "g-num-00",
    name: "Number 00",
    category: "Numbers",
    tags: ["00", "jersey"],
    thumb: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 48"><text x="8" y="38" font-size="36" font-family="Arial Black" fill="#111">00</text></svg>'),
    widthIn: 4,
    heightIn: 2.5,
  },
  {
    id: "g-snow",
    name: "Snowflake",
    category: "Seasonal",
    tags: ["winter", "holiday"],
    thumb: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="#38bdf8" stroke-width="3"><path d="M32 4v56M4 32h56M10 10l44 44M54 10L10 54"/></g></svg>'),
    widthIn: 3,
    heightIn: 3,
  },
];

export const SHEET_TEMPLATES: SheetTemplate[] = [
  {
    id: "tpl-standard",
    name: "Standard DTF 22.5″",
    description: "22.5 × 24 in — most common gang sheet",
    widthIn: 22.5,
    heightIn: 24,
    category: "Popular",
  },
  {
    id: "tpl-long",
    name: "Long run 22.5″",
    description: "22.5 × 96 in — extended sheet",
    widthIn: 22.5,
    heightIn: 96,
    category: "Popular",
  },
  {
    id: "tpl-wide",
    name: "Wide 30″",
    description: "30 × 48 in — wide format",
    widthIn: 30,
    heightIn: 48,
    category: "Wide",
  },
];

export const FONT_OPTIONS = [
  { id: "arial", label: "Arial" },
  { id: "impact", label: "Impact" },
  { id: "georgia", label: "Georgia" },
] as const;

export const TEXT_STYLE_PRESETS = [
  { id: "headline", label: "Headline", fontSize: 48, color: "#111827" },
  { id: "name", label: "Player name", fontSize: 36, color: "#111827" },
  { id: "number", label: "Jersey number", fontSize: 72, color: "#ffffff" },
] as const;

/** BAGS names presets: ~1 / 1.5 / 2 in width. */
export const NAME_SIZE_PRESETS = [
  { id: "small", label: "Small (~1″)", fontSize: 22, widthIn: 1, strokeWidth: 0 },
  { id: "medium", label: "Medium (~1.5″)", fontSize: 28, widthIn: 1.5, strokeWidth: 1 },
  { id: "large", label: "Large (~2″)", fontSize: 36, widthIn: 2, strokeWidth: 2 },
] as const;

/** BAGS numbers presets: ~4 / 6 / 8 in width. */
export const NUMBER_SIZE_PRESETS = [
  { id: "small", label: "Small (~4″)", fontSize: 48, widthIn: 4, strokeWidth: 0 },
  { id: "medium", label: "Medium (~6″)", fontSize: 64, widthIn: 6, strokeWidth: 1 },
  { id: "large", label: "Large (~8″)", fontSize: 80, widthIn: 8, strokeWidth: 2 },
] as const;

export const NAMES_NUMBERS_SAMPLE_CSV = "name,number\nSmith,12\nJones,7\nLee,23\n";

export function validateNamesNumbersCsv(text: string, mode: "names" | "numbers"): { ok: boolean; lines: string[]; error?: string } {
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!rawLines.length) return { ok: false, lines: [], error: "CSV is empty." };
  const lines =
    rawLines[0]?.toLowerCase().startsWith("name") || rawLines[0]?.toLowerCase().includes("number")
      ? rawLines.slice(1)
      : rawLines;
  const parsed = lines
    .map((line) => {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      return mode === "names" ? (parts[0] ?? line) : parts.length > 1 ? parts[1] : parts[0];
    })
    .filter(Boolean);
  if (!parsed.length) return { ok: false, lines: [], error: "No valid entries found in CSV." };
  if (parsed.some((v) => v.length > 64)) {
    return { ok: false, lines: parsed, error: "Entries must be 64 characters or fewer." };
  }
  return { ok: true, lines: parsed };
}

export const NAMES_NUMBERS_PRESETS = [
  {
    id: "varsity",
    label: "Varsity",
    nameFont: "Impact",
    numberFont: "Impact",
    nameSize: 28,
    numberSize: 48,
    nameWidthIn: 5,
    numberWidthIn: 2,
    strokeWidth: 2,
    strokeColor: "#111827",
    textColor: "#ffffff",
  },
  {
    id: "classic",
    label: "Classic",
    nameFont: "Arial",
    numberFont: "Arial",
    nameSize: 24,
    numberSize: 36,
    nameWidthIn: 4.5,
    numberWidthIn: 1.75,
    strokeWidth: 0,
    strokeColor: "#111827",
    textColor: "#111827",
  },
  {
    id: "bold",
    label: "Bold back",
    nameFont: "Impact",
    numberFont: "Impact",
    nameSize: 32,
    numberSize: 64,
    nameWidthIn: 6,
    numberWidthIn: 2.5,
    strokeWidth: 3,
    strokeColor: "#000000",
    textColor: "#ffffff",
  },
] as const;

export const HELP_SHORTCUTS = [
  { keys: "Arrow keys", action: "Nudge selected piece" },
  { keys: "Shift + Arrow", action: "Nudge by 0.25″" },
  { keys: "Delete", action: "Remove selected" },
  { keys: "Ctrl+D", action: "Duplicate selected" },
  { keys: "Ctrl+Z / Ctrl+Y", action: "Undo / Redo" },
  { keys: "Escape", action: "Close dialogs / deselect" },
  { keys: "Space + drag", action: "Pan canvas" },
] as const;
