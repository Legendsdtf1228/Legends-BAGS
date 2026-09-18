import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { BAGS_ADMIN_NAV, isNavActive } from "./bags-admin-nav";
import { BAGS_NAV_ICONS } from "./bags-admin-icons";
import { bagsAdminStyles } from "./bags-admin-ui";

const SECTION_LABELS: Record<string, string> = {
  main: "Workspace",
  settings: "Builder & assets",
  support: "Resources",
};

export function BagsAdminShell(props: { shop?: string; children: ReactNode }) {
  const { pathname } = useLocation();
  const sections = ["main", "settings", "support"] as const;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 960) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="bags-admin-shell">
      <style>{bagsAdminStyles}</style>
      <a className="bags-admin-skip" href="#bags-main">
        Skip to content
      </a>
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
            ref={toggleRef}
            aria-controls="bags-navigation"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
        <nav className="bags-admin-nav" id="bags-navigation" aria-label="Shop navigation">
          {sections.map((section) => {
            const items = BAGS_ADMIN_NAV.filter((item) => item.section === section);
            if (!items.length) return null;
            return (
              <div key={section} className="bags-admin-nav-group">
                <div className="bags-admin-nav-label">{SECTION_LABELS[section]}</div>
                {items.map((item) => {
                  const Icon = BAGS_NAV_ICONS[item.icon];
                  const active = isNavActive(pathname, item);
                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      className={`bags-admin-nav-link${active ? " active" : ""}`}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
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
            <span className="bags-shop-label">Your store</span>
            <div className="bags-shop-name" title={props.shop}>
              {props.shop}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          className="bags-collapse-toggle"
          aria-controls="bags-navigation"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((value) => !value)}
        >
          <span aria-hidden>{collapsed ? "»" : "«"}</span>
          {collapsed ? null : <span className="bags-collapse-toggle-label">Collapse sidebar</span>}
        </button>
      </aside>
      <main className="bags-admin-main" id="bags-main" tabIndex={-1}>
        {mobileOpen ? (
          <button
            type="button"
            className="bags-admin-nav-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        {props.children}
      </main>
    </div>
  );
}
