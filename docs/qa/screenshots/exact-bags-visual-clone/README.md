# Exact BAGS Visual Clone — Screenshot Evidence

Branch: `sprint/exact-bags-parity`

## Folders

| Folder | Contents |
|--------|----------|
| `bags/` | Reference captures from live BAGS (manual — see blocker below) |
| `legends-before/` | Pre-fix Legends captures (optional archive) |
| `legends-after/` | Post-fix Legends captures from local dev |
| `side-by-side/` | Paired comparisons at identical viewport dimensions |

## Viewports

- `desktop-1440` — 1440×1000
- `laptop-1280` — 1280×720
- `tablet-1024` — 1024×768
- `tablet-portrait-768` — 768×1024
- `mobile-390` — 390×844

## States

`empty-editor`, `uploads`, `thumbnail`, `four-copy-sheet`, `selected-artwork`, `image-properties`, `selection-toolbar`, `enhance-modal`, `halftone-modal`, `crop-modal`, `colors-modal`, `names-numbers`, `settings`, `auto-build`, `auto-nest`, `active-gang-sheets`, `mobile-editor`

## BAGS reference blocker

Live BAGS editor requires an authenticated merchant/customer session. Automated capture from CI was not available in this sprint. Place reference PNGs under `bags/{viewport}/{state}.png` when captured manually from production BAGS.

## Capture Legends

```bash
npm run dev
node scripts/capture-visual-clone-screenshots.mjs --capture
```

## Comparison page

Open `docs/qa/visual-clone-comparison.html` in a browser (serve repo root or open file directly).
