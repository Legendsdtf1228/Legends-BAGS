type AdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

const ONLINE_STORE_PUBLICATION = `#graphql
  query LegendsBagsOnlineStorePublication {
    publications(first: 20) {
      nodes {
        id
        name
      }
    }
  }
`;

const PUBLISH_PRODUCT = `#graphql
  mutation LegendsBagsPublishProduct($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        ... on Product {
          id
          title
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function publishProductToOnlineStore(
  admin: AdminClient,
  productGid: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pubRes = await admin.graphql(ONLINE_STORE_PUBLICATION);
  const pubJson = (await pubRes.json()) as {
    data?: { publications?: { nodes?: Array<{ id: string; name: string }> } };
    errors?: Array<{ message: string }>;
  };

  if (pubJson.errors?.length) {
    return { ok: false, error: pubJson.errors.map((e) => e.message).join("; ") };
  }

  const publication = pubJson.data?.publications?.nodes?.find(
    (p) => p.name === "Online Store" || p.name.toLowerCase().includes("online store"),
  );

  if (!publication?.id) {
    return { ok: false, error: "Online Store publication not found" };
  }

  const res = await admin.graphql(PUBLISH_PRODUCT, {
    variables: {
      id: productGid,
      input: [{ publicationId: publication.id }],
    },
  });
  const json = (await res.json()) as {
    data?: {
      publishablePublish?: {
        userErrors?: Array<{ message: string }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    return { ok: false, error: json.errors.map((e) => e.message).join("; ") };
  }

  const userErrors = json.data?.publishablePublish?.userErrors ?? [];
  if (userErrors.length) {
    return { ok: false, error: userErrors.map((e) => e.message).join("; ") };
  }

  return { ok: true };
}
