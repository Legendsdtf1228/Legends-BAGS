import { useEffect, useRef } from "react";
import { dpiQualityTier, type QualitySummary } from "./dpi-quality";

export type QualityDisplayPrefs = {
  showResolutionOutlines: boolean;
  showOverlapOutlines: boolean;
  showSafeZone: boolean;
  showOobShading: boolean;
};

export type QualityInspectorProps = {
  summary: QualitySummary;
  items: Array<{
    id: string;
    name: string;
    kind?: string;
    dpi?: number | null;
    widthPx?: number;
    heightPx?: number;
    widthIn: number;
    heightIn: number;
  }>;
  overlappingIds: Set<string>;
  oobIds: Set<string>;
  prefs: QualityDisplayPrefs;
  onPrefsChange: (prefs: QualityDisplayPrefs) => void;
  onSelectItem: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QualityStatusButton(props: {
  summary: QualitySummary;
  onClick: () => void;
  active?: boolean;
}) {
  const { summary, onClick, active } = props;
  const issues =
    summary.low + summary.poor + summary.overlap + summary.oob + summary.unknown;
  const label =
    issues === 0
      ? "Quality OK"
      : `${issues} issue${issues === 1 ? "" : "s"}`;

  return (
    <button
      type="button"
      className={`gs-quality-btn ${active ? "active" : ""} ${issues > 0 ? "has-issues" : ""}`}
      onClick={onClick}
      aria-expanded={active}
      aria-haspopup="dialog"
      title="Sheet quality summary"
    >
      <span className="gs-quality-btn-label">Quality</span>
      <span className="gs-quality-btn-value">{label}</span>
    </button>
  );
}

export function QualityInspectorPanel(props: QualityInspectorProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { summary, items, overlappingIds, oobIds, prefs, onPrefsChange, onSelectItem, open, onOpenChange } =
    props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const flagged = items.filter((i) => {
    if (i.kind === "text") return false;
    const info = dpiQualityTier(i.dpi);
    return (
      info.tier === "low" ||
      info.tier === "poor" ||
      info.tier === "unknown" ||
      overlappingIds.has(i.id) ||
      oobIds.has(i.id)
    );
  });

  return (
    <div className="gs-quality-backdrop" onClick={() => onOpenChange(false)} role="presentation">
      <div
        ref={panelRef}
        className="gs-quality-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gs-quality-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="gs-quality-head">
          <h2 id="gs-quality-title">Sheet quality</h2>
          <button type="button" className="gs-icon-btn" onClick={() => onOpenChange(false)} aria-label="Close">
            ×
          </button>
        </header>

        <dl className="gs-quality-counts">
          <div className="tier-excellent">
            <dt>Excellent</dt>
            <dd>{summary.excellent}</dd>
          </div>
          <div className="tier-good">
            <dt>Good</dt>
            <dd>{summary.good}</dd>
          </div>
          <div className="tier-low">
            <dt>Low</dt>
            <dd>{summary.low}</dd>
          </div>
          <div className="tier-poor">
            <dt>Poor</dt>
            <dd>{summary.poor + summary.unknown}</dd>
          </div>
          <div className="tier-overlap">
            <dt>Overlapping</dt>
            <dd>{summary.overlap}</dd>
          </div>
          <div className="tier-oob">
            <dt>Out of bounds</dt>
            <dd>{summary.oob}</dd>
          </div>
        </dl>

        <fieldset className="gs-quality-toggles">
          <legend>Canvas overlays</legend>
          <label>
            <input
              type="checkbox"
              checked={prefs.showResolutionOutlines}
              onChange={(e) => onPrefsChange({ ...prefs, showResolutionOutlines: e.target.checked })}
            />
            Resolution outlines
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.showOverlapOutlines}
              onChange={(e) => onPrefsChange({ ...prefs, showOverlapOutlines: e.target.checked })}
            />
            Overlap outlines
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.showSafeZone}
              onChange={(e) => onPrefsChange({ ...prefs, showSafeZone: e.target.checked })}
            />
            Safe zone
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.showOobShading}
              onChange={(e) => onPrefsChange({ ...prefs, showOobShading: e.target.checked })}
            />
            Out-of-bounds shading
          </label>
        </fieldset>

        {flagged.length ? (
          <ul className="gs-quality-list">
            {flagged.map((item) => {
              const info = dpiQualityTier(item.dpi);
              const flags: string[] = [];
              if (info.tier === "low" || info.tier === "poor" || info.tier === "unknown") {
                flags.push(info.label);
              }
              if (overlappingIds.has(item.id)) flags.push("Overlap");
              if (oobIds.has(item.id)) flags.push("Out of bounds");
              return (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{flags.join(" · ")}</small>
                    {info.tier !== "excellent" && info.tier !== "good" ? (
                      <p>{info.explanation}</p>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => onSelectItem(item.id)}>
                    Select
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="gs-quality-ok">All artwork meets recommended quality for this sheet.</p>
        )}
      </div>
    </div>
  );
}
