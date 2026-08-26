import type { ActionFunctionArgs } from "react-router";
import { processNextRenderJob, recoverStuckJobs } from "../services/design-service";

/**
 * Dev worker tick — protected by TEST_API_TOKEN.
 * Production will use a long-running worker process.
 */
export async function action({ request }: ActionFunctionArgs) {
  const token = request.headers.get("X-LGS-Test-Token");
  if (!process.env.TEST_API_TOKEN || token !== process.env.TEST_API_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }
  const recovered = await recoverStuckJobs();
  const result = await processNextRenderJob();
  return Response.json({ recovered, result });
}
