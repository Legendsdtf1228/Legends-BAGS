import type { ReactNode } from "react";

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon(props: { children: ReactNode }) {
  return <svg {...base}>{props.children}</svg>;
}

export const SELECTION_TOOLBAR_ICONS = {
  alignLeft: () => (
    <Icon>
      <path d="M4 4v16" />
      <rect x="8" y="6" width="10" height="5" rx="1" />
      <rect x="8" y="13" width="6" height="5" rx="1" />
    </Icon>
  ),
  alignCenterH: () => (
    <Icon>
      <path d="M12 4v16" />
      <rect x="5" y="6" width="14" height="5" rx="1" />
      <rect x="7" y="13" width="10" height="5" rx="1" />
    </Icon>
  ),
  alignRight: () => (
    <Icon>
      <path d="M20 4v16" />
      <rect x="6" y="6" width="10" height="5" rx="1" />
      <rect x="10" y="13" width="6" height="5" rx="1" />
    </Icon>
  ),
  alignTop: () => (
    <Icon>
      <path d="M4 4h16" />
      <rect x="6" y="8" width="5" height="10" rx="1" />
      <rect x="13" y="8" width="5" height="6" rx="1" />
    </Icon>
  ),
  alignMiddle: () => (
    <Icon>
      <path d="M4 12h16" />
      <rect x="6" y="5" width="5" height="14" rx="1" />
      <rect x="13" y="7" width="5" height="10" rx="1" />
    </Icon>
  ),
  alignBottom: () => (
    <Icon>
      <path d="M4 20h16" />
      <rect x="6" y="6" width="5" height="10" rx="1" />
      <rect x="13" y="10" width="5" height="6" rx="1" />
    </Icon>
  ),
  distributeH: () => (
    <Icon>
      <path d="M4 12h16" />
      <rect x="6" y="8" width="3" height="8" rx="1" />
      <rect x="10.5" y="8" width="3" height="8" rx="1" />
      <rect x="15" y="8" width="3" height="8" rx="1" />
    </Icon>
  ),
  distributeV: () => (
    <Icon>
      <path d="M12 4v16" />
      <rect x="8" y="6" width="8" height="3" rx="1" />
      <rect x="8" y="10.5" width="8" height="3" rx="1" />
      <rect x="8" y="15" width="8" height="3" rx="1" />
    </Icon>
  ),
  layerForward: () => (
    <Icon>
      <rect x="4" y="8" width="12" height="10" rx="1" />
      <path d="M8 6h10v10" />
    </Icon>
  ),
  layerBackward: () => (
    <Icon>
      <rect x="8" y="6" width="12" height="10" rx="1" />
      <path d="M4 8h10v10" />
    </Icon>
  ),
  rotateCcw: () => (
    <Icon>
      <path d="M9 7H4v5" />
      <path d="M4 12a8 8 0 1 0 2.5-5.8L4 7" />
    </Icon>
  ),
  rotateCw: () => (
    <Icon>
      <path d="M15 7h5v5" />
      <path d="M20 12a8 8 0 1 1-2.5-5.8L20 7" />
    </Icon>
  ),
  flipH: () => (
    <Icon>
      <path d="M12 4v16" />
      <path d="M8 8h8M8 16h8" />
    </Icon>
  ),
  flipV: () => (
    <Icon>
      <path d="M4 12h16" />
      <path d="M8 8v8M16 8v8" />
    </Icon>
  ),
  stretchW: () => (
    <Icon>
      <path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </Icon>
  ),
  stretchH: () => (
    <Icon>
      <path d="M12 4v16M12 4l-3 3M12 4l3 3M12 20l-3-3M12 20l3-3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </Icon>
  ),
  centerH: () => (
    <Icon>
      <path d="M12 4v16" />
      <rect x="7" y="8" width="10" height="8" rx="1" />
    </Icon>
  ),
  centerV: () => (
    <Icon>
      <path d="M4 12h16" />
      <rect x="8" y="7" width="8" height="10" rx="1" />
    </Icon>
  ),
  centerBoth: () => (
    <Icon>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
    </Icon>
  ),
  snapLeft: () => (
    <Icon>
      <path d="M4 4v16" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </Icon>
  ),
  snapRight: () => (
    <Icon>
      <path d="M20 4v16" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </Icon>
  ),
  duplicate: () => (
    <Icon>
      <rect x="8" y="8" width="10" height="10" rx="1" />
      <path d="M6 6h10v10" />
    </Icon>
  ),
  undo: () => (
    <Icon>
      <path d="M9 7H4v5" />
      <path d="M4 12a8 8 0 1 0 2.5-5.8L4 7" />
    </Icon>
  ),
  redo: () => (
    <Icon>
      <path d="M15 7h5v5" />
      <path d="M20 12a8 8 0 1 1-2.5-5.8L20 7" />
    </Icon>
  ),
  delete: () => (
    <Icon>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
    </Icon>
  ),
} as const;

export function SelectionToolbarIcon(props: { name: keyof typeof SELECTION_TOOLBAR_ICONS }) {
  const IconFn = SELECTION_TOOLBAR_ICONS[props.name];
  return (
    <span className="bags-sel-icon" aria-hidden>
      {IconFn()}
    </span>
  );
}
