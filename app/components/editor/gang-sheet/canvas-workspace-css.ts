/**
 * Canvas workspace chrome — print-production surround.
 * Scoped under .canvas-main so shell / inspector / uploads styles stay untouched.
 * Brand gold (#ffd45e / #e89119) and ink (#0d1117) from existing Legends marks.
 */
export const CANVAS_WORKSPACE_CSS = `
.lgs-editor.gs-editor-v2 .canvas-main{
  --gs-canvas-gold:#e89119;
  --gs-canvas-gold-bright:#ffd45e;
  --gs-canvas-ink:#0d1117;
  --gs-canvas-surround:#14181e;
  --gs-canvas-ruler:#1b2129;
  --gs-canvas-ruler-line:#2d343e;
  --gs-canvas-muted:#8b939e;
  --gs-canvas-text:#e8eaed;
  --gs-canvas-panel:#1f252e;
  --gs-ruler-size:22px;
  --gs-meta-h:32px;
  --gs-tabs-h:28px;
  display:flex;
  flex-direction:column;
  min-width:0;
  overflow:hidden;
  background:var(--gs-canvas-surround);
  color:var(--gs-canvas-text);
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-meta{
  height:var(--gs-meta-h);
  min-height:var(--gs-meta-h);
  background:var(--gs-canvas-ink);
  border-bottom:1px solid var(--gs-canvas-ruler-line);
  color:var(--gs-canvas-muted);
  display:flex;
  align-items:center;
  gap:10px;
  padding:0 10px 0 12px;
  font-size:11px;
  letter-spacing:.01em;
  flex:0 0 var(--gs-meta-h);
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-meta strong{
  color:var(--gs-canvas-text);
  font-size:12px;
  font-variant-numeric:tabular-nums;
  font-weight:700;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-meta-readout{
  display:flex;
  align-items:center;
  gap:8px;
  min-width:0;
  flex:1;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-meta-sep{
  width:1px;
  height:14px;
  background:#2d343e;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-meta-stat{
  white-space:nowrap;
  font-variant-numeric:tabular-nums;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-meta-selected{
  color:var(--gs-canvas-gold-bright);
  font-weight:700;
  white-space:nowrap;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-meta .toggle-row.inline{
  padding:0;
  color:var(--gs-canvas-muted);
  font-size:11px;
  gap:6px;
  flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-meta .toggle-row.inline input{
  accent-color:var(--gs-canvas-gold);
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-zoom{
  display:flex;
  align-items:stretch;
  border:1px solid #2d343e;
  background:#12161c;
  overflow:hidden;
  flex-shrink:0;
  height:24px;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-zoom button{
  border:0;
  background:transparent;
  color:#c5cbd3;
  padding:0 7px;
  cursor:pointer;
  font-size:11px;
  font-weight:700;
  line-height:24px;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-zoom button:hover{
  background:#252b34;
  color:#fff;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-zoom .gs-icon svg{
  width:14px;
  height:14px;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-zoom-label{
  min-width:52px;
  text-align:center;
  font-size:11px;
  font-weight:700;
  font-variant-numeric:tabular-nums;
  color:var(--gs-canvas-text);
  border-inline:1px solid #2d343e;
  line-height:22px;
  padding:0 6px;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-zoom-fit{
  border-left:1px solid #2d343e;
  font-size:10px;
  letter-spacing:.02em;
}
.lgs-editor.gs-editor-v2 .canvas-main .scroll{
  flex:1;
  min-height:0;
  height:auto;
  overflow:auto;
  padding:12px 16px 52px 8px;
  position:relative;
  background:
    linear-gradient(180deg,#12161c 0%,#14181e 48px,#14181e 100%);
}
.lgs-editor.gs-editor-v2 .canvas-main .scroll.pan-mode{cursor:grab}
.lgs-editor.gs-editor-v2 .canvas-main .scroll.pan-mode:active{cursor:grabbing}
.lgs-editor.gs-editor-v2 .canvas-main .ruler-corner{
  width:var(--gs-ruler-size);
  height:var(--gs-ruler-size);
  background:var(--gs-canvas-ruler);
  border-right:1px solid var(--gs-canvas-ruler-line);
  border-bottom:1px solid var(--gs-canvas-ruler-line);
  box-shadow:inset -1px -1px 0 #11161c;
}
.lgs-editor.gs-editor-v2 .canvas-main .ruler-h{
  height:var(--gs-ruler-size);
  margin-left:var(--gs-ruler-size);
  background:var(--gs-canvas-ruler);
  border-bottom:1px solid var(--gs-canvas-ruler-line);
  position:relative;
  overflow:hidden;
}
.lgs-editor.gs-editor-v2 .canvas-main .ruler-v{
  top:var(--gs-ruler-size);
  width:var(--gs-ruler-size);
  background:var(--gs-canvas-ruler);
  border-right:1px solid var(--gs-canvas-ruler-line);
}
.lgs-editor.gs-editor-v2 .canvas-main .ruler-h span,
.lgs-editor.gs-editor-v2 .canvas-main .ruler-v span{
  font-size:9px;
  font-weight:600;
  font-variant-numeric:tabular-nums;
  color:#9aa3ad;
  letter-spacing:0;
}
.lgs-editor.gs-editor-v2 .canvas-main .ruler-h span{
  top:50%;
  transform:translate(-50%,-50%);
}
.lgs-editor.gs-editor-v2 .canvas-main .ruler-h span::before,
.lgs-editor.gs-editor-v2 .canvas-main .ruler-v span::before{
  content:"";
  position:absolute;
  background:#5c6570;
}
.lgs-editor.gs-editor-v2 .canvas-main .ruler-h span::before{
  left:50%;
  bottom:0;
  width:1px;
  height:6px;
  transform:translateX(-50%);
}
.lgs-editor.gs-editor-v2 .canvas-main .ruler-v span::before{
  top:50%;
  right:0;
  width:6px;
  height:1px;
  transform:translateY(-50%);
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-stage{
  margin-left:var(--gs-ruler-size);
  padding-top:10px;
  position:relative;
}
.lgs-editor.gs-editor-v2 .canvas-main .sheet{
  position:relative;
  margin:auto;
  background-color:#fff;
  border-radius:0;
  box-shadow:
    0 0 0 1px #2a313a,
    0 0 0 2px #0d1117,
    0 18px 36px rgba(0,0,0,.38);
  min-height:300px;
}
.lgs-editor.gs-editor-v2 .canvas-main .sheet.grid-on{
  background-image:linear-gradient(#f4f5f7 1px,transparent 1px),linear-gradient(90deg,#f4f5f7 1px,transparent 1px);
  background-size:20px 20px;
}
.lgs-editor.gs-editor-v2 .canvas-main .sheet.grid-off{background-image:none}
.lgs-editor.gs-editor-v2 .canvas-main .sheet>i{
  inset:5px;
  border:1px dashed #c45c5c;
}
.lgs-editor.gs-editor-v2 .canvas-main .piece.selected{
  outline:1.5px solid var(--gs-canvas-gold);
  outline-offset:1px;
}
.lgs-editor.gs-editor-v2 .canvas-main .piece.selected.multi{
  outline-color:var(--gs-canvas-gold-bright);
  box-shadow:0 0 0 1px rgba(13,17,23,.35);
}
.lgs-editor.gs-editor-v2 .canvas-main .piece.selected em{
  background:var(--gs-canvas-ink);
  color:var(--gs-canvas-gold-bright);
  border:1px solid #2d343e;
  font-weight:700;
  letter-spacing:.02em;
  padding:2px 5px;
}
.lgs-editor.gs-editor-v2 .canvas-main .resize-handle{
  width:12px;
  height:12px;
  border:1.5px solid var(--gs-canvas-ink);
  background:var(--gs-canvas-gold-bright);
  border-radius:1px;
  box-shadow:0 0 0 1px rgba(232,145,25,.35);
}
.lgs-editor.gs-editor-v2 .canvas-main .resize-handle:focus-visible{
  outline:2px solid var(--gs-canvas-gold);
  outline-offset:1px;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-select-bounds{
  position:absolute;
  border:1px dashed var(--gs-canvas-gold);
  background:rgba(232,145,25,.04);
  pointer-events:none;
  z-index:2;
}
.lgs-editor.gs-editor-v2 .canvas-main .snap-guide{
  background:var(--gs-canvas-gold-bright);
  opacity:.9;
}
.lgs-editor.gs-editor-v2 .canvas-main .empty,
.lgs-editor.gs-editor-v2 .canvas-main .canvas-empty{
  color:#6b7380;
  gap:8px;
  padding:24px 20px;
  pointer-events:none;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-empty strong{
  color:#344054;
  font-size:14px;
  font-weight:700;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-empty small{
  max-width:280px;
  line-height:1.45;
  font-size:12px;
  color:#667085;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-empty-icon{
  width:36px;
  height:36px;
  border:1px solid #d0d5dd;
  background:#f8fafc;
  color:#e89119;
  display:grid;
  place-items:center;
  font-size:18px;
  font-weight:700;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-empty-actions{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  justify-content:center;
  pointer-events:auto;
  margin-top:4px;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-empty-actions button{
  border:1px solid #d0d5dd;
  background:#fff;
  color:#111827;
  border-radius:4px;
  padding:6px 10px;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-empty-actions button:hover{
  border-color:var(--gs-canvas-gold);
  color:#111;
}
.lgs-editor.gs-editor-v2 .canvas-main .canvas-empty-actions button.primary{
  background:var(--gs-canvas-ink);
  border-color:var(--gs-canvas-ink);
  color:#ffd45e;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar{
  position:absolute;
  top:4px;
  left:50%;
  transform:translateX(-50%);
  z-index:6;
  display:flex;
  align-items:center;
  gap:0;
  width:max-content;
  max-width:calc(100% - 16px);
  margin:0;
  background:#1f252e;
  border:1px solid #2d343e;
  box-shadow:0 4px 16px rgba(0,0,0,.28);
  color:#d5dae0;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar .canvas-align-group{
  display:flex;
  align-items:center;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar .canvas-align-group + .canvas-align-group{
  border-left:1px solid #2d343e;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar .canvas-align-label{
  font-size:9px;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:#8b939e;
  padding:0 8px 0 10px;
  white-space:nowrap;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar button{
  border:0;
  background:transparent;
  color:#d5dae0;
  width:30px;
  height:28px;
  padding:0;
  cursor:pointer;
  display:grid;
  place-items:center;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar button:hover:not(:disabled){
  background:#2a313a;
  color:#ffd45e;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar button:disabled{
  opacity:.32;
  color:#6b7380;
  cursor:not-allowed;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar .canvas-align-text{
  width:auto;
  padding:0 9px;
  font-size:10px;
  font-weight:700;
  letter-spacing:.02em;
}
.lgs-editor.gs-editor-v2 .canvas-align-bar svg{
  width:14px;
  height:14px;
  display:block;
}
.lgs-editor.gs-editor-v2 .canvas-sheet-tabs{
  flex:0 0 var(--gs-tabs-h);
  height:var(--gs-tabs-h);
  display:flex;
  align-items:stretch;
  gap:0;
  overflow:auto;
  background:#0f1318;
  border-top:1px solid #2d343e;
  padding:0 6px;
}
.lgs-editor.gs-editor-v2 .canvas-sheet-tabs button{
  border:0;
  border-right:1px solid #2d343e;
  background:transparent;
  color:#8b939e;
  font-size:11px;
  font-weight:600;
  font-variant-numeric:tabular-nums;
  padding:0 12px;
  cursor:pointer;
  white-space:nowrap;
}
.lgs-editor.gs-editor-v2 .canvas-sheet-tabs button:hover{
  color:#e8eaed;
  background:#1a2028;
}
.lgs-editor.gs-editor-v2 .canvas-sheet-tabs button.active{
  color:#111;
  background:var(--gs-canvas-gold-bright);
  font-weight:800;
}
.lgs-editor.gs-editor-v2 .canvas-sheet-tabs button.active:hover{
  color:#111;
  background:#ffd45e;
}
.lgs-editor.gs-editor-v2 .canvas-main .gs-minimap{
  right:8px;
  top:8px;
  width:52px;
  gap:4px;
}
.lgs-editor.gs-editor-v2 .canvas-main .gs-minimap-sheet{
  height:110px;
  border:1px solid #3a424e;
  border-radius:0;
  background:#0f1318;
}
.lgs-editor.gs-editor-v2 .canvas-main .gs-minimap-viewport{
  border:1px solid var(--gs-canvas-gold);
  border-radius:0;
  background:rgba(232,145,25,.18);
}
.lgs-editor.gs-editor-v2 .canvas-main .gs-minimap-reset{
  border:1px solid #3a424e;
  background:#1b2129;
  color:#c5cbd3;
  border-radius:3px;
  font-size:9px;
  font-weight:700;
  letter-spacing:.04em;
  text-transform:uppercase;
}
.lgs-editor.gs-editor-v2 .properties .align-row{
  padding:8px 14px 10px;
  gap:4px;
  background:#f8fafc;
  border-top:1px solid #e4e7ec;
  border-bottom:1px solid #e4e7ec;
  margin:0 0 8px;
}
.lgs-editor.gs-editor-v2 .properties .align-row>span{
  font-size:10px;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:#667085;
  margin-bottom:2px;
}
.lgs-editor.gs-editor-v2 .properties .align-row button{
  border:1px solid #d0d5dd;
  background:#fff;
  border-radius:3px;
  padding:5px 8px;
  font-size:11px;
  min-width:28px;
}
.lgs-editor.gs-editor-v2 .properties .align-row button:hover{
  border-color:#e89119;
  color:#111;
}
@media(max-width:900px){
  .lgs-editor.gs-editor-v2 .canvas-main .canvas-meta{
    height:auto;
    min-height:var(--gs-meta-h);
    flex-wrap:wrap;
    gap:6px;
    padding:6px 8px;
    flex-basis:auto;
  }
  .lgs-editor.gs-editor-v2 .canvas-main .canvas-zoom{height:22px}
  .lgs-editor.gs-editor-v2 .canvas-align-bar{max-width:100%}
  .lgs-editor.gs-editor-v2 .canvas-sheet-tabs{overflow:auto}
}
@media(min-width:768px) and (max-width:900px){
  .lgs-editor.gs-editor-v2 .canvas-main .canvas-zoom{height:28px;min-height:40px}
  .lgs-editor.gs-editor-v2 .canvas-sheet-tabs button{min-height:40px;padding:0 12px}
}
`;
