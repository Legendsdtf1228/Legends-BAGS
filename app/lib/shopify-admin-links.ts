export function storefrontProductUrl(shop: string, handle: string) {
  return `https://${shop}/products/${handle}`;
}

export function adminProductUrl(shop: string, productGid: string) {
  const id = productGid.replace(/\D/g, "");
  const store = shop.replace(".myshopify.com", "");
  return `https://admin.shopify.com/store/${store}/products/${id}`;
}

export function shopifyOrderAdminUrl(store: string, orderId: string) {
  return `https://admin.shopify.com/store/${store}/orders/${orderId}`;
}
