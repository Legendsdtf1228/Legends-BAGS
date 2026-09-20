import type { CSSProperties } from "react";
import prisma from "../db.server";

export type ShopAppearance = {
  businessName: string;
  logoUrl: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  accentColor: string;
  accentColorDark: string;
  backgroundColor: string;
  buttonColor: string;
  textColor: string;
  launcherOpenLabel: string;
  launcherEditLabel: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  podEnabled: boolean;
  podProviderNotes: string | null;
};

export const DEFAULT_APPEARANCE: ShopAppearance = {
  businessName: "Legends DTF Prints",
  logoUrl: null,
  logoLightUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
  accentColor: "#C9A227",
  accentColorDark: "#8A6D12",
  backgroundColor: "#FFFFFF",
  buttonColor: "#171717",
  textColor: "#171717",
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
    businessName: row.businessName,
    logoUrl: row.logoUrl,
    logoLightUrl: row.logoLightUrl,
    logoDarkUrl: row.logoDarkUrl,
    faviconUrl: row.faviconUrl,
    accentColor: row.accentColor,
    accentColorDark: row.accentColorDark,
    backgroundColor: row.backgroundColor,
    buttonColor: row.buttonColor,
    textColor: row.textColor,
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
    ["--brand-background" as string]: appearance.backgroundColor,
    ["--brand-button" as string]: appearance.buttonColor,
    ["--brand-text" as string]: appearance.textColor,
  };
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const HTTP_URL = /^https?:\/\/\S+$/i;

export function validateShopAppearance(
  patch: Partial<ShopAppearance>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const colors: Array<keyof ShopAppearance> = [
    "accentColor",
    "accentColorDark",
    "backgroundColor",
    "buttonColor",
    "textColor",
  ];
  const urls: Array<keyof ShopAppearance> = [
    "logoUrl",
    "logoLightUrl",
    "logoDarkUrl",
    "faviconUrl",
  ];

  for (const key of colors) {
    const value = patch[key];
    if (typeof value === "string" && !HEX_COLOR.test(value)) {
      errors[key] = "Use a six-digit hex color, such as #C9A227.";
    }
  }
  for (const key of urls) {
    const value = patch[key];
    if (typeof value === "string" && value && !HTTP_URL.test(value)) {
      errors[key] = "Use a full HTTPS URL.";
    }
  }
  if (patch.businessName !== undefined && !patch.businessName.trim()) {
    errors.businessName = "Business name is required.";
  }
  return errors;
}

export async function updateShopAppearance(
  shop: string,
  patch: Partial<ShopAppearance>,
) {
  await prisma.shopConfig.upsert({
    where: { shop },
    create: { shop, ...DEFAULT_APPEARANCE, ...patch },
    update: {
      ...(patch.businessName !== undefined ? { businessName: patch.businessName } : {}),
      ...(patch.logoUrl !== undefined ? { logoUrl: patch.logoUrl || null } : {}),
      ...(patch.logoLightUrl !== undefined ? { logoLightUrl: patch.logoLightUrl || null } : {}),
      ...(patch.logoDarkUrl !== undefined ? { logoDarkUrl: patch.logoDarkUrl || null } : {}),
      ...(patch.faviconUrl !== undefined ? { faviconUrl: patch.faviconUrl || null } : {}),
      ...(patch.accentColor !== undefined ? { accentColor: patch.accentColor } : {}),
      ...(patch.accentColorDark !== undefined ? { accentColorDark: patch.accentColorDark } : {}),
      ...(patch.backgroundColor !== undefined ? { backgroundColor: patch.backgroundColor } : {}),
      ...(patch.buttonColor !== undefined ? { buttonColor: patch.buttonColor } : {}),
      ...(patch.textColor !== undefined ? { textColor: patch.textColor } : {}),
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
