# Setup and parallel testing

## Local setup

1. Use a Shopify **development** store — never the live Legends production shop for unapproved installs.
2. Create/link a custom app in Partners (or reuse the Legends Studio Partner app for sandbox only).
3. Configure `.env` from `.env.example`.
4. `npm install && npx prisma migrate dev`
5. `npm test` — required before claiming slice progress.
6. `npm run dev` — CLI tunnels the app; install on the **dev** store only.
7. Add the **LGS Upload by Size** theme app block to a development product template; set Editor base URL to the tunnel origin.

## Parallel production testing (later — approval required)

1. Keep BAGS installed and primary.
2. Install Legends Gang Sheet on a staging theme / hidden product only.
3. Run identical synthetic jobs through both systems.
4. Compare: pixel dimensions, transparency, aspect ratio, nesting bounds, filenames, order linkage, retry behavior.
5. RIP import both PNGs; confirm no scale drift.
6. Document differences; do not switch traffic until checklist is signed off.

## Recovery

- Failed jobs: merchant design page → **Retry / regenerate**
- Stuck `processing`: worker recovery requeues after lease expiry (`recoverStuckJobs`)
- Duplicate webhooks: `WebhookDelivery.idempotencyKey` no-ops repeats

## Rollback

- Unpublish theme block / unassign development product
- Leave BAGS as the customer path
- Retain DB + object storage for forensics; do not delete historical outputs during rollback
