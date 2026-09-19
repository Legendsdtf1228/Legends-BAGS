import { signDownload } from "../domain/security/signed-urls";

export const SIGNED_FILE_DOWNLOAD_PATH = "/api/files/download";

export const FULFILLMENT_FILTERS = ["fulfilled", "unfulfilled", "unknown"] as const;
export type FulfillmentFilter = (typeof FULFILLMENT_FILTERS)[number];
export type FulfillmentBucket = FulfillmentFilter;

/** Shopify REST stores unfulfilled as null; treat empty the same. */
export function fulfillmentBucket(
  status: string | null | undefined,
): FulfillmentBucket {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "fulfilled") return "fulfilled";
  if (!normalized || normalized === "unfulfilled" || normalized === "partial") {
    return "unfulfilled";
  }
  return "unknown";
}

export function parseFulfillmentFilter(raw: string | null | undefined): FulfillmentFilter | "" {
  const value = (raw ?? "").trim().toLowerCase();
  return (FULFILLMENT_FILTERS as readonly string[]).includes(value)
    ? (value as FulfillmentFilter)
    : "";
}

export function matchesFulfillmentFilter(
  status: string | null | undefined,
  filter: string,
): boolean {
  const parsed = parseFulfillmentFilter(filter);
  if (!parsed) return true;
  return fulfillmentBucket(status) === parsed;
}

export function filterOrderRowsByFulfillment<T extends { fulfillmentStatus?: string | null }>(
  rows: T[],
  filter: string,
): T[] {
  if (!parseFulfillmentFilter(filter)) return rows;
  return rows.filter((row) => matchesFulfillmentFilter(row.fulfillmentStatus, filter));
}

/** HMAC download URL used by design detail and merchant orders. */
export function signedFileDownloadPath(
  shop: string,
  objectKey: string,
  secret?: string,
): string {
  const { token } = signDownload({ shop, objectKey }, secret);
  return `${SIGNED_FILE_DOWNLOAD_PATH}?token=${encodeURIComponent(token)}`;
}

export function orderRowDownloadPath(
  shop: string,
  outputKey: string | null | undefined,
  secret?: string,
): string | null {
  if (!outputKey) return null;
  return signedFileDownloadPath(shop, outputKey, secret);
}
