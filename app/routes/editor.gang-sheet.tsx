import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
import { BAGS_BASE_CSS } from "../components/editor/bags-ui";
import { EditorRailIcon } from "../components/editor/editor-rail-icons";
import { GangSheetCommandBar, type OverflowAction } from "../components/editor/gang-sheet/gang-sheet-command-bar";
import { GANG_SHEET_EDITOR_CSS } from "../components/editor/gang-sheet/gang-sheet-editor-styles";
import { GangSheetSaveDialog } from "../components/editor/gang-sheet/gang-sheet-save-dialog";
import { ToolbarIcon } from "../components/editor/gang-sheet/editor-toolbar-icons";
import {
  CanvasAlignToolbar,
  CanvasEmptyState,
  CanvasMetaBar,
  CanvasRulers,
  CanvasSelectionBounds,
  CanvasSheetTabs,
} from "../components/editor/gang-sheet/canvas-chrome";
import {
  ARTWORK_LIBRARY_CSS,
  GalleryPanel,
  UploadsPanel,
  sortGallery,
  type GallerySort,
  type UploadSort,
} from "../components/editor/gang-sheet/artwork-library";
import { CanvasMinimap } from "../components/editor/gang-sheet/canvas-minimap";
import { selectionBounds } from "../components/editor/gang-sheet/canvas-workspace";
import { dpiQualityTier, summarizeQuality } from "../components/editor/gang-sheet/dpi-quality";
import {
  fitWidthZoomPercent,
  smartFitZoomPercent,
  zoomDisplayLabel,
  type ZoomMode,
} from "../components/editor/gang-sheet/editor-zoom";
import {
  QualityInspectorPanel,
  QualityStatusButton,
  type QualityDisplayPrefs,
} from "../components/editor/gang-sheet/quality-inspector";
import { SheetShrinkDialog } from "../components/editor/gang-sheet/sheet-shrink-dialog";
import {
  GANG_SHEET_HEIGHTS,
  GANG_SHEET_WIDTHS,
  gangSheetAreaPriceUsd,
} from "../domain/design/gang-sheet-sheet";
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
  sortByZIndex,
  writeDraft,
  type GangDraftV1,
} from "../components/editor/gang-sheet-helpers";
import {
  FONT_OPTIONS,
  GALLERY_CATEGORIES,
  HELP_SHORTCUTS,
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
import { AutoBuildScreen } from "../components/editor/workflow/auto-build-screen";
import { AutoFillScreen, type AutoFillSource } from "../components/editor/workflow/auto-fill-screen";
import { NamesNumbersScreen } from "../components/editor/workflow/names-numbers-screen";
import { PRODUCTION_WORKFLOW_CSS } from "../components/editor/workflow/workflow-styles";
import {
  defaultRosterPlate,
  findDuplicateRosterNumbers,
  parseRosterCsv,
  planFillSheetCopies,
  planRosterPlacements,
  type WorkflowPhase,
} from "../components/editor/workflow/workflow-helpers";

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
  | "text"
  | "names"
  | "auto"
  | "layers"
  | "templates"
  | "help";

type Screen = "welcome" | "auto_build" | "auto_fill" | "names" | "canvas";

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

const SHEET_WIDTHS = GANG_SHEET_WIDTHS;
const SHEET_HEIGHTS = [...GANG_SHEET_HEIGHTS];
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
      productGid: launch.productGid,
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
      gangSheetVariants: editorConfig?.gangSheetVariants ?? [],
      defaultSheetHeightIn: editorConfig?.defaultSheetHeightIn ?? 24,
      defaultSheet: editorConfig?.sheet ?? {
        widthIn: 22.5,
        maxHeightIn: 24,
        imageMarginIn: 0.15,
        artboardMarginIn: 0.1,
      },
    },
    { headers },
  );
}

function pieceTransform(item: Pick<CanvasItem, "rotationDeg" | "flipX" | "flipY">) {
  return `rotate(${item.rotationDeg}deg) scaleX(${item.flipX ? -1 : 1}) scaleY(${item.flipY ? -1 : 1})`;
}

