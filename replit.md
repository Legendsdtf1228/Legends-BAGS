# Legends-BAGS on Replit

This repository is the merchant/business/commerce app. Gang Sheet Studio is a separate repository and remains the authoritative customer-facing builder. Do not recreate Studio features here.

## Development safety

- Use only the dedicated **Legends BAGS Dev** Shopify Partner app and a Shopify development store.
- Do not uninstall live BAGS, modify the production theme/store, process real customer orders, deploy, or merge without explicit approval.
- Keep `USE_STUDIO_BUILDER=1` limited to the approved development bridge.

## Setup and run

The app requires Shopify Partner credentials before its embedded merchant routes can run:

1. Add the secret values listed in `.env.example` through Replit Secrets.
2. Set `DATABASE_URL=file:./prisma/dev.sqlite`.
3. Run `npm run setup`.
4. Run `npm run dev`.

The primary merchant review route is `/app` inside the Shopify embedded app. Settings are at `/app/settings`.

## Verification

- `DATABASE_URL=file:./prisma/dev.sqlite npm test`
- `npm run typecheck`
- `npm run build`

Full-project lint currently includes pre-existing findings in customer editor and vendored Studio assets. Check merchant changes with targeted ESLint until that separate debt is resolved.