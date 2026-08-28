import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { NavMenu } from "@shopify/app-bridge-react";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { BagsAdminShell } from "../components/merchant/bags-admin-shell";
import { BagsAdminErrorBoundary } from "../components/merchant/bags-admin-error";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  return {
    apiKey,
    shop: session.shop,
    appUrl: process.env.SHOPIFY_APP_URL || "",
  };
};

export default function App() {
  const { apiKey, shop } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Legends BAGS
        </Link>
      </NavMenu>
      <BagsAdminShell shop={shop}>
        <Outlet />
      </BagsAdminShell>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return <BagsAdminErrorBoundary />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
