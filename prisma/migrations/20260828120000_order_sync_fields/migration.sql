-- AlterTable
ALTER TABLE "ShopConfig" ADD COLUMN "lastOrderSyncAt" DATETIME;
ALTER TABLE "ShopConfig" ADD COLUMN "lastOrderSyncError" TEXT;
