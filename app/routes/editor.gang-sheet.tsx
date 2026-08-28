import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
import {
  applyLongestSidePreset,
  BAGS_BASE_CSS,
  PresetSizeChips,
  StepperField,
} from "../components/editor/bags-ui";
import { EditorRailIcon } from "../components/editor/editor-rail-icons";
import type { OverflowAction } from "../components/editor/gang-sheet/gang-sheet-command-bar";
import { GANG_SHEET_EDITOR_CSS } from "../components/editor/gang-sheet/gang-sheet-editor-styles";
import { BagsGangSheetHeader } from "../components/editor/bags-parity/bags-gang-sheet-header";
import { BagsSheetToolbar } from "../components/editor/bags-parity/bags-sheet-toolbar";
import { BagsBottomNav, type BagsBottomNavTab } from "../components/editor/bags-parity/bags-bottom-nav";
import { BagsLeftRail, isBagsLeftRailPanelTab, type BagsLeftRailTab } from "../components/editor/bags-parity/bags-left-rail";
import { BagsProductsPanel } from "../components/editor/bags-parity/bags-products-panel";
import { BagsUploadsPanel } from "../components/editor/bags-parity/bags-uploads-panel";
import { BagsPropertiesPanel } from "../components/editor/bags-parity/bags-properties-panel";
import { BagsActiveSheetsDrawer } from "../components/editor/bags-parity/bags-active-sheets-drawer";
import { BagsAddImageModal, type AddImageTab } from "../components/editor/bags-parity/bags-add-image-modal";
import { BagsEditorSettingsDrawer } from "../components/editor/bags-parity/bags-editor-settings-drawer";
import { BagsSelectionToolbar } from "../components/editor/bags-parity/bags-selection-toolbar";
import { BagsQualityLegend } from "../components/editor/bags-parity/bags-quality-legend";
import { BagsImageEditorModal, type BagsImageEditorResult } from "../components/editor/bags-parity/bags-image-editor-modal";
import { BagsAutomationModal, type AutomationKind } from "../components/editor/bags-parity/bags-automation-modal";
import { BagsIntegrationPanel } from "../components/editor/bags-parity/bags-integration-panel";
import { BagsNamesNumbersModal } from "../components/editor/bags-parity/bags-names-numbers-modal";
import { BagsNamesNumbersContent, type NamesNumbersSizePresetId, type NamesNumbersWorkflow } from "../components/editor/bags-parity/bags-names-numbers-content";
import { BagsDesignPickerModal, type DesignPickerTab } from "../components/editor/bags-parity/bags-design-picker-modal";
import { BagsWelcomeCenter, BagsWelcomeAction } from "../components/editor/bags-parity/bags-welcome-center";
import type { BagsCustomerAccount } from "../components/editor/bags-parity/bags-gang-sheet-header";
import { BAGS_PARITY_EDITOR_CSS } from "../components/editor/bags-parity/bags-parity-editor-styles";
import { GangSheetSaveDialog } from "../components/editor/gang-sheet/gang-sheet-save-dialog";
import { ToolbarIcon } from "../components/editor/gang-sheet/editor-toolbar-icons";
import { CanvasMinimap } from "../components/editor/gang-sheet/canvas-minimap";
import { dpiQualityTier, isLowQualityTier, liveDpi, summarizeQuality } from "../components/editor/gang-sheet/dpi-quality";
import { autoFillCopyCount, applyCropToDimensions } from "../domain/image/image-adjustments";
import type { ImageAdjustments } from "../domain/image/image-adjustments";
import {
  fitWidthZoomPercent,
  smartFitZoomPercent,
  zoomDisplayLabel,
  type ZoomMode,
} from "../components/editor/gang-sheet/editor-zoom";
import {
  QualityInspectorPanel,
  type QualityDisplayPrefs,
} from "../components/editor/gang-sheet/quality-inspector";
import { SheetShrinkDialog } from "../components/editor/gang-sheet/sheet-shrink-dialog";
import {
  GANG_SHEET_HEIGHTS,
  DEFAULT_GANG_SHEET_ARTBOARD_MARGIN_IN,
  gangSheetAreaPriceUsd,
  normalizeArtboardMarginIn,
  resolveAllowedSheetHeights,
  resolveAllowedSheetWidths,
  resolveGangSheetVariantPriceCents,
} from "../domain/design/gang-sheet-sheet";
import { computeGangSheetEstimateUsd } from "../domain/pricing";
import {
  BACKGROUND_REMOVAL_MODAL_CSS,
  BackgroundRemovalModal,
  type ProcessedAsset,
} from "../components/editor/background-removal-modal";
import {
  alignSelected,
  assetPreviewUrl,
  clearDraft,
  distributeSelected,
  findOobIds,
  findOverlappingIds,
  inside,
  scaleItemsToSheet,
  isTypingTarget,
  nextZIndex,
  NUDGE_IN,
  NUDGE_SHIFT_IN,
  readDraft,
  reorderLayer,
  round,
  shelfPackLayout,
  sortByZIndex,
  writeDraft,
  type GangDraftV1,
} from "../components/editor/gang-sheet-helpers";
import {
  FONT_OPTIONS,
  GALLERY_CATEGORIES,
  HELP_SHORTCUTS,
  NAME_SIZE_PRESETS,
  NUMBER_SIZE_PRESETS,
  SHEET_TEMPLATES,
  TEXT_STYLE_PRESETS,
  type GalleryItem,
} from "../components/editor/gang-sheet/editor-data";
import { snapPoint, type SnapGuide } from "../components/editor/gang-sheet/snap";
import {
  DEFAULT_APPEARANCE,
  getShopAppearance,
  type ShopAppearance,
} from "../lib/shop-appearance.server";
import { loadEditorPageConfig } from "../lib/editor-config.server";
import { buildEditorAuthHeaders } from "../lib/editor-auth.server";
import { mergeEditorLaunchFromUrl } from "../lib/editor-launch.server";

type Asset = {
  assetId: string;
  widthPx: number;
  heightPx: number;
  dpi?: number | null;
  contentType: string;
};

type CanvasItem = Asset & {
  id: string;
  name: string;
  previewUrl: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg: 0 | 90;
  flipX?: boolean;
  flipY?: boolean;
  zIndex: number;
  kind?: "image" | "text";
  textContent?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  lockPosition?: boolean;
  lockAspect?: boolean;
  quantity?: number;
  adjustments?: ImageAdjustments;
};

type Interaction =
  | {
      mode: "drag";
      id: string;
      x: number;
      y: number;
      sx: number;
      sy: number;
      snapshot: CanvasItem[];
    }
  | {
      mode: "resize";
      id: string;
      startW: number;
      startH: number;
      aspect: number;
      sx: number;
      sy: number;
      snapshot: CanvasItem[];
    }
  | {
      mode: "marquee";
      sx: number;
      sy: number;
      ex: number;
      ey: number;
    };

type AutoDraft = {
  id: string;
  asset: Asset;
  previewUrl: string;
  name: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
  lockAspect: boolean;
};

type AutoPhase = "setup" | "review";

type BgRemoveTarget = {
  sourceAssetId: string;
  sourcePreviewUrl: string;
};

type PoolItem = {
  id: string;
  asset: Asset;
  previewUrl: string;
  name: string;
  uploadedAt: number;
};

type SidebarTab =
  | "uploads"
  | "gallery"
  | "products"
  | "text"
  | "names"
  | "auto"
  | "layers"
  | "templates"
  | "help";

type Screen = "welcome" | "auto_build" | "canvas";

const SIDEBAR_TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: "uploads", label: "Uploads", icon: "uploads" },
  { id: "gallery", label: "Gallery", icon: "gallery" },
  { id: "text", label: "Text", icon: "text" },
  { id: "names", label: "Names", icon: "names" },
  { id: "auto", label: "Auto Arrange", icon: "auto" },
  { id: "layers", label: "Layers", icon: "layers" },
  { id: "templates", label: "Templates", icon: "template" },
  { id: "help", label: "Help", icon: "help" },
];

type NestPlacement = {
  assetId: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg: 0 | 90;
};

type PreviewPiece = {
  id: string;
  draftId: string;
  previewUrl: string;
  name: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg: 0 | 90;
};

type AutoNestPreview = {
  placements: NestPlacement[];
  sheetHeightIn: number;
  sheetWidthIn: number;
  utilization: number;
  pieces: PreviewPiece[];
  totalPieces: number;
  totalAreaSqIn: number;
  estimateUsd: number;
  fittedCount?: number;
  remainingCount?: number;
};

const SHEET_HEIGHTS = [...GANG_SHEET_HEIGHTS];
const AUTO_PRESETS = [2, 3, 4, 5, 6, 8, 10, 12] as const;

function sheetVisualAidStyle(
  visualAid: "checkerboard" | "gray" | "black" | "white" | "custom",
  customColor: string,
): CSSProperties | undefined {
  switch (visualAid) {
    case "gray":
      return { backgroundColor: "#9ca3af" };
    case "black":
      return { backgroundColor: "#111827" };
    case "white":
      return { backgroundColor: "#ffffff" };
    case "custom":
      return { backgroundColor: customColor };
    default:
      return undefined;
  }
}

function buildNestItemsFromDrafts(drafts: AutoDraft[]) {
  return drafts.flatMap((d) =>
    Array.from({ length: d.quantity }, () => ({
      assetId: d.asset.assetId,
      widthIn: d.widthIn,
      heightIn: d.heightIn,
      quantity: 1,
      rotationDeg: 0 as const,
    })),
  );
}

function mapPlacementsToPieces(
  placements: NestPlacement[],
  drafts: AutoDraft[],
): PreviewPiece[] {
  const pools = new Map<string, AutoDraft[]>();
  for (const d of drafts) {
    const list = pools.get(d.asset.assetId) ?? [];
    for (let i = 0; i < d.quantity; i++) list.push(d);
    pools.set(d.asset.assetId, list);
  }
  const used = new Map<string, number>();
  return placements.map((p) => {
    const pool = pools.get(p.assetId) ?? [];
    const idx = used.get(p.assetId) ?? 0;
    used.set(p.assetId, idx + 1);
    const draft = pool[idx] ?? drafts[0];
    return {
      id: crypto.randomUUID(),
      draftId: draft.id,
      previewUrl: draft.previewUrl,
      name: draft.name,
      xIn: p.xIn,
      yIn: p.yIn,
      widthIn: p.widthIn,
      heightIn: p.heightIn,
      rotationDeg: p.rotationDeg,
    };
  });
}

function totalDraftArea(drafts: AutoDraft[]) {
  return drafts.reduce((s, d) => s + d.widthIn * d.heightIn * d.quantity, 0);
}

type LibraryDesign = {
  id: string;
  name: string | null;
  workflow: string;
  version: number;
  pieceCount: number;
  sheetLabel: string;
  priceCents: number;
  updatedAt: string;
  status: string;
  archived: boolean;
  previewPath?: string | null;
  sourceOrderId?: string | null;
};

type RemoteDesignPayload = {
  designId: string;
  version: number;
  name: string | null;
  state: {
    workflow: string;
    sheet: { widthIn: number; maxHeightIn: number; imageMarginIn: number; artboardMarginIn: number };
    items: Array<{
      assetId: string;
      widthIn: number;
      heightIn: number;
      xIn?: number;
      yIn?: number;
      rotationDeg: 0 | 90;
      flipX?: boolean;
      flipY?: boolean;
      zIndex?: number;
      kind?: "image" | "text";
      name?: string;
      textContent?: string;
      fontSize?: number;
      fontFamily?: string;
      textColor?: string;
    }>;
    pricing: { totalCents: number };
  };
  assets?: Record<
    string,
    { widthPx: number; heightPx: number; dpi?: number | null; contentType: string }
  >;
  cartProperties?: Record<string, string>;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const launch = mergeEditorLaunchFromUrl(request, process.env.DEV_SHOP || "");
  const { headers, hasApiAuth } = buildEditorAuthHeaders(request, launch.shop);
  const editorConfig = launch.shop
    ? await loadEditorPageConfig(launch.shop, launch.productGid || undefined, launch.variantId || undefined)
    : null;
  const appearance = editorConfig?.appearance ?? DEFAULT_APPEARANCE;
  return data(
    {
      shop: launch.shop,
      productGid: launch.productGid || editorConfig?.resolvedProductGid || "",
      variantId: launch.variantId,
      designId: launch.designId,
      designVersion: launch.designVersion,
      parentOrigin: launch.parentOrigin,
      quantity: launch.quantity,
      shopMode: launch.shopMode,
      editorOrigin: process.env.SHOPIFY_APP_URL || "",
      hasDevAuth: hasApiAuth,
      appearance,
      pricePerSqIn: editorConfig?.pricePerSqIn ?? 0.049,
      variantPriceCents: editorConfig?.binding?.variantPriceCents ?? null,
      productSheetWidthIn: editorConfig?.binding?.sheetWidthIn ?? editorConfig?.sheet.widthIn ?? null,
      gangSheetVariants: editorConfig?.gangSheetVariants ?? [],
      productTitle: editorConfig?.binding?.productTitle ?? null,
      productStatus: editorConfig?.binding?.productStatus ?? null,
      syncStatus: editorConfig?.binding?.syncStatus ?? null,
      defaultSheetHeightIn: editorConfig?.defaultSheetHeightIn ?? 24,
      defaultSheet: editorConfig?.sheet ?? {
        widthIn: 22.5,
        maxHeightIn: 24,
        imageMarginIn: 0.15,
        artboardMarginIn: DEFAULT_GANG_SHEET_ARTBOARD_MARGIN_IN,
      },
      customerName: launch.customerName,
      customerEmail: launch.customerEmail,
      customerKey: launch.customerKey,
    },
    { headers },
  );
}

function pieceTransform(item: Pick<CanvasItem, "rotationDeg" | "flipX" | "flipY">) {
  return `rotate(${item.rotationDeg}deg) scaleX(${item.flipX ? -1 : 1}) scaleY(${item.flipY ? -1 : 1})`;
}

function appearanceVars(appearance: ShopAppearance): CSSProperties {
  return {
    ["--accent" as string]: appearance.accentColor,
    ["--accent-dark" as string]: appearance.accentColorDark,
  };
}

