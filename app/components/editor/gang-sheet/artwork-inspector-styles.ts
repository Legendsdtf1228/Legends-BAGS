/** Selected-artwork inspector — compact print-production panel. Scoped to `.gs-art-panel`. */
export const ARTWORK_INSPECTOR_CSS = `
.lgs-editor.gs-editor-v2 aside.properties.gs-art-panel{
  --gs-art-ink:#0d1117;
  --gs-art-panel:#171c24;
  --gs-art-surface:#1e252f;
  --gs-art-surface-2:#252d38;
  --gs-art-line:#2c3542;
  --gs-art-line-strong:#3d4a5c;
  --gs-art-text:#e8eaed;
  --gs-art-muted:#8b95a5;
  --gs-art-gold:#ffd45e;
  --gs-art-gold-deep:#e89119;
  --gs-art-danger:#f0a8a8;
  --gs-art-danger-bg:#3a1f22;
  --gs-art-warn:#f5c16c;
  --gs-art-warn-bg:#3a2d18;
  --gs-art-ok:#7dcea0;
  background:var(--gs-art-panel);
  color:var(--gs-art-text);
  border-left:1px solid #0b0e13;
  display:flex;
  flex-direction:column;
  min-height:0;
}
.lgs-editor.gs-editor-v2 .gs-art-panel .mobile-drawer-close{
  background:var(--gs-art-surface);
  border-color:var(--gs-art-line-strong);
  color:var(--gs-art-text);
}
.lgs-editor.gs-editor-v2 .gs-art-head{
  flex-shrink:0;
  padding:12px 14px 10px;
  border-bottom:1px solid var(--gs-art-line);
  box-shadow:inset 0 2px 0 var(--gs-art-gold);
}
.lgs-editor.gs-editor-v2 .gs-art-head strong{
  display:block;
  font-size:11px;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:var(--gs-art-gold);
  font-weight:800;
}
.lgs-editor.gs-editor-v2 .gs-art-head small{
  display:block;
  margin-top:3px;
  font-size:11px;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-scroll{
  flex:1;
  min-height:0;
  overflow:auto;
}
.lgs-editor.gs-editor-v2 .gs-art-preview{
  margin:12px 12px 0;
  padding:8px;
  background:var(--gs-art-ink);
  border:1px solid var(--gs-art-line);
  border-radius:8px;
}
.lgs-editor.gs-editor-v2 .gs-art-preview-frame{
  display:grid;
  place-items:center;
  min-height:108px;
  max-height:140px;
  overflow:hidden;
  border-radius:4px;
}
.lgs-editor.gs-editor-v2 .gs-art-preview-frame img{
  max-width:100%;
  max-height:132px;
  width:auto;
  height:auto;
  object-fit:contain;
  display:block;
}
.lgs-editor.gs-editor-v2 .gs-art-preview-stack{
  position:relative;
  display:grid;
  place-items:center;
  max-width:100%;
}
.lgs-editor.gs-editor-v2 .gs-art-preview-stack img{position:relative;z-index:0}
.lgs-editor.gs-editor-v2 .gs-art-overlay,
.lgs-editor.gs-editor-v2 .gs-art-halftone{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:1;
}
.lgs-editor.gs-editor-v2 .gs-art-overlay{mix-blend-mode:multiply}
.lgs-editor.gs-editor-v2 .gs-art-halftone{
  background-image:radial-gradient(#111 0.45px, transparent 0.55px);
  mix-blend-mode:multiply;
  opacity:.5;
}
.lgs-editor.gs-editor-v2 .gs-art-preview-note{
  margin:6px 2px 0;
  font-size:10px;
  color:var(--gs-art-gold);
  line-height:1.35;
}
.lgs-editor.gs-editor-v2 .gs-art-color{
  width:100%;
  height:34px;
  padding:2px;
  border:1px solid var(--gs-art-line-strong);
  border-radius:6px;
  background:var(--gs-art-ink);
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-art-text-preview{
  display:grid;
  place-items:center;
  min-height:80px;
  padding:12px;
  font-size:20px;
  font-weight:700;
  text-align:center;
  line-height:1.15;
  word-break:break-word;
}
.lgs-editor.gs-editor-v2 .gs-art-preview-meta{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap:8px;
  margin-top:8px;
  padding:0 2px;
}
.lgs-editor.gs-editor-v2 .gs-art-preview-meta strong{
  font-size:12px;
  font-weight:700;
  color:var(--gs-art-text);
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.lgs-editor.gs-editor-v2 .gs-art-preview-meta small{
  font-size:10px;
  color:var(--gs-art-muted);
  white-space:nowrap;
}
.lgs-editor.gs-editor-v2 .gs-art-dpi{
  margin:8px 12px 0;
  padding:8px 10px;
  border-radius:6px;
  background:var(--gs-art-surface);
  border:1px solid var(--gs-art-line);
  display:grid;
  gap:4px;
}
.lgs-editor.gs-editor-v2 .gs-art-dpi-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}
.lgs-editor.gs-editor-v2 .gs-art-dpi-kicker{
  font-size:10px;
  font-weight:700;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-dpi-badge{
  font-size:10px;
  font-weight:800;
  letter-spacing:.04em;
  text-transform:uppercase;
}
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-excellent{border-color:#1f6b45}
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-excellent .gs-art-dpi-badge{color:var(--gs-art-ok)}
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-good{border-color:#1d4e72}
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-good .gs-art-dpi-badge{color:#7eb6d9}
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-low,
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-poor,
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-unknown{
  background:var(--gs-art-warn-bg);
  border-color:#8a6914;
}
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-poor,
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-unknown{
  background:var(--gs-art-danger-bg);
  border-color:#7a3232;
}
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-low .gs-art-dpi-badge{color:var(--gs-art-warn)}
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-poor .gs-art-dpi-badge,
.lgs-editor.gs-editor-v2 .gs-art-dpi.tier-unknown .gs-art-dpi-badge{color:var(--gs-art-danger)}
.lgs-editor.gs-editor-v2 .gs-art-dpi-copy{
  margin:0;
  font-size:11px;
  line-height:1.4;
  color:var(--gs-art-text);
}
.lgs-editor.gs-editor-v2 .gs-art-dpi-meta{
  margin:0;
  font-size:10px;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-section{
  margin:12px 12px 0;
  padding:10px;
  background:var(--gs-art-surface);
  border:1px solid var(--gs-art-line);
  border-radius:8px;
}
.lgs-editor.gs-editor-v2 .gs-art-section-label{
  display:block;
  margin:0 0 8px;
  font-size:10px;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-size{
  display:grid;
  grid-template-columns:1fr 28px 1fr;
  gap:6px;
  align-items:end;
}
.lgs-editor.gs-editor-v2 .gs-art-num{
  display:grid;
  gap:4px;
  font-size:10px;
  font-weight:700;
  color:var(--gs-art-muted);
  letter-spacing:.04em;
  text-transform:uppercase;
}
.lgs-editor.gs-editor-v2 .gs-art-num-wrap{
  display:grid;
  grid-template-columns:1fr auto;
  align-items:center;
  background:var(--gs-art-ink);
  border:1px solid var(--gs-art-line-strong);
  border-radius:6px;
  overflow:hidden;
}
.lgs-editor.gs-editor-v2 .gs-art-num-wrap input{
  width:100%;
  min-width:0;
  border:0;
  background:transparent;
  color:var(--gs-art-text);
  padding:8px 8px;
  font:inherit;
  font-variant-numeric:tabular-nums;
  font-size:13px;
  font-weight:700;
}
.lgs-editor.gs-editor-v2 .gs-art-num-wrap input:disabled{opacity:.45}
.lgs-editor.gs-editor-v2 .gs-art-unit{
  padding:0 8px 0 0;
  font-size:10px;
  font-weight:700;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-lock{
  width:28px;
  height:34px;
  border:1px solid var(--gs-art-line-strong);
  background:var(--gs-art-ink);
  color:var(--gs-art-muted);
  border-radius:6px;
  cursor:pointer;
  font-size:14px;
  line-height:1;
  padding:0;
}
.lgs-editor.gs-editor-v2 .gs-art-lock[aria-pressed="true"]{
  background:#2a2416;
  border-color:var(--gs-art-gold-deep);
  color:var(--gs-art-gold);
}
.lgs-editor.gs-editor-v2 .gs-art-transform{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:6px;
}
.lgs-editor.gs-editor-v2 .gs-art-seg{
  display:grid;
  grid-template-columns:1fr 1fr;
  border:1px solid var(--gs-art-line-strong);
  border-radius:6px;
  overflow:hidden;
  background:var(--gs-art-ink);
}
.lgs-editor.gs-editor-v2 .gs-art-seg button{
  border:0;
  background:transparent;
  color:var(--gs-art-muted);
  padding:8px 4px;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-art-seg button + button{border-left:1px solid var(--gs-art-line)}
.lgs-editor.gs-editor-v2 .gs-art-seg button[aria-pressed="true"],
.lgs-editor.gs-editor-v2 .gs-art-tool[aria-pressed="true"]{
  background:#2a2416;
  color:var(--gs-art-gold);
}
.lgs-editor.gs-editor-v2 .gs-art-tool{
  border:1px solid var(--gs-art-line-strong);
  background:var(--gs-art-ink);
  color:var(--gs-art-text);
  border-radius:6px;
  padding:8px 6px;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-art-tool:hover,
.lgs-editor.gs-editor-v2 .gs-art-lock:hover,
.lgs-editor.gs-editor-v2 .gs-art-seg button:hover{
  border-color:var(--gs-art-gold-deep);
  color:var(--gs-art-text);
}
.lgs-editor.gs-editor-v2 .gs-art-primary{
  display:grid;
  grid-template-columns:1fr auto;
  gap:6px;
  margin:12px 12px 0;
}
.lgs-editor.gs-editor-v2 .gs-art-dup{
  border:0;
  background:var(--gs-art-gold);
  color:#111;
  border-radius:8px;
  padding:12px 10px;
  font-size:13px;
  font-weight:800;
  letter-spacing:.02em;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-art-dup:hover{background:#ffe08a}
.lgs-editor.gs-editor-v2 .gs-art-del{
  border:1px solid #7a3232;
  background:var(--gs-art-danger-bg);
  color:var(--gs-art-danger);
  border-radius:8px;
  padding:12px 14px;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-art-del:hover{background:#4a2428}
.lgs-editor.gs-editor-v2 .gs-art-advanced{
  margin:12px 12px 14px;
  border:1px solid var(--gs-art-line);
  border-radius:8px;
  background:var(--gs-art-surface);
}
.lgs-editor.gs-editor-v2 .gs-art-advanced > summary{
  list-style:none;
  cursor:pointer;
  padding:10px 12px;
  font-size:11px;
  font-weight:700;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:var(--gs-art-muted);
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.lgs-editor.gs-editor-v2 .gs-art-advanced > summary::-webkit-details-marker{display:none}
.lgs-editor.gs-editor-v2 .gs-art-advanced > summary::after{
  content:"▸";
  color:var(--gs-art-gold);
  font-size:11px;
}
.lgs-editor.gs-editor-v2 .gs-art-advanced[open] > summary::after{content:"▾"}
.lgs-editor.gs-editor-v2 .gs-art-advanced-body{
  padding:0 10px 12px;
  display:grid;
  gap:10px;
  border-top:1px solid var(--gs-art-line);
}
.lgs-editor.gs-editor-v2 .gs-art-sublabel{
  display:block;
  margin:10px 0 6px;
  font-size:10px;
  font-weight:700;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-grid-2{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:6px;
}
.lgs-editor.gs-editor-v2 .gs-art-grid-3{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:6px;
}
.lgs-editor.gs-editor-v2 .gs-art-check{
  display:flex;
  align-items:center;
  gap:8px;
  margin:0;
  font-size:11px;
  color:var(--gs-art-text);
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-art-check input{accent-color:var(--gs-art-gold-deep)}
.lgs-editor.gs-editor-v2 .gs-art-apply{
  width:100%;
  border:0;
  background:var(--gs-art-gold);
  color:#111;
  border-radius:7px;
  padding:10px 8px;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-art-apply:hover{background:#ffe08a}
.lgs-editor.gs-editor-v2 .gs-art-hint{
  margin:6px 0 0;
  font-size:10px;
  line-height:1.4;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-range{
  display:grid;
  grid-template-columns:1fr auto;
  gap:4px;
  font-size:11px;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-range input{
  display:block;
  grid-column:1/-1;
  width:100%;
  accent-color:var(--gs-art-gold-deep);
}
.lgs-editor.gs-editor-v2 .gs-art-empty{
  padding:36px 20px;
  text-align:center;
  color:var(--gs-art-muted);
}
.lgs-editor.gs-editor-v2 .gs-art-empty b{
  display:block;
  font-size:22px;
  color:var(--gs-art-gold);
  margin-bottom:8px;
}
.lgs-editor.gs-editor-v2 .gs-art-empty p{
  margin:0;
  font-size:12px;
  line-height:1.45;
}
.lgs-editor.gs-editor-v2 .gs-art-sheet{
  flex-shrink:0;
  margin:0;
  padding:10px 14px 14px;
  border-top:1px solid var(--gs-art-line);
  background:var(--gs-art-ink);
}
.lgs-editor.gs-editor-v2 .gs-art-sheet p{
  display:flex;
  justify-content:space-between;
  margin:0;
  padding:4px 0;
  color:var(--gs-art-muted);
  font-size:11px;
}
.lgs-editor.gs-editor-v2 .gs-art-sheet strong{color:var(--gs-art-text);font-variant-numeric:tabular-nums}
.lgs-editor.gs-editor-v2 .gs-art-sheet .total{
  border-top:1px solid var(--gs-art-line);
  margin-top:6px;
  padding-top:8px;
  font-size:12px;
}
.lgs-editor.gs-editor-v2 .gs-art-sheet .total strong{
  font-size:16px;
  color:var(--gs-art-gold);
}
.lgs-editor.gs-editor-v2 .gs-art-ghost{
  width:100%;
  border:1px solid var(--gs-art-line-strong);
  background:transparent;
  color:var(--gs-art-text);
  border-radius:6px;
  padding:8px 8px;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .gs-art-ghost:hover{border-color:var(--gs-art-gold-deep)}
.lgs-editor.gs-editor-v2 .gs-art-panel button:focus-visible,
.lgs-editor.gs-editor-v2 .gs-art-panel input:focus-visible,
.lgs-editor.gs-editor-v2 .gs-art-panel summary:focus-visible{
  outline:2px solid var(--gs-art-gold);
  outline-offset:2px;
}
`;
