-- Per-variant gang sheet height mapping
ALTER TABLE "ProductBinding" ADD COLUMN "sheetHeightIn" REAL;
CREATE INDEX "ProductBinding_shop_variantGid_idx" ON "ProductBinding"("shop", "variantGid");
