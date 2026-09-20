# DEV-ONLY: Gang Sheet Studio builder bridge

Branch: `integration/dev-studio-builder` (branched from `integration/rc-commerce-autofill-orders`).

## What this does

When `USE_STUDIO_BUILDER=1`:

1. Storefront `/builder` for `gang_sheet` products redirects to `/editor/studio`
2. `/editor/studio` sets customer API cookies (same as legacy editor) and redirects to `/studio/?host=bags&…`
3. Static Studio UI under `public/studio/` (synced from Gang Sheet Studio build) talks to:
   - `GET /api/studio-bootstrap` — ProductBinding sheet config + optional design reopen
   - `POST /api/uploads` — artwork
   - `POST|PUT /api/designs` — DesignStateV1 persist + signed cart properties
4. Studio posts `lgs:design-ready` for the existing theme launcher cart handoff

Legacy `/editor/gang-sheet` is **not removed**.

When `USE_STUDIO_BUILDER` is unset/false, `/builder` behavior is unchanged (legacy editor).

## Production-output ownership (DEV)

- **Studio** authors placements (builder authority).
- Save converts Studio → **BAGS `DesignStateV1`** with `layout: "manual"` via Studio’s explicit adapter.
- On paid order, **BAGS `nestAndRenderDesign`** renders that DesignStateV1 using manual placements (does not re-pack / re-interpret a Studio document through the legacy BAGS canvas).
- Do not create a second production render authority.

## Railway / deploy (manual)

1. Build Studio: `PORT=4179 BASE_PATH=./ pnpm run build` in Gang-Sheet-Studio `artifacts/gang-sheet-studio`
2. Sync: `STUDIO_DIST=…/dist/public node scripts/sync-studio-dist.mjs`
3. Set Railway vars on the **dev** service only:
   - `USE_STUDIO_BUILDER=1`
   - existing `DEV_SHOP=legends-bags-in2lwdll.myshopify.com`
4. Deploy **this branch** (not `main`) to the Railway Legends BAGS Dev service
5. Open the gang-sheet test product on the password-protected development storefront and click the builder button

## Rollback

Unset `USE_STUDIO_BUILDER` (or set `0`) and redeploy — `/builder` returns to `/editor/gang-sheet`.
