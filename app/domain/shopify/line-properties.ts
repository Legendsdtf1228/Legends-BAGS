import {
  CART_DESIGN_ID_PROPERTY,
  CART_DESIGN_VERSION_PROPERTY,
} from "../design/types";

export type ShopifyLineItem = {
  id: number | string;
  properties?: Array<{ name: string; value: string }> | Record<string, string>;
};

export function readLineProperty(
  properties: ShopifyLineItem["properties"],
  key: string,
): string | undefined {
  if (!properties) return undefined;
  if (Array.isArray(properties)) {
    return properties.find((p) => p.name === key)?.value;
  }
  return properties[key];
}

export function extractDesignLines(lineItems: ShopifyLineItem[] | undefined) {
  if (!lineItems?.length) return [];
  return lineItems
    .map((li) => {
      const designId = readLineProperty(li.properties, CART_DESIGN_ID_PROPERTY);
      if (!designId) return null;
      const versionRaw = readLineProperty(
        li.properties,
        CART_DESIGN_VERSION_PROPERTY,
      );
      return {
        lineItemId: String(li.id),
        designId,
        designVersion: versionRaw ? Number(versionRaw) : undefined,
      };
    })
    .filter(Boolean) as Array<{
    lineItemId: string;
    designId: string;
    designVersion?: number;
  }>;
}
