/** v2 editor shell — full-viewport grid, command bar, panels, canvas focus. */
export const GANG_SHEET_SHELL_CSS = `
.lgs-editor.gs-editor-v2{
  --gs-control-h:36px;
  --gs-border:#e4e7ec;
  --gs-text-muted:#667085;
  --gs-text:#111827;
  --gs-secondary-bg:#f8fafc;
  --gs-primary:#21a366;
  --gs-panel-action-bg:#111827;
  --gs-panel-action-text:#fff;
  display:flex;
  flex-direction:column;
  height:100vh;
  max-height:100vh;
  overflow:hidden;
}

.lgs-editor.gs-editor-v2 .mobile-bar{display:none!important}

.lgs-editor.gs-editor-v2 .workspace{
  display:grid;
  grid-template-columns:var(--gs-rail-w) var(--gs-panel-w) minmax(0,1fr);
  flex:1;
  min-height:0;
  height:auto!important;
  overflow:hidden;
}
.lgs-editor.gs-editor-v2 .workspace.has-properties{
  grid-template-columns:var(--gs-rail-w) var(--gs-panel-w) minmax(0,1fr) var(--gs-props-w);
}

.lgs-editor.gs-editor-v2 .icon-rail{
  width:var(--gs-rail-w);
  background:var(--gs-rail-bg);
  overflow-y:auto;
  overflow-x:hidden;
  padding:10px 0 16px;
  gap:2px;
  border-right:1px solid #1f2937;
}
.lgs-editor.gs-editor-v2 .icon-rail .rail-btn{
  padding:8px 4px 6px;
  gap:5px;
  border-radius:8px;
  margin:0 6px;
  min-height:56px;
}
.lgs-editor.gs-editor-v2 .icon-rail .rail-btn.active{
  background:#243044;
  box-shadow:inset 3px 0 0 var(--accent);
}
.lgs-editor.gs-editor-v2 .icon-rail .rail-label{
  font-size:10px;
  line-height:1.15;
  text-align:center;
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
}
.lgs-editor.gs-editor-v2 .icon-rail .rail-icon svg{width:22px;height:22px}

.lgs-editor.gs-editor-v2 .sidebar-panel{
  width:var(--gs-panel-w);
  min-width:0;
  background:var(--gs-panel-bg);
  border-right:1px solid var(--gs-border);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.lgs-editor.gs-editor-v2 .sidebar-panel>.heading,
.lgs-editor.gs-editor-v2 .properties>.heading{
  height:auto;
  min-height:48px;
  padding:12px 14px;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .panel-body{
  flex:1;
  min-height:0;
  overflow-y:auto;
  display:flex;
  flex-direction:column;
}
.lgs-editor.gs-editor-v2 .panel-section{padding:0 14px 12px}
.lgs-editor.gs-editor-v2 .panel-desc{margin:0 0 10px;font-size:11px;color:var(--gs-text-muted);line-height:1.45}
.lgs-editor.gs-editor-v2 .gs-panel-primary{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  margin:0 14px 10px;
  padding:10px 12px;
  border:0;
  border-radius:var(--gs-radius-md);
  background:var(--gs-panel-action-bg);
  color:var(--gs-panel-action-text);
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  text-align:center;
}
.lgs-editor.gs-editor-v2 .gs-panel-primary:hover{background:#1f2937}
.lgs-editor.gs-editor-v2 .gs-panel-secondary{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  margin:0 14px 12px;
  padding:9px 12px;
  border:1px solid var(--gs-border);
  border-radius:var(--gs-radius-md);
  background:#fff;
  color:var(--gs-text);
  font-size:12px;
  font-weight:600;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .sidebar-tools{
  display:grid;
  grid-template-columns:1fr auto auto;
  gap:6px;
  padding:0 14px 10px;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .sidebar-tools input,
.lgs-editor.gs-editor-v2 .sidebar-tools select{
  height:32px;
  padding:0 10px;
  border:1px solid var(--gs-border);
  border-radius:8px;
  font-size:12px;
  background:#fff;
}
.lgs-editor.gs-editor-v2 .view-toggle{
  display:flex;
  border:1px solid var(--gs-border);
  border-radius:8px;
  overflow:hidden;
}
.lgs-editor.gs-editor-v2 .view-toggle button{
  width:32px;
  height:32px;
  border:0;
  background:#fff;
  color:var(--gs-text-muted);
  cursor:pointer;
  font-size:11px;
  font-weight:700;
}
.lgs-editor.gs-editor-v2 .view-toggle button.active{background:var(--gs-secondary-bg);color:var(--gs-text)}

.lgs-editor.gs-editor-v2 .drop.compact{
  margin:0 14px 12px;
  min-height:88px;
  padding:12px;
  border-style:dashed;
  border-color:#cbd5e1;
  background:var(--gs-secondary-bg);
}
.lgs-editor.gs-editor-v2 .drop.compact>b{font-size:22px}
.lgs-editor.gs-editor-v2 .pool-grid{padding:0 14px 14px}

.lgs-editor.gs-editor-v2 .properties{
  width:var(--gs-props-w);
  min-width:0;
  background:var(--gs-panel-bg);
  border-left:1px solid var(--gs-border);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.lgs-editor.gs-editor-v2 .properties .panel-body{overflow-y:auto}

.lgs-editor.gs-editor-v2 .canvas-main{
  background:var(--gs-canvas-bg);
  min-width:0;
  position:relative;
  display:flex;
  flex-direction:column;
}
.lgs-editor.gs-editor-v2 .canvas-meta{display:none!important}
.lgs-editor.gs-editor-v2 .scroll{
  height:100%;
  flex:1;
  min-height:0;
  overflow:auto;
  padding:12px 16px 56px 32px;
  position:relative;
}
.lgs-editor.gs-editor-v2 .canvas-stage{margin-left:20px;padding-top:2px}
.lgs-editor.gs-editor-v2 .ruler-corner{width:20px;height:20px}
.lgs-editor.gs-editor-v2 .ruler-h{height:20px;margin-left:20px}
.lgs-editor.gs-editor-v2 .ruler-v{width:20px;top:20px}
.lgs-editor.gs-editor-v2 .sheet{
  box-shadow:var(--gs-sheet-shadow,0 12px 40px rgba(15,23,42,.12),0 2px 8px rgba(15,23,42,.06));
  border:1px solid #d1d5db;
  background-color:#fff;
}
.lgs-editor.gs-editor-v2 .sheet.grid-on{
  background-image:linear-gradient(rgba(15,23,42,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,.04) 1px,transparent 1px);
}

.lgs-editor.gs-editor-v2 .gs-canvas-summary{
  position:absolute;
  right:16px;
  bottom:16px;
  z-index:4;
  display:grid;
  gap:4px;
  padding:10px 12px;
  background:#fff;
  border:1px solid var(--gs-border);
  border-radius:var(--gs-radius-md);
  box-shadow:0 4px 16px rgba(15,23,42,.08);
  font-size:11px;
  min-width:140px;
}
.lgs-editor.gs-editor-v2 .gs-canvas-summary p{
  margin:0;
  display:flex;
  justify-content:space-between;
  gap:12px;
  color:var(--gs-text-muted);
}
.lgs-editor.gs-editor-v2 .gs-canvas-summary strong{color:var(--gs-text);font-weight:700}

.lgs-editor.gs-editor-v2 .empty{
  gap:10px;
  padding:24px;
  color:var(--gs-text-muted);
}
.lgs-editor.gs-editor-v2 .empty .empty-icon{
  width:44px;
  height:44px;
  border-radius:999px;
  background:#fff;
  border:1px dashed #cbd5e1;
  display:grid;
  place-items:center;
  font-size:22px;
  color:var(--gs-text-muted);
  font-weight:400;
}
.lgs-editor.gs-editor-v2 .empty strong{
  color:var(--gs-text);
  font-size:15px;
  font-weight:700;
}
.lgs-editor.gs-editor-v2 .empty small{
  font-size:12px;
  max-width:280px;
  line-height:1.45;
}
.lgs-editor.gs-editor-v2 .empty-actions{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  justify-content:center;
  margin-top:4px;
}
.lgs-editor.gs-editor-v2 .gs-empty-primary,
.lgs-editor.gs-editor-v2 .gs-empty-secondary{
  border-radius:var(--gs-radius-md);
  padding:9px 14px;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-empty-primary{
  border:0;
  background:var(--gs-panel-action-bg);
  color:#fff;
}
.lgs-editor.gs-editor-v2 .gs-empty-secondary{
  border:1px solid var(--gs-border);
  background:#fff;
  color:var(--gs-text);
}

.lgs-editor.gs-editor-v2 .pool-list{
  display:grid;
  gap:6px;
  padding:0 14px 14px;
}
.lgs-editor.gs-editor-v2 .pool-list .pool-item-wrap{
  display:grid;
  grid-template-columns:1fr;
}
.lgs-editor.gs-editor-v2 .pool-list .pool-item{
  grid-template-columns:48px 1fr;
  align-items:center;
}

.lgs-editor.gs-editor-v2 .gs-show-narrow-only{display:none}
@media(max-width:1280px){
  .lgs-editor.gs-editor-v2 .gs-show-narrow-only{display:inline}
}

.lgs-editor.gs-editor-v2 .gs-command-bar{
  height:var(--gs-bar-h);
  min-height:var(--gs-bar-h);
  max-height:var(--gs-bar-h);
  display:grid;
  grid-template-columns:minmax(180px,1.1fr) minmax(0,2fr) minmax(200px,1fr);
  gap:8px;
  padding:0 12px;
  align-items:center;
  background:var(--gs-bar-bg);
  border-bottom:1px solid var(--gs-border);
  overflow:hidden;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-command-left,
.lgs-editor.gs-editor-v2 .gs-command-center,
.lgs-editor.gs-editor-v2 .gs-command-right{
  display:flex;
  align-items:center;
  gap:6px;
  min-width:0;
  overflow:hidden;
}
.lgs-editor.gs-editor-v2 .gs-command-left{flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-command-center{justify-content:center}
.lgs-editor.gs-editor-v2 .gs-command-right{justify-content:flex-end;flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-command-logo{
  width:32px;
  height:32px;
  border-radius:8px;
  flex-shrink:0;
  font-size:16px;
}
.lgs-editor.gs-editor-v2 .gs-design-name-field input{
  width:min(180px,16vw);
  height:var(--gs-control-h);
  padding:0 10px;
  font-size:12px;
}
.lgs-editor.gs-editor-v2 .gs-save-state{
  font-size:10px;
  padding:3px 7px;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-icon-btn,
.lgs-editor.gs-editor-v2 .gs-ghost-btn{
  height:var(--gs-control-h);
  min-height:var(--gs-control-h);
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-icon-btn{width:var(--gs-control-h);min-width:var(--gs-control-h)}
.lgs-editor.gs-editor-v2 .gs-ghost-btn{padding:0 10px;font-size:11px;white-space:nowrap}
.lgs-editor.gs-editor-v2 .gs-history-group,
.lgs-editor.gs-editor-v2 .gs-zoom-group{
  height:var(--gs-control-h);
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-zoom-label{
  min-width:40px;
  font-size:11px;
  line-height:var(--gs-control-h);
}
.lgs-editor.gs-editor-v2 .gs-sheet-meta{flex-shrink:0}
.lgs-editor.gs-editor-v2 .gs-sheet-select span{display:none}
.lgs-editor.gs-editor-v2 .gs-sheet-select select{
  height:var(--gs-control-h);
  padding:0 8px;
  font-size:11px;
  max-width:108px;
}
.lgs-editor.gs-editor-v2 .gs-price-inline{
  display:flex;
  align-items:baseline;
  gap:4px;
  padding:0 6px;
  font-size:11px;
  color:var(--gs-text-muted);
  white-space:nowrap;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-price-inline strong{
  font-size:13px;
  color:var(--gs-text);
  font-weight:700;
}
.lgs-editor.gs-editor-v2 .gs-price-pill{display:none}
.lgs-editor.gs-editor-v2 .gs-secondary-btn,
.lgs-editor.gs-editor-v2 .gs-primary-btn{
  height:var(--gs-control-h);
  padding:0 12px;
  font-size:11px;
  white-space:nowrap;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-primary-btn{background:var(--gs-primary);box-shadow:none}
.lgs-editor.gs-editor-v2 .gs-quality-btn{
  height:var(--gs-control-h);
  padding:0 10px;
  font-size:11px;
  white-space:nowrap;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-quality-btn-label{color:var(--gs-text-muted);font-weight:600}
.lgs-editor.gs-editor-v2 .gs-quality-btn-value{font-weight:700;color:var(--gs-text)}

.lgs-editor.gs-editor-v2 .gs-minimap{
  width:40px;
  right:10px;
  top:10px;
  gap:4px;
}
.lgs-editor.gs-editor-v2 .gs-minimap-sheet{height:72px;border-radius:4px}
.lgs-editor.gs-editor-v2 .gs-minimap-reset{font-size:9px;padding:3px 2px}

.lgs-editor.gs-editor-v2 .sidebar-upload-btn{display:none}

@media(max-width:1280px){
  .lgs-editor.gs-editor-v2 .gs-hide-narrow{display:none!important}
  .lgs-editor.gs-editor-v2 .gs-design-name-field input{width:min(140px,14vw)}
}

@media(max-width:1024px){
  .lgs-editor.gs-editor-v2 .workspace.has-properties{
    grid-template-columns:var(--gs-rail-w) var(--gs-panel-w) minmax(0,1fr);
  }
  .lgs-editor.gs-editor-v2 .properties{
    display:none;
    position:fixed;
    top:var(--gs-bar-h);
    right:0;
    bottom:0;
    width:min(var(--gs-props-w),88vw);
    z-index:9;
    box-shadow:-8px 0 24px rgba(15,23,42,.12);
  }
  .lgs-editor.gs-editor-v2 .properties.mobile-open{display:flex}
}

@media(max-width:900px){
  .lgs-editor.gs-editor-v2 .icon-rail{display:none}
  .lgs-editor.gs-editor-v2 .workspace,
  .lgs-editor.gs-editor-v2 .workspace.has-properties{
    grid-template-columns:minmax(0,1fr);
  }
  .lgs-editor.gs-editor-v2 .sidebar-panel{
    display:none;
    position:fixed;
    top:var(--gs-bar-h);
    left:0;
    bottom:56px;
    width:min(var(--gs-panel-w),92vw);
    z-index:9;
    box-shadow:8px 0 24px rgba(15,23,42,.12);
  }
  .lgs-editor.gs-editor-v2 .sidebar-panel.mobile-open{display:flex}
  .lgs-editor.gs-editor-v2 .properties{
    top:var(--gs-bar-h);
    bottom:56px;
  }
  .lgs-editor.gs-editor-v2 .mobile-drawer-close{display:grid}
  .lgs-editor.gs-editor-v2 .mobile-bar{
    display:flex!important;
    position:fixed;
    left:0;
    right:0;
    bottom:0;
    height:56px;
    background:#0d1117;
    border-top:1px solid #243044;
    padding:6px 8px;
    gap:6px;
    z-index:10;
    justify-content:space-around;
  }
  .lgs-editor.gs-editor-v2 .mobile-bar button{
    flex:1;
    border:0;
    border-radius:8px;
    background:#242b36;
    color:#fff;
    font-size:11px;
    font-weight:700;
    padding:8px 4px;
    cursor:pointer;
  }
  .lgs-editor.gs-editor-v2 .mobile-bar button.save{background:var(--gs-primary)}
  .lgs-editor.gs-editor-v2 .scroll{padding:8px 8px 48px 24px}
  .lgs-editor.gs-editor-v2 .gs-command-bar{
    grid-template-columns:1fr auto;
    padding:0 10px;
  }
  .lgs-editor.gs-editor-v2 .gs-command-center{display:none}
  .lgs-editor.gs-editor-v2 .gs-hide-mobile{display:none!important}
  .lgs-editor.gs-editor-v2 .gs-canvas-summary{display:none}
}

@media(max-width:768px){
  .lgs-editor.gs-editor-v2 .gs-sheet-meta{display:none}
}
`;
