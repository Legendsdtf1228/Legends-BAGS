ALTER TABLE "ShopConfig" ADD COLUMN "businessName" TEXT NOT NULL DEFAULT 'Legends DTF Prints';
ALTER TABLE "ShopConfig" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "ShopConfig" ADD COLUMN "logoLightUrl" TEXT;
ALTER TABLE "ShopConfig" ADD COLUMN "logoDarkUrl" TEXT;
ALTER TABLE "ShopConfig" ADD COLUMN "faviconUrl" TEXT;
ALTER TABLE "ShopConfig" ADD COLUMN "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF';
ALTER TABLE "ShopConfig" ADD COLUMN "buttonColor" TEXT NOT NULL DEFAULT '#171717';
ALTER TABLE "ShopConfig" ADD COLUMN "textColor" TEXT NOT NULL DEFAULT '#171717';

UPDATE "ShopConfig"
SET "accentColor" = '#C9A227',
    "accentColorDark" = '#8A6D12'
WHERE "accentColor" = '#f97316'
  AND "accentColorDark" = '#ea580c';