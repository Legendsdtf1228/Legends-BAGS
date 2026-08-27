import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";

export function BagsPageBody(props: { children: ReactNode }) {
  return (
    <div className="bags-admin-page-body">
      <div className="bags-admin-page-inner">{props.children}</div>
    </div>
  );
}

export function BagsToolbar(props: {
  children: ReactNode;
  secondary?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="bags-admin-toolbar" style={props.style}>
      <div className="bags-admin-toolbar-main">{props.children}</div>
      {props.secondary ? <div className="bags-admin-toolbar-secondary">{props.secondary}</div> : null}
    </div>
  );
}

export function BagsSearchField(props: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  return (
    <div className="bags-admin-search">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        name={props.name ?? "q"}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder ?? "Search…"}
        aria-label={props["aria-label"] ?? props.placeholder ?? "Search"}
      />
    </div>
  );
}

export function BagsSelect(props: {
  name: string;
  defaultValue?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <select
      name={props.name}
      defaultValue={props.defaultValue}
      className="bags-admin-select"
      aria-label={props["aria-label"]}
    >
      {props.children}
    </select>
  );
}

export function BagsEmptyState(props: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="bags-admin-empty">
      {props.icon ? <div className="bags-admin-empty-icon">{props.icon}</div> : null}
      <h3>{props.title}</h3>
      <p>{props.description}</p>
      {props.action ? <div className="bags-admin-empty-action">{props.action}</div> : null}
    </div>
  );
}

export function BagsAlert(props: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
}) {
  const tone = props.tone ?? "info";
  return (
    <div className={`bags-admin-alert ${tone}`} role="status">
      {props.title ? <strong>{props.title}</strong> : null}
      <div>{props.children}</div>
    </div>
  );
}

export function BagsTabs(props: {
  items: Array<{ id: string; label: string; href?: string; active?: boolean }>;
}) {
  return (
    <div className="bags-admin-tabs" role="tablist">
      {props.items.map((item) =>
        item.href ? (
          <Link
            key={item.id}
            to={item.href}
            className={`bags-admin-tab${item.active ? " active" : ""}`}
            role="tab"
            aria-selected={item.active}
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={item.id}
            type="button"
            className={`bags-admin-tab${item.active ? " active" : ""}`}
            role="tab"
            aria-selected={item.active}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}

export function BagsTableWrap(props: { children: ReactNode }) {
  return <div className="bags-admin-table-wrap">{props.children}</div>;
}

export function BagsThumb(props: { src?: string | null; alt?: string; label?: string }) {
  if (props.src) {
    return <img className="bags-admin-thumb" src={props.src} alt={props.alt ?? ""} width={40} height={40} />;
  }
  return (
    <div className="bags-admin-thumb bags-admin-thumb--empty" aria-hidden>
      {(props.label ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

export function BagsRowActions(props: { children: ReactNode }) {
  return <div className="bags-admin-row-actions">{props.children}</div>;
}

export function BagsPagination(props: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}) {
  if (props.pageCount <= 1) return null;
  return (
    <nav className="bags-admin-pagination" aria-label="Pagination">
      {props.page > 1 ? (
        <Link to={props.buildHref(props.page - 1)} className="bags-admin-btn ghost">
          Previous
        </Link>
      ) : null}
      <span className="bags-admin-muted">
        Page {props.page} of {props.pageCount}
      </span>
      {props.page < props.pageCount ? (
        <Link to={props.buildHref(props.page + 1)} className="bags-admin-btn ghost">
          Next
        </Link>
      ) : null}
    </nav>
  );
}

export function BagsSectionHeader(props: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="bags-admin-section-header">
      <div>
        <h2>{props.title}</h2>
        {props.description ? <p>{props.description}</p> : null}
      </div>
      {props.actions ? <div className="bags-admin-actions">{props.actions}</div> : null}
    </div>
  );
}

export function BagsDateRange(props: {
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="bags-admin-date-range" role="group" aria-label="Date range">
      {props.options.map((opt) => (
        <button
          key={opt.value}
          type="submit"
          name="range"
          value={opt.value}
          className={`bags-admin-btn ${props.value === opt.value ? "primary" : "ghost"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function BagsLoadingRows(props: { rows?: number; cols?: number }) {
  const rows = props.rows ?? 5;
  const cols = props.cols ?? 4;
  return (
    <div className="bags-admin-skeleton-table" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bags-admin-skeleton-row">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="bags-admin-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}
