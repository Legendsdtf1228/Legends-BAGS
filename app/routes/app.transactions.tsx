import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { listAuditEvents } from "../services/audit-service";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const events = await listAuditEvents(session.shop, {
    limit: 150,
    action: url.searchParams.get("action") || undefined,
    entityType: url.searchParams.get("entity") || undefined,
  });
  return { events, filters: { action: url.searchParams.get("action") ?? "", entity: url.searchParams.get("entity") ?? "" } };
};

export default function TransactionsPage() {
  const { events, filters } = useLoaderData<typeof loader>();

  return (
    <>
      <BagsPageHeader title="Activity" subtitle="Audit trail for designs, renders, orders, and configuration" />
      <div className="bags-admin-content">
        <BagsCard>
          <Form method="get" className="bags-admin-actions" style={{ marginBottom: 16 }}>
            <input name="action" placeholder="Filter action…" defaultValue={filters.action} />
            <input name="entity" placeholder="Entity type…" defaultValue={filters.entity} />
            <button type="submit" className="bags-admin-btn primary">
              Filter
            </button>
          </Form>
          {events.length === 0 ? (
            <p className="bags-admin-muted">No activity recorded yet.</p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Actor</th>
                  <th>Event</th>
                  <th>Resource</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.createdAt).toLocaleString()}</td>
                    <td>{e.actorType}</td>
                    <td>{e.action}</td>
                    <td>
                      {e.entityType} · {e.entityId.slice(0, 10)}…
                    </td>
                    <td style={{ fontSize: 11, maxWidth: 280, wordBreak: "break-all" }}>{e.metaJson}</td>
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
