# Agent ownership plan

Non-overlapping file ownership for parallel work. Cross-cutting changes require orchestrator approval of interface first.

| Agent | Owns | Must not edit |
|---|---|---|
| **architecture** | `docs/architecture/**`, `docs/adr/**`, `app/domain/design/**`, Prisma schema contracts | Feature UI, nesting algorithms, Shopify TOML without ADR |
| **shopify** | `app/routes/webhooks.*`, `app/routes/auth.*`, `app/shopify.server.ts`, `shopify.app.toml`, `extensions/**`, cart property helpers | Nesting, rendering pixel math, pricing formulas |
| **upload-by-size** | Upload UI, `app/domain/pricing/**`, size presets, customer upload routes under `app/routes/api.upload*`, `app/routes/api.designs*` | Merchant dashboard, worker internals |
| **nesting** | `app/domain/nesting/**`, nesting tests | Shopify routes, rendering compositing |
| **rendering** | `app/domain/rendering/**`, golden fixtures under `tests/golden/**`, sharp pipeline | Pricing UI, theme extensions |
| **operations** | `app/routes/app.*` dashboard, `app/domain/jobs/**`, retry/bulk download UX, `docs/operations/**` | Editor canvas, nesting math |
| **qa-security** | `app/domain/security/**`, security tests, readiness checklist reviews | Product feature code except security wrappers |

## Reporting format (every subagent)

1. Assumptions  
2. Files changed  
3. Tests run + results  
4. Unresolved risks  

## Interface freeze (before parallel edits)

Frozen in `docs/architecture/api-contracts.md` and `app/domain/design/types.ts`:

- `DesignStateV1`
- Pricing function signature
- Nesting input/output types
- RenderJob payload
- Cart property names `_lgs_design_id`, `_lgs_design_version`
