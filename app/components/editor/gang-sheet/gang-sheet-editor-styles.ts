/** Gang Sheet Studio shell + chrome styles. Feature panel markup is owned by other agents;
 * this file only applies the shared visual system to existing class names. */
import { CANVAS_WORKSPACE_CSS } from "./canvas-workspace-css";
import { GS_EDITOR_TOKEN_CSS, GS_EDITOR_TOKENS } from "./editor-tokens";
import { PRODUCTION_REVIEW_CSS } from "./production-review-styles";

export const GANG_SHEET_EDITOR_CSS = `
${GS_EDITOR_TOKEN_CSS}

*{box-sizing:border-box}
.lgs-editor.gs-editor-v2,.lgs-editor.gs-editor-v2 .bags{font-family:var(--gs-font);font-size:var(--gs-body);line-height:1.35;color:var(--gs-text-on-dark)}
.bags{--blue:var(--gs-accent);--line:var(--gs-border-on-light);min-height:100vh;background:var(--gs-workspace);color:var(--gs-text-on-dark);font:var(--gs-body)/1.35 var(--gs-font)}
.bags>header{height:var(--gs-bar-h);background:var(--gs-bar);color:var(--gs-text-on-dark);display:flex;align-items:center;justify-content:space-between;padding:0 var(--gs-space-4);position:sticky;top:0;z-index:5;border-bottom:1px solid var(--gs-border)}
.brand{display:flex;align-items:center;gap:10px}
.brand.center{justify-content:center;margin-bottom:var(--gs-space-3)}
.brand>b,.gs-command-logo{display:grid;place-items:center;width:32px;height:32px;border-radius:var(--gs-radius-md);background:var(--gs-accent);color:var(--gs-accent-ink);font:800 17px Georgia,serif}
.brand strong,.brand small{display:block}
.brand strong{letter-spacing:.14em;font-size:11px;font-weight:800;color:var(--gs-text-on-dark)}
.brand small{font-size:var(--gs-label);color:var(--gs-text-muted-on-dark)}
.bags nav{display:flex;gap:var(--gs-space-2);flex-wrap:wrap;justify-content:flex-end}
.bags nav button,.bags nav label{border:0;border-radius:var(--gs-radius-md);padding:0 12px;min-height:var(--gs-control-h);background:#242830;color:var(--gs-text-on-dark);font-weight:650;font-size:var(--gs-control);cursor:pointer}
.bags nav label.btn-upload,.bags nav .btn-upload{background:var(--gs-accent);color:var(--gs-accent-ink)}
.bags nav .save{background:var(--gs-accent);color:var(--gs-accent-ink);font-weight:800}
.bags nav button:disabled{opacity:.45;cursor:not-allowed}
.bags input[type=file]{display:none}

/* Welcome Center — compact production start, not a marketing page */
.welcome{min-height:100vh;background:var(--gs-workspace)}
.home-shell{display:grid;grid-template-columns:var(--gs-rail-w) 1fr;min-height:100vh}
.home-main{display:grid;place-items:center;padding:var(--gs-space-5) var(--gs-space-4)}
.welcome-card{max-width:780px;width:100%;background:var(--gs-panel);color:var(--gs-text);border-radius:var(--gs-radius-lg);padding:var(--gs-space-5) var(--gs-space-5);border:1px solid var(--gs-border-on-light)}
.welcome-card .brand strong{color:var(--gs-text)}
.welcome-card .brand small{color:var(--gs-text-muted)}
.welcome-card h1{margin:4px 0 8px;font-size:var(--gs-display);font-weight:750;text-align:center;letter-spacing:-.01em;color:var(--gs-text)}
.welcome-lead{margin:0 0 var(--gs-space-4);text-align:center;color:var(--gs-text-muted);font-size:var(--gs-control);line-height:1.45;max-width:520px;margin-inline:auto}
.welcome-grid{display:grid;gap:var(--gs-space-2)}
.welcome-grid.two-col{grid-template-columns:repeat(2,minmax(0,1fr))}
.welcome-opt{display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:start;text-align:left;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);padding:var(--gs-space-3);background:var(--gs-surface);cursor:pointer;transition:border-color .12s,background .12s;color:inherit}
.welcome-opt:hover:not(.disabled){border-color:var(--gs-accent);background:var(--gs-panel-muted)}
.welcome-opt strong{font-size:13px;grid-column:2;font-weight:700}
.welcome-opt span{font-size:var(--gs-label);color:var(--gs-text-muted);grid-column:2;line-height:1.4}
.welcome-opt.featured,.welcome-opt.primary{border-color:var(--gs-accent);background:var(--gs-accent-soft)}
.welcome-opt.disabled{opacity:.5;cursor:not-allowed}
.bags nav button:focus-visible,.bags nav label:focus-visible,.welcome-opt:focus-visible,.rail-btn:focus-visible,.actions button:focus-visible,.layer-actions button:focus-visible,.zoom button:focus-visible,.resize-handle:focus-visible,.gs-icon-btn:focus-visible,.gs-primary-btn:focus-visible,.gs-secondary-btn:focus-visible,.gs-ghost-btn:focus-visible{outline:2px solid var(--gs-accent);outline-offset:2px}
.welcome-sheet-pick{display:grid;grid-template-columns:1fr 1fr;gap:var(--gs-space-3);max-width:380px;margin:0 auto var(--gs-space-4)}
.welcome-sheet-pick label{font-size:var(--gs-label);color:var(--gs-text-muted);display:grid;gap:4px;font-weight:600}
.welcome-sheet-pick select{padding:7px 8px;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);background:var(--gs-surface);font-size:var(--gs-control);min-height:var(--gs-control-h)}
.welcome-tip{margin:0 0 var(--gs-space-4);padding:var(--gs-space-2) var(--gs-space-3);background:var(--gs-panel-muted);border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);font-size:var(--gs-label);color:#475467;line-height:1.45;text-align:center}
.welcome-opt.continue-draft{border-color:var(--gs-success);background:var(--gs-success-soft)}
a.welcome-opt{text-decoration:none;color:inherit}
.welcome-foot{display:flex;justify-content:space-between;gap:var(--gs-space-3);align-items:baseline;margin-top:var(--gs-space-4);padding-top:var(--gs-space-3);border-top:1px solid var(--gs-border-on-light);font-size:var(--gs-label);color:var(--gs-text-muted)}
.welcome-foot strong{color:var(--gs-text);font-size:var(--gs-control)}

.draft-modal{position:fixed;inset:0;background:rgba(12,14,16,.72);display:grid;place-items:center;z-index:40;padding:var(--gs-space-4)}
.draft-modal-card{background:var(--gs-surface);color:var(--gs-text);border-radius:var(--gs-radius-lg);padding:var(--gs-space-5);max-width:400px;width:100%;box-shadow:var(--gs-dialog-shadow);border:1px solid var(--gs-border-on-light)}
.draft-modal-card h2{margin:0 0 8px;font-size:var(--gs-title)}
.draft-modal-card p{margin:0 0 var(--gs-space-4);color:var(--gs-text-muted);font-size:var(--gs-control);line-height:1.45}
.draft-modal-actions{display:flex;flex-wrap:wrap;gap:var(--gs-space-2)}
.draft-modal-actions button{border:0;border-radius:var(--gs-radius-md);padding:0 14px;min-height:var(--gs-control-h-lg);background:#242830;color:#fff;font-weight:700;cursor:pointer;font-size:var(--gs-control)}
.draft-modal-actions .save{background:var(--gs-accent);color:var(--gs-accent-ink)}
.draft-modal-actions .ghost-btn{background:var(--gs-surface);color:#344054;border:1px solid var(--gs-border-on-light)}
.library-name-field{display:grid;gap:6px;margin:0 0 var(--gs-space-4);font-size:var(--gs-label);font-weight:600;color:#344054}
.library-name-field input{width:100%;padding:8px 10px;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);font:inherit;min-height:var(--gs-control-h)}
.rotate-toggle{display:flex;align-items:center;gap:var(--gs-space-2);font-size:var(--gs-label);color:#475467;margin:0 0 var(--gs-space-3)}
.toast.warn{background:var(--gs-warning-soft);color:#9a3412}
.toast.tip{background:#1f232a;color:var(--gs-text-on-dark);display:flex;align-items:center;justify-content:space-between;gap:var(--gs-space-3);border:1px solid var(--gs-border)}
.tip-dismiss{border:1px solid var(--gs-border-strong);background:transparent;color:var(--gs-text-on-dark);border-radius:var(--gs-radius-sm);padding:4px 10px;font-size:var(--gs-label);cursor:pointer;white-space:nowrap}

.layer-actions{padding:0 var(--gs-space-3) var(--gs-space-3);display:grid;grid-template-columns:1fr 1fr;gap:7px}
.layer-actions>span{grid-column:1/-1;font-size:var(--gs-label);color:var(--gs-text-muted);font-weight:600}
.layer-actions button{border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-sm);padding:7px 4px;font-size:var(--gs-label);cursor:pointer}
.nest-stats .overflow-note strong{color:var(--gs-danger);font-size:var(--gs-label);text-align:right;max-width:70%}

/* Canvas selection / handles — color only; geometry owned by canvas agent */
.piece.overlap{box-shadow:0 0 0 2px var(--gs-warning)}
.piece.oob{box-shadow:0 0 0 2px var(--gs-danger)}
.piece.overlap.oob{box-shadow:0 0 0 2px var(--gs-danger),0 0 0 4px var(--gs-warning)}
.piece.selected{outline:2px solid var(--gs-accent);outline-offset:2px}
.resize-handle{position:absolute;width:12px;height:12px;border:2px solid #fff;background:var(--gs-accent);border-radius:2px;padding:0;cursor:nwse-resize;z-index:3}
.resize-handle.se{right:-7px;bottom:-7px}
.zoom button:last-child{border-left:1px solid var(--gs-border-on-light);font-size:var(--gs-label);font-weight:700;padding:6px 10px}

/* Icon rail — must beat .bags nav (flex-end wrap) */
.icon-rail,.lgs-editor.gs-editor-v2 nav.icon-rail{background:var(--gs-rail);color:var(--gs-text-muted-on-dark);display:flex;flex-direction:column;flex-wrap:nowrap;justify-content:flex-start;align-items:stretch;padding:var(--gs-space-2) 0;gap:2px;z-index:6;border-right:1px solid var(--gs-border);width:var(--gs-rail-w);min-width:var(--gs-rail-w)}
.lgs-editor.gs-editor-v2 nav.icon-rail .rail-btn,.icon-rail .rail-btn{position:relative;border:0;background:transparent;color:inherit;padding:8px 4px;cursor:pointer;display:grid;justify-items:center;gap:3px;font-size:10px;min-height:0;font-weight:650;border-radius:0}
.icon-rail .rail-btn:hover:not(:disabled){color:var(--gs-text-on-dark);background:#1a1e24}
.icon-rail .rail-btn.active{color:var(--gs-accent);background:#1c2027;box-shadow:inset 3px 0 0 var(--gs-accent)}
.icon-rail .rail-btn.soon{opacity:.45;cursor:not-allowed}
.icon-rail .rail-icon,.welcome-icon svg{width:18px;height:18px;display:block}
.icon-rail .rail-icon{font-size:18px;line-height:1}
.welcome-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:var(--gs-radius-md);background:var(--gs-panel-muted);color:var(--gs-accent-ink)}
.welcome-opt.featured .welcome-icon,.welcome-opt.primary .welcome-icon{background:var(--gs-accent);color:var(--gs-accent-ink)}
.icon-rail .rail-label{font-size:9px;font-weight:650;letter-spacing:.02em}
.icon-rail .rail-badge{position:absolute;top:4px;right:6px;min-width:15px;height:15px;padding:0 4px;border-radius:8px;background:var(--gs-accent);color:var(--gs-accent-ink);font-size:9px;font-weight:800;display:grid;place-items:center}

/* Light functional panels */
.sidebar-panel{background:var(--gs-panel);color:var(--gs-text);border-right:1px solid var(--gs-border-on-light);width:var(--gs-panel-w);display:flex;flex-direction:column;overflow:auto}
.sidebar-hint{margin:0 var(--gs-space-3) 10px;font-size:var(--gs-label);color:var(--gs-text-muted);line-height:1.45}
.sidebar-upload-btn{margin:0 var(--gs-space-3) var(--gs-space-3);display:block;text-align:center;background:var(--gs-accent);color:var(--gs-accent-ink);border-radius:var(--gs-radius-md);padding:9px 12px;font-weight:800;font-size:var(--gs-control);cursor:pointer;border:0}
.refresh-btn{border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-sm);width:32px;height:32px;cursor:pointer;font-size:14px;color:var(--gs-text)}
.pool-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--gs-space-2);padding:0 var(--gs-space-3) var(--gs-space-3)}
.pool-item{border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);padding:var(--gs-space-2);background:var(--gs-surface);cursor:pointer;text-align:left;display:grid;gap:6px}
.pool-item:hover{border-color:var(--gs-accent);background:var(--gs-panel-muted)}
.pool-item img{width:100%;aspect-ratio:1;object-fit:contain;background:#f3f4f6;border-radius:var(--gs-radius-sm)}
.pool-item span{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#344054}
.pool-item .on-sheet{font-size:9px;font-style:normal;color:var(--gs-accent-deep);font-weight:700}
.on-sheet-list{border-top:1px solid var(--gs-border-on-light);padding:var(--gs-space-3);margin-top:auto}
.on-sheet-list h3{margin:0 0 8px;font-size:var(--gs-control);color:#475467}
.sidebar-empty{margin:0;font-size:var(--gs-label);color:var(--gs-text-muted);padding:0 var(--gs-space-3)}
.sidebar-soon{padding:var(--gs-space-5) var(--gs-space-4);color:var(--gs-text-muted);font-size:var(--gs-control)}
.sidebar-soon strong{display:block;color:#344054;margin-bottom:6px}
.drop.compact{margin:0 var(--gs-space-3) var(--gs-space-3);min-height:120px}
.toast{margin:0;padding:8px 16px;font-size:var(--gs-control);position:relative;z-index:9}
.toast.message{background:var(--gs-success-soft);color:#17683e}
.toast.error{background:var(--gs-danger-soft);color:#b42318}
.assets.compact{padding:0}
.assets.compact>button{margin-bottom:4px}
@media(max-width:${GS_EDITOR_TOKENS.breakpoint.tabletMax}){.welcome-grid.two-col{grid-template-columns:1fr}}

.upload-tabs{display:flex;gap:6px;margin-bottom:var(--gs-space-3);flex-wrap:wrap}
.upload-tabs .tab{border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-sm);padding:5px 10px;font-size:var(--gs-label);font-weight:600;cursor:pointer}
.upload-tabs .tab.active{background:var(--gs-accent-soft);border-color:var(--gs-accent);color:var(--gs-accent-ink)}
.upload-tabs .tab.disabled{opacity:.5;cursor:not-allowed}

.auto-split{display:grid;grid-template-columns:minmax(340px,1fr) minmax(420px,1.2fr);gap:0;min-height:calc(100vh - var(--gs-bar-h))}
.auto-upload-panel{background:var(--gs-panel);color:var(--gs-text);border-right:1px solid var(--gs-border-on-light);padding:var(--gs-space-4);overflow:auto;max-height:calc(100vh - var(--gs-bar-h))}
.auto-preview-panel{background:var(--gs-workspace-elevated);padding:var(--gs-space-4);display:grid;grid-template-rows:auto 1fr auto;gap:var(--gs-space-3);max-height:calc(100vh - var(--gs-bar-h));overflow:auto;color:var(--gs-text-on-dark)}
.auto-panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:var(--gs-space-3)}
.auto-panel-head h2{margin:0;font-size:var(--gs-title)}
.auto-panel-head p{margin:0;font-size:var(--gs-label);color:var(--gs-text-muted)}
.auto-preview-panel .auto-panel-head p,.auto-preview-panel .preview-status{color:var(--gs-text-muted-on-dark)}
.preview-status{font-size:var(--gs-label);color:var(--gs-text-muted)}.preview-status.ok{color:#86efac;font-weight:600}
.auto-sheet-settings{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--gs-space-2);margin-bottom:var(--gs-space-3)}
.auto-sheet-settings label{font-size:var(--gs-label);color:var(--gs-text-muted);display:grid;gap:4px}
.auto-sheet-settings select,.auto-sheet-settings input{padding:7px;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);font-size:var(--gs-control);min-height:var(--gs-control-h)}
.auto-list.compact{display:grid;gap:var(--gs-space-2)}
.auto-row{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:start;background:var(--gs-surface);color:var(--gs-text);border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);padding:10px;cursor:pointer}
.auto-row.active{border-color:var(--gs-accent);background:var(--gs-accent-soft);box-shadow:0 0 0 1px var(--gs-accent)}
.auto-row img{width:64px;height:64px;object-fit:contain;background:#eee;border-radius:var(--gs-radius-sm)}
.auto-fields strong{display:block;font-size:var(--gs-control);margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.preset-row{margin-bottom:8px}
.auto-dims{display:grid;grid-template-columns:1fr;gap:6px}
.lock-aspect{display:flex;align-items:center;gap:8px;font-size:var(--gs-label);color:var(--gs-text-muted);margin:6px 0}
.auto-actions{display:grid;gap:6px;align-content:start}
.auto-actions .dup{border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-sm);padding:6px 8px;font-size:10px;cursor:pointer}
.auto-actions .remove{border:0;background:var(--gs-danger-soft);color:#991b1b;width:32px;height:32px;border-radius:var(--gs-radius-sm);cursor:pointer}
.auto-fields small{font-size:10px;color:var(--gs-text-muted)}
.nest-preview-wrap{min-height:280px;display:grid;place-items:center;background:#0f1114;border-radius:var(--gs-radius-md);padding:var(--gs-space-5);border:1px solid var(--gs-border)}
.nest-preview-sheet{position:relative;width:100%;max-width:520px;background:#fff;background-image:linear-gradient(#f0f2f4 1px,transparent 1px),linear-gradient(90deg,#f0f2f4 1px,transparent 1px);background-size:16px 16px;box-shadow:var(--gs-sheet-shadow)}
.nest-preview-sheet>i{position:absolute;inset:4px;border:1px dashed #e54d4d;pointer-events:none}
.nest-piece{position:absolute;overflow:hidden;border:1px solid #94a3b8;background:#fff}
.nest-piece.highlight{outline:2px solid var(--gs-accent);z-index:2}
.nest-piece img{width:100%;height:100%;object-fit:fill;display:block;pointer-events:none}
.nest-preview-empty{text-align:center;color:var(--gs-text-muted-on-dark);padding:var(--gs-space-5);max-width:280px}
.nest-preview-empty strong{display:block;color:var(--gs-text-on-dark);margin-bottom:6px}
.nest-stats{background:var(--gs-panel);color:var(--gs-text);border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);padding:var(--gs-space-3);display:grid;gap:4px}
.nest-stats p{display:flex;justify-content:space-between;margin:0;font-size:var(--gs-control);color:var(--gs-text-muted)}
.nest-stats strong{color:var(--gs-text)}
.nest-stats .total{border-top:1px solid var(--gs-border-on-light);padding-top:8px;margin-top:4px;font-size:14px}
.nest-stats .total strong{font-size:var(--gs-display);color:var(--gs-success)}
.error.block,.message.block{margin:0;padding:10px;border-radius:var(--gs-radius-sm);font-size:var(--gs-control)}
.fine{font-size:var(--gs-label);color:var(--gs-text-muted-on-dark);margin:0;line-height:1.45}
@media(max-width:960px){.auto-split{grid-template-columns:1fr}.auto-upload-panel{max-height:none;border-right:0;border-bottom:1px solid var(--gs-border-on-light)}}
.auto-row{display:grid;grid-template-columns:80px 1fr auto;gap:12px;align-items:start;background:var(--gs-surface);border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);padding:12px}
.auto-row img{width:80px;height:80px;object-fit:contain;background:#eee;border-radius:var(--gs-radius-sm)}
.auto-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.auto-fields label{font-size:var(--gs-label);color:var(--gs-text-muted);display:grid;gap:4px}
.auto-fields input{padding:8px;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm)}
.auto-row .remove{border:0;background:var(--gs-danger-soft);color:#991b1b;padding:8px 10px;border-radius:var(--gs-radius-sm);cursor:pointer}
.drop.large{min-height:240px}

.workspace{display:grid;grid-template-columns:var(--gs-rail-w) var(--gs-panel-w) minmax(0,1fr) var(--gs-props-w);height:calc(100vh - var(--gs-bar-h))}
.workspace.tools-collapsed{grid-template-columns:var(--gs-rail-w) 0 minmax(0,1fr) var(--gs-props-w)}
.workspace.props-collapsed{grid-template-columns:var(--gs-rail-w) var(--gs-panel-w) minmax(0,1fr) 0}
.workspace.tools-collapsed.props-collapsed{grid-template-columns:var(--gs-rail-w) 0 minmax(0,1fr) 0}
.workspace.tools-collapsed .sidebar-panel:not(.mobile-open){display:none}
.workspace.props-collapsed .properties:not(.mobile-open){display:none}
aside{background:var(--gs-panel);color:var(--gs-text);overflow:auto}
.properties{border-left:1px solid var(--gs-border-on-light);width:var(--gs-props-w);background:var(--gs-panel);color:var(--gs-text)}
.heading{min-height:44px;padding:8px var(--gs-space-3);border-bottom:1px solid var(--gs-border-on-light);display:flex;align-items:center;justify-content:space-between;gap:8px}
.heading strong,.heading small{display:block}
.heading strong{font-size:var(--gs-control);font-weight:750}
.heading small{font-size:10px;color:var(--gs-text-muted);margin-top:2px}
.heading .mini-upload{width:32px;height:32px;display:grid;place-items:center;background:var(--gs-accent-soft);color:var(--gs-accent-ink);border-radius:var(--gs-radius-sm);font-size:20px;cursor:pointer}
.drop{margin:var(--gs-space-4);min-height:170px;border:1px dashed #b5bfcc;border-radius:var(--gs-radius-md);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;text-align:center;color:var(--gs-text-muted);cursor:pointer}
.drop>b{font-size:30px;color:var(--gs-accent-deep)}.drop small{font-size:var(--gs-label)}
.assets{padding:10px}
.assets>button{width:100%;border:1px solid transparent;background:var(--gs-surface);border-radius:var(--gs-radius-sm);padding:8px;display:grid;grid-template-columns:48px 1fr 22px;gap:9px;align-items:center;text-align:left;margin-bottom:5px;cursor:pointer}
.assets>button.active{border-color:var(--gs-accent);background:var(--gs-accent-soft)}
.assets img{width:48px;height:48px;object-fit:contain;background:#eee}
.assets span{min-width:0}.assets strong,.assets small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--gs-label)}
.assets small{color:var(--gs-text-muted);margin-top:4px}
.assets>button>b{width:20px;height:20px;border-radius:50%;background:#e8ebef;display:grid;place-items:center;font-size:10px}

.bags main,.canvas-main{min-width:0;overflow:hidden;background:var(--gs-canvas-surround);color:var(--gs-text-on-dark)}
.toolbar{height:44px;background:var(--gs-bar);border-bottom:1px solid var(--gs-border);display:flex;align-items:center;gap:12px;padding:0 var(--gs-space-3);flex-wrap:wrap}
.toolbar label{font-size:var(--gs-label);color:var(--gs-text-muted-on-dark);display:flex;gap:6px;align-items:center}
.toolbar select{padding:5px;border:1px solid var(--gs-border-strong);border-radius:var(--gs-radius-sm);background:#1f232a;color:var(--gs-text-on-dark)}
.toolbar>strong{margin-left:auto}
.zoom{display:flex;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);background:var(--gs-surface);overflow:hidden}
.zoom button{border:0;background:var(--gs-surface);padding:6px 9px;cursor:pointer}
.zoom span{min-width:43px;text-align:center;font-size:var(--gs-label);padding:7px 0}

.scroll{height:calc(100% - var(--gs-status-h));overflow:auto;padding:28px 28px 80px 36px;position:relative}
.sheet{position:relative;margin:auto;background-color:#fff;background-image:linear-gradient(#f0f2f4 1px,transparent 1px),linear-gradient(90deg,#f0f2f4 1px,transparent 1px);background-size:20px 20px;box-shadow:var(--gs-sheet-shadow);min-height:300px;touch-action:none}
.sheet>i{position:absolute;inset:5px;border:1px dashed #e54d4d;pointer-events:none}
.piece{position:absolute;cursor:move;touch-action:none;user-select:none}
.piece img{width:100%;height:100%;object-fit:fill;display:block;pointer-events:none}
.piece em{display:none;position:absolute;left:50%;bottom:-23px;transform:translateX(-50%);background:#111827;color:#fff;padding:3px 6px;border-radius:4px;font-size:9px;white-space:nowrap;font-style:normal}
.piece.selected em{display:block}
.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#98a2b3;gap:7px;text-align:center}
.empty b{font-size:38px}.empty strong{color:#475467}

.preview{padding:var(--gs-space-3);border-bottom:1px solid var(--gs-border-on-light)}
.preview img{width:100%;height:120px;object-fit:contain;background:#eee;border-radius:var(--gs-radius-sm)}
.preview strong,.preview small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.preview strong{margin-top:8px;font-size:var(--gs-control)}.preview small{color:var(--gs-text-muted);font-size:10px}
.fields{padding:var(--gs-space-3);display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fields label{font-size:var(--gs-label);color:var(--gs-text-muted)}
.fields input,.fields select{width:100%;padding:7px 8px;margin-top:4px;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);font-size:var(--gs-control);min-height:var(--gs-control-h);background:var(--gs-surface)}
.actions{padding:0 var(--gs-space-3) var(--gs-space-3);display:grid;grid-template-columns:1fr 1fr;gap:7px}
.actions button{border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-sm);padding:8px 4px;font-size:var(--gs-label);cursor:pointer}
.spacing{margin:0 var(--gs-space-3) var(--gs-space-4);display:grid;grid-template-columns:1fr auto;gap:6px;color:var(--gs-text-muted);font-size:var(--gs-label)}
.spacing input{display:block!important;grid-column:1/-1;width:100%}
.none{padding:40px var(--gs-space-5);text-align:center;color:var(--gs-text-muted)}
.none b{font-size:28px}
.summary{margin:var(--gs-space-3);border-top:1px solid var(--gs-border-on-light);padding-top:10px}
.summary p{display:flex;justify-content:space-between;margin:0;padding:5px 0;color:var(--gs-text-muted);font-size:var(--gs-control)}
.summary strong{color:var(--gs-text)}
.summary .total{border-top:1px solid var(--gs-border-on-light);margin-top:7px;padding-top:12px;font-size:14px}
.summary .total strong{font-size:var(--gs-display);color:var(--gs-success)}
.message,.error{margin:12px 14px;padding:10px;border-radius:var(--gs-radius-sm);font-size:var(--gs-label)}
.message{background:var(--gs-success-soft);color:#17683e}.error{background:var(--gs-danger-soft);color:#b42318}

.bags>header.editor-header{flex-wrap:wrap;height:auto;min-height:var(--gs-bar-h);padding:10px var(--gs-space-4);gap:10px}
.top-toolbar{display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap;justify-content:center}
.top-toolbar label{font-size:var(--gs-label);color:var(--gs-text-muted-on-dark);display:flex;gap:6px;align-items:center}
.top-toolbar select{padding:6px 8px;border:1px solid var(--gs-border-strong);border-radius:var(--gs-radius-sm);background:#1a2230;color:#fff}
.top-toolbar>button{border:0;border-radius:var(--gs-radius-sm);padding:8px 10px;background:#242b36;color:#fff;font-size:var(--gs-control);font-weight:600;cursor:pointer}
.top-toolbar>button:disabled{opacity:.45;cursor:not-allowed}
.price-chip{background:var(--gs-accent-soft);color:var(--gs-accent-ink);padding:6px 12px;border-radius:var(--gs-radius-sm);font-weight:700;font-size:13px}

.template-picker,.saved-designs-list{margin:var(--gs-space-4) 0;padding:var(--gs-space-3);border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);background:var(--gs-panel-muted)}
.template-picker{display:grid;gap:8px}
.template-card{text-align:left;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);padding:var(--gs-space-3);background:var(--gs-surface);cursor:pointer}
.template-card:hover{border-color:var(--gs-accent)}
.template-card strong{display:block;font-size:13px}
.template-card span{font-size:var(--gs-label);color:var(--gs-text-muted)}
.saved-designs-list h3{margin:0 0 8px;font-size:13px}
.saved-design-row-wrap{display:grid;gap:4px;margin-bottom:8px}
.saved-design-row{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;width:100%;text-align:left;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);padding:10px;background:var(--gs-surface);cursor:pointer}
.saved-design-thumb{width:44px;height:44px;border-radius:var(--gs-radius-sm);overflow:hidden;border:1px solid var(--gs-border-on-light);display:grid;place-items:center}
.saved-design-thumb img{width:100%;height:100%;object-fit:contain}
.saved-design-copy strong{display:block;font-size:var(--gs-control)}
.saved-design-copy small{font-size:10px;color:var(--gs-text-muted)}
.saved-design-actions{display:flex;flex-wrap:wrap;gap:6px}
.saved-design-action{border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-sm);padding:4px 8px;font-size:var(--gs-label);cursor:pointer}
.saved-design-rename{display:flex;gap:6px;align-items:center}
.saved-design-rename input{flex:1;padding:6px 8px;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm)}
.library-archived-toggle{display:flex;align-items:center;gap:6px;font-size:var(--gs-label);color:var(--gs-text-muted);white-space:nowrap}
.sidebar-tools{padding:0 var(--gs-space-3) 10px;display:grid;grid-template-columns:1fr auto;gap:8px}
.sidebar-tools input,.sidebar-form input,.sidebar-form select,.sidebar-form textarea{width:100%;padding:7px 8px;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);font:inherit;font-size:var(--gs-control);min-height:var(--gs-control-h);background:var(--gs-surface)}
.sidebar-form{padding:0 var(--gs-space-3) var(--gs-space-3);display:grid;gap:10px}
.sidebar-form label{font-size:var(--gs-label);color:var(--gs-text-muted);display:grid;gap:4px}
.chip-row{display:flex;flex-wrap:wrap;gap:6px;padding:0 var(--gs-space-3) 10px}
.chip{border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-sm);padding:4px 9px;font-size:10px;cursor:pointer}
.chip.active{background:var(--gs-accent-soft);border-color:var(--gs-accent);color:var(--gs-accent-ink);font-weight:700}
.pool-item-wrap{display:grid;gap:4px}
.pool-item-actions{display:flex;gap:4px;padding:0 2px}
.pool-item-actions input{flex:1;font-size:10px;padding:4px 6px;border:1px solid var(--gs-border-on-light);border-radius:4px}
.pool-item-actions button{width:28px;border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:4px;cursor:pointer}
.checkerboard{background-color:#fff;background-image:linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%);background-size:12px 12px;background-position:0 0,0 6px,6px -6px,-6px 0}
.dpi-warn{color:#b45309;font-size:9px;font-style:normal}
.layer-list{padding:8px var(--gs-space-3);display:grid;gap:6px}
.layer-row{display:grid;grid-template-columns:36px 1fr;gap:8px;align-items:center;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);padding:8px;background:var(--gs-surface);text-align:left;cursor:pointer}
.layer-row.active{border-color:var(--gs-accent);background:var(--gs-accent-soft)}
.layer-row img,.layer-text-thumb{width:36px;height:36px;border-radius:var(--gs-radius-sm);object-fit:contain;background:#f3f4f6;display:grid;place-items:center;font-weight:800}
.layer-row strong,.layer-row small{display:block;font-size:var(--gs-label)}
.layer-row small{color:var(--gs-text-muted)}
.help-list{list-style:none;margin:0;padding:8px var(--gs-space-3);display:grid;gap:8px}
.help-list li{display:grid;grid-template-columns:110px 1fr;gap:8px;font-size:var(--gs-label);color:#475467}
.help-list kbd{background:var(--gs-panel-muted);border:1px solid var(--gs-border-on-light);border-radius:4px;padding:3px 6px;font-size:10px}
.toggle-row{display:flex;align-items:center;gap:8px;font-size:var(--gs-label);color:#475467;padding:0 var(--gs-space-3) 10px;margin:0}
.toggle-row.inline{padding:0;color:var(--gs-text-muted-on-dark)}

.canvas-meta{height:var(--gs-status-h);background:#101215;border-bottom:1px solid var(--gs-border);display:flex;align-items:center;gap:var(--gs-space-4);padding:0 var(--gs-space-3);font-size:11px;color:var(--gs-text-muted-on-dark)}
.canvas-meta strong{color:var(--gs-text-on-dark);font-weight:650}
.scroll.pan-mode{cursor:grab}
.scroll.pan-mode:active{cursor:grabbing}
.ruler-corner{position:sticky;top:0;left:0;width:24px;height:24px;background:#22262c;border-right:1px solid #2e333b;border-bottom:1px solid #2e333b;z-index:2;float:left}
.ruler-h{position:sticky;top:0;height:24px;margin-left:24px;background:#22262c;border-bottom:1px solid #2e333b;z-index:2}
.ruler-v{position:absolute;left:0;top:24px;width:24px;bottom:0;background:#22262c;border-right:1px solid #2e333b;z-index:2}
.ruler-h span,.ruler-v span{position:absolute;font-size:9px;color:#8b939e;transform:translate(-50%,-50%)}
.ruler-v span{left:50%}
.canvas-stage{margin-left:24px;padding-top:4px}
.snap-guide{position:absolute;background:#38bdf8;pointer-events:none;z-index:4}
.snap-guide.x{width:1px;top:0;bottom:0}
.snap-guide.y{height:1px;left:0;right:0}
.text-piece{display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-align:center;line-height:1.1;pointer-events:none;word-break:break-word;padding:4px}
.text-preview{display:grid;place-items:center;min-height:80px;font-size:24px;font-weight:700;background:#f3f4f6;border-radius:var(--gs-radius-sm);padding:12px}
.fields.grid-2{grid-template-columns:1fr 1fr}
.align-row{padding:0 var(--gs-space-3) 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.align-row>span{width:100%;font-size:var(--gs-label);color:var(--gs-text-muted);font-weight:600}
.align-row button{border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-sm);padding:6px 8px;font-size:var(--gs-label);cursor:pointer}
.ghost-save-btn{margin:0 var(--gs-space-3) var(--gs-space-3);width:calc(100% - 24px);border:1px solid var(--gs-border-on-light);background:var(--gs-surface);border-radius:var(--gs-radius-md);padding:9px;font-weight:650;cursor:pointer;font-size:var(--gs-control)}
.mobile-bar{display:none;position:fixed;left:0;right:0;bottom:0;height:56px;background:var(--gs-rail);border-top:1px solid var(--gs-border);padding:6px 8px;gap:6px;z-index:8;justify-content:space-around}
.mobile-bar button{flex:1;border:0;border-radius:var(--gs-radius-md);background:#242830;color:#fff;font-size:var(--gs-label);font-weight:700;padding:8px 4px;cursor:pointer}
.mobile-bar button.save{background:var(--gs-accent);color:var(--gs-accent-ink)}
.mobile-bar button:disabled{opacity:.45}
.mobile-drawer-close{display:none}

/* Overlay drawers for phone + tablet so the artboard stays the dominant column. */
@media(max-width:${GS_EDITOR_TOKENS.breakpoint.tabletMax}){
  .workspace{grid-template-columns:56px minmax(0,1fr);height:calc(100vh - var(--gs-bar-h))}
  .workspace.tools-collapsed,.workspace.props-collapsed,.workspace.tools-collapsed.props-collapsed{grid-template-columns:56px minmax(0,1fr)}
  .sidebar-panel,.properties{display:none;position:fixed;top:var(--gs-bar-h);bottom:0;width:min(320px,42vw);z-index:7;box-shadow:8px 0 24px rgba(0,0,0,.35);flex-direction:column;overflow:auto}
  .workspace.tools-collapsed .sidebar-panel:not(.mobile-open),.workspace.props-collapsed .properties:not(.mobile-open){display:none}
  .sidebar-panel{left:56px}
  .properties{right:0;box-shadow:-8px 0 24px rgba(0,0,0,.35)}
  .sidebar-panel.mobile-open,.properties.mobile-open{display:flex}
  .mobile-drawer-close{display:grid;position:absolute;right:8px;top:8px;z-index:3;width:40px;height:40px;place-items:center;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);background:var(--gs-surface);color:#344054;font-size:20px;cursor:pointer}
  .top-toolbar{display:none}
  .canvas-meta{font-size:11px;flex-wrap:wrap;height:auto;min-height:var(--gs-status-h);padding:6px 10px}
}

/* Tablet 768–900: canvas stays full-width; tools/inspector overlay. No phone dock. */
@media(min-width:${GS_EDITOR_TOKENS.breakpoint.tabletMin}) and (max-width:${GS_EDITOR_TOKENS.breakpoint.tabletMax}){
  .lgs-editor.gs-editor-v2 nav.mobile-bar,.mobile-bar{display:none}
  .lgs-editor.gs-editor-v2 .lgs-artlib-add{min-height:40px;height:40px}
  .sidebar-panel,.properties{width:min(280px,36vw);bottom:0}
}

@media(max-width:${GS_EDITOR_TOKENS.breakpoint.phone}){
  .workspace{height:calc(100vh - var(--gs-bar-h) - 56px)}
  .sidebar-panel,.properties{top:56px;bottom:56px;width:min(320px,84vw)}
  .mobile-bar{display:flex}
}

/* Command bar primitives */
.lgs-editor.gs-editor-v2 .gs-command-bar{height:var(--gs-bar-h);min-height:var(--gs-bar-h);background:var(--gs-bar);color:var(--gs-text-on-dark);border-bottom:1px solid var(--gs-border);display:grid;grid-template-columns:minmax(220px,1fr) minmax(280px,2fr) minmax(260px,1fr);gap:var(--gs-space-3);align-items:center;padding:0 var(--gs-space-3);position:sticky;top:0;z-index:8;overflow:hidden}
.lgs-editor.gs-editor-v2 .gs-command-left,.lgs-editor.gs-editor-v2 .gs-command-center,.lgs-editor.gs-editor-v2 .gs-command-right{display:flex;align-items:center;gap:var(--gs-space-2);min-width:0}
.lgs-editor.gs-editor-v2 .gs-command-center{justify-content:center;flex-wrap:nowrap;overflow:hidden}
.lgs-editor.gs-editor-v2 .gs-command-right{justify-content:flex-end}
.lgs-editor.gs-editor-v2 .gs-command-brand{display:flex;align-items:center;gap:8px;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-command-brand-text strong{display:block;font-size:10px;letter-spacing:.14em;font-weight:800}
.lgs-editor.gs-editor-v2 .gs-command-brand-text small{display:block;font-size:10px;color:var(--gs-text-muted-on-dark)}
.lgs-editor.gs-editor-v2 .gs-design-name-field input{width:min(200px,20vw);padding:6px 10px;border:1px solid var(--gs-border-strong);border-radius:var(--gs-radius-sm);font:inherit;font-size:var(--gs-control);background:#101215;color:var(--gs-text-on-dark);min-height:var(--gs-control-h)}
.lgs-editor.gs-editor-v2 .gs-design-name-field input::placeholder{color:#6b7280}
.lgs-editor.gs-editor-v2 .gs-command-divider{width:1px;height:22px;background:var(--gs-border-strong);flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-sheet-meta{display:flex;align-items:center;gap:6px;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-sheet-select{display:grid;gap:1px;font-size:10px;color:var(--gs-text-muted-on-dark)}
.lgs-editor.gs-editor-v2 .gs-sheet-select select{padding:5px 8px;border:1px solid var(--gs-border-strong);border-radius:var(--gs-radius-sm);background:#101215;font:inherit;font-size:var(--gs-control);color:var(--gs-text-on-dark);min-height:var(--gs-control-h)}
.lgs-editor.gs-editor-v2 .gs-sheet-times{color:#98a2b3;font-size:12px;padding-top:14px}
.lgs-editor.gs-editor-v2 .gs-price-pill{display:flex;align-items:baseline;gap:4px;background:transparent;color:var(--gs-accent);padding:0 4px;border-radius:0;font-size:var(--gs-control);flex-shrink:0;border:0}
.lgs-editor.gs-editor-v2 .gs-price-pill strong{font-size:14px;font-weight:800}
.lgs-editor.gs-editor-v2 .gs-history-group,.lgs-editor.gs-editor-v2 .gs-zoom-group{display:flex;align-items:center;border:1px solid var(--gs-border-strong);border-radius:var(--gs-radius-sm);background:#101215;overflow:hidden;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-icon-btn{display:grid;place-items:center;width:var(--gs-control-h);height:var(--gs-control-h);border:0;background:transparent;color:var(--gs-text-muted-on-dark);cursor:pointer;padding:0}
.lgs-editor.gs-editor-v2 .gs-icon-btn:hover:not(:disabled){background:#232830;color:var(--gs-text-on-dark)}
.lgs-editor.gs-editor-v2 .gs-icon-btn:disabled{opacity:.4;cursor:not-allowed}
.lgs-editor.gs-editor-v2 .gs-icon-btn.active{background:var(--gs-accent-soft);color:var(--gs-accent)}
.lgs-editor.gs-editor-v2 .gs-zoom-label{min-width:44px;text-align:center;font-size:var(--gs-control);font-weight:650;color:var(--gs-text-on-dark);border-inline:1px solid var(--gs-border-strong);padding:0 4px}
.lgs-editor.gs-editor-v2 .gs-fit-btn{width:auto;padding:0 8px;border-left:1px solid var(--gs-border-strong)}
.lgs-editor.gs-editor-v2 .gs-ghost-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--gs-border-strong);background:transparent;border-radius:var(--gs-radius-md);padding:0 10px;min-height:var(--gs-control-h);font-size:var(--gs-control);font-weight:650;color:var(--gs-text-on-dark);cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-ghost-btn:hover:not(:disabled){background:#232830}
.lgs-editor.gs-editor-v2 .gs-command-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-add-btn{display:inline-flex;align-items:center;border:0;border-radius:var(--gs-radius-md);padding:0 12px;min-height:var(--gs-control-h);background:#232830;color:var(--gs-text-on-dark);font-size:var(--gs-control);font-weight:700;cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-secondary-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--gs-border-strong);background:#232830;border-radius:var(--gs-radius-md);padding:0 12px;min-height:var(--gs-control-h);font-size:var(--gs-control);font-weight:700;color:var(--gs-text-on-dark);cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-primary-btn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:var(--gs-radius-md);padding:0 16px;min-height:var(--gs-control-h-lg);background:var(--gs-accent);color:var(--gs-accent-ink);font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-primary-btn:hover:not(:disabled){background:#edc45c}
.lgs-editor.gs-editor-v2 .gs-danger-btn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:var(--gs-radius-md);padding:0 12px;min-height:var(--gs-control-h);background:var(--gs-danger);color:#fff;font-size:var(--gs-control);font-weight:700;cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-primary-btn:disabled,.lgs-editor.gs-editor-v2 .gs-secondary-btn:disabled,.lgs-editor.gs-editor-v2 .gs-add-btn:disabled,.lgs-editor.gs-editor-v2 .gs-ghost-btn:disabled{opacity:.5;cursor:not-allowed}
.lgs-editor.gs-editor-v2 .gs-overflow-menu{position:relative}
.lgs-editor.gs-editor-v2 .gs-overflow-menu summary{list-style:none}
.lgs-editor.gs-editor-v2 .gs-overflow-menu summary::-webkit-details-marker{display:none}
.lgs-editor.gs-editor-v2 .gs-overflow-panel{position:absolute;right:0;top:calc(100% + 6px);min-width:180px;background:#1c2026;border:1px solid var(--gs-border-strong);border-radius:var(--gs-radius-md);box-shadow:var(--gs-dialog-shadow);padding:6px;z-index:20;display:grid;gap:2px}
.lgs-editor.gs-editor-v2 .gs-overflow-panel button{border:0;background:transparent;text-align:left;padding:8px 10px;border-radius:var(--gs-radius-sm);font-size:var(--gs-control);cursor:pointer;color:var(--gs-text-on-dark)}
.lgs-editor.gs-editor-v2 .gs-overflow-panel button:hover:not(:disabled){background:#2a3038}
.lgs-editor.gs-editor-v2 .workspace{display:grid;grid-template-columns:var(--gs-rail-w) var(--gs-panel-w) minmax(0,1fr) var(--gs-props-w);grid-template-rows:minmax(0,1fr);height:calc(100vh - var(--gs-bar-h))}
.lgs-editor.gs-editor-v2 .sidebar-panel{width:var(--gs-panel-w)}
.lgs-editor.gs-editor-v2 nav.icon-rail,.lgs-editor.gs-editor-v2 .icon-rail{width:var(--gs-rail-w);min-width:var(--gs-rail-w)}
.lgs-editor.gs-editor-v2 .pool-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.lgs-editor.gs-editor-v2 .pool-item img{aspect-ratio:1;border-radius:var(--gs-radius-sm)}
.lgs-editor.gs-editor-v2 .panel-lead{margin:0 var(--gs-space-4) var(--gs-space-3);font-size:var(--gs-control);color:var(--gs-text-muted);line-height:1.5}
.lgs-editor.gs-editor-v2 .gs-icon svg{width:16px;height:16px;display:block}
.lgs-editor.gs-editor-v2 .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.lgs-editor.gs-editor-v2 .gs-save-state{font-size:10px;font-weight:650;padding:3px 8px;border-radius:var(--gs-radius-sm);background:#232830;color:var(--gs-text-muted-on-dark);white-space:nowrap}
.lgs-editor.gs-editor-v2 .gs-save-state.dirty{background:var(--gs-accent-soft);color:var(--gs-accent)}
.lgs-editor.gs-editor-v2 .gs-quality-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--gs-border-strong);background:transparent;border-radius:var(--gs-radius-sm);padding:5px 10px;font-size:var(--gs-label);font-weight:650;cursor:pointer;color:var(--gs-text-on-dark)}
.lgs-editor.gs-editor-v2 .gs-quality-btn.has-issues{border-color:var(--gs-warning);background:var(--gs-warning-soft);color:#9a3412}
.lgs-editor.gs-editor-v2 .gs-quality-btn.active{box-shadow:0 0 0 1px var(--gs-accent)}
.lgs-editor.gs-editor-v2 .gs-quality-backdrop{position:fixed;inset:0;background:rgba(8,10,12,.45);z-index:45;display:grid;place-items:start center;padding:72px 16px 16px}
.lgs-editor.gs-editor-v2 .gs-quality-panel{background:var(--gs-surface);color:var(--gs-text);border-radius:var(--gs-radius-lg);max-width:420px;width:100%;box-shadow:var(--gs-dialog-shadow);padding:var(--gs-space-4);max-height:min(70vh,560px);overflow:auto}
.lgs-editor.gs-editor-v2 .gs-quality-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--gs-space-3)}
.lgs-editor.gs-editor-v2 .gs-quality-head h2{margin:0;font-size:var(--gs-title)}
.lgs-editor.gs-editor-v2 .gs-quality-head .gs-icon-btn{color:#475467}
.lgs-editor.gs-editor-v2 .gs-quality-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 var(--gs-space-3)}
.lgs-editor.gs-editor-v2 .gs-quality-counts div{background:var(--gs-panel-muted);border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);padding:8px;text-align:center}
.lgs-editor.gs-editor-v2 .gs-quality-counts dt{font-size:10px;color:var(--gs-text-muted);margin:0}
.lgs-editor.gs-editor-v2 .gs-quality-counts dd{margin:4px 0 0;font-size:var(--gs-title);font-weight:700}
.lgs-editor.gs-editor-v2 .gs-quality-toggles{border:0;padding:0;margin:0 0 var(--gs-space-3);display:grid;gap:6px}
.lgs-editor.gs-editor-v2 .gs-quality-toggles legend{font-size:var(--gs-label);font-weight:700;color:#475467;margin-bottom:4px}
.lgs-editor.gs-editor-v2 .gs-quality-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.lgs-editor.gs-editor-v2 .gs-quality-list li{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-sm);padding:8px}
.lgs-editor.gs-editor-v2 .gs-quality-list small{display:block;color:var(--gs-text-muted);font-size:10px;margin-top:2px}
.lgs-editor.gs-editor-v2 .gs-quality-list p{margin:4px 0 0;font-size:var(--gs-label);color:#475467;line-height:1.4}
.lgs-editor.gs-editor-v2 .gs-quality-ok{margin:0;font-size:var(--gs-control);color:var(--gs-success)}
.lgs-editor.gs-editor-v2 .gs-minimap{position:absolute;right:12px;top:12px;width:56px;z-index:5;display:grid;gap:6px}
.lgs-editor.gs-editor-v2 .gs-minimap-sheet{position:relative;height:120px;border:1px solid var(--gs-border-strong);border-radius:var(--gs-radius-sm);background:#fff}
.lgs-editor.gs-editor-v2 .gs-minimap-viewport{position:absolute;left:2px;right:2px;border:2px solid var(--gs-accent);border-radius:3px;background:rgba(228,184,74,.2)}
.lgs-editor.gs-editor-v2 .gs-minimap-reset{border:1px solid var(--gs-border-strong);background:#1c2026;color:var(--gs-text-on-dark);border-radius:var(--gs-radius-sm);font-size:10px;padding:4px;cursor:pointer}
.lgs-editor.gs-editor-v2 .sheet.grid-off{background-image:none}
.lgs-editor.gs-editor-v2 .dpi-badge{font-size:9px;font-style:normal;font-weight:700}
.lgs-editor.gs-editor-v2 .dpi-badge.tier-excellent{color:var(--gs-success)}
.lgs-editor.gs-editor-v2 .dpi-badge.tier-good{color:#0369a1}
.lgs-editor.gs-editor-v2 .dpi-badge.tier-low{color:var(--gs-warning)}
.lgs-editor.gs-editor-v2 .dpi-badge.tier-poor,.lgs-editor.gs-editor-v2 .dpi-badge.tier-unknown{color:var(--gs-danger)}
.lgs-editor.gs-editor-v2 .gs-panel-toggle{border:1px solid var(--gs-border-strong)}
.lgs-editor.gs-editor-v2 .gs-panel-card{background:var(--gs-panel);border:1px solid var(--gs-border-on-light);border-radius:var(--gs-radius-md);color:var(--gs-text)}
.lgs-editor.gs-editor-v2 .gs-back-btn{padding:0 8px;min-width:var(--gs-control-h)}

/* Override shared BAGS orange primitives inside Studio */
.lgs-editor.gs-editor-v2{--accent:var(--gs-accent);--accent-dark:var(--gs-accent-deep)}
.lgs-editor.gs-editor-v2 .stepper{border-color:var(--gs-border-on-light);border-radius:var(--gs-radius-sm)}
.lgs-editor.gs-editor-v2 .stepper button{height:var(--gs-control-h);background:var(--gs-panel-muted);font-size:14px}
.lgs-editor.gs-editor-v2 .stepper button:hover{background:var(--gs-accent-soft)}
.lgs-editor.gs-editor-v2 .preset-chip{border-radius:var(--gs-radius-sm);font-size:var(--gs-label)}
.lgs-editor.gs-editor-v2 .preset-chip:hover,.lgs-editor.gs-editor-v2 .preset-chip.active{background:var(--gs-accent-soft);border-color:var(--gs-accent);color:var(--gs-accent-ink)}

@media(max-width:${GS_EDITOR_TOKENS.breakpoint.compact}){
  .lgs-editor.gs-editor-v2 .gs-command-brand-text{display:none}
  .lgs-editor.gs-editor-v2 .gs-hide-compact,.lgs-editor.gs-editor-v2 .gs-sheet-meta{display:none}
  .lgs-editor.gs-editor-v2 .gs-command-bar{grid-template-columns:auto minmax(0,1fr) auto;overflow:hidden}
  .lgs-editor.gs-editor-v2 .gs-primary-btn{padding:0 12px;font-size:12px}
}
@media(min-width:${GS_EDITOR_TOKENS.breakpoint.tabletMin}) and (max-width:${GS_EDITOR_TOKENS.breakpoint.tabletMax}){
  .lgs-editor.gs-editor-v2 .gs-command-bar{grid-template-columns:auto minmax(0,1fr) auto;padding:0 8px}
  .lgs-editor.gs-editor-v2 .gs-design-name-field,.lgs-editor.gs-editor-v2 .gs-save-state{display:none}
  .lgs-editor.gs-editor-v2 .gs-command-center{display:flex;gap:6px}
  .lgs-editor.gs-editor-v2 .gs-price-pill,.lgs-editor.gs-editor-v2 .gs-panel-toggle{display:flex}
  .lgs-editor.gs-editor-v2 .gs-primary-btn{padding:0 12px;font-size:12px;min-height:40px}
  .lgs-editor.gs-editor-v2 .gs-icon-btn,.lgs-editor.gs-editor-v2 .gs-ghost-btn{min-width:40px;min-height:40px;width:40px;height:40px}
  .lgs-editor.gs-editor-v2 .gs-zoom-group .gs-zoom-mode-btn{display:none}
  .lgs-editor.gs-editor-v2 nav.mobile-bar,.mobile-bar{display:none}
}
@media(max-width:${GS_EDITOR_TOKENS.breakpoint.phone}){
  .lgs-editor.gs-editor-v2 .gs-command-bar{grid-template-columns:auto 1fr auto;height:var(--gs-bar-h);min-height:var(--gs-bar-h);padding:0 8px}
  .lgs-editor.gs-editor-v2 .gs-command-center,.lgs-editor.gs-editor-v2 .gs-hide-mobile,.lgs-editor.gs-editor-v2 .gs-design-name-field,.lgs-editor.gs-editor-v2 .gs-save-state,.lgs-editor.gs-editor-v2 .gs-sheet-meta,.lgs-editor.gs-editor-v2 .gs-panel-toggle,.lgs-editor.gs-editor-v2 .gs-price-pill{display:none}
  .lgs-editor.gs-editor-v2 .workspace{height:calc(100vh - var(--gs-bar-h) - 56px)}
  .lgs-editor.gs-editor-v2 .gs-primary-btn{padding:0 10px;font-size:12px;min-height:32px}
  .lgs-editor.gs-editor-v2 .gs-command-right{gap:6px}
}

/* Integration density: one control height / radius / focus language across composed surfaces. */
.lgs-editor.gs-editor-v2 .lgs-artlib-tools input[type=search],
.lgs-editor.gs-editor-v2 .lgs-artlib-tools select{
  min-height:var(--gs-control-h);
  border-radius:var(--gs-radius-sm);
  font-size:var(--gs-control);
}
.lgs-editor.gs-editor-v2 .lgs-artlib-iconbtn{
  width:var(--gs-control-h);
  height:var(--gs-control-h);
  border-radius:var(--gs-radius-sm);
}
.lgs-editor.gs-editor-v2 .gs-art-panel input,
.lgs-editor.gs-editor-v2 .gs-art-panel select{
  min-height:var(--gs-control-h);
  border-radius:var(--gs-radius-sm);
}
.lgs-editor.gs-editor-v2 nav.mobile-bar{display:none}
.lgs-editor.gs-editor-v2 .mobile-bar button{min-height:44px}
@media(max-width:${GS_EDITOR_TOKENS.breakpoint.phone}){
  .lgs-editor.gs-editor-v2 nav.mobile-bar{display:flex}
}
` + CANVAS_WORKSPACE_CSS + PRODUCTION_REVIEW_CSS;
