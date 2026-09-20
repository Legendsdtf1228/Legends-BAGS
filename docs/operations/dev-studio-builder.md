# Gang Sheet Studio builder bridge

Authoritative gang-sheet builder is **Gang Sheet Studio**. BAGS launches it through `/editor/studio` → `/studio/?host=bags` → `/api/studio-bootstrap`.

## Launch paths

| Surface | Route |
| --- | --- |
| Customer Open/Build (`/builder`, theme CTA) | `/editor/studio` → `/studio/` |
| Merchant Open Builder (Products) | `/editor/studio?shop_mode=merchant` → `/studio/` |
| Merchant Preview Builder (Gangsheet Builder settings) | `/editor/studio?shop_mode=merchant` → `/studio/` |
| Shop Builder Edit | `/editor/studio?shop_mode=merchant` → `/studio/` |
| Product configuration | BAGS merchant UI (`/app/products`, `/app/gangsheet-builder`) |
| Upload-by-Size | `/editor/upload-by-size` (unchanged, own workflow) |

Legacy `/editor/gang-sheet` is **not a selectable builder**. It remains in source as an emergency fallback when `USE_STUDIO_BUILDER=0` (customer `/builder` only) or when `public/studio/index.html` is missing.

## What this does

1. Storefront `/builder` for `gang_sheet` products redirects to `/editor/studio` when Studio is enabled (default: bridge files present; explicit `USE_STUDIO_BUILDER=0` rolls back customer `/builder` only).
2. `/editor/studio` sets API cookies and redirects to `/studio/?host=bags&…`
3. Static Studio UI under `public/studio/` talks to:
   - `GET /api/studio-bootstrap` — ProductBinding sheet config + optional design reopen
   - `POST /api/uploads` — artwork
   - `POST|PUT /api/designs` — DesignStateV1 persist + signed cart properties
4. Studio posts `lgs:design-ready` for the existing theme launcher cart handoff

Merchant Open/Preview/Edit uses Studio whenever the bridge files exist, even if customer `/builder` is rolled back with `USE_STUDIO_BUILDER=0`.

## Production-output ownership (DEV)

- **Studio** authors placements (builder authority).
- Save converts Studio → **BAGS `DesignStateV1`** with `layout: "manual"` via Studio’s explicit adapter.
- On paid order, **BAGS `nestAndRenderDesign`** renders that DesignStateV1 using manual placements (does not re-pack / re-interpret a Studio document through the legacy BAGS canvas).
- Do not create a second production render authority.

## Railway / deploy (manual)

1. Build Studio: `PORT=4179 BASE_PATH=./ pnpm run build` in Gang-Sheet-Studio `artifacts/gang-sheet-studio`
2. Sync: `STUDIO_DIST=…/dist/public node scripts/sync-studio-dist.mjs`
3. Set Railway vars on the **dev** service only:
   - `USE_STUDIO_BUILDER=1` (optional once the Studio dist is synced; unset still defaults to Studio)
   - existing `DEV_SHOP=legends-bags-in2lwdll.myshopify.com`
4. Deploy **this branch** (not `main`) to the Railway Legends BAGS Dev service
5. Open the gang-sheet test product on the password-protected development storefront and click the builder button

## Rollback

Set `USE_STUDIO_BUILDER=0` and redeploy — customer `/builder` returns to `/editor/gang-sheet`. Merchant Open/Preview still uses Studio while `public/studio/` is present.
