-- Design library, reorder lineage, and customer metadata
ALTER TABLE "Design" ADD COLUMN "name" TEXT;
ALTER TABLE "Design" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Design" ADD COLUMN "customerKey" TEXT;
ALTER TABLE "Design" ADD COLUMN "previewKey" TEXT;
ALTER TABLE "Design" ADD COLUMN "sourceDesignId" TEXT;
ALTER TABLE "Design" ADD COLUMN "sourceDesignVersion" INTEGER;
ALTER TABLE "Design" ADD COLUMN "sourceOrderId" TEXT;

CREATE INDEX "Design_shop_archived_updatedAt_idx" ON "Design"("shop", "archived", "updatedAt");
CREATE INDEX "Design_shop_name_idx" ON "Design"("shop", "name");
CREATE INDEX "Design_sourceDesignId_idx" ON "Design"("sourceDesignId");
