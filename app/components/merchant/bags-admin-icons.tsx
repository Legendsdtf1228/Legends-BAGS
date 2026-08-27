import type { ReactNode } from "react";

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon(props: { children: ReactNode }) {
  return <svg {...base}>{props.children}</svg>;
}

export const BAGS_NAV_ICONS: Record<string, () => ReactNode> = {
  home: () => (
    <Icon>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </Icon>
  ),
  products: () => (
    <Icon>
      <path d="M6 7h12l-1 12H7L6 7Z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </Icon>
  ),
  designs: () => (
    <Icon>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 12h8M8 8h8M8 16h5" />
    </Icon>
  ),
  orders: () => (
    <Icon>
      <path d="M7 4h10l1 3H6l1-3Z" />
      <path d="M6 7v13h12V7" />
      <path d="M10 11h4" />
    </Icon>
  ),
  "build-assign": () => (
    <Icon>
      <rect x="3" y="5" width="8" height="8" rx="1" />
      <rect x="13" y="11" width="8" height="8" rx="1" />
      <path d="M11 9l2 2" />
    </Icon>
  ),
  "shop-builder": () => (
    <Icon>
      <path d="M4 20h16" />
      <path d="M7 20V9l5-4 5 4v11" />
      <path d="M10 13h4" />
    </Icon>
  ),
  general: () => (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Icon>
  ),
  "gangsheet-builder": () => (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h4v4H7zM13 9h4v4h-4z" />
    </Icon>
  ),
  "image-to-sheet": () => (
    <Icon>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 15l3-3 2 2 3-4 2 5" />
    </Icon>
  ),
  appearance: () => (
    <Icon>
      <path d="M12 3a9 9 0 1 0 0 18" />
      <path d="M12 3v9l6 3" />
    </Icon>
  ),
  gallery: () => (
    <Icon>
      <rect x="3" y="5" width="8" height="8" rx="1" />
      <rect x="13" y="5" width="8" height="8" rx="1" />
      <rect x="3" y="15" width="8" height="4" rx="1" />
      <rect x="13" y="15" width="8" height="4" rx="1" />
    </Icon>
  ),
  pod: () => (
    <Icon>
      <path d="M7 4h10v16H7z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </Icon>
  ),
  setup: () => (
    <Icon>
      <path d="M12 3 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  ),
};
