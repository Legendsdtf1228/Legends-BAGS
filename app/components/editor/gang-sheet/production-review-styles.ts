/** Production Review (save dialog) — print-checkpoint chrome only. */

export const PRODUCTION_REVIEW_CSS = `
.lgs-editor.gs-editor-v2 .gs-save-dialog-backdrop{
  position:fixed;inset:0;z-index:50;padding:20px;
  background:#0d1117cc;
  display:grid;place-items:center;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog{
  --pr-ink:#0d1117;
  --pr-ink-soft:#1c2128;
  --pr-gold:#e8c15a;
  --pr-gold-deep:#c69214;
  --pr-paper:#f3f4f6;
  --pr-panel:#ffffff;
  --pr-line:#d8dde3;
  --pr-muted:#667085;
  --pr-caution:#9a3412;
  --pr-block:#991b1b;
  width:min(760px,100%);
  max-height:min(92vh,880px);
  display:flex;flex-direction:column;
  background:var(--pr-paper);
  color:var(--pr-ink);
  border:1px solid #2a313c;
  border-radius:10px;
  box-shadow:0 24px 60px #00000059;
  overflow:hidden;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head{
  display:flex;align-items:flex-start;gap:12px;
  padding:14px 16px 14px 18px;
  background:var(--pr-ink);
  color:#e5e7eb;
  border-bottom:1px solid #2a313c;
  position:relative;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head::before{
  content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--pr-gold);
}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head .pr-head-copy{flex:1;min-width:0}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head .pr-kicker{
  margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9aa3af;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head h2{
  margin:0;font-size:18px;font-weight:750;letter-spacing:.01em;color:#fff;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head .pr-head-hint{
  margin:4px 0 0;font-size:12px;line-height:1.4;color:#9aa3af;
}
.lgs-editor.gs-editor-v2 .pr-status{
  display:inline-flex;align-items:center;gap:6px;
  margin-top:2px;padding:5px 10px;border-radius:999px;
  font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;
  white-space:nowrap;border:1px solid transparent;flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .pr-status[data-readiness="ready"]{background:var(--pr-gold);color:var(--pr-ink);border-color:#f0d78a}
.lgs-editor.gs-editor-v2 .pr-status[data-readiness="caution"]{background:#3a2a14;color:#f3c77a;border-color:#8a6418}
.lgs-editor.gs-editor-v2 .pr-status[data-readiness="blocked"]{background:#3f1515;color:#fecaca;border-color:#7f1d1d}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head .gs-icon-btn{
  color:#9aa3af;width:36px;height:36px;flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog-head .gs-icon-btn:hover:not(:disabled){background:#243044;color:#fff}

.lgs-editor.gs-editor-v2 .pr-scope{
  display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--pr-line);border-bottom:1px solid var(--pr-line);
}
.lgs-editor.gs-editor-v2 .pr-scope>div{
  background:var(--pr-panel);padding:10px 14px;display:grid;gap:2px;min-width:0;
}
.lgs-editor.gs-editor-v2 .pr-scope span{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--pr-muted)}
.lgs-editor.gs-editor-v2 .pr-scope strong{font-size:13px;color:var(--pr-ink)}
.lgs-editor.gs-editor-v2 .pr-scope small{font-size:11px;color:var(--pr-muted);line-height:1.35}
.lgs-editor.gs-editor-v2 .pr-scope [data-scope="sheet"]{box-shadow:inset 3px 0 0 var(--pr-gold)}

.lgs-editor.gs-editor-v2 .gs-save-dialog-body{
  display:grid;grid-template-columns:minmax(168px,200px) minmax(0,1fr);gap:14px;
  padding:14px 16px;overflow:auto;min-height:0;flex:1;
}
.lgs-editor.gs-editor-v2 .pr-art{
  background:var(--pr-panel);border:1px solid var(--pr-line);border-radius:8px;padding:10px;min-width:0;
}
.lgs-editor.gs-editor-v2 .pr-art-label{margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--pr-muted)}
.lgs-editor.gs-editor-v2 .pr-thumbs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.lgs-editor.gs-editor-v2 .pr-thumbs figure{margin:0}
.lgs-editor.gs-editor-v2 .pr-thumbs img,.lgs-editor.gs-editor-v2 .pr-thumbs .pr-thumb-empty,.lgs-editor.gs-editor-v2 .pr-thumbs .pr-thumb-text{
  width:100%;aspect-ratio:1;object-fit:contain;border-radius:6px;border:1px solid var(--pr-line);background:#fff;
}
.lgs-editor.gs-editor-v2 .pr-thumbs .pr-thumb-empty,.lgs-editor.gs-editor-v2 .pr-thumbs .pr-thumb-text{
  display:grid;place-items:center;font-size:11px;font-weight:700;color:var(--pr-muted);
}
.lgs-editor.gs-editor-v2 .pr-thumbs figcaption{margin-top:4px;font-size:10px;color:var(--pr-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lgs-editor.gs-editor-v2 .pr-thumbs-more{margin:8px 0 0;font-size:11px;color:var(--pr-muted)}
.lgs-editor.gs-editor-v2 .gs-save-preview{margin:0}
.lgs-editor.gs-editor-v2 .gs-save-preview img{width:100%;aspect-ratio:3/4;object-fit:contain;border-radius:8px;border:1px solid var(--pr-line);background:#fff}
.lgs-editor.gs-editor-v2 .gs-save-preview-empty{display:grid;place-items:center;aspect-ratio:3/4;border-radius:8px;border:1px dashed #cbd5e1;color:var(--pr-muted);font-size:12px;background:#fff}

.lgs-editor.gs-editor-v2 .gs-save-fields{min-width:0;display:grid;gap:10px;align-content:start}
.lgs-editor.gs-editor-v2 .gs-save-field{display:grid;gap:6px;font-size:12px;font-weight:600;color:#344054}
.lgs-editor.gs-editor-v2 .gs-save-field input{
  padding:10px 12px;border:1px solid var(--pr-line);border-radius:6px;font:inherit;font-weight:400;background:#fff;
}
.lgs-editor.gs-editor-v2 .gs-save-field input:focus{outline:2px solid var(--pr-gold);outline-offset:1px;border-color:var(--pr-gold-deep)}
.lgs-editor.gs-editor-v2 .gs-save-field .pr-field-hint{font-size:11px;font-weight:400;color:var(--pr-muted);line-height:1.35}

.lgs-editor.gs-editor-v2 .gs-save-summary,
.lgs-editor.gs-editor-v2 .pr-facts{
  display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0;padding:0;background:transparent;border:0;
}
.lgs-editor.gs-editor-v2 .pr-facts>div,
.lgs-editor.gs-editor-v2 .gs-save-summary>div{
  display:grid;gap:2px;margin:0;padding:8px 10px;background:var(--pr-panel);border:1px solid var(--pr-line);border-radius:6px;
}
.lgs-editor.gs-editor-v2 .gs-save-summary dt,
.lgs-editor.gs-editor-v2 .pr-facts dt{margin:0;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--pr-muted)}
.lgs-editor.gs-editor-v2 .gs-save-summary dd,
.lgs-editor.gs-editor-v2 .pr-facts dd{margin:0;font-size:13px;font-weight:750;color:var(--pr-ink);line-height:1.3}
.lgs-editor.gs-editor-v2 .pr-facts .pr-fact-wide{grid-column:1/-1}

.lgs-editor.gs-editor-v2 .pr-issues{display:grid;gap:8px}
.lgs-editor.gs-editor-v2 .pr-issue-group{margin:0;padding:10px;border-radius:6px;border:1px solid var(--pr-line);background:var(--pr-panel)}
.lgs-editor.gs-editor-v2 .pr-issue-group h3{margin:0 0 8px;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.lgs-editor.gs-editor-v2 .pr-issue-group.blocking{border-color:#fecaca;background:#fff8f8}
.lgs-editor.gs-editor-v2 .pr-issue-group.blocking h3{color:var(--pr-block)}
.lgs-editor.gs-editor-v2 .pr-issue-group.caution{border-color:#fde68a;background:#fffbeb}
.lgs-editor.gs-editor-v2 .pr-issue-group.caution h3{color:var(--pr-caution)}
.lgs-editor.gs-editor-v2 .pr-issue-group ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.lgs-editor.gs-editor-v2 .pr-issue-group li strong{display:block;font-size:12px;color:var(--pr-ink)}
.lgs-editor.gs-editor-v2 .pr-issue-group li p{margin:2px 0 0;font-size:12px;line-height:1.4;color:#475467}
.lgs-editor.gs-editor-v2 .pr-ok{
  margin:0;padding:10px 12px;border-radius:6px;border:1px solid #d1e7dd;background:#f3faf6;color:#17683e;font-size:12px;line-height:1.4;
}
.lgs-editor.gs-editor-v2 .gs-save-warn{margin:0;padding:10px;border-radius:6px;background:#fffbeb;color:var(--pr-caution);font-size:12px;line-height:1.45}
.lgs-editor.gs-editor-v2 .gs-save-warn-danger{background:#fff8f8;color:var(--pr-block)}
.lgs-editor.gs-editor-v2 .gs-save-error{margin:0;padding:10px;border-radius:6px;background:#fff8f8;color:var(--pr-block);font-size:12px;line-height:1.4}

.lgs-editor.gs-editor-v2 .gs-save-dialog-foot{
  display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px;
  padding:12px 16px;border-top:1px solid var(--pr-line);background:var(--pr-panel);flex-shrink:0;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog-foot .pr-foot-note{
  flex:1 1 180px;margin:0;font-size:11px;line-height:1.4;color:var(--pr-muted);min-width:0;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog .gs-primary-btn{
  background:var(--pr-gold);color:var(--pr-ink);box-shadow:none;min-height:44px;padding:10px 18px;font-size:13px;
}
.lgs-editor.gs-editor-v2 .gs-save-dialog .gs-primary-btn:hover:not(:disabled){background:#f0d78a}
.lgs-editor.gs-editor-v2 .gs-save-dialog[data-readiness="blocked"] .gs-primary-btn{background:#9aa3af;color:#fff}
.lgs-editor.gs-editor-v2 .gs-save-dialog[data-readiness="caution"] .gs-primary-btn{background:var(--pr-ink);color:var(--pr-gold)}
.lgs-editor.gs-editor-v2 .gs-save-dialog .gs-secondary-btn,
.lgs-editor.gs-editor-v2 .gs-save-dialog .gs-ghost-btn{min-height:44px}

@media(max-width:640px){
  .lgs-editor.gs-editor-v2 .gs-save-dialog-backdrop{padding:0;align-items:stretch}
  .lgs-editor.gs-editor-v2 .gs-save-dialog{
    width:100%;max-width:none;max-height:100dvh;height:100dvh;border-radius:0;border:0;
  }
  .lgs-editor.gs-editor-v2 .gs-save-dialog-body{grid-template-columns:1fr;padding:12px}
  .lgs-editor.gs-editor-v2 .pr-thumbs{grid-template-columns:repeat(4,minmax(0,1fr))}
  .lgs-editor.gs-editor-v2 .pr-art{order:-1}
}
@media(max-width:430px){
  .lgs-editor.gs-editor-v2 .gs-save-dialog-head{padding:12px 12px 12px 16px;flex-wrap:wrap}
  .lgs-editor.gs-editor-v2 .gs-save-dialog-head h2{font-size:16px}
  .lgs-editor.gs-editor-v2 .pr-status{order:3;width:100%;justify-content:center}
  .lgs-editor.gs-editor-v2 .pr-scope{grid-template-columns:1fr}
  .lgs-editor.gs-editor-v2 .pr-facts,.lgs-editor.gs-editor-v2 .gs-save-summary{grid-template-columns:1fr 1fr}
  .lgs-editor.gs-editor-v2 .gs-save-dialog-foot{
    display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px 12px;
    padding-bottom:max(12px,env(safe-area-inset-bottom));
  }
  .lgs-editor.gs-editor-v2 .gs-save-dialog-foot .pr-foot-note{grid-column:1/-1;flex:none}
  .lgs-editor.gs-editor-v2 .gs-save-dialog-foot .gs-ghost-btn,
  .lgs-editor.gs-editor-v2 .gs-save-dialog-foot .gs-secondary-btn{width:100%}
  .lgs-editor.gs-editor-v2 .gs-save-dialog-foot .gs-primary-btn{
    grid-column:1/-1;width:100%;font-size:14px;min-height:48px;
  }
  .lgs-editor.gs-editor-v2 .pr-issue-group li p{font-size:12px}
}
`;
