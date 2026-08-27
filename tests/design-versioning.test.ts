import { describe, expect, it, beforeEach } from "vitest";
import prisma from "../app/db.server";
import {
  createGangSheetDesign,
  duplicateDesignForReorder,
  getDesignStateAtVersion,
  saveGangSheetNewVersion,
} from "../app/services/design-service";

describe("design versioning and reorder", () => {
  const shop = "test-versioning.myshopify.com";

  beforeEach(async () => {
    await prisma.auditEvent.deleteMany({ where: { shop } });
    await prisma.renderJob.deleteMany({ where: { shop } });
    await prisma.orderLink.deleteMany({ where: { shop } });
    await prisma.designVersion.deleteMany({ where: { design: { shop } } });
    await prisma.design.deleteMany({ where: { shop } });
    await prisma.asset.deleteMany({ where: { shop } });
    await prisma.shopConfig.upsert({
      where: { shop },
      create: { shop },
      update: {},
    });
  });

  async function seedAsset() {
    return prisma.asset.create({
      data: {
        shop,
        storageKey: "test/key",
        contentType: "image/png",
        byteSize: 100,
        widthPx: 600,
        heightPx: 600,
        checksumSha256: "abc",
      },
    });
  }

  it("creates a new version without mutating prior version", async () => {
    const asset = await seedAsset();
    const { design } = await createGangSheetDesign({
      shop,
      items: [
        {
          assetId: asset.id,
          widthIn: 4,
          heightIn: 4,
          quantity: 1,
          rotationDeg: 0,
          xIn: 1,
          yIn: 2,
          zIndex: 1,
        },
      ],
      sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
    });

    await saveGangSheetNewVersion({
      shop,
      designId: design.id,
      items: [
        {
          assetId: asset.id,
          widthIn: 5,
          heightIn: 5,
          quantity: 1,
          rotationDeg: 0,
          xIn: 3,
          yIn: 4,
          zIndex: 1,
        },
      ],
      sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
    });

    const v1 = await getDesignStateAtVersion(shop, design.id, 1);
    const v2 = await getDesignStateAtVersion(shop, design.id, 2);
    expect(v1.state.items[0].xIn).toBe(1);
    expect(v2.state.items[0].xIn).toBe(3);
    expect(v2.design.currentVersion).toBe(2);
  });

  it("reorder copy gets distinct id and preserves coordinates", async () => {
    const asset = await seedAsset();
    const { design } = await createGangSheetDesign({
      shop,
      items: [
        {
          assetId: asset.id,
          widthIn: 4,
          heightIn: 4,
          quantity: 1,
          rotationDeg: 0,
          xIn: 0.5,
          yIn: 1.25,
          zIndex: 1,
        },
      ],
      sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
    });
    await prisma.design.update({ where: { id: design.id }, data: { status: "ordered", name: "Ordered" } });

    const copy = await duplicateDesignForReorder({
      shop,
      sourceDesignId: design.id,
      sourceVersion: 1,
      sourceOrderId: "1001",
    });

    expect(copy.design.id).not.toBe(design.id);
    expect(copy.state.items[0].xIn).toBe(0.5);
    expect(copy.sourceDesignId).toBe(design.id);

    const original = await getDesignStateAtVersion(shop, design.id, 1);
    expect(original.design.status).toBe("ordered");
  });

  it("rejects cross-shop reorder", async () => {
    const asset = await seedAsset();
    const { design } = await createGangSheetDesign({
      shop,
      items: [
        {
          assetId: asset.id,
          widthIn: 4,
          heightIn: 4,
          quantity: 1,
          rotationDeg: 0,
          xIn: 0,
          yIn: 0,
        },
      ],
      sheet: { widthIn: 22.5, maxHeightIn: 24, imageMarginIn: 0.15, artboardMarginIn: 0.1 },
    });

    await expect(
      duplicateDesignForReorder({
        shop: "other.myshopify.com",
        sourceDesignId: design.id,
      }),
    ).rejects.toThrow(/not found/i);
  });
});
