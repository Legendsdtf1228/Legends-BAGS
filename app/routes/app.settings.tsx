import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  BagsAlert,
  BagsCard,
  BagsPageBody,
  BagsPageHeader,
  BagsStatusBadge,
} from "../components/merchant/bags-admin-ui";
import { studioBridgePresent } from "../lib/studio-builder.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [config, products] = await Promise.all([
    prisma.shopConfig.findUnique({ where: { shop: session.shop } }),
    prisma.productBinding.count({ where: { shop: session.shop } }),
  ]);
  return {
    shop: session.shop,
    products,
    configured: Boolean(config),
    studioEnabled: studioBridgePresent(),
  };
};

const sections = [
  { to: "/app/general", title: "General", description: "Shop-wide pricing and sheet defaults.", icon: "01" },
  { to: "/app/appearance", title: "Branding", description: "Customer-facing logos, colors, labels, and live preview.", icon: "02" },
  { to: "/app/gangsheet-builder", title: "Builder", description: "Gang sheet sizes, margins, and launch behavior.", icon: "03" },
  { to: "/app/production", title: "Production", description: "Printer-agnostic output dimensions, DPI, and limits.", icon: "04" },
  { to: "/app/integrations", title: "Integrations", description: "Shopify and Gang Sheet Studio connection readiness.", icon: "05" },
] as const;

export default function SettingsPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <BagsPageHeader title="Settings" subtitle="Configure your shop, customer experience, and production workflow" />
      <div className="bags-admin-content">
        <BagsPageBody>
          {!data.configured ? (
            <BagsAlert tone="warning" title="Setup required">
              Save General settings before connecting builder products.
            </BagsAlert>
          ) : null}
          <div className="bags-settings-overview">
            {sections.map((section) => (
              <Link key={section.to} to={section.to} className="bags-settings-card">
                <span>{section.icon}</span>
                <div>
                  <strong>{section.title}</strong>
                  <p>{section.description}</p>
                </div>
                <b aria-hidden>→</b>
              </Link>
            ))}
          </div>
          <BagsCard title="Readiness" style={{ marginTop: 16 }}>
            <div className="bags-readiness-grid">
              <div><span>Shopify shop</span><strong>{data.shop}</strong><BagsStatusBadge status="connected" /></div>
              <div><span>Builder products</span><strong>{data.products}</strong><BagsStatusBadge status={data.products ? "configured" : "missing"} /></div>
              <div><span>Gang Sheet Studio</span><strong>{data.studioEnabled ? "Connected" : "Missing"}</strong><BagsStatusBadge status={data.studioEnabled ? "configured" : "missing"} /></div>
            </div>
          </BagsCard>
        </BagsPageBody>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);