import type { ActionFunctionArgs } from "react-router";
import type { Archiver } from "archiver";
import { createRequire } from "node:module";
import { PassThrough } from "node:stream";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getObjectStore } from "../domain/storage";

const require = createRequire(import.meta.url);
const archiver = require("archiver") as (
  format: string,
  options?: { zlib?: { level?: number } },
) => Archiver;

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const designIds = form
    .getAll("designId")
    .map(String)
    .filter(Boolean)
    .slice(0, 50);

  if (!designIds.length) {
    return new Response("Select at least one design.", { status: 400 });
  }

  const designs = await prisma.design.findMany({
    where: { shop: session.shop, id: { in: designIds } },
    select: { id: true, name: true },
  });
  const byId = new Map(designs.map((d) => [d.id, d]));

  const stream = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("error", (err: Error) => stream.destroy(err));
  archive.pipe(stream);

  const store = getObjectStore();
  let added = 0;
  for (const designId of designIds) {
    const job = await prisma.renderJob.findFirst({
      where: {
        shop: session.shop,
        designId,
        status: "completed",
        outputKey: { not: null },
      },
      orderBy: { finishedAt: "desc" },
    });
    if (!job?.outputKey) continue;
    const bytes = await store.get(job.outputKey);
    const label = byId.get(designId)?.name?.replace(/[^\w.-]+/g, "_") || designId.slice(0, 12);
    archive.append(bytes, { name: `${label}.png` });
    added++;
  }

  if (!added) {
    archive.abort();
    return new Response("No completed print files for the selected designs.", { status: 400 });
  }

  void archive.finalize();

  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="legends-designs-${Date.now()}.zip"`,
    },
  });
};
