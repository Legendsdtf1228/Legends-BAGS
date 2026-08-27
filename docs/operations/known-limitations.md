# Known limitations (Phase 1)

- Storefront appearance/config and cart design hydration use Shopify app proxy (`/apps/legends-bags/*`); editor APIs accept signed storefront session cookies or dev `TEST_API_TOKEN`
- Per-customer design libraries use `customerKey` (Shopify customer GID or stable guest key in localStorage)
- In-process sharp render caps at ~40MP; long sheets need tiled rendering (not yet shipped)
- SVG uploads are rasterized at 300 DPI on ingest (vector editing not supported)
- Background removal uses local color segmentation by default; set `REMOVE_BG_API_KEY` for remove.bg on complex photos
- Cutting-row and true-shape nesting are Phase 2/4
- Full canvas editor is Phase 2 (early `/editor/gang-sheet` + theme block shipped; welcome, gallery, undo done; mobile QA pending)
- No Dropbox/Drive mirroring yet
- Merchant UI uses Shopify web components from the template; polish pending
- RIP import validation must be performed manually on a sample set before production claims
- `legends-studio` sibling folder is an unused template copy and is not this app
- Partner `client_id` in `shopify.app.toml` was inherited from the unused template — re-link for a dedicated app before production
