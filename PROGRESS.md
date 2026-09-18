# Gang Sheet Studio — checkpoint handoff

**Date:** 2026-09-18  
**Purpose:** Stop development. Snapshot only. No fixes, installs, test reruns, deploy, merge, or new sprint.

**This checkpoint tree:** Legends BAGS gang-sheet builder at `sprint/editor-production-readiness-1` (`bb9095fb52c2b0536e3429c9b0a4e30cb70c79f5`) plus this file.

**Review alongside (do not combine repositories yet):**  
`https://github.com/Legendsdtf1228/Legends-BAGS` branch `ui/editor-six-surface-integration` at `3a16d6dcc627be6e533f14c3f2bba96bffc5304d`.

**Connected GitHub remote at handoff:** `https://github.com/Legendsdtf1228/Legends-BAGS.git` — **public**. This snapshot is intended for a **private** `Gang-Sheet-Studio` repository. Do not treat the public Legends-BAGS remote as the private checkpoint.

---

## Completed numbered tasks

Includes **Task #5**.

1. **Builder shell + visual system** — Studio chrome, `--gs-*` tokens, primitives, breakpoints. Lane `cursor/studio-shell-visual-system-feca` @ `34d9f16`.
2. **Canvas workspace UI** — Frame, rulers, zoom chrome, selection visuals, sheet tabs. Lane `cursor/canvas-workspace-ui-734b` @ `8656e52`.
3. **Uploads + Gallery UI** — Drop zone, thumbnails, search, DPI presentation, Add to Sheet. Lane `cursor/uploads-gallery-ui-8dd5` @ `988ec2d`.
4. **Auto Build + Auto Fill workflow UI** — Quantity/size, aspect lock, review, Back/Apply. Lane `cursor/auto-build-fill-workflow-22cb` @ `389d5bb`. UI only; Auto Fill *behavior* in Task #11 is not started.
5. **Task #5 — production color (sRGB / Display P3 ICC / WebKit)** — Recorded complete by the user on 2026-09-18 09:10:
   - Explicit sRGB canvas handling for production PNG exports
   - Display P3 ICC-profile detection and normalization during upload
   - Browser capability probe to prevent WebKit double-conversion
   - ICC-profiled fixture repaired and validated
   - Cross-browser color assertions with diagnostics  
   **Checkpoint note:** those Vite/ICC files are **not present in this Shopify/React Router tree**. This tree has Artwork Inspector UX (`d6cd9d6`) and honest placement DPI instead. Do not assume Task #5 source landed here.
6. **Production Review UI** — Readiness, warnings above the fold, empty-sheet Save still blocked. Lane `cursor/production-review-checkpoint-8c83` @ `44656ec`.
7. **Six-surface composition** — Combined chrome on `ui/editor-six-surface-integration` (`d9ffe44`, inputRef follow-up `3a16d6d`).
8. **Production-readiness P0** — Real shop-tenant `GalleryAsset` → existing `Asset`; no fake gallery; no invented 300 DPI. `gallery-placement.ts` / `dpi-quality.ts`.
9. **Production-readiness P1** — Tablet workspace 768–900px (phone dock `≤767`; desktop `>900` unchanged).
10. **Production-readiness P2/P3** — Auto Build `--accent` mapped onto `--gs-*`; Production Review exercised with a non-empty placed fixture. Empty Save remains blocked.

---

## Remaining numbered tasks

Includes **Task #11**. None of these were started in this checkpoint.

11. **Task #11 — Auto Fill placement semantics (not started)**  
    Preserve unrelated manual placements; calculate before committing; report count; fail cleanly when placement is impossible; commit as one undoable action. These are Legends design decisions, not competitor internals.
12. **Live storefront auth proof** on a Shopify development store (app-proxy session, not only `TEST_API_TOKEN`).
13. **Customer upload → merchant Gallery** — uploads today enter the session Uploads pool, not `GalleryAsset`. Gallery stays empty until merchant Gallery rows exist.
14. **HTTPS cookie posture** — `SameSite=None; Secure` for real storefront iframe; HTTP local uses Lax.
15. **Real cart Save / checkout** on a development store (not faked).
16. **Favorites** — no persisted contract; remains absent (out of scope unless a real contract is found).
17. **End-to-end Shopify checkout** on a development store.
18. **RIP import validation** of generated 300 DPI PNG.
19. **Mobile QA on real devices** (beyond viewport CSS).
20. **PostgreSQL + S3** (or equivalent) for non-local environments.
21. **Security review sign-off** before production install.
22. **Cutting-row / true-shape nesting** (Phase 2/4).
23. **Cloud Drive/Dropbox sync** — must never delete Legends canonical files.
24. **Usage billing events** decoupled from render (spec area 55; absent).
25. **Dedicated Partner `client_id`** — `shopify.app.toml` still inherited from unused template.

---

## Known bugs and blockers

