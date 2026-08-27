# Railway deployment

Deploy the Legends BAGS Shopify app to Railway for a stable public URL (staging / parallel testing against a development store). This guide uses **SQLite on a Railway volume** — not Postgres.

## Prerequisites

- GitHub repo connected to Railway
- Shopify Partner app credentials (Legends BAGS Dev or a dedicated staging app)
- A Shopify **development** store (never production)

## 1. Create the Railway project

1. In [Railway](https://railway.com), create a **New Project** → **Deploy from GitHub repo**.
2. Select `legends-gang-sheet` (or your fork).
3. Railway detects `railway.toml` and builds with the **Dockerfile**.

## 2. Add a persistent volume

SQLite and uploaded files must survive redeploys.

1. Open the service → **Volumes** → **Add Volume**.
2. Mount path: `/data`
3. Size: start with **1 GB** (increase if you store many render outputs).

The app expects:

| Path | Purpose |
|------|---------|
| `/data/prod.sqlite` | SQLite database |
| `/data/storage` | Local object store (uploads, PNG outputs) |

`scripts/ensure-data-dirs.mjs` creates these directories on container start.

## 3. Required environment variables

Set these in the Railway service **Variables** tab:

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | `file:/data/prod.sqlite` |
| `LOCAL_STORAGE_ROOT` | `/data/storage` |
| `SHOPIFY_API_KEY` | From Partner Dashboard → App → Client credentials |
| `SHOPIFY_API_SECRET` | Same |
| `SCOPES` | `read_products,write_products,read_orders,read_themes` |
| `SHOPIFY_APP_URL` | `https://<your-service>.up.railway.app` (see below) |
| `FILE_SIGNING_SECRET` | Random string, min 16 chars |
| `TEST_API_TOKEN` | Random string for editor/E2E testing on staging |
| `DEV_SHOP` | `your-dev-store.myshopify.com` |

Optional:

| Variable | Notes |
|----------|-------|
| `RENDER_INLINE_ON_WEBHOOK` | `1` to process one render job per `orders/paid` webhook (simpler staging without a separate worker) |
| `REMOVE_BG_API_KEY` | remove.bg API key if using cloud background removal |

### `SHOPIFY_APP_URL`

1. Open the service → **Networking** → **Generate Domain** (required before the app can start).
2. Either leave `SHOPIFY_APP_URL` unset and let the app derive it from Railway's `RAILWAY_PUBLIC_DOMAIN`, **or** set it explicitly:

```
SHOPIFY_APP_URL=https://<your-service>.up.railway.app
```

**No trailing slash.** If you see `Detected an empty appUrl configuration`, you are missing a public domain and/or this variable.

`HOST=0.0.0.0` and `PORT` are handled by the Dockerfile and Railway; do not override unless debugging.

## 4. Deploy

Push to the connected branch (or trigger **Redeploy**). On start, the container runs:

```
node scripts/ensure-data-dirs.mjs
prisma generate && prisma migrate deploy
react-router-serve ./build/server/index.js
```

Health check: `GET /` returns `200 ok`.

Check **Deploy Logs** for migration errors or missing env vars.

## 5. Update Shopify Partner app URLs

In [Shopify Partners](https://partners.shopify.com) → your app → **Configuration**:

| Setting | Value |
|---------|-------|
| **App URL** | `https://<your-railway-domain>` |
| **Allowed redirection URL(s)** | `https://<your-railway-domain>/auth/callback` and `https://<your-railway-domain>/auth` |
| **App proxy** | Subpath `legends-bags`, prefix `apps`, URL `https://<your-railway-domain>/apps/legends-bags` |

Match `shopify.app.toml` (`[auth]`, `[app_proxy]`) — update the TOML if you use `shopify app deploy` for extensions.

## 6. Install on the development store

1. Open `https://<your-railway-domain>/auth?shop=your-dev-store.myshopify.com` or install from Partners → **Test your app**.
2. Complete OAuth.
3. Open **Admin → Apps → Legends BAGS** — confirm embedded app loads.

## 7. Theme extension & blocks

Theme blocks are deployed separately from the web service:

```bash
# From your machine, with Partner CLI auth
shopify app deploy
```

In the **Online Store theme editor**:

1. Add **LGS Upload by Size** and/or **LGS Gang Sheet Builder** to test product templates.
2. Set each block's **Editor base URL** to your Railway `SHOPIFY_APP_URL` (same as `/app/setup` in Admin).
3. Add **LGS Cart Edit Design** to the cart template if testing cart return flows.

Or use **Admin → Legends BAGS → Setup** for the Editor base URL and step-by-step checklist.

## 8. Verify

- [ ] `GET https://<domain>/` → `ok`
- [ ] Admin app loads embedded in Shopify Admin
- [ ] Theme editor opens upload/gang-sheet builder via `/builder`
- [ ] Upload → save design → add to cart (dev store)
- [ ] Place test order → webhook → render job → download from merchant dashboard

### `/builder` smoke test

After `npm run setup:dev-all` and Railway deploy:

```bash
LGS_APP_URL=https://<domain> DEV_SHOP=your-dev-store.myshopify.com npm run e2e:builder
```

Print example launch URLs from local DB:

```bash
LGS_APP_URL=https://<domain> DEV_SHOP=your-dev-store.myshopify.com npm run print:builder-urls
```

Example URL shape:

```text
https://<domain>/builder?shop=your-dev-store.myshopify.com&product=PRODUCT_ID&variant=VARIANT_ID&quantity=1&shop_mode=1
```

For API smoke tests from your machine:

```bash
LGS_APP_URL=https://<domain> TEST_API_TOKEN=<token> FILE_SIGNING_SECRET=<secret> npm run e2e
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Detected an empty appUrl configuration` | **Networking → Generate Domain**, then set `SHOPIFY_APP_URL=https://<domain>` or redeploy with app auto-detect from `RAILWAY_PUBLIC_DOMAIN` |
| Health check fails | Check deploy logs; confirm `HOST=0.0.0.0` and service listens on Railway's `PORT` |
| `DATABASE_URL` / migration errors | Volume mounted at `/data`; `DATABASE_URL=file:/data/prod.sqlite` |
| OAuth redirect mismatch | Partner redirect URLs must exactly match Railway domain + `/auth` paths |
| App proxy 404 | Confirm proxy URL in Partners matches `SHOPIFY_APP_URL` + `/apps/legends-bags` |
| Upload/render failures | `LOCAL_STORAGE_ROOT=/data/storage` and volume mounted |
| Data lost after redeploy | Volume not attached or wrong mount path (`/data`) |

## Local parity

Local `.env` uses `DATABASE_URL="file:./dev.sqlite"` and `LOCAL_STORAGE_ROOT=./storage/local` (see `.env.example`). Railway uses absolute paths on the `/data` volume.
