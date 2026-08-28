import { useRef, useState } from "react";
import {
  FONT_OPTIONS,
  NAME_SIZE_PRESETS,
  NUMBER_SIZE_PRESETS,
} from "../gang-sheet/editor-data";

export type NamesNumbersWorkflow = "names" | "numbers";

export type NamesNumbersSizePresetId = "small" | "medium" | "large";

export type BagsNamesNumbersContentProps = {
  workflow: NamesNumbersWorkflow;
  onWorkflowChange: (workflow: NamesNumbersWorkflow) => void;
  namesList: string;
  onNamesListChange: (value: string) => void;
  numbersList: string;
  onNumbersListChange: (value: string) => void;
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
  onApplyNamePreset: (presetId: NamesNumbersSizePresetId) => void;
  onApplyNumberPreset: (presetId: NamesNumbersSizePresetId) => void;
  onGenerateNames: () => void;
  onGenerateNumbers: () => void;
};

function parseLineList(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function BagsNamesNumbersContent(props: BagsNamesNumbersContentProps) {
  const {
    workflow,
    onWorkflowChange,
    namesList,
    onNamesListChange,
    numbersList,
    onNumbersListChange,
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
    onApplyNamePreset,
    onApplyNumberPreset,
    onGenerateNames,
    onGenerateNumbers,
  } = props;

  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState<NamesNumbersWorkflow>("names");
  const nameCount = parseLineList(namesList).length;
  const numberCount = parseLineList(numbersList).length;

  function importCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (importTarget === "names") {
        onNamesListChange(
          lines
            .map((line) => line.split(/[,\t]/)[0]?.trim() ?? line)
            .filter(Boolean)
            .join("\n"),
        );
      } else {
        onNumbersListChange(
          lines
            .map((line) => {
              const parts = line.split(/[,\t]/).map((p) => p.trim());
              return parts.length > 1 ? parts[1] : parts[0];
            })
            .filter(Boolean)
            .join("\n"),
        );
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="bags-names-form">
      <div className="bags-names-tabs" role="tablist" aria-label="Names and numbers workflow">
        <button
          type="button"
          role="tab"
          aria-selected={workflow === "names"}
          className={workflow === "names" ? "bags-chip active" : "bags-chip"}
          onClick={() => onWorkflowChange("names")}
        >
          Add Names
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={workflow === "numbers"}
          className={workflow === "numbers" ? "bags-chip active" : "bags-chip"}
          onClick={() => onWorkflowChange("numbers")}
        >
          Add Numbers
        </button>
      </div>

      {workflow === "names" ? (
        <>
          <p className="bags-names-lead">
            Enter player names — one per line. Use Small, Medium, or Large presets, then generate name
            layers on the sheet.
          </p>
          <fieldset className="bags-settings-group">
            <legend>Import names</legend>
            <div className="bags-names-csv-actions">
              <button
                type="button"
                className="bags-btn bags-btn-secondary"
                onClick={() => {
                  setImportTarget("names");
                  csvInputRef.current?.click();
                }}
              >
                Import CSV file
              </button>
            </div>
            <label className="bags-field">
              Names
              <textarea
                rows={6}
                value={namesList}
                placeholder={"Smith\nJones\nLee"}
                onChange={(e) => onNamesListChange(e.target.value)}
                aria-label="Player names"
              />
            </label>
            <p className="bags-names-meta">
              {nameCount} name{nameCount === 1 ? "" : "s"} detected
            </p>
          </fieldset>
          <fieldset className="bags-settings-group">
            <legend>Name size presets</legend>
            <div className="bags-names-presets">
              {NAME_SIZE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="bags-chip"
                  onClick={() => onApplyNamePreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="bags-field">
            Sets per name
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(1, Math.round(+e.target.value || 1)))}
            />
          </label>
          <fieldset className="bags-settings-group">
            <legend>Name settings</legend>
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
            <div className="bags-names-grid">
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
              <label className="bags-field">
                Width (in)
                <input
                  type="number"
                  min={0.5}
                  step={0.1}
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
                  value={nameStrokeWidth}
                  onChange={(e) => onNameStrokeWidthChange(+e.target.value)}
                />
              </label>
            </div>
          </fieldset>
          <fieldset className="bags-settings-group">
            <legend>Colors</legend>
            <label className="bags-field">
              Fill color
              <input type="color" value={textColor} onChange={(e) => onTextColorChange(e.target.value)} />
            </label>
            <label className="bags-field">
              Stroke color
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => onStrokeColorChange(e.target.value)}
              />
            </label>
          </fieldset>
          <button
            type="button"
            className="bags-btn bags-btn-primary bags-names-generate"
            onClick={onGenerateNames}
          >
            Generate names on sheet
          </button>
        </>
      ) : (
        <>
          <p className="bags-names-lead">
            Enter jersey numbers — one per line. Use Small, Medium, or Large presets, then generate
            number layers on the sheet.
          </p>
          <fieldset className="bags-settings-group">
            <legend>Import numbers</legend>
            <div className="bags-names-csv-actions">
              <button
                type="button"
                className="bags-btn bags-btn-secondary"
                onClick={() => {
                  setImportTarget("numbers");
                  csvInputRef.current?.click();
                }}
              >
                Import CSV file
              </button>
            </div>
            <label className="bags-field">
              Numbers
              <textarea
                rows={6}
                value={numbersList}
                placeholder={"12\n7\n23"}
                onChange={(e) => onNumbersListChange(e.target.value)}
                aria-label="Jersey numbers"
              />
            </label>
            <p className="bags-names-meta">
              {numberCount} number{numberCount === 1 ? "" : "s"} detected
            </p>
          </fieldset>
          <fieldset className="bags-settings-group">
            <legend>Number size presets</legend>
            <div className="bags-names-presets">
              {NUMBER_SIZE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="bags-chip"
                  onClick={() => onApplyNumberPreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="bags-field">
            Sets per number
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(1, Math.round(+e.target.value || 1)))}
            />
          </label>
          <fieldset className="bags-settings-group">
            <legend>Number settings</legend>
            <label className="bags-field">
              Font
              <select
                value={numberFontFamily}
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
                  value={numberStrokeWidth}
                  onChange={(e) => onNumberStrokeWidthChange(+e.target.value)}
                />
              </label>
            </div>
          </fieldset>
          <fieldset className="bags-settings-group">
            <legend>Colors</legend>
            <label className="bags-field">
              Fill color
              <input type="color" value={textColor} onChange={(e) => onTextColorChange(e.target.value)} />
            </label>
            <label className="bags-field">
              Stroke color
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => onStrokeColorChange(e.target.value)}
              />
            </label>
          </fieldset>
          <button
            type="button"
            className="bags-btn bags-btn-primary bags-names-generate"
            onClick={onGenerateNumbers}
          >
            Generate numbers on sheet
          </button>
        </>
      )}

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
  );
}
