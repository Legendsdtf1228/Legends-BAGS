/**
 * Print /builder launch URLs for all ProductBinding rows on DEV_SHOP.
 */
import { PrismaClient } from "@prisma/client";

function numericIdFromGid(gid) {
  if (!gid) return undefined;
  const match = String(gid).match(/(\d+)$/);
  return match?.[1];
}

const appUrl = (process.env.LGS_APP_URL || process.env.SHOPIFY_APP_URL || "").replace(/\/$/, "");
const shop = process.env.DEV_SHOP || "";

if (!appUrl) {
  console.error("Set LGS_APP_URL or SHOPIFY_APP_URL");
  process.exit(1);
}
if (!shop) {
  console.error("Set DEV_SHOP");
  process.exit(1);
}

const prisma = new PrismaClient();
const bindings = await prisma.productBinding.findMany({
  where: { shop },
  orderBy: [{ builderType: "asc" }, { sheetHeightIn: "asc" }],
});

if (!bindings.length) {
  console.log(`No bindings for ${shop}. Run npm run setup:dev-all.`);
  await prisma.$disconnect();
  process.exit(0);
}

console.log(`\n/builder URLs for ${shop} (${appUrl}):\n`);

for (const row of bindings) {
  const productId = numericIdFromGid(row.productGid);
  const variantId = numericIdFromGid(row.variantGid) ?? "";
  if (!productId) continue;
  const u = new URL("/builder", `${appUrl}/`);
  u.searchParams.set("shop", shop);
  u.searchParams.set("product", productId);
  u.searchParams.set("variant", variantId);
  u.searchParams.set("quantity", "1");
  u.searchParams.set("shop_mode", "1");
  const label =
    row.builderType === "gang_sheet"
      ? `Gang sheet${row.sheetHeightIn ? ` · ${row.sheetHeightIn}″` : ""}`
      : "Upload by Size";
  console.log(`${label}`);
  console.log(`  ${u.toString()}\n`);
}

await prisma.$disconnect();
