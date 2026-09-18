import type { CSSProperties, ReactNode } from "react";
import { PresetSizeChips } from "../bags-ui";
import { PRODUCTION_WORKFLOW_CSS } from "./workflow-styles";
import {
  SIZE_PRESET_INCHES,
  roundIn,
  type RequestedVsPlaced,
  type WorkflowPhase,
} from "./workflow-helpers";

export function ProductionWorkflowShell(props: {
  title: string;
  subtitle: string;
  appearanceStyle?: CSSProperties;
  extraCss?: string;
  onBack: () => void;
  backLabel?: string;
  nav?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="prod-wf lgs-editor" style={props.appearanceStyle}>
      <style>{PRODUCTION_WORKFLOW_CSS}{props.extraCss ?? ""}</style>
      <header className="prod-wf-bar">
        <div className="prod-wf-brand">
          <span className="prod-wf-mark" aria-hidden>
            L
          </span>
          <span>
            <strong>{props.title}</strong>
            <small>{props.subtitle}</small>
          </span>
        </div>
        <nav className="prod-wf-nav" aria-label="Workflow actions">
          <button type="button" className="prod-wf-btn prod-wf-btn-back" onClick={props.onBack}>
            ← {props.backLabel ?? "Back"}
          </button>
          {props.nav}
        </nav>
      </header>
      {props.children}
    </div>
  );
}

export function WorkflowStepper(props: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
}) {
  const step = props.step ?? 0.1;
  const min = props.min ?? 0.1;
  const bump = (delta: number) => props.onChange(Math.max(min, roundIn(props.value + delta)));
  return (
    <label className={`prod-wf-field ${props.className ?? ""}`}>
      <span>{props.label}</span>
      <div className="prod-wf-stepper">
        <button
          type="button"
          aria-label={`Decrease ${props.label}`}
          disabled={props.disabled}
          onClick={() => bump(-step)}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          step={step}
          value={roundIn(props.value)}
          disabled={props.disabled}
          onChange={(e) => props.onChange(Math.max(min, +e.target.value))}
        />
        <button
          type="button"
          aria-label={`Increase ${props.label}`}
          disabled={props.disabled}
          onClick={() => bump(step)}
        >
          +
        </button>
      </div>
    </label>
  );
}

export function AspectLockToggle(props: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`prod-wf-lock ${props.checked ? "on" : ""}`}
      aria-pressed={props.checked}
      aria-label="Lock aspect ratio"
      disabled={props.disabled}
      onClick={() => props.onChange(!props.checked)}
    >
      {props.checked ? "Locked" : "Unlocked"}
    </button>
  );
}

export function WorkflowDimQtyFields(props: {
  widthIn: number;
  heightIn: number;
  quantity: number;
  lockAspect: boolean;
  disabled?: boolean;
  hideQuantity?: boolean;
  quantityLabel?: string;
  onWidth: (value: number) => void;
  onHeight: (value: number) => void;
  onQuantity?: (value: number) => void;
  onLockAspect: (value: boolean) => void;
  presets?: readonly number[];
  activePresetIn?: number;
  onPreset?: (inches: number) => void;
}) {
  return (
    <div>
      {props.presets && props.onPreset ? (
        <div style={{ marginBottom: 8 }}>
          <PresetSizeChips
            presets={props.presets}
            activeIn={props.activePresetIn}
            onPick={props.onPreset}
          />
        </div>
      ) : null}
      <div className="prod-wf-dims">
        <WorkflowStepper
          label="Width (in)"
          value={props.widthIn}
          step={0.1}
          disabled={props.disabled}
          onChange={props.onWidth}
        />
        <WorkflowStepper
          label="Height (in)"
          value={props.heightIn}
          step={0.1}
          disabled={props.disabled}
          onChange={props.onHeight}
        />
        <AspectLockToggle
          checked={props.lockAspect}
          disabled={props.disabled}
          onChange={props.onLockAspect}
        />
        {props.hideQuantity ? null : (
          <WorkflowStepper
            className="prod-wf-qty"
            label={props.quantityLabel ?? "Quantity"}
            value={props.quantity}
            step={1}
            min={1}
            disabled={props.disabled || !props.onQuantity}
            onChange={(q) => props.onQuantity?.(Math.max(1, Math.round(q)))}
          />
        )}
      </div>
    </div>
  );
}

