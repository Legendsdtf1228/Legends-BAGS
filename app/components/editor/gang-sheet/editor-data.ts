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

export const HELP_SHORTCUTS = [
  { keys: "Arrow keys", action: "Nudge selected piece" },
  { keys: "Shift + Arrow", action: "Nudge by 0.25″" },
  { keys: "Delete", action: "Remove selected" },
  { keys: "Ctrl+D", action: "Duplicate selected" },
  { keys: "Ctrl+Z / Ctrl+Y", action: "Undo / Redo" },
  { keys: "Escape", action: "Close dialogs / deselect" },
  { keys: "Space + drag", action: "Pan canvas" },
] as const;
