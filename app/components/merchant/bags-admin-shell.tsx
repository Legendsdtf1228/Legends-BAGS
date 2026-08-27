import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { BAGS_ADMIN_NAV, isNavActive } from "./bags-admin-nav";
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
          <strong>LEGENDS DTF PRINTS</strong>
          <span>
            <em>Legends</em> BAGS
          </span>
        </div>
        <nav className="bags-admin-nav">
          {sections.map((section) => {
            const items = BAGS_ADMIN_NAV.filter((item) => item.section === section);
            if (!items.length) return null;
            return (
              <div key={section} className="bags-admin-nav-group">
                <div className="bags-admin-nav-label">{SECTION_LABELS[section]}</div>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    className={`bags-admin-nav-link${isNavActive(pathname, item) ? " active" : ""}`}
                  >
                    <span className="bags-admin-nav-icon" aria-hidden>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        {props.shop ? (
          <div style={{ padding: "12px 16px 16px", fontSize: 11, color: "#6b7280" }}>{props.shop}</div>
        ) : null}
      </aside>
      <div className="bags-admin-main">{props.children}</div>
    </div>
  );
}
