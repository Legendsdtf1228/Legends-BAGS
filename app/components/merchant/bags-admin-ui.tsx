import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { BAGS_NAV_ICONS } from "./bags-admin-icons";
import { bagsTokenCss } from "./bags-design-tokens";

export * from "./bags-admin-components";

export const bagsAdminStyles = `
${bagsTokenCss}
.bags-admin-shell{display:flex;min-height:100vh;background:var(--bags-shell-bg);font:var(--bags-control-height)/1.45 var(--bags-font);font-size:13px;color:var(--bags-text)}
.bags-admin-sidebar{width:var(--bags-sidebar-width);flex-shrink:0;background:linear-gradient(180deg,var(--bags-sidebar-bg) 0%,var(--bags-sidebar-bg-end) 100%);color:var(--bags-sidebar-text);display:flex;flex-direction:column;border-right:1px solid var(--bags-sidebar-border);box-shadow:var(--bags-shadow-sidebar);position:sticky;top:0;height:100vh;z-index:var(--bags-z-index,40)}
.bags-admin-sidebar.is-collapsed{width:64px}
.bags-admin-sidebar.is-collapsed .bags-admin-brand-text,.bags-admin-sidebar.is-collapsed .bags-admin-nav-label,.bags-admin-sidebar.is-collapsed .bags-admin-nav-link span:not(.bags-admin-nav-icon),.bags-admin-sidebar.is-collapsed .bags-admin-sidebar-foot{display:none}
.bags-admin-sidebar.is-collapsed .bags-admin-nav-link{justify-content:center;padding:10px}
.bags-admin-brand{padding:14px 14px 12px;border-bottom:1px solid var(--bags-sidebar-border);display:flex;align-items:center;gap:10px;min-height:var(--bags-header-height)}
.bags-admin-logo{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:800 18px Georgia,serif;flex-shrink:0}
.bags-admin-brand-text strong{display:block;font-size:10px;letter-spacing:.12em;color:var(--bags-sidebar-muted);font-weight:700}
.bags-admin-brand-text span{display:block;margin-top:1px;font-size:15px;font-weight:800;color:#fff;line-height:1.2}
.bags-admin-brand-text em{font-style:normal;color:var(--bags-sidebar-active)}
.bags-admin-nav-toggle{display:none;margin-left:auto;border:1px solid var(--bags-sidebar-border);background:transparent;color:var(--bags-sidebar-text);border-radius:6px;width:32px;height:32px;cursor:pointer}
.bags-admin-nav{flex:1;overflow:auto;padding:8px 8px 12px}
.bags-admin-nav-group{margin-bottom:12px}
.bags-admin-nav-label{padding:6px 10px 4px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--bags-sidebar-muted)}
.bags-admin-nav-link{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:7px;color:#d1d5db;text-decoration:none;font-weight:600;font-size:13px;margin-bottom:1px;border:1px solid transparent;transition:background .12s,color .12s}
.bags-admin-nav-link:hover{background:#243044;color:#fff}
.bags-admin-nav-link.active{background:linear-gradient(90deg,rgba(249,115,22,.22),rgba(249,115,22,.04));border-color:rgba(249,115,22,.28);color:#fff;box-shadow:inset 3px 0 0 var(--bags-sidebar-active)}
.bags-admin-nav-icon{width:18px;height:18px;display:grid;place-items:center;opacity:.95;flex-shrink:0}
.bags-admin-sidebar-foot{padding:10px 12px 14px;border-top:1px solid var(--bags-sidebar-border);font-size:10px;color:var(--bags-sidebar-muted);line-height:1.45}
.bags-admin-main{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--bags-shell-bg)}
.bags-admin-topbar{min-height:var(--bags-header-height);padding:0 20px;background:var(--bags-surface);border-bottom:1px solid var(--bags-border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;position:sticky;top:0;z-index:30}
.bags-admin-topbar h1{margin:0;font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--bags-text)}
.bags-admin-topbar p{margin:2px 0 0;font-size:12px;color:var(--bags-text-muted)}
.bags-admin-content{padding:0;flex:1}
.bags-admin-page-body{padding:16px 20px 28px}
.bags-admin-page-inner{max-width:var(--bags-content-max);margin:0 auto}
.bags-admin-grid{display:grid;gap:14px}
.bags-admin-grid.stats{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
.bags-admin-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.bags-admin-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.bags-admin-card{background:var(--bags-surface);border:1px solid var(--bags-border);border-radius:var(--bags-radius-lg);padding:14px 16px;box-shadow:var(--bags-shadow-card)}
.bags-admin-card h2,.bags-admin-card h3{margin:0 0 8px;font-size:15px;font-weight:700;color:var(--bags-text)}
.bags-admin-stat{position:relative;overflow:hidden;padding:14px 16px 14px 18px}
.bags-admin-stat::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--stat-accent,var(--bags-accent));border-radius:12px 0 0 12px}
.bags-admin-stat strong{display:block;font-size:28px;line-height:1.05;color:var(--bags-text);padding-left:2px;font-weight:800;letter-spacing:-.02em}
.bags-admin-stat span{display:block;margin-top:4px;font-size:11px;color:var(--bags-text-muted);padding-left:2px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.bags-admin-stat.accent-orange{--stat-accent:var(--bags-accent)}
.bags-admin-stat.accent-blue{--stat-accent:#2563eb}
.bags-admin-stat.accent-green{--stat-accent:#21a366}
.bags-admin-stat.accent-purple{--stat-accent:#7c3aed}
.bags-admin-stat.accent-red{--stat-accent:#dc2626}
.bags-admin-muted{color:var(--bags-text-muted);font-size:13px;margin:0;line-height:1.5}
.bags-admin-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bags-admin-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:var(--bags-radius-md);min-height:var(--bags-control-height);padding:0 14px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;transition:background .12s,box-shadow .12s,transform .05s;white-space:nowrap}
.bags-admin-btn:active{transform:translateY(1px)}
.bags-admin-btn.primary{background:var(--bags-accent);color:#fff;box-shadow:0 1px 2px rgba(249,115,22,.25)}
.bags-admin-btn.primary:hover{background:var(--bags-accent-dark)}
.bags-admin-btn.secondary{background:#111827;color:#fff}
.bags-admin-btn.secondary:hover{background:#1f2937}
.bags-admin-btn.ghost{background:var(--bags-surface);border:1px solid var(--bags-border-strong);color:var(--bags-text)}
.bags-admin-btn.ghost:hover{background:var(--bags-surface-muted)}
.bags-admin-btn.sm{min-height:30px;padding:0 10px;font-size:12px}
.bags-admin-btn:disabled,.bags-admin-btn[aria-disabled=true]{opacity:.55;cursor:not-allowed}
.bags-admin-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.bags-admin-toolbar-main,.bags-admin-toolbar-secondary{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bags-admin-search{display:flex;align-items:center;gap:8px;border:1px solid var(--bags-border-strong);border-radius:var(--bags-radius-md);background:var(--bags-surface);padding:0 10px;min-height:var(--bags-control-height);min-width:220px}
.bags-admin-search svg{color:var(--bags-text-muted);flex-shrink:0}
.bags-admin-search input{border:0;background:transparent;padding:8px 0;width:100%;font:inherit;min-width:0}
.bags-admin-search input:focus{outline:none}
.bags-admin-select,.bags-admin-form input,.bags-admin-form select{min-height:var(--bags-control-height);padding:0 10px;border:1px solid var(--bags-border-strong);border-radius:var(--bags-radius-md);font:inherit;background:var(--bags-surface);color:var(--bags-text)}
.bags-admin-table-wrap{overflow:auto;border:1px solid var(--bags-border);border-radius:var(--bags-radius-md);background:var(--bags-surface)}
.bags-admin-table{width:100%;border-collapse:collapse;font-size:13px}
.bags-admin-table th,.bags-admin-table td{padding:10px 12px;border-bottom:1px solid #eef2f6;text-align:left;vertical-align:middle}
.bags-admin-table th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--bags-text-muted);font-weight:700;background:var(--bags-surface-muted);position:sticky;top:0;z-index:1}
.bags-admin-table tbody tr{min-height:52px}
.bags-admin-table tbody tr:hover{background:#fafbfc}
.bags-admin-table tbody tr:last-child td{border-bottom:0}
.bags-admin-table a{color:var(--bags-accent-dark);font-weight:600;text-decoration:none}
.bags-admin-table a:hover{text-decoration:underline}
.bags-admin-table .bags-admin-check{width:16px;height:16px;accent-color:var(--bags-accent)}
.bags-admin-thumb{width:40px;height:40px;border-radius:7px;object-fit:cover;border:1px solid var(--bags-border);background:var(--bags-surface-muted)}
.bags-admin-thumb--empty{display:grid;place-items:center;font-size:14px;font-weight:700;color:var(--bags-text-muted)}
.bags-admin-row-actions{display:flex;gap:6px;align-items:center;justify-content:flex-end}
.bags-admin-empty{padding:36px 20px;text-align:center;max-width:480px;margin:0 auto}
.bags-admin-empty-icon{width:48px;height:48px;border-radius:12px;margin:0 auto 12px;display:grid;place-items:center;background:var(--bags-accent-soft);color:var(--bags-accent-dark)}
.bags-admin-empty h3{margin:0 0 6px;font-size:16px}
.bags-admin-empty p{margin:0;color:var(--bags-text-muted);font-size:13px;line-height:1.5}
.bags-admin-empty-action{margin-top:14px}
.bags-admin-alert{padding:10px 12px;border-radius:var(--bags-radius-md);font-size:13px;line-height:1.45;border:1px solid transparent}
.bags-admin-alert strong{display:block;margin-bottom:4px}
.bags-admin-alert.info{background:var(--bags-info-soft);border-color:#bfdbfe;color:#1e3a8a}
.bags-admin-alert.success{background:var(--bags-success-soft);border-color:#abefc6;color:#065f46}
.bags-admin-alert.warning{background:var(--bags-accent-soft);border-color:#fed7aa;color:#9a3412}
.bags-admin-alert.danger{background:var(--bags-danger-soft);border-color:#fecdca;color:#912018}
.bags-admin-tabs{display:flex;gap:4px;border-bottom:1px solid var(--bags-border);margin-bottom:12px}
.bags-admin-tab{border:0;background:transparent;padding:8px 12px;font:inherit;font-size:13px;font-weight:600;color:var(--bags-text-muted);cursor:pointer;text-decoration:none;border-bottom:2px solid transparent;margin-bottom:-1px}
.bags-admin-tab.active,.bags-admin-tab[aria-selected=true]{color:var(--bags-accent-dark);border-bottom-color:var(--bags-accent)}
.bags-admin-section-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.bags-admin-section-header h2{margin:0;font-size:15px;font-weight:700}
.bags-admin-section-header p{margin:4px 0 0;font-size:12px;color:var(--bags-text-muted)}
.bags-admin-date-range{display:flex;gap:6px;flex-wrap:wrap}
.bags-admin-pagination{display:flex;align-items:center;gap:10px;margin-top:12px}
.bags-admin-skeleton-table{display:grid;gap:8px;padding:8px 0}
.bags-admin-skeleton-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.bags-admin-skeleton-cell{height:36px;border-radius:6px;background:linear-gradient(90deg,#f2f4f7,#e9edf2,#f2f4f7);background-size:200% 100%;animation:bags-shimmer 1.2s infinite}
@keyframes bags-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
.bags-admin-placeholder{display:grid;gap:10px;max-width:640px}
.bags-admin-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;line-height:1.3;border:1px solid transparent;white-space:nowrap;text-transform:capitalize}
.bags-admin-badge.draft{background:#f3f4f6;color:#374151;border-color:#e5e7eb}
.bags-admin-badge.processing,.bags-admin-badge.pending{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
.bags-admin-badge.ordered,.bags-admin-badge.paid{background:#fff7ed;color:#c2410c;border-color:#fed7aa}
.bags-admin-badge.completed,.bags-admin-badge.active,.bags-admin-badge.synced{background:#ecfdf3;color:#027a48;border-color:#abefc6}
.bags-admin-badge.failed,.bags-admin-badge.deleted,.bags-admin-badge.missing{background:#fef3f2;color:#b42318;border-color:#fecdca}
.bags-admin-badge.queued{background:#f5f3ff;color:#6d28d9;border-color:#ddd6fe}
.bags-admin-badge.gang-sheet,.bags-admin-badge.gang_sheet{background:#fff7ed;color:#c2410c;border-color:#fed7aa}
.bags-admin-badge.upload-by-size,.bags-admin-badge.upload_by_size{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
.bags-admin-form label{display:grid;gap:5px;font-size:11px;color:var(--bags-text-secondary);font-weight:600}
.bags-admin-quick{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.bags-admin-quick a{display:grid;gap:6px;padding:12px 14px;border-radius:var(--bags-radius-lg);border:1px solid var(--bags-border);background:var(--bags-surface);text-decoration:none;color:inherit;transition:border-color .12s,box-shadow .12s}
.bags-admin-quick a:hover{border-color:#fdba74;box-shadow:0 4px 14px rgba(249,115,22,.1)}
.bags-admin-quick-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:var(--bags-accent-soft);color:var(--bags-accent-dark)}
.bags-admin-quick-icon svg{width:18px;height:18px}
.bags-admin-quick strong{font-size:13px}
.bags-admin-quick span{font-size:12px;color:var(--bags-text-muted);line-height:1.4}
.bags-admin-pipeline{display:grid;gap:8px}
.bags-admin-pipeline-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}
.bags-admin-pipeline-bar{flex:1;height:7px;background:#eef2f6;border-radius:999px;overflow:hidden}
.bags-admin-pipeline-bar>i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--bags-accent),#fb923c)}
.bags-admin-mobile-nav-btn{display:none}
@media(max-width:960px){
  .bags-admin-shell{flex-direction:column}
  .bags-admin-sidebar{width:100%;height:auto;position:relative}
  .bags-admin-nav-toggle{display:inline-grid;place-items:center}
  .bags-admin-nav{display:none;padding:8px 10px 12px}
  .bags-admin-sidebar.is-mobile-open .bags-admin-nav{display:block}
  .bags-admin-nav{display:flex;flex-wrap:wrap;gap:4px}
  .bags-admin-nav-group{display:contents}
  .bags-admin-nav-label{width:100%;display:block}
  .bags-admin-grid.two,.bags-admin-grid.three{grid-template-columns:1fr}
  .bags-admin-search{min-width:100%;flex:1 1 100%}
}
`;

