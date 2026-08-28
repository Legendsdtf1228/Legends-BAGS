import { FONT_OPTIONS } from "../gang-sheet/editor-data";

export type NamesNumbersLayout = "stacked" | "side-by-side";

export type BagsNamesNumbersContentProps = {
  rosterCsv: string;
  onRosterChange: (value: string) => void;
  nameFontFamily: string;
  onNameFontFamilyChange: (value: string) => void;
  numberFontFamily: string;
  onNumberFontFamilyChange: (value: string) => void;
  nameFontSize: number;
  onNameFontSizeChange: (value: number) => void;
  numberFontSize: number;
  onNumberFontSizeChange: (value: number) => void;
  textColor: string;
  onTextColorChange: (value: string) => void;
  layout: NamesNumbersLayout;
  onLayoutChange: (layout: NamesNumbersLayout) => void;
  onGenerate: () => void;
};

export function BagsNamesNumbersContent(props: BagsNamesNumbersContentProps) {
  const {
    rosterCsv,
    onRosterChange,
    nameFontFamily,
    onNameFontFamilyChange,
    numberFontFamily,
    onNumberFontFamilyChange,
    nameFontSize,
    onNameFontSizeChange,
    numberFontSize,
    onNumberFontSizeChange,
    textColor,
    onTextColorChange,
    layout,
    onLayoutChange,
    onGenerate,
  } = props;

  const rowCount = rosterCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;

  return (
    <div className="bags-names-form">
      <p className="bags-names-lead">
        Paste roster rows (Name, Number) — one player per line. Names and numbers are placed as separate
        text layers on the sheet.
      </p>

      <fieldset className="bags-settings-group">
        <legend>Roster</legend>
        <label className="bags-field">
          Players
          <textarea
            rows={8}
            value={rosterCsv}
            placeholder={"Smith, 12\nJones, 7\nLee, 23"}
            onChange={(e) => onRosterChange(e.target.value)}
            aria-label="Roster CSV"
          />
        </label>
        <p className="bags-names-meta">{rowCount} row{rowCount === 1 ? "" : "s"} detected</p>
      </fieldset>

      <div className="bags-names-grid">
        <fieldset className="bags-settings-group">
          <legend>Name</legend>
          <label className="bags-field">
            Font
            <select value={nameFontFamily} onChange={(e) => onNameFontFamilyChange(e.target.value)}>
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.label}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="bags-field">
            Size (pt)
            <input
              type="number"
              min={8}
              max={120}
              value={nameFontSize}
              onChange={(e) => onNameFontSizeChange(+e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset className="bags-settings-group">
          <legend>Number</legend>
          <label className="bags-field">
            Font
            <select value={numberFontFamily} onChange={(e) => onNumberFontFamilyChange(e.target.value)}>
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.label}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="bags-field">
            Size (pt)
            <input
              type="number"
              min={8}
              max={120}
              value={numberFontSize}
              onChange={(e) => onNumberFontSizeChange(+e.target.value)}
            />
          </label>
        </fieldset>
      </div>

      <fieldset className="bags-settings-group">
        <legend>Layout &amp; color</legend>
        <label className="bags-field">
          Text color
          <input type="color" value={textColor} onChange={(e) => onTextColorChange(e.target.value)} />
        </label>
        <label className="bags-radio">
          <input
            type="radio"
            name="names-layout"
            checked={layout === "stacked"}
            onChange={() => onLayoutChange("stacked")}
          />
          Stacked — number below name
        </label>
        <label className="bags-radio">
          <input
            type="radio"
            name="names-layout"
            checked={layout === "side-by-side"}
            onChange={() => onLayoutChange("side-by-side")}
          />
          Side by side — name left, number right
        </label>
      </fieldset>

      <button type="button" className="bags-btn bags-btn-primary bags-names-generate" onClick={onGenerate}>
        Generate on sheet
      </button>
    </div>
  );
}
