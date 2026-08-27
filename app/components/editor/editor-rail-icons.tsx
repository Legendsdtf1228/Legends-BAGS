import type { ReactNode } from "react";

const railBase = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function RailIcon(props: { children: ReactNode }) {
  return <svg {...railBase}>{props.children}</svg>;
}

export const EDITOR_RAIL_ICONS: Record<string, () => ReactNode> = {
  home: () => (
    <RailIcon>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </RailIcon>
  ),
  uploads: () => (
    <RailIcon>
      <path d="M4 20h16" />
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
    </RailIcon>
  ),
  gallery: () => (
    <RailIcon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m3 16 5-5 4 4 3-3 6 6" />
    </RailIcon>
  ),
  text: () => (
    <RailIcon>
      <path d="M6 4h12" />
      <path d="M12 4v16" />
    </RailIcon>
  ),
  names: () => (
    <RailIcon>
      <path d="M4 7h16M4 12h10M4 17h14" />
    </RailIcon>
  ),
  auto: () => (
    <RailIcon>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </RailIcon>
  ),
  layers: () => (
    <RailIcon>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </RailIcon>
  ),
  help: () => (
    <RailIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.8.7-1.7 1.2-1.7 2.7" />
      <path d="M12 17h.01" />
    </RailIcon>
  ),
  upload: () => (
    <RailIcon>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </RailIcon>
  ),
  sheet: () => (
    <RailIcon>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </RailIcon>
  ),
  saved: () => (
    <RailIcon>
      <path d="M6 4h12v16l-6-3-6 3V4Z" />
    </RailIcon>
  ),
  template: () => (
    <RailIcon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h4v4H7zM13 9h4v4h-4z" />
    </RailIcon>
  ),
};

export function EditorRailIcon(props: { name: string; label: string }) {
  const Icon = EDITOR_RAIL_ICONS[props.name];
  return (
    <span className="rail-icon" aria-hidden>
      {Icon ? Icon() : null}
    </span>
  );
}
