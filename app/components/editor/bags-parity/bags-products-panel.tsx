export type BagsProductVariantRow = {
  sheetHeightIn?: number | null;
  variantPriceCents?: number | null;
  variantTitle?: string | null;
  variantId?: string | null;
};

export type BagsProductsPanelProps = {
  sheetWidth: number;
  activeHeight: number;
  variants: BagsProductVariantRow[];
  pricePerSqIn: number;
  onSelectHeight: (heightIn: number) => void;
  productTitle?: string | null;
  productStatus?: string | null;
  syncStatus?: string | null;
  selectedVariantId?: string | null;
  selectedVariantTitle?: string | null;
};

function formatPrice(cents: number | null | undefined, fallbackUsd: number): string {
  if (cents != null && cents >= 0) return `$${(cents / 100).toFixed(2)}`;
  return `$${fallbackUsd.toFixed(2)}`;
}

function formatPublicationStatus(status: string | null | undefined): string {
  if (!status) return "Unknown";
  const normalized = status.toUpperCase();
  if (normalized === "ACTIVE") return "Published";
  if (normalized === "DRAFT") return "Unpublished";
  if (normalized === "ARCHIVED") return "Archived";
  return status;
}

function formatSyncStatus(status: string | null | undefined): string {
  if (!status) return "Not synced";
  if (status === "synced") return "Synced";
  if (status === "missing") return "Missing in Shopify";
  if (status === "manual") return "Manual binding";
  return status;
}

export function BagsProductsPanel(props: BagsProductsPanelProps) {
  const {
    sheetWidth,
    activeHeight,
    variants,
    pricePerSqIn,
    onSelectHeight,
    productTitle,
    productStatus,
    syncStatus,
    selectedVariantId,
    selectedVariantTitle,
  } = props;

  const rows = variants.filter((v) => v.sheetHeightIn != null && Number.isFinite(v.sheetHeightIn));

  return (
    <>
      <div className="heading">
        <span>
          <strong>Products</strong>
          <small>Sheet lengths &amp; pricing</small>
        </span>
      </div>
      {productTitle ? (
        <div className="bags-product-meta">
          <p className="panel-lead">
            <strong>{productTitle}</strong>
          </p>
          <p className="sidebar-hint">
            Publication: {formatPublicationStatus(productStatus)} · Sync: {formatSyncStatus(syncStatus)}
          </p>
          {selectedVariantTitle || selectedVariantId ? (
            <p className="sidebar-hint">
              Current selection: {selectedVariantTitle ?? "Variant"}{" "}
              {selectedVariantId ? `(#${selectedVariantId})` : ""} · {sheetWidth}″ × {activeHeight}″
            </p>
          ) : null}
        </div>
      ) : (
        <p className="panel-lead">Prices come from synced Shopify variants — not printed-area estimates.</p>
      )}
      {!rows.length ? (
        <p className="sidebar-empty">
          No gang sheet variants configured. Bind and sync products in the admin Products page.
        </p>
      ) : (
        <ul className="bags-products-list">
          {rows.map((row) => {
            const height = row.sheetHeightIn!;
            const areaFallback = Math.round(sheetWidth * height * pricePerSqIn * 100) / 100;
            const active = height === activeHeight;
            return (
              <li key={`${height}-${row.variantId ?? "default"}`}>
                <button
                  type="button"
                  className={`bags-product-row ${active ? "active" : ""}`}
                  onClick={() => onSelectHeight(height)}
                >
                  <span className="bags-product-size">
                    <strong>
                      {sheetWidth}″ × {height}″
                    </strong>
                    {row.variantTitle ? <small>{row.variantTitle}</small> : null}
                  </span>
                  <span className="bags-product-price">
                    {formatPrice(row.variantPriceCents, areaFallback)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
