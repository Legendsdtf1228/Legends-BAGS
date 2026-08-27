import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { assertCustomerApiAccess } from "../domain/security/test-access";
import { getObjectStore } from "../domain/storage";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const shop = assertCustomerApiAccess(request);
  const asset = await prisma.asset.findFirst({ where: { id: params.assetId, shop } });
  if (!asset) throw new Response("Not found", { status: 404 });
  const bytes = await getObjectStore().get(asset.storageKey);
  return new Response(Uint8Array.from(bytes), {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": "inline",
    },
  });
}
