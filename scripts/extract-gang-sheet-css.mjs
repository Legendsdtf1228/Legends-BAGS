import fs from "node:fs";

const routePath = "app/routes/editor.gang-sheet.tsx";
const tokensPath = "app/components/editor/gang-sheet/editor-tokens.ts";
const outPath = "app/components/editor/gang-sheet/gang-sheet-editor-styles.ts";

const source = fs.readFileSync(routePath, "utf8");
const cssMatch = source.match(/const CSS = `([\s\S]*?)`;/);
if (!cssMatch) throw new Error("Could not find const CSS block");

const tokensFile = fs.readFileSync(tokensPath, "utf8");
const tokenMatch = tokensFile.match(/export const GS_EDITOR_TOKENS = \{([\s\S]*?)\} as const;/);
if (!tokenMatch) throw new Error("Could not find GS_EDITOR_TOKENS");

// Build CSS variables from token object literals (avoid unevaluated template refs)
const tokenCss = `
.lgs-editor.gs-editor-v2{
  --gs-bar-h:56px;
  --gs-rail-w:68px;
  --gs-panel-w:300px;
  --gs-props-w:288px;
  --gs-canvas-bg:#e9edf2;
  --gs-panel-bg:#ffffff;
  --gs-rail-bg:#111827;
  --gs-bar-bg:#ffffff;
  --gs-radius-md:10px;
  --gs-radius-lg:14px;
}
`;