function appearanceVars(appearance: ShopAppearance): CSSProperties {
  return {
    ["--shop-accent" as string]: appearance.accentColor,
    ["--shop-accent-dark" as string]: appearance.accentColorDark,
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
    showSafeZone: false,
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
  const [workflowReturn, setWorkflowReturn] = useState<"welcome" | "canvas">("welcome");
  const [fillPhase, setFillPhase] = useState<WorkflowPhase>("setup");
  const [fillSource, setFillSource] = useState<AutoFillSource | null>(null);
  const [fillWidthIn, setFillWidthIn] = useState(4);
  const [fillHeightIn, setFillHeightIn] = useState(4);
  const [fillQuantity, setFillQuantity] = useState(1);
  const [fillLockAspect, setFillLockAspect] = useState(true);
  const [fillError, setFillError] = useState("");
  const [namesPhase, setNamesPhase] = useState<WorkflowPhase>("setup");
  const [rosterLockAspect, setRosterLockAspect] = useState(true);
  const [rosterWidthIn, setRosterWidthIn] = useState(6);
  const [rosterHeightIn, setRosterHeightIn] = useState(0.4);
  const [namesError, setNamesError] = useState("");
  const [autoUploadTab, setAutoUploadTab] = useState<"upload" | "pool" | "gallery">("upload");
  const [allowRotate90, setAllowRotate90] = useState(true);
  const [uploadPool, setUploadPool] = useState<PoolItem[]>([]);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("uploads");
  const [poolTick, setPoolTick] = useState(0);
  const [draftOffer, setDraftOffer] = useState<GangDraftV1 | null>(null);
  const [hasStoredDraft, setHasStoredDraft] = useState(false);
  const [showFirstTip, setShowFirstTip] = useState(true);
  const [uploadSearch, setUploadSearch] = useState("");
  const [uploadSort, setUploadSort] = useState<UploadSort>("recent");
  const [galleryCategory, setGalleryCategory] = useState<string>("All");
  const [gallerySearch, setGallerySearch] = useState("");
  const [gallerySort, setGallerySort] = useState<GallerySort>("default");
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
  const [rosterCsv, setRosterCsv] = useState("");
  const [rosterFontSize, setRosterFontSize] = useState(24);
  const [savedDesigns, setSavedDesigns] = useState<LibraryDesign[]>([]);
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
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [spacePan, setSpacePan] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<"sidebar" | "properties" | null>(null);
  const [toolsPanelOpen, setToolsPanelOpen] = useState(true);
  const [propsPanelOpen, setPropsPanelOpen] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogError, setSaveDialogError] = useState("");
  const [saveDialogRequestId, setSaveDialogRequestId] = useState("");

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
  }
  const paintedItems = useMemo(() => sortByZIndex(items), [items]);
  const multiSelectBounds = useMemo(
    () => selectionBounds(items, selectedIds),
    [items, selectedIds],
  );

  const usedArea = useMemo(
    () => items.reduce((s, i) => s + i.widthIn * i.heightIn, 0),
    [items],
  );
  const estimate =
    page.variantPriceCents != null
      ? page.variantPriceCents / 100
      : Math.round(usedArea * page.pricePerSqIn * 100) / 100;
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
        return tier === "low" || tier === "poor" || tier === "unknown";
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
    const draft = readDraft(page.shop);
    setHasStoredDraft(Boolean(draft?.items.length));
    if (draft?.items.length && !page.designId) setDraftOffer(draft);
    void refreshLibrary();
    void refreshGallery();
  }, [page.shop, page.designId]);

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
        all.map((i) =>
          i.id === d.id
            ? inside({ ...i, widthIn, heightIn }, sheetWidth, sheetHeight)
            : i,
        ),
      );
    };
    const up = () => {
      const d = interaction.current;
      if (!d) return;
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
    };
  }

  function openCanvas(options?: { tab?: SidebarTab; pickUpload?: boolean }) {
    setScreen("canvas");
    setSidebarTab(options?.tab ?? "uploads");
    setMobileDrawer("sidebar");
    setMessage("");
    setShowFirstTip(true);
    if (options?.pickUpload) {
      window.setTimeout(() => sidebarUploadRef.current?.click(), 50);
    }
  }

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
      openAutoBuild("canvas");
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
    selectItem(null);
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

  function placeFromPool(poolId: string, quantity = 1) {
    const entry = uploadPool.find((p) => p.id === poolId);
    if (!entry) return;
    const qty = Math.max(1, Math.round(quantity));
    const placed: CanvasItem[] = [];
    for (let i = 0; i < qty; i++) {
      placed.push(
        createPlacedItem(entry.asset, entry.previewUrl, entry.name, i, [...items, ...placed]),
      );
    }
    pushHistory([...items, ...placed]);
    selectItem(placed.at(-1)?.id ?? null);
    setMessage(
      qty === 1
        ? `Placed "${entry.name}" on the sheet — drag to position.`
        : `Placed ${qty}× "${entry.name}" on the sheet.`,
    );
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
    setError("");
    setSaved(false);
    try {
      if (target === "canvas") {
        const poolAdded: PoolItem[] = [];
        const placed: CanvasItem[] = [];
        const placeOnSheet = options?.placeOnSheet ?? false;
        let base = items;
        for (const file of files) {
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

  function change(patch: Partial<CanvasItem>) {
    if (!selectedId) return;
    pushHistory(
      items.map((i) =>
        i.id === selectedId ? inside({ ...i, ...patch }, sheetWidth, sheetHeight) : i,
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

  function rotate() {
    if (!selected) return;
    change({
      widthIn: selected.heightIn,
      heightIn: selected.widthIn,
      rotationDeg: selected.rotationDeg ? 0 : 90,
    });
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

  function openAutoBuild(from: "welcome" | "canvas") {
    setWorkflowReturn(from);
    setScreen("auto_build");
    setAutoPhase("setup");
    setMessage("Auto Build — set size and quantity, preview, then Apply.");
  }

  function openAutoFill() {
    if (!selected) {
      setError("Select artwork on the sheet first, then Auto Fill.");
      return;
    }
    const source: AutoFillSource = {
      id: selected.id,
      name: selected.name,
      previewUrl: selected.previewUrl,
      widthIn: selected.widthIn,
      heightIn: selected.heightIn,
      widthPx: selected.widthPx,
      heightPx: selected.heightPx,
      lockAspect: selected.lockAspect !== false && selected.kind !== "text",
      kind: selected.kind,
    };
    const capacity = planFillSheetCopies({
      widthIn: source.widthIn,
      heightIn: source.heightIn,
      sheetWidth,
      sheetHeight,
      gap,
    }).capacity;
    setFillSource(source);
    setFillWidthIn(source.widthIn);
    setFillHeightIn(source.heightIn);
    setFillLockAspect(source.lockAspect);
    setFillQuantity(Math.max(1, capacity));
    setFillPhase("setup");
    setFillError("");
    setWorkflowReturn("canvas");
    setError("");
    setScreen("auto_fill");
  }

  function applyFillToCanvas() {
    if (!fillSource) return;
    const plan = planFillSheetCopies({
      widthIn: fillWidthIn,
      heightIn: fillHeightIn,
      sheetWidth,
      sheetHeight,
      gap,
      requested: fillQuantity,
    });
    if (!plan.copies.length) {
      setFillError("Nothing fits on this sheet.");
      return;
    }
    const sourceItem = items.find((i) => i.id === fillSource.id);
    if (!sourceItem) {
      setFillError("Select artwork on the sheet first, then Auto Fill.");
      return;
    }
    let z = nextZIndex(items);
    const copies: CanvasItem[] = plan.copies.map((c) => ({
      ...sourceItem,
      id: crypto.randomUUID(),
      xIn: c.xIn,
      yIn: c.yIn,
      widthIn: fillWidthIn,
      heightIn: fillHeightIn,
      zIndex: z++,
    }));
    pushHistory([...items.filter((i) => i.id !== fillSource.id), ...copies]);
    selectItem(copies[0]?.id ?? null);
    setMessage(`Filled sheet with ${copies.length} of ${fillQuantity} copies.`);
    setScreen("canvas");
  }

  function fillSheet() {
    openAutoFill();
  }

  function autoArrange() {
    let x = gap;
    let y = gap;
    let row = 0;
    const placed = [...items]
      .sort((a, b) => b.widthIn * b.heightIn - a.widthIn * a.heightIn)
      .map((i) => {
        if (x + i.widthIn > sheetWidth - gap) {
          x = gap;
          y += row + gap;
          row = 0;
        }
        const n = inside({ ...i, xIn: x, yIn: y }, sheetWidth, sheetHeight);
        x += i.widthIn + gap;
        row = Math.max(row, i.heightIn);
        return n;
      });
    pushHistory(placed);
    setMessage("Artwork automatically arranged.");
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
      if (screen === "canvas" && e.key === "[" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setToolsPanelOpen((v) => !v);
        return;
      }
      if (screen === "canvas" && e.key === "]" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setPropsPanelOpen((v) => !v);
        return;
      }
      if (!selectedId || screen !== "canvas") return;
      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? NUDGE_SHIFT_IN : NUDGE_IN;
      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else return;
      e.preventDefault();
      const cur = itemsRef.current;
      const next = cur.map((i) =>
        i.id === selectedId && !i.lockPosition
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

  function textPreviewDataUrl(content: string, fontSize: number, fontFamily: string, color: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120"><text x="8" y="${fontSize + 8}" font-size="${fontSize}" font-family="${fontFamily}" fill="${color}">${content.replace(/[<>&"]/g, "")}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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

  async function placeGalleryItem(g: GalleryItem, quantity = 1) {
    setUploading(true);
    setError("");
    try {
      const { asset, previewUrl } = await galleryThumbToAsset(g);
      const qty = Math.max(1, Math.round(quantity));
      const placed: CanvasItem[] = [];
      for (let i = 0; i < qty; i++) {
        const item = createPlacedItem(asset, previewUrl, g.name, i, [...items, ...placed]);
        item.widthIn = g.widthIn;
        item.heightIn = g.heightIn;
        item.dpi = Math.round(
          Math.min(asset.widthPx / g.widthIn, asset.heightPx / g.heightIn),
        );
        placed.push(item);
      }
      pushHistory([...items, ...placed]);
      selectItem(placed.at(-1)?.id ?? null);
      setMessage(
        qty === 1
          ? `Placed "${g.name}" from gallery.`
          : `Placed ${qty}× "${g.name}" from gallery.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place gallery item");
    } finally {
      setUploading(false);
    }
  }

  function openNamesWorkflow(from: "welcome" | "canvas") {
    const plate = defaultRosterPlate(sheetWidth, rosterFontSize);
    setRosterWidthIn(plate.widthIn);
    setRosterHeightIn(plate.heightIn);
    setRosterLockAspect(true);
    setNamesPhase("setup");
    setNamesError("");
    setWorkflowReturn(from);
    setScreen("names");
  }

  function generateRoster() {
    const rows = parseRosterCsv(rosterCsv);
    if (!rows.length) {
      setNamesError("Add roster rows — one name and number per line.");
      setError("Add roster rows — one name and number per line.");
      return;
    }
    const dupes = findDuplicateRosterNumbers(rows);
    if (dupes.length) {
      const msg = `Duplicate numbers found: ${dupes.join(", ")}`;
      setNamesError(msg);
      setError(msg);
      return;
    }
    const plan = planRosterPlacements({
      rows,
      sheetWidth,
      sheetHeight,
      gap,
      widthIn: rosterWidthIn,
      heightIn: rosterHeightIn,
    });
    const next: CanvasItem[] = [...items];
    let z = nextZIndex(next);
    plan.placements.forEach((row) => {
      next.push({
        assetId: `text-roster-${crypto.randomUUID()}`,
        widthPx: 400,
        heightPx: 80,
        contentType: "image/svg+xml",
        id: crypto.randomUUID(),
        name: row.label,
        previewUrl: textPreviewDataUrl(row.label, rosterFontSize, "Impact", "#111827"),
        xIn: row.xIn,
        yIn: row.yIn,
        widthIn: row.widthIn,
        heightIn: row.heightIn,
        rotationDeg: 0,
        zIndex: z++,
        kind: "text",
        textContent: row.label,
        fontSize: rosterFontSize,
        fontFamily: "Impact",
        textColor: "#111827",
        lockAspect: rosterLockAspect,
      });
    });
    pushHistory(next);
    setMessage(
      `Generated ${plan.requested} name/number set${plan.requested === 1 ? "" : "s"} · ${plan.onSheet} on sheet.`,
    );
    setScreen("canvas");
    setSidebarTab("layers");
    setMobileDrawer("sidebar");
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
      openAutoBuild("canvas");
      return;
    }
    if (tab === "names") {
      openNamesWorkflow("canvas");
      return;
    }
    if (tab === sidebarTab && toolsPanelOpen) {
      setToolsPanelOpen(false);
      setMobileDrawer(null);
      return;
    }
    setSidebarTab(tab);
    setToolsPanelOpen(true);
    setMobileDrawer("sidebar");
  }

  const filteredPool = useMemo(() => {
    let list = [...uploadPool];
    if (uploadSearch.trim()) {
      const q = uploadSearch.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (uploadSort === "name") return a.name.localeCompare(b.name);
      if (uploadSort === "dpi") return (b.asset.dpi ?? -1) - (a.asset.dpi ?? -1);
      if (uploadSort === "size") {
        return b.asset.widthPx * b.asset.heightPx - a.asset.widthPx * a.asset.heightPx;
      }
      return b.uploadedAt - a.uploadedAt;
    });
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
    return sortGallery(list, gallerySort);
  }, [galleryCategory, gallerySearch, galleryItems, gallerySort]);

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
    try {
      const q = librarySearch.trim();
      const res = await fetch(
        `/api/design-library?sort=${librarySort}${q ? `&search=${encodeURIComponent(q)}` : ""}${includeArchived ? "&archived=1" : ""}`,
        { credentials: "include", headers: { "X-LGS-Shop": page.shop } },
      );
      const json = (await res.json()) as { designs?: LibraryDesign[] };
      if (res.ok && json.designs) setSavedDesigns(json.designs);
    } catch {
      /* offline */
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
      setHistory([]);
      setFuture([]);
      setItems(restored);
      selectItem(null);
      setEditingDesignId(json.designId);
      setEditingVersion(json.version);
      setDesignName(json.name);
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
            artboardMarginIn: 0.1,
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
          artboardMarginIn: 0.1,
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
      <div className="bags welcome lgs-editor gs-editor-v2" style={appearanceVars(page.appearance)}>
        <style>{BAGS_BASE_CSS}{GANG_SHEET_EDITOR_CSS}{ARTWORK_LIBRARY_CSS}{BACKGROUND_REMOVAL_MODAL_CSS}</style>
        {restoreDialog}
        <div className="home-shell">
          <nav className="icon-rail" aria-label="Builder navigation">
            <button type="button" className="rail-btn active" title="Home" aria-label="Home">
              <EditorRailIcon name="home" label="Home" />
              <span className="rail-label">Home</span>
            </button>
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="rail-btn"
                title={tab.label}
                aria-label={tab.label}
                onClick={() => {
                  if (tab.id === "auto") {
                    openAutoBuild("welcome");
                    return;
                  }
                  if (tab.id === "names") {
                    openNamesWorkflow("welcome");
                    return;
                  }
                  openCanvas({ tab: tab.id });
                }}
              >
                <EditorRailIcon name={tab.icon} label={tab.label} />
                <span className="rail-label">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="home-main">
            <div className="welcome-card">
              <div className="brand center">
                <b>L</b>
                <span>
                  <strong>LEGENDS</strong>
                  <small>Gang Sheet Studio</small>
                </span>
              </div>
              <h1>{page.appearance.welcomeTitle}</h1>
              <p className="welcome-lead">{page.appearance.welcomeSubtitle}</p>
              {!page.hasDevAuth ? (
                <p className="error block">Dev auth not configured — check DEV_SHOP / TEST_API_TOKEN.</p>
              ) : null}

              <div className="welcome-sheet-pick">
                <label>
                  Sheet width
                  <select
                    value={sheetWidth}
                    onChange={(e) => setSheetWidth(+e.target.value)}
                    aria-label="Sheet width"
                  >
                    {SHEET_WIDTHS.map((w) => (
                      <option key={w} value={w}>
                        {w} in
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Sheet length
                  <select
                    value={sheetHeight}
                    onChange={(e) => setSheetHeight(+e.target.value)}
                    aria-label="Sheet length"
                  >
                    {SHEET_HEIGHTS.map((h) => (
                      <option key={h} value={h}>
                        {h} in
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="welcome-tip">
                Upload is inside the canvas: choose <strong>Build a Gang Sheet</strong> below, then use{" "}
                <strong>＋ Upload image(s)</strong> in the left sidebar (or drag PNG/JPEG onto the drop
                zone).
              </p>

              <div className="welcome-grid two-col">
                <button
                  type="button"
                  className="welcome-opt primary featured"
                  onClick={() => openCanvas({ tab: "uploads" })}
                >
                  <div className="welcome-icon"><EditorRailIcon name="sheet" label="Build" /></div>
                  <strong>Build a Gang Sheet</strong>
                  <span>Open the canvas with your selected sheet size — upload, place, and arrange.</span>
                </button>
                <a className="welcome-opt" href={ubsHref}>
                  <div className="welcome-icon"><EditorRailIcon name="upload" label="Upload by Size" /></div>
                  <strong>Upload by Size</strong>
                  <span>Single-design workflow with presets and live pricing.</span>
                </a>
                <button
                  type="button"
                  className="welcome-opt"
                  onClick={() => {
                    setAutoDrafts([]);
                    setAutoPreview(null);
                    setAutoPreviewError("");
                    setSelectedAutoId(null);
                    openAutoBuild("welcome");
                  }}
                >
                  <div className="welcome-icon"><EditorRailIcon name="auto" label="Auto Build" /></div>
                  <strong>Auto Arrange</strong>
                  <span>Bulk upload with live nest preview — fastest for many designs.</span>
                </button>
                <button type="button" className="welcome-opt" onClick={() => setShowTemplates((v) => !v)}>
                  <div className="welcome-icon"><EditorRailIcon name="template" label="Templates" /></div>
                  <strong>Start from a template</strong>
                  <span>Pick a preset sheet layout and open the editor.</span>
                </button>
                {savedDesigns.length ? (
                  <button
                    type="button"
                    className="welcome-opt"
                    onClick={() => void loadRemoteDesign(savedDesigns[0].id, savedDesigns[0].version)}
                  >
                    <div className="welcome-icon"><EditorRailIcon name="saved" label="Saved" /></div>
                    <strong>Open saved design</strong>
                    <span>
                      {savedDesigns.length} saved design{savedDesigns.length === 1 ? "" : "s"} in your library.
                    </span>
                  </button>
                ) : (
                  <button type="button" className="welcome-opt" disabled>
                    <div className="welcome-icon"><EditorRailIcon name="saved" label="Saved" /></div>
                    <strong>Open saved design</strong>
                    <span>Save a design from the editor to build your library.</span>
                  </button>
                )}
                {hasStoredDraft ? (
                  <button
                    type="button"
                    className="welcome-opt continue-draft"
                    onClick={() => {
                      const d = readDraft(page.shop);
                      if (d) void restoreDraft(d);
                    }}
                  >
                    <div className="welcome-icon"><EditorRailIcon name="upload" label="Continue" /></div>
                    <strong>Continue draft</strong>
                    <span>Resume the local draft saved on this device.</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="welcome-opt"
                  onClick={() => openCanvas({ tab: "uploads", pickUpload: true })}
                >
                  <div className="welcome-icon"><EditorRailIcon name="uploads" label="Upload" /></div>
                  <strong>Upload image(s)</strong>
                  <span>Add files to Uploads, then click each one to place on the gang sheet.</span>
                </button>
              </div>

              {showTemplates ? (
                <div className="template-picker">
                  {SHEET_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="template-card"
                      onClick={() => {
                        applySheetSize(tpl.widthIn, tpl.heightIn);
                        openCanvas({ tab: "uploads" });
                      }}
                    >
                      <strong>{tpl.name}</strong>
                      <span>{tpl.description}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {savedDesigns.length ? (
                <div className="saved-designs-list">
                  <div className="sidebar-tools">
                    <input
                      type="search"
                      placeholder="Search saved designs…"
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      onBlur={() => void refreshLibrary()}
                      aria-label="Search saved designs"
                    />
                    <select
                      value={librarySort}
                      onChange={(e) => {
                        setLibrarySort(e.target.value as "recent" | "name");
                        void refreshLibrary();
                      }}
                      aria-label="Sort saved designs"
                    >
                      <option value="recent">Recent</option>
                      <option value="name">Name</option>
                    </select>
                    <label className="library-archived-toggle">
                      <input
                        type="checkbox"
                        checked={libraryIncludeArchived}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setLibraryIncludeArchived(next);
                          void refreshLibrary(next);
                        }}
                      />
                      Show archived
                    </label>
                  </div>
                  <h3>Saved designs (server)</h3>
                  {savedDesigns.slice(0, 8).map((d) => (
                    <div key={d.id} className="saved-design-row-wrap">
                      {libraryRenamingId === d.id ? (
                        <form
                          className="saved-design-rename"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void renameLibraryDesign(d.id, libraryRenameValue);
                          }}
                        >
                          <input
                            value={libraryRenameValue}
                            onChange={(e) => setLibraryRenameValue(e.target.value)}
                            aria-label="Design name"
                            autoFocus
                          />
                          <button type="submit" className="saved-design-action">
                            Save
                          </button>
                          <button
                            type="button"
                            className="saved-design-action"
                            onClick={() => {
                              setLibraryRenamingId(null);
                              setLibraryRenameValue("");
                            }}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="saved-design-row"
                            onClick={() => void loadRemoteDesign(d.id, d.version)}
                          >
                            {d.previewPath ? (
                              <span className="saved-design-thumb checkerboard">
                                <img src={d.previewPath} alt="" />
                              </span>
                            ) : null}
                            <span className="saved-design-copy">
                              <strong>{d.name || "Untitled design"}</strong>
                              <small>
                                {d.pieceCount} piece{d.pieceCount === 1 ? "" : "s"} · {d.sheetLabel} · v{d.version} ·{" "}
                                ${(d.priceCents / 100).toFixed(2)} · {new Date(d.updatedAt).toLocaleDateString()}
                                {d.archived ? " · archived" : ""}
                              </small>
                            </span>
                          </button>
                          <div className="saved-design-actions">
                            <button
                              type="button"
                              className="saved-design-action"
                              onClick={() => {
                                setLibraryRenamingId(d.id);
                                setLibraryRenameValue(d.name || "");
                              }}
                            >
                              Rename
                            </button>
                            {!d.archived ? (
                              <button
                                type="button"
                                className="saved-design-action"
                                onClick={() => void archiveLibraryDesign(d.id)}
                              >
                                Archive
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="saved-design-action"
                              onClick={() =>
                                void fetch("/api/design-library", {
                                  method: "POST",
                                  credentials: "include",
                                  headers: { "Content-Type": "application/json", "X-LGS-Shop": page.shop },
                                  body: JSON.stringify({
                                    intent: "duplicate",
                                    sourceDesignId: d.id,
                                    sourceVersion: d.version,
                                    productGid: page.productGid,
                                    variantGid: page.variantId
                                      ? `gid://shopify/ProductVariant/${page.variantId}`
                                      : undefined,
                                  }),
                                }).then(async (res) => {
                                  const json = (await res.json()) as { designId?: string; error?: string };
                                  if (!res.ok || !json.designId) throw new Error(json.error || "Duplicate failed");
                                  void loadRemoteDesign(json.designId!);
                                })
                              }
                            >
                              Duplicate
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <p className="welcome-tip">
                {hasStoredDraft ? <>Local draft on this device is separate from your saved library. </> : null}
                Tip: Arrow keys nudge selected art by 0.05″ (Shift = 0.25″). Drag the corner handle to
                resize with aspect lock.
              </p>

              <div className="welcome-foot">
                <span>Selected sheet · est. empty sheet</span>
                <strong>
                  {sheetWidth}″ × {sheetHeight}″ ·{" "}
                  {page.variantPriceCents != null
                    ? `$${(page.variantPriceCents / 100).toFixed(2)} sheet price`
                    : `$${gangSheetAreaPriceUsd(sheetWidth, sheetHeight, page.pricePerSqIn).toFixed(2)} max · $${page.pricePerSqIn.toFixed(3)}/in² printed`}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const workflowCss = BAGS_BASE_CSS + GANG_SHEET_EDITOR_CSS + BACKGROUND_REMOVAL_MODAL_CSS + PRODUCTION_WORKFLOW_CSS;
  const appearanceStyle = appearanceVars(page.appearance);
  const leaveWorkflow = () => setScreen(workflowReturn);

  if (screen === "auto_build") {
    return (
      <AutoBuildScreen
        appearanceStyle={appearanceStyle}
        extraCss={workflowCss}
        phase={autoPhase}
        drafts={autoDrafts}
        selectedDraftId={selectedAutoId}
        onSelectDraft={setSelectedAutoId}
        sheetWidth={sheetWidth}
        sheetHeight={sheetHeight}
        gap={gap}
        sheetWidths={SHEET_WIDTHS}
        sheetHeights={SHEET_HEIGHTS}
        onSheetWidth={setSheetWidth}
        onSheetHeight={setSheetHeight}
        onGap={setGap}
        allowRotate90={allowRotate90}
        onAllowRotate90={setAllowRotate90}
        uploadTab={autoUploadTab}
        onUploadTab={setAutoUploadTab}
        uploading={uploading}
        onUploadFiles={(files) => void uploadFiles(files, "auto")}
        uploadPool={uploadPool}
        galleryItems={filteredGallery}
        onAddPoolItem={(id) => {
          const entry = uploadPool.find((p) => p.id === id);
          if (entry) addPoolItemToAuto(entry);
        }}
        onAddGalleryItem={(id) => {
          const g = filteredGallery.find((item) => item.id === id);
          if (g) void addGalleryItemToAuto(g);
        }}
        onPatchDraft={(id, patch) =>
          setAutoDrafts((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
        }
        onDuplicateDraft={(id) =>
          setAutoDrafts((rows) => {
            const src = rows.find((r) => r.id === id);
            if (!src) return rows;
            return [
              ...rows,
              {
                ...src,
                id: crypto.randomUUID(),
                name: `${src.name.replace(/\.[^.]+$/, "")} (copy)`,
              },
            ];
          })
        }
        onRemoveDraft={(id) => {
          setAutoDrafts((rows) => rows.filter((r) => r.id !== id));
          if (selectedAutoId === id) setSelectedAutoId(null);
        }}
        preview={autoPreview}
        previewLoading={autoPreviewLoading}
        previewError={autoPreviewError}
        error={error}
        message={message}
        busy={autoBusy}
        onBack={leaveWorkflow}
        onApplyReview={() => {
          void refreshAutoPreview().then((p) => {
            if (p?.pieces.length) setAutoPhase("review");
          });
        }}
        onUndo={undoAutoResult}
        onRegenerate={() => void refreshAutoPreview()}
        onBackAdjust={() => setAutoPhase("setup")}
        onBuild={() => void applyAutoBuild()}
      />
    );
  }

  if (screen === "auto_fill" && fillSource) {
    const aspect = fillSource.widthPx / Math.max(0.01, fillSource.heightPx);
    return (
      <AutoFillScreen
        appearanceStyle={appearanceStyle}
        extraCss={workflowCss}
        phase={fillPhase}
        source={fillSource}
        sheetWidth={sheetWidth}
        sheetHeight={sheetHeight}
        gap={gap}
        widthIn={fillWidthIn}
        heightIn={fillHeightIn}
        quantity={fillQuantity}
        lockAspect={fillLockAspect}
        onWidth={(w) => {
          setFillWidthIn(w);
          if (fillLockAspect) setFillHeightIn(w / aspect);
        }}
        onHeight={(h) => {
          setFillHeightIn(h);
          if (fillLockAspect) setFillWidthIn(h * aspect);
        }}
        onQuantity={setFillQuantity}
        onLockAspect={setFillLockAspect}
        onPreset={(inches) => {
          if (aspect >= 1) {
            setFillWidthIn(inches);
            setFillHeightIn(inches / aspect);
          } else {
            setFillWidthIn(inches * aspect);
            setFillHeightIn(inches);
          }
          setFillLockAspect(true);
        }}
        error={fillError}
        onBack={leaveWorkflow}
        onApplyReview={() => {
          const plan = planFillSheetCopies({
            widthIn: fillWidthIn,
            heightIn: fillHeightIn,
            sheetWidth,
            sheetHeight,
            gap,
            requested: fillQuantity,
          });
          if (!plan.placed) {
            setFillError("Nothing fits on this sheet.");
            return;
          }
          setFillError("");
          setFillPhase("review");
        }}
        onBackAdjust={() => setFillPhase("setup")}
        onBuild={applyFillToCanvas}
      />
    );
  }

  if (screen === "names") {
    const aspect = rosterWidthIn / Math.max(0.01, rosterHeightIn);
    return (
      <NamesNumbersScreen
        appearanceStyle={appearanceStyle}
        extraCss={workflowCss}
        phase={namesPhase}
        rosterCsv={rosterCsv}
        onRosterCsv={setRosterCsv}
        fontSize={rosterFontSize}
        onFontSize={(n) => {
          setRosterFontSize(n);
          const nextH = Math.max(0.4, n / 72);
          setRosterHeightIn(nextH);
          if (rosterLockAspect) setRosterWidthIn(nextH * aspect);
        }}
        widthIn={rosterWidthIn}
        heightIn={rosterHeightIn}
        lockAspect={rosterLockAspect}
        onWidth={(w) => {
          setRosterWidthIn(w);
          if (rosterLockAspect) setRosterHeightIn(w / aspect);
        }}
        onHeight={(h) => {
          setRosterHeightIn(h);
          if (rosterLockAspect) setRosterWidthIn(h * aspect);
        }}
        onLockAspect={setRosterLockAspect}
        sheetWidth={sheetWidth}
        sheetHeight={sheetHeight}
        gap={gap}
        error={namesError}
        onBack={leaveWorkflow}
        onApplyReview={() => {
          const rows = parseRosterCsv(rosterCsv);
          const dupes = findDuplicateRosterNumbers(rows);
          if (!rows.length) {
            setNamesError("Add roster rows — one name and number per line.");
            return;
          }
          if (dupes.length) {
            setNamesError(`Duplicate numbers found: ${dupes.join(", ")}`);
            return;
          }
          setNamesError("");
          setNamesPhase("review");
        }}
        onBackAdjust={() => setNamesPhase("setup")}
        onBuild={generateRoster}
      />
    );
  }

  return (
    <div className="bags lgs-editor gs-editor-v2" style={appearanceVars(page.appearance)}>
      <style>{BAGS_BASE_CSS}{GANG_SHEET_EDITOR_CSS}{ARTWORK_LIBRARY_CSS}{BACKGROUND_REMOVAL_MODAL_CSS}</style>
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
      <GangSheetCommandBar
        designName={designName}
        onDesignNameChange={(name) => {
          setDesignName(name);
          setDirty(true);
        }}
        dirty={dirty}
        saved={saved}
        sheetWidth={sheetWidth}
        sheetHeight={sheetHeight}
        sheetWidths={SHEET_WIDTHS}
        sheetHeights={SHEET_HEIGHTS}
        onSheetSizeChange={requestSheetSize}
        estimateUsd={estimate}
        zoomLabel={zoomLabel}
        onZoomOut={() => {
          setZoom((z) => Math.max(15, z - 10));
          setZoomMode("custom");
        }}
        onZoomIn={() => {
          setZoom((z) => Math.min(200, z + 10));
          setZoomMode("custom");
        }}
        onFitWidth={() => fitToViewport("width")}
        onFitSheet={() => fitToViewport("sheet")}
        panMode={spacePan}
        onTogglePan={() => setSpacePan((v) => !v)}
        gridVisible={gridVisible}
        onToggleGrid={() => setGridVisible((v) => !v)}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
        onHome={() => setScreen("welcome")}
        onSaveOnly={openSaveDialog}
        onSaveAndCart={openSaveDialog}
        saving={saving}
        hasItems={items.length > 0}
        onOverflowAction={handleOverflowAction}
        toolsPanelOpen={toolsPanelOpen}
        propsPanelOpen={propsPanelOpen}
        onToggleToolsPanel={() => setToolsPanelOpen((v) => !v)}
        onTogglePropsPanel={() => setPropsPanelOpen((v) => !v)}
        qualityButton={
          <QualityStatusButton
            summary={qualitySummary}
            active={qualityPanelOpen}
            onClick={() => setQualityPanelOpen((v) => !v)}
          />
        }
      />
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
      <div className={`workspace${toolsPanelOpen ? "" : " tools-collapsed"}${propsPanelOpen ? "" : " props-collapsed"}`}>
        <nav className="icon-rail" aria-label="Builder navigation">
          <button
            type="button"
            className="rail-btn"
            title="Home"
            aria-label="Home"
            onClick={() => setScreen("welcome")}
          >
            <EditorRailIcon name="home" label="Home" />
            <span className="rail-label">Home</span>
          </button>
          {SIDEBAR_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rail-btn ${sidebarTab === tab.id ? "active" : ""}`}
              title={tab.label}
              aria-label={tab.label}
              onClick={() => handleSidebarTab(tab.id)}
            >
              <EditorRailIcon name={tab.icon} label={tab.label} />
              <span className="rail-label">{tab.label}</span>
              {tab.id === "uploads" && uploadPool.length ? (
                <span className="rail-badge">{uploadPool.length}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <aside className={`sidebar-panel ${mobileDrawer === "sidebar" ? "mobile-open" : ""}`}>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileDrawer(null)}
            aria-label="Close tools panel"
          >
            ×
          </button>
          {sidebarTab === "uploads" ? (
            <UploadsPanel
              items={filteredPool.map((p) => ({
                id: p.id,
                name: p.name,
                previewUrl: p.previewUrl,
                uploadedAt: p.uploadedAt,
                asset: p.asset,
                onSheetCount: sheetCountForAsset(p.asset.assetId),
              }))}
              totalCount={uploadPool.length}
              search={uploadSearch}
              sort={uploadSort}
              uploading={uploading}
              gridKey={poolTick}
              inputRef={sidebarUploadRef}
              onSearchChange={setUploadSearch}
              onSortChange={setUploadSort}
              onRefresh={() => setPoolTick((t) => t + 1)}
              onFiles={(files) => void uploadFiles(files, "canvas")}
              onAddToSheet={(id, qty) => placeFromPool(id, qty)}
              onRename={renamePoolItem}
              onRemoveBackground={(assetId, previewUrl) => openBgRemoveForAsset(assetId, previewUrl)}
              onDelete={deletePoolItem}
            />
          ) : sidebarTab === "gallery" ? (
            <GalleryPanel
              items={filteredGallery}
              categories={galleryCategories}
              category={galleryCategory}
              search={gallerySearch}
              sort={gallerySort}
              loading={galleryLoading}
              error={galleryError}
              uploading={uploading}
              onSearchChange={setGallerySearch}
              onCategoryChange={setGalleryCategory}
              onSortChange={setGallerySort}
              onRefresh={() => void refreshGallery()}
              onAddToSheet={(item, qty) => void placeGalleryItem(item, qty)}
            />
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
              <div className="heading"><span><strong>Names &amp; Numbers</strong><small>Roster generator</small></span></div>
              <p className="sidebar-hint">Paste a roster, set plate size, preview requested vs placed, then Build.</p>
              <div className="sidebar-form">
                <label>Roster<textarea rows={6} value={rosterCsv} placeholder={"Smith, 12\nJones, 7"} onChange={(e) => setRosterCsv(e.target.value)} aria-label="Roster CSV" /></label>
                <button type="button" className="sidebar-upload-btn" onClick={() => openNamesWorkflow("canvas")}>Open Names &amp; Numbers</button>
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
          <CanvasMetaBar
            sheetWidth={sheetWidth}
            sheetHeight={sheetHeight}
            utilization={utilization}
            itemCount={items.length}
            selectedCount={selectedIds.size}
            snapEnabled={snapEnabled}
            onSnapChange={setSnapEnabled}
            zoomLabel={zoomLabel}
            onZoomOut={() => {
              setZoom((z) => Math.max(15, z - 10));
              setZoomMode("custom");
            }}
            onZoomIn={() => {
              setZoom((z) => Math.min(200, z + 10));
              setZoomMode("custom");
            }}
            onFitWidth={() => fitToViewport("width")}
            onFitSheet={() => fitToViewport("sheet")}
          />
          <div
            className={`scroll ${spacePan ? "pan-mode" : ""}`}
            ref={scrollRef}
            onClick={() => selectItem(null)}
            onPointerDown={(e) => {
              if (!spacePan || e.button !== 0) return;
              const el = scrollRef.current;
              if (!el) return;
              panRef.current = { sx: e.clientX, sy: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
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
            <CanvasRulers sheetWidth={sheetWidth} sheetHeight={sheetHeight} />
            <div className="canvas-stage">
            <CanvasAlignToolbar
              selectedCount={selectedIds.size}
              onAlign={alignSelection}
              onDistribute={distributeSelection}
            />
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
              className={`sheet ${gridVisible ? "grid-on" : "grid-off"} ${qualityPrefs.showSafeZone ? "safe-zone-on" : ""}`}
              style={{ width: `${zoom}%`, aspectRatio: `${sheetWidth}/${sheetHeight}` }}
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
                    selectedIds.has(i.id) && selectedIds.size > 1 ? "multi" : ""
                  } ${
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
                  <em>{i.widthIn.toFixed(1)}″</em>
                  {selectedIds.has(i.id) && !i.lockPosition ? (
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
                  ) : null}
                </div>
              ))}
              <CanvasSelectionBounds
                bounds={multiSelectBounds}
                sheetWidth={sheetWidth}
                sheetHeight={sheetHeight}
              />
              {!items.length && (
                <CanvasEmptyState
                  onUpload={() => {
                    handleSidebarTab("uploads");
                    sidebarUploadRef.current?.click();
                  }}
                  onGallery={() => handleSidebarTab("gallery")}
                  onText={() => handleSidebarTab("text")}
                />
              )}
            </div>
            </div>
          </div>
          <CanvasSheetTabs
            templates={SHEET_TEMPLATES}
            sheetWidth={sheetWidth}
            sheetHeight={sheetHeight}
            onSelect={requestSheetSize}
          />
        </main>
        <aside className={`properties ${mobileDrawer === "properties" ? "mobile-open" : ""}`}>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileDrawer(null)}
            aria-label="Close properties panel"
          >
            ×
          </button>
          <div className="heading">
            <span>
              <strong>Properties</strong>
              <small>{selected ? "Artwork selected" : "Select an item"}</small>
            </span>
          </div>
          {selected ? (
            <>
              <div className="preview">
                {selected.kind === "text" ? (
                  <span className="text-preview">{selected.textContent ?? selected.name}</span>
                ) : (
                  <img src={selected.previewUrl} alt="" className="checkerboard" />
                )}
                <strong>{selected.name}</strong>
                <small>
                  {selected.kind === "text"
                    ? `${selected.fontFamily} · ${selected.fontSize}pt`
                    : `${selected.widthPx} × ${selected.heightPx}px · ${selected.dpi ? `${selected.dpi} DPI` : "DPI not tagged"}`}
                </small>
              </div>
              <div className="fields grid-2">
                <label>
                  X (in)
                  <input type="number" step={0.05} value={round(selected.xIn)} disabled={selected.lockPosition} onChange={(e) => change({ xIn: +e.target.value })} />
                </label>
                <label>
                  Y (in)
                  <input type="number" step={0.05} value={round(selected.yIn)} disabled={selected.lockPosition} onChange={(e) => change({ yIn: +e.target.value })} />
                </label>
                <label>
                  Width (in)
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={round(selected.widthIn)}
                    onChange={(e) => {
                      const w = +e.target.value;
                      if (selected.kind === "text" || selected.lockAspect === false) change({ widthIn: w });
                      else change({ widthIn: w, heightIn: w / (selected.widthPx / selected.heightPx) });
                    }}
                  />
                </label>
                <label>
                  Height (in)
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={round(selected.heightIn)}
                    onChange={(e) => {
                      const h = +e.target.value;
                      if (selected.kind === "text" || selected.lockAspect === false) change({ heightIn: h });
                      else change({ heightIn: h, widthIn: h * (selected.widthPx / selected.heightPx) });
                    }}
                  />
                </label>
                <label>
                  Rotation
                  <select value={selected.rotationDeg} onChange={(e) => change({ rotationDeg: +e.target.value as 0 | 90 })}>
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                  </select>
                </label>
              </div>
              <div className="align-row">
                <span>Align</span>
                <button type="button" onClick={() => alignSelection("left")} aria-label="Align left">⫷</button>
                <button type="button" onClick={() => alignSelection("center-h")} aria-label="Align center">⫿</button>
                <button type="button" onClick={() => alignSelection("right")} aria-label="Align right">⫸</button>
                <button type="button" onClick={() => alignSelection("top")} aria-label="Align top">⫠</button>
                <button type="button" onClick={() => alignSelection("center-v")} aria-label="Align middle">⫟</button>
                <button type="button" onClick={() => alignSelection("bottom")} aria-label="Align bottom">⫡</button>
              </div>
              <div className="align-row">
                <span>Distribute</span>
                <button type="button" onClick={() => distributeSelection("horizontal")}>Horizontal</button>
                <button type="button" onClick={() => distributeSelection("vertical")}>Vertical</button>
              </div>
              <label className="toggle-row"><input type="checkbox" checked={selected.lockAspect !== false && selected.kind !== "text"} onChange={(e) => change({ lockAspect: e.target.checked })} /> Lock aspect ratio</label>
              <label className="toggle-row"><input type="checkbox" checked={Boolean(selected.lockPosition)} onChange={(e) => change({ lockPosition: e.target.checked })} /> Lock position</label>
              <div className="actions">
                <button type="button" onClick={duplicate} aria-label="Duplicate selected">⧉ Duplicate</button>
                <button type="button" onClick={rotate} aria-label="Rotate selected">↻ Rotate</button>
                <button type="button" onClick={flipHorizontal} aria-label="Flip horizontal">⇋ Flip H</button>
                <button type="button" onClick={flipVertical} aria-label="Flip vertical">⇅ Flip V</button>
                {selected.kind !== "text" && !selected.assetId.startsWith("text-") ? (
                  <button
                    type="button"
                    onClick={() => openBgRemoveForAsset(selected.assetId, selected.previewUrl)}
                    aria-label="Remove background"
                  >
                    ✂ Remove BG
                  </button>
                ) : null}
                <button type="button" onClick={fillSheet} aria-label="Fill sheet with copies">▦ Fill sheet</button>
                <button type="button" onClick={removeSelected} aria-label="Delete selected">⌫ Delete</button>
              </div>
              <div className="layer-actions">
                <span>Layer</span>
                <button type="button" onClick={() => layerAction("forward")} aria-label="Bring forward">Forward</button>
                <button type="button" onClick={() => layerAction("backward")} aria-label="Send backward">Backward</button>
                <button type="button" onClick={() => layerAction("front")} aria-label="Bring to front">To front</button>
                <button type="button" onClick={() => layerAction("back")} aria-label="Send to back">To back</button>
              </div>
              <label className="spacing">
                Spacing <span>{gap.toFixed(2)} in</span>
                <input type="range" min={0} max={0.5} step={0.05} value={gap} aria-label="Spacing between pieces" onChange={(e) => setGap(+e.target.value)} />
              </label>
              <button
                type="button"
                className="ghost-save-btn"
                onClick={() => {
                  setLibraryName(designName || `Gang sheet ${new Date().toLocaleDateString()}`);
                  setShowLibrarySave(true);
                }}
              >
                Save to library
              </button>
            </>
          ) : (
            <div className="none">
              <b>↖</b>
              <p>Click artwork on the sheet to resize, rotate, duplicate, or fill the sheet.</p>
            </div>
          )}
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
      <nav className="mobile-bar" aria-label="Mobile toolbar">
        <button type="button" onClick={() => { setSidebarTab("uploads"); setToolsPanelOpen(true); setMobileDrawer("sidebar"); }}>Uploads</button>
        <button type="button" onClick={() => { setSidebarTab("layers"); setToolsPanelOpen(true); setMobileDrawer("sidebar"); }}>Layers</button>
        <button type="button" onClick={() => handleOverflowAction("arrange")}>Auto</button>
        <button type="button" onClick={() => { setPropsPanelOpen(true); setMobileDrawer("properties"); }}>Props</button>
        <button type="button" className="save" onClick={openSaveDialog} disabled={saving || !items.length}>
          {saving ? "Saving…" : "Save"}
        </button>
      </nav>

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
