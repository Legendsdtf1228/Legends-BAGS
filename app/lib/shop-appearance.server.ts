import type { CSSProperties } from "react";
import prisma from "../db.server";

export type ShopAppearance = {
  accentColor: string;
  accentColorDark: string;
  launcherOpenLabel: string;
  launcherEditLabel: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  podEnabled: boolean;
  podProviderNotes: string | null;
};

export const DEFAULT_APPEARANCE: ShopAppearance = {
  accentColor: "#f97316",
  accentColorDark: "#ea580c",
  launcherOpenLabel: "Build your gang sheet",
  launcherEditLabel: "Edit design",
  welcomeTitle: "Welcome to Legends BAGS",
  welcomeSubtitle: "Upload artwork, arrange on the sheet, then save to cart.",
  podEnabled: false,
  podProviderNotes: null,
};

export async function getShopAppearance(shop: string): Promise<ShopAppearance> {
  const row = await prisma.shopConfig.findUnique({ where: { shop } });
  if (!row) return DEFAULT_APPEARANCE;
  return {
    accentColor: row.accentColor,
    accentColorDark: row.accentColorDark,
    launcherOpenLabel: row.launcherOpenLabel,
    launcherEditLabel: row.launcherEditLabel,
    welcomeTitle: row.welcomeTitle,
    welcomeSubtitle: row.welcomeSubtitle,
    podEnabled: row.podEnabled,
    podProviderNotes: row.podProviderNotes,
  };
}

export function appearanceCssVars(appearance: ShopAppearance): CSSProperties {
  return {
    ["--accent" as string]: appearance.accentColor,
    ["--accent-dark" as string]: appearance.accentColorDark,
  };
}

export async function updateShopAppearance(
  shop: string,
  patch: Partial<ShopAppearance>,
) {
  await prisma.shopConfig.upsert({
    where: { shop },
    create: { shop, ...DEFAULT_APPEARANCE, ...patch },
    update: {
      ...(patch.accentColor !== undefined ? { accentColor: patch.accentColor } : {}),
      ...(patch.accentColorDark !== undefined ? { accentColorDark: patch.accentColorDark } : {}),
      ...(patch.launcherOpenLabel !== undefined
        ? { launcherOpenLabel: patch.launcherOpenLabel }
        : {}),
      ...(patch.launcherEditLabel !== undefined
        ? { launcherEditLabel: patch.launcherEditLabel }
        : {}),
      ...(patch.welcomeTitle !== undefined ? { welcomeTitle: patch.welcomeTitle } : {}),
      ...(patch.welcomeSubtitle !== undefined
        ? { welcomeSubtitle: patch.welcomeSubtitle }
        : {}),
      ...(patch.podEnabled !== undefined ? { podEnabled: patch.podEnabled } : {}),
      ...(patch.podProviderNotes !== undefined
        ? { podProviderNotes: patch.podProviderNotes }
        : {}),
    },
  });
}
