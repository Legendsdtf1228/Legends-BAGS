# BAGS Visual Measurements — Storefront Gang Sheet Editor

Reference: **Build a Gang Sheet** live merchant editor (customer gang sheet builder).  
Legends target: dev storefront `legends-bags-in2lwdll.myshopify.com` via app proxy.

## Capture status (Phase 0)

| Item | Status |
|------|--------|
| Live BAGS URL for automated capture | **Blocked** — production BAGS editor requires merchant session; no stable unauthenticated capture URL in this sprint |
| Repo reference | `docs/qa/exact-bags-parity-matrix.md`, prior `exact-bags-parity` screenshots |
| User reference state | 22.5×36 @ $29, logged-in, Lester Celebration Weekend 2×2, selected ~0.13/11.53/11.00×11.28″ @ 114 DPI |
| Legends pricing check | 22.5×24 @ **$17** on assigned dev product (unchanged) |

Screenshots folder: `docs/qa/screenshots/exact-bags-visual-clone/bags/` — structure created; BAGS PNGs require manual capture from live BAGS when session is available.

---

## Shell measurements (desktop 1440×1000)

| Region | BAGS reference | Legends token / CSS |
|--------|----------------|---------------------|
| Header height | 52px | `--bags-header-h: 52px` |
| Header background | `#ffffff` | `--bags-surface` |
| Header border | 1px `#dadce0` bottom | `--bags-border` |
| Logo mark | ~28×28px, 6px radius, blue | `.bags-parity-logo` |
| Qty stepper | ~96px wide, 11px label | `.bags-parity-qty` |
| Primary button height | 30–32px | `--bags-control: 30px` |
| Save & Cart | Blue `#1a73e8` | `--bags-primary` |
| Close | Red text `#d93025`, white bg | `--bags-danger` |
| Price block | Two lines: amount / USD | `.bags-parity-price` column, 14px / 10px |
| Account avatar | 28×28 circle | `.bags-parity-avatar` |

## Left icon rail

| Property | BAGS reference | Legends |
|----------|----------------|---------|
| Width | 56px | `--bags-rail-w: 56px` |
| Background | White | `#ffffff` (was incorrectly `#0d1117` — fixed) |
| Border | 1px right `#dadce0` | `border-right` on rail |
| Icon size | 20px stroke | `--bags-icon: 20px` |
| Icon color idle | `#5f6368` | `--bags-muted` |
| Icon color active | `#1a73e8` | `--bags-primary` |
| Active bg | `#e8f0fe` | `.bags-left-rail-btn.active` |
| Label font | 8px / 600 | `.bags-left-rail-label` |
| Language selector | Bottom, ~24px | `.bags-left-rail-lang` |
| Powered-by | 7px centered footnote | `.bags-left-rail-powered` |

## Toolbar

| Property | BAGS reference | Legends |
|----------|----------------|---------|
| Height | 40px | `--bags-toolbar-h: 40px` |
| Background | White | `--bags-surface` |
| Control size | 30×30px | `--bags-control` |
| Auto Nest | Orange `#f97316`, right-aligned before zoom | `.bags-tool-nest` + `.bags-toolbar-spacer` |
| Separators | 1px `#dadce0` in groups | `.bags-parity-tool-group` |

## Side panel (Uploads / Products)

| Property | BAGS reference | Legends |
|----------|----------------|---------|
| Width | 272px | `--bags-panel-w: 272px` |
| Heading height | 48px | `.sidebar-panel .heading` override |
| Upload zone | Dashed border, ~88px min | `.drop.compact` |
| Upload button | 30px blue | `.sidebar-upload-btn` |
| Thumbnail grid gap | 6px | `.pool-grid` |

## Properties panel (right)

| Property | BAGS reference | Legends |
|----------|----------------|---------|
| Width | 272px | `--bags-props-w: 272px` |
| Heading | 48px, 12px title | `.properties.bags-parity-properties .heading` |
| Field labels | 10px / 600 muted | `.sidebar-form label` |
| Inputs | 28px height | form input override |
| Thumbnail preview | max 72px | `.preview img` |

## Canvas workspace

| Property | BAGS reference | Legends |
|----------|----------------|---------|
| Workspace bg | `#e8eaed` | `--bags-workspace` |
| Scroll padding | 8px 12px 8px 28px | `.scroll` |
| Ruler gutter | ~20px left | `.canvas-stage margin-left` |
| Quality legend width | 120px | `--bags-legend-w: 120px` |
| Selection bar height | 36px | selection bar min-height |
| Handle size | 8×8px blue squares | `.resize-handle` |
| Rotation handle | 14px circle above piece | `.rotate-handle` |

## Image Editor modal

| Property | BAGS reference | Legends |
|----------|----------------|---------|
| Max width | 960px | `.bags-image-editor-modal` |
| Nav | Vertical left, 112px | `.bags-image-editor-nav` |
| Preview min height | 300px | `.bags-image-editor-preview` |
| Controls column | 220px | grid `1fr 220px` |
| Footer | Large Close + Apply | `.bags-modal-actions` |

## Mobile breakpoints

| Breakpoint | Behavior |
|------------|----------|
| ≤1280px | Tighter header padding, smaller legend |
| ≤1024px | Panel 240px, props 220px, smaller selection inputs |
| ≤768px | Hide left rail; bottom nav 52px; drawers overlay |

## Colors

| Token | Hex |
|-------|-----|
| Primary blue | `#1a73e8` |
| Nest orange | `#f97316` |
| Destructive red | `#d93025` |
| Surface | `#ffffff` |
| Workspace | `#e8eaed` |
| Border | `#dadce0` |
| Text | `#202124` |
| Muted | `#5f6368` |
| Active tint | `#e8f0fe` |

## Typography

| Element | Size / weight |
|---------|----------------|
| Body | 13px / 400, Inter |
| Panel title | 12px / 700 |
| Panel subtitle | 10px / 400 muted |
| Toolbar buttons | 11px / 700 |
| Rail labels | 8px / 600 |

## Remaining pixel gaps (honest)

- Live BAGS side-by-side PNGs not captured this sprint (session blocker)
- Corner/side resize handles: CSS present; only SE resize wired in canvas logic
- BAGS exact icon glyph shapes may differ slightly from Legends SVG set
- Mobile bottom nav: text labels vs BAGS icon+label density
- Canva/Dropbox OAuth panels — disconnected state styling only
