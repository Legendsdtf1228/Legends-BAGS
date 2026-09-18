/** Shared Studio chrome primitives. Prefer these class names when unifying later surfaces.
 *
 *  gs-primary-btn   Large gold CTA (Save & Add to Cart)
 *  gs-secondary-btn Quiet filled control on dark chrome
 *  gs-ghost-btn     Hairline border, compact
 *  gs-icon-btn      32×32 toolbar icon
 *  gs-danger-btn    Destructive, not decorative
 *  gs-panel-card    Light functional panel surface
 *  heading          Compact panel section header
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type StudioButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "icon";

const VARIANT_CLASS: Record<StudioButtonVariant, string> = {
  primary: "gs-primary-btn",
  secondary: "gs-secondary-btn",
  ghost: "gs-ghost-btn",
  danger: "gs-danger-btn",
  icon: "gs-icon-btn",
};

export type StudioButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: StudioButtonVariant;
};

export function StudioButton({ variant = "secondary", className, type, ...props }: StudioButtonProps) {
  const cls = `${VARIANT_CLASS[variant]}${className ? ` ${className}` : ""}`;
  return <button type={type ?? "button"} className={cls} {...props} />;
}

export function StudioBrandMark() {
  return (
    <span className="gs-command-logo" aria-hidden>
      L
    </span>
  );
}

export function StudioBrandLockup(props: { title?: string; subtitle?: string }) {
  return (
    <div className="gs-command-brand">
      <StudioBrandMark />
      <span className="gs-command-brand-text">
        <strong>{props.title ?? "LEGENDS"}</strong>
        <small>{props.subtitle ?? "Gang Sheet Studio"}</small>
      </span>
    </div>
  );
}

export function StudioPanelHeader(props: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="heading">
      <span>
        <strong>{props.title}</strong>
        {props.subtitle ? <small>{props.subtitle}</small> : null}
      </span>
      {props.trailing}
    </div>
  );
}
