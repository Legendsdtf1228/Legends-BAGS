/** Shared BAGS-style editor primitives (Upload by Size + Gang Sheet). */

export const BAGS_ACCENT = "#f97316";
export const BAGS_ACCENT_DARK = "#ea580c";

export const BAGS_BASE_CSS = `
.lgs-editor{--accent:${BAGS_ACCENT};--accent-dark:${BAGS_ACCENT_DARK};--green:#21a366;--line:#dfe3e8;--muted:#667085}
.lgs-editor button,.lgs-editor input,.lgs-editor select{font:inherit}
.checkerboard{background-color:#fff;background-image:linear-gradient(45deg,#e8ebef 25%,transparent 25%),linear-gradient(-45deg,#e8ebef 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e8ebef 75%),linear-gradient(-45deg,transparent 75%,#e8ebef 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0}
.stepper{display:grid;grid-template-columns:32px 1fr 32px;align-items:center;border:1px solid #ccd2da;border-radius:8px;overflow:hidden;background:#fff}
.stepper button{border:0;background:#f3f4f6;color:#111;height:36px;cursor:pointer;font-size:16px;line-height:1}
.stepper button:hover{background:#ffe8d5}
.stepper input{border:0;text-align:center;padding:8px 4px;width:100%;min-width:0}
.preset-row{display:flex;flex-wrap:wrap;gap:6px}
.preset-chip{border:1px solid #ccd2da;background:#fff;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;color:#344054}
.preset-chip:hover,.preset-chip.active{background:#fff7ed;border-color:var(--accent);color:var(--accent-dark)}
.tool-row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.tool-toggle{display:inline-flex;align-items:center;gap:6px;border:1px solid #ccd2da;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:600;background:#fff;color:#475467;cursor:not-allowed;opacity:.65}
.tool-toggle.on{border-color:var(--accent);background:#fff7ed;color:var(--accent-dark);opacity:1;cursor:pointer}
.welcome-icon{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:22px;background:#fff7ed;color:var(--accent-dark)}
`;

type StepperProps = {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (value: number) => void;
};

export function StepperField({
  label,
  value,
  step = 0.1,
  min = 0.1,
  onChange,
}: StepperProps) {
  const bump = (delta: number) => onChange(Math.max(min, round(value + delta)));

  return (
    <label className="stepper-field">
      <span>{label}</span>
      <div className="stepper">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => bump(-step)}>
          −
        </button>
        <input
          type="number"
          min={min}
          step={step}
          value={round(value)}
          onChange={(e) => onChange(Math.max(min, +e.target.value))}
        />
        <button type="button" aria-label={`Increase ${label}`} onClick={() => bump(step)}>
          +
        </button>
      </div>
    </label>
  );
}

type PresetChipsProps = {
  presets: readonly number[];
  activeIn?: number;
  onPick: (inches: number) => void;
};

export function PresetSizeChips({ presets, activeIn, onPick }: PresetChipsProps) {
  return (
    <div className="preset-row">
      {presets.map((inches) => (
        <button
          key={inches}
          type="button"
          className={`preset-chip ${activeIn === inches ? "active" : ""}`}
          onClick={() => onPick(inches)}
        >
          {inches}"
        </button>
      ))}
    </div>
  );
}

export function applyLongestSidePreset(
  widthPx: number,
  heightPx: number,
  longestIn: number,
): { widthIn: number; heightIn: number } {
  const aspect = widthPx / heightPx;
  if (aspect >= 1) {
    return { widthIn: longestIn, heightIn: longestIn / aspect };
  }
  return { widthIn: longestIn * aspect, heightIn: longestIn };
}

function round(v: number) {
  return Math.round(v * 100) / 100;
}
