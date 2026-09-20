# Merchant platform V1

Legends-BAGS is the merchant, commerce, and production system. Gang Sheet Studio remains the authoritative customer-facing builder. The merchant app may configure, launch, and receive project results from Studio; it must not duplicate Studio's canvas, nesting, Auto Build, Auto Fill, or artwork tools.

## Merchant routes

| Route | Status | Data source |
|---|---|---|
| `/app` | Implemented | Real designs, orders, render jobs, product bindings |
| `/app/products` | Implemented | Shopify catalog and `ProductBinding` |
| `/app/products/:bindingId` | Implemented | Real product binding configuration |
| `/app/designs` | Implemented | `Design`, `DesignVersion`, `OrderLink`, `RenderJob` |
| `/app/designs/:designId` | Implemented | Versioned design state, signed previews/downloads, render history |
| `/app/orders` | Implemented | Shopify-synchronized `OrderLink` and render state |
| `/app/orders/:orderLinkId` | Implemented | Customer, design, production output, signed download, retry |
| `/app/settings` | Implemented | Configuration and integration readiness |
| `/app/appearance` | Implemented | Persisted branding with live preview |
| `/app/production` | Implemented | Shop production defaults |
| `/app/integrations` | Implemented | Shopify and Studio bridge readiness |

Existing advanced operations routes remain available but are no longer primary navigation items.

## Brand system

The merchant shell uses reusable CSS variables defined by the shared merchant token module. Legends defaults are restrained Vegas Gold, charcoal/black, white, warm neutral surfaces, and semantic success/warning/danger colors. Gold is used for selection and emphasis rather than long body text.

Shop-level customer branding is stored on `ShopConfig`:

- business display name
- primary, light, and dark logo URLs
- favicon URL
- primary, secondary, background, button, and text colors
- launcher labels and welcome copy

Color values are validated as six-digit hex colors. Asset references must be full HTTP(S) URLs. Direct logo upload is intentionally contract-ready rather than implemented until a private, tenant-safe storage flow is approved.

## BAGS to Studio branding contract

The existing Studio bootstrap response now includes a versioned `branding` object:

```json
{
  "version": 1,
  "storeName": "Legends DTF Prints",
  "logoUrl": null,
  "logoLightUrl": null,
  "logoDarkUrl": null,
  "faviconUrl": null,
  "primaryColor": "#C9A227",
  "accentColor": "#8A6D12",
  "backgroundColor": "#FFFFFF",
  "buttonColor": "#171717",
  "textColor": "#171717",
  "welcomeTitle": "Welcome to Legends BAGS",
  "welcomeSubtitle": "Upload artwork, arrange on the sheet, then save to cart.",
  "attribution": {
    "visible": true,
    "label": "Powered by Legends-BAGS",
    "controlledBy": "platform"
  }
}
```

This sprint adds the BAGS-side contract only. Gang Sheet Studio must explicitly adopt the contract in its separate repository before these values alter the Studio UI. Platform attribution is not merchant-controlled.

## Production workflow

Shopify order webhooks create tenant-scoped order links and enqueue render jobs. The merchant app displays the real render state and failure message, supports approved retries, and exposes output only through existing signed download URLs. Raw storage paths are never rendered.

## Run locally

1. Configure Shopify Partner credentials for the dedicated **Legends BAGS Dev** app and a Shopify development store only.
2. Set `DATABASE_URL=file:./prisma/dev.sqlite` and the values documented in `.env.example`.
3. Run `npm run setup`.
4. Run `npm run dev`.
5. Open the app through Shopify Admin and review `/app`, `/app/products`, `/app/designs`, `/app/orders`, and `/app/settings`.

Do not connect this branch to the production store and do not deploy it without explicit approval.