export default function GangSheetEditor() {
  const page = useLoaderData<typeof loader>();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [history, setHistory] = useState<CanvasItem[][]>([]);
  const [future, setFuture] = useState<CanvasItem[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sheetWidth, setSheetWidth] = useState(page.defaultSheet.widthIn);
  const [sheetHeight, setSheetHeight] = useState(page.defaultSheetHeightIn);
  const [zoom, setZoom] = useState(70);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("custom");
  const [gridVisible, setGridVisible] = useState(true);
  const [qualityPanelOpen, setQualityPanelOpen] = useState(false);
  const [qualityPrefs, setQualityPrefs] = useState<QualityDisplayPrefs>({
    showResolutionOutlines: true,
    showOverlapOutlines: true,
    showSafeZone: true,
    showOobShading: true,
  });
  const [scrollMetrics, setScrollMetrics] = useState({ top: 0, height: 0, client: 0 });
  const [gap, setGap] = useState(0.15);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [autoDrafts, setAutoDrafts] = useState<AutoDraft[]>([]);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoPreview, setAutoPreview] = useState<AutoNestPreview | null>(null);
  const [autoPreviewLoading, setAutoPreviewLoading] = useState(false);
  const [autoPreviewError, setAutoPreviewError] = useState("");
  const [selectedAutoId, setSelectedAutoId] = useState<string | null>(null);
  const [autoPhase, setAutoPhase] = useState<AutoPhase>("setup");
  const [autoUploadTab, setAutoUploadTab] = useState<"upload" | "pool" | "gallery">("upload");
  const [allowRotate90, setAllowRotate90] = useState(true);
  const [uploadPool, setUploadPool] = useState<PoolItem[]>([]);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("uploads");
  const [poolTick, setPoolTick] = useState(0);
  const [draftOffer, setDraftOffer] = useState<GangDraftV1 | null>(null);
  const [hasStoredDraft, setHasStoredDraft] = useState(false);
  const [showFirstTip, setShowFirstTip] = useState(true);
  const [uploadSearch, setUploadSearch] = useState("");
  const [uploadSort, setUploadSort] = useState<"recent" | "name">("recent");
  const [uploadView, setUploadView] = useState<"grid" | "list">("grid");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [upscaling, setUpscaling] = useState(false);
  const [sheetQuantity, setSheetQuantity] = useState(page.quantity ?? 1);
  const [bottomNav, setBottomNav] = useState<BagsBottomNavTab | null>(null);
  const [leftRailTab, setLeftRailTab] = useState<BagsLeftRailTab>("uploads");
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [addImageOpen, setAddImageOpen] = useState(false);
  const [addImageTab, setAddImageTab] = useState<AddImageTab>("recent");
  const [sheetsDrawerCollapsed, setSheetsDrawerCollapsed] = useState(false);
  const [visualAid, setVisualAid] = useState<"checkerboard" | "gray" | "black" | "white" | "custom">("checkerboard");
  const [visualAidCustomColor, setVisualAidCustomColor] = useState("#c4c4c4");
  const [artboardMarginEnabled, setArtboardMarginEnabled] = useState(true);
  const [artboardMarginIn, setArtboardMarginIn] = useState(() =>
    normalizeArtboardMarginIn(page.defaultSheet.artboardMarginIn),
  );
  const [galleryCategory, setGalleryCategory] = useState<string>("All");
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryCategories, setGalleryCategories] = useState<string[]>([...GALLERY_CATEGORIES]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [shrinkPrompt, setShrinkPrompt] = useState<{
    w: number;
    h: number;
    affectedCount: number;
  } | null>(null);
  const [textContent, setTextContent] = useState("Your text");
  const [textFontSize, setTextFontSize] = useState(36);
  const [textFontFamily, setTextFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#111827");
  const [namesList, setNamesList] = useState("");
  const [numbersList, setNumbersList] = useState("");
  const [namesNumbersWorkflow, setNamesNumbersWorkflow] = useState<NamesNumbersWorkflow>("names");
  const [rosterNameFontFamily, setRosterNameFontFamily] = useState("Impact");
  const [rosterNumberFontFamily, setRosterNumberFontFamily] = useState("Impact");
  const [rosterNameFontSize, setRosterNameFontSize] = useState(28);
  const [rosterNumberFontSize, setRosterNumberFontSize] = useState(36);
  const [rosterNameWidthIn, setRosterNameWidthIn] = useState(5);
  const [rosterNumberWidthIn, setRosterNumberWidthIn] = useState(2);
  const [rosterNameStrokeWidth, setRosterNameStrokeWidth] = useState(0);
  const [rosterNumberStrokeWidth, setRosterNumberStrokeWidth] = useState(0);
  const [rosterStrokeColor, setRosterStrokeColor] = useState("#111827");
  const [rosterTextColor, setRosterTextColor] = useState("#111827");
  const [rosterQuantity, setRosterQuantity] = useState(1);
  const [designPickerOpen, setDesignPickerOpen] = useState(false);
  const [designPickerTab, setDesignPickerTab] = useState<DesignPickerTab>("mine");
  const [savedDesigns, setSavedDesigns] = useState<LibraryDesign[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [librarySort, setLibrarySort] = useState<"recent" | "name">("recent");
  const [libraryIncludeArchived, setLibraryIncludeArchived] = useState(false);
  const [libraryRenamingId, setLibraryRenamingId] = useState<string | null>(null);
  const [libraryRenameValue, setLibraryRenameValue] = useState("");
  const [showLibrarySave, setShowLibrarySave] = useState(false);
  const [libraryName, setLibraryName] = useState("");
  const [bgRemove, setBgRemove] = useState<BgRemoveTarget | null>(null);
  const [librarySaving, setLibrarySaving] = useState(false);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(page.designId || null);
  const [editingVersion, setEditingVersion] = useState<number | null>(
    page.designVersion ? Number(page.designVersion) : null,
  );
  const [designName, setDesignName] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [spacePan, setSpacePan] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<"sidebar" | "properties" | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogError, setSaveDialogError] = useState("");
  const [saveDialogRequestId, setSaveDialogRequestId] = useState("");
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [automationKind, setAutomationKind] = useState<AutomationKind>("auto-fill");
  const [nestPreview, setNestPreview] = useState<ReturnType<typeof shelfPackLayout> | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const sidebarUploadRef = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<Interaction | null>(null);
  const panRef = useRef<{ sx: number; sy: number; sl: number; st: number } | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const selected = items.find((i) => i.id === selectedId) ?? null;

  function selectItem(id: string | null, additive = false) {
    if (!id) {
      setSelectedId(null);
      setSelectedIds(new Set());
      return;
    }
    if (additive) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        const last = next.size ? id : null;
        setSelectedId(last);
        return next;
      });
    } else {
      setSelectedId(id);
      setSelectedIds(new Set([id]));
    }
    if (id && typeof window !== "undefined" && window.innerWidth <= 768) {
      setMobileDrawer("properties");
    }
  }
  const paintedItems = useMemo(() => sortByZIndex(items), [items]);

  const allowedSheetWidths = useMemo(
    () => resolveAllowedSheetWidths(page.productSheetWidthIn),
    [page.productSheetWidthIn],
  );
  const allowedSheetHeights = useMemo(
    () => resolveAllowedSheetHeights(page.gangSheetVariants),
    [page.gangSheetVariants],
  );
  const activeVariantPriceCents = useMemo(
    () =>
      resolveGangSheetVariantPriceCents({
        gangSheetVariants: page.gangSheetVariants,
        sheetHeightIn: sheetHeight,
        fallbackVariantPriceCents: page.variantPriceCents,
      }),
    [page.gangSheetVariants, page.variantPriceCents, sheetHeight],
  );

  const activeVariantMeta = useMemo(() => {
    const match = page.gangSheetVariants.find((v) => v.sheetHeightIn === sheetHeight);
    return {
      title: match?.variantTitle ?? null,
      id: page.variantId || match?.variantGid?.replace("gid://shopify/ProductVariant/", "") || null,
    };
  }, [page.gangSheetVariants, page.variantId, sheetHeight]);

  const storefrontCustomer = useMemo<BagsCustomerAccount | null>(() => {
    const name = page.customerName?.trim();
    const email = page.customerEmail?.trim();
    const key = page.customerKey?.trim();
    const isLoggedIn = Boolean(key?.startsWith("gid://shopify/Customer/"));
    if (name && email) return { name, email };
    if (name) return { name, email: email ?? "" };
    if (email) return { name: email.split("@")[0] || "Customer", email };
    if (isLoggedIn) return { name: "Customer", email: "" };
    return null;
  }, [page.customerName, page.customerEmail, page.customerKey]);

  const usedArea = useMemo(
    () => items.reduce((s, i) => s + i.widthIn * i.heightIn, 0),
    [items],
  );
  const estimate = useMemo(
    () =>
      computeGangSheetEstimateUsd({
        variantPriceCents: activeVariantPriceCents,
        pricePerSqIn: page.pricePerSqIn,
        sheetWidthIn: sheetWidth,
        sheetHeightIn: sheetHeight,
      }),
    [activeVariantPriceCents, page.pricePerSqIn, sheetWidth, sheetHeight],
  );
  const welcomePriceLabel =
    activeVariantPriceCents != null
      ? `$${(activeVariantPriceCents / 100).toFixed(2)}`
      : `$${gangSheetAreaPriceUsd(sheetWidth, sheetHeight, page.pricePerSqIn).toFixed(2)}`;
  const utilization = Math.min(100, Math.round((usedArea / (sheetWidth * sheetHeight)) * 100));

  const overlappingIds = useMemo(() => findOverlappingIds(items), [items]);
  const oobIds = useMemo(
    () => findOobIds(items, sheetWidth, sheetHeight),
    [items, sheetWidth, sheetHeight],
  );
  const lowDpiCount = useMemo(
    () =>
      items.filter((i) => {
        if (i.kind === "text") return false;
        const tier = dpiQualityTier(i.dpi).tier;
        return isLowQualityTier(tier);
      }).length,
    [items],
  );
  const qualitySummary = useMemo(
    () => summarizeQuality(items, overlappingIds, oobIds),
    [items, overlappingIds, oobIds],
  );
  const zoomLabel = useMemo(() => zoomDisplayLabel(zoom, zoomMode), [zoom, zoomMode]);
  const savePreviewUrl = useMemo(
    () => items.find((i) => i.previewUrl)?.previewUrl ?? null,
    [items],
  );

  function openSaveDialog() {
    if (!items.length) {
      setError("Add artwork before saving.");
      return;
    }
    setSaveDialogError("");
    setSaveDialogRequestId("");
    setShowSaveDialog(true);
  }

  const commitFromSnapshot = useCallback((snapshot: CanvasItem[], next: CanvasItem[]) => {
    setHistory((h) => [...h.slice(-30), snapshot]);
    setFuture([]);
    setItems(next);
    setSaved(false);
    setDirty(true);
  }, []);

  const pushHistory = useCallback((next: CanvasItem[]) => {
    setHistory((h) => [...h.slice(-30), itemsRef.current]);
    setFuture([]);
    setItems(next);
    setSaved(false);
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!allowedSheetWidths.includes(sheetWidth)) {
      setSheetWidth(allowedSheetWidths[0] ?? page.defaultSheet.widthIn);
    }
  }, [allowedSheetWidths, sheetWidth, page.defaultSheet.widthIn]);

  useEffect(() => {
    if (!allowedSheetHeights.includes(sheetHeight)) {
      setSheetHeight(allowedSheetHeights[0] ?? page.defaultSheetHeightIn);
    }
  }, [allowedSheetHeights, sheetHeight, page.defaultSheetHeightIn]);

  useEffect(() => {
    const draft = readDraft(page.shop);
    setHasStoredDraft(Boolean(draft?.items.length));
    if (draft?.items.length && !page.designId) setDraftOffer(draft);
    void refreshGallery();
  }, [page.shop, page.designId]);

  useEffect(() => {
    if (screen !== "welcome") return;
    void refreshLibrary();
  }, [screen, page.shop, page.productGid, librarySearch, librarySort, libraryIncludeArchived]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sync = () =>
      setScrollMetrics({ top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight });
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sheetHeight, zoom, items.length]);

  useEffect(() => {
    if (sidebarTab === "gallery") void refreshGallery();
  }, [sidebarTab]);

  useEffect(() => {
    if (screen !== "canvas") return;
    const el = scrollRef.current;
    if (!el) return;
    const fit = smartFitZoomPercent(el.clientWidth, el.clientHeight, sheetWidth, sheetHeight);
    setZoom(fit.zoom);
    setZoomMode(fit.mode);
  }, [sheetWidth, sheetHeight, screen]);

  useEffect(() => {
    if (!page.gangSheetVariants.length) return;
    const match = page.gangSheetVariants.find((v) => v.sheetHeightIn === sheetHeight);
    if (!match?.variantGid) return;
    const variantId = match.variantGid.replace("gid://shopify/ProductVariant/", "");
    if (!variantId || variantId === page.variantId) return;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: "lgs:select-variant", variantId },
        page.parentOrigin || page.editorOrigin || "*",
      );
    }
  }, [sheetHeight, page.gangSheetVariants, page.parentOrigin, page.editorOrigin, page.variantId]);

  useEffect(() => {
    if (!page.designId) return;
    void loadRemoteDesign(page.designId, page.designVersion ? Number(page.designVersion) : undefined);
  }, [page.designId, page.designVersion]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!dirty || saved) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saved]);

  useEffect(() => {
    if (screen !== "canvas") return;
    const t = window.setTimeout(() => {
      if (!items.length) return;
      const payload: GangDraftV1 = {
        v: 1,
        sheetWidth,
        sheetHeight,
        gap,
        items: items.map(
          ({
            assetId,
            name,
            widthPx,
            heightPx,
            dpi,
            contentType,
            widthIn,
            heightIn,
            xIn,
            yIn,
            rotationDeg,
            flipX,
            flipY,
            zIndex,
            kind,
            textContent,
            fontSize,
            fontFamily,
            textColor,
            lockAspect,
            lockPosition,
          }) => ({
            assetId,
            name,
            widthPx,
            heightPx,
            dpi,
            contentType,
            widthIn,
            heightIn,
            xIn,
            yIn,
            rotationDeg,
            flipX,
            flipY,
            zIndex,
            kind,
            textContent,
            fontSize,
            fontFamily,
            textColor,
            lockAspect,
            lockPosition,
          }),
        ),
        savedAt: Date.now(),
      };
      writeDraft(page.shop, payload);
      setHasStoredDraft(true);
    }, 500);
    return () => window.clearTimeout(t);
  }, [items, sheetWidth, sheetHeight, gap, page.shop, screen, history.length]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = interaction.current;
      const c = canvas.current;
      if (!d || !c) return;
      const r = c.getBoundingClientRect();
      if (d.mode === "marquee") {
        interaction.current = { ...d, ex: e.clientX, ey: e.clientY };
        const c = canvas.current;
        if (!c) return;
        const r = c.getBoundingClientRect();
        const x1 = Math.min(d.sx, e.clientX) - r.left;
        const y1 = Math.min(d.sy, e.clientY) - r.top;
        const x2 = Math.max(d.sx, e.clientX) - r.left;
        const y2 = Math.max(d.sy, e.clientY) - r.top;
        setMarqueeRect({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
        return;
      }
      if (d.mode === "drag") {
        setItems((all) =>
          all.map((i) => {
            if (i.id !== d.id) return i;
            if (i.lockPosition) return i;
            let xIn = d.x + ((e.clientX - d.sx) / r.width) * sheetWidth;
            let yIn = d.y + ((e.clientY - d.sy) / r.height) * sheetHeight;
            let guides: SnapGuide[] = [];
            if (snapEnabled) {
              const others = all.filter((o) => o.id !== d.id);
              const snapped = snapPoint(
                xIn,
                yIn,
                i.widthIn,
                i.heightIn,
                sheetWidth,
                sheetHeight,
                others,
              );
              xIn = snapped.xIn;
              yIn = snapped.yIn;
              guides = snapped.guides;
            }
            setSnapGuides(guides);
            return inside({ ...i, xIn, yIn }, sheetWidth, sheetHeight);
          }),
        );
        return;
      }
      const dx = ((e.clientX - d.sx) / r.width) * sheetWidth;
      let widthIn = Math.max(0.1, d.startW + dx);
      let heightIn = widthIn / d.aspect;
      setItems((all) =>
        all.map((i) => {
          if (i.id !== d.id) return i;
          const next = inside(withLiveDpi(i, { widthIn, heightIn }), sheetWidth, sheetHeight);
          return next;
        }),
      );
    };
    const up = () => {
      const d = interaction.current;
      if (!d) return;
      if (d.mode === "marquee") {
        const c = canvas.current;
        if (c) {
          const r = c.getBoundingClientRect();
          const x1 = Math.min(d.sx, d.ex) - r.left;
          const y1 = Math.min(d.sy, d.ey) - r.top;
          const x2 = Math.max(d.sx, d.ex) - r.left;
          const y2 = Math.max(d.sy, d.ey) - r.top;
          const ids = new Set<string>();
          for (const item of itemsRef.current) {
            const px = (item.xIn / sheetWidth) * r.width;
            const py = (item.yIn / sheetHeight) * r.height;
            const pw = (item.widthIn / sheetWidth) * r.width;
            const ph = (item.heightIn / sheetHeight) * r.height;
            if (px + pw >= x1 && px <= x2 && py + ph >= y1 && py <= y2) ids.add(item.id);
          }
          if (ids.size) {
            setSelectedIds(ids);
            setSelectedId([...ids].pop() ?? null);
          } else {
            selectItem(null);
          }
        }
        setMarqueeRect(null);
        interaction.current = null;
        return;
      }
      setSnapGuides([]);
      const next = itemsRef.current;
      const before = d.snapshot.find((i) => i.id === d.id);
      const after = next.find((i) => i.id === d.id);
      const moved =
        before &&
        after &&
        (before.xIn !== after.xIn ||
          before.yIn !== after.yIn ||
          before.widthIn !== after.widthIn ||
          before.heightIn !== after.heightIn);
      if (moved) commitFromSnapshot(d.snapshot, next);
      interaction.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [commitFromSnapshot, sheetHeight, sheetWidth, snapEnabled]);

  function createPlacedItem(
    asset: Asset,
    previewUrl: string,
    name: string,
    index: number,
    existing: CanvasItem[] = items,
  ): CanvasItem {
    const w = Math.min(6, sheetWidth - 0.4);
    const h = w / (asset.widthPx / asset.heightPx);
    return {
      ...asset,
      id: crypto.randomUUID(),
      name,
      previewUrl,
      xIn: 0.2 + (index % 4) * 0.4,
      yIn: 0.2 + Math.floor(index / 4) * 0.4,
      widthIn: w,
      heightIn: h,
      rotationDeg: 0,
      zIndex: nextZIndex(existing) + index,
      quantity: 1,
      dpi: Math.round(liveDpi(asset.widthPx, asset.heightPx, w, h) ?? 0) || undefined,
    };
  }

  function openCanvas(options?: { tab?: SidebarTab; pickUpload?: boolean }) {
    setScreen("canvas");
    const tab = options?.tab ?? "uploads";
    setSidebarTab(tab);
    setLeftRailTab(tab === "products" ? "products" : tab === "gallery" ? "gallery" : "uploads");
    setMobileDrawer("sidebar");
    setMessage("");
    setShowFirstTip(true);
    if (options?.pickUpload) {
      window.setTimeout(() => sidebarUploadRef.current?.click(), 50);
    }
  }

  function handleLeftRail(tab: BagsLeftRailTab) {
    if (tab === "home") {
      setScreen("welcome");
      return;
    }
    if (tab === "settings") {
      setLeftRailTab("settings");
      setSettingsDrawerOpen(true);
      setBottomNav(null);
      return;
    }
    if (tab === "canva") {
      setLeftRailTab("canva");
      setMobileDrawer("sidebar");
      return;
    }
    if (tab === "dropbox") {
      setLeftRailTab("dropbox");
      setMobileDrawer("sidebar");
      return;
    }
    if (tab === "names-numbers") {
      setLeftRailTab("names-numbers");
      setMobileDrawer("sidebar");
      return;
    }
    setLeftRailTab(tab);
    if (tab === "products") setSidebarTab("products");
    if (tab === "uploads") setSidebarTab("uploads");
    if (tab === "gallery") setSidebarTab("gallery");
    setMobileDrawer("sidebar");
  }

  const desktopSidePanelOpen =
    isBagsLeftRailPanelTab(leftRailTab) ||
    leftRailTab === "canva" ||
    leftRailTab === "dropbox" ||
    leftRailTab === "names-numbers";
  const desktopPropertiesOpen = Boolean(selected);

  function commitSheetSize(w: number, h: number, mode: "clamp" | "scale") {
    if (itemsRef.current.length) {
      const next =
        mode === "scale"
          ? scaleItemsToSheet(itemsRef.current, sheetWidth, sheetHeight, w, h)
          : itemsRef.current.map((i) => inside({ ...i }, w, h));
      pushHistory(next);
    }
    setSheetWidth(w);
    setSheetHeight(h);
    setSaved(false);
    setShrinkPrompt(null);
  }

  function requestSheetSize(w: number, h: number) {
    if (w === sheetWidth && h === sheetHeight) return;
    const growing = w >= sheetWidth && h >= sheetHeight;
    if (!itemsRef.current.length || growing) {
      commitSheetSize(w, h, "clamp");
      return;
    }
    const clamped = itemsRef.current.map((i) => inside({ ...i }, w, h));
    const affected = findOobIds(clamped, w, h).size;
    setShrinkPrompt({ w, h, affectedCount: affected });
  }

  function applySheetSize(w: number, h: number) {
    requestSheetSize(w, h);
  }

  function fitToViewport(mode: "width" | "sheet" = "sheet") {
    const el = scrollRef.current;
    if (!el) return;
    if (mode === "width") {
      setZoom(fitWidthZoomPercent(el.clientWidth, sheetWidth));
      setZoomMode("fit-width");
      return;
    }
    const fit = smartFitZoomPercent(el.clientWidth, el.clientHeight, sheetWidth, sheetHeight);
    setZoom(fit.zoom);
    setZoomMode(fit.mode);
  }

  function handleOverflowAction(action: OverflowAction) {
    if (action === "arrange") {
      setScreen("auto_build");
      setAutoPhase("setup");
      setMessage("Auto Arrange — upload, set quantities, preview, then apply.");
      return;
    }
    if (action === "duplicate-design") {
      if (!items.length) return;
      const copy = items.map((i) => ({ ...i, id: crypto.randomUUID(), xIn: i.xIn + 0.25, yIn: i.yIn + 0.25 }));
      pushHistory([...items, ...copy]);
      setMessage("Duplicated all artwork on the sheet.");
      return;
    }
    if (action === "clear-sheet") {
      if (!items.length) return;
      if (!window.confirm("Clear all artwork from this sheet? This can be undone with Ctrl+Z.")) return;
      pushHistory([]);
      selectItem(null);
      setMessage("Sheet cleared.");
      return;
    }
    if (action === "library") {
      setShowLibrarySave(true);
      return;
    }
    if (action === "shortcuts" || action === "help") {
      setSidebarTab("help");
      setScreen("canvas");
      setMobileDrawer("sidebar");
      return;
    }
    if (action === "exit") {
      setScreen("welcome");
    }
  }

  function handleBottomNav(tab: BagsBottomNavTab) {
    if (tab === "add-image") {
      setAddImageOpen(true);
      setBottomNav(null);
      return;
    }
    setBottomNav((prev) => (prev === tab ? null : tab));
  }

  function stretchToArtboardWidth() {
    if (!selected) return;
    change({ widthIn: sheetWidth, xIn: 0 });
  }

  function stretchToArtboardHeight() {
    if (!selected) return;
    change({ heightIn: sheetHeight, yIn: 0 });
  }

  function centerBothSelection() {
    alignSelection("center-h");
    alignSelection("center-v");
  }

  function closeEditor() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "lgs:close-editor" }, page.parentOrigin || page.editorOrigin || "*");
    } else {
      setScreen("welcome");
    }
  }

  async function restoreDraft(draft: GangDraftV1) {
    setSheetWidth(draft.sheetWidth);
    setSheetHeight(draft.sheetHeight);
    setGap(draft.gap);
    const restored: CanvasItem[] = draft.items.map((d, idx) => ({
      assetId: d.assetId,
      widthPx: d.widthPx,
      heightPx: d.heightPx,
      dpi: d.dpi,
      contentType: d.contentType,
      id: crypto.randomUUID(),
      name: d.name,
      previewUrl:
        d.kind === "text"
          ? textPreviewDataUrl(
              d.textContent ?? d.name,
              d.fontSize ?? 36,
              d.fontFamily ?? "Arial",
              d.textColor ?? "#111827",
            )
          : assetPreviewUrl(d.assetId),
      xIn: d.xIn,
      yIn: d.yIn,
      widthIn: d.widthIn,
      heightIn: d.heightIn,
      rotationDeg: d.rotationDeg,
      flipX: d.flipX,
      flipY: d.flipY,
      zIndex: d.zIndex ?? idx + 1,
      kind: d.kind,
      textContent: d.textContent,
      fontSize: d.fontSize,
      fontFamily: d.fontFamily,
      textColor: d.textColor,
      lockAspect: d.lockAspect,
      lockPosition: d.lockPosition,
    }));
    setHistory([]);
    setFuture([]);
    setItems(restored);
    selectItem(restored[0]?.id ?? null);
    setDraftOffer(null);
    setScreen("canvas");
    setMessage(`Restored draft · ${restored.length} piece${restored.length === 1 ? "" : "s"}.`);
  }

  function discardDraft() {
    clearDraft(page.shop);
    setDraftOffer(null);
    setHasStoredDraft(false);
  }

  function clearSheet() {
    if (!items.length) return;
    if (!window.confirm("Clear all artwork from this gang sheet?")) return;
    pushHistory([]);
    selectItem(null);
    clearDraft(page.shop);
    setHasStoredDraft(false);
    setMessage("Sheet cleared.");
  }

  function layerAction(mode: "forward" | "backward" | "front" | "back") {
    if (!selectedId) return;
    const next = reorderLayer(items, selectedId, mode);
    if (!next) return;
    pushHistory(next);
  }

  function placeFromPool(poolId: string) {
    const entry = uploadPool.find((p) => p.id === poolId);
    if (!entry) return;
    const placed = createPlacedItem(entry.asset, entry.previewUrl, entry.name, 0, items);
    pushHistory([...items, placed]);
    selectItem(placed.id);
    setMessage(`Placed "${entry.name}" on the sheet — drag to position.`);
  }

  function sheetCountForAsset(assetId: string) {
    return items.filter((i) => i.assetId === assetId).length;
  }

  async function uploadFiles(
    files: File[],
    target: "canvas" | "auto",
    options?: { placeOnSheet?: boolean },
  ) {
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(`Uploading 0/${files.length}…`);
    setError("");
    setSaved(false);
    try {
      if (target === "canvas") {
        const poolAdded: PoolItem[] = [];
        const placed: CanvasItem[] = [];
        const placeOnSheet = options?.placeOnSheet ?? false;
        let base = items;
        let index = 0;
        for (const file of files) {
          index += 1;
          setUploadProgress(`Uploading ${index}/${files.length}: ${file.name}`);
          const asset = await postUpload(file);
          const previewUrl = URL.createObjectURL(file);
          poolAdded.push({
            id: crypto.randomUUID(),
            asset,
            previewUrl,
            name: file.name,
            uploadedAt: Date.now(),
          });
          if (placeOnSheet) {
            const item = createPlacedItem(asset, previewUrl, file.name, placed.length, [
              ...base,
              ...placed,
            ]);
            placed.push(item);
          }
        }
        setUploadPool((pool) => [...pool, ...poolAdded]);
        if (placed.length) {
          pushHistory([...items, ...placed]);
          selectItem(placed.at(-1)?.id ?? null);
        }
        setSidebarTab("uploads");
        setMessage(
          placeOnSheet
            ? `${poolAdded.length} file${poolAdded.length === 1 ? "" : "s"} uploaded and placed.`
            : `${poolAdded.length} file${poolAdded.length === 1 ? "" : "s"} in Uploads — click to place on sheet.`,
        );
      } else {
        const added: AutoDraft[] = [];
        for (const file of files) {
          const asset = await postUpload(file);
          const aspect = asset.widthPx / asset.heightPx;
          const w = Math.min(6, sheetWidth - 0.4);
          added.push({
            id: crypto.randomUUID(),
            asset,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
            widthIn: w,
            heightIn: w / aspect,
            quantity: 1,
            lockAspect: true,
          });
        }
        setAutoDrafts((d) => [...d, ...added]);
        setSelectedAutoId(added.at(-1)?.id ?? null);
        setMessage(`${added.length} design${added.length === 1 ? "" : "s"} added — set size and quantity.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function upscaleSelected() {
    if (!selected || selected.kind === "text") return;
    setUpscaling(true);
    setError("");
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(selected.assetId)}/upscale`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-LGS-Shop": page.shop },
        body: JSON.stringify({ widthIn: selected.widthIn, heightIn: selected.heightIn }),
      });
      const json = (await res.json()) as { assetId?: string; error?: string };
      if (!res.ok || !json.assetId) throw new Error(json.error || "Upscale failed");
      const previewUrl = assetPreviewUrl(json.assetId);
      change({ assetId: json.assetId, previewUrl });
      setMessage("Artwork upscaled for print.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upscale failed");
    } finally {
      setUpscaling(false);
    }
  }

  async function postUpload(file: File): Promise<Asset> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "X-LGS-Shop": page.shop },
      body: fd,
      credentials: "include",
    });
    const json = (await res.json()) as Asset & { error?: string };
    if (!res.ok) throw new Error(json.error || `Could not upload ${file.name}`);
    return json;
  }

  function selectionIds(): Set<string> {
    return selectedIds.size ? selectedIds : selectedId ? new Set([selectedId]) : new Set<string>();
  }

  function withLiveDpi(item: CanvasItem, patch: Partial<CanvasItem>): CanvasItem {
    const next = { ...item, ...patch };
    if (next.kind === "text") return next;
    if (patch.widthIn != null || patch.heightIn != null) {
      const dpi = liveDpi(next.widthPx, next.heightPx, next.widthIn, next.heightIn);
      if (dpi != null) next.dpi = Math.round(dpi);
    }
    return next;
  }

  function change(patch: Partial<CanvasItem>) {
    const ids = selectionIds();
    if (!ids.size) return;
    pushHistory(
      items.map((i) =>
        ids.has(i.id) ? inside(withLiveDpi(i, patch), sheetWidth, sheetHeight) : i,
      ),
    );
  }

  function undo() {
    const prev = history.at(-1);
    if (!prev) return;
    setFuture((f) => [items, ...f]);
    setHistory((h) => h.slice(0, -1));
    setItems(prev);
    setSaved(false);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, items]);
    setFuture((f) => f.slice(1));
    setItems(next);
    setSaved(false);
  }

  function duplicate() {
    if (!selected) return;
    const copy = inside(
      {
        ...selected,
        id: crypto.randomUUID(),
        xIn: selected.xIn + 0.35,
        yIn: selected.yIn + 0.35,
        zIndex: nextZIndex(items),
      },
      sheetWidth,
      sheetHeight,
    );
    pushHistory([...items, copy]);
    selectItem(copy.id);
  }

  function removeSelected() {
    const ids = selectedIds.size ? selectedIds : selectedId ? new Set([selectedId]) : new Set<string>();
    if (!ids.size) return;
    pushHistory(items.filter((i) => !ids.has(i.id)));
    selectItem(null);
  }

  function rotateCcw() {
    if (!selected) return;
    change({
      widthIn: selected.heightIn,
      heightIn: selected.widthIn,
      rotationDeg: selected.rotationDeg ? 0 : 90,
    });
  }

  function rotateCw() {
    if (!selected) return;
    change({
      widthIn: selected.heightIn,
      heightIn: selected.widthIn,
      rotationDeg: selected.rotationDeg ? 0 : 90,
      flipX: !selected.flipX,
    });
  }

  function rotate() {
    rotateCcw();
  }

  function flipHorizontal() {
    if (!selected) return;
    change({ flipX: !selected.flipX });
  }

  function flipVertical() {
    if (!selected) return;
    change({ flipY: !selected.flipY });
  }

  function addPoolItemToAuto(entry: PoolItem) {
    const aspect = entry.asset.widthPx / entry.asset.heightPx;
    const w = Math.min(6, sheetWidth - 0.4);
    const draft: AutoDraft = {
      id: crypto.randomUUID(),
      asset: entry.asset,
      previewUrl: entry.previewUrl,
      name: entry.name,
      widthIn: w,
      heightIn: w / aspect,
      quantity: 1,
      lockAspect: true,
    };
    setAutoDrafts((d) => [...d, draft]);
    setSelectedAutoId(draft.id);
    setMessage(`Added "${entry.name}" from uploads.`);
  }

  async function addGalleryItemToAuto(g: GalleryItem) {
    setUploading(true);
    try {
      const { asset, previewUrl } = await galleryThumbToAsset(g);
      const aspect = asset.widthPx / asset.heightPx;
      const w = Math.min(g.widthIn ?? 6, sheetWidth - 0.4);
      const draft: AutoDraft = {
        id: crypto.randomUUID(),
        asset,
        previewUrl,
        name: g.name,
        widthIn: w,
        heightIn: g.heightIn ?? w / aspect,
        quantity: 1,
        lockAspect: true,
      };
      setAutoDrafts((d) => [...d, draft]);
      setSelectedAutoId(draft.id);
      setMessage(`Added "${g.name}" from gallery.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add gallery item");
    } finally {
      setUploading(false);
    }
  }

  function fillSheet() {
    if (!selected) return;
    setAutomationKind("auto-fill");
    setAutomationOpen(true);
  }

  function confirmFillSheet() {
    if (!selected) return;
    const copies: CanvasItem[] = [];
    let z = nextZIndex(items);
    for (let y = 0.1; y + selected.heightIn <= sheetHeight; y += selected.heightIn + gap) {
      for (let x = 0.1; x + selected.widthIn <= sheetWidth; x += selected.widthIn + gap) {
        copies.push({ ...selected, id: crypto.randomUUID(), xIn: x, yIn: y, zIndex: z++ });
        if (copies.length >= 250) break;
      }
      if (copies.length >= 250) break;
    }
    pushHistory([...items.filter((i) => i.id !== selected.id), ...copies]);
    selectItem(copies[0]?.id ?? null);
    setMessage(`Filled sheet with ${copies.length} copies. Undo with Ctrl+Z.`);
    setAutomationOpen(false);
  }

  function openAutoNestModal() {
    setAutomationKind("auto-nest");
    setNestPreview(shelfPackLayout(items, sheetWidth, sheetHeight, gap));
    setAutomationOpen(true);
  }

  function confirmAutoNest() {
    const preview = shelfPackLayout(items, sheetWidth, sheetHeight, gap);
    if (preview.remainingCount > 0) {
      setMessage(
        `Nested ${preview.fittedCount} of ${items.length} pieces — ${preview.remainingCount} did not fit. Undo with Ctrl+Z.`,
      );
    } else {
      setMessage(`Artwork automatically arranged. Undo with Ctrl+Z.`);
    }
    pushHistory(preview.placed);
    setNestPreview(null);
    setAutomationOpen(false);
  }

  function applyImageEditorResult(result: BagsImageEditorResult) {
    if (!selected) return;
    const dims = applyCropToDimensions(
      selected.widthPx,
      selected.heightPx,
      selected.widthIn,
      selected.heightIn,
      result.crop,
    );
    change({
      previewUrl: result.previewUrl,
      adjustments: result.adjustments,
      widthPx: dims.widthPx,
      heightPx: dims.heightPx,
      widthIn: dims.widthIn,
      heightIn: dims.heightIn,
    });
    setImageEditorOpen(false);
    setMessage("Image adjustments applied.");
  }

  const autoFillPreviewCount = selected
    ? autoFillCopyCount(selected.widthIn, selected.heightIn, sheetWidth, sheetHeight, gap)
    : 0;

  function autoArrange() {
    const preview = shelfPackLayout(items, sheetWidth, sheetHeight, gap);
    pushHistory(preview.placed);
    setMessage(
      preview.remainingCount > 0
        ? `Arranged ${preview.fittedCount} pieces — ${preview.remainingCount} did not fit. Undo with Ctrl+Z.`
        : "Artwork automatically arranged. Undo with Ctrl+Z.",
    );
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Escape") {
        if (draftOffer) setDraftOffer(null);
        else selectItem(null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && screen === "canvas") {
          e.preventDefault();
          removeSelected();
        }
        return;
      }
      if (e.code === "Space" && !spacePan) {
        setSpacePan(true);
        return;
      }
      if (!selectionIds().size || screen !== "canvas") return;
      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? NUDGE_SHIFT_IN : NUDGE_IN;
      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else return;
      e.preventDefault();
      const ids = selectionIds();
      const cur = itemsRef.current;
      const next = cur.map((i) =>
        ids.has(i.id) && !i.lockPosition
          ? inside({ ...i, xIn: i.xIn + dx, yIn: i.yIn + dy }, sheetWidth, sheetHeight)
          : i,
      );
      pushHistory(next);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePan(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [draftOffer, pushHistory, screen, selectedId, sheetHeight, sheetWidth, spacePan]);

  function textPreviewDataUrl(
    content: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    strokeWidth = 0,
    strokeColor = "#111827",
  ) {
    const safe = content.replace(/[<>&"]/g, "");
    const stroke =
      strokeWidth > 0
        ? ` stroke="${strokeColor}" stroke-width="${strokeWidth}" paint-order="stroke fill"`
        : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120"><text x="8" y="${fontSize + 8}" font-size="${fontSize}" font-family="${fontFamily}" fill="${color}"${stroke}>${safe}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function applyNameSizePreset(presetId: NamesNumbersSizePresetId) {
    const preset = NAME_SIZE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setRosterNameFontSize(preset.fontSize);
    setRosterNameWidthIn(preset.widthIn);
    setRosterNameStrokeWidth(preset.strokeWidth);
  }

  function applyNumberSizePreset(presetId: NamesNumbersSizePresetId) {
    const preset = NUMBER_SIZE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setRosterNumberFontSize(preset.fontSize);
    setRosterNumberWidthIn(preset.widthIn);
    setRosterNumberStrokeWidth(preset.strokeWidth);
  }

  function addTextToSheet(content?: string) {
    const label = (content ?? textContent).trim() || "Text";
    const w = Math.min(8, sheetWidth - 0.4);
    const h = Math.max(0.5, textFontSize / 72);
    const item: CanvasItem = {
      assetId: `text-local-${crypto.randomUUID()}`,
      widthPx: 400,
      heightPx: 120,
      contentType: "image/svg+xml",
      id: crypto.randomUUID(),
      name: label.slice(0, 32),
      previewUrl: textPreviewDataUrl(label, textFontSize, textFontFamily, textColor),
      xIn: 0.5,
      yIn: 0.5,
      widthIn: w,
      heightIn: h,
      rotationDeg: 0,
      zIndex: nextZIndex(items),
      kind: "text",
      textContent: label,
      fontSize: textFontSize,
      fontFamily: textFontFamily,
      textColor,
      lockAspect: false,
    };
    pushHistory([...items, item]);
    selectItem(item.id);
    setMessage(`Added text "${label}" — drag to position.`);
  }

  async function rasterizeGalleryItem(g: GalleryItem): Promise<File> {
    const image = new Image();
    image.src = g.thumb;
    await image.decode();
    const canvasEl = document.createElement("canvas");
    canvasEl.width = Math.max(1, Math.round(g.widthIn * 300));
    canvasEl.height = Math.max(1, Math.round(g.heightIn * 300));
    const context = canvasEl.getContext("2d");
    if (!context) throw new Error("Could not prepare gallery artwork");
    context.drawImage(image, 0, 0, canvasEl.width, canvasEl.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvasEl.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Could not prepare gallery artwork"))),
        "image/png",
      ),
    );
    return new File([blob], `${g.name}.png`, { type: "image/png" });
  }

  async function galleryThumbToAsset(g: GalleryItem): Promise<{ asset: Asset; previewUrl: string }> {
    const file = await rasterizeGalleryItem(g);
    const asset = await postUpload(file);
    return { asset, previewUrl: g.thumb };
  }

  async function placeGalleryItem(g: GalleryItem) {
    setUploading(true);
    setError("");
    try {
      const { asset, previewUrl } = await galleryThumbToAsset(g);
      const placed = createPlacedItem(asset, previewUrl, g.name, 0, items);
      placed.widthIn = g.widthIn;
      placed.heightIn = g.heightIn;
      placed.dpi = Math.round(
        Math.min(asset.widthPx / g.widthIn, asset.heightPx / g.heightIn),
      );
      pushHistory([...items, placed]);
      selectItem(placed.id);
      setMessage(`Placed "${g.name}" from gallery.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place gallery item");
    } finally {
      setUploading(false);
    }
  }

  function parseLineList(raw: string): string[] {
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function generateNames() {
    const labels = parseLineList(namesList);
    if (!labels.length) {
      setError("Add at least one name — one per line.");
      return;
    }
    const next: CanvasItem[] = [...items];
    let z = nextZIndex(next);
    labels.forEach((label, idx) => {
      for (let copy = 0; copy < rosterQuantity; copy += 1) {
        const nameH = Math.max(0.35, rosterNameFontSize / 72);
        const nameW = Math.min(rosterNameWidthIn, sheetWidth - 0.4);
        const yBase = 0.2 + (idx * rosterQuantity + copy) * (nameH + gap);
        next.push({
          assetId: `text-roster-name-${crypto.randomUUID()}`,
          widthPx: 400,
          heightPx: 80,
          contentType: "image/svg+xml",
          id: crypto.randomUUID(),
          name: label,
          previewUrl: textPreviewDataUrl(
            label,
            rosterNameFontSize,
            rosterNameFontFamily,
            rosterTextColor,
            rosterNameStrokeWidth,
            rosterStrokeColor,
          ),
          xIn: 0.2,
          yIn: yBase,
          widthIn: nameW,
          heightIn: nameH,
          rotationDeg: 0,
          zIndex: z++,
          kind: "text",
          textContent: label,
          fontSize: rosterNameFontSize,
          fontFamily: rosterNameFontFamily,
          textColor: rosterTextColor,
        });
      }
    });
    pushHistory(next);
    selectItem(next.at(-1)?.id ?? null);
    setMessage(`Generated ${labels.length} name layer${labels.length === 1 ? "" : "s"}.`);
    setSidebarTab("layers");
    setMobileDrawer("sidebar");
  }

  function generateNumbers() {
    const labels = parseLineList(numbersList);
    if (!labels.length) {
      setError("Add at least one number — one per line.");
      return;
    }
    const dupes = labels.filter((n, i) => labels.indexOf(n) !== i);
    if (dupes.length) {
      setError(`Duplicate numbers found: ${[...new Set(dupes)].join(", ")}`);
      return;
    }
    const next: CanvasItem[] = [...items];
    let z = nextZIndex(next);
    labels.forEach((raw, idx) => {
      const label = raw.startsWith("#") ? raw : `#${raw}`;
      for (let copy = 0; copy < rosterQuantity; copy += 1) {
        const numH = Math.max(0.35, rosterNumberFontSize / 72);
        const numW = Math.min(rosterNumberWidthIn, sheetWidth - 0.4);
        const yBase = 0.2 + (idx * rosterQuantity + copy) * (numH + gap);
        next.push({
          assetId: `text-roster-number-${crypto.randomUUID()}`,
          widthPx: 400,
          heightPx: 80,
          contentType: "image/svg+xml",
          id: crypto.randomUUID(),
          name: label,
          previewUrl: textPreviewDataUrl(
            label,
            rosterNumberFontSize,
            rosterNumberFontFamily,
            rosterTextColor,
            rosterNumberStrokeWidth,
            rosterStrokeColor,
          ),
          xIn: 0.2,
          yIn: yBase,
          widthIn: numW,
          heightIn: numH,
          rotationDeg: 0,
          zIndex: z++,
          kind: "text",
          textContent: label,
          fontSize: rosterNumberFontSize,
          fontFamily: rosterNumberFontFamily,
          textColor: rosterTextColor,
        });
      }
    });
    pushHistory(next);
    selectItem(next.at(-1)?.id ?? null);
    setMessage(`Generated ${labels.length} number layer${labels.length === 1 ? "" : "s"}.`);
    setSidebarTab("layers");
    setMobileDrawer("sidebar");
  }

  function openDesignPicker(tab: DesignPickerTab = "mine") {
    setDesignPickerTab(tab);
    setDesignPickerOpen(true);
    void refreshLibrary(true);
  }

  function renamePoolItem(poolId: string, name: string) {
    setUploadPool((pool) => pool.map((p) => (p.id === poolId ? { ...p, name } : p)));
  }

  function deletePoolItem(poolId: string) {
    setUploadPool((pool) => pool.filter((p) => p.id !== poolId));
  }

  function openBgRemoveForAsset(assetId: string, previewUrl: string) {
    setBgRemove({ sourceAssetId: assetId, sourcePreviewUrl: previewUrl });
  }

  function replaceAssetEverywhere(oldAssetId: string, asset: Asset, previewUrl: string) {
    setUploadPool((pool) =>
      pool.map((p) =>
        p.asset.assetId === oldAssetId ? { ...p, asset, previewUrl } : p,
      ),
    );
    setAutoDrafts((drafts) =>
      drafts.map((d) =>
        d.asset.assetId === oldAssetId ? { ...d, asset, previewUrl } : d,
      ),
    );
    pushHistory(
      itemsRef.current.map((i) =>
        i.assetId === oldAssetId
          ? {
              ...i,
              ...asset,
              previewUrl,
            }
          : i,
      ),
    );
    setSaved(false);
    setMessage("Background removed — artwork updated.");
  }

  function applyBgRemoveResult(processed: ProcessedAsset, previewUrl: string) {
    if (!bgRemove) return;
    replaceAssetEverywhere(bgRemove.sourceAssetId, processed, previewUrl);
    setBgRemove(null);
  }

  function handleSidebarTab(tab: SidebarTab) {
    if (tab === "auto") {
      setScreen("auto_build");
      setAutoPhase("setup");
      setMessage("Auto Arrange — upload, set quantities, preview, then apply.");
      return;
    }
    setSidebarTab(tab);
    setMobileDrawer("sidebar");
  }

  const filteredPool = useMemo(() => {
    let list = [...uploadPool];
    if (uploadSearch.trim()) {
      const q = uploadSearch.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    list.sort((a, b) =>
      uploadSort === "name"
        ? a.name.localeCompare(b.name)
        : b.uploadedAt - a.uploadedAt,
    );
    return list;
  }, [uploadPool, uploadSearch, uploadSort]);

  const filteredGallery = useMemo(() => {
    let list = galleryItems;
    if (galleryCategory !== "All") list = list.filter((g) => g.category === galleryCategory);
    if (gallerySearch.trim()) {
      const q = gallerySearch.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [galleryCategory, gallerySearch, galleryItems]);

  async function refreshGallery() {
    setGalleryLoading(true);
    setGalleryError("");
    try {
      const params = new URLSearchParams();
      if (galleryCategory !== "All") params.set("category", galleryCategory);
      if (gallerySearch.trim()) params.set("search", gallerySearch.trim());
      const res = await fetch(`/api/gallery?${params.toString()}`, {
        credentials: "include",
        headers: { "X-LGS-Shop": page.shop },
      });
      const json = (await res.json()) as {
        categories?: string[];
        items?: GalleryItem[];
        error?: string;
      };
      if (!res.ok) {
        setGalleryItems([]);
        setGalleryError(json.error || "Could not load gallery artwork.");
        return;
      }
      setGalleryItems(json.items ?? []);
      if (json.categories?.length) setGalleryCategories(json.categories);
    } catch {
      setGalleryItems([]);
      setGalleryError("Could not load gallery artwork. Check your connection and try again.");
    } finally {
      setGalleryLoading(false);
    }
  }

  async function refreshLibrary(includeArchived = libraryIncludeArchived) {
    setLibraryLoading(true);
    setLibraryError("");
    try {
      const q = librarySearch.trim();
      const params = new URLSearchParams({
        sort: librarySort,
        workflow: "gang_sheet",
      });
      if (q) params.set("search", q);
      if (includeArchived) params.set("archived", "1");
      if (page.productGid) params.set("productGid", page.productGid);
      const res = await fetch(`/api/design-library?${params.toString()}`, {
        credentials: "include",
        headers: { "X-LGS-Shop": page.shop },
      });
      const json = (await res.json()) as { designs?: LibraryDesign[]; error?: string };
      if (!res.ok) {
        setSavedDesigns([]);
        setLibraryError(json.error || "Could not load saved designs.");
        return;
      }
      setSavedDesigns(json.designs ?? []);
    } catch {
      setSavedDesigns([]);
      setLibraryError("Could not load saved designs. Check your connection and try again.");
    } finally {
      setLibraryLoading(false);
      setLibraryLoaded(true);
    }
  }

  async function renameLibraryDesign(designId: string, name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    try {
      const res = await fetch("/api/design-library", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-LGS-Shop": page.shop },
        body: JSON.stringify({ intent: "rename", designId, name: cleanName }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Rename failed");
      setLibraryRenamingId(null);
      setLibraryRenameValue("");
      await refreshLibrary();
      if (editingDesignId === designId) setDesignName(cleanName);
      setMessage(`Renamed to "${cleanName}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    }
  }

  async function archiveLibraryDesign(designId: string) {
    if (!window.confirm("Archive this design? You can show archived designs with the filter below.")) {
      return;
    }
    try {
      const res = await fetch("/api/design-library", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-LGS-Shop": page.shop },
        body: JSON.stringify({ intent: "archive", designId, archived: true }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Archive failed");
      await refreshLibrary();
      setMessage("Design archived.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed");
    }
  }

  async function loadRemoteDesign(designId: string, version?: number) {
    setError("");
    try {
      const url = version
        ? `/api/designs/${encodeURIComponent(designId)}?version=${version}`
        : `/api/designs/${encodeURIComponent(designId)}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { "X-LGS-Shop": page.shop },
      });
      const json = (await res.json()) as RemoteDesignPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not load design");

      const restored: CanvasItem[] = json.state.items.map((d, idx) => {
        const meta = json.assets?.[d.assetId];
        const isText = d.kind === "text" || d.textContent;
        return {
          assetId: d.assetId,
          widthPx: meta?.widthPx ?? 400,
          heightPx: meta?.heightPx ?? 120,
          dpi: meta?.dpi,
          contentType: meta?.contentType ?? (isText ? "image/svg+xml" : "image/png"),
          id: crypto.randomUUID(),
          name: d.name || (isText ? d.textContent || "Text" : "Artwork"),
          previewUrl: isText
            ? textPreviewDataUrl(
                d.textContent || d.name || "Text",
                d.fontSize ?? 36,
                d.fontFamily ?? "Arial",
                d.textColor ?? "#111827",
              )
            : assetPreviewUrl(d.assetId),
          xIn: d.xIn ?? 0,
          yIn: d.yIn ?? 0,
          widthIn: d.widthIn,
          heightIn: d.heightIn,
          rotationDeg: d.rotationDeg ?? 0,
          flipX: d.flipX,
          flipY: d.flipY,
          zIndex: d.zIndex ?? idx + 1,
          kind: isText ? "text" : "image",
          textContent: d.textContent,
          fontSize: d.fontSize,
          fontFamily: d.fontFamily,
          textColor: d.textColor,
        };
      });

      setSheetWidth(json.state.sheet.widthIn);
      setSheetHeight(json.state.sheet.maxHeightIn);
      setGap(json.state.sheet.imageMarginIn);
      const marginIn = json.state.sheet.artboardMarginIn;
      if (marginIn != null && marginIn > 0) {
        setArtboardMarginEnabled(true);
        setArtboardMarginIn(normalizeArtboardMarginIn(marginIn));
      } else {
        setArtboardMarginEnabled(false);
      }
      setHistory([]);
      setFuture([]);
      setItems(restored);
      selectItem(restored[0]?.id ?? null);
      setEditingDesignId(json.designId);
      setEditingVersion(json.version);
      setDesignName(json.name);
      setDesignPickerOpen(false);
      setScreen("canvas");
      setSaved(true);
      setDirty(false);
      setMessage(
        json.name
          ? `Opened "${json.name}" · v${json.version}`
          : `Opened design · v${json.version}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load design");
    }
  }

  async function saveNamedDesign(name: string) {
    if (!editingDesignId) {
      setError("Save the design first, then add it to your library.");
      return;
    }
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Enter a design name.");
      return;
    }
    setLibrarySaving(true);
    setError("");
    try {
        const res = await fetch("/api/design-library", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-LGS-Shop": page.shop },
          body: JSON.stringify({ intent: "save", designId: editingDesignId, name: cleanName }),
        });
        const json = (await res.json()) as { error?: string; name?: string };
        if (!res.ok) throw new Error(json.error || "Could not save to library");
      setDesignName(json.name ?? cleanName);
      await refreshLibrary();
      setShowLibrarySave(false);
      setLibraryName("");
      setMessage(`Saved "${cleanName}" to your design library.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Library save failed");
    } finally {
      setLibrarySaving(false);
    }
  }

  async function rasterizeTextItem(item: CanvasItem): Promise<Asset> {
    const canvasEl = document.createElement("canvas");
    const scale = 4;
    canvasEl.width = 400 * scale;
    canvasEl.height = 120 * scale;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) throw new Error("Could not rasterize text");
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, 400, 120);
    ctx.font = `${item.fontSize ?? 36}px ${item.fontFamily ?? "Arial"}`;
    ctx.fillStyle = item.textColor ?? "#111827";
    ctx.fillText(item.textContent ?? item.name, 8, (item.fontSize ?? 36) + 8);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvasEl.toBlob((b) => (b ? resolve(b) : reject(new Error("Rasterize failed"))), "image/png");
    });
    const file = new File([blob], `${item.name}.png`, { type: "image/png" });
    return postUpload(file);
  }

  function alignSelection(mode: Parameters<typeof alignSelected>[2]) {
    const ids = selectedIds.size ? selectedIds : selectedId ? new Set([selectedId]) : new Set<string>();
    if (!ids.size) return;
    pushHistory(alignSelected(items, ids, mode, sheetWidth, sheetHeight));
  }

  function distributeSelection(axis: "horizontal" | "vertical") {
    const ids = selectedIds.size ? selectedIds : selectedId ? new Set([selectedId]) : new Set<string>();
    if (ids.size < 3) {
      setMessage("Select at least 3 items to distribute.");
      return;
    }
    pushHistory(distributeSelected(items, ids, axis, sheetWidth, sheetHeight));
  }

  const refreshAutoPreview = useCallback(async (): Promise<AutoNestPreview | null> => {
    if (!autoDrafts.length) {
      setAutoPreview(null);
      setAutoPreviewError("");
      return null;
    }
    setAutoPreviewLoading(true);
    setAutoPreviewError("");
    try {
      const nestItems = buildNestItemsFromDrafts(autoDrafts);
      const res = await fetch("/api/nest/preview", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-LGS-Shop": page.shop,
        },
        body: JSON.stringify({
          items: nestItems,
          sheet: {
            widthIn: sheetWidth,
            maxHeightIn: sheetHeight,
            imageMarginIn: gap,
            artboardMarginIn: artboardMarginEnabled ? artboardMarginIn : 0,
          },
          allowRotate90,
        }),
      });
      const json = (await res.json()) as {
        placements?: NestPlacement[];
        sheetHeightIn?: number;
        sheetWidthIn?: number;
        utilization?: number;
        fittedCount?: number;
        remainingCount?: number;
        error?: string;
      };
      if (!res.ok || !json.placements) {
        throw new Error(json.error || "Could not generate nest preview");
      }
      const pieces = mapPlacementsToPieces(json.placements, autoDrafts);
      const totalArea = totalDraftArea(autoDrafts);
      const preview: AutoNestPreview = {
        placements: json.placements,
        sheetHeightIn: json.sheetHeightIn ?? sheetHeight,
        sheetWidthIn: json.sheetWidthIn ?? sheetWidth,
        utilization: json.utilization ?? 0,
        pieces,
        totalPieces: nestItems.length,
        totalAreaSqIn: totalArea,
        estimateUsd: Math.round(totalArea * 0.049 * 100) / 100,
        fittedCount: json.fittedCount,
        remainingCount: json.remainingCount,
      };
      setAutoPreview(preview);
      return preview;
    } catch (err) {
      setAutoPreview(null);
      const msg = err instanceof Error ? err.message : "Preview failed";
      setAutoPreviewError(msg);
      return null;
    } finally {
      setAutoPreviewLoading(false);
    }
  }, [allowRotate90, autoDrafts, gap, page.shop, sheetHeight, sheetWidth]);

  useEffect(() => {
    if (screen !== "auto_build" || autoPhase !== "setup") return;
    const t = setTimeout(() => void refreshAutoPreview(), 350);
    return () => clearTimeout(t);
  }, [screen, autoPhase, refreshAutoPreview]);

  async function applyAutoBuild() {
    if (!autoDrafts.length) {
      setError("Upload at least one design for Auto Build");
      return;
    }
    if (autoPreviewError) {
      setError(autoPreviewError);
      return;
    }
    setAutoBusy(true);
    setError("");
    try {
      const preview = autoPreview ?? (await refreshAutoPreview());
      if (!preview?.pieces.length) {
        throw new Error(autoPreviewError || "Generate a nest preview first");
      }

      let z = nextZIndex(items);
      const placed: CanvasItem[] = preview.pieces.map((p) => {
        const draft = autoDrafts.find((d) => d.id === p.draftId) ?? autoDrafts[0];
        return {
          ...draft.asset,
          id: crypto.randomUUID(),
          name: p.name,
          previewUrl: p.previewUrl,
          xIn: p.xIn,
          yIn: p.yIn,
          widthIn: p.widthIn,
          heightIn: p.heightIn,
          rotationDeg: p.rotationDeg,
          zIndex: z++,
        };
      });

      const needed = preview.sheetHeightIn;
      if (needed > sheetHeight) {
        setSheetHeight(SHEET_HEIGHTS.find((h) => h >= needed) ?? Math.ceil(needed));
      }

      pushHistory(placed);
      setAutoPreview(null);
      setAutoDrafts([]);
      setScreen("canvas");
      setMessage(`Built gang sheet with ${placed.length} copies — adjust in the editor or save.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto Build failed");
    } finally {
      setAutoBusy(false);
    }
  }

  function undoAutoResult() {
    setAutoPreview(null);
    setAutoPhase("setup");
    setMessage("Back to Auto Build setup — adjust sizes or regenerate.");
  }

  async function save(options?: { addToCart?: boolean; closeDialog?: boolean }) {
    if (!items.length) {
      setError("Add artwork before saving.");
      return;
    }
    setSaving(true);
    setError("");
    setSaveDialogError("");
    setSaveDialogRequestId("");
    try {
      const resolved: Array<{
        assetId: string;
        widthIn: number;
        heightIn: number;
        xIn: number;
        yIn: number;
        rotationDeg: 0 | 90;
        flipX?: boolean;
        flipY?: boolean;
        zIndex: number;
        quantity: number;
        kind?: "image" | "text";
        name?: string;
        textContent?: string;
        fontSize?: number;
        fontFamily?: string;
        textColor?: string;
      }> = [];
      for (const item of sortByZIndex(items)) {
        let assetId = item.assetId;
        if (item.kind === "text") {
          const asset = await rasterizeTextItem(item);
          assetId = asset.assetId;
        }
        resolved.push({
          assetId,
          widthIn: item.widthIn,
          heightIn: item.heightIn,
          xIn: item.xIn,
          yIn: item.yIn,
          rotationDeg: item.rotationDeg,
          flipX: item.flipX,
          flipY: item.flipY,
          zIndex: item.zIndex,
          quantity: 1,
          kind: item.kind,
          name: item.name,
          textContent: item.textContent,
          fontSize: item.fontSize,
          fontFamily: item.fontFamily,
          textColor: item.textColor,
        });
      }
      const body = {
        productGid: page.productGid,
        variantGid: page.variantId
          ? `gid://shopify/ProductVariant/${page.variantId}`
          : undefined,
        sheet: {
          widthIn: sheetWidth,
          maxHeightIn: sheetHeight,
          imageMarginIn: gap,
          artboardMarginIn: artboardMarginEnabled ? artboardMarginIn : 0,
        },
        items: resolved,
        name: designName ?? undefined,
        saveToLibrary: Boolean(designName),
      };
      const res = await fetch(
        editingDesignId
          ? `/api/designs/${encodeURIComponent(editingDesignId)}`
          : "/api/designs",
        {
          method: editingDesignId ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-LGS-Shop": page.shop },
          body: JSON.stringify(body),
        },
      );
      const json = (await res.json()) as {
        designId?: string;
        version?: number;
        name?: string | null;
        cartProperties?: Record<string, string>;
        error?: string;
        requestId?: string;
        state?: { pricing: { totalCents: number } };
      };
      if (!res.ok || !json.designId) {
        setSaveDialogRequestId(json.requestId ?? "");
        throw new Error(json.error || "Could not save design");
      }
      setSaved(true);
      setDirty(false);
      setEditingDesignId(json.designId);
      setEditingVersion(json.version ?? editingVersion);
      clearDraft(page.shop);
      setHasStoredDraft(false);
      setMessage(
        editingDesignId && (json.version ?? 0) > (editingVersion ?? 0)
          ? `Saved v${json.version} · $${((json.state?.pricing.totalCents || 0) / 100).toFixed(2)}`
          : `Design saved · $${((json.state?.pricing.totalCents || 0) / 100).toFixed(2)}`,
      );
      if (options?.addToCart !== false && window.parent && window.parent !== window) {
        const target = page.parentOrigin || page.editorOrigin || "*";
        window.parent.postMessage(
          {
            type: "lgs:design-ready",
            designId: json.designId,
            version: json.version,
            designName: designName || json.name,
            cartProperties: json.cartProperties,
          },
          target,
        );
      }
      if (options?.closeDialog !== false && showSaveDialog) {
        setShowSaveDialog(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save design";
      setError(msg);
      setSaveDialogError(msg);
    } finally {
      setSaving(false);
    }
  }

  const restoreDialog =
    draftOffer && screen === "welcome" ? (
      <div
        className="draft-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-restore-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") setDraftOffer(null);
        }}
      >
        <div className="draft-modal-card">
          <h2 id="draft-restore-title">Continue your draft?</h2>
          <p>
            A local draft with {draftOffer.items.length} piece
            {draftOffer.items.length === 1 ? "" : "s"} was found for this shop.
          </p>
          <div className="draft-modal-actions">
            <button type="button" className="save" onClick={() => void restoreDraft(draftOffer)}>
              Restore
            </button>
            <button type="button" onClick={discardDraft}>
              Discard
            </button>
            <button type="button" className="ghost-btn" onClick={() => setDraftOffer(null)}>
              Not now
            </button>
          </div>
        </div>
      </div>
    ) : null;

  const librarySaveDialog = showLibrarySave ? (
    <div className="draft-modal" role="dialog" aria-modal="true" aria-labelledby="library-save-title">
      <form
        className="draft-modal-card"
        onSubmit={(event) => {
          event.preventDefault();
          void saveNamedDesign(libraryName);
        }}
      >
        <h2 id="library-save-title">Save to your design library</h2>
        <p>Name this design so you can find, edit, or reorder it later.</p>
        <label className="library-name-field">
          Design name
          <input
            autoFocus
            value={libraryName}
            maxLength={80}
            onChange={(event) => setLibraryName(event.target.value)}
            placeholder="Example: Smith family shirts"
          />
        </label>
        <div className="draft-modal-actions">
          <button type="submit" className="save" disabled={librarySaving || !libraryName.trim()}>
            {librarySaving ? "Saving…" : "Save design"}
          </button>
          <button type="button" className="ghost-btn" onClick={() => setShowLibrarySave(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  ) : null;

  if (screen === "welcome") {
    const ubsHref = `/editor/upload-by-size?shop=${encodeURIComponent(page.shop)}`;
    return (
      <>
        <style>{BAGS_BASE_CSS}{GANG_SHEET_EDITOR_CSS}{BAGS_PARITY_EDITOR_CSS}{BACKGROUND_REMOVAL_MODAL_CSS}</style>
        {restoreDialog}
        <BagsWelcomeCenter
          appearance={page.appearance}
          appearanceVars={appearanceVars(page.appearance)}
          welcomeTitle={page.appearance.welcomeTitle}
          welcomeSubtitle={page.appearance.welcomeSubtitle}
          sheetWidth={sheetWidth}
          sheetHeight={sheetHeight}
          sheetWidths={allowedSheetWidths}
          sheetHeights={allowedSheetHeights}
          onSheetWidthChange={setSheetWidth}
          onSheetHeightChange={setSheetHeight}
          priceLabel={welcomePriceLabel}
          hasDevAuth={page.hasDevAuth}
          footer={
            savedDesigns.length ? (
              <div className="saved-designs-list" style={{ marginTop: 16 }}>
                <h3>Saved designs</h3>
                {savedDesigns.slice(0, 6).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="saved-design-row"
                    onClick={() => void loadRemoteDesign(d.id, d.version)}
                  >
                    <span className="saved-design-copy">
                      <strong>{d.name || "Untitled design"}</strong>
                      <small>
                        {d.sheetLabel} · ${(d.priceCents / 100).toFixed(2)}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            ) : null
          }
        >
          <BagsWelcomeAction
            featured
            title="Build a Gang Sheet"
            description="Open the canvas with your selected sheet size — upload, place, and arrange."
            icon={<EditorRailIcon name="sheet" label="Build" />}
            onClick={() => openCanvas({ tab: "uploads" })}
          />
          <BagsWelcomeAction
            title="Upload by Size"
            description="Single-design workflow with presets and live pricing."
            icon={<EditorRailIcon name="upload" label="Upload by Size" />}
            href={ubsHref}
          />
          <BagsWelcomeAction
            title="Auto Arrange"
            description="Bulk upload with live nest preview — fastest for many designs."
            icon={<EditorRailIcon name="auto" label="Auto Build" />}
            onClick={() => {
              setScreen("auto_build");
              setAutoPhase("setup");
              setAutoDrafts([]);
              setAutoPreview(null);
              setAutoPreviewError("");
              setSelectedAutoId(null);
            }}
          />
          <BagsWelcomeAction
            title="Start from a template"
            description="Pick a preset sheet layout and open the editor."
            icon={<EditorRailIcon name="template" label="Templates" />}
            onClick={() => setShowTemplates((v) => !v)}
          />
          <BagsWelcomeAction
            title="Open saved design"
            description={
              libraryLoading
                ? "Loading your saved gang sheets…"
                : libraryError
                  ? `${libraryError} Tap to retry.`
                  : savedDesigns.length
                    ? `${savedDesigns.length} saved design${savedDesigns.length === 1 ? "" : "s"} in your library.`
                    : libraryLoaded
                      ? "No saved gang sheets yet — save from the canvas to build your library."
                      : "Checking your saved designs…"
            }
            icon={<EditorRailIcon name="saved" label="Saved" />}
            disabled={libraryLoading || (!libraryError && !savedDesigns.length && libraryLoaded)}
            busy={libraryLoading}
            onClick={() => {
              if (libraryError) void refreshLibrary();
              else if (savedDesigns.length) openDesignPicker("mine");
            }}
          />
          {hasStoredDraft ? (
            <BagsWelcomeAction
              title="Continue draft"
              description="Resume the local draft saved on this device."
              icon={<EditorRailIcon name="upload" label="Continue" />}
              onClick={() => {
                const d = readDraft(page.shop);
                if (d) void restoreDraft(d);
              }}
            />
          ) : null}
          <BagsWelcomeAction
            title="Upload image(s)"
            description="Add files to Uploads, then click each one to place on the gang sheet."
            icon={<EditorRailIcon name="uploads" label="Upload" />}
            onClick={() => openCanvas({ tab: "uploads", pickUpload: true })}
          />
        </BagsWelcomeCenter>
        {showTemplates ? (
          <div className="bags-parity-modal-backdrop" role="presentation" onClick={() => setShowTemplates(false)}>
            <div className="bags-parity-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <header className="bags-modal-head">
                <h2>Sheet templates</h2>
                <button type="button" className="bags-icon-btn" onClick={() => setShowTemplates(false)} aria-label="Close">
                  ×
                </button>
              </header>
              <div className="bags-modal-body template-picker">
                {SHEET_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className="template-card"
                    onClick={() => {
                      applySheetSize(tpl.widthIn, tpl.heightIn);
                      setShowTemplates(false);
                      openCanvas({ tab: "uploads" });
                    }}
                  >
                    <strong>{tpl.name}</strong>
                    <span>{tpl.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  if (screen === "auto_build") {
    const previewW = autoPreview?.sheetWidthIn ?? sheetWidth;
    const previewH = autoPreview?.sheetHeightIn ?? sheetHeight;
    const heightWarning =
      autoPreview && autoPreview.sheetHeightIn > sheetHeight
        ? `Needs ~${autoPreview.sheetHeightIn.toFixed(1)} in length — increase max sheet length or remove items.`
        : "";

    return (
      <div className="bags auto-mode lgs-editor gs-editor-v2" style={appearanceVars(page.appearance)}>
        <style>{BAGS_BASE_CSS}{GANG_SHEET_EDITOR_CSS}{BACKGROUND_REMOVAL_MODAL_CSS}</style>
        <header>
          <div className="brand">
            <b>L</b>
            <span>
              <strong>Auto Arrange</strong>
              <small>{autoPhase === "setup" ? "Upload → quantity → Apply" : "Review → Continue"}</small>
            </span>
          </div>
          <nav>
            <button type="button" onClick={() => setScreen("welcome")}>
              ← Back
            </button>
            {autoPhase === "setup" ? (
              <>
                <label className="btn-upload">
                  {uploading ? "Uploading…" : "＋ Upload images"}
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    hidden
                    onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []), "auto")}
                  />
                </label>
                <button
                  type="button"
                  className="save"
                  disabled={!autoDrafts.length || !!autoPreviewError || autoPreviewLoading}
                  onClick={() => {
                    void refreshAutoPreview().then((p) => {
                      if (p?.pieces.length) setAutoPhase("review");
                    });
                  }}
                >
                  Apply
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={undoAutoResult} aria-label="Undo auto nest result">
                  Undo
                </button>
                <button
                  type="button"
                  disabled={autoPreviewLoading || !autoDrafts.length}
                  onClick={() => void refreshAutoPreview()}
                  aria-label="Regenerate nest preview"
                >
                  {autoPreviewLoading ? "Regenerating…" : "Regenerate"}
                </button>
                <button type="button" onClick={() => setAutoPhase("setup")}>
                  Back and adjust
                </button>
                <button
                  type="button"
                  className="save"
                  disabled={autoBusy || !autoPreview?.pieces.length}
                  onClick={() => void applyAutoBuild()}
                  aria-label="Accept nest and continue to editor"
                >
                  {autoBusy ? "Building…" : "Accept & Continue"}
                </button>
              </>
            )}
          </nav>
        </header>

        <div className="auto-split">
          <section className={`auto-upload-panel ${autoPhase === "review" ? "readonly" : ""}`}>
            <div className="auto-panel-head">
              <h2>{autoPhase === "setup" ? "1. Upload & size" : "Your designs"}</h2>
              <p>{autoDrafts.length} design{autoDrafts.length === 1 ? "" : "s"}</p>
            </div>

            {autoPhase === "setup" ? (
              <div className="upload-tabs">
                <button
                  type="button"
                  className={autoUploadTab === "upload" ? "tab active" : "tab"}
                  onClick={() => setAutoUploadTab("upload")}
                >
                  Upload image(s)
                </button>
                <button
                  type="button"
                  className={autoUploadTab === "pool" ? "tab active" : "tab"}
                  onClick={() => setAutoUploadTab("pool")}
                >
                  My images
                </button>
                <button
                  type="button"
                  className={autoUploadTab === "gallery" ? "tab active" : "tab"}
                  onClick={() => {
                    setAutoUploadTab("gallery");
                    void refreshGallery();
                  }}
                >
                  Gallery
                </button>
              </div>
            ) : null}

            {!autoDrafts.length && autoPhase === "setup" && autoUploadTab === "upload" ? (
              <label className="drop large">
                <b>⬆</b>
                <strong>Upload all your images</strong>
                <small>PNG/JPEG/SVG · select multiple files at once</small>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/svg+xml,.svg"
                  hidden
                  onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []), "auto")}
                />
              </label>
            ) : null}

            {!autoDrafts.length && autoPhase === "setup" && autoUploadTab === "pool" ? (
              <div className="pool-grid">
                {!uploadPool.length ? (
                  <p className="muted">Upload images in the main editor first — they appear here.</p>
                ) : (
                  uploadPool.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="pool-item"
                      onClick={() => addPoolItemToAuto(p)}
                      disabled={uploading}
                    >
                      <img src={p.previewUrl} alt="" />
                      <span>{p.name}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {!autoDrafts.length && autoPhase === "setup" && autoUploadTab === "gallery" ? (
              <div className="pool-grid">
                {filteredGallery.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="pool-item"
                    onClick={() => void addGalleryItemToAuto(g)}
                    disabled={uploading}
                  >
                    <img src={g.thumb} alt="" />
                    <span>{g.name}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {autoDrafts.length > 0 ? (
              <>
                <div className="auto-sheet-settings">
                  <label>
                    Sheet width
                    <select
                      value={sheetWidth}
                      onChange={(e) => setSheetWidth(+e.target.value)}
                    >
                      {allowedSheetWidths.map((w) => (
                        <option key={w} value={w}>
                          {w} in
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Max length
                    <select
                      value={sheetHeight}
                      onChange={(e) => setSheetHeight(+e.target.value)}
                    >
                      {allowedSheetHeights.map((h) => (
                        <option key={h} value={h}>
                          {h} in
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Spacing
                    <input
                      type="number"
                      min={0}
                      max={0.5}
                      step={0.05}
                      value={gap}
                      onChange={(e) => setGap(+e.target.value)}
                    />
                  </label>
                </div>
                <label className="lock-aspect rotate-toggle">
                  <input
                    type="checkbox"
                    checked={allowRotate90}
                    disabled={autoPhase === "review"}
                    onChange={(e) => setAllowRotate90(e.target.checked)}
                  />
                  Allow 90° rotation when nesting
                </label>

                <div className="auto-list compact">
                  {autoDrafts.map((d) => (
                    <article
                      key={d.id}
                      className={`auto-row ${d.id === selectedAutoId ? "active" : ""}`}
                      onClick={() => setSelectedAutoId(d.id)}
                    >
                      <img src={d.previewUrl} alt="" />
                      <div className="auto-fields">
                        <strong>{d.name}</strong>
                        <div className="preset-row">
                          <PresetSizeChips
                            presets={AUTO_PRESETS}
                            onPick={(inches) => {
                              const dims = applyLongestSidePreset(
                                d.asset.widthPx,
                                d.asset.heightPx,
                                inches,
                              );
                              setAutoDrafts((rows) =>
                                rows.map((r) =>
                                  r.id === d.id ? { ...r, ...dims, lockAspect: true } : r,
                                ),
                              );
                            }}
                          />
                        </div>
                        <div className="auto-dims">
                          <StepperField
                            label="Width"
                            value={d.widthIn}
                            step={0.1}
                            onChange={(w) => {
                              const aspect = d.asset.widthPx / d.asset.heightPx;
                              setAutoDrafts((rows) =>
                                rows.map((r) =>
                                  r.id === d.id
                                    ? {
                                        ...r,
                                        widthIn: w,
                                        heightIn: r.lockAspect ? w / aspect : r.heightIn,
                                      }
                                    : r,
                                ),
                              );
                            }}
                          />
                          <StepperField
                            label="Height"
                            value={d.heightIn}
                            step={0.1}
                            onChange={(h) => {
                              const aspect = d.asset.widthPx / d.asset.heightPx;
                              setAutoDrafts((rows) =>
                                rows.map((r) =>
                                  r.id === d.id
                                    ? {
                                        ...r,
                                        heightIn: h,
                                        widthIn: r.lockAspect ? h * aspect : r.widthIn,
                                      }
                                    : r,
                                ),
                              );
                            }}
                          />
                          <StepperField
                            label="Qty"
                            value={d.quantity}
                            step={1}
                            min={1}
                            onChange={(q) =>
                              setAutoDrafts((rows) =>
                                rows.map((r) =>
                                  r.id === d.id
                                    ? { ...r, quantity: Math.max(1, Math.round(q)) }
                                    : r,
                                ),
                              )
                            }
                          />
                        </div>
                        <label className="lock-aspect">
                          <input
                            type="checkbox"
                            checked={d.lockAspect}
                            disabled={autoPhase === "review"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setAutoDrafts((rows) =>
                                rows.map((r) =>
                                  r.id === d.id ? { ...r, lockAspect: e.target.checked } : r,
                                ),
                              )
                            }
                          />
                          Lock aspect ratio
                        </label>
                        <small>
                          {(d.widthIn * d.heightIn * d.quantity).toFixed(2)} in² ·{" "}
                          {d.asset.widthPx}×{d.asset.heightPx}px
                        </small>
                      </div>
                      <div className="auto-actions">
                        {autoPhase === "setup" ? (
                          <button
                            type="button"
                            className="dup"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAutoDrafts((rows) => {
                                const src = rows.find((r) => r.id === d.id);
                                if (!src) return rows;
                                return [
                                  ...rows,
                                  {
                                    ...src,
                                    id: crypto.randomUUID(),
                                    name: `${src.name.replace(/\.[^.]+$/, "")} (copy)`,
                                  },
                                ];
                              });
                            }}
                          >
                            Duplicate
                          </button>
                        ) : null}
                        {autoPhase === "setup" ? (
                          <button
                            type="button"
                            className="remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAutoDrafts((rows) => rows.filter((r) => r.id !== d.id));
                              if (selectedAutoId === d.id) setSelectedAutoId(null);
                            }}
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>

                <label className="btn ghost block">
                  ＋ Add more images
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    hidden
                    disabled={autoPhase === "review"}
                    onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []), "auto")}
                  />
                </label>
              </>
            ) : null}
          </section>

          <section className="auto-preview-panel">
            <div className="auto-panel-head">
              <h2>{autoPhase === "setup" ? "2. Auto nest preview" : "Nest preview"}</h2>
              {autoPreviewLoading ? (
                <span className="preview-status">Updating…</span>
              ) : autoPreview ? (
                <span className="preview-status ok">
                  {autoPhase === "review" ? "Ready to continue" : "Live preview"}
                </span>
              ) : (
                <span className="preview-status">Waiting for uploads</span>
              )}
            </div>

            <div className="nest-preview-wrap">
              {autoPreview?.pieces.length ? (
                <div
                  className="nest-preview-sheet"
                  style={{ aspectRatio: `${previewW}/${previewH}` }}
                >
                  <i />
                  {autoPreview.pieces.map((p) => (
                    <div
                      key={p.id}
                      className={`nest-piece ${p.draftId === selectedAutoId ? "highlight" : ""}`}
                      style={{
                        left: `${(p.xIn / previewW) * 100}%`,
                        top: `${(p.yIn / previewH) * 100}%`,
                        width: `${(p.widthIn / previewW) * 100}%`,
                        height: `${(p.heightIn / previewH) * 100}%`,
                      }}
                      title={p.name}
                    >
                      <img
                        src={p.previewUrl}
                        alt=""
                        style={{ transform: `rotate(${p.rotationDeg}deg)` }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="nest-preview-empty">
                  {autoPreviewError ? (
                    <p className="error">{autoPreviewError}</p>
                  ) : (
                    <>
                      <strong>Preview appears here</strong>
                      <p>Upload images and set sizes — nesting updates automatically.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="nest-stats">
              <p>
                <span>Sheet size</span>
                <strong>
                  {previewW} × {previewH.toFixed(1)} in
                </strong>
              </p>
              <p>
                <span>Total pieces</span>
                <strong>{autoPreview?.totalPieces ?? 0}</strong>
              </p>
              {autoPreview?.fittedCount != null && autoPreview.remainingCount != null ? (
                <p className="overflow-note">
                  <span>Fit status</span>
                  <strong>
                    Fitted {autoPreview.fittedCount} of {autoPreview.totalPieces} —{" "}
                    {autoPreview.remainingCount} remain
                  </strong>
                </p>
              ) : null}
              <p>
                <span>Printed area</span>
                <strong>{(autoPreview?.totalAreaSqIn ?? 0).toFixed(2)} in²</strong>
              </p>
              <p>
                <span>Utilization</span>
                <strong>
                  {autoPreview ? `${Math.round(autoPreview.utilization * 100)}%` : "—"}
                </strong>
              </p>
              <p className="total">
                <span>Est. price</span>
                <strong>${(autoPreview?.estimateUsd ?? 0).toFixed(2)}</strong>
              </p>
            </div>

            {heightWarning ? <p className="error block">{heightWarning}</p> : null}
            {error ? <p className="error block">{error}</p> : null}
            {!error && message ? <p className="message block">{message}</p> : null}

            <p className="fine">
              {autoPhase === "setup" ? (
                <>
                  When sizing looks good, click <strong>Apply</strong> to review the nest before
                  opening the full editor.
                </>
              ) : (
                <>
                  <strong>Accept &amp; Continue</strong> opens the canvas with these placements.
                  Use <strong>Undo</strong> or <strong>Regenerate</strong> to try again, or{" "}
                  <strong>Back and adjust</strong> to change sizes.
                </>
              )}
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="bags lgs-editor bags-parity-editor" style={appearanceVars(page.appearance)}>
      <style>{BAGS_BASE_CSS}{GANG_SHEET_EDITOR_CSS}{BAGS_PARITY_EDITOR_CSS}{BACKGROUND_REMOVAL_MODAL_CSS}</style>
      {restoreDialog}
      {librarySaveDialog}
      <GangSheetSaveDialog
        open={showSaveDialog}
        designName={designName}
        onDesignNameChange={(name) => {
          setDesignName(name);
          setDirty(true);
        }}
        sheetWidth={sheetWidth}
        sheetHeight={sheetHeight}
        quantity={page.quantity ?? 1}
        artworkCount={items.length}
        estimateUsd={estimate}
        overlapCount={overlappingIds.size}
        oobCount={oobIds.size}
        lowDpiCount={lowDpiCount}
        qualitySummary={qualitySummary}
        previewUrl={savePreviewUrl}
        saving={saving}
        error={saveDialogError}
        requestId={saveDialogRequestId}
        onCancel={() => {
          if (!saving) setShowSaveDialog(false);
        }}
        onSaveOnly={() => void save({ addToCart: false, closeDialog: true })}
        onSaveAndCart={() => void save({ addToCart: true, closeDialog: true })}
      />
      <SheetShrinkDialog
        open={Boolean(shrinkPrompt)}
        currentWidth={sheetWidth}
        currentHeight={sheetHeight}
        nextWidth={shrinkPrompt?.w ?? sheetWidth}
        nextHeight={shrinkPrompt?.h ?? sheetHeight}
        affectedCount={shrinkPrompt?.affectedCount ?? 0}
        onCancel={() => setShrinkPrompt(null)}
        onResizeOnly={() => {
          if (shrinkPrompt) commitSheetSize(shrinkPrompt.w, shrinkPrompt.h, "clamp");
        }}
        onScaleToFit={() => {
          if (shrinkPrompt) commitSheetSize(shrinkPrompt.w, shrinkPrompt.h, "scale");
        }}
      />
      <BagsGangSheetHeader
        quantity={sheetQuantity}
        onQuantityChange={setSheetQuantity}
        estimateUsd={estimate}
        saving={saving}
        hasItems={items.length > 0}
        onSaveAndCart={openSaveDialog}
        onSave={openSaveDialog}
        onClose={closeEditor}
        customer={storefrontCustomer}
        onMyDesigns={() => openDesignPicker("mine")}
      />
      <BagsSheetToolbar
        sheetWidth={sheetWidth}
        sheetHeight={sheetHeight}
        sheetWidths={allowedSheetWidths}
        sheetHeights={allowedSheetHeights}
        onSheetSizeChange={requestSheetSize}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
        panMode={spacePan}
        onTogglePan={() => setSpacePan((v) => !v)}
        gridVisible={gridVisible}
        onToggleGrid={() => setGridVisible((v) => !v)}
        onAutoNest={openAutoNestModal}
        zoomLabel={zoomLabel}
        onZoomOut={() => {
          setZoom((z) => Math.max(15, z - 10));
          setZoomMode("custom");
        }}
        onZoomIn={() => {
          setZoom((z) => Math.min(200, z + 10));
          setZoomMode("custom");
        }}
        onFitSheet={() => fitToViewport("sheet")}
      />
      {selected ? (
        <BagsSelectionToolbar
          selected={selected}
          multiCount={selectedIds.size || 1}
          sheetWidth={sheetWidth}
          sheetHeight={sheetHeight}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          onChange={(patch) => change(patch)}
          onAlign={(mode) => alignSelection(mode as Parameters<typeof alignSelected>[2])}
          onDistribute={distributeSelection}
          onLayer={(action) => layerAction(action)}
          onRotateCcw={rotateCcw}
          onRotateCw={rotateCw}
          onFlipH={flipHorizontal}
          onFlipV={flipVertical}
          onStretchWidth={stretchToArtboardWidth}
          onStretchHeight={stretchToArtboardHeight}
          onCenterH={() => alignSelection("center-h")}
          onCenterV={() => alignSelection("center-v")}
          onCenterBoth={centerBothSelection}
          onSnapLeft={() => alignSelection("left")}
          onSnapRight={() => alignSelection("right")}
          onSnapTop={() => alignSelection("top")}
          onSnapBottom={() => alignSelection("bottom")}
          onDelete={removeSelected}
          onDuplicate={duplicate}
          onUndo={undo}
          onRedo={redo}
        />
      ) : null}
      <div className="bags-parity-body">
      <QualityInspectorPanel
        open={qualityPanelOpen}
        onOpenChange={setQualityPanelOpen}
        summary={qualitySummary}
        items={items}
        overlappingIds={overlappingIds}
        oobIds={oobIds}
        prefs={qualityPrefs}
        onPrefsChange={setQualityPrefs}
        onSelectItem={(id) => {
          selectItem(id);
          setQualityPanelOpen(false);
        }}
      />
      {message ? <p className="message toast">{message}</p> : null}
      {error ? <p className="error toast">{error}</p> : null}
      {showFirstTip && items.length === 0 ? (
        <p className="tip toast">
          Tip: Upload in the sidebar, click to place, then drag / resize. Escape closes dialogs.
          <button type="button" className="tip-dismiss" onClick={() => setShowFirstTip(false)}>
            Got it
          </button>
        </p>
      ) : null}
      <div
        className={`workspace bags-parity-workspace${desktopSidePanelOpen ? " has-side-panel" : ""}${desktopPropertiesOpen ? " has-properties" : ""}`}
      >
        <BagsLeftRail
          active={leftRailTab}
          onSelect={handleLeftRail}
          uploadCount={uploadPool.length}
        />
        <aside
          className={`sidebar-panel bags-parity-sidebar ${desktopSidePanelOpen ? "open" : ""} ${mobileDrawer === "sidebar" ? "mobile-open" : ""}`}
          aria-hidden={!desktopSidePanelOpen && mobileDrawer !== "sidebar"}
        >
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileDrawer(null)}
            aria-label="Close tools panel"
          >
            ×
          </button>
          {leftRailTab === "canva" ? (
            <BagsIntegrationPanel
              provider="canva"
              status="disconnected"
              onConnect={() => setMessage("Canva OAuth is not configured for this shop.")}
            />
          ) : leftRailTab === "dropbox" ? (
            <BagsIntegrationPanel
              provider="dropbox"
              status="disconnected"
              onConnect={() => setMessage("Dropbox OAuth is not configured for this shop.")}
            />
          ) : leftRailTab === "names-numbers" ? (
            <div className="bags-names-numbers-panel">
              <BagsNamesNumbersContent
                workflow={namesNumbersWorkflow}
                onWorkflowChange={setNamesNumbersWorkflow}
                namesList={namesList}
                onNamesListChange={setNamesList}
                numbersList={numbersList}
                onNumbersListChange={setNumbersList}
                nameFontFamily={rosterNameFontFamily}
                onNameFontFamilyChange={setRosterNameFontFamily}
                numberFontFamily={rosterNumberFontFamily}
                onNumberFontFamilyChange={setRosterNumberFontFamily}
                nameFontSize={rosterNameFontSize}
                onNameFontSizeChange={setRosterNameFontSize}
                numberFontSize={rosterNumberFontSize}
                onNumberFontSizeChange={setRosterNumberFontSize}
                nameWidthIn={rosterNameWidthIn}
                onNameWidthInChange={setRosterNameWidthIn}
                numberWidthIn={rosterNumberWidthIn}
                onNumberWidthInChange={setRosterNumberWidthIn}
                nameStrokeWidth={rosterNameStrokeWidth}
                onNameStrokeWidthChange={setRosterNameStrokeWidth}
                numberStrokeWidth={rosterNumberStrokeWidth}
                onNumberStrokeWidthChange={setRosterNumberStrokeWidth}
                strokeColor={rosterStrokeColor}
                onStrokeColorChange={setRosterStrokeColor}
                textColor={rosterTextColor}
                onTextColorChange={setRosterTextColor}
                quantity={rosterQuantity}
                onQuantityChange={setRosterQuantity}
                onApplyNamePreset={applyNameSizePreset}
                onApplyNumberPreset={applyNumberSizePreset}
                onGenerateNames={generateNames}
                onGenerateNumbers={generateNumbers}
              />
            </div>
          ) : sidebarTab === "products" || leftRailTab === "products" ? (
            <BagsProductsPanel
              sheetWidth={sheetWidth}
              activeHeight={sheetHeight}
              variants={page.gangSheetVariants.map((v) => ({
                sheetHeightIn: v.sheetHeightIn,
                variantPriceCents: v.variantPriceCents,
                variantTitle: v.variantTitle ?? null,
                variantId: v.variantGid?.replace("gid://shopify/ProductVariant/", "") ?? null,
              }))}
              pricePerSqIn={page.pricePerSqIn}
              productTitle={page.productTitle}
              productStatus={page.productStatus}
              syncStatus={page.syncStatus}
              selectedVariantId={activeVariantMeta.id}
              selectedVariantTitle={activeVariantMeta.title}
              onSelectHeight={(heightIn) => requestSheetSize(sheetWidth, heightIn)}
            />
          ) : sidebarTab === "uploads" || leftRailTab === "uploads" ? (
            <BagsUploadsPanel
              uploadPool={uploadPool}
              filteredPool={filteredPool}
              uploadSearch={uploadSearch}
              onUploadSearchChange={setUploadSearch}
              uploadSort={uploadSort}
              onUploadSortChange={setUploadSort}
              uploadView={uploadView}
              onUploadViewChange={setUploadView}
              uploading={uploading}
              uploadProgress={uploadProgress}
              poolTick={poolTick}
              sidebarUploadRef={sidebarUploadRef}
              onRefresh={() => setPoolTick((t) => t + 1)}
              onUploadFiles={(files) => void uploadFiles(files, "canvas")}
              onPlace={placeFromPool}
              onRename={renamePoolItem}
              onRemoveBg={openBgRemoveForAsset}
              onDelete={deletePoolItem}
              sheetCountForAsset={sheetCountForAsset}
              onAddText={() => {
                setSidebarTab("text");
                setLeftRailTab("uploads");
              }}
            />
          ) : leftRailTab === "gallery" || sidebarTab === "gallery" ? (
            <BagsIntegrationPanel
              provider="gallery"
              status={
                galleryLoading
                  ? "loading"
                  : galleryError
                    ? "error"
                    : !filteredGallery.length
                      ? "empty"
                      : "ready"
              }
              error={galleryError}
              onRetry={() => void refreshGallery()}
            >
              <div className="sidebar-tools">
                <input type="search" placeholder="Search gallery…" value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} aria-label="Search gallery" />
                <button type="button" className="refresh-btn" aria-label="Refresh gallery" onClick={() => void refreshGallery()}>
                  <ToolbarIcon name="refresh" />
                </button>
              </div>
              <div className="chip-row">
                {galleryCategories.map((cat) => (
                  <button key={cat} type="button" className={galleryCategory === cat ? "chip active" : "chip"} onClick={() => setGalleryCategory(cat)}>{cat}</button>
                ))}
              </div>
              <div className="pool-grid">
                {filteredGallery.map((g) => (
                  <button key={g.id} type="button" className="pool-item" onClick={() => void placeGalleryItem(g)} disabled={uploading}>
                    <img src={g.thumb} alt="" />
                    <span>{g.name}</span>
                    <em>{g.widthIn}×{g.heightIn}″</em>
                  </button>
                ))}
              </div>
            </BagsIntegrationPanel>
          ) : sidebarTab === "text" ? (
            <>
              <div className="heading"><span><strong>Text</strong><small>Add labels &amp; titles</small></span></div>
              <div className="sidebar-form">
                <label>Text<textarea rows={3} value={textContent} onChange={(e) => setTextContent(e.target.value)} aria-label="Text content" /></label>
                <label>Font<select value={textFontFamily} onChange={(e) => setTextFontFamily(e.target.value)}>{FONT_OPTIONS.map((f) => <option key={f.id} value={f.label}>{f.label}</option>)}</select></label>
                <label>Size (pt)<input type="number" min={8} max={120} value={textFontSize} onChange={(e) => setTextFontSize(+e.target.value)} /></label>
                <label>Color<input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} aria-label="Text color" /></label>
                <div className="chip-row">
                  {TEXT_STYLE_PRESETS.map((p) => (
                    <button key={p.id} type="button" className="chip" onClick={() => { setTextFontSize(p.fontSize); setTextColor(p.color); }}>{p.label}</button>
                  ))}
                </div>
                <button type="button" className="sidebar-upload-btn" onClick={() => addTextToSheet()}>Add text to sheet</button>
              </div>
            </>
          ) : sidebarTab === "names" ? (
            <>
              <div className="heading"><span><strong>Names &amp; Numbers</strong><small>Separate workflows</small></span></div>
              <p className="sidebar-hint">Use the bottom nav Names &amp; Numbers modal for Add Names or Add Numbers with S/M/L presets.</p>
              <div className="sidebar-form">
                <button type="button" className="sidebar-upload-btn" onClick={() => { setNamesNumbersWorkflow("names"); setBottomNav("names-numbers"); }}>
                  Add Names
                </button>
                <button type="button" className="sidebar-upload-btn" onClick={() => { setNamesNumbersWorkflow("numbers"); setBottomNav("names-numbers"); }}>
                  Add Numbers
                </button>
              </div>
            </>
          ) : sidebarTab === "layers" ? (
            <>
              <div className="heading"><span><strong>Layers</strong><small>{items.length} on sheet</small></span></div>
              <div className="layer-list">
                {[...paintedItems].reverse().map((i) => (
                  <button key={i.id} type="button" className={`layer-row ${selectedIds.has(i.id) ? "active" : ""}`} onClick={(e) => selectItem(i.id, e.shiftKey)}>
                    {i.kind === "text" ? <span className="layer-text-thumb">T</span> : <img src={i.previewUrl} alt="" />}
                    <span><strong>{i.name}</strong><small>{i.widthIn.toFixed(1)}×{i.heightIn.toFixed(1)}″</small></span>
                  </button>
                ))}
                {!items.length ? <p className="sidebar-empty">No layers yet.</p> : null}
              </div>
            </>
          ) : sidebarTab === "templates" ? (
            <>
              <div className="heading">
                <span>
                  <strong>Templates</strong>
                  <small>Sheet presets</small>
                </span>
              </div>
              <p className="panel-lead">Choose a preset size — you can still change dimensions later from the toolbar.</p>
              <div className="template-picker sidebar-templates">
                {SHEET_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className="template-card"
                    onClick={() => applySheetSize(tpl.widthIn, tpl.heightIn)}
                  >
                    <strong>{tpl.name}</strong>
                    <span>{tpl.description}</span>
                  </button>
                ))}
              </div>
            </>
          ) : sidebarTab === "help" ? (
            <>
              <div className="heading"><span><strong>Help</strong><small>Shortcuts &amp; tips</small></span></div>
              <ul className="help-list">
                {HELP_SHORTCUTS.map((h) => (
                  <li key={h.keys}><kbd>{h.keys}</kbd><span>{h.action}</span></li>
                ))}
              </ul>
              <p className="sidebar-hint">Overlap and out-of-bounds warnings appear above the canvas. Snap is {snapEnabled ? "on" : "off"}.</p>
              <label className="toggle-row"><input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} /> Snap to grid &amp; edges</label>
            </>
          ) : null}
        </aside>
        <main className="canvas-main">
          <div className="bags-canvas-row">
          <BagsQualityLegend qualityPrefs={qualityPrefs} onQualityPrefsChange={setQualityPrefs} />
          <div className="bags-canvas-scroll-wrap">
          <div className="canvas-meta">
            <strong>{sheetWidth} × {sheetHeight} in</strong>
            <span>{utilization}% used · {items.length} piece{items.length === 1 ? "" : "s"}</span>
            <label className="toggle-row inline"><input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} /> Snap</label>
          </div>
          <div
            className={`scroll ${spacePan ? "pan-mode" : ""}`}
            ref={scrollRef}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest(".piece")) selectItem(null);
            }}
            onPointerDown={(e) => {
              if (spacePan && e.button === 0) {
                const el = scrollRef.current;
                if (!el) return;
                panRef.current = { sx: e.clientX, sy: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
                return;
              }
              const target = e.target as HTMLElement;
              if (target.closest(".piece") || target.closest(".resize-handle") || target.closest(".rotate-handle")) return;
              if (e.button !== 0) return;
              const c = canvas.current;
              if (!c) return;
              const r = c.getBoundingClientRect();
              interaction.current = {
                mode: "marquee",
                sx: e.clientX,
                sy: e.clientY,
                ex: e.clientX,
                ey: e.clientY,
              };
              setMarqueeRect({ x: e.clientX - r.left, y: e.clientY - r.top, w: 0, h: 0 });
            }}
            onPointerMove={(e) => {
              const p = panRef.current;
              const el = scrollRef.current;
              if (!p || !el) return;
              el.scrollLeft = p.sl - (e.clientX - p.sx);
              el.scrollTop = p.st - (e.clientY - p.sy);
            }}
            onPointerUp={() => { panRef.current = null; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const poolId = e.dataTransfer.getData("text/pool-id");
              if (poolId) placeFromPool(poolId);
              else void uploadFiles(Array.from(e.dataTransfer.files ?? []), "canvas", { placeOnSheet: true });
            }}
          >
            <div className="ruler-corner" aria-hidden />
            <div className="ruler-h" aria-hidden>
              {Array.from({ length: Math.ceil(sheetWidth) + 1 }, (_, i) => (
                <span key={i} style={{ left: `${(i / sheetWidth) * 100}%` }}>{i}</span>
              ))}
            </div>
            <div className="ruler-v" aria-hidden>
              {Array.from({ length: Math.min(Math.ceil(sheetHeight) + 1, 48) }, (_, i) => (
                <span key={i} style={{ top: `${(i / sheetHeight) * 100}%` }}>{i}</span>
              ))}
            </div>
            <div className="canvas-stage">
            <CanvasMinimap
              sheetWidth={sheetWidth}
              sheetHeight={sheetHeight}
              scrollTop={scrollMetrics.top}
              scrollHeight={scrollMetrics.height}
              clientHeight={scrollMetrics.client}
              visible={screen === "canvas"}
              onNavigate={(ratio) => {
                const el = scrollRef.current;
                if (!el) return;
                el.scrollTop = ratio * Math.max(0, el.scrollHeight - el.clientHeight);
              }}
            />
            <div
              ref={canvas}
              className={`sheet ${visualAid === "checkerboard" ? "checkerboard" : ""} ${gridVisible ? "grid-on" : "grid-off"} ${qualityPrefs.showSafeZone ? "safe-zone-on" : ""}`}
              style={{
                width: `${zoom}%`,
                aspectRatio: `${sheetWidth}/${sheetHeight}`,
                ...sheetVisualAidStyle(visualAid, visualAidCustomColor),
              }}
            >
              <i className={qualityPrefs.showSafeZone ? "safe-zone" : undefined} />
              {snapGuides.map((g, idx) => (
                <div
                  key={`${g.axis}-${g.valueIn}-${idx}`}
                  className={`snap-guide ${g.axis}`}
                  style={
                    g.axis === "x"
                      ? { left: `${(g.valueIn / sheetWidth) * 100}%` }
                      : { top: `${(g.valueIn / sheetHeight) * 100}%` }
                  }
                />
              ))}
              {paintedItems.map((i) => (
                <div
                  key={i.id}
                  className={`piece ${selectedIds.has(i.id) ? "selected" : ""} ${
                    qualityPrefs.showOverlapOutlines && overlappingIds.has(i.id) ? "overlap" : ""
                  } ${qualityPrefs.showOobShading && oobIds.has(i.id) ? "oob" : ""}`}
                  style={{
                    left: `${(i.xIn / sheetWidth) * 100}%`,
                    top: `${(i.yIn / sheetHeight) * 100}%`,
                    width: `${(i.widthIn / sheetWidth) * 100}%`,
                    height: `${(i.heightIn / sheetHeight) * 100}%`,
                    zIndex: i.zIndex,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectItem(i.id, e.shiftKey);
                  }}
                  onPointerDown={(e: ReactPointerEvent) => {
                    if ((e.target as HTMLElement).closest(".resize-handle")) return;
                    if (i.lockPosition) return;
                    e.stopPropagation();
                    selectItem(i.id, e.shiftKey);
                    interaction.current = {
                      mode: "drag",
                      id: i.id,
                      x: i.xIn,
                      y: i.yIn,
                      sx: e.clientX,
                      sy: e.clientY,
                      snapshot: itemsRef.current,
                    };
                  }}
                >
                  {i.kind === "text" ? (
                    <span
                      className="text-piece"
                      style={{
                        fontSize: `${Math.max(8, (i.fontSize ?? 24) * (i.heightIn / Math.max(0.5, (i.fontSize ?? 24) / 72)))}px`,
                        fontFamily: i.fontFamily ?? "Arial",
                        color: i.textColor ?? "#111827",
                        transform: pieceTransform(i),
                      }}
                    >
                      {i.textContent ?? i.name}
                    </span>
                  ) : (
                    <img
                      src={i.previewUrl}
                      alt={i.name}
                      className="checkerboard"
                      style={{ transform: pieceTransform(i) }}
                      draggable={false}
                    />
                  )}
                  <em>
                    {i.widthIn.toFixed(1)}″ × {i.heightIn.toFixed(1)}″
                    {i.kind !== "text" && i.dpi ? ` · ${Math.round(i.dpi)} DPI` : ""}
                  </em>
                  {selectedIds.has(i.id) && i.kind !== "text" && i.dpi ? (
                    <span className="dpi-badge">{Math.round(i.dpi)} DPI</span>
                  ) : null}
                  {selectedIds.has(i.id) && !i.lockPosition ? (
                    <>
                    <button
                      type="button"
                      className="rotate-handle"
                      aria-label="Rotate 90 degrees"
                      onPointerDown={(e: ReactPointerEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        selectItem(i.id);
                        rotateCcw();
                      }}
                    />
                    <button
                      type="button"
                      className="resize-handle se"
                      aria-label="Resize piece"
                      onPointerDown={(e: ReactPointerEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        selectItem(i.id);
                        interaction.current = {
                          mode: "resize",
                          id: i.id,
                          startW: i.widthIn,
                          startH: i.heightIn,
                          aspect: i.widthIn / Math.max(0.01, i.heightIn),
                          sx: e.clientX,
                          sy: e.clientY,
                          snapshot: itemsRef.current,
                        };
                      }}
                    />
                    </>
                  ) : null}
                </div>
              ))}
              {!items.length && (
                <div className="empty">
                  <small>Use Add Image below to place artwork on your gang sheet.</small>
                </div>
              )}
              {marqueeRect ? (
                <div
                  className="marquee-select"
                  style={{
                    left: marqueeRect.x,
                    top: marqueeRect.y,
                    width: marqueeRect.w,
                    height: marqueeRect.h,
                  }}
                />
              ) : null}
            </div>
            </div>
          </div>
          </div>
          </div>
        </main>
        <aside
          className={`properties bags-parity-properties ${desktopPropertiesOpen ? "open" : ""} ${mobileDrawer === "properties" ? "mobile-open" : ""}`}
          aria-hidden={!desktopPropertiesOpen && mobileDrawer !== "properties"}
        >
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileDrawer(null)}
            aria-label="Close properties panel"
          >
            ×
          </button>
          <BagsPropertiesPanel
            selected={selected}
            multiCount={selectedIds.size}
            sheetWidth={sheetWidth}
            sheetHeight={sheetHeight}
            gap={gap}
            artboardMarginEnabled={artboardMarginEnabled}
            artboardMarginIn={artboardMarginIn}
            onArtboardMarginChange={(enabled, value) => {
              setArtboardMarginEnabled(enabled);
              setArtboardMarginIn(value);
            }}
            onChange={(patch) => change(patch)}
            onAlign={(mode) => alignSelection(mode as Parameters<typeof alignSelected>[2])}
            onDistribute={distributeSelection}
            onDuplicate={duplicate}
            onRotate={rotate}
            onFlipH={flipHorizontal}
            onFlipV={flipVertical}
            onOpenImageEditor={
              selected && selected.kind !== "text"
                ? () => setImageEditorOpen(true)
                : undefined
            }
            onRemoveBg={
              selected && selected.kind !== "text" && !selected.assetId.startsWith("text-")
                ? () => openBgRemoveForAsset(selected.assetId, selected.previewUrl)
                : undefined
            }
            onUpscale={selected && selected.kind !== "text" ? () => void upscaleSelected() : undefined}
            upscaling={upscaling}
            onAutoFill={fillSheet}
            onDelete={removeSelected}
            onLayer={layerAction}
            onGapChange={setGap}
            round={round}
          />
          <section className="summary">
            <p>
              <span>Printed area</span>
              <strong>{usedArea.toFixed(2)} in²</strong>
            </p>
            <p>
              <span>Sheet usage</span>
              <strong>{utilization}%</strong>
            </p>
            <p className="total">
              <span>Estimated total</span>
              <strong>${estimate.toFixed(2)}</strong>
            </p>
          </section>
        </aside>
      </div>
      </div>
      <BagsBottomNav active={bottomNav} onSelect={handleBottomNav} />
      <BagsActiveSheetsDrawer
        open={bottomNav === "select"}
        collapsed={sheetsDrawerCollapsed}
        onToggleCollapse={() => setSheetsDrawerCollapsed((v) => !v)}
        onClose={() => setBottomNav(null)}
        designName={designName}
        onDesignNameChange={(name) => {
          setDesignName(name);
          setDirty(true);
        }}
        sheetWidth={sheetWidth}
        sheetHeight={sheetHeight}
        artworkCount={items.length}
        quantity={sheetQuantity}
        onQuantityChange={setSheetQuantity}
        onDuplicateSheet={() => handleOverflowAction("duplicate-design")}
        onAddNewDesign={() => setScreen("welcome")}
        onOpenPreviousDesigns={() => openDesignPicker("mine")}
        onAutoBuild={() => handleOverflowAction("arrange")}
        onStartOver={clearSheet}
      />
      <BagsEditorSettingsDrawer
        open={bottomNav === "settings" || settingsDrawerOpen}
        onClose={() => {
          setBottomNav(null);
          setSettingsDrawerOpen(false);
        }}
        snapEnabled={snapEnabled}
        onSnapChange={setSnapEnabled}
        qualityPrefs={qualityPrefs}
        onQualityPrefsChange={setQualityPrefs}
        visualAid={visualAid}
        onVisualAidChange={setVisualAid}
        visualAidCustomColor={visualAidCustomColor}
        onVisualAidCustomColorChange={setVisualAidCustomColor}
        artboardMarginEnabled={artboardMarginEnabled}
        artboardMarginIn={artboardMarginIn}
        onArtboardMarginChange={(enabled, value) => {
          setArtboardMarginEnabled(enabled);
          setArtboardMarginIn(value);
        }}
      />
      {bottomNav === "names-numbers" ? (
        <BagsNamesNumbersModal open onClose={() => setBottomNav(null)}>
          <BagsNamesNumbersContent
            workflow={namesNumbersWorkflow}
            onWorkflowChange={setNamesNumbersWorkflow}
            namesList={namesList}
            onNamesListChange={setNamesList}
            numbersList={numbersList}
            onNumbersListChange={setNumbersList}
            nameFontFamily={rosterNameFontFamily}
            onNameFontFamilyChange={setRosterNameFontFamily}
            numberFontFamily={rosterNumberFontFamily}
            onNumberFontFamilyChange={setRosterNumberFontFamily}
            nameFontSize={rosterNameFontSize}
            onNameFontSizeChange={setRosterNameFontSize}
            numberFontSize={rosterNumberFontSize}
            onNumberFontSizeChange={setRosterNumberFontSize}
            nameWidthIn={rosterNameWidthIn}
            onNameWidthInChange={setRosterNameWidthIn}
            numberWidthIn={rosterNumberWidthIn}
            onNumberWidthInChange={setRosterNumberWidthIn}
            nameStrokeWidth={rosterNameStrokeWidth}
            onNameStrokeWidthChange={setRosterNameStrokeWidth}
            numberStrokeWidth={rosterNumberStrokeWidth}
            onNumberStrokeWidthChange={setRosterNumberStrokeWidth}
            strokeColor={rosterStrokeColor}
            onStrokeColorChange={setRosterStrokeColor}
            textColor={rosterTextColor}
            onTextColorChange={setRosterTextColor}
            quantity={rosterQuantity}
            onQuantityChange={setRosterQuantity}
            onApplyNamePreset={applyNameSizePreset}
            onApplyNumberPreset={applyNumberSizePreset}
            onGenerateNames={() => {
              generateNames();
              setBottomNav(null);
            }}
            onGenerateNumbers={() => {
              generateNumbers();
              setBottomNav(null);
            }}
          />
        </BagsNamesNumbersModal>
      ) : null}
      <BagsDesignPickerModal
        open={designPickerOpen}
        onClose={() => setDesignPickerOpen(false)}
        activeTab={designPickerTab}
        onTabChange={setDesignPickerTab}
        designs={savedDesigns}
        loading={libraryLoading}
        error={libraryError}
        onRetry={() => void refreshLibrary(true)}
        onSelect={(designId, version) => void loadRemoteDesign(designId, version)}
      />
      <BagsAddImageModal
        open={addImageOpen}
        onClose={() => setAddImageOpen(false)}
        activeTab={addImageTab}
        onTabChange={setAddImageTab}
        canvaEnabled={false}
        dropboxEnabled={false}
        recentPanel={
          <>
            <div className="sidebar-tools">
              <input
                type="search"
                placeholder="Search recent uploads…"
                value={uploadSearch}
                onChange={(e) => setUploadSearch(e.target.value)}
                aria-label="Search recent uploads"
              />
            </div>
            <div className="pool-grid">
              {uploadPool.slice(0, 24).filter((p) =>
                !uploadSearch.trim() || p.name.toLowerCase().includes(uploadSearch.trim().toLowerCase()),
              ).map((p) => (
                <button key={p.id} type="button" className="pool-item" onClick={() => { placeFromPool(p.id); setAddImageOpen(false); }}>
                  <img src={p.previewUrl} alt="" className="checkerboard" />
                  <span>{p.name}</span>
                </button>
              ))}
              {!uploadPool.length ? <p className="sidebar-empty">No recent uploads yet.</p> : null}
            </div>
          </>
        }
        uploadsPanel={
          <>
            <p className="sidebar-hint">Drag PNG/JPEG files here or browse — then click a thumbnail to place on the sheet.</p>
            <label
              className="sidebar-upload-btn drop-target"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void uploadFiles(Array.from(e.dataTransfer.files ?? []), "canvas");
              }}
            >
              {uploading ? "Uploading…" : "Upload Image(s)"}
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                  void uploadFiles(Array.from(e.target.files ?? []), "canvas");
                  e.target.value = "";
                }}
              />
            </label>
            <div className="sidebar-tools">
              <input
                type="search"
                placeholder="Search uploads…"
                value={uploadSearch}
                onChange={(e) => setUploadSearch(e.target.value)}
                aria-label="Search uploads"
              />
              <select value={uploadSort} onChange={(e) => setUploadSort(e.target.value as "recent" | "name")} aria-label="Sort uploads">
                <option value="recent">Recent</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="pool-grid">
              {filteredPool.map((p) => (
                <div key={p.id} className="pool-item-wrap">
                  <button type="button" className="pool-item" onClick={() => { placeFromPool(p.id); setAddImageOpen(false); }}>
                    <img src={p.previewUrl} alt="" className="checkerboard" />
                    <span>{p.name}</span>
                  </button>
                  <div className="pool-item-actions">
                    <input type="text" defaultValue={p.name} aria-label="Rename upload" onBlur={(e) => renamePoolItem(p.id, e.target.value || p.name)} />
                    <button type="button" aria-label="Remove background" onClick={() => openBgRemoveForAsset(p.asset.assetId, p.previewUrl)}>Cut</button>
                    <button type="button" aria-label="Delete upload" onClick={() => deletePoolItem(p.id)}>Del</button>
                  </div>
                </div>
              ))}
              {!filteredPool.length ? <p className="sidebar-empty">{uploadPool.length ? "No matches" : "No uploads yet"}</p> : null}
            </div>
          </>
        }
        galleryPanel={
          <>
            <div className="sidebar-tools">
              <input type="search" placeholder="Search gallery…" value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} aria-label="Search gallery" />
              <button type="button" className="refresh-btn" aria-label="Refresh gallery" onClick={() => void refreshGallery()}>
                <ToolbarIcon name="refresh" />
              </button>
            </div>
            <div className="chip-row">
              {galleryCategories.map((cat) => (
                <button key={cat} type="button" className={galleryCategory === cat ? "chip active" : "chip"} onClick={() => setGalleryCategory(cat)}>{cat}</button>
              ))}
            </div>
            {galleryLoading ? <p className="sidebar-empty">Loading gallery…</p> : null}
            {galleryError ? (
              <p className="sidebar-empty">
                {galleryError}{" "}
                <button type="button" className="bags-link-btn" onClick={() => void refreshGallery()}>Retry</button>
              </p>
            ) : null}
            {!galleryLoading && !filteredGallery.length ? (
              <p className="sidebar-empty">No gallery artwork yet. Add images in Gallery Settings.</p>
            ) : (
              <div className="pool-grid">
                {filteredGallery.map((g) => (
                  <button key={g.id} type="button" className="pool-item" onClick={() => { void placeGalleryItem(g); setAddImageOpen(false); }} disabled={uploading}>
                    <img src={g.thumb} alt="" />
                    <span>{g.name}</span>
                    <em>{g.widthIn}×{g.heightIn}″</em>
                  </button>
                ))}
              </div>
            )}
          </>
        }
      />

      {selected && selected.kind !== "text" && imageEditorOpen ? (
        <BagsImageEditorModal
          open
          sourcePreviewUrl={selected.previewUrl}
          sourceName={selected.name}
          onClose={() => setImageEditorOpen(false)}
          onApply={applyImageEditorResult}
          onRemoveBg={() => {
            setImageEditorOpen(false);
            openBgRemoveForAsset(selected.assetId, selected.previewUrl);
          }}
          onUpscale={() => void upscaleSelected()}
          upscaling={upscaling}
        />
      ) : null}

      <BagsAutomationModal
        open={automationOpen}
        kind={automationKind}
        onClose={() => {
          setAutomationOpen(false);
          setNestPreview(null);
        }}
        onApply={() => {
          if (automationKind === "auto-fill") confirmFillSheet();
          else if (automationKind === "auto-nest") confirmAutoNest();
          else setAutomationOpen(false);
        }}
        copyCount={autoFillPreviewCount}
        gap={gap}
        onGapChange={(nextGap) => {
          setGap(nextGap);
          if (automationKind === "auto-nest") {
            setNestPreview(shelfPackLayout(items, sheetWidth, sheetHeight, nextGap));
          }
        }}
        sheetLabel={`${sheetWidth}″ × ${sheetHeight}″`}
        fittedCount={
          automationKind === "auto-nest"
            ? (nestPreview?.fittedCount ?? items.length)
            : autoPreview?.fittedCount
        }
        remainingCount={
          automationKind === "auto-nest"
            ? (nestPreview?.remainingCount ?? 0)
            : (autoPreview?.remainingCount ?? 0)
        }
        utilization={
          automationKind === "auto-nest" ? nestPreview?.utilization : autoPreview?.utilization
        }
        loading={automationKind === "auto-build" ? autoPreviewLoading : false}
        error={automationKind === "auto-build" ? autoPreviewError : undefined}
        allowRotate={allowRotate90}
        onAllowRotateChange={setAllowRotate90}
        onRegenerate={
          automationKind === "auto-build"
            ? () => void refreshAutoPreview()
            : automationKind === "auto-nest"
              ? () => setNestPreview(shelfPackLayout(items, sheetWidth, sheetHeight, gap))
              : undefined
        }
        busy={autoBusy}
      />

      {bgRemove ? (
        <BackgroundRemovalModal
          open
          sourceAssetId={bgRemove.sourceAssetId}
          sourcePreviewUrl={bgRemove.sourcePreviewUrl}
          requestHeaders={{ "X-LGS-Shop": page.shop }}
          onClose={() => setBgRemove(null)}
          onApply={applyBgRemoveResult}
        />
      ) : null}
    </div>
  );
}
