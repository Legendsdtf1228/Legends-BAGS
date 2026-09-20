# Legends-BAGS Cursor Continuation Checkpoint

## Repository checkpoint

- Branch: `feature/merchant-platform-v1`
- Base branch: `origin/integration/dev-studio-builder`
- Base SHA: `da87e89d350b1728cd615aef1ec7ae6c6c4f018b`
- Core merchant implementation commit: `65bc4337a20fd8e4b5464a1ff9511dca10a0b82b`
- Do not merge or deploy from this checkpoint.
- Do not modify production Shopify or Gang Sheet Studio.

## Commits created

1. `3487a67` — Add massive merchant platform asset file
2. `2706be8` — Add merchant branding contract and persistence
3. `7299e39` — Build merchant operations and settings experience
4. `b8e664c` — Document merchant platform and Replit setup
5. `65bc433` — Complete merchant core workflows
6. `554e319` — Add Cursor continuation checkpoint

## Completed P0 functionality

- Merchant shell and navigation for Dashboard, Products, Designs, Orders, Production, Settings, Integrations, Appearance, and Shop Builder.
- Real dashboard aggregates without hardcoded demo metrics.
- Shopify catalog discovery, search, product synchronization, and variant-level binding.
- Merchant-managed ProductBinding creation, configuration, enable/disable, and removal.
- Gang Sheet Studio product dimensions and pricing configuration.
- Server-enforced launch readiness: binding enabled, Shopify product active, and fixed gang-sheet length present.
- Designs/projects list and detail with versions, previews, audit history, render history, reorder copy, reprocess, and signed downloads.
- Orders list/detail with customer, payment, fulfillment, Shopify link, linked design/version, production status, retry, and signed downloads.
- Purchased orders render the immutable `OrderLink.designVersion`.
- Production settings and operational queue with counts, errors, stale state, guarded retry, and design/order links.
- Tenant-scoped render queue, database active-job deduplication, lease recovery/fencing, and attempt-specific output keys.
- Retriable Shopify webhook delivery lifecycle (`processing`, `processed`, `failed`) with idempotent order-link upserts.
- Shopify API/webhook configuration aligned to `2025-10`.
- Merchant branding persistence and Studio bootstrap contract are preserved without extending Studio branding.

## Current DEV environment

- Existing app: **Legends BAGS Dev**
- Existing store: `legends-bags-in2lwdll.myshopify.com`
- Existing BAGS DEV deployment is already connected to Shopify.
- The DEV storefront has already been proven to launch BAGS and open Gang Sheet Studio after ProductBinding.
- Do not create another Shopify app, Partner credential set, DEV store, or deployment.
- Live embedded validation can continue separately in this existing environment.

## Partial or intentionally deferred work

- Full embedded order-to-production validation remains separate follow-on work in the existing DEV environment.
- Branding settings and contracts exist, but advanced white-label polish, Studio branding application, and advanced logo storage are intentionally deferred.
- The render queue is safe, but continuous production processing still needs a durable scheduled worker configuration.

## Remaining P0 work

1. Integrate this branch into the current DEV BAGS integration branch outside this checkpoint.
2. Register or refresh existing DEV webhooks with `npm run setup:dev-webhooks` if needed.
3. Create a DEV order and verify order/design association, purchased-version rendering, queue status, retry, and signed PNG download.
4. Configure and validate a continuously scheduled protected render worker.

## Remaining lower-priority work

- P1: Merchant-facing empty-state and responsive polish.
- P1: Additional operational observability and worker health presentation.
- P2: Advanced logo upload/storage workflow.
- P2: Additional merchant branding controls and white-label polish.
- P2: Apply merchant branding inside Gang Sheet Studio only if that separate application explicitly adopts the bootstrap contract.
- P3: Animations, cosmetic refactors, and pixel-perfect visual passes.

## Integration handoff

Integrate the commits on `feature/merchant-platform-v1` into the current DEV BAGS
integration branch; do not perform that integration here:

- `2706be8`, `7299e39`, `b8e664c`, and `65bc433` contain the merchant platform work.
- `554e319` contains this handoff update.
- Preserve the existing Studio bridge and DEV storefront fixes from the current integration branch.
- Resolve conflicts by preserving the current Studio launch contract and applying the merchant-side ProductBinding, order, and production changes around it.
- Do not cherry-pick or merge the branch automatically from this checkpoint.

Expected conflict areas:

- `app/routes/builder.tsx` and `app/routes/app.shop-builder.tsx`: preserve the working DEV Studio redirect/bridge behavior.
- `app/lib/editor-config.server.ts` and `app/routes/api.studio-bootstrap.tsx`: preserve the Studio bootstrap contract while retaining active/enabled binding checks.
- `shopify.app.toml` and webhook routes: preserve existing DEV app configuration, then reconcile merchant webhook topics without creating a second app.
- `app/services/design-service.ts`: retain tenant isolation, purchased-version pinning, queue deduplication, lease fencing, and webhook retry behavior.

