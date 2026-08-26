# Legends Gang Sheet — Architecture

**Product:** Replacement for Build a Gang Sheet (BAGS) for Legends DTF Prints  
**Code name:** `legends-gang-sheet`  
**Phase 1 focus:** Upload-by-Size vertical slice (≈66% of recent sheet volume)

## System boundaries

| Boundary | Responsibility |
|---|---|
| Shopify surfaces | OAuth, Admin embedded app, theme app extension, cart line properties, order webhooks |
| Design platform API | Uploads, design-state CRUD, pricing quotes, signed asset access |
| Nesting service | Deterministic rectangle packing with margins |
| Rendering worker | Transparent 300 DPI PNG generation, previews, retries |
| Object storage | Immutable originals + versioned design states + generated outputs |
| Merchant ops | Order/design dashboard, preview/download/retry |

Live BAGS and the production Shopify store remain untouched. This app runs only against development stores until explicit approval.

## Tenancy

Every row is scoped by `shop` (Shopify myshopify domain). Cross-shop reads are forbidden. Signed download URLs bind `shop` + `objectKey` + expiry + HMAC.

## Design identity

- `designId` — public opaque ID (cuid) placed on cart lines as `_lgs_design_id`
- Design state is **versioned** and immutable once saved; edits create a new version
- Originals are never overwritten; regenerations write new output objects

## Event flow (Phase 1)

```
Upload PNG → validate → create Design(v1) → price server-side
  → customer adds product with _lgs_design_id
  → checkout → orders/paid webhook (idempotent)
  → enqueue nest+render job
  → transparent 300 DPI PNG + preview
  → merchant dashboard: processing | completed | failed
  → signed download / retry
```

## Physical defaults (Upload-by-Size)

Captured from the Aug 26 2026 live audit; overridable per product later.

| Parameter | Default |
|---|---|
| Printer width | 22.5 in |
| Max sheet height | 360 in |
| Price | $0.049 / in² |
| Image margin | 0.15 in |
| Artboard margin | 0.1 in |
| Output | Transparent PNG @ 300 DPI |
| Accepted uploads (Phase 1) | PNG, JPG/JPEG (SVG deferred to Phase 2 conversion path) |

## Packages (in-app modules)

| Module | Path | Owner agent |
|---|---|---|
| Pricing | `app/domain/pricing` | upload-by-size |
| Design state | `app/domain/design` | architecture / upload-by-size |
| Nesting | `app/domain/nesting` | nesting |
| Rendering | `app/domain/rendering` | rendering |
| Storage + signed URLs | `app/domain/storage`, `app/domain/security` | architecture / qa-security |
| Jobs | `app/domain/jobs` | operations |
| Shopify routes / webhooks | `app/routes/**`, `extensions/**` | shopify |
| Merchant UI | `app/routes/app.*` | operations |

## Security non-negotiables

- No secrets, tokens, customer PII, or artwork URLs in git, fixtures, logs, or docs
- Synthetic artwork and test shops only
- Webhook HMAC verification required
- Download links: HMAC + expiry; reject expired/tampered signatures
- Upload validation: MIME sniffing, max bytes, max pixel dimensions

## Related docs

- [API contracts](./api-contracts.md)
- [Data model](./data-model.md)
- [Agent ownership](./agent-ownership.md)
- [ADRs](../adr/)
- [Production readiness](../operations/production-readiness.md)
