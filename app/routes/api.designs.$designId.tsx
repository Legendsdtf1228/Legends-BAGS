import type { LoaderFunctionArgs } from "react-router";
import { getDesignState } from "../services/design-service";
import prisma from "../db.server";

function assertTestAccess(request: Request) {
  const shop = request.headers.get("X-LGS-Shop");
  const token = request.headers.get("X-LGS-Test-Token");
  const expected = process.env.TEST_API_TOKEN;
  if (!expected || token !== expected) {
    throw new Response("Unauthorized", { status: 401 });
  }
  if (!shop) throw new Response("Missing shop", { status: 400 });
  return shop;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const shop = assertTestAccess(request);
  const designId = params.designId;
  if (!designId) throw new Response("Not found", { status: 404 });

  try {
    const { design, state } = await getDesignState(shop, designId);
    const jobs = await prisma.renderJob.findMany({
      where: { shop, designId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return Response.json({
      designId: design.id,
      status: design.status,
      version: design.currentVersion,
      state,
      jobs: jobs.map((j) => ({
        id: j.id,
        status: j.status,
        attempt: j.attempt,
        widthPx: j.widthPx,
        heightPx: j.heightPx,
        sheetWidthIn: j.sheetWidthIn,
        sheetHeightIn: j.sheetHeightIn,
        lastError: j.lastError,
      })),
    });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
