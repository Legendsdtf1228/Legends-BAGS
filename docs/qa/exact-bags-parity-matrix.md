# Exact BAGS Parity Matrix

Branch: `sprint/exact-bags-parity`  
Reference: **Build a Gang Sheet** (live production app)  
Dev store: `legends-bags-in2lwdll.myshopify.com`

Status key: **done** | **partial** | **pending** | **blocked**

## Part 1 — Storefront builder shell

| Control / region | BAGS | Legends | Status |
|------------------|------|---------|--------|
| Header qty stepper | Yes | `BagsGangSheetHeader` | partial |
| Save & Add to Cart (blue) | Yes | Header primary | partial |
| Save / Close | Yes | Header | partial |
| Live USD price | Yes | Header + Welcome + save/cart via synced variant | partial |
| Customer account menu | Yes | Storefront session (not localhost Guest) | partial |
| Permanent left rail (desktop) | Yes | Home/Products/Uploads/Gallery/Canva/Dropbox/Settings | partial |
| Uploads side panel | Yes | `BagsUploadsPanel` grid/list, progress, qty badges | partial |
| Properties panel (desktop right) | Yes | `BagsPropertiesPanel` w/ fit check, upscale, auto fill | partial |
| Sheet size selector (22.5 widths) | Yes | Toolbar + domain constants | done |
| 22.5×24 never → 360 | Yes | `resolveGangSheetHeight()` | done |
| Undo/redo | Yes | Toolbar | done |
| Pan / grid / Auto Nest | Yes | Toolbar | partial |
| Zoom + fit sheet | Yes | Toolbar | done |
| Rulers + scroll + artboard | Yes | Canvas | done |
| Selection toolbar (inches, DPI, transforms) | Yes | `BagsSelectionToolbar` | partial |
| Quality legend + warnings | Yes | Settings + inspector | partial |

## Part 2 — Bottom navigation

| Item | BAGS | Legends | Status |
|------|------|---------|--------|
| Select | Yes | Bottom nav + Active Sheets drawer | partial |
| Add Image | Yes | Modal (Recent/Uploads/Gallery/Canva) | partial |
| Names & Numbers | Yes | Drawer (CSV paste) | partial |
| Settings | Yes | Drawer | partial |
| Active sheet card + qty | Yes | Drawer | partial |
| Previous designs picker | Yes | Welcome library only | pending |

## Parts 3–8 — Modals & workflows

| Area | Status | Notes |
|------|--------|-------|
| Add Image full parity (folders, bulk, formats) | pending | Modal shell only |
| Canva / Dropbox integrations | pending | Connect hidden until wired |
| Text workflow | pending | Legacy sidebar hidden |
| Names & Numbers presets + CSV modal | pending | CSV paste only |
| Auto Build dialog | partial | Separate screen exists |
| Save modal | partial | `GangSheetSaveDialog` |
| Confirmation / Print Anyway modal | pending | |
| Cart properties | done | Backend wired |

## Parts 9–12 — Admin & ops

| Area | Status | Notes |
|------|--------|-------|
| Admin nav terminology | partial | Labels updated in `bags-admin-nav.ts` |
| General / Builder / Gallery settings depth | pending | Forms exist, not full BAGS fields |
| Orders / Designs / Shop Builder tables | partial | |
| Build & Assign | partial | |

## Part 13–15 — Visual & verification

| Requirement | Status |
|-------------|--------|
| BAGS white surface + blue/orange/red actions | partial |
| No dark Legends rail in customer editor | done |
| Responsive 1440/1280/768/390 | pending screenshots |
| Side-by-side screenshot evidence | pending |
| E2E checkout + 300 DPI render | pending |

## Verification (required each milestone)

```bash
npm test
npm run typecheck
npm run build
cd extensions/upload-by-size && shopify theme check
```

## Remaining differences (honest)

- Customer editor uses new BAGS-parity shell; not yet pixel-matched to reference screenshots.
- Many BAGS controls exist as partial implementations — visible but not feature-complete.
- Admin pages retain Legends layout density; terminology aligned, depth not.
- Canva, Dropbox, full gallery favorites/watermarks, confirmation modal, and merchant-config field parity are not done.
