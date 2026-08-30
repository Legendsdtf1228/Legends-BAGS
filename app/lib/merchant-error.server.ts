import { createRequestId } from "./request-context.server";

/** Strip stack traces and file paths from admin action failures. */
export function merchantActionError(
  err: unknown,
  fallback = "The action could not be completed.",
): { error: string; requestId: string } {
  const requestId = createRequestId();
  if (err instanceof Error) {
    const msg = err.message.trim();
    if (msg.includes("Access denied for publications")) {
      return {
        error:
          "Publishing requires read_publications and write_publications. Reauthorize Legends BAGS Dev in the development store, then retry.",
        requestId,
      };
    }
    if (msg.includes("Required access:")) {
      return {
        error:
          "This action needs additional app permissions. Reauthorize the development app in Shopify Admin, then retry.",
        requestId,
      };
    }
    if (msg && !msg.includes("\\") && !msg.includes("/app/")) {
      return { error: msg, requestId };
    }
  }
  return { error: fallback, requestId };
}
