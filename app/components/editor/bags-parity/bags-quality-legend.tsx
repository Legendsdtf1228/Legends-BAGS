import type { QualityDisplayPrefs } from "../gang-sheet/quality-inspector";

export type BagsQualityLegendProps = {
  qualityPrefs: QualityDisplayPrefs;
  onQualityPrefsChange: (prefs: QualityDisplayPrefs) => void;
};

/** BAGS-style print quality legend with inline overlap/resolution toggles. */
export function BagsQualityLegend(props: BagsQualityLegendProps) {
  const { qualityPrefs, onQualityPrefsChange } = props;

  const setPref = (key: keyof QualityDisplayPrefs, value: boolean) =>
    onQualityPrefsChange({ ...qualityPrefs, [key]: value });

  return (
    <aside className="bags-quality-legend" aria-label="Print quality legend">
      <strong className="bags-quality-legend-title">Legend</strong>
      <ul className="bags-quality-legend-list">
        <li className="bags-legend-overlap">
          <label className="bags-legend-toggle">
            <input
              type="checkbox"
              checked={qualityPrefs.showOverlapOutlines}
              onChange={(e) => setPref("showOverlapOutlines", e.target.checked)}
            />
            <span className="bags-legend-swatch" aria-hidden />
            Overlapping lines
          </label>
        </li>
        <li className="bags-legend-resolution">
          <label className="bags-legend-toggle">
            <input
              type="checkbox"
              checked={qualityPrefs.showResolutionOutlines}
              onChange={(e) => setPref("showResolutionOutlines", e.target.checked)}
            />
            <span className="bags-legend-swatch" aria-hidden />
            Resolution lines
          </label>
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
