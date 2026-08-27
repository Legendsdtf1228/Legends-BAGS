/** Viewport minimap for tall gang sheets. */

export type CanvasMinimapProps = {
  sheetWidth: number;
  sheetHeight: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  onNavigate: (ratio: number) => void;
  visible: boolean;
};

export function CanvasMinimap(props: CanvasMinimapProps) {
  const { sheetWidth, sheetHeight, scrollTop, scrollHeight, clientHeight, onNavigate, visible } = props;
  if (!visible || sheetHeight <= sheetWidth * 1.5) return null;

  const viewRatio = clientHeight / Math.max(1, scrollHeight);
  const topRatio = scrollTop / Math.max(1, scrollHeight - clientHeight);

  return (
    <div className="gs-minimap" aria-label="Sheet minimap">
      <div className="gs-minimap-sheet">
        <div
          className="gs-minimap-viewport"
          style={{
            height: `${Math.max(8, viewRatio * 100)}%`,
            top: `${topRatio * (100 - Math.max(8, viewRatio * 100))}%`,
          }}
        />
      </div>
      <button
        type="button"
        className="gs-minimap-reset"
        onClick={() => onNavigate(0)}
        title="Scroll to top of sheet"
      >
        Top
      </button>
    </div>
  );
}
