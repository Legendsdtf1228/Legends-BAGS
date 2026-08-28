# Exact BAGS Parity Matrix

Branch: `sprint/exact-bags-parity`  
Reference: **Build a Gang Sheet** (live production app)  
Dev store: `legends-bags-in2lwdll.myshopify.com`

Status key: **Exact** | **Equivalent** | **Partial** | **Missing** | **Intentionally Different**

## Part 1 — Storefront builder shell

| Control / region | BAGS | Legends | Status |
|------------------|------|---------|--------|
| Header qty stepper | Yes | `BagsGangSheetHeader` | Equivalent |
| Save & Add to Cart (blue) | Yes | Header primary | Equivalent |
| Save / Close | Yes | Header | Equivalent |
| Live USD price | Yes | Synced variant via app proxy | Equivalent |
| Customer account menu | Yes | Storefront session | Equivalent |
| Permanent left rail (desktop) | Yes | Home/Products/Uploads/Gallery/Canva/Dropbox/Settings | Equivalent |
| Uploads side panel | Yes | `BagsUploadsPanel` grid/list, progress, qty badges | Equivalent |
| Properties panel (desktop right) | Yes | Width/height/aspect/qty/margin/adjustments/FitCheck | Equivalent |
| Sheet size selector (22.5 widths) | Yes | Toolbar + domain constants | Exact |
| 22.5×24 never → 360 | Yes | `resolveGangSheetHeight()` | Exact |
| Undo/redo | Yes | Toolbar + selection bar + Ctrl+Z/Y | Equivalent |
| Pan / grid / Auto Nest | Yes | Toolbar + automation modal | Equivalent |
| Zoom + fit sheet | Yes | Toolbar | Exact |
| Rulers + scroll + artboard | Yes | Canvas | Equivalent |
| Selection toolbar | Yes | Align/distribute/layer/rotate/flip/stretch/undo | Equivalent |
| Quality legend + warnings | Yes | BAGS tiers Optimal/Good/Bad/Terrible/Minimum | Equivalent |

## Part 2 — Bottom navigation

| Item | BAGS | Legends | Status |
|------|------|---------|--------|
| Select | Yes | Bottom nav + Active Sheets drawer | Equivalent |
| Add Image | Yes | Modal (Recent/Uploads/Gallery/Canva) | Partial |
| Names & Numbers | Yes | Separate Add Names / Add Numbers + CSV | Equivalent |
| Settings | Yes | Drawer | Equivalent |
| Active sheet card + qty | Yes | Drawer | Equivalent |
| Previous designs picker | Yes | Welcome + design picker modal | Partial |

## Parts 3–8 — Modals & workflows

| Area | Status | Notes |
|------|--------|-------|
| Image Editor (Enhance/Halftone/Crop/Colors) | Equivalent | Browser preview; Apply commits to canvas |
| Add Image full parity (folders, bulk) | Partial | Modal shell; Canva/Dropbox disconnected honestly |
| Canva / Dropbox integrations | Missing | OAuth blocked — honest disconnected state |
| Text workflow | Partial | Sidebar text panel |
| Names & Numbers presets + CSV | Equivalent | S/M/L presets, sample CSV download, validation |
| Auto Fill / Nest / Build | Equivalent | Confirmation modals with fitted/remaining report |
| Save modal | Equivalent | `GangSheetSaveDialog` with BAGS DPI tiers |
| Confirmation / Print Anyway modal | Partial | Save warns on overlap/OOB/low DPI |
| Cart properties | Exact | Backend wired |

## Parts 9–12 — Admin & ops

| Area | Status | Notes |
|------|--------|-------|
| Admin nav terminology | Partial | Labels aligned; depth not full BAGS |
| General / Builder / Gallery settings depth | Partial | Forms exist |
| Orders / Designs / Shop Builder tables | Partial | |
| Build & Assign | Partial | |

## Part 13–15 — Visual & verification

| Requirement | Status |
|-------------|--------|
| BAGS white surface + blue/orange/red actions | Equivalent |
| No dark Legends rail in customer editor | Exact |
| Responsive 1440/1280/1024/768/390 | Partial — script + checklist |
| Side-by-side screenshot evidence | Partial — `scripts/capture-gang-sheet-screenshots.mjs` |
| E2E checkout + 300 DPI render | Partial — pipeline tests pass |

## Canvas interaction (Phase 3)

| Control | Status |
|---------|--------|
| Selection handles + resize | Equivalent |
| Rotation handle | Equivalent |
| Drag / flip / duplicate / delete | Equivalent |
| Shift-click multi-select | Equivalent |
| Marquee box select | Equivalent |
| Keyboard nudge (multi-select) | Equivalent |
| Snap to edges/centers/objects | Equivalent |
| Overlap + OOB warnings | Equivalent |
| Live DPI recalc on resize | Equivalent |

## Verification

```bash
npm test
npm run typecheck
npm run build
cd extensions/upload-by-size && shopify theme check
node scripts/capture-gang-sheet-screenshots.mjs --capture
```

## Storefront verification (not localhost)

- App proxy: https://legends-bags-in2lwdll.myshopify.com/apps/legends-bags/
- Builder: https://legends-bags-in2lwdll.myshopify.com/apps/legends-bags/builder?type=gang_sheet
- Pricing: synced variant ($17 on 22.5×24)
- Customer: logged-in Shopify customer name/email when session present

## Remaining honest gaps

- Canva/Dropbox OAuth — blocked on merchant credentials
- Add Image folder browsing / bulk format parity — partial
- Pixel-perfect visual match to reference screenshots — not claimed
- Playwright screenshots require dev server + optional `playwright` devDependency
- Admin settings field depth vs BAGS — not in sprint scope
