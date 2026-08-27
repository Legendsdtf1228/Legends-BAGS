import prisma from "../db.server";
import { signDesignAccess, verifyDesignAccessToken } from "../domain/security/design-access";
import { buildCartLineProperties } from "../domain/shopify/line-properties";
import { getDesignState } from "../services/design-service";
import type { DesignStateV1 } from "../domain/design/types";

function designResponse(
  shop: string,
  design: {
    id: string;
    currentVersion: number;
    name: string | null;
    status: string;
    productGid: string | null;
    variantGid: string | null;
    sourceDesignId: string | null;
    sourceDesignVersion: number | null;
    sourceOrderId: string | null;
    archived: boolean;
  },
  state: DesignStateV1,
  version: number,
) {
  const { token: accessToken } = signDesignAccess({
    shop,
    designId: design.id,
    version,
  });
  return {
    designId: design.id,
    version,
    status: design.status,
    name: design.name,
    archived: design.archived,
    productGid: design.productGid,
    variantGid: design.variantGid,
    sourceDesignId: design.sourceDesignId,
    sourceDesignVersion: design.sourceDesignVersion,
    sourceOrderId: design.sourceOrderId,
    state,
    accessToken,
    cartProperties: buildCartLineProperties({
      shop,
      designId: design.id,
      version,
      state,
      designName: design.name,
    }),
  };
}

export type DesignApiQuery = {
  version?: number;
  accessToken?: string | null;
  cartPropsOnly?: boolean;
};

/** Resolve shop for design API — design token, or caller-supplied shop (proxy). */
export function resolveDesignApiShop(
  designId: string,
  query: DesignApiQuery,
  shopHint?: string,
): string {
  if (query.accessToken) {
    const claims = verifyDesignAccessToken(query.accessToken);
    if (claims.designId !== designId) {
      throw new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (shopHint && claims.shop !== shopHint) {
      throw new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return claims.shop;
  }
  if (!shopHint) {
    throw new Response(JSON.stringify({ error: "token required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return shopHint;
}

export async function buildDesignApiResponse(
  shop: string,
  designId: string,
  query: DesignApiQuery,
): Promise<Response> {
  try {
    const { design, state } = await getDesignState(shop, designId, query.version);
    const resolvedVersion = query.version ?? design.currentVersion;
    const payload = designResponse(shop, design, state, resolvedVersion);

    if (query.accessToken || query.cartPropsOnly) {
      return Response.json({
        designId: payload.designId,
        version: payload.version,
        designName: payload.name,
        cartProperties: payload.cartProperties,
      });
    }

    const assetIds = [...new Set(state.items.map((i) => i.assetId))];
    const assets = await prisma.asset.findMany({
      where: { shop, id: { in: assetIds } },
    });
    const assetMap = Object.fromEntries(
      assets.map((a) => [
        a.id,
        {
          widthPx: a.widthPx,
          heightPx: a.heightPx,
          dpi: a.dpi,
          contentType: a.contentType,
        },
      ]),
    );
    const jobs = await prisma.renderJob.findMany({
      where: { shop, designId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return Response.json({
      ...designResponse(shop, design, state, resolvedVersion),
      assets: assetMap,
      jobs: jobs.map((j) => ({
        id: j.id,
        status: j.status,
        widthPx: j.widthPx,
        heightPx: j.heightPx,
        lastError: j.lastError,
      })),
    });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}

export function parseDesignApiQuery(request: Request): DesignApiQuery {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get("version");
  return {
    version: versionParam ? Number(versionParam) : undefined,
    accessToken: url.searchParams.get("token"),
    cartPropsOnly: url.searchParams.get("cartProps") === "1",
  };
}
