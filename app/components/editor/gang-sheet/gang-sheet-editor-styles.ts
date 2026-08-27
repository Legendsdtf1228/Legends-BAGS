/** Gang Sheet Editor styles (extracted from route). */
import { GS_EDITOR_TOKENS } from "./editor-tokens";

export const GANG_SHEET_EDITOR_CSS = `
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

*{box-sizing:border-box}
.bags{--blue:var(--accent);--line:#dfe3e8;min-height:100vh;background:#eef1f5;color:#111827;font:14px/1.35 Inter,system-ui,sans-serif}
.bags>header{height:68px;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:0;z-index:5}
.brand{display:flex;align-items:center;gap:10px}
.brand.center{justify-content:center;margin-bottom:12px}
.brand>b{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:900 20px Georgia}
.brand strong,.brand small{display:block}.brand strong{letter-spacing:.12em}.brand small{font-size:11px;color:#98a2b3}
.bags nav{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.bags nav button,.bags nav label{border:0;border-radius:7px;padding:10px 14px;background:#242b36;color:#fff;font-weight:700;cursor:pointer}
.bags nav label.btn-upload,.bags nav .btn-upload{background:var(--accent)}
.bags nav .save{background:#21a366}
.bags nav button:disabled{opacity:.45;cursor:not-allowed}
.bags input[type=file]{display:none}
.welcome{min-height:100vh;background:#eef1f5}
.home-shell{display:grid;grid-template-columns:72px 1fr;min-height:100vh}
.home-main{display:grid;place-items:center;padding:24px 16px}
.welcome-card{max-width:860px;width:100%;background:#fff;border-radius:12px;padding:28px 32px;box-shadow:0 8px 30px #34405420}
.welcome-card h1{margin:8px 0 10px;font-size:24px;text-align:center}
.welcome-lead{margin:0 0 20px;text-align:center;color:#667085;font-size:13px;line-height:1.5;max-width:560px;margin-inline:auto}
.welcome-grid{display:grid;gap:12px}
.welcome-grid.two-col{grid-template-columns:repeat(2,minmax(0,1fr))}
.welcome-opt{display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:start;text-align:left;border:1px solid #dfe3e8;border-radius:10px;padding:16px;background:#fff;cursor:pointer;transition:border-color .15s,background .15s}
.welcome-opt:hover:not(.disabled){border-color:var(--accent);background:#fffaf5}
.welcome-opt strong{font-size:15px;grid-column:2}.welcome-opt span{font-size:12px;color:#667085;grid-column:2;line-height:1.45}
.welcome-opt.featured{border-color:var(--accent);background:#fff7ed}
.welcome-opt.primary{border-color:var(--accent);background:#fff7ed}
.welcome-opt.disabled{opacity:.55;cursor:not-allowed}
.bags nav button:focus-visible,.bags nav label:focus-visible,.welcome-opt:focus-visible,.rail-btn:focus-visible,.actions button:focus-visible,.layer-actions button:focus-visible,.zoom button:focus-visible,.resize-handle:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.welcome-sheet-pick{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:420px;margin:0 auto 18px}
.welcome-sheet-pick label{font-size:11px;color:#667085;display:grid;gap:4px}
.welcome-sheet-pick select{padding:8px;border:1px solid #ccd2da;border-radius:6px;background:#fff}
.welcome-tip{margin:16px 0 0;padding:10px 12px;background:#f8fafc;border:1px solid #e4e7ec;border-radius:8px;font-size:12px;color:#475467;line-height:1.45;text-align:center}
.welcome-opt.continue-draft{border-color:#21a366;background:#eef7f2}
a.welcome-opt{text-decoration:none;color:inherit}
.draft-modal{position:fixed;inset:0;background:#0d111780;display:grid;place-items:center;z-index:40;padding:16px}
.draft-modal-card{background:#fff;border-radius:12px;padding:24px;max-width:400px;width:100%;box-shadow:0 16px 40px #0004}
.draft-modal-card h2{margin:0 0 8px;font-size:18px}
.draft-modal-card p{margin:0 0 16px;color:#667085;font-size:13px;line-height:1.45}
.draft-modal-actions{display:flex;flex-wrap:wrap;gap:8px}
.draft-modal-actions button{border:0;border-radius:7px;padding:10px 14px;background:#242b36;color:#fff;font-weight:700;cursor:pointer}
.draft-modal-actions .save{background:#21a366}
.draft-modal-actions .ghost-btn{background:#fff;color:#344054;border:1px solid #ccd2da}
.library-name-field{display:grid;gap:6px;margin:0 0 16px;font-size:12px;font-weight:600;color:#344054}
.library-name-field input{width:100%;padding:10px;border:1px solid #ccd2da;border-radius:7px;font:inherit}
.rotate-toggle{display:flex;align-items:center;gap:8px;font-size:12px;color:#475467;margin:0 0 12px}
.toast.warn{background:#fff7ed;color:#9a3412}
.toast.tip{background:#f8fafc;color:#475467;display:flex;align-items:center;justify-content:space-between;gap:12px}
.tip-dismiss{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;white-space:nowrap}
.layer-actions{padding:0 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:7px}
.layer-actions>span{grid-column:1/-1;font-size:11px;color:#667085;font-weight:600}
.layer-actions button{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:8px 4px;font-size:11px;cursor:pointer}
.nest-stats .overflow-note strong{color:#9a3412;font-size:11px;text-align:right;max-width:70%}
.piece.overlap{box-shadow:0 0 0 2px #f59e0b}
.piece.oob{box-shadow:0 0 0 2px #ef4444}
.piece.overlap.oob{box-shadow:0 0 0 2px #ef4444,0 0 0 4px #f59e0b}
.piece.selected{outline:2px solid var(--accent);outline-offset:2px}
.resize-handle{position:absolute;width:12px;height:12px;border:2px solid #fff;background:var(--accent);border-radius:2px;padding:0;cursor:nwse-resize;z-index:3}
.resize-handle.se{right:-7px;bottom:-7px}
.zoom button:last-child{border-left:1px solid #d4d9df;font-size:11px;font-weight:700;padding:6px 10px}
.icon-rail{background:#0d1117;color:#98a2b3;display:flex;flex-direction:column;align-items:stretch;padding:8px 0;gap:4px;z-index:6}
.icon-rail .rail-btn{position:relative;border:0;background:transparent;color:inherit;padding:10px 6px;cursor:pointer;display:grid;justify-items:center;gap:4px;font-size:10px}
.icon-rail .rail-btn:hover:not(:disabled){color:#fff;background:#1a2230}
.icon-rail .rail-btn.active{color:#fff;background:#243044;box-shadow:inset 3px 0 0 var(--accent)}
.icon-rail .rail-btn.soon{opacity:.45;cursor:not-allowed}
.icon-rail .rail-icon,.welcome-icon svg{width:20px;height:20px;display:block}
.icon-rail .rail-icon{font-size:18px;line-height:1}
.welcome-icon{display:grid;place-items:center}
.icon-rail .rail-label{font-size:9px;font-weight:600;letter-spacing:.02em}
.icon-rail .rail-badge{position:absolute;top:6px;right:8px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:var(--accent);color:#fff;font-size:9px;font-weight:700;display:grid;place-items:center}
.sidebar-panel{background:#fff;border-right:1px solid var(--line);width:260px;display:flex;flex-direction:column;overflow:auto}
.sidebar-hint{margin:0 14px 10px;font-size:11px;color:#667085;line-height:1.45}
.sidebar-upload-btn{margin:0 14px 12px;display:block;text-align:center;background:var(--accent);color:#fff;border-radius:8px;padding:10px 12px;font-weight:700;font-size:12px;cursor:pointer}
.refresh-btn{border:1px solid #ccd2da;background:#fff;border-radius:6px;width:32px;height:32px;cursor:pointer;font-size:14px}
.pool-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:0 14px 14px}
.pool-item{border:1px solid #dfe3e8;border-radius:8px;padding:8px;background:#fff;cursor:pointer;text-align:left;display:grid;gap:6px}
.pool-item:hover{border-color:var(--accent);background:#fff7ed}
.pool-item img{width:100%;aspect-ratio:1;object-fit:contain;background:#f3f4f6;border-radius:6px}
.pool-item span{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#344054}
.pool-item .on-sheet{font-size:9px;font-style:normal;color:var(--accent-dark);font-weight:600}
.on-sheet-list{border-top:1px solid var(--line);padding:12px 14px;margin-top:auto}
.on-sheet-list h3{margin:0 0 8px;font-size:12px;color:#475467}
.sidebar-empty{margin:0;font-size:11px;color:#667085}
.sidebar-soon{padding:24px 16px;color:#667085;font-size:13px}
.sidebar-soon strong{display:block;color:#344054;margin-bottom:6px}
.drop.compact{margin:0 14px 12px;min-height:120px}
.toast{margin:0;padding:8px 16px;font-size:12px}
.toast.message{background:#eef7f2;color:#17683e}
.toast.error{background:#fff0ee;color:#b42318}
.assets.compact{padding:0}
.assets.compact>button{margin-bottom:4px}
@media(max-width:900px){.welcome-grid.two-col{grid-template-columns:1fr}.sidebar-panel{width:220px}}
.upload-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.upload-tabs .tab{border:1px solid #ccd2da;background:#fff;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer}
.upload-tabs .tab.active{background:#fff7ed;border-color:var(--accent);color:var(--accent-dark)}
.upload-tabs .tab.disabled{opacity:.5;cursor:not-allowed}
.auto-upload-panel.readonly{opacity:.92}
.auto-upload-panel.readonly .auto-row{cursor:default}
.auto-split{display:grid;grid-template-columns:minmax(340px,1fr) minmax(420px,1.2fr);gap:0;min-height:calc(100vh - 68px)}
.auto-upload-panel{background:#fff;border-right:1px solid #dfe3e8;padding:16px;overflow:auto;max-height:calc(100vh - 68px)}
.auto-preview-panel{background:#eef1f5;padding:16px;display:grid;grid-template-rows:auto 1fr auto;gap:12px;max-height:calc(100vh - 68px);overflow:auto}
.auto-panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:12px}
.auto-panel-head h2{margin:0;font-size:16px}
.auto-panel-head p{margin:0;font-size:12px;color:#667085}
.preview-status{font-size:11px;color:#667085}.preview-status.ok{color:#127a4b;font-weight:600}
.auto-sheet-settings{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.auto-sheet-settings label{font-size:11px;color:#667085;display:grid;gap:4px}
.auto-sheet-settings select,.auto-sheet-settings input{padding:7px;border:1px solid #ccd2da;border-radius:6px}
.auto-list.compact{display:grid;gap:8px}
.auto-row{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:start;background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:10px;cursor:pointer}
.auto-row.active{border-color:var(--accent);background:#fff7ed;box-shadow:0 0 0 1px var(--accent)}
.auto-row img{width:64px;height:64px;object-fit:contain;background:#eee;border-radius:6px}
.auto-fields strong{display:block;font-size:12px;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.preset-row{margin-bottom:8px}
.auto-dims{display:grid;grid-template-columns:1fr;gap:6px}
.lock-aspect{display:flex;align-items:center;gap:8px;font-size:11px;color:#667085;margin:6px 0}
.auto-actions{display:grid;gap:6px;align-content:start}
.auto-actions .dup{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:6px 8px;font-size:10px;cursor:pointer}
.auto-actions .remove{border:0;background:#fee2e2;color:#991b1b;width:32px;height:32px;border-radius:6px;cursor:pointer}
.auto-fields small{font-size:10px;color:#667085}
.nest-preview-wrap{min-height:280px;display:grid;place-items:center;background:#d8dde4;border-radius:10px;padding:20px;border:1px solid #cfd5dc}
.nest-preview-sheet{position:relative;width:100%;max-width:520px;background:#fff;background-image:linear-gradient(#f0f2f4 1px,transparent 1px),linear-gradient(90deg,#f0f2f4 1px,transparent 1px);background-size:16px 16px;box-shadow:0 6px 20px #34405430}
.nest-preview-sheet>i{position:absolute;inset:4px;border:1px dashed #e54d4d;pointer-events:none}
.nest-piece{position:absolute;overflow:hidden;border:1px solid #94a3b8;background:#fff}
.nest-piece.highlight{outline:2px solid var(--accent);z-index:2}
.nest-piece img{width:100%;height:100%;object-fit:fill;display:block;pointer-events:none}
.nest-preview-empty{text-align:center;color:#667085;padding:24px;max-width:280px}
.nest-preview-empty strong{display:block;color:#475467;margin-bottom:6px}
.nest-stats{background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:12px;display:grid;gap:4px}
.nest-stats p{display:flex;justify-content:space-between;margin:0;font-size:12px;color:#667085}
.nest-stats strong{color:#111827}
.nest-stats .total{border-top:1px solid #dfe3e8;padding-top:8px;margin-top:4px;font-size:14px}
.nest-stats .total strong{font-size:18px;color:#127a4b}
.error.block,.message.block{margin:0;padding:10px;border-radius:6px;font-size:12px}
.fine{font-size:11px;color:#667085;margin:0;line-height:1.45}
@media(max-width:960px){.auto-split{grid-template-columns:1fr}.auto-upload-panel{max-height:none;border-right:0;border-bottom:1px solid #dfe3e8}}
.auto-row{display:grid;grid-template-columns:80px 1fr auto;gap:12px;align-items:start;background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:12px}
.auto-row img{width:80px;height:80px;object-fit:contain;background:#eee;border-radius:6px}
.auto-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.auto-fields label{font-size:11px;color:#667085;display:grid;gap:4px}
.auto-fields input{padding:8px;border:1px solid #ccd2da;border-radius:6px}
.auto-row .remove{border:0;background:#fee2e2;color:#991b1b;padding:8px 10px;border-radius:6px;cursor:pointer}
.drop.large{min-height:240px}
.workspace{display:grid;grid-template-columns:72px 260px minmax(420px,1fr) 280px;height:calc(100vh - 68px)}
aside{background:#fff;overflow:auto}
.properties{border-left:1px solid var(--line)}
.heading{height:68px;padding:14px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}
.heading strong,.heading small{display:block}.heading small{font-size:11px;color:#667085;margin-top:3px}
.heading .mini-upload{width:32px;height:32px;display:grid;place-items:center;background:#fff7ed;color:var(--accent);border-radius:6px;font-size:20px;cursor:pointer}
.drop{margin:16px;min-height:170px;border:1.5px dashed #b5bfcc;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;text-align:center;color:#667085;cursor:pointer}
.drop>b{font-size:30px;color:var(--accent)}.drop small{font-size:11px}
.assets{padding:10px}
.assets>button{width:100%;border:1px solid transparent;background:#fff;border-radius:8px;padding:8px;display:grid;grid-template-columns:48px 1fr 22px;gap:9px;align-items:center;text-align:left;margin-bottom:5px;cursor:pointer}
.assets>button.active{border-color:var(--accent);background:#fff7ed}
.assets img{width:48px;height:48px;object-fit:contain;background:#eee}
.assets span{min-width:0}.assets strong,.assets small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}
.assets small{color:#667085;margin-top:4px}
.assets>button>b{width:20px;height:20px;border-radius:50%;background:#e8ebef;display:grid;place-items:center;font-size:10px}
.bags main{min-width:0;overflow:hidden;background:#d8dde4}
.toolbar{height:54px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:15px;padding:0 14px;flex-wrap:wrap}
.toolbar label{font-size:11px;color:#667085;display:flex;gap:6px;align-items:center}
.toolbar select{padding:6px;border:1px solid #cfd5dc;border-radius:5px;background:white}
.toolbar>strong{margin-left:auto}
.zoom{display:flex;border:1px solid #d4d9df;border-radius:6px;background:#fff;overflow:hidden}
.zoom button{border:0;background:#fff;padding:6px 9px;cursor:pointer}
.zoom span{min-width:43px;text-align:center;font-size:11px;padding:7px 0}
.scroll{height:calc(100% - 54px);overflow:auto;padding:46px 55px 80px}
.sheet{position:relative;margin:auto;background-color:#fff;background-image:linear-gradient(#f0f2f4 1px,transparent 1px),linear-gradient(90deg,#f0f2f4 1px,transparent 1px);background-size:20px 20px;box-shadow:0 8px 26px #34405438;min-height:300px;touch-action:none}
.sheet>i{position:absolute;inset:5px;border:1px dashed #e54d4d;pointer-events:none}
.piece{position:absolute;cursor:move;touch-action:none;user-select:none}
.piece img{width:100%;height:100%;object-fit:fill;display:block;pointer-events:none}
.piece em{display:none;position:absolute;left:50%;bottom:-23px;transform:translateX(-50%);background:#111827;color:#fff;padding:3px 6px;border-radius:4px;font-size:9px;white-space:nowrap;font-style:normal}
.piece.selected em{display:block}
.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#98a2b3;gap:7px;text-align:center}
.empty b{font-size:38px}.empty strong{color:#475467}
.preview{padding:16px;border-bottom:1px solid var(--line)}
.preview img{width:100%;height:120px;object-fit:contain;background:#eee;border-radius:7px}
.preview strong,.preview small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.preview strong{margin-top:8px}.preview small{color:#667085;font-size:10px}
.fields{padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fields label{font-size:11px;color:#667085}
.fields input{width:100%;padding:8px;margin-top:5px;border:1px solid #ccd2da;border-radius:6px}
.actions{padding:0 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:7px}
.actions button{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:9px 4px;font-size:11px;cursor:pointer}
.spacing{margin:0 14px 16px;display:grid;grid-template-columns:1fr auto;gap:6px;color:#667085;font-size:11px}
.spacing input{display:block!important;grid-column:1/-1;width:100%}
.none{padding:50px 24px;text-align:center;color:#667085}
.none b{font-size:32px}
.summary{margin:14px;border-top:1px solid var(--line);padding-top:10px}
.summary p{display:flex;justify-content:space-between;margin:0;padding:5px 0;color:#667085;font-size:12px}
.summary strong{color:#111827}
.summary .total{border-top:1px solid var(--line);margin-top:7px;padding-top:12px;font-size:14px}
.summary .total strong{font-size:18px;color:#127a4b}
.message,.error{margin:12px 14px;padding:10px;border-radius:6px;font-size:11px}
.message{background:#eef7f2;color:#17683e}.error{background:#fff0ee;color:#b42318}
.bags>header.editor-header{flex-wrap:wrap;height:auto;min-height:68px;padding:10px 16px;gap:10px}
.top-toolbar{display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap;justify-content:center}
.top-toolbar label{font-size:11px;color:#98a2b3;display:flex;gap:6px;align-items:center}
.top-toolbar select{padding:6px 8px;border:1px solid #3a4556;border-radius:6px;background:#1a2230;color:#fff}
.top-toolbar>button{border:0;border-radius:6px;padding:8px 10px;background:#242b36;color:#fff;font-size:12px;font-weight:600;cursor:pointer}
.top-toolbar>button:disabled{opacity:.45;cursor:not-allowed}
.price-chip{background:#fff7ed;color:#c2410c;padding:6px 12px;border-radius:999px;font-weight:700;font-size:13px}
.template-picker,.saved-designs-list{margin:16px 0;padding:12px;border:1px solid #e4e7ec;border-radius:8px;background:#f8fafc}
.template-picker{display:grid;gap:8px}
.template-card{text-align:left;border:1px solid #dfe3e8;border-radius:8px;padding:12px;background:#fff;cursor:pointer}
.template-card:hover{border-color:var(--accent)}
.template-card strong{display:block;font-size:13px}
.template-card span{font-size:11px;color:#667085}
.saved-designs-list h3{margin:0 0 8px;font-size:13px}
.saved-design-row-wrap{display:grid;gap:4px;margin-bottom:8px}
.saved-design-row{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;width:100%;text-align:left;border:1px solid #dfe3e8;border-radius:8px;padding:10px;background:#fff;cursor:pointer}
.saved-design-thumb{width:44px;height:44px;border-radius:6px;overflow:hidden;border:1px solid #dfe3e8;display:grid;place-items:center}
.saved-design-thumb img{width:100%;height:100%;object-fit:contain}
.saved-design-copy strong{display:block;font-size:12px}
.saved-design-copy small{font-size:10px;color:#667085}
.saved-design-actions{display:flex;flex-wrap:wrap;gap:6px}
.saved-design-action{border:1px solid #dfe3e8;background:#fff;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer}
.saved-design-rename{display:flex;gap:6px;align-items:center}
.saved-design-rename input{flex:1;padding:6px 8px;border:1px solid #dfe3e8;border-radius:6px}
.library-archived-toggle{display:flex;align-items:center;gap:6px;font-size:11px;color:#667085;white-space:nowrap}
.sidebar-tools{padding:0 14px 10px;display:grid;grid-template-columns:1fr auto;gap:8px}
.sidebar-tools input,.sidebar-form input,.sidebar-form select,.sidebar-form textarea{width:100%;padding:8px;border:1px solid #ccd2da;border-radius:6px;font:inherit}
.sidebar-form{padding:0 14px 14px;display:grid;gap:10px}
.sidebar-form label{font-size:11px;color:#667085;display:grid;gap:4px}
.chip-row{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}
.chip{border:1px solid #ccd2da;background:#fff;border-radius:999px;padding:5px 10px;font-size:10px;cursor:pointer}
.chip.active{background:#fff7ed;border-color:var(--accent);color:#9a3412;font-weight:700}
.pool-item-wrap{display:grid;gap:4px}
.pool-item-actions{display:flex;gap:4px;padding:0 2px}
.pool-item-actions input{flex:1;font-size:10px;padding:4px 6px;border:1px solid #ccd2da;border-radius:4px}
.pool-item-actions button{width:28px;border:1px solid #ccd2da;background:#fff;border-radius:4px;cursor:pointer}
.checkerboard{background-color:#fff;background-image:linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%);background-size:12px 12px;background-position:0 0,0 6px,6px -6px,-6px 0}
.dpi-warn{color:#b45309;font-size:9px;font-style:normal}
.layer-list{padding:8px 14px;display:grid;gap:6px}
.layer-row{display:grid;grid-template-columns:36px 1fr;gap:8px;align-items:center;border:1px solid #dfe3e8;border-radius:8px;padding:8px;background:#fff;text-align:left;cursor:pointer}
.layer-row.active{border-color:var(--accent);background:#fff7ed}
.layer-row img,.layer-text-thumb{width:36px;height:36px;border-radius:6px;object-fit:contain;background:#f3f4f6;display:grid;place-items:center;font-weight:800}
.layer-row strong,.layer-row small{display:block;font-size:11px}
.layer-row small{color:#667085}
.help-list{list-style:none;margin:0;padding:8px 14px;display:grid;gap:8px}
.help-list li{display:grid;grid-template-columns:110px 1fr;gap:8px;font-size:11px;color:#475467}
.help-list kbd{background:#f3f4f6;border:1px solid #dfe3e8;border-radius:4px;padding:3px 6px;font-size:10px}
.toggle-row{display:flex;align-items:center;gap:8px;font-size:11px;color:#475467;padding:0 14px 10px;margin:0}
.toggle-row.inline{padding:0}
.canvas-main{display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#d8dde4}
.canvas-meta{height:40px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:14px;padding:0 14px;font-size:12px;color:#667085}
.canvas-meta strong{color:#111827}
.scroll{height:calc(100% - 40px);overflow:auto;padding:28px 28px 80px 36px;position:relative}
.scroll.pan-mode{cursor:grab}
.scroll.pan-mode:active{cursor:grabbing}
.ruler-corner{position:sticky;top:0;left:0;width:24px;height:24px;background:#eef1f5;border-right:1px solid #ccd2da;border-bottom:1px solid #ccd2da;z-index:2;float:left}
.ruler-h{position:sticky;top:0;height:24px;margin-left:24px;background:#eef1f5;border-bottom:1px solid #ccd2da;z-index:2}
.ruler-v{position:absolute;left:0;top:24px;width:24px;bottom:0;background:#eef1f5;border-right:1px solid #ccd2da;z-index:2}
.ruler-h span,.ruler-v span{position:absolute;font-size:9px;color:#667085;transform:translate(-50%,-50%)}
.ruler-v span{left:50%}
.canvas-stage{margin-left:24px;padding-top:4px}
.snap-guide{position:absolute;background:#38bdf8;pointer-events:none;z-index:4}
.snap-guide.x{width:1px;top:0;bottom:0}
.snap-guide.y{height:1px;left:0;right:0}
.text-piece{display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-align:center;line-height:1.1;pointer-events:none;word-break:break-word;padding:4px}
.text-preview{display:grid;place-items:center;min-height:80px;font-size:24px;font-weight:700;background:#f3f4f6;border-radius:7px;padding:12px}
.fields.grid-2{grid-template-columns:1fr 1fr}
.align-row{padding:0 14px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.align-row>span{width:100%;font-size:11px;color:#667085;font-weight:600}
.align-row button{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:6px 8px;font-size:11px;cursor:pointer}
.ghost-save-btn{margin:0 14px 12px;width:calc(100% - 28px);border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:10px;font-weight:600;cursor:pointer}
.mobile-bar{display:none;position:fixed;left:0;right:0;bottom:0;height:56px;background:#0d1117;border-top:1px solid #243044;padding:6px 8px;gap:6px;z-index:8;justify-content:space-around}
.mobile-bar button{flex:1;border:0;border-radius:8px;background:#242b36;color:#fff;font-size:11px;font-weight:700;padding:8px 4px;cursor:pointer}
.mobile-bar button.save{background:#21a366}
.mobile-bar button:disabled{opacity:.45}
.mobile-drawer-close{display:none}
.workspace{height:calc(100vh - 88px)}
@media(max-width:900px){
  .workspace{grid-template-columns:56px minmax(0,1fr);height:calc(100vh - 120px)}
  .sidebar-panel,.properties{display:none;position:fixed;top:88px;bottom:56px;width:min(320px,84vw);z-index:7;box-shadow:8px 0 24px #34405435;flex-direction:column;overflow:auto}
  .sidebar-panel{left:56px}
  .properties{right:0;box-shadow:-8px 0 24px #34405435}
  .sidebar-panel.mobile-open,.properties.mobile-open{display:flex}
  .mobile-drawer-close{display:grid;position:absolute;right:8px;top:8px;z-index:3;width:32px;height:32px;place-items:center;border:1px solid #ccd2da;border-radius:999px;background:#fff;color:#344054;font-size:20px;cursor:pointer}
  .top-toolbar{display:none}
  .mobile-bar{display:flex}
  .canvas-meta{font-size:11px;flex-wrap:wrap;height:auto;min-height:40px;padding:6px 10px}
}

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
.lgs-editor.gs-editor-v2 .gs-command-bar{display:grid;grid-template-columns:minmax(220px,1fr) minmax(280px,2fr) minmax(260px,1fr);gap:12px;align-items:center}
.lgs-editor.gs-editor-v2 .gs-command-left,.lgs-editor.gs-editor-v2 .gs-command-center,.lgs-editor.gs-editor-v2 .gs-command-right{display:flex;align-items:center;gap:8px;min-width:0}
.lgs-editor.gs-editor-v2 .gs-command-center{justify-content:center;flex-wrap:nowrap}
.lgs-editor.gs-editor-v2 .gs-command-right{justify-content:flex-end}
.lgs-editor.gs-editor-v2 .gs-save-state{font-size:11px;font-weight:600;padding:4px 8px;border-radius:999px;background:#f3f4f6;color:#475467;white-space:nowrap}
.lgs-editor.gs-editor-v2 .gs-save-state.dirty{background:#fff7ed;color:#c2410c}
.lgs-editor.gs-editor-v2 .gs-icon-btn.active{background:#fff7ed;color:#c2410c}
.lgs-editor.gs-editor-v2 .gs-quality-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #dfe3e8;background:#fff;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:600;cursor:pointer}
.lgs-editor.gs-editor-v2 .gs-quality-btn.has-issues{border-color:#fdba74;background:#fff7ed;color:#9a3412}
.lgs-editor.gs-editor-v2 .gs-quality-btn.active{box-shadow:0 0 0 2px var(--accent)}
.lgs-editor.gs-editor-v2 .gs-quality-backdrop{position:fixed;inset:0;background:#0f172a40;z-index:45;display:grid;place-items:start center;padding:72px 16px 16px}
.lgs-editor.gs-editor-v2 .gs-quality-panel{background:#fff;border-radius:12px;max-width:420px;width:100%;box-shadow:0 16px 40px #0f172a25;padding:16px;max-height:min(70vh,560px);overflow:auto}
.lgs-editor.gs-editor-v2 .gs-quality-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.lgs-editor.gs-editor-v2 .gs-quality-head h2{margin:0;font-size:16px}
.lgs-editor.gs-editor-v2 .gs-quality-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px}
.lgs-editor.gs-editor-v2 .gs-quality-counts div{background:#f8fafc;border:1px solid #e4e7ec;border-radius:8px;padding:8px;text-align:center}
.lgs-editor.gs-editor-v2 .gs-quality-counts dt{font-size:10px;color:#667085;margin:0}
.lgs-editor.gs-editor-v2 .gs-quality-counts dd{margin:4px 0 0;font-size:16px;font-weight:700}
.lgs-editor.gs-editor-v2 .gs-quality-toggles{border:0;padding:0;margin:0 0 12px;display:grid;gap:6px}
.lgs-editor.gs-editor-v2 .gs-quality-toggles legend{font-size:11px;font-weight:700;color:#475467;margin-bottom:4px}
.lgs-editor.gs-editor-v2 .gs-quality-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.lgs-editor.gs-editor-v2 .gs-quality-list li{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border:1px solid #e4e7ec;border-radius:8px;padding:8px}
.lgs-editor.gs-editor-v2 .gs-quality-list small{display:block;color:#667085;font-size:10px;margin-top:2px}
.lgs-editor.gs-editor-v2 .gs-quality-list p{margin:4px 0 0;font-size:11px;color:#475467;line-height:1.4}
.lgs-editor.gs-editor-v2 .gs-quality-ok{margin:0;font-size:12px;color:#127a4b}
.lgs-editor.gs-editor-v2 .gs-minimap{position:absolute;right:12px;top:12px;width:56px;z-index:5;display:grid;gap:6px}
.lgs-editor.gs-editor-v2 .gs-minimap-sheet{position:relative;height:120px;border:1px solid #cbd5e1;border-radius:6px;background:#fff}
.lgs-editor.gs-editor-v2 .gs-minimap-viewport{position:absolute;left:2px;right:2px;border:2px solid var(--accent);border-radius:3px;background:#f9731620}
.lgs-editor.gs-editor-v2 .gs-minimap-reset{border:1px solid #dfe3e8;background:#fff;border-radius:6px;font-size:10px;padding:4px;cursor:pointer}
.lgs-editor.gs-editor-v2 .sheet.grid-off{background-image:none}
.lgs-editor.gs-editor-v2 .dpi-badge{font-size:9px;font-style:normal;font-weight:700}
.lgs-editor.gs-editor-v2 .dpi-badge.tier-excellent{color:#127a4b}
.lgs-editor.gs-editor-v2 .dpi-badge.tier-good{color:#0369a1}
.lgs-editor.gs-editor-v2 .dpi-badge.tier-low{color:#b45309}
.lgs-editor.gs-editor-v2 .dpi-badge.tier-poor,.lgs-editor.gs-editor-v2 .dpi-badge.tier-unknown{color:#991b1b}
@media(max-width:900px){.lgs-editor.gs-editor-v2 .gs-command-bar{grid-template-columns:1fr auto}.lgs-editor.gs-editor-v2 .gs-command-center{display:none}.lgs-editor.gs-editor-v2 .gs-hide-mobile{display:none}.lgs-editor.gs-editor-v2 .gs-save-dialog-body{grid-template-columns:1fr}.lgs-editor.gs-editor-v2 .workspace{height:calc(100vh - var(--gs-bar-h) - 56px)}}
`;
