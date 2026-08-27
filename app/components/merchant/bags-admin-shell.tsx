import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { BAGS_ADMIN_NAV, isNavActive } from "./bags-admin-nav";
import { BAGS_NAV_ICONS } from "./bags-admin-icons";
import { bagsAdminStyles } from "./bags-admin-ui";

const SECTION_LABELS: Record<string, string> = {
  main: "Main",
  settings: "Settings",
  support: "Support",
};

const APP_VERSION = "1.0.0-dev";

export function BagsAdminShell(props: { shop?: string; children: ReactNode }) {
  const { pathname } = useLocation();
  const sections = ["main", "settings", "support"] as const;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bags-admin-shell">
      <style>{bagsAdminStyles}</style>
      <aside
        className={`bags-admin-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
        aria-label="Legends BAGS navigation"
      >
        <div className="bags-admin-brand">
          <div className="bags-admin-logo" aria-hidden>
            L
          </div>
          <div className="bags-admin-brand-text">
            <strong>LEGENDS DTF PRINTS</strong>
            <span>
              <em>Legends</em> BAGS
            </span>
          </div>
          <button
            type="button"
            className="bags-admin-nav-toggle"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
        <nav className="bags-admin-nav">
          {sections.map((section) => {
            const items = BAGS_ADMIN_NAV.filter((item) => item.section === section);
            if (!items.length) return null;
            return (
              <div key={section} className="bags-admin-nav-group">
                <div className="bags-admin-nav-label">{SECTION_LABELS[section]}</div>
                {items.map((item) => {
                  const Icon = BAGS_NAV_ICONS[item.icon];
                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      className={`bags-admin-nav-link${isNavActive(pathname, item) ? " active" : ""}`}
                      title={item.label}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="bags-admin-nav-icon" aria-hidden>
                        {Icon ? Icon() : null}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        {props.shop ? (
          <div className="bags-admin-sidebar-foot">
            <div>{props.shop}</div>
            <div style={{ marginTop: 4 }}>Legends BAGS v{APP_VERSION}</div>
          </div>
        ) : null}
      </aside>
      <div className="bags-admin-main">{props.children}</div>
    </div>
  );
}
