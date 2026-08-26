-- CreateTable
CREATE TABLE "ShopConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "pricePerSqIn" REAL NOT NULL DEFAULT 0.049,
    "sheetWidthIn" REAL NOT NULL DEFAULT 22.5,
    "maxHeightIn" REAL NOT NULL DEFAULT 360,
    "imageMarginIn" REAL NOT NULL DEFAULT 0.15,
    "artboardMarginIn" REAL NOT NULL DEFAULT 0.1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductBinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productGid" TEXT NOT NULL,
    "variantGid" TEXT,
    "builderType" TEXT NOT NULL DEFAULT 'upload_by_size',
    "pricePerSqIn" REAL,
    "sheetWidthIn" REAL,
    "maxHeightIn" REAL,
    "imageMarginIn" REAL,
    "artboardMarginIn" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "dpi" REAL,
    "checksumSha256" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "productGid" TEXT,
    "variantGid" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DesignVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "stateJson" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "areaSqIn" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DesignVersion_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderGid" TEXT,
    "lineItemId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "designVersion" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderLink_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RenderJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "orderLinkId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "outputKey" TEXT,
    "previewKey" TEXT,
    "sheetWidthIn" REAL,
    "sheetHeightIn" REAL,
    "widthPx" INTEGER,
    "heightPx" INTEGER,
    "leaseExpiresAt" DATETIME,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RenderJob_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RenderJob_orderLinkId_fkey" FOREIGN KEY ("orderLinkId") REFERENCES "OrderLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metaJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "webhookId" TEXT,
    "orderId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopConfig_shop_key" ON "ShopConfig"("shop");

-- CreateIndex
CREATE INDEX "ProductBinding_shop_idx" ON "ProductBinding"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBinding_shop_productGid_key" ON "ProductBinding"("shop", "productGid");

-- CreateIndex
CREATE INDEX "Asset_shop_idx" ON "Asset"("shop");

-- CreateIndex
CREATE INDEX "Design_shop_status_idx" ON "Design"("shop", "status");

-- CreateIndex
CREATE INDEX "Design_shop_updatedAt_idx" ON "Design"("shop", "updatedAt");

-- CreateIndex
CREATE INDEX "DesignVersion_designId_idx" ON "DesignVersion"("designId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignVersion_designId_version_key" ON "DesignVersion"("designId", "version");

-- CreateIndex
CREATE INDEX "OrderLink_shop_orderId_idx" ON "OrderLink"("shop", "orderId");

-- CreateIndex
CREATE INDEX "OrderLink_designId_idx" ON "OrderLink"("designId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLink_shop_orderId_lineItemId_designId_key" ON "OrderLink"("shop", "orderId", "lineItemId", "designId");

-- CreateIndex
CREATE INDEX "RenderJob_shop_status_idx" ON "RenderJob"("shop", "status");

-- CreateIndex
CREATE INDEX "RenderJob_designId_status_idx" ON "RenderJob"("designId", "status");

-- CreateIndex
CREATE INDEX "RenderJob_status_updatedAt_idx" ON "RenderJob"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_shop_createdAt_idx" ON "AuditEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_shop_topic_payloadHash_idx" ON "WebhookDelivery"("shop", "topic", "payloadHash");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_idempotencyKey_key" ON "WebhookDelivery"("idempotencyKey");
