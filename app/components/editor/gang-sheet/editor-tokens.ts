/** Gang Sheet Studio design tokens — print-production workspace, not a Shopify theme.
 *
 * Brand gold/black come from the existing Legends "L" mark
 * (`#ffd45e` → `#e89119` on `#0d1117`), not a new palette.
 */

export const GS_EDITOR_TOKENS = {
  commandBarHeight: "56px",
  railWidth: "68px",
  panelWidth: "300px",
  propertiesWidth: "288px",
  statusBarHeight: "28px",

  canvasBg: "#1a1d22",
  sheetShadow: "0 10px 32px rgba(0,0,0,.45)",
  panelBg: "#f4f4f2",
  railBg: "#0e1013",
  barBg: "#16181c",
  accent: "var(--gs-accent)",
  radiusMd: "6px",
  radiusLg: "8px",

  color: {
    workspace: "#121417",
    workspaceElevated: "#1a1d22",
    rail: "#0e1013",
    bar: "#16181c",
    panel: "#f4f4f2",
    panelMuted: "#ecece8",
    surface: "#ffffff",
    text: "#111318",
    textOnDark: "#f3f4f6",
    textMuted: "#6b7280",
    textMutedOnDark: "#9aa3ad",
    border: "rgba(255,255,255,.08)",
    borderStrong: "rgba(255,255,255,.14)",
    borderOnLight: "#e2e4e8",
    /** Logo gold highlight */
    accent: "#e4b84a",
    /** Logo gold deep (`#e89119`) */
    accentDeep: "#e89119",
    accentInk: "#16130b",
    accentSoft: "rgba(228,184,74,.18)",
    warning: "#d97706",
    warningSoft: "#fff7ed",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    success: "#15803d",
    successSoft: "#ecfdf3",
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
    label: "11px",
    control: "12px",
    body: "13px",
    title: "16px",
    display: "18px",
  },
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
  },
  radius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
  },
  shadow: {
    sheet: "0 10px 32px rgba(0,0,0,.45)",
    dialog: "0 18px 44px rgba(0,0,0,.4)",
    panel: "0 1px 0 rgba(255,255,255,.04)",
  },
  control: {
    height: "32px",
    heightLg: "36px",
  },
  breakpoint: {
    compact: "1100px",
    mobile: "900px",
  },
} as const;

const C = GS_EDITOR_TOKENS.color;
const T = GS_EDITOR_TOKENS.typography;
const S = GS_EDITOR_TOKENS.space;
const R = GS_EDITOR_TOKENS.radius;

/** CSS custom properties for the Studio shell. Later surfaces can adopt `--gs-*`. */
export const GS_EDITOR_TOKEN_CSS = `
.lgs-editor.gs-editor-v2{
  --gs-bar-h:${GS_EDITOR_TOKENS.commandBarHeight};
  --gs-rail-w:${GS_EDITOR_TOKENS.railWidth};
  --gs-panel-w:${GS_EDITOR_TOKENS.panelWidth};
  --gs-props-w:${GS_EDITOR_TOKENS.propertiesWidth};
  --gs-status-h:${GS_EDITOR_TOKENS.statusBarHeight};
  --gs-workspace:${C.workspace};
  --gs-workspace-elevated:${C.workspaceElevated};
  --gs-canvas-bg:${GS_EDITOR_TOKENS.canvasBg};
  --gs-rail:${C.rail};
  --gs-bar:${C.bar};
  --gs-panel:${C.panel};
  --gs-panel-muted:${C.panelMuted};
  --gs-surface:${C.surface};
  --gs-text:${C.text};
  --gs-text-on-dark:${C.textOnDark};
  --gs-text-muted:${C.textMuted};
  --gs-text-muted-on-dark:${C.textMutedOnDark};
  --gs-border:${C.border};
  --gs-border-strong:${C.borderStrong};
  --gs-border-on-light:${C.borderOnLight};
  --gs-accent:${C.accent};
  --gs-accent-deep:${C.accentDeep};
  --gs-accent-ink:${C.accentInk};
  --gs-accent-soft:${C.accentSoft};
  --gs-warning:${C.warning};
  --gs-warning-soft:${C.warningSoft};
  --gs-danger:${C.danger};
  --gs-danger-soft:${C.dangerSoft};
  --gs-success:${C.success};
  --gs-success-soft:${C.successSoft};
  --gs-font:${T.fontFamily};
  --gs-label:${T.label};
  --gs-control:${T.control};
  --gs-body:${T.body};
  --gs-title:${T.title};
  --gs-display:${T.display};
  --gs-space-1:${S[1]};
  --gs-space-2:${S[2]};
  --gs-space-3:${S[3]};
  --gs-space-4:${S[4]};
  --gs-space-5:${S[5]};
  --gs-radius-sm:${R.sm};
  --gs-radius-md:${R.md};
  --gs-radius-lg:${R.lg};
  --gs-control-h:${GS_EDITOR_TOKENS.control.height};
  --gs-control-h-lg:${GS_EDITOR_TOKENS.control.heightLg};
  --gs-sheet-shadow:${GS_EDITOR_TOKENS.shadow.sheet};
  --gs-dialog-shadow:${GS_EDITOR_TOKENS.shadow.dialog};
  --gs-panel-bg:${GS_EDITOR_TOKENS.panelBg};
  --gs-rail-bg:${GS_EDITOR_TOKENS.railBg};
  --gs-bar-bg:${GS_EDITOR_TOKENS.barBg};
  --gs-canvas-surround:${C.workspaceElevated};
}
`;
