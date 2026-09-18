/** Scoped Uploads/Gallery chrome. Quiet print-shop panel; gold only on primary actions. */

export const ARTWORK_LIBRARY_CSS = `
.lgs-artlib{
  --lgs-gold:#ffd45e;
  --lgs-gold-deep:#e89119;
  --lgs-ink:#0d1117;
  --lgs-panel:#161b22;
  --lgs-panel-2:#1c232c;
  --lgs-line:#2d3642;
  --lgs-muted:#8b949e;
  --lgs-text:#e6edf3;
  --lgs-soft:#f4f1e8;
  display:flex;
  flex-direction:column;
  flex:1;
  height:100%;
  min-height:0;
  overflow:hidden;
  background:var(--lgs-panel);
  color:var(--lgs-text);
}
.sidebar-panel:has(> .lgs-artlib){overflow:hidden;background:var(--lgs-panel,#161b22)}
.lgs-artlib-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  padding:12px 12px 10px;
  border-bottom:1px solid var(--lgs-line);
  background:var(--lgs-ink);
}
.lgs-artlib-head strong{display:block;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#fff}
.lgs-artlib-head small{display:block;margin-top:2px;font-size:11px;color:var(--lgs-muted);text-transform:none;letter-spacing:0;font-weight:500}
.lgs-artlib-iconbtn{
  width:30px;height:30px;border:1px solid var(--lgs-line);background:var(--lgs-panel-2);color:var(--lgs-text);
  border-radius:6px;cursor:pointer;display:grid;place-items:center;padding:0;flex-shrink:0
}
.lgs-artlib-iconbtn:hover{border-color:var(--lgs-gold-deep);color:#fff}
.lgs-artlib-iconbtn .gs-icon,.lgs-artlib-iconbtn svg{width:14px;height:14px}
.lgs-artlib-tools{
  display:grid;
  grid-template-columns:1fr auto;
  gap:6px;
  padding:8px 12px;
}
.lgs-artlib-tools input[type=search],.lgs-artlib-tools select{
  width:100%;height:30px;padding:0 8px;border:1px solid var(--lgs-line);border-radius:6px;
  background:var(--lgs-ink);color:var(--lgs-text);font:inherit;font-size:12px
}
.lgs-artlib-tools select{min-width:92px}
.lgs-artlib-tools input[type=search]::placeholder{color:#6e7781}
.lgs-artlib-chips{
  display:flex;flex-wrap:wrap;gap:4px;padding:0 12px 8px
}
.lgs-artlib-chip{
  border:1px solid var(--lgs-line);background:transparent;color:var(--lgs-muted);
  border-radius:4px;padding:3px 8px;font-size:10px;font-weight:600;cursor:pointer;line-height:1.3
}
.lgs-artlib-chip:hover{color:#fff;border-color:#4b5563}
.lgs-artlib-chip.active{background:var(--lgs-gold);border-color:var(--lgs-gold);color:var(--lgs-ink)}
.lgs-artlib-lead{margin:0 12px 8px;font-size:11px;color:var(--lgs-muted);line-height:1.4}
.lgs-artlib-drop{
  margin:0 12px 8px;min-height:52px;border:1px dashed #3d4654;border-radius:6px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  text-align:center;color:var(--lgs-muted);cursor:pointer;padding:8px 10px;background:var(--lgs-panel-2)
}
.lgs-artlib-drop.roomy{min-height:96px}
.lgs-artlib-drop:hover,.lgs-artlib-drop.active{border-color:var(--lgs-gold);color:#fff;background:#1f1810}
.lgs-artlib-drop strong{font-size:12px;color:#fff;font-weight:700}
.lgs-artlib-drop small{font-size:10px;color:var(--lgs-muted)}
.lgs-artlib-status{margin:0 12px 8px;font-size:11px;color:var(--lgs-muted)}
.lgs-artlib-error{
  margin:0 12px 8px;padding:8px;border-radius:6px;background:#3b1515;color:#fecaca;font-size:11px;line-height:1.4
}
.lgs-artlib-error button{
  margin-left:6px;border:1px solid #fecaca;background:transparent;color:#fecaca;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px
}
.lgs-artlib-empty{
  margin:8px 12px 12px;padding:16px 12px;text-align:center;color:var(--lgs-muted);font-size:12px;line-height:1.45;
  border:1px solid var(--lgs-line);border-radius:6px;background:var(--lgs-panel-2)
}
.lgs-artlib-empty strong{display:block;color:#fff;margin-bottom:4px;font-size:13px}
.lgs-artlib-grid{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 12px 10px;
  flex:1;overflow:auto;min-height:0;align-content:start
}
.lgs-artlib-card{
  display:grid;gap:6px;padding:6px;background:var(--lgs-ink);border:1px solid var(--lgs-line);border-radius:8px;min-width:0
}
.lgs-artlib-card.on-sheet{border-color:var(--lgs-gold-deep);box-shadow:inset 0 0 0 1px var(--lgs-gold-deep)}
.lgs-artlib-thumb{
  position:relative;display:block;width:100%;padding:0;border:0;border-radius:5px;overflow:hidden;cursor:pointer;background:#0a0c10
}
.lgs-artlib-thumb img{
  width:100%;aspect-ratio:1;object-fit:contain;display:block;
  background-color:#fff;
  background-image:linear-gradient(45deg,#d7dbe2 25%,transparent 25%),linear-gradient(-45deg,#d7dbe2 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d7dbe2 75%),linear-gradient(-45deg,transparent 75%,#d7dbe2 75%);
  background-size:10px 10px;background-position:0 0,0 5px,5px -5px,-5px 0
}
.lgs-artlib-badges{
  position:absolute;left:4px;right:4px;bottom:4px;display:flex;flex-wrap:wrap;gap:3px;pointer-events:none
}
.lgs-artlib-badge{
  font-size:9px;font-weight:700;font-style:normal;line-height:1;padding:3px 5px;border-radius:3px;
  background:#0d1117cc;color:#fff;backdrop-filter:saturate(1.2)
}
.lgs-artlib-badge.dpi-excellent{color:#86efac}
.lgs-artlib-badge.dpi-good{color:#7dd3fc}
.lgs-artlib-badge.dpi-low{color:#fcd34d}
.lgs-artlib-badge.dpi-poor,.lgs-artlib-badge.dpi-unknown{color:#fca5a5}
.lgs-artlib-badge.on-sheet{background:var(--lgs-gold);color:var(--lgs-ink)}
.lgs-artlib-name{
  font-size:11px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2
}
.lgs-artlib-meta{display:flex;flex-wrap:wrap;gap:4px 8px;font-size:10px;color:var(--lgs-muted);line-height:1.2}
.lgs-artlib-meta b{color:var(--lgs-soft);font-weight:600}
.lgs-artlib-addrow{display:grid;grid-template-columns:auto 1fr;gap:4px;align-items:stretch}
.lgs-artlib-qty{
  display:grid;grid-template-columns:22px 26px 22px;align-items:center;border:1px solid var(--lgs-line);border-radius:5px;overflow:hidden;background:var(--lgs-panel-2)
}
.lgs-artlib-qty button{
  border:0;background:transparent;color:var(--lgs-text);height:28px;cursor:pointer;padding:0;font-size:13px;line-height:1
}
.lgs-artlib-qty button:hover{background:#2a3340}
.lgs-artlib-qty input{
  width:100%;border:0;background:transparent;color:#fff;text-align:center;font:inherit;font-size:11px;font-weight:700;padding:0;min-width:0;height:28px
}
.lgs-artlib-add{
  border:0;border-radius:5px;background:var(--lgs-gold);color:var(--lgs-ink);
  font-size:10px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;cursor:pointer;padding:0 6px;line-height:1.1
}
.lgs-artlib-add:hover:not(:disabled){background:#ffe28a}
.lgs-artlib-add:disabled{opacity:.45;cursor:not-allowed}
.lgs-artlib-toolsrow{display:flex;gap:4px;align-items:center}
.lgs-artlib-toolsrow input[type=text]{
  flex:1;min-width:0;height:24px;padding:0 6px;border:1px solid var(--lgs-line);border-radius:4px;
  background:var(--lgs-panel-2);color:var(--lgs-text);font:inherit;font-size:10px
}
.lgs-artlib-toolsrow button{
  height:24px;min-width:28px;padding:0 6px;border:1px solid var(--lgs-line);background:var(--lgs-panel-2);
  color:var(--lgs-muted);border-radius:4px;cursor:pointer;font-size:9px;font-weight:700
}
.lgs-artlib-toolsrow button:hover{color:#fff;border-color:#6e7781}
.lgs-artlib-toolsrow button.danger:hover{color:#fecaca;border-color:#f87171}
.lgs-artlib-page{
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:8px 12px 12px;margin-top:auto;border-top:1px solid var(--lgs-line);font-size:11px;color:var(--lgs-muted);
  flex-shrink:0;background:var(--lgs-ink)
}
.lgs-artlib-page span{white-space:nowrap}
.lgs-artlib-page button{
  height:26px;padding:0 10px;border:1px solid var(--lgs-line);background:var(--lgs-panel-2);color:var(--lgs-text);
  border-radius:5px;cursor:pointer;font-size:11px;font-weight:600
}
.lgs-artlib-page button:disabled{opacity:.35;cursor:not-allowed}
.lgs-artlib-page button:hover:not(:disabled){border-color:var(--lgs-gold-deep);color:#fff}
`;
