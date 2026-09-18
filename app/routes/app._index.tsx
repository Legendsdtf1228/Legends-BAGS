import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { processNextRenderJob, recoverStuckJobs } from "../services/design-service";
import { ensureShopConfig } from "../lib/merchant-loaders.server";
import { getDashboardPayload, getDashboardStats } from "../lib/merchant-dashboard.server";
import { customerEditorUrls } from "../lib/editor-links.server";
import { BagsDashboardPage } from "../components/merchant/bags-dashboard-page";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const range = (url.searchParams.get("range") || "30d") as import("../lib/merchant-dashboard.server").DashboardRange;
  const config = await ensureShopConfig(shop);

  let dashboard;
  let loadError: string | null = null;
  try {
    dashboard = await getDashboardPayload(shop, range);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Dashboard data unavailable";
    dashboard = { stats: await getDashboardStats(shop, "all"), recentDesigns: [], recentOrders: [] };
  }

  return {
    shop,
    range,
    loadError,
    appUrl: process.env.SHOPIFY_APP_URL || "",
    editors: customerEditorUrls(shop, process.env.SHOPIFY_APP_URL || ""),
    config: config ?? {
      pricePerSqIn: 0.049,
      sheetWidthIn: 22.5,
      maxHeightIn: 360,
      imageMarginIn: 0.15,
      artboardMarginIn: 0.1,
    },
    stats: dashboard.stats,
    recent: dashboard.recentDesigns,
    recentOrders: dashboard.recentOrders,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const form = await request.formData();
  if (String(form.get("intent") || "") === "process_jobs") {
    const recovered = await recoverStuckJobs();
    const result = await processNextRenderJob();
    return { recovered, result };
  }
  return null;
};

export default function MerchantHomePage() {
  const data = useLoaderData<typeof loader>();
  return (
    <BagsDashboardPage
      range={data.range}
      loadError={data.loadError}
      stats={data.stats}
      recent={data.recent}
      recentOrders={data.recentOrders}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
