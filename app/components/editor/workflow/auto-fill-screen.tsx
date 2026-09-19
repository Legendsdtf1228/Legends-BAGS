import type { CSSProperties } from "react";
import {
  PlacementPreview,
  ProductionWorkflowShell,
  RequestedVsPlacedBanner,
  WorkflowAlert,
  WorkflowDimQtyFields,
  WorkflowProgress,
} from "./workflow-controls";
import { PRODUCTION_WORKFLOW_CSS } from "./workflow-styles";
import {
  planFillSheetCopies,
  productionAlert,
  summarizeRequestedVsPlaced,
  WORKFLOW_SIZE_PRESETS,
  type FillOccupied,
  type WorkflowPhase,
} from "./workflow-helpers";

export type AutoFillSource = {
  id: string;
  name: string;
  previewUrl: string;
  widthIn: number;
  heightIn: number;
  widthPx: number;
  heightPx: number;
  lockAspect: boolean;
  kind?: string;
};

export function AutoFillScreen(props: {
  appearanceStyle: CSSProperties;
  extraCss: string;
  phase: WorkflowPhase;
  source: AutoFillSource;
  sheetWidth: number;
  sheetHeight: number;
  gap: number;
  widthIn: number;
  heightIn: number;
  quantity: number;
  lockAspect: boolean;
  onWidth: (value: number) => void;
  onHeight: (value: number) => void;
  onQuantity: (value: number) => void;
  onLockAspect: (value: boolean) => void;
  onPreset: (inches: number) => void;
  error: string;
  occupied?: Array<
    FillOccupied & {
      id: string;
      previewUrl?: string;
      label?: string;
      rotationDeg?: number;
    }
  >;
  onBack: () => void;
  onApplyReview: () => void;
  onBackAdjust: () => void;
  onBuild: () => void;
}) {
  const occupied = props.occupied ?? [];
  const plan = planFillSheetCopies({
    widthIn: props.widthIn,
    heightIn: props.heightIn,
    sheetWidth: props.sheetWidth,
    sheetHeight: props.sheetHeight,
    gap: props.gap,
    requested: props.quantity,
    occupied,
  });
  const tally = summarizeRequestedVsPlaced(props.quantity, plan.placed, "copies");
  const setup = props.phase === "setup";
  const alert = props.error ? productionAlert(props.error, "auto-fill") : null;
  const progress =
    plan.placed <= 0
      ? {
          status: "error" as const,
          step: "Nothing fits at this size",
          detail: "Reduce width × height or increase sheet length.",
        }
      : setup
        ? {
            status: "ready" as const,
            step: "Fill preview ready",
            detail: `${plan.placed} of ${props.quantity} copies fit on ${props.sheetWidth} × ${props.sheetHeight} in.`,
          }
        : {
            status: "ready" as const,
            step: "Review requested vs placed",
            detail: "Build writes these copies onto the sheet. The original piece is replaced.",
          };

  return (
    <ProductionWorkflowShell
      title="Auto Fill"
      subtitle={setup ? "Quantity and size — then Apply" : "Review requested vs placed — then Build"}
      appearanceStyle={props.appearanceStyle}
      extraCss={props.extraCss + PRODUCTION_WORKFLOW_CSS}
      onBack={props.onBack}
      nav={
        setup ? (
          <button
            type="button"
            className="prod-wf-btn prod-wf-btn-primary"
            disabled={plan.placed <= 0}
            onClick={props.onApplyReview}
          >
            Apply
          </button>
        ) : (
          <>
            <button type="button" className="prod-wf-btn prod-wf-btn-ghost" onClick={props.onBackAdjust}>
              Back and adjust
            </button>
            <button
              type="button"
              className="prod-wf-btn prod-wf-btn-primary"
              disabled={plan.placed <= 0}
              onClick={props.onBuild}
            >
              Build {plan.placed}
            </button>
          </>
        )
      }
    >
      <div className="prod-wf-split">
        <section className={`prod-wf-panel ${setup ? "" : "prod-wf-readonly"}`}>
          <div className="prod-wf-head">
            <h2>1. Copy size</h2>
            <p>{props.source.name}</p>
          </div>
          <div className="prod-wf-art-preview">
            <img src={props.source.previewUrl} alt="" />
          </div>
          <p className="prod-wf-fine" style={{ color: "#5b6573", margin: "8px 0 12px" }}>
            Repeats the selected artwork left-to-right, top-to-bottom. Existing pieces stay put;
            copies skip those spots. Quantity is how many you want; Placed is how many fit.
          </p>
          <WorkflowDimQtyFields
            widthIn={props.widthIn}
            heightIn={props.heightIn}
            quantity={props.quantity}
            lockAspect={props.lockAspect}
            disabled={!setup}
            quantityLabel="Requested copies"
            presets={WORKFLOW_SIZE_PRESETS}
            onWidth={props.onWidth}
            onHeight={props.onHeight}
            onQuantity={props.onQuantity}
            onLockAspect={props.onLockAspect}
            onPreset={props.onPreset}
          />
          <p className="prod-wf-fine" style={{ color: "#5b6573", marginTop: 10 }}>
            Sheet capacity at this size: {plan.capacity} copies (spacing {props.gap} in).
          </p>
        </section>
        <section className="prod-wf-preview">
          <div className="prod-wf-head">
            <h2>{setup ? "2. Fill preview" : "Review fill"}</h2>
            <p>
              {props.sheetWidth} × {props.sheetHeight} in
            </p>
          </div>
          <WorkflowProgress status={progress.status} step={progress.step} detail={progress.detail} />
          <RequestedVsPlacedBanner summary={tally} />
          <PlacementPreview
            sheetWidth={props.sheetWidth}
            sheetHeight={props.sheetHeight}
            emptyTitle="Nothing to preview"
            emptyBody="Reduce width × height so at least one copy fits around existing artwork."
            pieces={[
              ...occupied.map((item) => ({
                id: item.id,
                xIn: item.xIn,
                yIn: item.yIn,
                widthIn: item.widthIn,
                heightIn: item.heightIn,
                previewUrl: item.previewUrl,
                label: item.label,
                rotationDeg: item.rotationDeg,
              })),
              ...plan.copies.map((c, idx) => ({
                id: `fill-${idx}`,
                xIn: c.xIn,
                yIn: c.yIn,
                widthIn: props.widthIn,
                heightIn: props.heightIn,
                previewUrl: props.source.previewUrl,
                label: props.source.name,
              })),
            ]}
          />
          {alert ? <WorkflowAlert tone="error" title={alert.title} body={alert.body} /> : null}
          <p className="prod-wf-fine">
            {setup
              ? "Apply reviews requested vs placed. Build replaces the selected piece and leaves other artwork in place."
              : "Back changes quantity or size. Build places only the copies that fit around existing artwork."}
          </p>
        </section>
      </div>
    </ProductionWorkflowShell>
  );
}