const STATUS_CLASS: Record<string, string> = {
  draft: "draft",
  processing: "processing",
  pending: "pending",
  paid: "paid",
  ordered: "ordered",
  completed: "completed",
  failed: "failed",
  queued: "queued",
  active: "active",
  synced: "synced",
  missing: "missing",
  deleted: "deleted",
  gang_sheet: "gang_sheet",
  "gang-sheet": "gang_sheet",
  upload_by_size: "upload_by_size",
  "upload-by-size": "upload_by_size",
};

const STATUS_LABEL: Record<string, string> = {
  gang_sheet: "Gang sheet",
  upload_by_size: "Image to Sheet",
};

export function BagsPageHeader(props: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="bags-admin-topbar">
      <div>
        <h1>{props.title}</h1>
        {props.subtitle ? <p>{props.subtitle}</p> : null}
      </div>
      {props.actions ? <div className="bags-admin-actions">{props.actions}</div> : null}
    </header>
  );
}

export function BagsCard(props: { title?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <section className="bags-admin-card" style={props.style}>
      {props.title ? <h2>{props.title}</h2> : null}
      {props.children}
    </section>
  );
}

export function BagsStat(props: {
  label: string;
  value: string | number;
  accent?: "orange" | "blue" | "green" | "purple" | "red";
}) {
  return (
    <div className={`bags-admin-card bags-admin-stat accent-${props.accent ?? "orange"}`}>
      <strong>{props.value}</strong>
      <span>{props.label}</span>
    </div>
  );
}