- **Gallery empty** until shop `GalleryAsset` rows exist; customer uploads do not auto-publish into merchant Gallery.
- **Live Shopify OAuth / app-proxy iframe** was not exercised; local proof used `DEV_SHOP` + `TEST_API_TOKEN` only.
- **Tablet drawer covers the artboard**; compact “Quality” label wrap; dark Gallery vs light inspector leftover contrast.
- **Save disabled on empty sheet** is correct; Production Review needs a real placed asset.
- **No live Shopify session** in the six-surface Chromium smoke (Add to Sheet not clicked on empty library at `3a16d6d`).
- **Public origin:** `Legends-BAGS` is public. Do not push this private checkpoint there.
- **Concurrent lane:** a combine of `ui/editor-six-surface-integration` and `sprint/editor-production-readiness-1` was queued in another chat at 09:19. This handoff does not merge those branches.
- Frozen engines were not changed: packing, nesting, production renderer, persistence, image processing, pricing, DesignStateV1, migrations.
- Replit remains a separate builder. This checkpoint does not import or merge Replit.

---

## Last recorded test/build results (previously run — not re-run at this checkpoint)

Do not treat these as verification of this handoff commit.

**A. Production-readiness sprint** (`bb9095f`, 2026-09-18, previously run)

- Typecheck: pass
- Vitest: **250/250** in **42** files (baseline was 234/41)
- Production `react-router` build: pass
- Headless Chrome viewports: 1440 (4-col); 390 (phone dock); 768 / 820 / 900 (tablet chrome, no phone dock)
- Authenticated Shopify: **not** exercised (local shop token only)

**B. Six-surface integration** (`3a16d6d`, previously run)

- Typecheck: pass
- Vitest: **234/234**
- Production build: pass
- Chromium (local Chrome CDP): Gallery, Uploads, canvas, inspector, Auto Build, command-bar zoom, mobile bar present. Add to Sheet not clicked (empty library). No live Shopify session.

**C. Task #5 color work** (user record 2026-09-18 09:10, previously run — Vite workflow, not this tree)

- 30 logic tests
- 12 end-to-end export tests
- Chromium, Firefox, and WebKit ICC color test
- TypeScript typecheck
- Production Vite build with `PORT=22507` `BASE_PATH=/`
- Clean workflow restart; no current browser-console errors

---

## Installation, local startup, and test commands

```text
copy .env.example .env
npm install
npx prisma migrate dev
npm test
npm run typecheck
npm run build
npm run dev
```

Optional:

```text
npm run setup:dev-store
npm run setup:dev-all
npm run e2e
npm run e2e:full
npm run e2e:checkout
npm run e2e:builder
npm run worker:tick
```

Dev editor auth (browser console on an editor page): set `sessionStorage` keys `lgs_test_token` (same value as `TEST_API_TOKEN`) and `lgs_shop` (development shop domain).

Editors: `/editor/gang-sheet`, `/editor/upload-by-size`.  
Theme blocks use app proxy `/apps/legends-bags/`.

---

## Required environment variable names (no values)

- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SCOPES`
- `SHOPIFY_APP_URL`
- `FILE_SIGNING_SECRET`
- `REMOVE_BG_API_KEY` (optional)
- `DATABASE_URL`
- `DEV_SHOP`
- `TEST_API_TOKEN`
- `RENDER_INLINE_ON_WEBHOOK`
- `LOCAL_STORAGE_ROOT`
- `HOST`
- `PORT` (platform-provided on Railway)
- `RAILWAY_PUBLIC_DOMAIN` (platform-provided)

Copy `.env.example` → `.env`. Never commit `.env` or secrets.

---

## Project storage format and code locations

**Format:** Prisma schema (`prisma/schema.prisma`). Local/dev database is SQLite via `DATABASE_URL=file:./dev.sqlite` (`prisma/dev.sqlite`, gitignored). Non-local target is PostgreSQL with the same schema.

**Artwork binaries:** local object store under `LOCAL_STORAGE_ROOT` (default `./storage/local`, gitignored except `.gitkeep`). Keys:

- originals: `{shopHash16}/assets/{assetId}/original`
- production PNG: `{shopHash16}/designs/{designId}/outputs/{jobId}/sheet.png`
- preview: `{shopHash16}/designs/{designId}/outputs/{jobId}/preview.png`

`shopHash16` is the first 16 hex chars of SHA-256(`shop`). Design layout is versioned JSON (`DesignStateV1`) on `DesignVersion.stateJson`, not the output PNG.

**Artwork processing**

- Ingest/validate: `app/domain/design/upload.ts`
- Pipeline (nest + render from originals): `app/domain/design/pipeline.ts`
- Gallery records: `app/services/gallery-service.ts`
- Upload/upscale/background-remove routes: `app/routes/api.uploads.ts`, `app/routes/api.assets.$assetId.upscale.ts`, `app/routes/api.assets.$assetId.remove-background.ts`

**Nesting**

- `app/domain/nesting/index.ts`
- Preview API: `app/routes/api.nest.preview.ts`

**Export / production render**

- `app/domain/rendering/index.ts` (`renderSheetPng`, preview)
- Tall sheets: `app/domain/rendering/tiled.ts`
- Jobs: `app/domain/jobs` + `app/routes/api.worker.tick.ts` + `scripts/worker-tick.ts`
- Downloads: `app/routes/api.files.download.ts`

**Editor UI (this builder surface)**

- `app/routes/editor.gang-sheet.tsx`
- `app/components/editor/gang-sheet/`
- `app/components/editor/workflow/`
