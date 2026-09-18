import { useState, type DragEvent, type MouseEvent } from "react";
import { clampQuantity, type DpiTier } from "./artwork-library-model";

export type ArtworkCardProps = {
  id: string;
  name: string;
  thumbUrl: string;
  dimLabel: string;
  pixelLabel?: string;
  dpiLabel?: string;
  dpiTier?: DpiTier;
  category?: string;
  onSheetCount?: number;
  uploading?: boolean;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLElement>) => void;
  onAddToSheet: (quantity: number) => void;
  renameValue?: string;
  onRename?: (name: string) => void;
  onRemoveBackground?: () => void;
  onDelete?: () => void;
};

export function ArtworkCard({
  id,
  name,
  thumbUrl,
  dimLabel,
  pixelLabel,
  dpiLabel,
  dpiTier,
  category,
  onSheetCount = 0,
  uploading,
  draggable,
  onDragStart,
  onAddToSheet,
  renameValue,
  onRename,
  onRemoveBackground,
  onDelete,
}: ArtworkCardProps) {
  const [qty, setQty] = useState(1);
  const onSheet = onSheetCount > 0;

  function add(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (uploading) return;
    onAddToSheet(clampQuantity(qty));
  }

  return (
    <article className={`lgs-artlib-card${onSheet ? " on-sheet" : ""}`} data-artwork-id={id}>
      <button
        type="button"
        className="lgs-artlib-thumb"
        title="Add to sheet"
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={() => add()}
        disabled={uploading}
      >
        <img src={thumbUrl} alt="" />
        <span className="lgs-artlib-badges">
          <em className="lgs-artlib-badge">{dimLabel}</em>
          {dpiLabel ? (
            <em className={`lgs-artlib-badge dpi-${dpiTier ?? "unknown"}`}>{dpiLabel}</em>
          ) : null}
          {onSheet ? (
            <em className="lgs-artlib-badge on-sheet">
              {onSheetCount} on sheet
            </em>
          ) : null}
        </span>
      </button>
      <div className="lgs-artlib-name" title={name}>
        {name}
      </div>
      <div className="lgs-artlib-meta">
        {pixelLabel ? <span>{pixelLabel}</span> : null}
        {category ? <span>{category}</span> : null}
        {dpiLabel ? <b className={`dpi-badge tier-${dpiTier ?? "unknown"}`}>{dpiLabel}</b> : null}
      </div>
      <div className="lgs-artlib-addrow">
        <div className="lgs-artlib-qty">
          <button
            type="button"
            aria-label={`Decrease quantity for ${name}`}
            onClick={() => setQty((q) => clampQuantity(q - 1))}
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={qty}
            aria-label={`Quantity for ${name}`}
            onChange={(e) => setQty(clampQuantity(+e.target.value))}
          />
          <button
            type="button"
            aria-label={`Increase quantity for ${name}`}
            onClick={() => setQty((q) => clampQuantity(q + 1))}
          >
            +
          </button>
        </div>
        <button type="button" className="lgs-artlib-add" disabled={uploading} onClick={(e) => add(e)}>
          Add to Sheet
        </button>
      </div>
      {onRename || onRemoveBackground || onDelete ? (
        <div className="lgs-artlib-toolsrow">
          {onRename ? (
            <input
              type="text"
              defaultValue={renameValue ?? name}
              aria-label="Rename upload"
              onBlur={(e) => onRename(e.target.value.trim() || name)}
            />
          ) : null}
          {onRemoveBackground ? (
            <button type="button" aria-label="Remove background" title="Remove background" onClick={onRemoveBackground}>
              Cut
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" className="danger" aria-label="Delete upload" onClick={onDelete}>
              Del
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
