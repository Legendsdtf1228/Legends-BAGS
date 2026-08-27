import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { BAGS_NAV_ICONS } from "./bags-admin-icons";

export const bagsAdminStyles = `
.bags-admin-shell{display:flex;min-height:calc(100vh - 8px);background:#eef1f5;font:14px/1.45 Inter,Segoe UI,system-ui,sans-serif;color:#111827}
.bags-admin-sidebar{width:252px;flex-shrink:0;background:linear-gradient(180deg,#0d1117 0%,#151b26 100%);color:#e5e7eb;display:flex;flex-direction:column;border-right:1px solid #1f2937;box-shadow:2px 0 12px rgba(13,17,23,.08)}
.bags-admin-brand{padding:18px 16px 14px;border-bottom:1px solid #1f2937;display:flex;align-items:center;gap:12px}
.bags-admin-logo{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:900 22px Georgia,serif;flex-shrink:0;box-shadow:0 2px 8px rgba(232,145,25,.35)}
.bags-admin-brand-text strong{display:block;font-size:11px;letter-spacing:.14em;color:#9ca3af;font-weight:700}
.bags-admin-brand-text span{display:block;margin-top:2px;font-size:16px;font-weight:800;color:#fff;line-height:1.2}
.bags-admin-brand-text em{font-style:normal;color:#f97316}
.bags-admin-nav{flex:1;overflow:auto;padding:10px 10px 16px}
.bags-admin-nav-group{margin-bottom:16px}
.bags-admin-nav-label{padding:8px 12px 6px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b7280}
.bags-admin-nav-link{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;color:#d1d5db;text-decoration:none;font-weight:600;font-size:13px;margin-bottom:2px;border:1px solid transparent;transition:background .15s,color .15s}
.bags-admin-nav-link:hover{background:#1f2937;color:#fff}
.bags-admin-nav-link.active{background:linear-gradient(90deg,rgba(249,115,22,.24),rgba(249,115,22,.06));border-color:rgba(249,115,22,.35);color:#fff;box-shadow:inset 3px 0 0 #f97316}
.bags-admin-nav-icon{width:20px;height:20px;display:grid;place-items:center;opacity:.92;flex-shrink:0}
.bags-admin-sidebar-foot{padding:12px 16px 16px;border-top:1px solid #1f2937;font-size:11px;color:#6b7280;line-height:1.4}
.bags-admin-main{flex:1;min-width:0;display:flex;flex-direction:column;background:#eef1f5}
.bags-admin-topbar{padding:16px 24px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;box-shadow:0 1px 0 rgba(16,24,40,.04)}
.bags-admin-topbar h1{margin:0;font-size:21px;font-weight:800;letter-spacing:-.02em}
.bags-admin-topbar p{margin:4px 0 0;font-size:13px;color:#667085}
.bags-admin-content{padding:20px 24px 32px;flex:1}
.bags-admin-grid{display:grid;gap:16px}
.bags-admin-grid.stats{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.bags-admin-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.bags-admin-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.bags-admin-card h2,.bags-admin-card h3{margin:0 0 8px;font-size:16px;font-weight:700}
.bags-admin-stat{position:relative;overflow:hidden}
.bags-admin-stat::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--stat-accent,#f97316);border-radius:12px 0 0 12px}
.bags-admin-stat strong{display:block;font-size:26px;line-height:1.1;color:#111827;padding-left:4px}
.bags-admin-stat span{display:block;margin-top:4px;font-size:12px;color:#667085;padding-left:4px}
.bags-admin-stat.accent-orange{--stat-accent:#f97316}
.bags-admin-stat.accent-blue{--stat-accent:#2563eb}
.bags-admin-stat.accent-green{--stat-accent:#21a366}
.bags-admin-stat.accent-purple{--stat-accent:#7c3aed}
.bags-admin-stat.accent-red{--stat-accent:#dc2626}
.bags-admin-muted{color:#667085;font-size:13px;margin:0;line-height:1.5}
.bags-admin-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bags-admin-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:8px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none;transition:background .15s,transform .05s}
.bags-admin-btn:active{transform:translateY(1px)}
.bags-admin-btn.primary{background:#f97316;color:#fff}
.bags-admin-btn.primary:hover{background:#ea580c}
.bags-admin-btn.secondary{background:#0d1117;color:#fff}
.bags-admin-btn.secondary:hover{background:#1f2937}
.bags-admin-btn.ghost{background:#fff;border:1px solid #d1d5db;color:#111827}
.bags-admin-btn.ghost:hover{background:#f9fafb}
.bags-admin-table{width:100%;border-collapse:collapse;font-size:13px}
.bags-admin-table th,.bags-admin-table td{padding:11px 8px;border-bottom:1px solid #eef2f6;text-align:left;vertical-align:middle}
.bags-admin-table th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700}
.bags-admin-table tbody tr:hover{background:#fafbfc}
.bags-admin-table a{color:#ea580c;font-weight:600;text-decoration:none}
.bags-admin-table a:hover{text-decoration:underline}
.bags-admin-placeholder{display:grid;gap:10px;max-width:640px}
.bags-admin-badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;line-height:1.2;border:1px solid transparent;white-space:nowrap}
.bags-admin-badge.draft{background:#f3f4f6;color:#374151;border-color:#e5e7eb}
.bags-admin-badge.processing{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
.bags-admin-badge.ordered{background:#fff7ed;color:#c2410c;border-color:#fed7aa}
.bags-admin-badge.completed{background:#ecfdf3;color:#027a48;border-color:#abefc6}
.bags-admin-badge.failed{background:#fef3f2;color:#b42318;border-color:#fecdca}
.bags-admin-badge.queued{background:#f5f3ff;color:#6d28d9;border-color:#ddd6fe}
.bags-admin-badge.gang-sheet{background:#fff7ed;color:#c2410c;border-color:#fed7aa}
.bags-admin-badge.upload-by-size{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
.bags-admin-form label{display:grid;gap:6px;font-size:12px;color:#374151;font-weight:600}
.bags-admin-form input,.bags-admin-form select{padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;font:inherit}
.bags-admin-quick{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.bags-admin-quick a{display:grid;gap:8px;padding:14px 16px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;text-decoration:none;color:inherit;transition:border-color .15s,box-shadow .15s}
.bags-admin-quick a:hover{border-color:#fdba74;box-shadow:0 4px 14px rgba(249,115,22,.12)}
.bags-admin-quick-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#fff7ed;color:#ea580c}
.bags-admin-quick-icon svg{width:20px;height:20px}
.bags-admin-quick strong{font-size:14px}
.bags-admin-quick span{font-size:12px;color:#667085;line-height:1.4}
.bags-admin-pipeline{display:grid;gap:10px}
.bags-admin-pipeline-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}
.bags-admin-pipeline-bar{flex:1;height:8px;background:#eef2f6;border-radius:999px;overflow:hidden}
.bags-admin-pipeline-bar>i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#f97316,#fb923c)}
@media(max-width:960px){
  .bags-admin-shell{flex-direction:column}
  .bags-admin-sidebar{width:100%}
  .bags-admin-nav{display:flex;flex-wrap:wrap;gap:4px;padding:10px}
  .bags-admin-nav-group{display:contents}
  .bags-admin-nav-label{display:none}
  .bags-admin-nav-link{padding:8px 10px;font-size:12px}
  .bags-admin-grid.two{grid-template-columns:1fr}
}
`;

const STATUS_CLASS: Record<string, string> = {
  draft: "draft",
  processing: "processing",
  ordered: "ordered",
  completed: "completed",
  failed: "failed",
  queued: "queued",
  gang_sheet: "gang-sheet",
  upload_by_size: "upload-by-size",
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
