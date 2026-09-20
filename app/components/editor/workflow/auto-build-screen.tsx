import type { CSSProperties, ReactNode } from "react";
import { applyLongestSidePreset } from "../bags-ui";
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
  productionAlert,
  summarizeRequestedVsPlaced,
  WORKFLOW_SIZE_PRESETS as SIZE_PRESETS,
  type WorkflowPhase,
} from "./workflow-helpers";

export type AutoBuildDraft = {
  id: string;
  previewUrl: string;
  name: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
  lockAspect: boolean;
  asset: { widthPx: number; heightPx: number };
};

export type AutoBuildPreview = {
  sheetWidthIn: number;
  sheetHeightIn: number;
  utilization: number;
  pieces: Array<{
    id: string;
    draftId: string;
    previewUrl: string;
    name: string;
    xIn: number;
    yIn: number;
    widthIn: number;
    heightIn: number;
    rotationDeg: 0 | 90;
  }>;
  totalPieces: number;
  totalAreaSqIn: number;
  estimateUsd: number;
  fittedCount?: number;
  remainingCount?: number;
};

type PoolItem = { id: string; previewUrl: string; name: string };
type GalleryItem = { id: string; thumb: string; name: string };

export function AutoBuildScreen(props: {
  appearanceStyle: CSSProperties;
  extraCss: string;
  phase: WorkflowPhase;
  drafts: AutoBuildDraft[];
  selectedDraftId: string | null;
  onSelectDraft: (id: string) => void;
  sheetWidth: number;
  sheetHeight: number;
  gap: number;
  sheetWidths: readonly number[];
  sheetHeights: readonly number[];
  onSheetWidth: (value: number) => void;
  onSheetHeight: (value: number) => void;
  onGap: (value: number) => void;
  allowRotate90: boolean;
  onAllowRotate90: (value: boolean) => void;
  uploadTab: "upload" | "pool" | "gallery";
  onUploadTab: (tab: "upload" | "pool" | "gallery") => void;
  uploading: boolean;
  onUploadFiles: (files: File[]) => void;
  uploadPool: PoolItem[];
  galleryItems: GalleryItem[];
  onAddPoolItem: (id: string) => void;
  onAddGalleryItem: (id: string) => void;
  onPatchDraft: (
    id: string,
    patch: Partial<Pick<AutoBuildDraft, "widthIn" | "heightIn" | "quantity" | "lockAspect" | "name">>,
  ) => void;
  onDuplicateDraft: (id: string) => void;
  onRemoveDraft: (id: string) => void;
  preview: AutoBuildPreview | null;
  previewLoading: boolean;
  previewError: string;
  error: string;
  message: string;
  busy: boolean;
  onBack: () => void;
  onApplyReview: () => void;
  onUndo: () => void;
  onRegenerate: () => void;
  onBackAdjust: () => void;
  onBuild: () => void;
}) {
  const requested = props.drafts.reduce((sum, d) => sum + d.quantity, 0);
  const placed = props.preview?.fittedCount ?? props.preview?.pieces.length ?? 0;
  const tally = summarizeRequestedVsPlaced(requested, placed, "copies");
  const previewW = props.preview?.sheetWidthIn ?? props.sheetWidth;
  const previewH = props.preview?.sheetHeightIn ?? props.sheetHeight;
  const heightWarning =
    props.preview && props.preview.sheetHeightIn > props.sheetHeight
      ? `Needs ~${props.preview.sheetHeightIn.toFixed(1)} in length — increase max sheet length or remove items.`
      : "";
  const setup = props.phase === "setup";
  const canApply = props.drafts.length > 0 && !props.previewError && !props.previewLoading;
  const progress = progressForAutoBuild({
    setup,
    uploading: props.uploading,
    loading: props.previewLoading,
    busy: props.busy,
    hasDrafts: props.drafts.length > 0,
    hasPreview: Boolean(props.preview?.pieces.length),
    error: props.previewError || props.error,
    remaining: tally.remaining,
  });
  const alert = props.error
    ? productionAlert(props.error, "auto-build")
    : props.previewError
      ? productionAlert(props.previewError, "auto-build")
      : heightWarning
        ? productionAlert(heightWarning, "auto-build")
        : null;

  const nav: ReactNode = setup ? (
    <>
      <label className="prod-wf-btn prod-wf-btn-upload">
        {props.uploading ? "Uploading…" : "Upload images"}
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg"
          hidden
          onChange={(e) => void props.onUploadFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      <button
        type="button"
        className="prod-wf-btn prod-wf-btn-primary"
        disabled={!canApply}
        onClick={props.onApplyReview}
      >
        Apply
      </button>
    </>
  ) : (
    <>
      <button type="button" className="prod-wf-btn prod-wf-btn-quiet" onClick={props.onUndo} aria-label="Undo auto nest result">
        Undo
      </button>
      <button
        type="button"
        className="prod-wf-btn prod-wf-btn-quiet"
        disabled={props.previewLoading || !props.drafts.length}
        onClick={props.onRegenerate}
        aria-label="Regenerate nest preview"
      >
        {props.previewLoading ? "Regenerating…" : "Regenerate"}
      </button>
      <button type="button" className="prod-wf-btn prod-wf-btn-ghost" onClick={props.onBackAdjust}>
        Back and adjust
      </button>
      <button
        type="button"
        className="prod-wf-btn prod-wf-btn-primary"
        disabled={props.busy || !props.preview?.pieces.length}
        onClick={props.onBuild}
        aria-label="Accept nest and continue to editor"
      >
        {props.busy ? "Building…" : `Build ${placed || ""}`.trim()}
      </button>
    </>
  );

  return (
    <ProductionWorkflowShell
      title="Auto Build"
      subtitle={setup ? "Size, quantity, preview — then Apply" : "Review requested vs placed — then Build"}
      appearanceStyle={props.appearanceStyle}
      extraCss={props.extraCss + PRODUCTION_WORKFLOW_CSS}
      onBack={props.onBack}
      nav={nav}
    >
      <div className="prod-wf-split">
        <section className={`prod-wf-panel ${setup ? "" : "prod-wf-readonly"}`}>
          <div className="prod-wf-head">
            <h2>{setup ? "1. Artwork & size" : "Your designs"}</h2>
            <p>
              {props.drafts.length} design{props.drafts.length === 1 ? "" : "s"}
            </p>
          </div>

          {setup ? (
            <div className="prod-wf-tabs">
              <button
                type="button"
                className={`prod-wf-tab ${props.uploadTab === "upload" ? "active" : ""}`}
                onClick={() => props.onUploadTab("upload")}
              >
                Upload image(s)
              </button>
              <button
                type="button"
                className={`prod-wf-tab ${props.uploadTab === "pool" ? "active" : ""}`}
                onClick={() => props.onUploadTab("pool")}
              >
                My images
              </button>
              <button
                type="button"
                className={`prod-wf-tab ${props.uploadTab === "gallery" ? "active" : ""}`}
                onClick={() => props.onUploadTab("gallery")}
              >
                Gallery
              </button>
            </div>
          ) : null}

          {!props.drafts.length && setup && props.uploadTab === "upload" ? (
            <label className="prod-wf-drop">
              <strong>Upload images</strong>
              <small>PNG/JPEG · multiple files</small>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/svg+xml,.svg"
                hidden
                onChange={(e) => void props.onUploadFiles(Array.from(e.target.files ?? []))}
              />
            </label>
          ) : null}

          {!props.drafts.length && setup && props.uploadTab === "pool" ? (
            <div className="prod-wf-list">
              {!props.uploadPool.length ? (
                <p className="prod-wf-fine" style={{ color: "#5b6573" }}>
                  Upload images in the main editor first — they appear here.
                </p>
              ) : (
                props.uploadPool.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="prod-wf-row"
                    onClick={() => props.onAddPoolItem(p.id)}
                    disabled={props.uploading}
                  >
                    <img src={p.previewUrl} alt="" />
                    <strong>{p.name}</strong>
                  </button>
                ))
              )}
            </div>
          ) : null}

          {!props.drafts.length && setup && props.uploadTab === "gallery" ? (
            <div className="prod-wf-list" style={{ gridTemplateColumns: "1fr 1fr", display: "grid" }}>
              {props.galleryItems.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="prod-wf-row"
                  style={{ gridTemplateColumns: "1fr" }}
                  onClick={() => props.onAddGalleryItem(g.id)}
                  disabled={props.uploading}
                >
                  <img src={g.thumb} alt="" />
                  <strong>{g.name}</strong>
                </button>
              ))}
            </div>
          ) : null}

          {props.drafts.length ? (
            <>
              <div className="prod-wf-sheet-settings">
                <label className="prod-wf-field">
                  Sheet width
                  <select value={props.sheetWidth} onChange={(e) => props.onSheetWidth(+e.target.value)}>
                    {props.sheetWidths.map((w) => (
                      <option key={w} value={w}>
                        {w} in
                      </option>
                    ))}
                  </select>
                </label>
                <label className="prod-wf-field">
                  Max length
                  <select value={props.sheetHeight} onChange={(e) => props.onSheetHeight(+e.target.value)}>
                    {props.sheetHeights.map((h) => (
                      <option key={h} value={h}>
                        {h} in
                      </option>
                    ))}
                  </select>
                </label>
                <label className="prod-wf-field">
                  Spacing
                  <input
                    type="number"
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={props.gap}
                    onChange={(e) => props.onGap(+e.target.value)}
                  />
                </label>
              </div>
              <label className="prod-wf-check">
                <input
                  type="checkbox"
                  checked={props.allowRotate90}
                  disabled={!setup}
                  onChange={(e) => props.onAllowRotate90(e.target.checked)}
                />
                Allow 90° rotation when nesting
              </label>
              <div className="prod-wf-list">
                {props.drafts.map((d) => (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    className={`prod-wf-row ${d.id === props.selectedDraftId ? "active" : ""}`}
                    onClick={() => props.onSelectDraft(d.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        props.onSelectDraft(d.id);
                      }
                    }}
                  >
                    <img src={d.previewUrl} alt="" />
                    <div>
                      <strong>{d.name}</strong>
                      <WorkflowDimQtyFields
                        widthIn={d.widthIn}
                        heightIn={d.heightIn}
                        quantity={d.quantity}
                        lockAspect={d.lockAspect}
                        disabled={!setup}
                        presets={SIZE_PRESETS}
                        onWidth={(w) => {
                          const aspect = d.asset.widthPx / d.asset.heightPx;
                          props.onPatchDraft(d.id, {
                            widthIn: w,
                            heightIn: d.lockAspect ? w / aspect : d.heightIn,
                          });
                        }}
                        onHeight={(h) => {
                          const aspect = d.asset.widthPx / d.asset.heightPx;
                          props.onPatchDraft(d.id, {
                            heightIn: h,
                            widthIn: d.lockAspect ? h * aspect : d.widthIn,
                          });
                        }}
                        onQuantity={(q) => props.onPatchDraft(d.id, { quantity: q })}
                        onLockAspect={(lockAspect) => props.onPatchDraft(d.id, { lockAspect })}
                        onPreset={(inches) => {
                          const dims = applyLongestSidePreset(d.asset.widthPx, d.asset.heightPx, inches);
                          props.onPatchDraft(d.id, { ...dims, lockAspect: true });
                        }}
                      />
                      <small>
                        {(d.widthIn * d.heightIn * d.quantity).toFixed(2)} in² · {d.asset.widthPx}×
                        {d.asset.heightPx}px
                      </small>
                    </div>
                    <div className="prod-wf-row-actions">
                      {setup ? (
                        <>
                          <button
                            type="button"
                            className="dup"
                            onClick={(e) => {
                              e.stopPropagation();
                              props.onDuplicateDraft(d.id);
                            }}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            className="remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              props.onRemoveDraft(d.id);
                            }}
                          >
                            ×
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              {setup ? (
                <label className="prod-wf-btn prod-wf-btn-ghost" style={{ width: "100%", marginTop: 12, color: "#111", borderColor: "#ccd2da", background: "#fff" }}>
                  ＋ Add more images
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    hidden
                    onChange={(e) => void props.onUploadFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
              ) : null}
            </>
          ) : null}
        </section>

        <section className="prod-wf-preview">
          <div className="prod-wf-head">
            <h2>{setup ? "2. Nest preview" : "Review nest"}</h2>
            <p>{placed} on sheet</p>
          </div>
          <WorkflowProgress status={progress.status} step={progress.step} detail={progress.detail} />
          {props.preview || requested ? <RequestedVsPlacedBanner summary={tally} /> : null}
          <PlacementPreview
            sheetWidth={previewW}
            sheetHeight={previewH}
            selectedId={props.selectedDraftId}
            emptyTitle={props.previewError ? "Nest preview failed" : "Preview appears here"}
            emptyBody={
              props.previewError
                ? productionAlert(props.previewError, "auto-build").body
                : "Upload images and set width × height and quantity. Nesting updates automatically."
            }
            pieces={(props.preview?.pieces ?? []).map((p) => ({
              id: p.id,
              draftId: p.draftId,
              previewUrl: p.previewUrl,
              label: p.name,
              xIn: p.xIn,
              yIn: p.yIn,
              widthIn: p.widthIn,
              heightIn: p.heightIn,
              rotationDeg: p.rotationDeg,
            }))}
          />
          <div className="prod-wf-stats">
            <p>
              <span>Sheet size</span>
              <strong>
                {previewW} × {previewH.toFixed(1)} in
              </strong>
            </p>
            <p>
              <span>Requested copies</span>
              <strong>{requested}</strong>
            </p>
            <p>
              <span>Placed copies</span>
              <strong>{placed}</strong>
            </p>
            <p>
              <span>Printed area</span>
              <strong>{(props.preview?.totalAreaSqIn ?? 0).toFixed(2)} in²</strong>
            </p>
            <p>
              <span>Utilization</span>
              <strong>{props.preview ? `${Math.round(props.preview.utilization * 100)}%` : "—"}</strong>
            </p>
            <p>
              <span>Est. price</span>
              <strong>${(props.preview?.estimateUsd ?? 0).toFixed(2)}</strong>
            </p>
          </div>
          {alert ? <WorkflowAlert tone="error" title={alert.title} body={alert.body} /> : null}
          {!props.error && props.message ? (
            <WorkflowAlert tone="ok" title="Ready" body={props.message} />
          ) : null}
          <p className="prod-wf-fine">
            {setup
              ? "Apply locks this nest for review. Requested vs placed is checked before anything is built on the canvas."
              : "Build places only the copies that fit. Back returns to size and quantity."}
          </p>
        </section>
      </div>
    </ProductionWorkflowShell>
  );
}

function progressForAutoBuild(input: {
  setup: boolean;
  uploading: boolean;
  loading: boolean;
  busy: boolean;
  hasDrafts: boolean;
  hasPreview: boolean;
  error: string;
  remaining: number;
}): { status: "idle" | "working" | "ready" | "error"; step: string; detail: string } {
  if (input.uploading) {
    return { status: "working", step: "Uploading artwork", detail: "Reading files and creating previews." };
  }
  if (input.busy) {
    return { status: "working", step: "Building the sheet", detail: "Writing nested copies onto the canvas." };
  }
  if (input.loading) {
    return { status: "working", step: "Nesting copies on the sheet", detail: "Checking what fits at these sizes." };
  }
  if (input.error) {
    return { status: "error", step: "Nesting stopped", detail: "See the error below — fix size or quantity, then Apply." };
  }
  if (!input.hasDrafts) {
    return { status: "idle", step: "Waiting for artwork", detail: "Upload a file, then set width × height and quantity." };
  }
  if (input.hasPreview && input.setup) {
    return {
      status: "ready",
      step: input.remaining ? "Live nest — some copies will not fit" : "Live nest ready",
      detail: "Adjust size or quantity, then Apply to review.",
    };
  }
  if (input.hasPreview) {
    return {
      status: "ready",
      step: "Review requested vs placed",
      detail: "Build writes this nest to the canvas.",
    };
  }
  return { status: "idle", step: "Waiting for nest", detail: "Set quantity and size to generate a preview." };
}

export { SIZE_PRESETS as AUTO_BUILD_PRESETS };
