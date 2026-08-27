/** Gang Sheet Editor design tokens */
export const GS_EDITOR_TOKENS = {
  commandBarHeight: "56px",
  railWidth: "68px",
  panelWidth: "300px",
  propertiesWidth: "288px",
  canvasBg: "#e9edf2",
  sheetShadow: "0 12px 40px rgba(15,23,42,.12), 0 2px 8px rgba(15,23,42,.06)",
  panelBg: "#ffffff",
  railBg: "#111827",
  barBg: "#ffffff",
  accent: "var(--accent)",
  radiusMd: "10px",
  radiusLg: "14px",
} as const;

export const GS_EDITOR_TOKEN_CSS = `
.lgs-editor.gs-editor-v2{
  --gs-bar-h:${GS_EDITOR_TOKENS.commandBarHeight};
  --gs-rail-w:${GS_EDITOR_TOKENS.railWidth};
  --gs-panel-w:${GS_EDITOR_TOKENS.panelWidth};
  --gs-props-w:${GS_EDITOR_TOKENS.propertiesWidth};
  --gs-canvas-bg:${GS_EDITOR_TOKENS.canvasBg};
  --gs-panel-bg:${GS_EDITOR_TOKENS.panelBg};
  --gs-rail-bg:${GS_EDITOR_TOKENS.railBg};
  --gs-bar-bg:${GS_EDITOR_TOKENS.barBg};
  --gs-radius-md:${GS_EDITOR_TOKENS.radiusMd};
  --gs-radius-lg:${GS_EDITOR_TOKENS.radiusLg};
}
`;
