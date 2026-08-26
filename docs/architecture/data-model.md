# Data model — Phase 1

Prisma + SQLite for local/dev. Production target: PostgreSQL (same schema).

## Entities

### ShopConfig
Per-shop defaults and feature flags.

### ProductBinding
Maps Shopify product/variant GID → builder type (`upload_by_size` | `canvas` later), dimensions, pricePerSqIn, margins.

### Asset
Uploaded artwork metadata. Binary lives in object storage under immutable key.  
Fields: id, shop, storageKey, contentType, byteSize, widthPx, heightPx, dpi, checksumSha256, createdAt.

### Design
Customer gang-sheet unit.  
Fields: id, shop, status, productGid?, variantGid?, currentVersion, createdAt, updatedAt.

### DesignVersion
Immutable snapshot.  
Fields: id, designId, version, stateJson (DesignStateV1), priceCents, areaSqIn, createdAt.

### OrderLink
Shopify order ↔ design.  
Fields: id, shop, orderId, orderGid, lineItemId, designId, designVersion, createdAt.  
Unique: `(shop, orderId, lineItemId, designId)`.

### RenderJob
Fields: id, shop, designId, orderLinkId?, status (`queued`|`processing`|`completed`|`failed`), attempt, lastError?, outputKey?, previewKey?, sheetWidthIn?, sheetHeightIn?, startedAt?, finishedAt?, createdAt, updatedAt.  
Idempotency: do not create a second active job for same design+orderLink while one is queued/processing.

### AuditEvent
Append-only. action, actorType (`system`|`staff`|`webhook`), entityType, entityId, metaJson (no PII/URLs), createdAt.

### WebhookDelivery
shop, topic, webhookId, orderId?, payloadHash, status, createdAt. Unique `(shop, webhookId)` when webhookId present; else `(shop, topic, payloadHash)`.

## Storage keys (never logged in full in production)

```
{shopHash}/assets/{assetId}/original
{shopHash}/designs/{designId}/v{n}/state.json
{shopHash}/designs/{designId}/outputs/{jobId}/sheet.png
{shopHash}/designs/{designId}/outputs/{jobId}/preview.png
```

`shopHash` = sha256(shop)[:16] — avoids putting myshopify domain in paths unnecessarily.
