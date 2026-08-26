# Migration & rollback plan

## Apply (dev)

```bash
npx prisma migrate deploy
# or interactive:
npx prisma migrate dev
```

## Rollback strategy

SQLite/dev: restore from backup file `prisma/dev.sqlite.bak` taken before migrate, or delete DB and re-deploy migrations from a known good revision.

PostgreSQL (future): write explicit down migrations or restore from PITR snapshot. Prefer forward-fix migrations over destructive downs for design/render tables.

## Data preservation

- Never delete `Asset` originals or successful `RenderJob` outputs during app rollback
- BAGS remains source of truth for live orders until cutover approval
- Theme block can be removed without dropping database tables
