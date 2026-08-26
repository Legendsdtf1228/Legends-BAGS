# Legends Gang Sheet

Production-grade Shopify app replacing **Build a Gang Sheet (BAGS)** for Legends DTF Prints.

This repository is the `legends-gang-sheet` application. It must **not** uninstall BAGS, change the live store, process real customer orders, or deploy to production without explicit approval.

## Phase 1 vertical slice

Upload-by-Size → server pricing → signed design ID on cart → order webhook → nest → transparent 300 DPI PNG → merchant dashboard preview/download/retry.

## Quick start (development)

1. Copy `.env.example` to `.env` and fill Shopify Partner app credentials for a **development** store only.
2. `npm install`
3. `npx prisma migrate dev --name phase1`
4. `npm test`
5. `npm run dev` (Shopify CLI; requires Partner auth)

### Theme block

Extension `extensions/upload-by-size` launches `/editor/upload-by-size`. Set the block’s **Editor base URL** to your app tunnel URL.

### Dev editor auth

In the browser console on the editor page:

```js
sessionStorage.setItem('lgs_test_token', '…same as TEST_API_TOKEN…')
sessionStorage.setItem('lgs_shop', 'your-dev-shop.myshopify.com')
```

## Documentation

- [Architecture](docs/architecture/README.md)
- [API contracts](docs/architecture/api-contracts.md)
- [Agent ownership](docs/architecture/agent-ownership.md)
- [Setup & parallel testing](docs/operations/setup-and-parallel-testing.md)
- [Production readiness](docs/operations/production-readiness.md)
- [ADRs](docs/adr/)

## Safety

- Synthetic artwork and test customers only
- No secrets, tokens, customer PII, or artwork URLs in git/fixtures/logs
- Live BAGS remains installed until parallel validation + explicit cutover approval
