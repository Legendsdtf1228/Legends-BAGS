/** Route gang_sheet launches to Gang Sheet Studio when the BAGS → Studio bridge exists. */

import { existsSync } from "node:fs";
import path from "node:path";

function envFlag(raw: string | undefined): boolean | null {
  const value = (raw || "").trim().toLowerCase();
  if (value === "1" || value === "true" || value === "yes" || value === "on") return true;
  if (value === "0" || value === "false" || value === "no" || value === "off") return false;
  return null;
}

/** True when the synced Studio static build is present under public/studio. */
export function studioBridgePresent(): boolean {
  return existsSync(path.join(process.cwd(), "public", "studio", "index.html"));
}

/**
 * Customer `/builder` routing.
 * Explicit USE_STUDIO_BUILDER=0 rolls back to /editor/gang-sheet.
 * Unset defaults to Studio when the bridge files exist so merchants and customers
 * do not split across two gang-sheet engines.
 */
export function isStudioBuilderEnabled(): boolean {
  const flagged = envFlag(process.env.USE_STUDIO_BUILDER);
  if (flagged != null) return flagged;
  return studioBridgePresent();
}

/**
 * Merchant Open/Preview/Edit for gang_sheet always uses Studio when the bridge
 * exists, even if USE_STUDIO_BUILDER is off (customer `/builder` rollback).
 */
export function isMerchantStudioLaunchEnabled(): boolean {
  return studioBridgePresent();
}

/** Path used after /builder resolves a gang_sheet binding. */
export function studioEditorPath(): string {
  return "/editor/studio";
}
