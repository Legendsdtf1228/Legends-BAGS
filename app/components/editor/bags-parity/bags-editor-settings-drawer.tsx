import type { QualityDisplayPrefs } from "../gang-sheet/quality-inspector";
import { BagsSettingsModal } from "./bags-settings-modal";

export type BagsEditorSettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
  snapEnabled: boolean;
  onSnapChange: (enabled: boolean) => void;
  qualityPrefs: QualityDisplayPrefs;
  onQualityPrefsChange: (prefs: QualityDisplayPrefs) => void;
  visualAid: "checkerboard" | "gray" | "black" | "white" | "custom";
  visualAidCustomColor: string;
  onVisualAidChange: (aid: BagsEditorSettingsDrawerProps["visualAid"]) => void;
  onVisualAidCustomColorChange: (color: string) => void;
  artboardMarginEnabled: boolean;
  artboardMarginIn: number;
  onArtboardMarginChange: (enabled: boolean, value: number) => void;
};

export function BagsEditorSettingsContent(props: Omit<BagsEditorSettingsDrawerProps, "open" | "onClose">) {
  const {
    snapEnabled,
    onSnapChange,
    qualityPrefs,
    onQualityPrefsChange,
    visualAid,
    onVisualAidChange,
    visualAidCustomColor,
    onVisualAidCustomColorChange,
    artboardMarginEnabled,
    artboardMarginIn,
    onArtboardMarginChange,
  } = props;

  const setPref = (key: keyof QualityDisplayPrefs, value: boolean) =>
    onQualityPrefsChange({ ...qualityPrefs, [key]: value });

  return (
    <>
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
        <label className="bags-radio bags-visual-aid-custom">
          <input
            type="radio"
            name="visual-aid"
            checked={visualAid === "custom"}
            onChange={() => onVisualAidChange("custom")}
          />
          Custom
          <input
            type="color"
            className="bags-visual-aid-color"
            value={visualAidCustomColor}
            disabled={visualAid !== "custom"}
            onChange={(e) => {
              onVisualAidCustomColorChange(e.target.value);
              onVisualAidChange("custom");
            }}
            aria-label="Custom visual aid color"
          />
        </label>
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
    </>
  );
}

/** BAGS-style centered settings modal (replaces left drawer). */
export function BagsEditorSettingsDrawer(props: BagsEditorSettingsDrawerProps) {
  const { open, onClose, ...contentProps } = props;
  return (
    <BagsSettingsModal open={open} onClose={onClose}>
      <BagsEditorSettingsContent {...contentProps} />
    </BagsSettingsModal>
  );
}
