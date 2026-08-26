# Known limitations (Phase 1)

- Storefront API auth uses `TEST_API_TOKEN` headers — replace with Shopify app proxy / session tokens before any customer traffic
- In-process sharp render caps at ~40MP; long sheets need tiled rendering (not yet shipped)
- SVG upload deferred (PNG/JPEG only)
- Cutting-row and true-shape nesting are Phase 2/4
- Full canvas editor is Phase 2
- No Dropbox/Drive mirroring yet
- Merchant UI uses Shopify web components from the template; polish pending
- RIP import validation must be performed manually on a sample set before production claims
- `legends-studio` sibling folder is an unused template copy and is not this app
- Partner `client_id` in `shopify.app.toml` was inherited from the unused template — re-link for a dedicated app before production
