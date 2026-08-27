-- DropIndex
DROP INDEX "ProductBinding_shop_productGid_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProductBinding_shop_variantGid_key" ON "ProductBinding"("shop", "variantGid");

-- CreateIndex
CREATE INDEX "ProductBinding_shop_productGid_idx" ON "ProductBinding"("shop", "productGid");
