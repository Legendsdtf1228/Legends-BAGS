/** BAGS-style print quality legend — left of canvas workspace. */

export function BagsQualityLegend() {
  return (
    <aside className="bags-quality-legend" aria-label="Print quality legend">
      <strong className="bags-quality-legend-title">Legend</strong>
      <ul className="bags-quality-legend-list">
        <li className="bags-legend-overlap">
          <span className="bags-legend-swatch" aria-hidden />
          Overlapping lines
        </li>
        <li className="bags-legend-resolution">
          <span className="bags-legend-swatch" aria-hidden />
          Resolution lines
        </li>
        <li className="bags-legend-optimal">
          <span className="bags-legend-swatch" aria-hidden />
          Optimal · 300+ DPI
        </li>
        <li className="bags-legend-good">
          <span className="bags-legend-swatch" aria-hidden />
          Good · 250+ DPI
        </li>
        <li className="bags-legend-bad">
          <span className="bags-legend-swatch" aria-hidden />
          Bad · 200+ DPI
        </li>
        <li className="bags-legend-terrible">
          <span className="bags-legend-swatch" aria-hidden />
          Terrible · under 200
        </li>
        <li className="bags-legend-minimum">
          <span className="bags-legend-swatch" aria-hidden />
          Minimum · 72 DPI
        </li>
      </ul>
    </aside>
  );
}
