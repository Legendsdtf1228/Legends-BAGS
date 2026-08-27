import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { BAGS_ADMIN_NAV, isNavActive } from "./bags-admin-nav";
import { BAGS_NAV_ICONS } from "./bags-admin-icons";
import { bagsAdminStyles } from "./bags-admin-ui";

const SECTION_LABELS: Record<string, string> = {
  main: "Main",
  builders: "Builder settings",
  settings: "Install",
};

export function BagsAdminShell(props: { shop?: string; children: ReactNode }) {
  const { pathname } = useLocation();
  const sections = ["main", "builders", "settings"] as const;

  return (
    <div className="bags-admin-shell">
      <style>{bagsAdminStyles}</style>
      <aside className="bags-admin-sidebar" aria-label="Legends BAGS navigation">
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
                    >
                      <span className="bags-admin-nav-icon" aria-hidden>
                        {Icon ? Icon() : null}
                      </span>
                      {item.label}
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
            <div style={{ marginTop: 4, opacity: 0.85 }}>Merchant admin</div>
          </div>
        ) : null}
      </aside>
      <div className="bags-admin-main">{props.children}</div>
    </div>
  );
}
