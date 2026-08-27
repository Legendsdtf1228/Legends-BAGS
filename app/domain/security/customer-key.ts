export const CUSTOMER_KEY_COOKIE = "lgs_customer_key";

/** Normalize Shopify customer id or guest id into a stable library key. */
export function normalizeCustomerKey(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (value.startsWith("gid://shopify/Customer/")) return value;
  if (value.startsWith("guest:")) return value.length > 6 ? value : null;
  if (/^\d+$/.test(value)) return shopifyCustomerKey(value);
  return guestCustomerKey(value);
}

export function shopifyCustomerKey(customerId: string | number): string {
  const id = String(customerId).replace(/\D/g, "") || String(customerId);
  return `gid://shopify/Customer/${id}`;
}

export function guestCustomerKey(guestId: string): string {
  return `guest:${guestId.trim()}`;
}
