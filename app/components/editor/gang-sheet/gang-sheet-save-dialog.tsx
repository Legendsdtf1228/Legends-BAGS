import type { QualitySummary } from "./dpi-quality";
import { ToolbarIcon } from "./editor-toolbar-icons";
import {
  buildProductionReview,
  countMissingArtwork,
  formatMegapixels,
  formatPixelSize,
  formatSheetInches,
  type ReviewArtwork,
} from "./production-review";

export type GangSheetSaveDialogProps = {
  open: boolean;
  designName: string | null;
  onDesignNameChange: (name: string) => void;
  sheetWidth: number;
  sheetHeight: number;
  quantity: number;
  artworkCount: number;
  estimateUsd: number;
  overlapCount: number;
  oobCount: number;
  lowDpiCount: number;
  qualitySummary: QualitySummary;
  previewUrl?: string | null;
  artwork?: ReviewArtwork[];
  saving: boolean;
  error?: string;
  requestId?: string;
  onCancel: () => void;
  onSaveOnly: () => void;
  onSaveAndCart: () => void;
};

const THUMB_LIMIT = 8;

export function GangSheetSaveDialog(props: GangSheetSaveDialogProps) {
  if (!props.open) return null;

  const {
    designName,
    onDesignNameChange,
    sheetWidth,
    sheetHeight,
    quantity,
    artworkCount,
    estimateUsd,
    overlapCount,
    oobCount,
    lowDpiCount,
    qualitySummary,
    previewUrl,
    artwork = [],
    saving,
    error,
    requestId,
    onCancel,
    onSaveOnly,
    onSaveAndCart,
  } = props;

  const missingArtworkCount =
    artwork.length > 0 ? countMissingArtwork(artwork) : 0;

  const review = buildProductionReview({
    sheetWidthIn: sheetWidth,
    sheetHeightIn: sheetHeight,
    quantity,
    artworkCount,
    missingArtworkCount,
    overlapCount,
    oobCount,
    lowDpiCount,
    qualitySummary,
  });

  const thumbs = artwork.slice(0, THUMB_LIMIT);
  const extraThumbs = Math.max(0, artwork.length - thumbs.length);
  const dpiWatch = qualitySummary.low + qualitySummary.poor + qualitySummary.unknown;
  const exportDisabled = saving || !review.canExport;

  return (
    <div
      className="gs-save-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gs-save-dialog-title"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !saving) onCancel();
      }}
    >
      <div className="gs-save-dialog" data-readiness={review.readiness}>
        <header className="gs-save-dialog-head">
          <div className="pr-head-copy">
            <p className="pr-kicker">Pre-print checkpoint</p>
            <h2 id="gs-save-dialog-title">Production Review</h2>
            <p className="pr-head-hint">{review.statusHint}</p>
          </div>
          <span className="pr-status" data-readiness={review.readiness} role="status">
            {review.statusLabel}
          </span>
          <button type="button" className="gs-icon-btn" onClick={onCancel} disabled={saving} aria-label="Close">
            <ToolbarIcon name="close" />
          </button>
        </header>

        <div className="pr-scope" aria-label="Review scope">
          <div data-scope="sheet">
            <span>Active sheet</span>
            <strong>{formatSheetInches(sheetWidth, sheetHeight)}</strong>
            <small>This checkpoint covers the sheet on the canvas — not other jobs.</small>
          </div>
          <div data-scope="job">
            <span>Job quantity</span>
            <strong>
              {review.quantity} {review.quantity === 1 ? "copy" : "copies"}
            </strong>
            <small>Ordered copies of this same layout. Does not add more sheets.</small>
          </div>
        </div>

        <div className="gs-save-dialog-body">
          <div className="pr-art">
            <p className="pr-art-label">Artwork on sheet</p>
            {thumbs.length ? (
              <>
                <div className="pr-thumbs">
                  {thumbs.map((item) => (
                    <figure key={item.id}>
                      {item.kind === "text" ? (
                        <div className="pr-thumb-text" aria-hidden>
                          T
                        </div>
                      ) : item.previewUrl ? (
                        <img src={item.previewUrl} alt="" className="checkerboard" />
                      ) : (
                        <div className="pr-thumb-empty">{item.assetId ? "No preview" : "Missing"}</div>
                      )}
                      <figcaption>{item.name || "Untitled"}</figcaption>
                    </figure>
                  ))}
                </div>
                {extraThumbs > 0 ? (
                  <p className="pr-thumbs-more">+{extraThumbs} more on this sheet</p>
                ) : null}
              </>
            ) : previewUrl ? (
              <div className="gs-save-preview">
                <img src={previewUrl} alt="" className="checkerboard" />
              </div>
            ) : (
              <div className="gs-save-preview-empty">No artwork preview</div>
            )}
          </div>

          <div className="gs-save-fields">
            <label className="gs-save-field">
              Filename
              <input
                type="text"
                value={designName ?? ""}
                placeholder="Untitled design"
                maxLength={80}
                onChange={(e) => onDesignNameChange(e.target.value)}
                aria-label="Design name"
              />
              <span className="pr-field-hint">
                Saved design name only. Does not change print-file naming in the exporter.
              </span>
            </label>

            <dl className="gs-save-summary pr-facts">
              <div>
                <dt>Sheet size</dt>
                <dd>{formatSheetInches(sheetWidth, sheetHeight)}</dd>
              </div>
              <div>
                <dt>Pixel size @ {review.outputDpi} DPI</dt>
                <dd>{formatPixelSize(review.widthPx, review.heightPx)}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>
                  {review.quantity} {review.quantity === 1 ? "copy" : "copies"}
                </dd>
              </div>
              <div>
                <dt>Artwork on sheet</dt>
                <dd>
                  {artworkCount} piece{artworkCount === 1 ? "" : "s"}
                </dd>
              </div>
              <div>
                <dt>Output memory</dt>
                <dd>
                  {formatMegapixels(review.widthPx * review.heightPx)}
                  {review.usesTiledRender ? " · tiled" : " · in-process"}
                </dd>
              </div>
              <div>
                <dt>Verified price</dt>
                <dd>${estimateUsd.toFixed(2)}</dd>
              </div>
              <div>
                <dt>DPI excellent / good</dt>
                <dd>
                  {qualitySummary.excellent} / {qualitySummary.good}
                </dd>
              </div>
              <div>
                <dt>DPI low / poor / unknown</dt>
                <dd>{dpiWatch}</dd>
              </div>
            </dl>

            <div className="pr-issues">
              {review.blocking.length ? (
                <section className="pr-issue-group blocking" aria-label="Blocking issues">
                  <h3>Blocking</h3>
                  <ul>
                    {review.blocking.map((issue) => (
                      <li key={issue.id}>
                        <strong>{issue.title}</strong>
                        <p>{issue.detail}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {review.cautions.length ? (
                <section className="pr-issue-group caution" aria-label="Cautions">
                  <h3>Caution</h3>
                  <ul>
                    {review.cautions.map((issue) => (
                      <li key={issue.id}>
                        <strong>{issue.title}</strong>
                        <p>{issue.detail}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {!review.blocking.length && !review.cautions.length ? (
                <p className="pr-ok">No blocking issues or cautions on the active sheet.</p>
              ) : null}
            </div>

            {error ? (
              <p className="gs-save-error" role="alert">
                {error}
                {requestId ? ` Reference: ${requestId}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="gs-save-dialog-foot">
          <p className="pr-foot-note">
            {review.canExport
              ? "Save uses the existing exporter. This screen only reports readiness."
              : review.statusHint}
          </p>
          <button type="button" className="gs-ghost-btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="gs-secondary-btn"
            onClick={onSaveOnly}
            disabled={exportDisabled}
          >
            {saving ? "Saving…" : "Save only"}
          </button>
          <button
            type="button"
            className="gs-primary-btn"
            onClick={onSaveAndCart}
            disabled={exportDisabled}
          >
            {saving ? "Saving…" : "Save & Add to Cart"}
          </button>
        </footer>
      </div>
    </div>
  );
}
