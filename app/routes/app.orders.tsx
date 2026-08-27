import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const links = await prisma.orderLink.findMany({
    where: {
      shop: session.shop,
      ...(q
        ? {
            OR: [{ orderId: { contains: q } }, { designId: { contains: q } }],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const designIds = [...new Set(links.map((l) => l.designId))];
  const designs = await prisma.design.findMany({
    where: { id: { in: designIds } },
    select: { id: true, name: true, status: true },
  });
  const byDesign = new Map(designs.map((d) => [d.id, d]));

  const jobs = await prisma.renderJob.findMany({
    where: { shop: session.shop, designId: { in: designIds } },
    orderBy: { updatedAt: "desc" },
  });
  const jobByDesign = new Map<string, (typeof jobs)[number]>();
  for (const j of jobs) {
    if (!jobByDesign.has(j.designId)) jobByDesign.set(j.designId, j);
  }

  return {
    q,
    rows: links.map((l) => ({
      id: l.id,
      orderId: l.orderId,
      orderGid: l.orderGid,
      lineItemId: l.lineItemId,
      designId: l.designId,
      designVersion: l.designVersion,
      designName: byDesign.get(l.designId)?.name,
      designStatus: byDesign.get(l.designId)?.status,
      renderStatus: jobByDesign.get(l.designId)?.status ?? null,
      renderError: jobByDesign.get(l.designId)?.lastError ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
  };
};

export default function OrdersPage() {
  const { rows, q } = useLoaderData<typeof loader>();

  return (
    <>
      <BagsPageHeader title="Orders" subtitle="Shopify orders linked to saved designs" />
      <div className="bags-admin-content">
        <BagsCard>
          <Form method="get" className="bags-admin-actions" style={{ marginBottom: 16 }}>
            <input name="q" type="search" placeholder="Search order or design ID…" defaultValue={q} />
            <button type="submit" className="bags-admin-btn primary">
              Search
            </button>
            {q ? (
              <Link to="/app/orders" className="bags-admin-btn ghost">
                Clear
              </Link>
            ) : null}
          </Form>
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
                  <th>Design status</th>
                  <th>Render</th>
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
                    <td>
                      {row.renderStatus ?? "—"}
                      {row.renderError ? (
                        <div className="bags-admin-muted" style={{ fontSize: 11 }}>
                          {row.renderError.slice(0, 60)}
                        </div>
                      ) : null}
                    </td>
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
