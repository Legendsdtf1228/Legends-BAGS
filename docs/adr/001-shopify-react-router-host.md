# ADR-001: Shopify React Router app as host

## Status
Accepted

## Context
We need an embedded Admin app, webhooks, and a theme extension. Legends already had an unused React Router Shopify template (`legends-studio`).

## Decision
Host Phase 1 in `legends-gang-sheet`, cloned from that template. Keep domain logic in `app/domain/**` so nesting/rendering stay testable without Shopify runtime.

## Consequences
- Fast OAuth/session/Prisma bootstrap
- Domain unit tests run via Vitest without `shopify app dev`
- Must keep secrets only in `.env` (gitignored)
