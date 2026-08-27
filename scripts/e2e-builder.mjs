/**
 * Smoke-test GET /builder redirects for bound dev products.
 *
 * Usage:
 *   LGS_APP_URL=https://upload-by-size-production.up.railway.app \
 *   DEV_SHOP=legends-bags-in2lwdll.myshopify.com \
 *   node scripts/e2e-builder.mjs
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

function builderUrl(productId, variantId) {
  const u = new URL("/builder", `${appUrl}/`);
  u.searchParams.set("shop", shop);
  u.searchParams.set("product", productId);
  u.searchParams.set("variant", variantId ?? "");
  u.searchParams.set("quantity", "1");
  u.searchParams.set("shop_mode", "1");
  return u.toString();
}

const bindings = await prisma.productBinding.findMany({
  where: { shop },
  orderBy: [{ builderType: "asc" }, { sheetHeightIn: "asc" }],
});

if (!bindings.length) {
  console.error(`No ProductBinding rows for ${shop}. Run npm run setup:dev-all first.`);
  process.exit(1);
}

let passed = 0;
let failed = 0;

for (const row of bindings) {
  const productId = numericIdFromGid(row.productGid);
  const variantId = numericIdFromGid(row.variantGid);
  if (!productId) continue;

  const url = builderUrl(productId, variantId);
  const res = await fetch(url, { redirect: "manual" });
  const location = res.headers.get("location") || "";
  const expectedPath =
    row.builderType === "gang_sheet" ? "/editor/gang-sheet" : "/editor/upload-by-size";
  const ok = res.status === 302 && location.includes(expectedPath);

  if (ok) {
    passed++;
    console.log(`OK  ${row.builderType} ${productId}/${variantId ?? ""} → ${expectedPath}`);
  } else {
    failed++;
    console.error(`FAIL ${row.builderType} ${productId} status=${res.status} location=${location}`);
  }
}

await prisma.$disconnect();

console.log(`\n/builder smoke: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
