import type { ActionFunctionArgs } from "react-router";
import { quoteUploadBySize } from "../services/design-service";
import type { SizeInput } from "../domain/pricing";
import { assertTestAccess } from "../domain/security/test-access";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const shop = assertTestAccess(request);
  const body = (await request.json()) as {
    uploads?: Array<{ assetId: string; size: SizeInput }>;
  };

  if (!body.uploads?.length) {
    return Response.json({ error: "uploads required" }, { status: 400 });
  }

  try {
    const quote = await quoteUploadBySize({ shop, uploads: body.uploads });
    return Response.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
