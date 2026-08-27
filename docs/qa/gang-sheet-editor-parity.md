# Gang Sheet Editor Parity — BAGS vs Legends

Reference: **Build a Gang Sheet** live customer editor (workflow baseline).  
Legends target: **Legends BAGS Dev** — `legends-bags-in2lwdll.myshopify.com` via app proxy `/apps/legends-bags/builder?type=gang_sheet`.

Screenshots for QA live under `docs/qa/screenshots/gang-sheet-editor/` (capture at identical viewports before claiming parity).

## Viewport baseline

| Viewport | Use |
|----------|-----|
| 1440 × 1000 | Desktop primary |
| 1280 × 800 | Laptop |
| 390 × 844 | Mobile (iPhone 14 class) |

## Shell & layout

| Region | BAGS baseline | Legends (`gs-editor-v2`) | Match | Legends improvement |
|--------|---------------|--------------------------|-------|------------------------|
| Top command bar | Brand, name, size, price, undo/redo, zoom, save/cart | `GangSheetCommandBar` — light bar, grouped controls, SVG icons | In progress | Editable design name inline; clearer price pill; overflow menu for secondary actions |
| Left tool rail | Icon + label, 8 tools | Dark rail, SVG icons, badge on Uploads | In progress | Templates tab in rail; keyboard focus rings |
| Context panel | ~260px, scrollable | `--gs-panel-w: 300px`, panel lead copy | In progress | Larger upload thumbnails; panel descriptions |
| Canvas workspace | Centered sheet, rulers, grid | Neutral `#d8dde4` workspace, rulers, snap guides | Functional | Refined sheet shadow via tokens |
| Properties panel | Right, on selection | Right `properties` panel | Functional | Collapsible sections (existing) |
| Mobile | Bottom nav + drawers | Bottom bar + slide-in panels | In progress | Save opens same polished dialog |

## Welcome Center

| Item | BAGS | Legends | Status |
|------|------|---------|--------|
| Start Gang Sheet | Primary card | Build a Gang Sheet card | Done |
| Auto Build | Dedicated flow | Auto Build card → `auto_build` screen | Done |
| Upload by Size | Separate product | Link to UBS editor | Done |
| Continue draft | Local draft | Continue draft card | Done |
| Saved designs | Library list | Open saved design + library in welcome | Done |
| Templates | Template picker | Templates card + sidebar Templates tab | Done |
| Sheet presets + price | On welcome | Width/length selects | Done |

## Sidebar panels

| Panel | BAGS workflow | Legends | Status |
|-------|---------------|---------|--------|
| Uploads | Drop, browse, grid, DPI | Drop zone, search, sort, rename, delete, drag/click place | Functional |
| Gallery | Categories, search, grid | Categories chips, search, grid | Functional |
| Text | Font, size, color, add | Textarea, font, presets, add | Functional |
| Names & Numbers | CSV/roster | CSV paste, generate | Functional |
| Auto Build | Full-screen flow | Rail opens `auto_build` screen | Done |
| Layers | Reorder, visibility | List sync with selection | Functional |
| Templates | — | Sheet preset cards in panel | Added |
| Help | Shortcuts | Shortcut list + snap toggle | Functional |

## Canvas & selection

| Feature | BAGS | Legends | Status |
|---------|------|---------|--------|
| Zoom / pan | Toolbar + scroll | Command bar zoom + space-pan | Done |
| Resize / rotate handles | Corner handles | 12px handles | Functional |
| Multi-select | Shift + marquee | Shift + marquee | Functional |
| Overlap / OOB warnings | Toasts | Toasts + save dialog warnings | Improved |
| Snap guides | Grid/edge | `snap.ts` guides | Functional |

## Save experience

| Feature | BAGS | Legends | Status |
|---------|------|---------|--------|
| Save dialog | Preview, warnings, cart | `GangSheetSaveDialog` | Added |
| Save only vs cart | Separate actions | Dialog: Save only / Save & Add to Cart | Added |
| Failure recovery | Retry message | Error in dialog + header toast | Added |
| Double-submit guard | Disabled while saving | `saving` disables actions | Done |

## Storefront launcher

| Item | Status |
|------|--------|
| App proxy `/apps/legends-bags/` | Done (commerce sprint) |
| No tunnel URL in theme blocks | Done |
| Same-tab fallback on popup block | Verify on dev storefront |
| Both theme blocks (GS + UBS) | Verify on dev storefront |

## Screenshot checklist (Legends)

Capture at each viewport and compare side-by-side with BAGS:

- [ ] Welcome Center
- [ ] Empty canvas
- [ ] Canvas with five pieces
- [ ] Uploads panel
- [ ] Gallery
- [ ] Text
- [ ] Names & Numbers
- [ ] Auto Build
- [ ] Layers
- [ ] Templates
- [ ] Selected-artwork properties
- [ ] Save dialog
- [ ] Tall sheet
- [ ] Mobile canvas
- [ ] Mobile panel (bottom sheet)

## Remaining gaps (honest)

- Full BAGS pixel parity not verified without paired screenshots at identical sizes
- Font picker without live preview thumbnails (text panel)
- Names & Numbers column mapping UI (CSV paste only)
- Auto Build visual nest preview polish vs BAGS
- Minimap for very tall sheets
- Pinch-zoom on mobile (scroll zoom only)
- Custom font upload (system fonts only)

## Test commands

```bash
npm run test
npm run typecheck
npm run build
shopify theme check   # from theme extension directory if applicable
node scripts/gang-sheet-editor-screenshots.mjs   # when dev server running
```
