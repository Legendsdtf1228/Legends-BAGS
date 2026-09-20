import { afterEach, describe, expect, it } from "vitest";
import prisma from "../app/db.server";
import {
  enqueueRenderJob,
  processNextRenderJob,
  recoverStuckJobs,
  resolveRenderJobDesignVersion,
} from "../app/services/design-service";

const shops = ["queue-a.myshopify.com", "queue-b.myshopify.com"];

async function createDesign(shop: string) {
  return prisma.design.create({
    data: {
      shop,
      versions: {
        create: {
          version: 1,
          stateJson: JSON.stringify({
            schemaVersion: 1,
            workflow: "gang_sheet",
            sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
            items: [],
            pricing: { totalCents: 0, areaSqIn: 0, pricePerSqIn: 0.049, currency: "USD" },
            layout: "manual",
          }),
          priceCents: 0,
          areaSqIn: 0,
        },
      },
    },
  });
}

afterEach(async () => {
  await prisma.renderJob.deleteMany({ where: { shop: { in: shops } } });
  await prisma.orderLink.deleteMany({ where: { shop: { in: shops } } });
  await prisma.designVersion.deleteMany({ where: { design: { shop: { in: shops } } } });
  await prisma.design.deleteMany({ where: { shop: { in: shops } } });
});

describe("render queue tenant and retry safety", () => {
  it("deduplicates concurrent active jobs at the database boundary", async () => {
    const design = await createDesign(shops[0]);
    const jobs = await Promise.all([
      enqueueRenderJob({ shop: shops[0], designId: design.id }),
      enqueueRenderJob({ shop: shops[0], designId: design.id }),
    ]);
    expect(jobs[0].id).toBe(jobs[1].id);
    await expect(prisma.renderJob.count({
      where: { shop: shops[0], designId: design.id, status: { in: ["queued", "processing"] } },
    })).resolves.toBe(1);
  });

  it("does not recover or process another shop's queue from a merchant request", async () => {
    const [designA, designB] = await Promise.all(shops.map(createDesign));
    const stale = new Date(Date.now() - 60_000);
    await prisma.renderJob.create({
      data: {
        shop: shops[1],
        designId: designB.id,
        status: "processing",
        leaseExpiresAt: stale,
      },
    });
    await expect(recoverStuckJobs(new Date(), shops[0])).resolves.toBe(0);
    const result = await processNextRenderJob(shops[0]);
    expect(result).toEqual({ ok: false, reason: "empty" });
    await expect(prisma.renderJob.findFirst({
      where: { shop: shops[1], designId: designB.id },
      select: { status: true },
    })).resolves.toEqual({ status: "processing" });
    expect(designA.shop).toBe(shops[0]);
  });

  it("recovers legacy processing jobs that never received a lease", async () => {
    const design = await createDesign(shops[0]);
    const stale = new Date(Date.now() - 20 * 60_000);
    const job = await prisma.renderJob.create({
      data: {
        shop: shops[0],
        designId: design.id,
        status: "processing",
      },
    });
    await prisma.renderJob.update({
      where: { id: job.id },
      data: { updatedAt: stale, leaseExpiresAt: null },
    });

    await expect(recoverStuckJobs(new Date(), shops[0])).resolves.toBe(1);
    await expect(prisma.renderJob.findUnique({
      where: { id: job.id },
      select: { status: true },
    })).resolves.toEqual({ status: "queued" });
  });

  it("pins order renders to the purchased design version", async () => {
    const design = await createDesign(shops[0]);
    const orderLink = await prisma.orderLink.create({
      data: {
        shop: shops[0],
        orderId: "order-1",
        lineItemId: "line-1",
        designId: design.id,
        designVersion: 1,
      },
    });
    await prisma.designVersion.create({
      data: {
        designId: design.id,
        version: 2,
        stateJson: "{}",
        priceCents: 0,
        areaSqIn: 0,
      },
    });
    await prisma.design.update({ where: { id: design.id }, data: { currentVersion: 2 } });
    await expect(resolveRenderJobDesignVersion({
      shop: shops[0],
      designId: design.id,
      orderLinkId: orderLink.id,
    })).resolves.toBe(1);
  });

  it("rejects cross-shop designs and mismatched order links at the queue boundary", async () => {
    const [designA, designB] = await Promise.all(shops.map(createDesign));
    await expect(enqueueRenderJob({
      shop: shops[0],
      designId: designB.id,
    })).rejects.toThrow("Design not found");

    const orderLink = await prisma.orderLink.create({
      data: {
        shop: shops[1],
        orderId: "order-b",
        lineItemId: "line-b",
        designId: designB.id,
        designVersion: 1,
      },
    });
    await expect(enqueueRenderJob({
      shop: shops[0],
      designId: designA.id,
      orderLinkId: orderLink.id,
    })).rejects.toThrow("Order line not found");
  });

  it("fails closed when an order-linked job cannot resolve its purchased version", async () => {
    const design = await createDesign(shops[0]);
    await expect(resolveRenderJobDesignVersion({
      shop: shops[0],
      designId: design.id,
      orderLinkId: "missing-order-link",
    })).rejects.toThrow("Order line not found");
  });
});