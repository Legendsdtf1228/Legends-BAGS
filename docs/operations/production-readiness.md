# Production readiness checklist

Status legend: `[ ]` open · `[x]` done · `[~]` partial

## Phase 1 vertical slice

- [x] Architecture + ADRs documented
- [x] Agent ownership plan under `.cursor/agents/`
- [x] Design state schema v1 frozen
- [x] Pricing (area × rate) with server verification helpers
- [x] Rectangle nesting with margins + deterministic tests
- [x] 300 DPI transparent PNG renderer + reprocess-width regression test
- [x] Signed expiring download tokens
- [x] Prisma models for designs, jobs, webhooks, audit
- [x] Upload + design API routes (dev token gate)
- [x] Theme app extension launcher
- [x] Upload-by-Size editor UI
- [x] orders/paid + orders/updated webhook handlers
- [x] Merchant dashboard list + detail/retry
- [x] Automated tests for core domain (run `npm test`)
- [x] Prisma pipeline integration test (upload→webhook→render)
- [x] Tiled renderer for tall sheets (auto above ~40MP)
- [x] Local SQLite migrations applied
- [ ] End-to-end Shopify checkout on a **dev** store
- [ ] RIP import validation of generated PNG
- [ ] Mobile interaction QA on real devices
- [ ] App proxy auth replacing TEST_API_TOKEN for storefront
- [ ] PostgreSQL + S3 for non-local environments
- [ ] Security review sign-off
- [ ] Explicit approval before production install / traffic

## Never without approval

- [ ] Production store install
- [ ] BAGS uninstall
- [ ] Billing changes
- [ ] Processing real customer orders / artwork
