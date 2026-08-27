# Storefront, Saved Designs & Reorder Sprint

Branch: `sprint/storefront-design-library`  
Base: `396a55d` on `sprint/editor-ui-parity`

## Completed

### Storefront launcher (`extensions/upload-by-size/assets/lgs-launcher.js`)
- Origin-validated `postMessage` (editor base URL only)
- Modal: focus trap on open, Escape closes, scroll lock, loading state
- Edit design / Start over actions
- Full cart property attachment including customer-visible summary
- Product-scoped Add-to-Cart hard gate (unchanged scope)

### Design versioning & reopen
- `GET /api/designs/:designId?version=N` — load any version with asset metadata
- `PUT /api/designs/:designId` — save gang sheet as **new immutable version**
- Ordered designs cannot be edited in place; use reorder duplicate
- Editor loads `designId` + `designVersion` from URL; PUT on save when editing
- Unsaved-change `beforeunload` warning

### Server-backed design library
- Prisma `Design` fields: `name`, `archived`, `customerKey`, `previewKey`, reorder lineage
- `GET /api/design-library` — search, sort, list named designs
- `POST /api/design-library` — save, rename, archive, duplicate/reorder
- Welcome Center library UI (server); localStorage drafts labeled separately

### Cart line properties
- Hidden: `_lgs_design_id`, `_lgs_design_version`, `_lgs_price_ref` (signed)
- Customer-visible: `Design`, `_lgs_sheet_size`, `_lgs_piece_count`, `_lgs_workflow`

### Reorder
- `duplicateDesignForReorder()` — new design ID, copies exact state JSON
- Merchant dashboard: Reorder button on design detail
- Customer library: Duplicate / order-again via API

### Checkout validation
- `validateDesignForCheckout()` on webhook link when version known
- Signed price reference verification when `_lgs_price_ref` present

## Pricing (production decision required)

**Current approach (dev-safe):** Shopify product variant has a base price; printed-area price is calculated server-side and stored on `DesignVersion.priceCents`. Cart carries a signed `_lgs_price_ref` for verification at order link time.

**Not implemented:** Shopify Cart Transform / Functions to change line price at checkout. Production must either:
1. Use tiered variants + instructions to pick correct variant, or
2. Implement Shopify Functions (Plus/plan dependent), or
3. Invoice adjustment post-order (merchant workflow)

Do **not** trust browser-submitted prices.

## Authorization model

- Dev/storefront APIs: `TEST_API_TOKEN` + `X-LGS-Shop` / HttpOnly cookies (Phase 1)
- Design access tokens: HMAC signed via `FILE_SIGNING_SECRET` (24h TTL)
- Shop isolation: all design queries filter by `shop`
- Never expose raw storage keys; downloads use signed URLs only

## Migration

```powershell
npx prisma migrate deploy
```

Rollback: revert migration `20260827180000_design_library` (columns nullable; safe to leave unused).

## Manual QA checklist

1. [ ] Gang Sheet block opens modal with correct tunnel URL
2. [ ] Save attaches design + version + summary properties
3. [ ] ATC blocked without design on configured product only
4. [ ] Edit design reopens with same placements
5. [ ] Save creates v2; cart updates to v2
6. [ ] Library shows named design after Save to library
7. [ ] Reorder creates distinct design ID
8. [ ] Second designed product in cart is isolated

### Cart edit from cart page
- `extensions/upload-by-size/blocks/cart-edit-design.liquid` — theme block for cart template; links to product with `lgs_design_id` / `lgs_design_version`

### Upload-by-Size versioning parity
- `editor.upload-by-size.tsx` — load `designId`/`designVersion`, PUT save for new version, `beforeunload`, origin-safe postMessage

### Preview thumbnails & library UX
- `Design.previewKey` populated when render completes
- `listDesignLibrary()` returns signed `previewPath`
- Welcome Center: thumbnails, rename, archive, show archived filter

### Merchant dashboard
- Search, workflow/status filters, design names, preview thumbs, order linkage

## Known limitations

- Cart page “Edit design” — add the **LGS Cart Edit Design** theme block to the cart template (links back to product with design params)
- Customer Shopify login / App Proxy auth not yet integrated (guest token only)
- Dynamic checkout line pricing requires Shopify Functions or tiered variants (see Pricing section)
- Upscale / background removal tools are UI placeholders only
