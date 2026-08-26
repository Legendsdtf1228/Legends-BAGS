import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const designs = await prisma.design.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const jobs = await prisma.renderJob.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const jobByDesign = new Map(jobs.map((j) => [j.designId, j]));

  return {
    shop,
    rows: designs.map((d) => {
      const job = jobByDesign.get(d.id);
      return {
        id: d.id,
        status: d.status,
        updatedAt: d.updatedAt.toISOString(),
        jobStatus: job?.status ?? null,
        lastError: job?.lastError ?? null,
        widthPx: job?.widthPx ?? null,
        heightPx: job?.heightPx ?? null,
      };
    }),
  };
};

export default function OrdersDashboard() {
  const { rows } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Gang sheets">
      <s-section heading="Designs & processing">
        <s-paragraph>
          Upload-by-Size designs linked from development checkouts. Status covers
          draft through render completion. Failed jobs can be retried from the
          design detail page.
        </s-paragraph>
        {rows.length === 0 ? (
          <s-paragraph>No designs yet for this shop.</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Design</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header>Job</s-table-header>
              <s-table-header>Output px</s-table-header>
              <s-table-header>Updated</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {rows.map((row) => (
                <s-table-row key={row.id}>
                  <s-table-cell>
                    <Link to={`/app/designs/${row.id}`}>{row.id}</Link>
                  </s-table-cell>
                  <s-table-cell>{row.status}</s-table-cell>
                  <s-table-cell>
                    {row.jobStatus ?? "—"}
                    {row.lastError ? ` (${row.lastError})` : ""}
                  </s-table-cell>
                  <s-table-cell>
                    {row.widthPx && row.heightPx
                      ? `${row.widthPx}×${row.heightPx}`
                      : "—"}
                  </s-table-cell>
                  <s-table-cell>{row.updatedAt}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
