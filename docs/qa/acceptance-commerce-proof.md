# Acceptance & Commerce Proof Sprint

Branch: `sprint/acceptance-commerce-proof`  
Starting `main` commit: `1a12f19` (Merge PR #10 — editor modern parity)

## Baseline (§1)

| Check | Result |
|-------|--------|
| Latest `main` pulled | Yes — `1a12f19` |
| PR #10 merged | Yes |
| PR #9 vs `main` | **Closed — superseded.** Only commit `7d40abf` was already absorbed via PR #10 (`5282fa2`, `e02caa4`). No unique required work to port. |
| Conflict markers | None found |
| Dev store | `legends-bags-in2lwdll.myshopify.com` |
| App | Legends BAGS Dev |

## Code changes on this branch

### Editor acceptance

- **Sheet shrink dialog** — Cancel / Resize sheet only / Scale layout to fit with undo support (`sheet-shrink-dialog.tsx`, `scaleItemsToSheet`).
- **Save dialog parity** — quantity, artwork count, DPI tier summary, overlap/OOB counts, preview, correlation ID on errors.
- **Gallery** — starts empty; loads merchant artwork from API with loading/error/retry (no fake seeded artwork).

### Commerce & ops

- **Order import** — `importRecentShopifyOrders()` via Admin GraphQL; **Import recent orders** on Orders page for missed-webhook reconciliation.
- **ShopConfig** — `lastOrderSyncAt`, `lastOrderSyncError` (migration `20260828120000_order_sync_fields`).
- **Correlation IDs** — `createRequestId`, `jsonError`, `jsonOk` on design save APIs.

### Tests added

- `tests/gang-sheet-helpers.test.ts` — sheet scale-to-fit
- `tests/request-context.test.ts` — correlation ID payloads
- `tests/cart-properties.test.ts` — upload-by-size cart properties

## Blocker fixes (2026-08-28)

| Blocker | Fix |
|---------|-----|
| Assign without variant GID | Auto-resolves single-variant products; multi-variant requires picker |
| UBS launcher error | Storefront always uses app proxy; ignores stale tunnel URLs in theme settings |
| Gang sheet 24→360 bug | Separated roll max (360) from canvas height; `resolveGangSheetHeight()` + 45 regression tests |
| Setup tunnel docs | Setup/README now document app-proxy-first; Editor base URL optional |
| Unpublished dev product | Setup → Publish dev test products to Online Store (+ `write_publications` scope) |


This sprint requires **browser-verified** end-to-end checkout for both builders. Automated tests alone do not satisfy completion.

| Area | Status | Notes |
|------|--------|-------|
| Admin routes load | **Needs browser pass** | Code paths exist; systematic click-through pending |
| Gang Sheet 22.5×36 four-copy scenario | **Needs browser** | Editor tooling ready; manual QA required |
| Save & Add to Cart | **Needs browser** | Save dialog + cart properties wired in code |
| Gang Sheet test checkout → order → render | **Needs browser** | Webhook + render pipeline exists from prior sprints |
| Upload-by-Size checkout → render | **Needs browser** | Same pipeline, separate workflow |
| Product sync UI | **Likely pass** | From prior commerce sprint; re-verify in browser |
| Order import/re-sync | **Implemented** | New import button; verify against dev store |
| Mobile editor | **Partial** | Shell exists; pinch/panel polish may remain |
| BAGS/Legends screenshot pairs | **Pending** | Required before claiming visual parity |
| Names & Numbers guided workflow | **Not complete** | Still CSV-oriented; out of scope for this checkpoint unless blocker |

## Verification commands

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm test
npm run typecheck
npm run build
cd extensions/upload-by-size && shopify theme check
```

## Verification results (automated)

| Check | Result |
|-------|--------|
| Migrations | 11 applied (incl. `20260828120000_order_sync_fields`) |
| Tests | **134 / 134 passed** |
| Typecheck | Pass |
| Build | Pass |
| Theme check | 5 files, no offenses |

## Development URLs (from running `npm run dev`)

| Item | Value |
|------|-------|
| App URL | `https://prints-explain-systems-authentication.trycloudflare.com` |
| Local URL | `http://localhost:56497/` |
| Theme extension preview | `http://127.0.0.1:9293` |
| App proxy | `https://legends-bags-in2lwdll.myshopify.com/apps/legends-bags/` |
| Gang Sheet builder | `https://legends-bags-in2lwdll.myshopify.com/apps/legends-bags/builder?type=gang_sheet` |
| Upload by Size | `https://legends-bags-in2lwdll.myshopify.com/apps/legends-bags/builder?type=upload_by_size` |
| Dev store | `legends-bags-in2lwdll.myshopify.com` |
| App name | Legends BAGS Dev |

## Development URLs (fill after `npm run dev`)

_(Superseded by table above when dev server is running.)_

## Evidence checklist (attach to PR)

- [ ] Gang Sheet Save & Add to Cart cart line properties screenshot
- [ ] Paid test order in Legends BAGS Orders
- [ ] Render completed + 300 DPI PNG download
- [ ] Upload-by-Size paid order + render
- [ ] Webhook activity log entries
- [ ] Mobile viewport screenshots (390×844 minimum)
- [ ] BAGS vs Legends comparison screenshots per §14

## Remaining blockers (honest)

1. Full browser acceptance not yet executed in this session.
2. Names & Numbers guided workflow (§5) not implemented — CSV-only remains.
3. Uploads grid/list depth and upload progress UI may be incomplete.
4. Visual comparison screenshots not yet captured.
