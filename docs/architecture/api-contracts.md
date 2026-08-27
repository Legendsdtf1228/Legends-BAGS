# API contracts — Phase 1

Base path: `/api` (customer/editor) and `/app` (merchant Admin).  
All customer endpoints require a valid design session token or Shopify app proxy / theme extension signature as configured. Phase 1 uses signed design tokens for local/dev testing.

## Types

```ts
type DesignStatus = "draft" | "in_cart" | "ordered" | "processing" | "completed" | "failed";

type SizeSelection =
  | { mode: "preset"; presetId: string; quantity: number }
  | { mode: "custom"; widthIn: number; heightIn: number; lockAspect: boolean; quantity: number };

type DesignStateV1 = {
  schemaVersion: 1;
  workflow: "upload_by_size" | "gang_sheet";
  sheet: { widthIn: number; maxHeightIn: number; imageMarginIn: number; artboardMarginIn: number };
  items: Array<{
    assetId: string;
    widthIn: number;
    heightIn: number;
    quantity: number;
    rotationDeg: 0 | 90; // nesting may rotate 90° when allowed
    /** Gang sheet manual layout — inches from sheet origin (top-left). */
    xIn?: number;
    yIn?: number;
  }>;
  pricing: { currency: "USD"; pricePerSqIn: number; areaSqIn: number; totalCents: number };
  /** `manual` preserves item xIn/yIn; `auto` (default) runs nesting. */
  layout?: "auto" | "manual";
  allowRotate90?: boolean;
};
```

## Customer / editor

### `POST /api/uploads`
Multipart: `file` (PNG/JPEG).  
Validates format, dimensions, declared/computed DPI.  
Returns `{ assetId, widthPx, heightPx, dpi, previewUrl }` (previewUrl is short-lived signed).

### `POST /api/designs`
Body: `{ assetId, size: SizeSelection, productGid? }`  
Server computes physical size (preset or custom + aspect lock), area, price.  
Persists Design + DesignVersion.  
Returns `{ designId, version, state, price }`.

### `GET /api/designs/:designId`
Returns current design metadata + latest state (no raw storage keys).

### `POST /api/designs/:designId/quote`
Recomputes price from proposed size; does not persist unless `commit: true`.

### Cart attachment
Theme extension writes line item property:
- `_lgs_design_id` = designId
- `_lgs_design_version` = version number (optional)

## Webhooks

### `orders/paid` (and `orders/create` as backup)
- Verify Shopify HMAC
- Idempotency key: `shop + orderId + topic`
- For each line with `_lgs_design_id`, link OrderDesign and enqueue nest+render if not already queued
- Duplicate deliveries must no-op safely

### `orders/updated`
Reconcile edits: newly added design lines enqueue; removed lines marked cancelled (do not delete outputs).

## Merchant

### `GET /app/orders` — list with processing states  
### `GET /app/designs/:designId` — detail, preview, audit  
### `POST /app/designs/:designId/retry` — re-enqueue failed/completed regenerate  
### `GET /api/files/download?…` — HMAC signed download of original or output

## Jobs

Payload `{ designId, orderId?, attempt, reason }`  
Steps: load state → nest → render 300 DPI PNG → write preview → mark completed/failed.  
Failed jobs retain last error code; retry resets to processing without mutating prior successful outputs until new output succeeds.
