/** DEV-ONLY: route gang_sheet launches to Gang Sheet Studio when enabled. */

export function isStudioBuilderEnabled(): boolean {
  const raw = (process.env.USE_STUDIO_BUILDER || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/** Path used after /builder resolves a gang_sheet binding. */
export function studioEditorPath(): string {
  return "/editor/studio";
}
