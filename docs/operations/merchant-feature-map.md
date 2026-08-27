# Merchant operations feature map

Branch: `sprint/admin-operations-parity`

## Completed in this sprint

| Area | Route | Status |
|------|-------|--------|
| Operations dashboard | `/app` | Real DB aggregates, date ranges, pipeline health, recent designs/orders |
| Build & Assign | `/app/build-assign` | Fixed Prisma crash; CRUD assignments; merchant-safe errors |
| Products | `/app/products` | Bindings table with search/filter; variant binding |
| Designs | `/app/designs` | Search, workflow/status filters, bulk download entry |
| Orders | `/app/orders` | Search, render status column |
| Gallery CMS | `/app/gallery` | Persisted categories/uploads; no hardcoded SVG seeds |
| Fonts | `/app/fonts` | System fonts, enable/disable, default font |
| FitCheck | `/app/fitcheck` | Template CRUD foundation (rectangular regions) |
| Activity | `/app/transactions` | Audit event list with secret/path sanitization |
| Support | `/app/support` | Safe diagnostics copy |
| Changelog | `/app/changelog` | Release notes from `docs/release-notes.json` |
| Appearance | `/app/appearance` | Persisted colors/labels + preview |
| POD | `/app/pod` | Clearly disabled placeholder |
| Shop Builder | `/app/shop-builder` | Staff sheet CRUD + render |
| Theme launcher | extension asset | Stub &lt;10 KB + app-hosted full script |

## Partial / next sprint

| Area | Gap |
|------|-----|
| Products | Shopify Admin product sync/import, bulk assign, product images, storefront links |
| Build & Assign | Full order-line workflow, version immutability UI, render download in-page |
| Orders | Payment/fulfillment from Shopify API, order detail page, webhook event log UI |
| Designs | Archive/rename actions in table, ZIP bulk download |
| Gallery | Bulk tag/category, reorder, publish workflow polish |
| Fonts | Custom font upload + render embedding |
| FitCheck | Cylindrical wrap, preview image upload |
| Builder settings | Deep Gang Sheet / UBS toggles wired to every editor field |

## Prisma models

- `DesignAssignment` — staff/customer design assignments
- `ShopFont` — merchant font catalog
- `FitCheckTemplate` — printable region templates
- Existing: `GalleryCategory`, `GalleryAsset`, `AuditEvent`, `ProductBinding`, …

## Migrations

- `20260827200000_merchant_features` — DesignAssignment, appearance columns
- `20260827230000_admin_ops_fonts_fitcheck` — ShopFont, FitCheckTemplate

Rollback: revert branch; `prisma migrate resolve` only if partially applied in production.

## Theme launcher build

```powershell
node ./scripts/sync-launcher-full.mjs   # copies full script to public/
npm run build                           # prebuild runs sync + verifies stub < 10 KB
```

## Production readiness checklist

- [ ] Run `npm run setup` on Railway after deploy
- [ ] Restart app after Prisma generate (stale client causes Build & Assign crash)
- [ ] Theme check passes (launcher under 10 KB)
- [ ] Browser QA on `legends-bags-in2lwdll.myshopify.com` only
- [ ] Shopify product sync for `/app/products` parity
- [ ] Custom font upload security review
