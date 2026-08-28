import { isRouteErrorResponse, useRouteError } from "react-router";
import { BagsCard } from "./bags-admin-ui";

function shortRef(): string {
  return Math.random().toString(36).slice(2, 10);
}

function friendlyMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    if (typeof error.data === "string") return error.data;
    if (error.data && typeof error.data === "object" && "error" in error.data) {
      const msg = (error.data as { error?: string }).error;
      if (msg) return msg;
    }
    return error.statusText || "The request could not be completed.";
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg.includes("Access denied for publications")) {
      return "Publishing requires the read_publications and write_publications scopes. Reinstall or reauthorize Legends BAGS Dev in your development store, then try again.";
    }
    if (msg.includes("Required access:")) {
      return "This action needs additional app permissions. Reauthorize the development app in Shopify Admin, then retry.";
    }
    if (msg.length > 0 && !msg.includes("\\") && !msg.includes("/app/")) {
      return msg;
    }
  }
  return "Something unexpected happened. Please try again.";
}

function extractRequestId(error: unknown): string {
  if (error && typeof error === "object" && "requestId" in error) {
    const id = (error as { requestId?: unknown }).requestId;
    if (typeof id === "string" && id.length > 0) return id;
  }
  return shortRef();
}

export function BagsAdminErrorBoundary() {
  const error = useRouteError();
  const requestId = extractRequestId(error);

  return (
    <div className="bags-admin-content" style={{ padding: 20 }}>
      <BagsCard title="Something went wrong">
        <p style={{ margin: "0 0 12px", lineHeight: 1.5 }}>{friendlyMessage(error)}</p>
        <p className="bags-admin-muted" style={{ margin: "0 0 16px" }}>
          Reference: <code>{requestId}</code>
        </p>
        <div className="bags-admin-actions">
          <button type="button" className="bags-admin-btn primary" onClick={() => window.location.reload()}>
            Retry
          </button>
          <a href="/app" className="bags-admin-btn ghost">
            Back to dashboard
          </a>
        </div>
      </BagsCard>
    </div>
  );
}
