/** BAGS storefront editor design tokens — match live Build a Gang Sheet chrome. */
export const BAGS_STOREFRONT_TOKENS = {
  headerHeight: "52px",
  toolbarHeight: "44px",
  bottomNavHeight: "56px",
  selectionBarHeight: "40px",
  primaryBlue: "#1a73e8",
  nestOrange: "#f97316",
  destructiveRed: "#d93025",
  surface: "#ffffff",
  workspace: "#e8eaed",
  border: "#dadce0",
  text: "#202124",
  textMuted: "#5f6368",
  controlSize: "32px",
  drawerWidth: "320px",
  leftRailWidth: "64px",
  sidePanelWidth: "280px",
} as const;

export const BAGS_STOREFRONT_TOKEN_CSS = `
.lgs-editor.bags-parity-editor{
  --bags-header-h:${BAGS_STOREFRONT_TOKENS.headerHeight};
  --bags-toolbar-h:${BAGS_STOREFRONT_TOKENS.toolbarHeight};
  --bags-bottom-h:${BAGS_STOREFRONT_TOKENS.bottomNavHeight};
  --bags-primary:${BAGS_STOREFRONT_TOKENS.primaryBlue};
  --bags-nest:${BAGS_STOREFRONT_TOKENS.nestOrange};
  --bags-danger:${BAGS_STOREFRONT_TOKENS.destructiveRed};
  --bags-surface:${BAGS_STOREFRONT_TOKENS.surface};
  --bags-workspace:${BAGS_STOREFRONT_TOKENS.workspace};
  --bags-border:${BAGS_STOREFRONT_TOKENS.border};
  --bags-text:${BAGS_STOREFRONT_TOKENS.text};
  --bags-muted:${BAGS_STOREFRONT_TOKENS.textMuted};
  --bags-control:${BAGS_STOREFRONT_TOKENS.controlSize};
  --bags-rail-w:${BAGS_STOREFRONT_TOKENS.leftRailWidth};
  --bags-panel-w:${BAGS_STOREFRONT_TOKENS.sidePanelWidth};
}
`;
