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
  defaultRosterPlate,
  findDuplicateRosterNumbers,
  parseRosterCsv,
  planRosterPlacements,
  productionAlert,
  summarizeRequestedVsPlaced,
  type WorkflowPhase,
} from "./workflow-helpers";

export function NamesNumbersScreen(props: {
  appearanceStyle: CSSProperties;
  extraCss: string;
  phase: WorkflowPhase;
  rosterCsv: string;
  onRosterCsv: (value: string) => void;
  fontSize: number;
  onFontSize: (value: number) => void;
  widthIn: number;
  heightIn: number;
  lockAspect: boolean;
  onWidth: (value: number) => void;
  onHeight: (value: number) => void;
  onLockAspect: (value: boolean) => void;
  sheetWidth: number;
  sheetHeight: number;
  gap: number;
  error: string;
  onBack: () => void;
  onApplyReview: () => void;
  onBackAdjust: () => void;
  onBuild: () => void;
}) {
  const rows = parseRosterCsv(props.rosterCsv);
  const dupes = findDuplicateRosterNumbers(rows);
  const plan = planRosterPlacements({
    rows,
    sheetWidth: props.sheetWidth,
    sheetHeight: props.sheetHeight,
    gap: props.gap,
    widthIn: props.widthIn,
    heightIn: props.heightIn,
  });
  const tally = summarizeRequestedVsPlaced(plan.requested, plan.onSheet, "name plates");
  const setup = props.phase === "setup";
  const rosterError = !rows.length
    ? "Add roster rows — one name and number per line."
    : dupes.length
      ? `Duplicate numbers found: ${dupes.join(", ")}`
      : props.error;
  const alert = rosterError && (props.phase === "review" || props.error || dupes.length)
    ? productionAlert(rosterError, "names")
    : null;
  const progress = !rows.length
    ? { status: "idle" as const, step: "Waiting for roster", detail: "Paste Name, Number — one player per line." }
    : dupes.length
      ? { status: "error" as const, step: "Duplicate numbers", detail: "Each number must be unique before Apply." }
      : setup
        ? {
            status: "ready" as const,
            step: "Roster layout ready",
            detail: `${plan.onSheet} of ${plan.requested} plates fit on the sheet.`,
          }
        : {
            status: "ready" as const,
            step: "Review requested vs placed",
            detail: "Build writes these name plates onto the canvas.",
          };

  return (
    <ProductionWorkflowShell
      title="Names & Numbers"
      subtitle={setup ? "Roster, plate size — then Apply" : "Review requested vs placed — then Build"}
      appearanceStyle={props.appearanceStyle}
      extraCss={props.extraCss + PRODUCTION_WORKFLOW_CSS}
      onBack={props.onBack}
      nav={
        setup ? (
          <button
            type="button"
            className="prod-wf-btn prod-wf-btn-primary"
            disabled={!rows.length || dupes.length > 0}
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
              disabled={!rows.length || dupes.length > 0}
              onClick={props.onBuild}
            >
              Build {plan.requested}
            </button>
          </>
        )
      }
    >
      <div className="prod-wf-split">
        <section className={`prod-wf-panel ${setup ? "" : "prod-wf-readonly"}`}>
          <div className="prod-wf-head">
            <h2>1. Roster & plate size</h2>
            <p>{rows.length} row{rows.length === 1 ? "" : "s"}</p>
          </div>
          <label className="prod-wf-field" style={{ marginBottom: 12 }}>
            Roster (Name, Number)
            <textarea
              value={props.rosterCsv}
              placeholder={"Smith, 12\nJones, 7"}
              onChange={(e) => props.onRosterCsv(e.target.value)}
              aria-label="Roster CSV"
            />
          </label>
          <label className="prod-wf-field" style={{ marginBottom: 12 }}>
            Font size (pt)
            <input
              type="number"
              min={12}
              max={96}
              value={props.fontSize}
              onChange={(e) => props.onFontSize(+e.target.value)}
            />
          </label>
          <WorkflowDimQtyFields
            widthIn={props.widthIn}
            heightIn={props.heightIn}
            quantity={Math.max(1, rows.length)}
            lockAspect={props.lockAspect}
            disabled={!setup}
            quantityLabel="Quantity (from roster)"
            onWidth={props.onWidth}
            onHeight={props.onHeight}
            onLockAspect={props.onLockAspect}
          />
          <p className="prod-wf-fine" style={{ color: "#5b6573", marginTop: 10 }}>
            Quantity is the roster row count. Width × height is the name plate. Lock keeps plate
            proportion when you change one side.
          </p>
        </section>
        <section className="prod-wf-preview">
          <div className="prod-wf-head">
            <h2>{setup ? "2. Layout preview" : "Review roster"}</h2>
            <p>
              {props.sheetWidth} × {props.sheetHeight} in
            </p>
          </div>
          <WorkflowProgress status={progress.status} step={progress.step} detail={progress.detail} />
          {rows.length ? (
            <RequestedVsPlacedBanner
              summary={{
                ...tally,
                remaining: plan.offSheet,
                detail:
                  plan.offSheet > 0
                    ? `${plan.offSheet} plate${plan.offSheet === 1 ? "" : "s"} sit past the sheet edge — increase sheet length or shrink height, then Apply again.`
                    : tally.detail,
              }}
              remainingLabel="Past sheet edge"
            />
          ) : null}
          <PlacementPreview
            sheetWidth={props.sheetWidth}
            sheetHeight={props.sheetHeight}
            emptyTitle="Roster preview"
            emptyBody="Paste players on the left. Preview shows plate size and what fits on this sheet."
            pieces={plan.placements.map((p, idx) => ({
              id: `roster-${idx}`,
              xIn: p.xIn,
              yIn: p.yIn,
              widthIn: p.widthIn,
              heightIn: p.heightIn,
              label: p.label,
              onSheet: p.onSheet,
            }))}
          />
          {alert ? <WorkflowAlert tone="error" title={alert.title} body={alert.body} /> : null}
          <p className="prod-wf-fine">
            {setup
              ? "Apply reviews requested vs placed. Build still writes every roster row (same as before), including any that sit past the edge."
              : "Back edits the roster or plate size. Build adds the name plates to the canvas."}
          </p>
        </section>
      </div>
    </ProductionWorkflowShell>
  );
}

export { defaultRosterPlate };
