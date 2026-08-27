-- Shop Builder staff sheets + merchant gallery CMS
ALTER TABLE "Design" ADD COLUMN "staffSheet" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Design_shop_staffSheet_updatedAt_idx" ON "Design"("shop", "staffSheet", "updatedAt");

CREATE TABLE "GalleryCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "GalleryAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "defaultWidthIn" REAL NOT NULL DEFAULT 3,
    "defaultHeightIn" REAL NOT NULL DEFAULT 3,
    "thumbUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GalleryAsset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GalleryCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "GalleryCategory_shop_name_key" ON "GalleryCategory"("shop", "name");
CREATE INDEX "GalleryCategory_shop_idx" ON "GalleryCategory"("shop");
CREATE INDEX "GalleryAsset_shop_categoryId_idx" ON "GalleryAsset"("shop", "categoryId");
CREATE INDEX "GalleryAsset_shop_active_idx" ON "GalleryAsset"("shop", "active");
