import type { QualityDisplayPrefs } from "../gang-sheet/quality-inspector";

export type BagsEditorSettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
  snapEnabled: boolean;
  onSnapChange: (enabled: boolean) => void;
  qualityPrefs: QualityDisplayPrefs;
  onQualityPrefsChange: (prefs: QualityDisplayPrefs) => void;
  visualAid: "checkerboard" | "gray" | "black" | "white" | "custom";
  onVisualAidChange: (aid: BagsEditorSettingsDrawerProps["visualAid"]) => void;
  artboardMarginEnabled: boolean;
  artboardMarginIn: number;
  onArtboardMarginChange: (enabled: boolean, value: number) => void;
};

export function BagsEditorSettingsDrawer(props: BagsEditorSettingsDrawerProps) {
  const {
    open,
    onClose,
    snapEnabled,
    onSnapChange,
    qualityPrefs,
    onQualityPrefsChange,
    visualAid,
    onVisualAidChange,
    artboardMarginEnabled,
    artboardMarginIn,
    onArtboardMarginChange,
  } = props;

  if (!open) return null;

  const setPref = (key: keyof QualityDisplayPrefs, value: boolean) =>
    onQualityPrefsChange({ ...qualityPrefs, [key]: value });

  return (
    <>
      <button type="button" className="bags-parity-drawer-backdrop" aria-label="Close settings" onClick={onClose} />
      <aside className="bags-parity-drawer bags-settings-drawer" aria-label="Editor settings">
        <header className="bags-drawer-head">
          <strong>Settings</strong>
          <button type="button" className="bags-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="bags-drawer-body">
          <fieldset className="bags-settings-group">
            <legend>Quality lines</legend>
            <label className="bags-check">
              <input
                type="checkbox"
                checked={qualityPrefs.showResolutionOutlines}
                onChange={(e) => setPref("showResolutionOutlines", e.target.checked)}
              />
              Show Resolution Lines
            </label>
            <label className="bags-check">
              <input
                type="checkbox"
                checked={qualityPrefs.showOverlapOutlines}
                onChange={(e) => setPref("showOverlapOutlines", e.target.checked)}
              />
              Overlapping Lines
            </label>
            <label className="bags-check">
              <input type="checkbox" checked={snapEnabled} onChange={(e) => onSnapChange(e.target.checked)} />
              Snap when moving
            </label>
            <label className="bags-check">
              <input type="checkbox" checked={qualityPrefs.showOobShading} onChange={(e) => setPref("showOobShading", e.target.checked)} />
              Background Warning
            </label>
            <label className="bags-check">
              <input type="checkbox" checked={qualityPrefs.showSafeZone} onChange={(e) => setPref("showSafeZone", e.target.checked)} />
              Transparent Warning
            </label>
          </fieldset>

          <fieldset className="bags-settings-group">
            <legend>Visual Aid</legend>
            {(["checkerboard", "gray", "black", "white"] as const).map((aid) => (
              <label key={aid} className="bags-radio">
                <input type="radio" name="visual-aid" checked={visualAid === aid} onChange={() => onVisualAidChange(aid)} />
                {aid.charAt(0).toUpperCase() + aid.slice(1)}
              </label>
            ))}
          </fieldset>

          <fieldset className="bags-settings-group">
            <legend>Artboard margin</legend>
            <label className="bags-check">
              <input
                type="checkbox"
                checked={artboardMarginEnabled}
                onChange={(e) => onArtboardMarginChange(e.target.checked, artboardMarginIn)}
              />
              Enable artboard margin
            </label>
            <label className="bags-field">
              Margin (in)
              <input
                type="number"
                min={0}
                step={0.05}
                value={artboardMarginIn}
                disabled={!artboardMarginEnabled}
                onChange={(e) => onArtboardMarginChange(artboardMarginEnabled, +e.target.value)}
              />
            </label>
          </fieldset>

          <p className="bags-dpi-legend">
            Optimal: 300+ DPI · Good: 250+ · Bad: 200+ · Terrible: under 200 · Minimum: 72 DPI
          </p>
        </div>
      </aside>
    </>
  );
}
