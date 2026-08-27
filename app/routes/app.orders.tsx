import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const links = await prisma.orderLink.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const designIds = [...new Set(links.map((l) => l.designId))];
  const designs = await prisma.design.findMany({
    where: { id: { in: designIds } },
    select: { id: true, name: true, status: true },
  });
  const byDesign = new Map(designs.map((d) => [d.id, d]));

  return {
    rows: links.map((l) => ({
      id: l.id,
      orderId: l.orderId,
      orderGid: l.orderGid,
      lineItemId: l.lineItemId,
      designId: l.designId,
      designVersion: l.designVersion,
      designName: byDesign.get(l.designId)?.name,
      designStatus: byDesign.get(l.designId)?.status,
      createdAt: l.createdAt.toISOString(),
    })),
  };
};

export default function OrdersPage() {
  const { rows } = useLoaderData<typeof loader>();

  return (
    <>
      <BagsPageHeader title="Orders" subtitle="Shopify orders linked to saved designs" />
      <div className="bags-admin-content">
        <BagsCard>
          {rows.length === 0 ? (
            <p className="bags-admin-muted">No linked orders yet. Place a dev-store checkout to test.</p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Line</th>
                  <th>Design</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Linked</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.orderId}</td>
                    <td style={{ fontSize: 11 }}>{row.lineItemId}</td>
                    <td>
                      <Link to={`/app/designs/${row.designId}`}>
                        {row.designName || row.designId.slice(0, 12) + "…"}
                      </Link>
                    </td>
                    <td>v{row.designVersion}</td>
                    <td>{row.designStatus ?? "—"}</td>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
