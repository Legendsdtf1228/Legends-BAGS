import type { LoaderFunctionArgs } from "react-router";
import { verifyDownloadToken } from "../domain/security/signed-urls";
import { getObjectStore } from "../domain/storage";
import path from "node:path";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response("Missing token", { status: 400 });

  try {
    const claims = verifyDownloadToken(token);
    const store = getObjectStore();
    const bytes = await store.get(claims.objectKey);
    const filename = path.basename(claims.objectKey) || "download.bin";
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    const status = message.includes("expired") ? 403 : 403;
    return new Response(message, { status });
  }
}