export function WorkflowProgress(props: {
  status: "idle" | "working" | "ready" | "error";
  step: string;
  detail?: string;
}) {
  return (
    <div className={`prod-wf-progress ${props.status}`} role="status" aria-live="polite">
      <strong>{props.step}</strong>
      {props.detail ? <span>{props.detail}</span> : null}
      <div className="prod-wf-progress-track">
        <div className="prod-wf-progress-bar" />
      </div>
    </div>
  );
}

export function RequestedVsPlacedBanner(props: {
  summary: RequestedVsPlaced;
  remainingLabel?: string;
}) {
  return (
    <div className={`prod-wf-tally ${props.summary.tone}`} role="status" aria-live="polite">
      <div className="prod-wf-tally-cell">
        <span>Requested</span>
        <strong>{props.summary.requested}</strong>
      </div>
      <div className="prod-wf-tally-cell placed">
        <span>Placed</span>
        <strong>{props.summary.placed}</strong>
      </div>
      <div className="prod-wf-tally-cell">
        <span>{props.remainingLabel ?? "Did not fit"}</span>
        <strong>{props.summary.remaining}</strong>
      </div>
      <p className="prod-wf-tally-note">
        {props.summary.headline}. {props.summary.detail}
      </p>
    </div>
  );
}

export function WorkflowAlert(props: {
  tone: "error" | "warn" | "ok";
  title: string;
  body: string;
}) {
  return (
    <div className={`prod-wf-alert ${props.tone}`} role={props.tone === "error" ? "alert" : "status"}>
      <strong>{props.title}</strong>
      <p>{props.body}</p>
    </div>
  );
}

export function PlacementPreview(props: {
  sheetWidth: number;
  sheetHeight: number;
  selectedId?: string | null;
  emptyTitle: string;
  emptyBody: string;
  pieces: Array<{
    id: string;
    xIn: number;
    yIn: number;
    widthIn: number;
    heightIn: number;
    previewUrl?: string;
    label?: string;
    rotationDeg?: number;
    draftId?: string;
    onSheet?: boolean;
  }>;
}) {
  if (!props.pieces.length) {
    return (
      <div className="prod-wf-preview-stage">
        <div className="prod-wf-empty">
          <strong>{props.emptyTitle}</strong>
          <p>{props.emptyBody}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="prod-wf-preview-stage">
      <div
        className="prod-wf-sheet"
        style={{ aspectRatio: `${props.sheetWidth}/${props.sheetHeight}` }}
      >
        <i />
        {props.pieces.map((p) => (
          <div
            key={p.id}
            className={`prod-wf-piece ${p.draftId === props.selectedId ? "highlight" : ""} ${
              p.onSheet === false ? "miss" : ""
            }`}
            style={{
              left: `${(p.xIn / props.sheetWidth) * 100}%`,
              top: `${(p.yIn / props.sheetHeight) * 100}%`,
              width: `${(p.widthIn / props.sheetWidth) * 100}%`,
              height: `${(p.heightIn / props.sheetHeight) * 100}%`,
            }}
            title={p.label}
          >
            {p.previewUrl ? (
              <img
                src={p.previewUrl}
                alt=""
                style={{ transform: `rotate(${p.rotationDeg ?? 0}deg)` }}
              />
            ) : (
              <span>{p.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CopiesThumbStrip(props: {
  previewUrl: string;
  quantity: number;
  max?: number;
}) {
  const max = props.max ?? 24;
  const shown = Math.min(props.quantity, max);
  const extra = props.quantity - shown;
  return (
    <div className="prod-wf-copies" aria-label={`${props.quantity} copies`}>
      {Array.from({ length: shown }, (_, i) => (
        <i key={i} style={{ backgroundImage: `url(${props.previewUrl})` }} />
      ))}
      {extra > 0 ? <i className="more">+{extra}</i> : null}
    </div>
  );
}

export function workflowPhaseSubtitle(phase: WorkflowPhase, setup: string, review: string) {
  return phase === "setup" ? setup : review;
}

export const WORKFLOW_SIZE_PRESETS = SIZE_PRESET_INCHES;
