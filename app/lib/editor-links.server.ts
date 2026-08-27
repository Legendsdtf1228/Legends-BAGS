/** Customer-facing editor URLs (open in a new tab from merchant admin). */
export function customerEditorUrls(shop: string, appUrl: string) {
  const base = (appUrl || "").replace(/\/$/, "");
  const q = `shop=${encodeURIComponent(shop)}`;
  return {
    uploadBySize: `${base}/editor/upload-by-size?${q}`,
    gangSheet: `${base}/editor/gang-sheet?${q}`,
  };
}
