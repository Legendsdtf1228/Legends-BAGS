import { useRef } from "react";
import { FONT_OPTIONS, NAMES_NUMBERS_PRESETS } from "../gang-sheet/editor-data";

export type NamesNumbersLayout = "stacked" | "side-by-side";

export type NamesNumbersPresetId = (typeof NAMES_NUMBERS_PRESETS)[number]["id"];

export type BagsNamesNumbersContentProps = {
  rosterCsv: string;
  onRosterChange: (value: string) => void;
  includeNames: boolean;
  onIncludeNamesChange: (value: boolean) => void;
  includeNumbers: boolean;
  onIncludeNumbersChange: (value: boolean) => void;
  nameFontFamily: string;
  onNameFontFamilyChange: (value: string) => void;
  numberFontFamily: string;
  onNumberFontFamilyChange: (value: string) => void;
  nameFontSize: number;
  onNameFontSizeChange: (value: number) => void;
  numberFontSize: number;
  onNumberFontSizeChange: (value: number) => void;
  nameWidthIn: number;
  onNameWidthInChange: (value: number) => void;
  numberWidthIn: number;
  onNumberWidthInChange: (value: number) => void;
  nameStrokeWidth: number;
  onNameStrokeWidthChange: (value: number) => void;
  numberStrokeWidth: number;
  onNumberStrokeWidthChange: (value: number) => void;
  strokeColor: string;
  onStrokeColorChange: (value: string) => void;
  textColor: string;
  onTextColorChange: (value: string) => void;
  quantity: number;
  onQuantityChange: (value: number) => void;
  layout: NamesNumbersLayout;
  onLayoutChange: (layout: NamesNumbersLayout) => void;
  onApplyPreset: (presetId: NamesNumbersPresetId) => void;
  onGenerate: () => void;
};

function parseRosterCsv(raw: string): number {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export function BagsNamesNumbersContent(props: BagsNamesNumbersContentProps) {
  const {
    rosterCsv,
    onRosterChange,
    includeNames,
    onIncludeNamesChange,
    includeNumbers,
    onIncludeNumbersChange,
    nameFontFamily,
    onNameFontFamilyChange,
    numberFontFamily,
    onNumberFontFamilyChange,
    nameFontSize,
    onNameFontSizeChange,
    numberFontSize,
    onNumberFontSizeChange,
    nameWidthIn,
    onNameWidthInChange,
    numberWidthIn,
    onNumberWidthInChange,
    nameStrokeWidth,
    onNameStrokeWidthChange,
    numberStrokeWidth,
    onNumberStrokeWidthChange,
    strokeColor,
    onStrokeColorChange,
    textColor,
    onTextColorChange,
    quantity,
    onQuantityChange,
    layout,
    onLayoutChange,
    onApplyPreset,
    onGenerate,
  } = props;

  const csvInputRef = useRef<HTMLInputElement>(null);
  const rowCount = parseRosterCsv(rosterCsv);

  function importCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      onRosterChange(text.trim());
    };
    reader.readAsText(file);
  }

  return (
    <div className="bags-names-form">
      <p className="bags-names-lead">
        Import or paste a roster (Name, Number) — one player per line. Names and numbers are placed as
        separate text layers on the sheet.
      </p>

      <fieldset className="bags-settings-group">
        <legend>Roster CSV</legend>
        <div className="bags-names-csv-actions">
          <button type="button" className="bags-btn bags-btn-secondary" onClick={() => csvInputRef.current?.click()}>
            Import CSV file
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importCsvFile(file);
              e.target.value = "";
            }}
          />
        </div>
        <label className="bags-field">
          Players
          <textarea
            rows={6}
            value={rosterCsv}
            placeholder={"Name, Number\nSmith, 12\nJones, 7\nLee, 23"}
            onChange={(e) => onRosterChange(e.target.value)}
            aria-label="Roster CSV"
          />
        </label>
        <p className="bags-names-meta">{rowCount} row{rowCount === 1 ? "" : "s"} detected</p>
      </fieldset>

      <fieldset className="bags-settings-group">
        <legend>Presets</legend>
        <div className="bags-names-presets">
          {NAMES_NUMBERS_PRESETS.map((p) => (
            <button key={p.id} type="button" className="bags-chip" onClick={() => onApplyPreset(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="bags-field">
        Sets per player
        <input
          type="number"
          min={1}
          max={99}
          value={quantity}
          onChange={(e) => onQuantityChange(Math.max(1, Math.round(+e.target.value || 1)))}
        />
      </label>

      <fieldset className="bags-settings-group">
        <legend>Add Names</legend>
        <label className="bags-check">
          <input type="checkbox" checked={includeNames} onChange={(e) => onIncludeNamesChange(e.target.checked)} />
          Include player names
        </label>
        <label className="bags-field">
          Font
          <select
            value={nameFontFamily}
            disabled={!includeNames}
            onChange={(e) => onNameFontFamilyChange(e.target.value)}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.label}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <div className="bags-names-grid">
          <label className="bags-field">
            Size (pt)
            <input
              type="number"
              min={8}
              max={120}
              disabled={!includeNames}
              value={nameFontSize}
              onChange={(e) => onNameFontSizeChange(+e.target.value)}
            />
          </label>
          <label className="bags-field">
            Width (in)
            <input
              type="number"
              min={0.5}
              step={0.1}
              disabled={!includeNames}
              value={nameWidthIn}
              onChange={(e) => onNameWidthInChange(+e.target.value)}
            />
          </label>
          <label className="bags-field">
            Stroke (pt)
            <input
              type="number"
              min={0}
              max={12}
              disabled={!includeNames}
              value={nameStrokeWidth}
              onChange={(e) => onNameStrokeWidthChange(+e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="bags-settings-group">
        <legend>Add Numbers</legend>
        <label className="bags-check">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={(e) => onIncludeNumbersChange(e.target.checked)}
          />
          Include jersey numbers
        </label>
        <label className="bags-field">
          Font
          <select
            value={numberFontFamily}
            disabled={!includeNumbers}
            onChange={(e) => onNumberFontFamilyChange(e.target.value)}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.label}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <div className="bags-names-grid">
          <label className="bags-field">
            Size (pt)
            <input
              type="number"
              min={8}
              max={120}
              disabled={!includeNumbers}
              value={numberFontSize}
              onChange={(e) => onNumberFontSizeChange(+e.target.value)}
            />
          </label>
          <label className="bags-field">
            Width (in)
            <input
              type="number"
              min={0.5}
              step={0.1}
              disabled={!includeNumbers}
              value={numberWidthIn}
              onChange={(e) => onNumberWidthInChange(+e.target.value)}
            />
          </label>
          <label className="bags-field">
            Stroke (pt)
            <input
              type="number"
              min={0}
              max={12}
              disabled={!includeNumbers}
              value={numberStrokeWidth}
              onChange={(e) => onNumberStrokeWidthChange(+e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="bags-settings-group">
        <legend>Layout &amp; colors</legend>
        <label className="bags-field">
          Fill color
          <input type="color" value={textColor} onChange={(e) => onTextColorChange(e.target.value)} />
        </label>
        <label className="bags-field">
          Stroke color
          <input type="color" value={strokeColor} onChange={(e) => onStrokeColorChange(e.target.value)} />
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
