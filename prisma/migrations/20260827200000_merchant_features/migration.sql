-- Appearance, assignments, reprocess width, variant pricing
ALTER TABLE "ShopConfig" ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#f97316';
ALTER TABLE "ShopConfig" ADD COLUMN "accentColorDark" TEXT NOT NULL DEFAULT '#ea580c';
ALTER TABLE "ShopConfig" ADD COLUMN "launcherOpenLabel" TEXT NOT NULL DEFAULT 'Build your gang sheet';
ALTER TABLE "ShopConfig" ADD COLUMN "launcherEditLabel" TEXT NOT NULL DEFAULT 'Edit design';
ALTER TABLE "ShopConfig" ADD COLUMN "welcomeTitle" TEXT NOT NULL DEFAULT 'Welcome to Legends BAGS';
ALTER TABLE "ShopConfig" ADD COLUMN "welcomeSubtitle" TEXT NOT NULL DEFAULT 'Upload artwork, arrange on the sheet, then save to cart.';
ALTER TABLE "ShopConfig" ADD COLUMN "podEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ShopConfig" ADD COLUMN "podProviderNotes" TEXT;

ALTER TABLE "ProductBinding" ADD COLUMN "variantPriceCents" INTEGER;

ALTER TABLE "RenderJob" ADD COLUMN "reprocessWidthIn" REAL;

CREATE TABLE "DesignAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "assigneeName" TEXT NOT NULL,
    "assigneeEmail" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "DesignAssignment_shop_status_idx" ON "DesignAssignment"("shop", "status");
CREATE INDEX "DesignAssignment_designId_idx" ON "DesignAssignment"("designId");
