UPDATE "ProductBinding"
SET "enabled" = false
WHERE "builderType" = 'gang_sheet'
  AND ("sheetHeightIn" IS NULL OR "sheetHeightIn" <= 0);