import type { ActionFunctionArgs } from "react-router";
import { nestRectangles, nestRectanglesPartial } from "../domain/nesting";
import type { DesignStateV1 } from "../domain/design/types";
import { assertTestAccess } from "../domain/security/test-access";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  assertTestAccess(request);
  const body = (await request.json()) as {
    items?: DesignStateV1["items"];
    sheet?: DesignStateV1["sheet"];
    allowRotate90?: boolean;
    /** Soft pack (default true): return fitted + remaining instead of hard-failing on height. */
    soft?: boolean;
  };

  if (!body.items?.length || !body.sheet) {
    return Response.json({ error: "items and sheet required" }, { status: 400 });
  }

  const soft = body.soft !== false;

  try {
    if (soft) {
      const nest = nestRectanglesPartial(body.items, body.sheet, {
        allowRotate90: body.allowRotate90 === true,
      });
      return Response.json({
        sheetWidthIn: nest.sheetWidthIn,
        sheetHeightIn: nest.sheetHeightIn,
        placements: nest.placements,
        utilization: nest.utilization,
        fittedCount: nest.fittedCount,
        remainingCount: nest.remainingCount,
        remainingAssetIds: nest.remainingAssetIds,
        requiredHeightIn: nest.requiredHeightIn,
      });
    }

    const nest = nestRectangles(body.items, body.sheet, {
      allowRotate90: body.allowRotate90 === true,
    });
    return Response.json({
      sheetWidthIn: nest.sheetWidthIn,
      sheetHeightIn: nest.sheetHeightIn,
      placements: nest.placements,
      utilization: nest.utilization,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nest failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
