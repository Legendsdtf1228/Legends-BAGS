# Legends BAGS

Production-grade Shopify app replacing **Build a Gang Sheet (BAGS)** for Legends DTF Prints.

**Repository:** [github.com/Legendsdtf1228/Legends-BAGS](https://github.com/Legendsdtf1228/Legends-BAGS)

This app must **not** uninstall live BAGS, change the production store, process real customer orders, or deploy without explicit approval. Use a dedicated **development** store and the **Legends BAGS Dev** Partner app only.

## Features

### Upload by Size (~66% of sheet volume)

Multi-design queue with presets, custom dimensions, aspect lock, quantity, and live server-side pricing.

- Editor: `/editor/upload-by-size`
- Theme block: **LGS Upload by Size**

### Gang Sheet Builder (~34% of sheet volume)

Canvas editor with drag, resize, rotate, duplicate, fill, auto-arrange, and undo/redo.

- Editor: `/editor/gang-sheet`
- Theme block: **LGS Gang Sheet Builder**

### Auto Build

BAGS-style workflow: upload all images → set size & quantity → **live auto-nest preview** → build the sheet on canvas.

- Nest preview API: `POST /api/nest/preview`
- Quote API: `POST /api/quote`

### Pipeline

Upload → design state → cart line properties → order webhook → nest → transparent **300 DPI PNG** → merchant dashboard preview / download / retry.

## Quick start (development)

1. Copy `.env.example` to `.env` and fill Shopify Partner credentials for a **development** store.
2. `npm install`
3. `npx prisma migrate dev`
4. `npm test`
5. `npm run dev` (Shopify CLI; requires Partner auth)

### Theme blocks

Extension: `extensions/upload-by-size`

| Block | Route |
|---|---|
| LGS Upload by Size | `/editor/upload-by-size` |
| LGS Gang Sheet Builder | `/editor/gang-sheet` |

Set each block’s **Editor base URL** to your app tunnel URL (from `shopify app dev`).

### Dev store setup

After installing the app in Admin:

- Open `/app/setup` to create test products and product bindings, **or**
- Run `npm run setup:dev-store`

### Dev editor auth

In the browser console on an editor page:

```js
sessionStorage.setItem('lgs_test_token', '…same as TEST_API_TOKEN…')
sessionStorage.setItem('lgs_shop', 'your-dev-shop.myshopify.com')
```

## Scripts

| Command | Purpose |
|---|---|
| `npm test` | Unit + integration tests (Vitest) |
| `npm run e2e` | Vertical slice pipeline smoke test |
| `npm run e2e:full` | Full API E2E (upload, quote, nest, render) |
| `npm run setup:dev-store` | Create dev-store products via Admin API |
| `npm run worker:tick` | Process one render job manually |

## Documentation

- [Architecture](docs/architecture/README.md)
- [API contracts](docs/architecture/api-contracts.md)
- [Setup & parallel testing](docs/operations/setup-and-parallel-testing.md)
- [Production readiness](docs/operations/production-readiness.md)
- [Known limitations](docs/operations/known-limitations.md)
- [ADRs](docs/adr/)

## Safety

- Synthetic artwork and test customers only
- No secrets, tokens, customer PII, or artwork URLs in git / fixtures / logs
- Live BAGS remains installed until parallel validation and explicit cutover approval

## Defaults (from live BAGS audit)

| Parameter | Value |
|---|---|
| Printer width | 22.5 in |
| Max sheet height | 360 in |
| Price | $0.049 / in² |
| Image margin | 0.15 in |
| Artboard margin | 0.1 in |
| Output | Transparent PNG @ 300 DPI |
