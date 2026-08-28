import type { ReactNode } from "react";

export type IntegrationProvider = "canva" | "dropbox" | "gallery";

export type IntegrationStatus = "loading" | "disconnected" | "empty" | "error" | "ready";

export type BagsIntegrationPanelProps = {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  error?: string;
  onRetry?: () => void;
  onConnect?: () => void;
  children?: ReactNode;
};

const LABELS: Record<IntegrationProvider, { title: string; connect: string; empty: string }> = {
  canva: {
    title: "Canva",
    connect: "Connect Canva to import designs directly into your gang sheet.",
    empty: "Canva is connected but no designs were returned yet.",
  },
  dropbox: {
    title: "Dropbox",
    connect: "Connect Dropbox to browse and import images from your folders.",
    empty: "Dropbox is connected but this folder is empty.",
  },
  gallery: {
    title: "Gallery",
    connect: "Gallery requires merchant artwork configured in Gallery Settings.",
    empty: "No gallery artwork yet. Add images in Gallery Settings — not sample placeholders.",
  },
};

export function BagsIntegrationPanel(props: BagsIntegrationPanelProps) {
  const { provider, status, error, onRetry, onConnect, children } = props;
  const meta = LABELS[provider];

  return (
    <>
      <div className="heading">
        <span>
          <strong>{meta.title}</strong>
          <small>
            {status === "loading"
              ? "Loading…"
              : status === "disconnected"
                ? "Not connected"
                : status === "error"
                  ? "Error"
                  : status === "empty"
                    ? "Empty"
                    : "Ready"}
          </small>
        </span>
      </div>

      {status === "loading" ? <p className="sidebar-empty">Loading {meta.title}…</p> : null}

      {status === "disconnected" ? (
        <div className="bags-modal-connect">
          <p>{meta.connect}</p>
          {onConnect ? (
            <button type="button" className="bags-btn bags-btn-primary" onClick={onConnect}>
              Connect {meta.title}
            </button>
          ) : (
            <p className="sidebar-hint">OAuth credentials are not configured for this shop.</p>
          )}
        </div>
      ) : null}

      {status === "error" ? (
        <p className="gs-save-error">
          {error ?? `Could not load ${meta.title}.`}
          {onRetry ? (
            <>
              {" "}
              <button type="button" className="gs-ghost-btn" onClick={onRetry}>
                Retry
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      {status === "empty" ? <p className="sidebar-empty">{meta.empty}</p> : null}

      {status === "ready" ? children : null}
    </>
  );
}
