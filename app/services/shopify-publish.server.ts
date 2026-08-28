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
          publishedOnCurrentPublication
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_PUBLICATION_STATUS = `#graphql
  query LegendsBagsProductPublication($id: ID!) {
    product(id: $id) {
      id
      handle
      publishedOnCurrentPublication
      status
    }
  }
`;

export type AdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

function graphqlErrors(json: { errors?: Array<{ message: string }> }): string | null {
  if (!json.errors?.length) return null;
  return json.errors.map((e) => e.message).join("; ");
}

export async function publishProductToOnlineStore(
  admin: AdminClient,
  productGid: string,
): Promise<{ ok: true; handle?: string } | { ok: false; error: string }> {
  try {
    const pubRes = await admin.graphql(ONLINE_STORE_PUBLICATION);
    const pubJson = (await pubRes.json()) as {
      data?: { publications?: { nodes?: Array<{ id: string; name: string }> } };
      errors?: Array<{ message: string }>;
    };

    const pubErr = graphqlErrors(pubJson);
    if (pubErr) return { ok: false, error: pubErr };

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

    const err = graphqlErrors(json);
    if (err) return { ok: false, error: err };

    const userErrors = json.data?.publishablePublish?.userErrors ?? [];
    if (userErrors.length) {
      return { ok: false, error: userErrors.map((e) => e.message).join("; ") };
    }

    const verify = await verifyProductOnOnlineStore(admin, productGid);
    if (!verify.published) {
      return { ok: false, error: verify.error ?? "Product is not visible on Online Store yet." };
    }

    return { ok: true, handle: verify.handle };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return { ok: false, error: message };
  }
}

export async function verifyProductOnOnlineStore(
  admin: AdminClient,
  productGid: string,
): Promise<{ published: boolean; handle?: string; error?: string }> {
  try {
    const res = await admin.graphql(PRODUCT_PUBLICATION_STATUS, {
      variables: { id: productGid },
    });
    const json = (await res.json()) as {
      data?: {
        product?: {
          handle?: string;
          publishedOnCurrentPublication?: boolean;
          status?: string;
        };
      };
      errors?: Array<{ message: string }>;
    };
    const err = graphqlErrors(json);
    if (err) return { published: false, error: err };
    const product = json.data?.product;
    if (!product) return { published: false, error: "Product not found in Shopify." };
    return {
      published: Boolean(product.publishedOnCurrentPublication),
      handle: product.handle,
      error: product.publishedOnCurrentPublication
        ? undefined
        : `Product "${product.handle ?? productGid}" is not published to Online Store.`,
    };
  } catch (err) {
    return {
      published: false,
      error: err instanceof Error ? err.message : "Could not verify publication status.",
    };
  }
}
