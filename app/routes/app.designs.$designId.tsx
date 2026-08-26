import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { signDownload } from "../domain/security/signed-urls";
import {
  enqueueRenderJob,
  getDesignState,
  processNextRenderJob,
} from "../services/design-service";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const designId = params.designId!;
  const { design, state } = await getDesignState(shop, designId);
  const jobs = await prisma.renderJob.findMany({
    where: { shop, designId },
    orderBy: { createdAt: "desc" },
  });

  const latest = jobs[0];
  let downloadPath: string | null = null;
  let previewPath: string | null = null;
  if (latest?.outputKey) {
    const { token } = signDownload({ shop, objectKey: latest.outputKey });
    downloadPath = `/api/files/download?token=${encodeURIComponent(token)}`;
  }
  if (latest?.previewKey) {
    const { token } = signDownload({ shop, objectKey: latest.previewKey });
    previewPath = `/api/files/download?token=${encodeURIComponent(token)}`;
  }

  return {
    design: {
      id: design.id,
      status: design.status,
      version: design.currentVersion,
    },
    state,
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      attempt: j.attempt,
      lastError: j.lastError,
      widthPx: j.widthPx,
      heightPx: j.heightPx,
      sheetWidthIn: j.sheetWidthIn,
      sheetHeightIn: j.sheetHeightIn,
    })),
    downloadPath,
    previewPath,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const designId = params.designId!;
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "retry") {
    await enqueueRenderJob({ shop, designId });
    await processNextRenderJob();
  }

  return null;
};

export default function DesignDetail() {
  const data = useLoaderData<typeof loader>();
  return (
    <s-page heading="Design">
      <s-section heading={data.design.id}>
        <s-paragraph>
          Status: {data.design.status} · Version: {data.design.version}
        </s-paragraph>
        <s-paragraph>
          Area: {data.state.pricing.areaSqIn} in² · Price: $
          {(data.state.pricing.totalCents / 100).toFixed(2)}
        </s-paragraph>
        {data.previewPath ? (
          <s-paragraph>
            <a href={data.previewPath}>Preview (signed)</a>
          </s-paragraph>
        ) : null}
        {data.downloadPath ? (
          <s-paragraph>
            <a href={data.downloadPath}>Download print PNG (signed)</a>
          </s-paragraph>
        ) : null}
        <Form method="post">
          <input type="hidden" name="intent" value="retry" />
          <s-button type="submit">Retry / regenerate</s-button>
        </Form>
      </s-section>
      <s-section heading="Jobs">
        <s-unordered-list>
          {data.jobs.map((j) => (
            <s-list-item key={j.id}>
              {j.id} — {j.status} (attempt {j.attempt})
              {j.widthPx ? ` · ${j.widthPx}×${j.heightPx}px` : ""}
              {j.sheetWidthIn
                ? ` · ${j.sheetWidthIn}×${j.sheetHeightIn} in`
                : ""}
              {j.lastError ? ` · ${j.lastError}` : ""}
            </s-list-item>
          ))}
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
