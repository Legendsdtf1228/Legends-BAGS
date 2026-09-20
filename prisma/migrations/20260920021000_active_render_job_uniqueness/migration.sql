DELETE FROM "RenderJob"
WHERE "status" IN ('queued', 'processing')
  AND "id" NOT IN (
    SELECT MIN("id")
    FROM "RenderJob"
    WHERE "status" IN ('queued', 'processing')
    GROUP BY "shop", "designId", IFNULL("orderLinkId", '')
  );

CREATE UNIQUE INDEX "RenderJob_one_active_per_target"
ON "RenderJob" ("shop", "designId", IFNULL("orderLinkId", ''))
WHERE "status" IN ('queued', 'processing');