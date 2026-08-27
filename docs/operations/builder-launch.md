# `/builder` launch route

BAGS-compatible storefront entry point for the dev deployment.

## URL shape

```text
GET /builder?shop=legends-bags-in2lwdll.myshopify.com&product=PRODUCT_ID&variant=VARIANT_ID&quantity=1&shop_mode=1
```

The route validates input, resolves `ProductBinding`, and redirects to:

- `/editor/gang-sheet` when `builderType = gang_sheet`
- `/editor/upload-by-size` when `builderType = upload_by_size`

Launch context (`shop`, product/variant GIDs, quantity, `shop_mode`) is preserved on the editor URL.

## Development restriction

Until production rollout, `/builder` only accepts the shop configured in `DEV_SHOP`.

## Theme extension

Storefront blocks use `lgs-launcher.js`, which opens `/builder` with the current product, selected variant, quantity, and `shop_mode=1`.

## Railway variables

```text
SHOPIFY_APP_URL=https://upload-by-size-production.up.railway.app
DEV_SHOP=legends-bags-in2lwdll.myshopify.com
PORT=8080
HOST=0.0.0.0
```

See `docs/operations/railway-deploy.md` for the full checklist.
