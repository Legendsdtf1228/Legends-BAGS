import { BAGS_STOREFRONT_TOKEN_CSS } from "./bags-storefront-tokens";

export const BAGS_PARITY_EDITOR_CSS = `
${BAGS_STOREFRONT_TOKEN_CSS}

.lgs-editor.bags-parity-editor{
  display:flex;
  flex-direction:column;
  height:100vh;
  max-height:100vh;
  overflow:hidden;
  background:var(--bags-workspace);
  color:var(--bags-text);
  font:13px/1.35 Inter,system-ui,sans-serif;
}

.lgs-editor.bags-parity-editor .gs-command-bar,
.lgs-editor.bags-parity-editor .icon-rail,
.lgs-editor.bags-parity-editor .mobile-bar{display:none!important}

.lgs-editor.bags-parity-editor .bags-parity-left-rail{
  width:var(--bags-rail-w);
  min-width:var(--bags-rail-w);
  background:var(--bags-surface);
  color:var(--bags-muted);
  border-right:1px solid var(--bags-border);
  display:flex;
  flex-direction:column;
  align-items:stretch;
  padding:6px 0 0;
  gap:0;
  flex-shrink:0;
  z-index:6;
  overflow:hidden;
}
.lgs-editor.bags-parity-editor .bags-left-rail-main{
  flex:1;
  min-height:0;
  overflow-y:auto;
  display:flex;
  flex-direction:column;
  gap:0;
}
.lgs-editor.bags-parity-editor .bags-left-rail-footer{
  margin-top:auto;
  padding:6px 4px 8px;
  border-top:1px solid var(--bags-border);
  display:grid;
  gap:6px;
  flex-shrink:0;
}
.lgs-editor.bags-parity-editor .bags-left-rail-lang{
  width:100%;
  height:24px;
  border:1px solid var(--bags-border);
  border-radius:var(--bags-btn-r);
  background:#fff;
  font-size:9px;
  font-weight:600;
  color:var(--bags-text);
  padding:0 2px;
  cursor:pointer;
}
.lgs-editor.bags-parity-editor .bags-left-rail-powered{
  font-size:7px;
  line-height:1.2;
  text-align:center;
  color:var(--bags-muted);
  letter-spacing:.01em;
}
.lgs-editor.bags-parity-editor .bags-left-rail-btn{
  position:relative;
  border:0;
  background:transparent;
  color:var(--bags-muted);
  padding:6px 2px;
  cursor:pointer;
  display:grid;
  justify-items:center;
  gap:2px;
  font-size:8px;
  font-weight:600;
}
.lgs-editor.bags-parity-editor .bags-left-rail-btn svg{width:var(--bags-icon);height:var(--bags-icon);color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-left-rail-btn:hover:not(:disabled){color:var(--bags-primary);background:#f8f9fa}
.lgs-editor.bags-parity-editor .bags-left-rail-btn:hover:not(:disabled) svg{color:var(--bags-primary)}
.lgs-editor.bags-parity-editor .bags-left-rail-btn.active{color:var(--bags-primary);background:#e8f0fe}
.lgs-editor.bags-parity-editor .bags-left-rail-btn.active svg{color:var(--bags-primary)}
.lgs-editor.bags-parity-editor .bags-left-rail-label{font-size:9px;letter-spacing:.02em;line-height:1.1;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px}
.lgs-editor.bags-parity-editor .bags-left-rail-badge{
  position:absolute;top:4px;right:6px;min-width:14px;height:14px;padding:0 3px;border-radius:999px;
  background:var(--bags-primary);color:#fff;font-size:8px;font-weight:700;display:grid;place-items:center
}
.lgs-editor.bags-parity-editor .bags-parity-logo{
  width:28px;height:28px;border-radius:6px;background:var(--bags-primary);color:#fff;
  display:grid;place-items:center;font-weight:800;font-size:13px;flex-shrink:0
}

.lgs-editor.bags-parity-editor .bags-parity-header{
  height:var(--bags-header-h);
  min-height:var(--bags-header-h);
  display:flex;
  align-items:center;
  gap:10px;
  padding:0 10px;
  background:var(--bags-surface);
  border-bottom:1px solid var(--bags-border);
  flex-shrink:0;
  overflow:hidden;
}
.lgs-editor.bags-parity-editor .bags-parity-header-left{display:flex;align-items:center;gap:12px;flex-shrink:0;min-width:0}
.lgs-editor.bags-parity-editor .bags-parity-qty{display:flex;align-items:center;gap:6px;flex-shrink:0}
.lgs-editor.bags-parity-editor .bags-parity-qty-label{font-size:11px;color:var(--bags-muted);font-weight:600;white-space:nowrap}
.lgs-editor.bags-parity-editor .bags-parity-qty .stepper-field>span:first-child{display:none}
.lgs-editor.bags-parity-editor .bags-parity-qty .stepper{min-width:96px}
.lgs-editor.bags-parity-editor .bags-parity-price{
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:0;
  line-height:1.15;
  font-size:10px;
  color:var(--bags-muted);
  flex-shrink:0;
  margin-left:auto;
  margin-right:8px;
  min-width:52px;
}
.lgs-editor.bags-parity-editor .bags-parity-price strong{font-size:14px;color:var(--bags-text);white-space:nowrap;font-weight:700}
.lgs-editor.bags-parity-editor .bags-parity-price span{font-size:10px;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-parity-header-actions{display:flex;align-items:center;gap:4px;flex:1;min-width:0;justify-content:center;flex-wrap:nowrap}
.lgs-editor.bags-parity-editor .bags-btn{
  height:var(--bags-control);
  border-radius:4px;
  padding:0 10px;
  font-size:11px;
  font-weight:700;
  border:1px solid transparent;
  cursor:pointer;
  white-space:nowrap;
  flex-shrink:0;
}
.lgs-editor.bags-parity-editor .bags-btn:disabled{opacity:.5;cursor:not-allowed}
.lgs-editor.bags-parity-editor .bags-btn-primary{background:var(--bags-primary);color:#fff;border-color:var(--bags-primary)}
.lgs-editor.bags-parity-editor .bags-btn-secondary{background:#fff;color:var(--bags-text);border-color:var(--bags-border)}
.lgs-editor.bags-parity-editor .bags-btn-danger{background:#fff;color:var(--bags-danger);border-color:#f5c2c0}

.lgs-editor.bags-parity-editor .bags-parity-account{position:relative;flex-shrink:0}
.lgs-editor.bags-parity-editor .bags-parity-account summary{list-style:none;cursor:pointer}
.lgs-editor.bags-parity-editor .bags-parity-account summary::-webkit-details-marker{display:none}
.lgs-editor.bags-parity-editor .bags-parity-account-trigger{display:flex;align-items:center;gap:8px;padding:4px 8px;border:1px solid var(--bags-border);border-radius:4px;background:#fff}
.lgs-editor.bags-parity-editor .bags-parity-avatar{width:28px;height:28px;border-radius:50%;background:#e8f0fe;color:var(--bags-primary);display:grid;place-items:center;font-size:11px;font-weight:700}
.lgs-editor.bags-parity-editor .bags-parity-account-text strong,.lgs-editor.bags-parity-editor .bags-parity-account-text small{display:block;line-height:1.2}
.lgs-editor.bags-parity-editor .bags-parity-account-text small{font-size:10px;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-parity-account-menu{
  position:absolute;right:0;top:calc(100% + 4px);min-width:160px;background:#fff;border:1px solid var(--bags-border);
  border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.12);padding:4px;z-index:20;display:grid;gap:2px
}
.lgs-editor.bags-parity-editor .bags-parity-account-menu button{border:0;background:transparent;text-align:left;padding:8px 10px;border-radius:3px;font-size:12px;cursor:pointer}
.lgs-editor.bags-parity-editor .bags-parity-account-menu button:hover{background:#f1f3f4}

.lgs-editor.bags-parity-editor .bags-parity-toolbar{
  height:var(--bags-toolbar-h);
  display:flex;
  align-items:center;
  gap:4px;
  padding:0 8px;
  background:var(--bags-surface);
  border-bottom:1px solid var(--bags-border);
  flex-shrink:0;
  overflow-x:auto;
}
.lgs-editor.bags-parity-editor .bags-toolbar-spacer{flex:1;min-width:8px}
.lgs-editor.bags-parity-editor .bags-parity-sheet-select select{
  height:var(--bags-control);
  border:1px solid var(--bags-border);
  border-radius:4px;
  padding:0 8px;
  font-size:12px;
  background:#fff;
}
.lgs-editor.bags-parity-editor .bags-parity-tool-group{display:flex;align-items:center;border:1px solid var(--bags-border);border-radius:4px;overflow:hidden;background:#fff;flex-shrink:0}
.lgs-editor.bags-parity-editor .bags-tool-btn{
  width:var(--bags-control);
  height:var(--bags-control);
  border:0;
  background:#fff;
  color:var(--bags-text);
  cursor:pointer;
  display:grid;
  place-items:center;
  padding:0;
  font-size:11px;
  font-weight:700;
  flex-shrink:0;
}
.lgs-editor.bags-parity-editor .bags-tool-btn:hover:not(:disabled){background:#f1f3f4}
.lgs-editor.bags-parity-editor .bags-tool-btn:disabled{opacity:.4;cursor:not-allowed}
.lgs-editor.bags-parity-editor .bags-tool-btn.active{background:#e8f0fe;color:var(--bags-primary)}
.lgs-editor.bags-parity-editor .bags-tool-nest{
  width:auto;
  height:var(--bags-control);
  padding:0 12px;
  font-size:11px;
  font-weight:700;
  color:#fff;
  background:var(--bags-nest);
  border:0;
  border-radius:var(--bags-btn-r);
  margin-left:0;
  flex-shrink:0;
}
.lgs-editor.bags-parity-editor .bags-zoom-label{min-width:44px;text-align:center;font-size:11px;font-weight:600;border-inline:1px solid var(--bags-border);line-height:var(--bags-control)}

.lgs-editor.bags-parity-editor .bags-parity-body{
  flex:1;
  min-height:0;
  display:flex;
  flex-direction:column;
  position:relative;
}
.lgs-editor.bags-parity-editor .workspace.bags-parity-workspace{
  display:grid;
  grid-template-columns:var(--bags-rail-w) minmax(0,1fr);
  height:100%;
  min-height:0;
}
.lgs-editor.bags-parity-editor .workspace.bags-parity-workspace.has-side-panel{
  grid-template-columns:var(--bags-rail-w) var(--bags-panel-w) minmax(0,1fr);
}
.lgs-editor.bags-parity-editor .bags-canvas-row{
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  height:100%;
  min-height:0;
  min-width:0;
}
.lgs-editor.bags-parity-editor .bags-canvas-scroll-wrap{display:flex;flex-direction:column;min-width:0;min-height:0;height:100%;position:relative}
.lgs-editor.bags-parity-editor .bags-quality-legend{
  width:var(--bags-legend-w);
  flex-shrink:0;
  padding:8px 6px 8px 8px;
  background:var(--bags-surface);
  border-right:1px solid var(--bags-border);
  overflow-y:auto;
  font-size:9px;
  line-height:1.35;
}
.lgs-editor.bags-parity-editor .bags-quality-legend-title{display:block;font-size:11px;font-weight:700;margin-bottom:8px;color:var(--bags-text)}
.lgs-editor.bags-parity-editor .bags-quality-legend-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.lgs-editor.bags-parity-editor .bags-quality-legend-list li{display:flex;align-items:flex-start;gap:6px;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-legend-toggle{display:flex;align-items:flex-start;gap:6px;cursor:pointer;font-size:inherit;color:inherit}
.lgs-editor.bags-parity-editor .bags-legend-toggle input{margin-top:2px;flex-shrink:0}
.lgs-editor.bags-parity-editor .bags-legend-swatch{
  width:14px;height:14px;border-radius:2px;flex-shrink:0;margin-top:1px;border:1px solid rgba(0,0,0,.12)
}
.lgs-editor.bags-parity-editor .bags-legend-overlap .bags-legend-swatch{background:repeating-linear-gradient(45deg,#f97316,#f97316 2px,transparent 2px,transparent 4px);border-color:#f97316}
.lgs-editor.bags-parity-editor .bags-legend-resolution .bags-legend-swatch{background:repeating-linear-gradient(0deg,#9334e6,#9334e6 1px,transparent 1px,transparent 3px);border-color:#9334e6}
.lgs-editor.bags-parity-editor .bags-legend-optimal .bags-legend-swatch{background:#137333;border-color:#137333}
.lgs-editor.bags-parity-editor .bags-legend-good .bags-legend-swatch{background:#1a73e8;border-color:#1a73e8}
.lgs-editor.bags-parity-editor .bags-legend-bad .bags-legend-swatch{background:#e37400;border-color:#e37400}
.lgs-editor.bags-parity-editor .bags-legend-terrible .bags-legend-swatch{background:#d93025;border-color:#d93025}
.lgs-editor.bags-parity-editor .bags-legend-minimum .bags-legend-swatch{background:#5f2120;border-color:#5f2120}
.lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar{
  display:none;
  width:var(--bags-panel-w);
  min-width:var(--bags-panel-w);
  background:#fff;
  border-right:1px solid var(--bags-border);
  flex-direction:column;
  overflow:auto;
  position:relative;
  min-height:0;
}
.lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar.open{display:flex}
.lgs-editor.bags-parity-editor .bags-products-list{list-style:none;margin:0;padding:0 12px 12px;display:grid;gap:6px}
.lgs-editor.bags-parity-editor .bags-product-row{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;
  border:1px solid var(--bags-border);border-radius:4px;padding:10px;background:#fafafa;cursor:pointer;text-align:left
}
.lgs-editor.bags-parity-editor .bags-product-row.active{border-color:var(--bags-primary);background:#e8f0fe}
.lgs-editor.bags-parity-editor .bags-product-size strong,.lgs-editor.bags-parity-editor .bags-product-size small{display:block;line-height:1.3}
.lgs-editor.bags-parity-editor .bags-product-size small{font-size:10px;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-product-price{font-size:13px;font-weight:700;color:var(--bags-text);white-space:nowrap}
.lgs-editor.bags-parity-editor .properties{display:none!important}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties{
  display:none!important;
  width:var(--bags-props-w,260px);
  min-width:var(--bags-props-w,260px);
  background:#fff;
  border-left:1px solid var(--bags-border);
  flex-direction:column;
  overflow:auto;
  min-height:0;
}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties.open{display:flex!important}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .heading{
  height:48px;
  min-height:48px;
  padding:10px 12px;
  border-bottom:1px solid var(--bags-border);
}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .heading strong{font-size:12px;font-weight:700}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .heading small{font-size:10px;color:var(--bags-muted);margin-top:2px}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .preview{padding:10px 12px;border-bottom:1px solid var(--bags-border)}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .preview img{max-height:72px;border-radius:var(--bags-btn-r);border:1px solid var(--bags-border)}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .preview strong{font-size:11px;font-weight:600;margin-top:6px;display:block}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .sidebar-form{padding:10px 12px;display:grid;gap:8px}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .sidebar-form label{font-size:10px;font-weight:600;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .sidebar-form input,
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .sidebar-form select{
  height:28px;
  border:1px solid var(--bags-border);
  border-radius:var(--bags-btn-r);
  font-size:11px;
  padding:0 6px;
}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .actions{padding:0 12px 12px;display:grid;gap:6px}
.lgs-editor.bags-parity-editor .properties.bags-parity-properties .actions button{
  height:30px;
  border-radius:var(--bags-btn-r);
  font-size:11px;
  font-weight:600;
}
.lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar .heading{
  height:48px;
  min-height:48px;
  padding:10px 12px;
}
.lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar .drop.compact{
  margin:0 12px 10px;
  min-height:88px;
  border:1px dashed var(--bags-border);
  border-radius:var(--bags-btn-r);
  font-size:10px;
}
.lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar .sidebar-upload-btn{
  margin:0 12px 10px;
  height:30px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--bags-primary);
  border-radius:var(--bags-btn-r);
  font-size:11px;
  font-weight:700;
  padding:0 10px;
}
.lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar .pool-grid{padding:0 12px 12px;gap:6px}
.lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar .pool-item{
  border-radius:var(--bags-btn-r);
  padding:6px;
  border-color:var(--bags-border);
}
.lgs-editor.bags-parity-editor .workspace.bags-parity-workspace.has-properties{
  grid-template-columns:var(--bags-rail-w) minmax(0,1fr) var(--bags-props-w,260px);
}
.lgs-editor.bags-parity-editor .workspace.bags-parity-workspace.has-side-panel.has-properties{
  grid-template-columns:var(--bags-rail-w) var(--bags-panel-w) minmax(0,1fr) var(--bags-props-w,260px);
}
.lgs-editor.bags-parity-editor .bags-upload-view-toggle{display:flex;border:1px solid var(--bags-border);border-radius:4px;overflow:hidden}
.lgs-editor.bags-parity-editor .bags-upload-view-toggle button{border:0;background:#fff;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer}
.lgs-editor.bags-parity-editor .bags-upload-view-toggle button.active{background:#e8f0fe;color:var(--bags-primary)}
.lgs-editor.bags-parity-editor .bags-upload-progress{margin:0 14px 8px;font-size:11px;color:var(--bags-primary);font-weight:600}
.lgs-editor.bags-parity-editor .bags-add-text-btn{margin-top:6px;background:#fff;color:var(--bags-primary);border:1px solid var(--bags-border)}
.lgs-editor.bags-parity-editor .pool-grid.list-view{grid-template-columns:1fr}
.lgs-editor.bags-parity-editor .pool-grid.list-view .pool-item{grid-template-columns:48px 1fr auto;align-items:center}
.lgs-editor.bags-parity-editor .qty-badge{background:var(--bags-primary);color:#fff;border-radius:999px;padding:1px 5px;font-style:normal;font-size:9px;font-weight:700}
.lgs-editor.bags-parity-editor .bags-fitcheck{display:block;margin-top:6px;font-size:11px;font-weight:700}
.lgs-editor.bags-parity-editor .bags-fitcheck-optimal,.lgs-editor.bags-parity-editor .bags-fitcheck-good{color:#137333}
.lgs-editor.bags-parity-editor .bags-fitcheck-bad,.lgs-editor.bags-parity-editor .bags-fitcheck-terrible,.lgs-editor.bags-parity-editor .bags-fitcheck-minimum{color:#d93025}
.lgs-editor.bags-parity-editor .bags-image-editor-modal{max-width:var(--bags-modal-w,960px);width:min(960px,96vw)}
.lgs-editor.bags-parity-editor .bags-image-editor-layout{
  display:grid;
  grid-template-columns:112px minmax(0,1fr);
  min-height:420px;
  flex:1;
  min-height:0;
}
.lgs-editor.bags-parity-editor .bags-image-editor-nav{
  display:flex;
  flex-direction:column;
  border-right:1px solid var(--bags-border);
  padding:8px 0;
  background:#fafafa;
}
.lgs-editor.bags-parity-editor .bags-image-editor-nav-btn{
  border:0;
  background:transparent;
  text-align:left;
  padding:10px 14px;
  font-size:12px;
  font-weight:600;
  color:var(--bags-muted);
  cursor:pointer;
  border-right:2px solid transparent;
}
.lgs-editor.bags-parity-editor .bags-image-editor-nav-btn:hover{background:#f1f3f4;color:var(--bags-text)}
.lgs-editor.bags-parity-editor .bags-image-editor-nav-btn.active{
  color:var(--bags-primary);
  background:#e8f0fe;
  border-right-color:var(--bags-primary);
}
.lgs-editor.bags-parity-editor .bags-image-editor-main{display:flex;flex-direction:column;min-width:0;min-height:0}
.lgs-editor.bags-parity-editor .bags-image-editor-body{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:12px;padding:12px;flex:1;min-height:0;overflow:auto}
.lgs-editor.bags-parity-editor .bags-image-editor-preview-col{display:flex;flex-direction:column;gap:8px;min-width:0}
.lgs-editor.bags-parity-editor .bags-image-editor-preview-controls{display:flex;flex-wrap:wrap;gap:10px;font-size:10px;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-image-editor-preview-controls label{display:flex;align-items:center;gap:6px}
.lgs-editor.bags-parity-editor .bags-image-editor-preview{display:grid;place-items:center;min-height:300px;border:1px solid var(--bags-border);border-radius:var(--bags-btn-r);overflow:hidden;transform-origin:center center;background:#f8f9fa}
.lgs-editor.bags-parity-editor .bags-image-editor-preview img{max-width:100%;max-height:300px;object-fit:contain}
.lgs-editor.bags-parity-editor .bags-image-editor-controls{display:grid;gap:10px;align-content:start}
.lgs-editor.bags-parity-editor .bags-image-editor-cards{display:grid;gap:8px}
.lgs-editor.bags-parity-editor .bags-image-editor-card{
  border:1px solid var(--bags-border);
  border-radius:var(--bags-btn-r);
  padding:10px;
  background:#fff;
  text-align:left;
  cursor:pointer;
  display:grid;
  gap:4px;
}
.lgs-editor.bags-parity-editor .bags-image-editor-card strong{font-size:12px;color:var(--bags-text)}
.lgs-editor.bags-parity-editor .bags-image-editor-card span{font-size:10px;color:var(--bags-muted);line-height:1.35}
.lgs-editor.bags-parity-editor .bags-modal-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  padding:10px 12px;
  border-top:1px solid var(--bags-border);
  flex-shrink:0;
}
.lgs-editor.bags-parity-editor .bags-modal-actions .bags-btn-close-lg{
  min-width:120px;
  height:36px;
  font-size:12px;
  font-weight:700;
}
.lgs-editor.bags-parity-editor .bags-preview-bg-checkerboard{background:repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 50%/16px 16px}
.lgs-editor.bags-parity-editor .bags-preview-bg-white{background:#fff}
.lgs-editor.bags-parity-editor .bags-preview-bg-black{background:#111}
.lgs-editor.bags-parity-editor .bags-preview-bg-gray{background:#9ca3af}
.lgs-editor.bags-parity-editor .bags-automation-report{list-style:none;margin:12px 0;padding:0;display:grid;gap:8px}
.lgs-editor.bags-parity-editor .bags-automation-report li{display:flex;justify-content:space-between;font-size:13px}
.lgs-editor.bags-parity-editor .marquee-select{position:absolute;border:1px dashed var(--bags-primary);background:#1a73e820;pointer-events:none;z-index:9999}
.lgs-editor.bags-parity-editor .canvas-main{background:var(--bags-workspace);min-width:0;display:flex;flex-direction:column;min-height:0}
.lgs-editor.bags-parity-editor .canvas-meta{display:none}
.lgs-editor.bags-parity-editor .scroll{height:100%;padding:8px 12px 8px 28px;flex:1;min-height:0;overflow:auto}
.lgs-editor.bags-parity-editor .canvas-stage{position:relative;margin-left:20px;padding-top:2px;min-height:0}
.lgs-editor.bags-parity-editor .resize-handle{
  position:absolute;width:8px;height:8px;border:1.5px solid #fff;background:var(--bags-primary);
  border-radius:1px;padding:0;cursor:nwse-resize;z-index:9;pointer-events:auto;box-shadow:0 0 0 1px rgba(26,115,232,.35)
}
.lgs-editor.bags-parity-editor .resize-handle.se{right:-5px;bottom:-5px;cursor:nwse-resize}
.lgs-editor.bags-parity-editor .resize-handle.sw{left:-5px;bottom:-5px;cursor:nesw-resize}
.lgs-editor.bags-parity-editor .resize-handle.ne{right:-5px;top:-5px;cursor:nesw-resize}
.lgs-editor.bags-parity-editor .resize-handle.nw{left:-5px;top:-5px;cursor:nwse-resize}
.lgs-editor.bags-parity-editor .resize-handle.n{left:50%;top:-5px;transform:translateX(-50%);cursor:ns-resize}
.lgs-editor.bags-parity-editor .resize-handle.s{left:50%;bottom:-5px;transform:translateX(-50%);cursor:ns-resize}
.lgs-editor.bags-parity-editor .resize-handle.e{right:-5px;top:50%;transform:translateY(-50%);cursor:ew-resize}
.lgs-editor.bags-parity-editor .resize-handle.w{left:-5px;top:50%;transform:translateY(-50%);cursor:ew-resize}
.lgs-editor.bags-parity-editor .rotate-handle{
  position:absolute;top:-18px;left:50%;transform:translateX(-50%);
  width:14px;height:14px;border-radius:50%;border:2px solid var(--bags-primary);background:#fff;cursor:grab;z-index:2;
  display:grid;place-items:center;padding:0;
}
.lgs-editor.bags-parity-editor .rotate-handle:active{cursor:grabbing}
.lgs-editor.bags-parity-editor .rotate-handle::after{
  content:"";width:6px;height:6px;border-radius:50%;background:var(--bags-primary);display:block
}
.lgs-editor.bags-parity-editor .empty{
  position:absolute;inset:0;display:grid;place-content:center;text-align:center;gap:4px;
  color:var(--bags-muted);font-size:12px;pointer-events:none;padding:24px
}
.lgs-editor.bags-parity-editor .empty b,.lgs-editor.bags-parity-editor .empty strong{display:none}
.lgs-editor.bags-parity-editor .empty small{font-size:12px;color:var(--bags-muted);max-width:240px;line-height:1.4}

.lgs-editor.bags-parity-editor .bags-parity-selection-bar{
  display:flex;
  align-items:center;
  gap:4px;
  padding:2px 6px;
  min-height:var(--bags-selection-bar-h,36px);
  background:var(--bags-surface);
  border-bottom:1px solid var(--bags-border);
  overflow-x:auto;
  flex-shrink:0;
}
.lgs-editor.bags-parity-editor .bags-sel-field{display:grid;gap:1px;font-size:9px;color:var(--bags-muted);font-weight:600}
.lgs-editor.bags-parity-editor .bags-sel-field input{width:52px;height:26px;border:1px solid var(--bags-border);border-radius:var(--bags-btn-r);padding:0 4px;font-size:10px}
.lgs-editor.bags-parity-editor .bags-sel-dpi{font-size:10px;font-weight:700;color:var(--bags-muted);padding:0 4px;white-space:nowrap}
.lgs-editor.bags-parity-editor .bags-sel-actions{display:flex;gap:1px;flex-shrink:0;margin-left:4px}
.lgs-editor.bags-parity-editor .bags-sel-actions .bags-tool-btn{width:28px;height:28px;font-size:0}
.lgs-editor.bags-parity-editor .bags-sel-icon{display:grid;place-items:center;width:16px;height:16px}
.lgs-editor.bags-parity-editor .bags-sel-icon svg{width:16px;height:16px}
.lgs-editor.bags-parity-editor .bags-tool-danger{color:var(--bags-danger)}
.lgs-editor.bags-parity-editor .bags-tool-danger svg{color:var(--bags-danger)}

.lgs-editor.bags-parity-editor .bags-parity-bottom-nav{
  height:var(--bags-bottom-h);
  display:flex;
  background:#fff;
  border-top:1px solid var(--bags-border);
  flex-shrink:0;
  z-index:10;
}
.lgs-editor.bags-parity-editor .bags-bottom-nav-btn{
  flex:1;
  border:0;
  background:#fff;
  color:var(--bags-muted);
  font-size:9px;
  font-weight:600;
  line-height:1.1;
  cursor:pointer;
  border-top:3px solid transparent;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:2px;
  padding:5px 2px 4px;
  min-width:0;
}
.lgs-editor.bags-parity-editor .bags-bottom-nav-icon{
  display:grid;
  place-items:center;
  width:22px;
  height:22px;
  flex-shrink:0;
}
.lgs-editor.bags-parity-editor .bags-bottom-nav-icon svg{width:20px;height:20px}
.lgs-editor.bags-parity-editor .bags-bottom-nav-label{
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  letter-spacing:-.01em;
}
.lgs-editor.bags-parity-editor .bags-bottom-nav-btn.active{color:var(--bags-primary);border-top-color:var(--bags-primary);background:#f8f9fa}
.lgs-editor.bags-parity-editor .bags-bottom-nav-btn.active .bags-bottom-nav-icon{color:var(--bags-primary)}

.lgs-editor.bags-parity-editor .bags-parity-drawer-backdrop{
  position:fixed;inset:0;background:rgba(0,0,0,.25);border:0;z-index:14;cursor:pointer
}
.lgs-editor.bags-parity-editor .bags-parity-drawer{
  position:fixed;
  bottom:var(--bags-bottom-h);
  width:min(360px,100vw);
  max-height:min(70vh,520px);
  background:#fff;
  border-top:1px solid var(--bags-border);
  box-shadow:0 -4px 16px rgba(0,0,0,.08);
  z-index:15;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.lgs-editor.bags-parity-editor .bags-drawer-right{
  left:auto;
  right:0;
  border-right:0;
  border-left:1px solid var(--bags-border);
  box-shadow:-4px 0 16px rgba(0,0,0,.08);
}
.lgs-editor.bags-parity-editor .bags-settings-drawer{left:auto;right:0;border-right:0;border-left:1px solid var(--bags-border);box-shadow:-4px 0 16px rgba(0,0,0,.08)}
.lgs-editor.bags-parity-editor .bags-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--bags-border);flex-shrink:0}
.lgs-editor.bags-parity-editor .bags-drawer-head small{display:block;font-size:10px;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-drawer-head-actions{display:flex;gap:4px}
.lgs-editor.bags-parity-editor .bags-icon-btn{width:28px;height:28px;border:1px solid var(--bags-border);border-radius:3px;background:#fff;cursor:pointer}
.lgs-editor.bags-parity-editor .bags-drawer-body{padding:12px;overflow:auto;flex:1}
.lgs-editor.bags-parity-editor .bags-sheet-card{border:1px solid var(--bags-border);border-radius:4px;padding:10px;background:#fafafa}
.lgs-editor.bags-parity-editor .bags-sheet-card.active{border-color:var(--bags-primary)}
.lgs-editor.bags-parity-editor .bags-field{display:grid;gap:4px;font-size:11px;font-weight:600;color:var(--bags-muted);margin-bottom:8px}
.lgs-editor.bags-parity-editor .bags-field input{padding:8px;border:1px solid var(--bags-border);border-radius:3px;font:inherit;font-weight:400}
.lgs-editor.bags-parity-editor .bags-sheet-meta-line{display:flex;justify-content:space-between;font-size:12px;margin:0 0 6px}
.lgs-editor.bags-parity-editor .bags-sheet-card-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
.lgs-editor.bags-parity-editor .bags-drawer-links{display:grid;gap:6px;margin-top:12px}
.lgs-editor.bags-parity-editor .bags-link-btn{border:0;background:transparent;text-align:left;padding:8px 0;font-size:12px;font-weight:600;color:var(--bags-primary);cursor:pointer}
.lgs-editor.bags-parity-editor .bags-link-nest{color:var(--bags-nest)}
.lgs-editor.bags-parity-editor .bags-link-danger{color:var(--bags-danger)}

.lgs-editor.bags-parity-editor .bags-parity-modal-backdrop{
  position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:20;display:grid;place-items:center;padding:12px
}
.lgs-editor.bags-parity-editor .bags-parity-modal{
  width:min(720px,100%);
  max-height:min(88vh,720px);
  background:#fff;
  border-radius:4px;
  border:1px solid var(--bags-border);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.lgs-editor.bags-parity-editor .bags-modal-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--bags-border)}
.lgs-editor.bags-parity-editor .bags-modal-head h2{margin:0;font-size:15px}
.lgs-editor.bags-parity-editor .bags-modal-tabs{display:flex;border-bottom:1px solid var(--bags-border);padding:0 8px;gap:2px;flex-shrink:0}
.lgs-editor.bags-parity-editor .bags-modal-tab{border:0;background:transparent;padding:10px 12px;font-size:12px;font-weight:700;color:var(--bags-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.lgs-editor.bags-parity-editor .bags-modal-tab.active{color:var(--bags-primary);border-bottom-color:var(--bags-primary)}
.lgs-editor.bags-parity-editor .bags-modal-hint{margin:8px 12px 0;font-size:11px;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-modal-body{padding:12px;overflow:auto;flex:1;min-height:200px}
.lgs-editor.bags-parity-editor .bags-modal-connect,.lgs-editor.bags-parity-editor .bags-modal-empty{padding:24px;text-align:center;color:var(--bags-muted);font-size:12px}

.lgs-editor.bags-parity-editor .bags-settings-group{border:0;padding:0;margin:0 0 14px;display:grid;gap:6px}
.lgs-editor.bags-parity-editor .bags-settings-group legend{font-size:11px;font-weight:700;color:var(--bags-text);margin-bottom:4px}
.lgs-editor.bags-parity-editor .bags-check,.lgs-editor.bags-parity-editor .bags-radio{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--bags-text)}
.lgs-editor.bags-parity-editor .bags-dpi-legend{font-size:10px;color:var(--bags-muted);line-height:1.45;margin:0}

.lgs-editor.bags-parity-editor .bags-names-drawer .sidebar-form{padding:0}

.lgs-editor.bags-parity-editor .bags-settings-modal{width:min(480px,100%)}
.lgs-editor.bags-parity-editor .bags-names-modal{width:min(520px,100%)}
.lgs-editor.bags-parity-editor .bags-names-modal .sidebar-form{display:grid;gap:10px}
.lgs-editor.bags-parity-editor .bags-names-form{display:grid;gap:12px}
.lgs-editor.bags-parity-editor .bags-names-lead{margin:0;font-size:12px;color:var(--bags-muted);line-height:1.45}
.lgs-editor.bags-parity-editor .bags-names-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.lgs-editor.bags-parity-editor .bags-names-meta{margin:0;font-size:11px;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-names-generate{justify-self:start}
.lgs-editor.bags-parity-editor .bags-names-csv-actions{display:flex;gap:8px;margin-bottom:8px}
.lgs-editor.bags-parity-editor .bags-names-presets{display:flex;flex-wrap:wrap;gap:6px}
.lgs-editor.bags-parity-editor .bags-chip{border:1px solid var(--bags-border);background:#fff;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer}
.lgs-editor.bags-parity-editor .bags-chip:hover{background:#f1f3f4}

.lgs-editor.bags-parity-editor .canvas-stage{position:relative;margin-left:24px;padding-top:4px;min-height:0}
.lgs-editor.bags-parity-editor .piece{pointer-events:auto;touch-action:none}
.lgs-editor.bags-parity-editor .piece.selected{
  outline:2px solid var(--bags-primary);
  outline-offset:2px;
  z-index:8;
}
.lgs-editor.bags-parity-editor .piece.selected em{display:block}
.lgs-editor.bags-parity-editor .piece .dpi-badge{
  display:none;position:absolute;top:-18px;right:0;background:#111827;color:#fff;
  font-size:9px;font-style:normal;font-weight:700;padding:2px 5px;border-radius:3px;white-space:nowrap
}
.lgs-editor.bags-parity-editor .piece.selected .dpi-badge{display:block}
.lgs-editor.bags-parity-editor .bags-visual-aid-custom{align-items:center;gap:8px}
.lgs-editor.bags-parity-editor .bags-visual-aid-color{width:32px;height:28px;padding:0;border:1px solid var(--bags-border);border-radius:3px;background:#fff}

.lgs-editor.bags-parity-editor .bags-design-picker-modal{width:min(640px,100%)}
.lgs-editor.bags-parity-editor .bags-design-picker-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.lgs-editor.bags-parity-editor .bags-design-picker-row{
  width:100%;display:grid;grid-template-columns:56px 1fr;gap:10px;align-items:center;text-align:left;
  border:1px solid var(--bags-border);border-radius:4px;padding:8px;background:#fff;cursor:pointer
}
.lgs-editor.bags-parity-editor .bags-design-picker-row:hover{border-color:var(--bags-primary);background:#f8f9fa}
.lgs-editor.bags-parity-editor .bags-design-picker-thumb{width:56px;height:56px;border-radius:4px;overflow:hidden;display:grid;place-items:center}
.lgs-editor.bags-parity-editor .bags-design-picker-thumb img{width:100%;height:100%;object-fit:contain}
.lgs-editor.bags-parity-editor .bags-design-picker-thumb-empty{background:#e8eaed;font-size:11px;font-weight:700;color:var(--bags-muted)}
.lgs-editor.bags-parity-editor .bags-design-picker-copy strong,.lgs-editor.bags-parity-editor .bags-design-picker-copy small{display:block;line-height:1.35}
.lgs-editor.bags-parity-editor .bags-design-picker-copy small{font-size:11px;color:var(--bags-muted)}

.bags-welcome-center{min-height:100vh;background:var(--bags-workspace,#e8eaed);color:var(--bags-text,#202124);font:13px/1.35 Inter,system-ui,sans-serif}
.bags-welcome-center .bags-welcome-shell{max-width:920px;margin:0 auto;padding:20px 16px 32px}
.bags-welcome-center .bags-welcome-top{padding:8px 0 16px}
.bags-welcome-center .bags-welcome-brand{display:flex;align-items:center;gap:10px}
.bags-welcome-center .bags-welcome-logo{width:40px;height:40px;border-radius:8px;display:grid;place-items:center;background:var(--bags-primary,#1a73e8);color:#fff;font-weight:800}
.bags-welcome-center .bags-welcome-brand strong,.bags-welcome-center .bags-welcome-brand small{display:block;line-height:1.25}
.bags-welcome-center .bags-welcome-brand small{font-size:11px;color:var(--bags-muted,#5f6368)}
.bags-welcome-center .bags-welcome-card{background:#fff;border:1px solid var(--bags-border,#dadce0);border-radius:8px;padding:24px 28px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.bags-welcome-center .bags-welcome-card h1{margin:0 0 8px;font-size:22px;text-align:center}
.bags-welcome-center .bags-welcome-lead{margin:0 0 18px;text-align:center;color:var(--bags-muted,#5f6368);font-size:13px;line-height:1.5}
.bags-welcome-center .bags-welcome-sheet-row{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;margin-bottom:18px;padding:12px;background:#f8f9fa;border-radius:6px;border:1px solid var(--bags-border,#dadce0)}
.bags-welcome-center .bags-welcome-sheet-row label{display:grid;gap:4px;font-size:11px;font-weight:600;color:var(--bags-muted,#5f6368)}
.bags-welcome-center .bags-welcome-sheet-row select{padding:8px;border:1px solid var(--bags-border,#dadce0);border-radius:4px;background:#fff;font:inherit}
.bags-welcome-center .bags-welcome-price{text-align:right;font-size:11px;color:var(--bags-muted,#5f6368)}
.bags-welcome-center .bags-welcome-price strong{display:block;font-size:16px;color:var(--bags-text,#202124)}
.bags-welcome-center .bags-welcome-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.bags-welcome-center .bags-welcome-action{
  display:grid;grid-template-columns:44px 1fr;gap:10px;align-items:start;text-align:left;
  border:1px solid var(--bags-border,#dadce0);border-radius:6px;padding:14px;background:#fff;cursor:pointer;color:inherit;text-decoration:none
}
.bags-welcome-center .bags-welcome-action:hover:not(.disabled){border-color:var(--bags-primary,#1a73e8);background:#f8f9fa}
.bags-welcome-center .bags-welcome-action.featured{border-color:var(--bags-primary,#1a73e8);background:#e8f0fe}
.bags-welcome-center .bags-welcome-action.disabled{opacity:.55;cursor:not-allowed}
.bags-welcome-center .bags-welcome-action strong{font-size:14px;grid-column:2}
.bags-welcome-center .bags-welcome-action span{font-size:12px;color:var(--bags-muted,#5f6368);grid-column:2;line-height:1.4}
.bags-welcome-center .bags-welcome-action-icon{grid-row:span 2;display:grid;place-items:center;width:44px;height:44px;border-radius:8px;background:#e8f0fe;color:var(--bags-primary,#1a73e8)}
@media(max-width:720px){
  .bags-welcome-center .bags-welcome-actions{grid-template-columns:1fr}
  .bags-welcome-center .bags-welcome-sheet-row{grid-template-columns:1fr}
  .lgs-editor.bags-parity-editor .bags-names-grid{grid-template-columns:1fr}
}
.lgs-editor.bags-parity-editor .tip.toast{display:none}

@media(max-width:1280px){
  .lgs-editor.bags-parity-editor .bags-parity-header{padding:0 6px;gap:6px}
  .lgs-editor.bags-parity-editor .bags-btn{padding:0 8px;font-size:10px}
  .lgs-editor.bags-parity-editor .bags-parity-header-actions{gap:3px}
  .lgs-editor.bags-parity-editor .bags-parity-account-text strong{font-size:11px}
  .lgs-editor.bags-parity-editor .bags-parity-account-text small{display:none}
  .lgs-editor.bags-parity-editor .bags-quality-legend{width:118px;padding:8px 6px;font-size:9px}
}

@media(max-width:1024px){
  .lgs-editor.bags-parity-editor{
    --bags-panel-w:240px;
    --bags-props-w:220px;
  }
  .lgs-editor.bags-parity-editor .bags-quality-legend{width:96px;padding:6px 4px;font-size:8px}
  .lgs-editor.bags-parity-editor .bags-parity-selection-bar{padding:2px 4px;gap:4px;min-height:36px}
  .lgs-editor.bags-parity-editor .bags-sel-field input{width:48px;height:26px;font-size:10px}
  .lgs-editor.bags-parity-editor .bags-tool-btn{width:28px;height:28px;font-size:12px}
  .lgs-editor.bags-parity-editor .workspace.bags-parity-workspace.has-side-panel.has-properties{
    grid-template-columns:var(--bags-rail-w) minmax(0,1fr) var(--bags-props-w,220px);
  }
  .lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar.open{
    width:min(var(--bags-panel-w),36vw);
    min-width:min(var(--bags-panel-w),36vw);
  }
}

@media(max-width:768px){
  .lgs-editor.bags-parity-editor .bags-parity-left-rail{display:none}
  .lgs-editor.bags-parity-editor .workspace.bags-parity-workspace,
  .lgs-editor.bags-parity-editor .workspace.bags-parity-workspace.has-side-panel,
  .lgs-editor.bags-parity-editor .workspace.bags-parity-workspace.has-properties,
  .lgs-editor.bags-parity-editor .workspace.bags-parity-workspace.has-side-panel.has-properties{
    grid-template-columns:minmax(0,1fr);
  }
  .lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar.open{display:none}
  .lgs-editor.bags-parity-editor .sidebar-panel.bags-parity-sidebar.mobile-open{
    display:flex!important;position:fixed;left:0;top:calc(var(--bags-header-h) + var(--bags-toolbar-h));
    bottom:var(--bags-bottom-h);width:min(var(--bags-panel-w),88vw);z-index:15;
    box-shadow:4px 0 16px rgba(0,0,0,.12)
  }
  .lgs-editor.bags-parity-editor .properties.bags-parity-properties.open{display:none!important}
  .lgs-editor.bags-parity-editor .properties.bags-parity-properties.mobile-open{
    display:flex!important;position:fixed;right:0;top:calc(var(--bags-header-h) + var(--bags-toolbar-h));
    bottom:var(--bags-bottom-h);width:min(var(--bags-props-w,260px),88vw);z-index:15;
    box-shadow:-4px 0 16px rgba(0,0,0,.12)
  }
  .lgs-editor.bags-parity-editor .bags-parity-header-actions .bags-btn-secondary{display:none}
  .lgs-editor.bags-parity-editor .bags-parity-account-text{display:none}
  .lgs-editor.bags-parity-editor .bags-quality-legend{display:none}
  .lgs-editor.bags-parity-editor .bags-canvas-row{grid-template-columns:minmax(0,1fr)}
}
@media(min-width:769px){
  .lgs-editor.bags-parity-editor .bags-parity-bottom-nav{display:none!important}
  .lgs-editor.bags-parity-editor .mobile-drawer-close{display:none}
}
`;
