import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";
import releaseNotes from "../../docs/release-notes.json";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const [config, webhookCount, failedJobs, queuedJobs] = await Promise.all([
    prisma.shopConfig.findUnique({ where: { shop } }),
    prisma.webhookDelivery.count({ where: { shop } }),
    prisma.renderJob.count({ where: { shop, status: "failed" } }),
    prisma.renderJob.count({ where: { shop, status: "queued" } }),
  ]);

  return {
    shop,
    appUrl: process.env.SHOPIFY_APP_URL || "",
    appVersion: releaseNotes.version,
    dbStatus: "connected",
    webhookCount,
    failedJobs,
    queuedJobs,
    hasConfig: Boolean(config),
  };
};

export default function SupportPage() {
  const data = useLoaderData<typeof loader>();

  const diagnostics = [
    `Store: ${data.shop}`,
    `App version: ${data.appVersion}`,
    `Host: ${data.appUrl || "(not set)"}`,
    `Database: ${data.dbStatus}`,
    `Webhooks processed: ${data.webhookCount}`,
    `Queued renders: ${data.queuedJobs}`,
    `Failed renders: ${data.failedJobs}`,
    `Shop config: ${data.hasConfig ? "yes" : "missing"}`,
  ].join("\n");

  return (
    <>
      <BagsPageHeader title="Support" subtitle="Documentation links and safe diagnostics" />
      <div className="bags-admin-content">
        <BagsCard title="Documentation">
          <ul className="bags-admin-muted" style={{ paddingLeft: 18 }}>
            <li>
              <a href="https://github.com/Legendsdtf1228/Legends-BAGS" target="_blank" rel="noreferrer">
                Repository & README
              </a>
            </li>
            <li>Merchant setup: /app/setup</li>
            <li>Theme blocks: Upload by Size & Gang Sheet Builder</li>
          </ul>
        </BagsCard>
        <BagsCard title="Diagnostics (no secrets)" style={{ marginTop: 16 }}>
          <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>{diagnostics}</pre>
          <button
            type="button"
            className="bags-admin-btn ghost"
            style={{ marginTop: 12 }}
            onClick={() => void navigator.clipboard.writeText(diagnostics)}
          >
            Copy diagnostics
          </button>
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
