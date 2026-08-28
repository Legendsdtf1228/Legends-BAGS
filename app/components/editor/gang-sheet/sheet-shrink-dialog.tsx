export type SheetShrinkDialogProps = {
  open: boolean;
  currentWidth: number;
  currentHeight: number;
  nextWidth: number;
  nextHeight: number;
  affectedCount: number;
  onCancel: () => void;
  onResizeOnly: () => void;
  onScaleToFit: () => void;
};

export function SheetShrinkDialog(props: SheetShrinkDialogProps) {
  if (!props.open) return null;

  const {
    currentWidth,
    currentHeight,
    nextWidth,
    nextHeight,
    affectedCount,
    onCancel,
    onResizeOnly,
    onScaleToFit,
  } = props;

  return (
    <div
      className="gs-save-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gs-shrink-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="gs-save-dialog gs-shrink-dialog">
        <header className="gs-save-dialog-head">
          <h2 id="gs-shrink-title">Change sheet size?</h2>
        </header>
        <div className="gs-save-dialog-body" style={{ gridTemplateColumns: "1fr" }}>
          <p className="panel-lead" style={{ margin: 0 }}>
            You are changing the sheet from {currentWidth} × {currentHeight} in to {nextWidth} ×{" "}
            {nextHeight} in.
          </p>
          {affectedCount > 0 ? (
            <p className="gs-save-warn gs-save-warn-danger" role="status">
              {affectedCount} piece{affectedCount === 1 ? "" : "s"} will move or clip with the
              smaller sheet unless you scale the layout.
            </p>
          ) : (
            <p className="gs-save-warn" role="status">
              All artwork still fits on the new sheet size.
            </p>
          )}
          <p className="panel-lead" style={{ margin: 0 }}>
            <strong>Resize sheet only</strong> keeps artwork sizes and clamps positions into the new
            bounds. <strong>Scale layout to fit</strong> shrinks everything proportionally.
          </p>
        </div>
        <footer className="gs-save-dialog-foot">
          <button type="button" className="gs-ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="gs-secondary-btn" onClick={onResizeOnly}>
            Resize sheet only
          </button>
          <button type="button" className="gs-primary-btn" onClick={onScaleToFit}>
            Scale layout to fit
          </button>
        </footer>
      </div>
    </div>
  );
}