const v2 = `
/* v2 command bar + save dialog */
.lgs-editor.gs-editor-v2{--gs-bar-h:56px;--gs-rail-w:68px;--gs-panel-w:300px}
.lgs-editor.gs-editor-v2 .gs-command-bar{height:var(--gs-bar-h);min-height:var(--gs-bar-h);background:var(--gs-bar-bg,#fff);color:#111827;border-bottom:1px solid #e4e7ec;display:flex;align-items:center;gap:12px;padding:0 16px;position:sticky;top:0;z-index:8;flex-wrap:nowrap}
.lgs-editor.gs-editor-v2 .gs-command-brand{display:flex;align-items:center;gap:10px;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-command-logo{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:800 18px Georgia}
.lgs-editor.gs-editor-v2 .gs-command-brand-text strong{display:block;font-size:11px;letter-spacing:.1em}
.lgs-editor.gs-editor-v2 .gs-command-brand-text small{display:block;font-size:10px;color:#667085}
.lgs-editor.gs-editor-v2 .gs-command-center{display:flex;align-items:center;gap:10px;flex:1;min-width:0;justify-content:center;flex-wrap:nowrap;overflow:hidden}
.lgs-editor.gs-editor-v2 .gs-design-name-field input{width:min(220px,22vw);padding:8px 10px;border:1px solid #dfe3e8;border-radius:8px;font:inherit;background:#f8fafc}
.lgs-editor.gs-editor-v2 .gs-command-divider{width:1px;height:28px;background:#e4e7ec;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-sheet-meta{display:flex;align-items:center;gap:6px;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-sheet-select{display:grid;gap:2px;font-size:10px;color:#667085}
.lgs-editor.gs-editor-v2 .gs-sheet-select select{padding:6px 8px;border:1px solid #dfe3e8;border-radius:8px;background:#fff;font:inherit;font-size:12px;color:#111827}
.lgs-editor.gs-editor-v2 .gs-sheet-times{color:#98a2b3;font-size:12px;padding-top:14px}
.lgs-editor.gs-editor-v2 .gs-price-pill{display:flex;align-items:baseline;gap:4px;background:#fff7ed;color:#c2410c;padding:6px 12px;border-radius:999px;font-size:12px;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-price-pill strong{font-size:14px}
.lgs-editor.gs-editor-v2 .gs-history-group,.lgs-editor.gs-editor-v2 .gs-zoom-group{display:flex;align-items:center;border:1px solid #dfe3e8;border-radius:8px;background:#fff;overflow:hidden;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-icon-btn{display:grid;place-items:center;width:36px;height:36px;border:0;background:transparent;color:#475467;cursor:pointer;padding:0}
.lgs-editor.gs-editor-v2 .gs-icon-btn:hover:not(:disabled){background:#f3f4f6;color:#111827}
.lgs-editor.gs-editor-v2 .gs-icon-btn:disabled{opacity:.4;cursor:not-allowed}
.lgs-editor.gs-editor-v2 .gs-zoom-label{min-width:44px;text-align:center;font-size:12px;font-weight:600;color:#344054;border-inline:1px solid #e4e7ec;padding:0 4px}
.lgs-editor.gs-editor-v2 .gs-fit-btn{width:auto;padding:0 8px;border-left:1px solid #e4e7ec}
.lgs-editor.gs-editor-v2 .gs-ghost-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #dfe3e8;background:#fff;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600;color:#344054;cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-command-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-add-btn{display:inline-flex;align-items:center;border:0;border-radius:8px;padding:9px 14px;background:#f3f4f6;color:#111827;font-size:12px;font-weight:700;cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-secondary-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #dfe3e8;background:#fff;border-radius:8px;padding:9px 14px;font-size:12px;font-weight:700;color:#344054;cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-primary-btn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:8px;padding:9px 16px;background:#21a366;color:#fff;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px #21a36640}
.lgs-editor.gs-editor-v2 .gs-primary-btn:disabled,.lgs-editor.gs-editor-v2 .gs-secondary-btn:disabled,.lgs-editor.gs-editor-v2 .gs-add-btn:disabled{opacity:.5;cursor:not-allowed}
.lgs-editor.gs-editor-v2 .gs-overflow-menu{position:relative}
.lgs-editor.gs-editor-v2 .gs-overflow-menu summary{list-style:none}
.lgs-editor.gs-editor-v2 .gs-overflow-menu summary::-webkit-details-marker{display:none}
.lgs-editor.gs-editor-v2 .gs-overflow-panel{position:absolute;right:0;top:calc(100% + 6px);min-width:180px;background:#fff;border:1px solid #dfe3e8;border-radius:10px;box-shadow:0 8px 24px #34405420;padding:6px;z-index:20;display:grid;gap:2px}
.lgs-editor.gs-editor-v2 .gs-overflow-panel button{border:0;background:transparent;text-align:left;padding:8px 10px;border-radius:6px;font-size:12px;cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-overflow-panel button:hover:not(:disabled){background:#f3f4f6}
.lgs-editor.gs-editor-v2 .gs-save-dialog-backdrop{position:fixed;inset:0;background:#0f172a66;display:grid;place-items:center;z-index:50;padding:16px}
.lgs-editor.gs-editor-v2 .gs-save-dialog{background:#fff;border-radius:14px;max-width:640px;width:100%;box-shadow:0 20px 50px #0f172a30;overflow:hidden}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e4e7ec}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head h2{margin:0;font-size:18px}
.lgs-editor.gs-editor-v2 .gs-save-dialog-body{display:grid;grid-template-columns:180px 1fr;gap:20px;padding:20px}
.lgs-editor.gs-editor-v2 .gs-save-preview img{width:100%;aspect-ratio:3/4;object-fit:contain;border-radius:10px;border:1px solid #e4e7ec;background:#f8fafc}
.lgs-editor.gs-editor-v2 .gs-save-preview-empty{display:grid;place-items:center;aspect-ratio:3/4;border-radius:10px;border:1px dashed #cbd5e1;color:#667085;font-size:12px;background:#f8fafc}
.lgs-editor.gs-editor-v2 .gs-save-field{display:grid;gap:6px;font-size:12px;font-weight:600;color:#344054}
.lgs-editor.gs-editor-v2 .gs-save-field input{padding:10px;border:1px solid #dfe3e8;border-radius:8px;font:inherit;font-weight:400}
.lgs-editor.gs-editor-v2 .gs-save-summary{display:grid;gap:8px;margin:12px 0 0;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e4e7ec}
.lgs-editor.gs-editor-v2 .gs-save-summary div{display:flex;justify-content:space-between;gap:12px;font-size:12px}
.lgs-editor.gs-editor-v2 .gs-save-summary dt{color:#667085;margin:0}
.lgs-editor.gs-editor-v2 .gs-save-summary dd{margin:0;font-weight:700;color:#111827}
.lgs-editor.gs-editor-v2 .gs-save-warn{margin:10px 0 0;padding:10px;border-radius:8px;background:#fff7ed;color:#9a3412;font-size:12px;line-height:1.45}
.lgs-editor.gs-editor-v2 .gs-save-warn-danger{background:#fef2f2;color:#991b1b}
.lgs-editor.gs-editor-v2 .gs-save-error{margin:10px 0 0;padding:10px;border-radius:8px;background:#fef2f2;color:#991b1b;font-size:12px}
.lgs-editor.gs-editor-v2 .gs-save-dialog-foot{display:flex;justify-content:flex-end;gap:8px;padding:16px 20px;border-top:1px solid #e4e7ec;background:#fafbfc}
.lgs-editor.gs-editor-v2 .workspace{height:calc(100vh - var(--gs-bar-h))}
.lgs-editor.gs-editor-v2 .sidebar-panel{width:var(--gs-panel-w)}
.lgs-editor.gs-editor-v2 .icon-rail{width:var(--gs-rail-w)}
.lgs-editor.gs-editor-v2 .pool-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.lgs-editor.gs-editor-v2 .pool-item img{aspect-ratio:1;border-radius:8px}
.lgs-editor.gs-editor-v2 .panel-lead{margin:0 16px 12px;font-size:12px;color:#667085;line-height:1.5}
.lgs-editor.gs-editor-v2 .gs-icon svg{width:18px;height:18px;display:block}
.lgs-editor.gs-editor-v2 .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:900px){.lgs-editor.gs-editor-v2 .gs-command-center{display:none}.lgs-editor.gs-editor-v2 .gs-hide-mobile{display:none}.lgs-editor.gs-editor-v2 .gs-save-dialog-body{grid-template-columns:1fr}.lgs-editor.gs-editor-v2 .workspace{height:calc(100vh - var(--gs-bar-h) - 56px)}}
`;

const css = tokenCss + cssMatch[1] + v2;
fs.writeFileSync(
  outPath,
  `/** Gang Sheet Editor styles (extracted from route). */\nexport const GANG_SHEET_EDITOR_CSS = \`${css}\`;\n`,
);
console.log("Wrote", outPath, css.length, "chars");
