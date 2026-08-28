export type BagsProductVariantRow = {
  sheetHeightIn?: number | null;
  variantPriceCents?: number | null;
  variantTitle?: string | null;
};

export type BagsProductsPanelProps = {
  sheetWidth: number;
  activeHeight: number;
  variants: BagsProductVariantRow[];
  pricePerSqIn: number;
  onSelectHeight: (heightIn: number) => void;
};

function formatPrice(cents: number | null | undefined, fallbackUsd: number): string {
  if (cents != null && cents >= 0) return `$${(cents / 100).toFixed(2)}`;
  return `$${fallbackUsd.toFixed(2)}`;
}

export function BagsProductsPanel(props: BagsProductsPanelProps) {
  const { sheetWidth, activeHeight, variants, pricePerSqIn, onSelectHeight } = props;

  const rows = variants
    .filter((v) => v.sheetHeightIn != null && Number.isFinite(v.sheetHeightIn))
    .sort((a, b) => (a.sheetHeightIn ?? 0) - (b.sheetHeightIn ?? 0));

  return (
    <>
      <div className="heading">
        <span>
          <strong>Products</strong>
          <small>Sheet lengths &amp; pricing</small>
        </span>
      </div>
      <p className="panel-lead">
        Prices come from synced Shopify variants — not printed-area estimates.
      </p>
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
              <li key={height}>
                <button
                  type="button"
                  className={`bags-product-row ${active ? "active" : ""}`}
                  onClick={() => onSelectHeight(height)}
                >
                  <span className="bags-product-size">
                    <strong>{sheetWidth}″ × {height}″</strong>
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
