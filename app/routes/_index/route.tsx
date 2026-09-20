import type { CSSProperties } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || process.env.DEV_SHOP || "";
  const isEmbeddedLaunch =
    url.searchParams.has("host") ||
    url.searchParams.get("embedded") === "1" ||
    url.searchParams.has("id_token");

  if (shop && isEmbeddedLaunch) {
    throw redirect(`/app${url.search}`);
  }

  return {
    shop,
    query: url.search,
    appUrl: process.env.SHOPIFY_APP_URL || url.origin,
  };
};

export default function Landing() {
  const { shop, appUrl, query } = useLoaderData<typeof loader>();
  return (
    <main style={page}>
      <h1 style={{ marginTop: 0 }}>Legends BAGS</h1>
      <p>Development app for Legends DTF gang sheets (Upload-by-Size first).</p>
      <p style={{ opacity: 0.75 }}>
        Open the embedded Admin app from the Shopify Admin apps menu, or continue
        to:
      </p>
      <p>
        <a href={`/app${query || (shop ? `?shop=${encodeURIComponent(shop)}` : "")}`}>
          Merchant dashboard
        </a>
      </p>
      <p>
        <a href={`/editor/upload-by-size?shop=${encodeURIComponent(shop)}`}>
          Upload-by-Size editor
        </a>
        {" · "}
        <a href={`/editor/gang-sheet?shop=${encodeURIComponent(shop)}`}>
          Gang sheet builder
        </a>
      </p>
      <p style={{ fontSize: 13, opacity: 0.7 }}>App URL: {appUrl}</p>
    </main>
  );
}

const page: CSSProperties = {
  fontFamily: "Georgia, Times New Roman, serif",
  padding: 40,
  maxWidth: 640,
  margin: "0 auto",
};