export function BagsStatusBadge(props: { status: string }) {
  const key = props.status.toLowerCase();
  const cls = STATUS_CLASS[key] ?? "draft";
  const label = STATUS_LABEL[key] ?? props.status;
  return <span className={`bags-admin-badge ${cls}`}>{label}</span>;
}

export function BagsQuickActions(props: {
  items: Array<{ to: string; icon: string; title: string; subtitle: string }>;
}) {
  return (
    <div className="bags-admin-quick">
      {props.items.map((item) => {
        const Icon = BAGS_NAV_ICONS[item.icon];
        return (
          <Link key={item.to} to={item.to}>
            <span className="bags-admin-quick-icon" aria-hidden>
              {Icon ? Icon() : null}
            </span>
            <strong>{item.title}</strong>
            <span>{item.subtitle}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function BagsPipeline(props: {
  rows: Array<{ label: string; value: number; max: number }>;
}) {
  const max = Math.max(1, ...props.rows.map((r) => r.max));
  return (
    <div className="bags-admin-pipeline">
      {props.rows.map((row) => (
        <div key={row.label} className="bags-admin-pipeline-row">
          <span>{row.label}</span>
          <div className="bags-admin-pipeline-bar" aria-hidden>
            <i style={{ width: `${Math.round((row.value / max) * 100)}%` }} />
          </div>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function BagsPlaceholder(props: {
  title: string;
  body: string;
  badge?: string;
  children?: ReactNode;
}) {
  return (
    <BagsCard>
      <div className="bags-admin-placeholder">
        {props.badge ? <span className="bags-admin-badge ordered">{props.badge}</span> : null}
        <h3>{props.title}</h3>
        <p className="bags-admin-muted">{props.body}</p>
        {props.children}
      </div>
    </BagsCard>
  );
}

export function EditorTryCard(props: {
  uploadBySizeUrl: string;
  gangSheetUrl: string;
  style?: CSSProperties;
}) {
  return (
    <BagsCard title="Customer editors" style={props.style}>
      <p className="bags-admin-muted">
        Upload and canvas editing happen in the storefront editors — same as live BAGS. Use these
        links to test the full customer experience.
      </p>
      <div className="bags-admin-actions" style={{ marginTop: 12 }}>
        <a
          href={props.gangSheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bags-admin-btn primary"
        >
          Gang Sheet Builder
        </a>
        <a
          href={props.uploadBySizeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bags-admin-btn secondary"
        >
          Upload by Size
        </a>
      </div>
    </BagsCard>
  );
}
