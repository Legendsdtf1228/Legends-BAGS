-- Extend commerce sync models for Shopify order and product parity
ALTER TABLE "ShopConfig" ADD COLUMN "lastProductSyncAt" DATETIME;
ALTER TABLE "ShopConfig" ADD COLUMN "lastProductSyncError" TEXT;

ALTER TABLE "ProductBinding" ADD COLUMN "productTitle" TEXT;
ALTER TABLE "ProductBinding" ADD COLUMN "productStatus" TEXT;
ALTER TABLE "ProductBinding" ADD COLUMN "productImageUrl" TEXT;
ALTER TABLE "ProductBinding" ADD COLUMN "variantTitle" TEXT;
ALTER TABLE "ProductBinding" ADD COLUMN "shopifyUpdatedAt" DATETIME;
ALTER TABLE "ProductBinding" ADD COLUMN "syncStatus" TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE "OrderLink" ADD COLUMN "orderNumber" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "productGid" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "variantGid" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "customerGid" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "customerName" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "builderType" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "sheetWidthIn" REAL;
ALTER TABLE "OrderLink" ADD COLUMN "sheetHeightIn" REAL;
ALTER TABLE "OrderLink" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "OrderLink" ADD COLUMN "financialStatus" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "fulfillmentStatus" TEXT;
ALTER TABLE "OrderLink" ADD COLUMN "paidAt" DATETIME;
ALTER TABLE "OrderLink" ADD COLUMN "cancelledAt" DATETIME;
ALTER TABLE "OrderLink" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "OrderLink_shop_orderNumber_idx" ON "OrderLink"("shop", "orderNumber");
