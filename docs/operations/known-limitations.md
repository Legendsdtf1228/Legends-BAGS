# Known limitations (Phase 1)

- Storefront appearance/config uses Shopify app proxy (`/apps/legends-bags/storefront-config`); editor APIs still use `TEST_API_TOKEN` / design access tokens until full proxy coverage
- In-process sharp render caps at ~40MP; long sheets need tiled rendering (not yet shipped)
- SVG uploads are rasterized at 300 DPI on ingest (vector editing not supported)
- Background removal uses local color segmentation by default; set `REMOVE_BG_API_KEY` for remove.bg on complex photos
- Cutting-row and true-shape nesting are Phase 2/4
- Full canvas editor is Phase 2 (early `/editor/gang-sheet` + theme block shipped; welcome screen, gallery, undo still pending)
- No Dropbox/Drive mirroring yet
- Merchant UI uses Shopify web components from the template; polish pending
- RIP import validation must be performed manually on a sample set before production claims
- `legends-studio` sibling folder is an unused template copy and is not this app
- Partner `client_id` in `shopify.app.toml` was inherited from the unused template — re-link for a dedicated app before production
