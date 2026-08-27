-- Fonts manager and FitCheck template foundation
CREATE TABLE "ShopFont" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'system',
    "storageKey" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "licenseAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "previewText" TEXT NOT NULL DEFAULT 'Legends BAGS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "ShopFont_shop_family_key" ON "ShopFont"("shop", "family");
CREATE INDEX "ShopFont_shop_enabled_idx" ON "ShopFont"("shop", "enabled");

CREATE TABLE "FitCheckTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "previewAssetId" TEXT,
    "regionX" REAL NOT NULL DEFAULT 0,
    "regionY" REAL NOT NULL DEFAULT 0,
    "regionWidthIn" REAL NOT NULL DEFAULT 10,
    "regionHeightIn" REAL NOT NULL DEFAULT 10,
    "regionShape" TEXT NOT NULL DEFAULT 'rect',
    "rotationDeg" REAL NOT NULL DEFAULT 0,
    "cylindrical" BOOLEAN NOT NULL DEFAULT false,
    "productGids" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "FitCheckTemplate_shop_active_idx" ON "FitCheckTemplate"("shop", "active");
