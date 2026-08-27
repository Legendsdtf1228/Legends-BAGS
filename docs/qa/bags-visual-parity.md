# BAGS Visual Parity — Inventory & Checklist

Reference app: **Build a Gang Sheet** (live merchant + customer editors).  
Legends target: **Legends BAGS Dev** on `legends-bags-in2lwdll.myshopify.com`.

Screenshots for internal QA live under `docs/qa/screenshots/` (not shipped as product assets).

## Measurement baseline (BAGS-aligned)

| Token | Reference | Legends implementation |
|-------|-----------|------------------------|
| Sidebar width | ~240px | `--bags-sidebar-width: 240px` |
| Header height | ~56px | `--bags-header-height: 56px` |
| Content max width | ~1280px | `--bags-content-max: 1280px` |
| Control height | ~36px | `--bags-control-height: 36px` |
| Table row height | ~52px | `.bags-admin-table tbody tr` min-height |
| Body font | 13px Inter | `13px` via design tokens |
| Page title | 20px / 800 | `.bags-admin-topbar h1` |
| Card radius | 12px | `--bags-radius-lg` |
| Primary accent | Orange `#f97316` | `--bags-accent` |
| Shell background | `#f4f6f9` | `--bags-shell-bg` |

## Merchant application inventory

### Shell & navigation

| Screen | BAGS pattern | Legends route | Status |
|--------|--------------|---------------|--------|
| Left nav groups (Main / Settings / Support) | Grouped dark sidebar | `BagsAdminShell` | In progress |
| Active nav indicator | Orange inset bar | `.bags-admin-nav-link.active` | Done |
| Store + version footer | Subtle footnote | Sidebar foot | Done |
| Mobile nav | Collapsible / wrap | Toggle + `is-mobile-open` | In progress |

### Main

| Screen | Key regions | Legends route | Status |
|--------|-------------|---------------|--------|
| Home | Date range, stat cards, workflow, pipeline, recent tables | `/app` | In progress |
| Products | Toolbar, table, import, pagination | `/app/products` | In progress |
| Designs | Filters, bulk select, preview column | `/app/designs` | Pending |
| Orders | Filters, payment/render badges, actions | `/app/orders` | In progress |
| Build & Assign | Assignment table | `/app/build-assign` | Pending |
| Shop Builder | Staff sheet list | `/app/shop-builder` | Pending |
| Activity | Audit/transactions | `/app/transactions` | Pending |

### Settings

| Screen | Legends route | Status |
|--------|---------------|--------|
| General | `/app/general` | Pending |
| Gang Sheet Builder | `/app/gangsheet-builder` | Pending |
| Upload by Size | `/app/image-to-sheet` | Pending |
| Appearance | `/app/appearance` | Pending |
| Gallery Images | `/app/gallery` | Pending |
| POD | `/app/pod` | Pending |
| Fonts | `/app/fonts` | Pending |
| FitCheck Templates | `/app/fitcheck` | Pending |

### Support

| Screen | Legends route | Status |
|--------|---------------|--------|
| Changelog | `/app/changelog` | Pending |
| Support / diagnostics | `/app/support` | Pending |
| Setup | `/app/setup` | Pending |

## Customer editor inventory

| Screen | Layout | Legends route | Status |
|--------|--------|---------------|--------|
| Welcome Center | Icon rail + card grid | `/editor/gang-sheet`, `/editor/upload-by-size` | In progress |
| Gang Sheet canvas | Toolbar + rail + panel + canvas + properties | `/editor/gang-sheet` | In progress |
| Upload by Size | Queue + preview + summary | `/editor/upload-by-size` | In progress |
| Sidebar panels | Uploads, Gallery, Text, Names, Auto, Layers, Help | Gang sheet editor | Functional |
| Save / cart | Header actions | Both editors | Functional |

### Editor icon policy

- **Removed:** Emoji rail icons (🏠 📁 🖼 ⚡ etc.)
- **Replaced with:** SVG icons in `app/components/editor/editor-rail-icons.tsx`

## Shared component system

Location: `app/components/merchant/`

| Component | File |
|-----------|------|
| Design tokens | `bags-design-tokens.ts` |
| Shell + styles | `bags-admin-ui.tsx`, `bags-admin-shell.tsx` |
| Reusable UI | `bags-admin-components.tsx` |
| Nav config | `bags-admin-nav.ts` |
| Nav icons (SVG) | `bags-admin-icons.tsx` |

Components: `BagsPageBody`, `BagsToolbar`, `BagsSearchField`, `BagsEmptyState`, `BagsAlert`, `BagsTabs`, `BagsTableWrap`, `BagsThumb`, `BagsPagination`, `BagsSectionHeader`, `BagsLoadingRows`.

## Visual regression viewports

Capture at:

- Desktop: **1440 × 1000**
- Laptop: **1280 × 800**
- Mobile: **390 × 844**

Run route list: `node scripts/visual-parity-routes.mjs`

### Required captures

- [ ] Dashboard (`/app`)
- [ ] Products (`/app/products`)
- [ ] Designs (`/app/designs`)
- [ ] Orders (`/app/orders`)
- [ ] Gallery (`/app/gallery`)
- [ ] Fonts (`/app/fonts`)
- [ ] FitCheck (`/app/fitcheck`)
- [ ] Welcome Center (gang sheet editor)
- [ ] Welcome Center (upload by size)
- [ ] Gang Sheet editor with selection
- [ ] Upload by Size with queue
- [ ] Mobile editor toolbar

## Parity checklist template

For each screen:

1. Reference screenshot (internal QA only)
2. Legends screenshot (same viewport)
3. Remaining differences (bulleted)
4. Status: `not started` | `in progress` | `done`

## Prototype residue removed (this sprint)

- [x] Emoji navigation icons in merchant shell (was already SVG)
- [x] Emoji editor rail icons → SVG
- [x] Raw tunnel URL on dashboard
- [x] Developer JSON dump on dashboard
- [x] Oversized setup CTA on home header
- [ ] “Coming soon” placeholders in editor panels
- [ ] Inconsistent form controls on settings pages
- [ ] Manual GID form prominence on Products

## Remaining differences (known)

- Product table lacks checkbox bulk-select column styling parity
- Design detail page preview layout not yet BAGS-dense
- Order detail drawer/page not built
- Gallery grid/table toggle not implemented
- Font upload UI structure incomplete
- Settings pages still use basic form layout
- Toast system not yet global

## Verification commands

```bash
npm run setup
npm test
npm run typecheck
npm run build
```

Browser: every nav link in `BAGS_ADMIN_NAV` must load without error.
