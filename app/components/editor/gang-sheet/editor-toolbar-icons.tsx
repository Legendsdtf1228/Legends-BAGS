import type { ReactNode } from "react";

const base = {
  width: 18,
  height: 18,
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

export const TOOLBAR_ICONS = {
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
  zoomOut: () => (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="M8 11h6M21 21l-4.3-4.3" />
    </Icon>
  ),
  zoomIn: () => (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8v6M8 11h6M21 21l-4.3-4.3" />
    </Icon>
  ),
  fit: () => (
    <Icon>
      <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
    </Icon>
  ),
  preview: () => (
    <Icon>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  add: () => (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  save: () => (
    <Icon>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </Icon>
  ),
  cart: () => (
    <Icon>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2 2h2l2.4 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6" />
    </Icon>
  ),
  home: () => (
    <Icon>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </Icon>
  ),
  more: () => (
    <Icon>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </Icon>
  ),
  close: () => (
    <Icon>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  ),
  refresh: () => (
    <Icon>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 3v6h-6" />
    </Icon>
  ),
  upload: () => (
    <Icon>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </Icon>
  ),
  delete: () => (
    <Icon>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
    </Icon>
  ),
  grid: () => (
    <Icon>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
    </Icon>
  ),
  pan: () => (
    <Icon>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <path d="m8 8 8 8M16 8l-8 8" />
    </Icon>
  ),
};

export function ToolbarIcon(props: { name: keyof typeof TOOLBAR_ICONS; label?: string }) {
  const IconFn = TOOLBAR_ICONS[props.name];
  return (
    <span className="gs-icon" aria-hidden>
      {IconFn ? IconFn() : null}
    </span>
  );
}