## Unfinished-work locations

- `app/routes/app.products.tsx`
- `app/routes/app.products.$bindingId.tsx`
- `app/routes/builder.tsx`
- `app/routes/api.studio-bootstrap.tsx`
- `app/routes/app.production.tsx`
- `app/routes/api.worker.tick.tsx`
- `app/lib/order-webhook.server.ts`
- `app/services/design-service.ts`
- `app/services/shopify-product-sync.server.ts`
- `scripts/setup-dev-webhooks.mjs`
- `shopify.app.toml`

## Database and migrations

- `20260920010000_merchant_branding`: merchant appearance fields.
- `20260920020000_product_binding_enabled`: explicit ProductBinding enabled state.
- `20260920021000_active_render_job_uniqueness`: one queued/processing render per shop/design/order target.
- `20260920022000_disable_incomplete_bindings`: disables incomplete existing gang-sheet bindings.

## Changed APIs and routes

- Merchant routes for dashboard, products, product detail, designs, design detail, orders, order detail, production, settings, integrations, appearance, and shop builder.
- `api.studio-bootstrap` exposes the existing merchant/commerce bootstrap contract.
- Builder resolution enforces active, enabled, correctly configured bindings.
- Order create/paid webhook routes use shop-scoped queue processing.
- DEV webhook setup covers order create/paid/updated/cancelled and product create/update/delete.

## Verification at checkpoint

- Prisma migrations: passed.
- Typecheck: passed (`npm run typecheck`).
- Tests: passed, 47 files and 296 tests (`DATABASE_URL='file:./dev.sqlite' npm test`).
- Production build: passed (`DATABASE_URL='file:./dev.sqlite' npm run build`).
- Targeted ESLint: passed; tooling prints an existing TypeScript-version compatibility warning.
- `git diff --check`: passed.

## Known issues and constraints

- No confirmed application bug remains in the locally exercised core workflow.
- Full order-to-production behavior still requires validation in the existing DEV app/store.
- Build reports an informational Vite warning because `design-service.ts` is both statically and dynamically imported.
- Do not use production Shopify credentials, deploy, merge, or modify Gang Sheet Studio during continuation.

## Resume commands

```bash
git checkout feature/merchant-platform-v1
npm install
DATABASE_URL='file:./dev.sqlite' npx prisma migrate deploy
npm run typecheck
DATABASE_URL='file:./dev.sqlite' npm test
DATABASE_URL='file:./dev.sqlite' npm run build
```

For existing DEV-store validation:

```bash
npm run setup:dev-webhooks
```

## Cursor continuation prompt

```text
Continue Legends-BAGS from branch feature/merchant-platform-v1, based on
origin/integration/dev-studio-builder at
da87e89d350b1728cd615aef1ec7ae6c6c4f018b.

Read docs/CURSOR_CONTINUATION.md and replit.md first. The P0 merchant core is
implemented and locally verified. Do not repeat completed merchant shell,
dashboard, ProductBinding, design/order association, production queue, or
settings work.

Prioritize only:
1. Integrating this branch into the current DEV BAGS integration branch without
   creating another Shopify app, store, deployment, or credential set.
2. End-to-end validation in the existing DEV environment:
   product binding -> Studio launch -> cart/order -> linked
   design -> purchased-version render -> signed PNG download.
3. A durable protected render worker if validation confirms it is needed.
4. Fix only P0 defects discovered by those checks.

Do not create another Shopify app, store, deployment, or credential set.
Do not deploy from Replit, modify production Shopify, modify Gang Sheet Studio,
or spend time on branding polish, logo infrastructure, animations, cosmetic
refactors, or optional features.

Before changing code, run:
  DATABASE_URL='file:./dev.sqlite' npx prisma migrate deploy
  npm run typecheck
  DATABASE_URL='file:./dev.sqlite' npm test

Preserve these invariants:
- Every merchant/service operation is shop-scoped.
- Exact Shopify variants cannot fall through to another variant.
- Only ACTIVE, enabled, fully configured gang-sheet bindings launch.
- Order rendering uses OrderLink.designVersion.
- Order renders never overwrite current standalone design preview/status.
- At most one queued/processing render exists per shop/design/order target.
- Render completion is lease-fenced and each attempt uses unique object keys.
- Webhook retries can recover failed or stale processing deliveries.

After DEV validation, record exact results and remaining blockers in this
handoff file, make a small logical commit, and push the same feature branch.
```