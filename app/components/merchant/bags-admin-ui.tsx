import type { CSSProperties, ReactNode } from "react";

export const bagsAdminStyles = `
.bags-admin-shell{display:flex;min-height:calc(100vh - 8px);background:#f4f6f8;font:14px/1.4 Inter,Segoe UI,system-ui,sans-serif;color:#111827}
.bags-admin-sidebar{width:248px;flex-shrink:0;background:linear-gradient(180deg,#0d1117 0%,#151b26 100%);color:#e5e7eb;display:flex;flex-direction:column;border-right:1px solid #1f2937}
.bags-admin-brand{padding:20px 18px 16px;border-bottom:1px solid #1f2937}
.bags-admin-brand strong{display:block;font-size:11px;letter-spacing:.14em;color:#9ca3af}
.bags-admin-brand span{display:block;margin-top:6px;font-size:17px;font-weight:800;color:#fff}
.bags-admin-brand em{font-style:normal;color:#f97316}
.bags-admin-nav{flex:1;overflow:auto;padding:12px 10px 20px}
.bags-admin-nav-group{margin-bottom:18px}
.bags-admin-nav-label{padding:6px 12px 8px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b7280}
.bags-admin-nav-link{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:#d1d5db;text-decoration:none;font-weight:600;font-size:13px;margin-bottom:2px;border:1px solid transparent}
.bags-admin-nav-link:hover{background:#1f2937;color:#fff}
.bags-admin-nav-link.active{background:linear-gradient(90deg,rgba(249,115,22,.22),rgba(249,115,22,.08));border-color:rgba(249,115,22,.35);color:#fff;box-shadow:inset 3px 0 0 #f97316}
.bags-admin-nav-icon{width:22px;text-align:center;font-size:15px;opacity:.95}
.bags-admin-main{flex:1;min-width:0;display:flex;flex-direction:column}
.bags-admin-topbar{padding:14px 24px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.bags-admin-topbar h1{margin:0;font-size:22px;font-weight:800}
.bags-admin-topbar p{margin:4px 0 0;font-size:13px;color:#6b7280}
.bags-admin-content{padding:20px 24px 32px;flex:1}
.bags-admin-grid{display:grid;gap:16px}
.bags-admin-grid.stats{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
.bags-admin-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.bags-admin-card h2,.bags-admin-card h3{margin:0 0 8px;font-size:16px}
.bags-admin-stat strong{display:block;font-size:28px;line-height:1.1;color:#111827}
.bags-admin-stat span{display:block;margin-top:4px;font-size:12px;color:#6b7280}
.bags-admin-muted{color:#6b7280;font-size:13px;margin:0}
.bags-admin-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bags-admin-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:8px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
.bags-admin-btn.primary{background:#f97316;color:#fff}
.bags-admin-btn.primary:hover{background:#ea580c}
.bags-admin-btn.secondary{background:#111827;color:#fff}
.bags-admin-btn.ghost{background:#fff;border:1px solid #d1d5db;color:#111827}
.bags-admin-table{width:100%;border-collapse:collapse;font-size:13px}
.bags-admin-table th,.bags-admin-table td{padding:10px 8px;border-bottom:1px solid #eef2f6;text-align:left;vertical-align:top}
.bags-admin-table th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280}
.bags-admin-table a{color:#ea580c;font-weight:600;text-decoration:none}
.bags-admin-table a:hover{text-decoration:underline}
.bags-admin-placeholder{display:grid;gap:10px;max-width:640px}
.bags-admin-badge{display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}
.bags-admin-form label{display:grid;gap:6px;font-size:12px;color:#374151;font-weight:600}
.bags-admin-form input,.bags-admin-form select{padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;font:inherit}
@media(max-width:960px){.bags-admin-shell{flex-direction:column}.bags-admin-sidebar{width:100%}.bags-admin-nav{display:flex;flex-wrap:wrap;gap:4px;padding:10px}.bags-admin-nav-group{display:contents}.bags-admin-nav-label{display:none}.bags-admin-nav-link{padding:8px 10px;font-size:12px}}
`;

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

export function BagsStat(props: { label: string; value: string | number }) {
  return (
    <div className="bags-admin-card bags-admin-stat">
      <strong>{props.value}</strong>
      <span>{props.label}</span>
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
        {props.badge ? <span className="bags-admin-badge">{props.badge}</span> : null}
        <h3>{props.title}</h3>
        <p className="bags-admin-muted">{props.body}</p>
        {props.children}
      </div>
    </BagsCard>
  );
}

/** Links to customer editors where upload + canvas live (not in merchant settings pages). */
export function EditorTryCard(props: {
  uploadBySizeUrl: string;
  gangSheetUrl: string;
  style?: CSSProperties;
}) {
  return (
    <BagsCard title="Try customer editors (upload & canvas)" style={props.style}>
      <p className="bags-admin-muted">
        Image upload and the gang sheet canvas are in the <strong>customer editors</strong>, not in
        this admin sidebar. Open one in a new tab to test uploads, placement, background removal, and
        save flow.
      </p>
      <ol className="bags-admin-muted" style={{ margin: "12px 0", paddingLeft: 20 }}>
        <li>
          <strong>Upload by Size</strong> — header button <strong>＋ Choose images</strong>
        </li>
        <li>
          <strong>Gang sheet</strong> — Welcome → <strong>Build a Gang Sheet</strong> → left sidebar{" "}
          <strong>＋ Upload image(s)</strong>
        </li>
        <li>
          Or use test products on the storefront after adding theme blocks in{" "}
          <a href="/app/setup">Setup</a>.
        </li>
      </ol>
      <div className="bags-admin-actions">
        <a
          href={props.uploadBySizeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bags-admin-btn primary"
        >
          Open Upload by Size
        </a>
        <a
          href={props.gangSheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bags-admin-btn secondary"
        >
          Open Gang Sheet builder
        </a>
      </div>
    </BagsCard>
  );
}
