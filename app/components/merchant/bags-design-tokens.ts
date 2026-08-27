/** Legends BAGS design tokens — aligned to Build a Gang Sheet layout density. */

export const BAGS_TOKENS = {
  color: {
    shellBg: "#f4f6f9",
    sidebarBg: "#111827",
    sidebarBgEnd: "#1a2332",
    sidebarBorder: "#243044",
    sidebarText: "#e5e7eb",
    sidebarMuted: "#9ca3af",
    sidebarActive: "#f97316",
    surface: "#ffffff",
    surfaceMuted: "#f9fafb",
    border: "#e5e7eb",
    borderStrong: "#d0d5dd",
    text: "#111827",
    textSecondary: "#475467",
    textMuted: "#667085",
    accent: "#f97316",
    accentDark: "#ea580c",
    accentSoft: "#fff7ed",
    success: "#027a48",
    successSoft: "#ecfdf3",
    danger: "#b42318",
    dangerSoft: "#fef3f2",
    info: "#1d4ed8",
    infoSoft: "#eff6ff",
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
    pageTitle: "20px",
    sectionTitle: "15px",
    body: "13px",
    label: "11px",
    stat: "28px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    pill: "999px",
  },
  shadow: {
    card: "0 1px 2px rgba(16,24,40,.04)",
    panel: "0 4px 16px rgba(16,24,40,.08)",
    sidebar: "2px 0 12px rgba(13,17,23,.08)",
  },
  layout: {
    sidebarWidth: "240px",
    sidebarCollapsedWidth: "64px",
    headerHeight: "56px",
    contentMaxWidth: "1280px",
    controlHeight: "36px",
    tableRowHeight: "52px",
  },
  breakpoint: {
    tablet: "960px",
    mobile: "640px",
  },
  zIndex: {
    sidebar: "40",
    header: "30",
    dropdown: "50",
    modal: "60",
    toast: "70",
  },
} as const;

export const bagsTokenCss = `
:root{
  --bags-shell-bg:${BAGS_TOKENS.color.shellBg};
  --bags-sidebar-bg:${BAGS_TOKENS.color.sidebarBg};
  --bags-sidebar-bg-end:${BAGS_TOKENS.color.sidebarBgEnd};
  --bags-sidebar-border:${BAGS_TOKENS.color.sidebarBorder};
  --bags-sidebar-text:${BAGS_TOKENS.color.sidebarText};
  --bags-sidebar-muted:${BAGS_TOKENS.color.sidebarMuted};
  --bags-sidebar-active:${BAGS_TOKENS.color.sidebarActive};
  --bags-surface:${BAGS_TOKENS.color.surface};
  --bags-surface-muted:${BAGS_TOKENS.color.surfaceMuted};
  --bags-border:${BAGS_TOKENS.color.border};
  --bags-border-strong:${BAGS_TOKENS.color.borderStrong};
  --bags-text:${BAGS_TOKENS.color.text};
  --bags-text-secondary:${BAGS_TOKENS.color.textSecondary};
  --bags-text-muted:${BAGS_TOKENS.color.textMuted};
  --bags-accent:${BAGS_TOKENS.color.accent};
  --bags-accent-dark:${BAGS_TOKENS.color.accentDark};
  --bags-accent-soft:${BAGS_TOKENS.color.accentSoft};
  --bags-success:${BAGS_TOKENS.color.success};
  --bags-success-soft:${BAGS_TOKENS.color.successSoft};
  --bags-danger:${BAGS_TOKENS.color.danger};
  --bags-danger-soft:${BAGS_TOKENS.color.dangerSoft};
  --bags-info:${BAGS_TOKENS.color.info};
  --bags-info-soft:${BAGS_TOKENS.color.infoSoft};
  --bags-font:${BAGS_TOKENS.typography.fontFamily};
  --bags-sidebar-width:${BAGS_TOKENS.layout.sidebarWidth};
  --bags-header-height:${BAGS_TOKENS.layout.headerHeight};
  --bags-content-max:${BAGS_TOKENS.layout.contentMaxWidth};
  --bags-control-height:${BAGS_TOKENS.layout.controlHeight};
  --bags-radius-sm:${BAGS_TOKENS.radius.sm};
  --bags-radius-md:${BAGS_TOKENS.radius.md};
  --bags-radius-lg:${BAGS_TOKENS.radius.lg};
  --bags-shadow-card:${BAGS_TOKENS.shadow.card};
  --bags-shadow-panel:${BAGS_TOKENS.shadow.panel};
}
`;
