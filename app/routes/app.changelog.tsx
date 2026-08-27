import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";
import releaseNotes from "../../docs/release-notes.json";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { releaseNotes };
};

export default function ChangelogPage() {
  const { releaseNotes } = useLoaderData<typeof loader>();

  return (
    <>
      <BagsPageHeader title="Changelog" subtitle={`Legends BAGS v${releaseNotes.version}`} />
      <div className="bags-admin-content">
        {releaseNotes.releases.map((release) => (
          <BagsCard key={release.date} title={`${release.date} — ${release.title}`} style={{ marginBottom: 16 }}>
            {release.features?.length ? (
              <>
                <strong>Features</strong>
                <ul style={{ paddingLeft: 18 }}>
                  {release.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {release.fixes?.length ? (
              <>
                <strong>Fixes</strong>
                <ul style={{ paddingLeft: 18 }}>
                  {release.fixes.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </BagsCard>
        ))}
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
