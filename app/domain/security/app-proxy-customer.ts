import { normalizeCustomerKey } from "./customer-key";

export type AppProxyCustomerIdentity = {
  customerKey: string | null;
  customerName: string | null;
  customerEmail: string | null;
};

/**
 * Read customer identity from a verified Shopify app-proxy request.
 * Customer ID comes from the signed `logged_in_customer_id` param.
 * Name/email from Liquid are accepted only when customerKey matches that ID.
 */
export function readAppProxyCustomerFromRequest(request: Request): AppProxyCustomerIdentity {
  const url = new URL(request.url);
  const loggedInRaw = url.searchParams.get("logged_in_customer_id")?.trim() ?? "";
  const loggedInNumeric = loggedInRaw.replace(/\D/g, "");
  const customerKey = loggedInNumeric
    ? `gid://shopify/Customer/${loggedInNumeric}`
    : null;

  const requestedKey = normalizeCustomerKey(url.searchParams.get("customerKey"));
  if (customerKey && requestedKey && requestedKey !== customerKey) {
    return { customerKey, customerName: null, customerEmail: null };
  }

  if (!customerKey) {
    return { customerKey: null, customerName: null, customerEmail: null };
  }

  return {
    customerKey,
    customerName: url.searchParams.get("customerName")?.trim() || null,
    customerEmail: url.searchParams.get("customerEmail")?.trim() || null,
  };
}
