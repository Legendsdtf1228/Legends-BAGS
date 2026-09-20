/** Production-workflow chrome for Auto Build, Auto Fill, Names & Numbers, Images by Size. */

export const PRODUCTION_WORKFLOW_CSS = `
.prod-wf{
  --prod-gold:#e89119;
  --prod-gold-hi:#ffd45e;
  --prod-ink:#111827;
  --prod-muted:#5b6573;
  --prod-line:#d8dee6;
  --prod-panel:#f7f8fa;
  --prod-surface:#ffffff;
  --prod-workspace:#1a1f28;
  --prod-ok:#17683e;
  --prod-ok-bg:#eef7f2;
  --prod-warn:#9a3412;
  --prod-warn-bg:#fff7ed;
  --prod-err:#b42318;
  --prod-err-bg:#fff0ee;
  min-height:100vh;
  background:var(--prod-workspace);
  color:var(--prod-ink);
  font:13px/1.4 Inter,system-ui,sans-serif;
}
.prod-wf *,.prod-wf *::before,.prod-wf *::after{box-sizing:border-box}
.prod-wf-bar{
  height:64px;
  background:#0d1117;
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding:0 16px;
  position:sticky;
  top:0;
  z-index:6;
  border-bottom:1px solid #243044;
}
.prod-wf-brand{display:flex;align-items:center;gap:10px;min-width:0}
.prod-wf-mark{
  width:32px;height:32px;border-radius:8px;flex-shrink:0;
  display:grid;place-items:center;
  background:var(--prod-gold-hi);
  color:#111;font:800 17px/1 Georgia,serif;
}
.prod-wf-brand strong,.prod-wf-brand small{display:block}
.prod-wf-brand strong{font-size:13px;letter-spacing:.08em;font-weight:800}
.prod-wf-brand small{font-size:11px;color:#98a2b3;font-weight:500;letter-spacing:0}
.prod-wf-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.prod-wf-btn{
  border:0;border-radius:8px;padding:10px 14px;font:700 13px/1 Inter,system-ui,sans-serif;
  cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:40px;
}
.prod-wf-btn:disabled{opacity:.45;cursor:not-allowed}
.prod-wf-btn-back{background:#1f2937;color:#fff;border:1px solid #3a4556}
.prod-wf-btn-back:hover:not(:disabled){background:#243044}
.prod-wf-btn-quiet{background:#242b36;color:#e5e7eb}
.prod-wf-btn-quiet:hover:not(:disabled){background:#2d3644}
.prod-wf-btn-ghost{background:transparent;color:#e5e7eb;border:1px solid #3a4556}
.prod-wf-btn-primary{
  background:var(--prod-gold);
  color:#111;
  font-size:14px;
  font-weight:800;
  min-width:132px;
  min-height:44px;
  padding:12px 20px;
}
.prod-wf-btn-primary:hover:not(:disabled){filter:brightness(1.05)}
.prod-wf-btn-upload{background:var(--gs-accent,var(--prod-gold-hi));color:var(--gs-accent-ink,#111)}
.prod-wf-split{
  display:grid;
  grid-template-columns:minmax(340px,42%) minmax(0,1fr);
  min-height:calc(100vh - 64px);
}
.prod-wf-panel{
  background:var(--prod-panel);
  border-right:1px solid #12161d;
  padding:16px;
  overflow:auto;
  max-height:calc(100vh - 64px);
}
.prod-wf-preview{
  background:var(--prod-workspace);
  padding:16px;
  display:grid;
  grid-template-rows:auto auto 1fr auto;
  gap:12px;
  max-height:calc(100vh - 64px);
  overflow:auto;
  color:#e5e7eb;
}
.prod-wf-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 12px}
.prod-wf-head h2{margin:0;font-size:15px;font-weight:800;color:var(--prod-ink)}
.prod-wf-head p{margin:0;font-size:12px;color:var(--prod-muted)}
.prod-wf-preview .prod-wf-head h2{color:#f3f4f6}
.prod-wf-preview .prod-wf-head p{color:#98a2b3}
.prod-wf-card{
  background:var(--prod-surface);
  border:1px solid var(--prod-line);
  border-radius:10px;
  padding:12px;
}
.prod-wf-sheet-settings{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px}
.prod-wf-field{display:grid;gap:4px;font-size:11px;font-weight:600;color:var(--prod-muted)}
.prod-wf-field input,.prod-wf-field select,.prod-wf-field textarea{
  width:100%;padding:8px;border:1px solid #ccd2da;border-radius:6px;background:#fff;color:var(--prod-ink);
  font:13px Inter,system-ui,sans-serif;
}
.prod-wf-field textarea{min-height:140px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
.prod-wf-dims{
  display:grid;
  grid-template-columns:1fr 1fr auto;
  gap:8px;
  align-items:end;
}
.prod-wf-dims .prod-wf-qty{grid-column:1 / -1}
.prod-wf-stepper{display:grid;grid-template-columns:32px 1fr 32px;align-items:center;border:1px solid #ccd2da;border-radius:8px;overflow:hidden;background:#fff}
.prod-wf-stepper button{border:0;background:#f3f4f6;color:#111;height:36px;cursor:pointer;font-size:16px;line-height:1}
.prod-wf-stepper button:hover:not(:disabled){background:#fff4e5}
.prod-wf-stepper button:disabled{opacity:.4;cursor:not-allowed}
.prod-wf-stepper input{border:0;text-align:center;padding:8px 4px;width:100%;min-width:0;background:#fff;font:13px Inter,system-ui,sans-serif}
.prod-wf-lock{
  display:inline-flex;align-items:center;gap:8px;
  border:1px solid #ccd2da;background:#fff;border-radius:8px;
  padding:0 10px;height:36px;cursor:pointer;font-size:11px;font-weight:700;color:#475467;white-space:nowrap;
}
.prod-wf-lock.on{border-color:var(--prod-gold);background:#fffbeb;color:#9a3412}
.prod-wf-lock:disabled{opacity:.45;cursor:not-allowed}
.prod-wf-lock-row{display:flex;align-items:center;gap:8px;margin:8px 0}
.prod-wf-progress{
  display:grid;gap:4px;
  background:#111827;border:1px solid #2a3341;border-radius:8px;
  padding:10px 12px;color:#e5e7eb;
}
.prod-wf-progress strong{font-size:12px;font-weight:700;color:#fff}
.prod-wf-progress span{font-size:11px;color:#98a2b3}
.prod-wf-progress-track{height:3px;background:#2a3341;border-radius:999px;overflow:hidden;margin-top:6px}
.prod-wf-progress-bar{height:100%;width:40%;background:var(--prod-gold);animation:prod-wf-indeterminate 1.1s ease-in-out infinite}
.prod-wf-progress.ready .prod-wf-progress-bar{width:100%;animation:none;background:#21a366}
.prod-wf-progress.error .prod-wf-progress-bar{width:100%;animation:none;background:var(--prod-err)}
.prod-wf-progress.idle .prod-wf-progress-bar{width:0;animation:none}
@keyframes prod-wf-indeterminate{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
.prod-wf-tally{
  display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;
}
.prod-wf-tally-cell{
  background:#fff;color:var(--prod-ink);border:1px solid var(--prod-line);border-radius:8px;padding:10px 12px;
}
.prod-wf-tally-cell span{display:block;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--prod-muted)}
.prod-wf-tally-cell strong{display:block;font-size:26px;font-variant-numeric:tabular-nums;line-height:1.15;margin-top:2px}
.prod-wf-tally-cell em{display:block;font-style:normal;font-size:11px;color:var(--prod-muted);margin-top:2px}
.prod-wf-tally.ok .prod-wf-tally-cell.placed{border-color:#86efac;background:var(--prod-ok-bg)}
.prod-wf-tally.warn .prod-wf-tally-cell.placed{border-color:var(--prod-gold);background:var(--prod-warn-bg)}
.prod-wf-tally.error .prod-wf-tally-cell.placed{border-color:#fca5a5;background:var(--prod-err-bg)}
.prod-wf-tally-note{
  grid-column:1/-1;margin:0;padding:8px 10px;border-radius:6px;font-size:12px;font-weight:600;
}
.prod-wf-tally.ok .prod-wf-tally-note{background:var(--prod-ok-bg);color:var(--prod-ok)}
.prod-wf-tally.warn .prod-wf-tally-note{background:var(--prod-warn-bg);color:var(--prod-warn)}
.prod-wf-tally.error .prod-wf-tally-note{background:var(--prod-err-bg);color:var(--prod-err)}
.prod-wf-alert{margin:0;padding:10px 12px;border-radius:8px;border:1px solid transparent}
.prod-wf-alert strong{display:block;font-size:12px;margin-bottom:2px}
.prod-wf-alert p{margin:0;font-size:12px;line-height:1.45}
.prod-wf-alert.error{background:var(--prod-err-bg);border-color:#fecaca;color:var(--prod-err)}
.prod-wf-alert.warn{background:var(--prod-warn-bg);border-color:#fed7aa;color:var(--prod-warn)}
.prod-wf-alert.ok{background:var(--prod-ok-bg);border-color:#bbf7d0;color:var(--prod-ok)}
.prod-wf-sheet{
  position:relative;width:100%;max-width:560px;margin:0 auto;
  background:#fff;border-radius:4px;
  background-image:linear-gradient(#eef1f4 1px,transparent 1px),linear-gradient(90deg,#eef1f4 1px,transparent 1px);
  background-size:16px 16px;
  box-shadow:0 8px 28px rgba(0,0,0,.35);
}
.prod-wf-sheet>i{position:absolute;inset:4px;border:1px dashed #e54d4d;pointer-events:none}
.prod-wf-piece{position:absolute;overflow:hidden;border:1px solid #94a3b8;background:#fff}
.prod-wf-piece.highlight{outline:2px solid var(--prod-gold);z-index:2}
.prod-wf-piece.miss{outline:2px dashed var(--prod-err)}
.prod-wf-piece img,.prod-wf-piece span{
  width:100%;height:100%;object-fit:fill;display:grid;place-items:center;
  pointer-events:none;font-size:9px;font-weight:700;color:#111;text-align:center;padding:2px;
}
.prod-wf-preview-stage{
  min-height:280px;display:grid;place-items:center;
  background:#12161d;border:1px solid #2a3341;border-radius:10px;padding:20px;
}
.prod-wf-empty{text-align:center;color:#98a2b3;max-width:320px}
.prod-wf-empty strong{display:block;color:#e5e7eb;margin-bottom:6px}
.prod-wf-empty p{margin:0;font-size:12px;line-height:1.45}
.prod-wf-stats{
  background:#111827;border:1px solid #2a3341;border-radius:10px;padding:12px;display:grid;gap:6px;color:#98a2b3;
}
.prod-wf-stats p{display:flex;justify-content:space-between;margin:0;font-size:12px;gap:12px}
.prod-wf-stats strong{color:#f3f4f6;font-variant-numeric:tabular-nums}
.prod-wf-row{
  display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:10px;align-items:start;
  background:#fff;border:1px solid var(--prod-line);border-radius:10px;padding:10px;cursor:pointer;
}
.prod-wf-row.active{border-color:var(--prod-gold);box-shadow:0 0 0 1px var(--prod-gold)}
.prod-wf-row img,.prod-wf-thumb{
  width:64px;height:64px;object-fit:contain;background:#eef1f4;border-radius:6px;display:grid;place-items:center;
}
.prod-wf-row strong{display:block;font-size:12px;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prod-wf-row small{font-size:10px;color:var(--prod-muted)}
.prod-wf-row-actions{display:grid;gap:6px;align-content:start}
.prod-wf-row-actions .dup{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:6px 8px;font-size:10px;cursor:pointer}
.prod-wf-row-actions .remove{border:0;background:#fee2e2;color:#991b1b;width:32px;height:32px;border-radius:6px;cursor:pointer}
.prod-wf-list{display:grid;gap:8px}
.prod-wf-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.prod-wf-tab{border:1px solid #ccd2da;background:#fff;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;color:#344054}
.prod-wf-tab.active{background:#fffbeb;border-color:var(--prod-gold);color:#9a3412}
.prod-wf-drop{
  min-height:180px;border:1.5px dashed #b5bfcc;border-radius:10px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  text-align:center;color:var(--prod-muted);cursor:pointer;background:#fff;
}
.prod-wf-drop strong{color:var(--prod-ink)}
.prod-wf-fine{font-size:11px;color:#98a2b3;margin:0;line-height:1.45}
.prod-wf-check{display:flex;align-items:center;gap:8px;font-size:12px;color:#344054;margin:0 0 12px}
.prod-wf-readonly{opacity:.92;pointer-events:none}
.prod-wf-readonly button,.prod-wf-readonly input,.prod-wf-readonly select,.prod-wf-readonly textarea,.prod-wf-readonly label{pointer-events:none}
.prod-wf-art-preview{
  display:grid;place-items:center;min-height:180px;background:#fff;
  border:1px solid var(--prod-line);border-radius:10px;padding:12px;
}
.prod-wf-art-preview img{max-width:100%;max-height:220px;object-fit:contain}
.prod-wf-copies{
  display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;
}
.prod-wf-copies i{
  width:22px;height:22px;border-radius:3px;border:1px solid #d0d5dd;background:#f8fafc;
  background-size:cover;background-position:center;display:block;
}
.prod-wf-copies i.more{display:grid;place-items:center;font-size:9px;font-weight:800;font-style:normal;color:#475467;background:#eef1f4}
.prod-wf-inline-tally{margin:12px 0}
.prod-wf-btn:focus-visible,
.prod-wf-tab:focus-visible,
.prod-wf input:focus-visible,
.prod-wf select:focus-visible,
.prod-wf textarea:focus-visible{
  outline:2px solid var(--gs-accent,#e4b84a);
  outline-offset:2px;
}
@media(max-width:960px){
  .prod-wf-split{grid-template-columns:1fr}
  .prod-wf-panel{max-height:none;border-right:0;border-bottom:1px solid #12161d}
  .prod-wf-dims{grid-template-columns:1fr 1fr}
  .prod-wf-tally{grid-template-columns:1fr 1fr}
}
`;
