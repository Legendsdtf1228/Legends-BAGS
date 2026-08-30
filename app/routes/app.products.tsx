import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { UPLOAD_BY_SIZE_ROLL_MAX_IN } from "../domain/design/gang-sheet-sheet";
import {
  fetchShopifyCatalog,
  fetchShopifyProductVariants,
  reconcileProductBindings,
  resolveVariantGidForBinding,
  shopifyPriceToCents,
} from "../services/shopify-product-sync.server";
import { adminProductUrl, storefrontProductUrl } from "../lib/shopify-admin-links";
import { BagsPageHeader, BagsCard, BagsStatusBadge, BagsPageBody } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const builder = url.searchParams.get("builder") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
  const pageSize = 25;

  const shopConfig = await prisma.shopConfig.findUnique({ where: { shop: session.shop } });

  const bindings = await prisma.productBinding.findMany({
    where: {
      shop: session.shop,
      ...(builder ? { builderType: builder } : {}),
      ...(q
        ? {
            OR: [
              { productGid: { contains: q } },
              { variantGid: { contains: q } },
              { productTitle: { contains: q } },
              { variantTitle: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  let catalogPreview: Awaited<ReturnType<typeof fetchShopifyCatalog>> = [];
  try {
    catalogPreview = await fetchShopifyCatalog(admin, {
      query: q ? `title:*${q}*` : undefined,
      maxPages: 1,
    });
  } catch {
    catalogPreview = [];
  }

  const boundProductGids = new Set(bindings.map((b) => b.productGid));
  const importCandidates = catalogPreview.filter((p) => !boundProductGids.has(p.id)).slice(0, 12);

  const paged = bindings.slice((page - 1) * pageSize, page * pageSize);

  return {
    q,
    builder,
    page,
    pageCount: Math.max(1, Math.ceil(bindings.length / pageSize)),
    bindings: paged.map((b) => ({
      id: b.id,
      productGid: b.productGid,
      variantGid: b.variantGid,
      builderType: b.builderType,
      pricePerSqIn: b.pricePerSqIn,
      sheetWidthIn: b.sheetWidthIn,
      maxHeightIn: b.maxHeightIn,
      sheetHeightIn: b.sheetHeightIn,
      variantPriceCents: b.variantPriceCents,
      productTitle: b.productTitle,
      productStatus: b.productStatus,
      productImageUrl: b.productImageUrl,
      variantTitle: b.variantTitle,
      syncStatus: b.syncStatus,
      updatedAt: b.updatedAt.toISOString(),
    })),
    importCandidates: importCandidates.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      handle: p.handle,
      imageUrl: p.imageUrl,
      variantCount: p.variants.length,
      variants: p.variants.map((v) => ({ id: v.id, title: v.title, price: v.price })),
    })),
    lastProductSyncAt: shopConfig?.lastProductSyncAt?.toISOString() ?? null,
    lastProductSyncError: shopConfig?.lastProductSyncError ?? null,
    shop: session.shop,
    totalBindings: bindings.length,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "sync") {
    try {
      const result = await reconcileProductBindings({ shop: session.shop, admin });
      return { synced: true, ...result };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      await prisma.shopConfig.upsert({
        where: { shop: session.shop },
        create: { shop: session.shop, lastProductSyncError: message },
        update: { lastProductSyncError: message },
      });
      return { error: message };
    }
  }

  if (intent !== "bind") return null;

  const productGid = String(form.get("productGid") || "").trim();
  const variantGidRaw = String(form.get("variantGid") || "").trim();
  const builderType = String(form.get("builderType") || "upload_by_size") as
    | "upload_by_size"
    | "gang_sheet";

  if (!productGid.startsWith("gid://shopify/Product/")) {
    return { error: "Product GID must look like gid://shopify/Product/…" };
  }

  const pricePerSqIn = form.get("pricePerSqIn")
    ? Number.parseFloat(String(form.get("pricePerSqIn")))
    : undefined;
  const variantPrice = form.get("variantPrice")
    ? Math.round(Number.parseFloat(String(form.get("variantPrice"))) * 100)
    : undefined;
  const sheetHeightIn = form.get("sheetHeightIn")
    ? Number.parseFloat(String(form.get("sheetHeightIn")))
    : undefined;
  const productTitle = String(form.get("productTitle") || "").trim() || undefined;

  try {
    const resolved = await resolveVariantGidForBinding({
      admin,
      productGid,
      variantGidRaw: variantGidRaw || undefined,
    });
    const variantGid = resolved.variantGid;
    const variants = await fetchShopifyProductVariants(admin, productGid);
    const matchedVariant = variants.find((v) => v.id === variantGid);
    const syncedVariantPriceCents = shopifyPriceToCents(matchedVariant?.price);
    const gangHeight =
      builderType === "gang_sheet" && Number.isFinite(sheetHeightIn!) ? sheetHeightIn : null;
    const rollMax =
      builderType === "upload_by_size"
        ? UPLOAD_BY_SIZE_ROLL_MAX_IN
        : gangHeight ?? undefined;

    const existing = await prisma.productBinding.findFirst({
      where: { shop: session.shop, variantGid },
    });
    if (existing) {
      await prisma.productBinding.update({
        where: { id: existing.id },
        data: {
          productGid,
          builderType,
          productTitle,
          variantTitle: resolved.variantTitle ?? existing.variantTitle,
          pricePerSqIn: Number.isFinite(pricePerSqIn!) ? pricePerSqIn : existing.pricePerSqIn,
          sheetHeightIn: gangHeight ?? existing.sheetHeightIn,
          variantPriceCents:
            variantPrice != null && Number.isFinite(variantPrice)
              ? variantPrice
              : syncedVariantPriceCents ?? existing.variantPriceCents,
          maxHeightIn: rollMax ?? existing.maxHeightIn,
          syncStatus: "manual",
        },
      });
    } else {
      await prisma.productBinding.create({
        data: {
          shop: session.shop,
          productGid,
          variantGid,
          builderType,
          productTitle,
          variantTitle: resolved.variantTitle,
          pricePerSqIn: Number.isFinite(pricePerSqIn!) ? pricePerSqIn : null,
          sheetHeightIn: gangHeight,
          variantPriceCents:
            variantPrice != null && Number.isFinite(variantPrice)
              ? variantPrice
              : syncedVariantPriceCents,
          sheetWidthIn: 22.5,
          maxHeightIn: rollMax ?? UPLOAD_BY_SIZE_ROLL_MAX_IN,
          syncStatus: "manual",
        },
      });
    }
    return { saved: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Bind failed" };
  }
};

export default function ProductsPage() {
  const {
    bindings,
    importCandidates,
    q,
    builder,
    page,
    pageCount,
    lastProductSyncAt,
    lastProductSyncError,
    shop,
    totalBindings,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title="Products"
        subtitle="Import Shopify products and assign Legends BAGS builders"
        actions={
          <>
            <Form method="post">
              <input type="hidden" name="intent" value="sync" />
              <button type="submit" className="bags-admin-btn primary">
                Sync products
              </button>
            </Form>
            <Link to="/app/setup" className="bags-admin-btn ghost">
              Create test products
            </Link>
          </>
        }
      />
      <div className="bags-admin-content">
        <BagsPageBody>
        <BagsCard style={{ marginBottom: 16 }}>
          <div className="bags-admin-actions" style={{ justifyContent: "space-between" }}>
            <Form method="get" className="bags-admin-actions">
              <input name="q" type="search" placeholder="Search title or GID…" defaultValue={q} />
              <select name="builder" defaultValue={builder}>
                <option value="">All builders</option>
                <option value="upload_by_size">Upload by Size</option>
                <option value="gang_sheet">Gang Sheet Builder</option>
              </select>
              <button type="submit" className="bags-admin-btn primary">
                Filter
              </button>
            </Form>
            <p className="bags-admin-muted" style={{ margin: 0 }}>
              {totalBindings} binding{totalBindings === 1 ? "" : "s"}
              {lastProductSyncAt
                ? ` · Last sync ${new Date(lastProductSyncAt).toLocaleString()}`
                : " · Not synced yet"}
            </p>
          </div>
          {lastProductSyncError ? (
            <p style={{ color: "#b42318", margin: "12px 0 0" }}>{lastProductSyncError}</p>
          ) : null}
        </BagsCard>

        {actionData && "error" in actionData && actionData.error ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p style={{ color: "#b42318", margin: 0 }}>{actionData.error}</p>
          </BagsCard>
        ) : null}
        {actionData && "saved" in actionData && actionData.saved ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted" style={{ margin: 0 }}>
              Product binding saved.
            </p>
          </BagsCard>
        ) : null}
        {actionData && "synced" in actionData && actionData.synced ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted" style={{ margin: 0 }}>
              Synced {actionData.updated} binding{actionData.updated === 1 ? "" : "s"}
              {actionData.missing ? ` · ${actionData.missing} missing in Shopify` : ""}.
            </p>
          </BagsCard>
        ) : null}

        {importCandidates.length > 0 ? (
          <BagsCard title="Import from Shopify" style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted">
              Products from your store that are not assigned to a builder yet.
            </p>
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Variants</th>
                  <th>Assign</th>
                </tr>
              </thead>
              <tbody>
                {importCandidates.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" width={40} height={40} style={{ borderRadius: 6 }} />
                        ) : null}
                        <div>
                          <strong>{p.title}</strong>
                          <div style={{ fontSize: 11, wordBreak: "break-all" }}>{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <BagsStatusBadge status={p.status.toLowerCase()} />
                    </td>
                    <td>{p.variantCount}</td>
                    <td>
                      {p.variantCount === 1 ? (
                        <Form method="post" className="bags-admin-actions">
                          <input type="hidden" name="intent" value="bind" />
                          <input type="hidden" name="productGid" value={p.id} />
                          <input type="hidden" name="variantGid" value={p.variants[0]?.id ?? ""} />
                          <input type="hidden" name="productTitle" value={p.title} />
                          <select name="builderType" defaultValue="upload_by_size">
                            <option value="upload_by_size">Upload by Size</option>
                            <option value="gang_sheet">Gang Sheet</option>
                          </select>
                          <button type="submit" className="bags-admin-btn primary">
                            Assign
                          </button>
                        </Form>
                      ) : (
                        <Form method="post" className="bags-admin-actions" style={{ flexWrap: "wrap" }}>
                          <input type="hidden" name="intent" value="bind" />
                          <input type="hidden" name="productGid" value={p.id} />
                          <input type="hidden" name="productTitle" value={p.title} />
                          <select name="variantGid" required defaultValue="">
                            <option value="" disabled>
                              Choose variant…
                            </option>
                            {p.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.title} · ${v.price}
                              </option>
                            ))}
                          </select>
                          <select name="builderType" defaultValue="upload_by_size">
                            <option value="upload_by_size">Upload by Size</option>
                            <option value="gang_sheet">Gang Sheet</option>
                          </select>
                          <button type="submit" className="bags-admin-btn primary">
                            Assign
                          </button>
                        </Form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BagsCard>
        ) : null}

        <BagsCard title="Assigned products">
          {bindings.length === 0 ? (
            <p className="bags-admin-muted">No products assigned yet. Sync or import from Shopify above.</p>
          ) : (
            <>
              <table className="bags-admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Builder</th>
                    <th>Variant</th>
                    <th>Sheet / price</th>
                    <th>Sync</th>
                    <th>Links</th>
                  </tr>
                </thead>
                <tbody>
                  {bindings.map((b) => {
                    const handleGuess = b.productTitle
                      ?.toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "");
                    return (
                      <tr key={b.id}>
                        <td>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            {b.productImageUrl ? (
                              <img
                                src={b.productImageUrl}
                                alt=""
                                width={40}
                                height={40}
                                style={{ borderRadius: 6 }}
                              />
                            ) : null}
                            <div>
                              <strong>{b.productTitle || b.productGid}</strong>
                              <div style={{ fontSize: 11, wordBreak: "break-all" }}>{b.productGid}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <BagsStatusBadge status={b.builderType} />
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {b.variantTitle || b.variantGid || "All variants"}
                        </td>
                        <td>
                          {b.sheetHeightIn != null ? `${b.sheetHeightIn}″ sheet · ` : ""}
                          {b.variantPriceCents != null
                            ? `$${(b.variantPriceCents / 100).toFixed(2)}`
                            : b.pricePerSqIn != null
                              ? `$${b.pricePerSqIn.toFixed(3)}/in²`
                              : "—"}
                        </td>
                        <td>
                          <BagsStatusBadge status={b.syncStatus} />
                        </td>
                        <td style={{ fontSize: 12 }}>
                          <a href={adminProductUrl(shop, b.productGid)} target="_blank" rel="noreferrer">
                            Admin
                          </a>
                          {handleGuess ? (
                            <>
                              {" · "}
                              <a
                                href={storefrontProductUrl(shop, handleGuess)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Storefront
                              </a>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {pageCount > 1 ? (
                <div className="bags-admin-actions" style={{ marginTop: 12 }}>
                  {page > 1 ? (
                    <Link
                      to={`/app/products?page=${page - 1}&q=${encodeURIComponent(q)}&builder=${builder}`}
                      className="bags-admin-btn ghost"
                    >
                      Previous
                    </Link>
                  ) : null}
                  <span className="bags-admin-muted">
                    Page {page} of {pageCount}
                  </span>
                  {page < pageCount ? (
                    <Link
                      to={`/app/products?page=${page + 1}&q=${encodeURIComponent(q)}&builder=${builder}`}
                      className="bags-admin-btn ghost"
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </BagsCard>

        <BagsCard title="Advanced: manual GID binding" style={{ marginTop: 16 }}>
          <Form method="post" className="bags-admin-form" style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <input type="hidden" name="intent" value="bind" />
            <label>
              Product GID
              <input name="productGid" type="text" required placeholder="gid://shopify/Product/…" />
            </label>
            <label>
              Variant GID (optional)
              <input name="variantGid" type="text" placeholder="gid://shopify/ProductVariant/…" />
            </label>
            <label>
              Builder type
              <select name="builderType" defaultValue="upload_by_size">
                <option value="upload_by_size">Upload by Size</option>
                <option value="gang_sheet">Gang Sheet Builder</option>
              </select>
            </label>
            <label>
              Price per in²
              <input name="pricePerSqIn" type="number" step="0.001" placeholder="0.049" />
            </label>
            <label>
              Sheet height in (gang sheet)
              <input name="sheetHeightIn" type="number" step="1" placeholder="24" />
            </label>
            <label>
              Fixed variant price USD
              <input name="variantPrice" type="number" step="0.01" placeholder="17.00" />
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Save binding
            </button>
          </Form>
        </BagsCard>
        </BagsPageBody>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
