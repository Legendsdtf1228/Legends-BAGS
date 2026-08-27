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
  fitZoomPercent,
  inside,
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
  GALLERY_ITEMS,
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
  | "help";

type Screen = "welcome" | "auto_build" | "canvas";

const SIDEBAR_TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: "uploads", label: "Uploads", icon: "📁" },
  { id: "gallery", label: "Gallery", icon: "🖼" },
  { id: "text", label: "Text", icon: "T" },
  { id: "names", label: "Names", icon: "#" },
  { id: "auto", label: "Auto", icon: "⚡" },
  { id: "layers", label: "Layers", icon: "☰" },
  { id: "help", label: "Help", icon: "?" },
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

const SHEET_WIDTHS = [22.5, 24, 30] as const;
const SHEET_HEIGHTS = [24, 36, 48, 60, 72, 84, 96, 108, 132, 150, 168, 192, 250];
const AUTO_PRESETS = [2, 3, 4, 5, 6, 8, 10, 12] as const;

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
  const [sheetHeight, setSheetHeight] = useState(() => {
    const match = page.gangSheetVariants.find((v) =>
      v.variantGid?.endsWith(`/${page.variantId}`),
    );
    return match?.sheetHeightIn ?? page.defaultSheet.maxHeightIn;
  });
  const [zoom, setZoom] = useState(70);
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
  const [galleryCategory, setGalleryCategory] = useState<string>("All");
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(GALLERY_ITEMS);
  const [galleryCategories, setGalleryCategories] = useState<string[]>([...GALLERY_CATEGORIES]);
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
    if (sidebarTab === "gallery") void refreshGallery();
  }, [sidebarTab]);

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

  function applySheetSize(w: number, h: number) {
    setSheetWidth(w);
    setSheetHeight(h);
    if (itemsRef.current.length) {
      pushHistory(
        itemsRef.current.map((i) => inside({ ...i }, w, h)),
      );
    }
    setSaved(false);
  }

  function fitToViewport() {
    const el = scrollRef.current;
    if (!el) return;
    setZoom(fitZoomPercent(el.clientWidth, el.clientHeight, sheetWidth, sheetHeight));
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

  function fillSheet() {
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
    setMessage(`Filled sheet with ${copies.length} copies.`);
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

  function parseRoster(csv: string) {
    return csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,\t]/).map((p) => p.trim());
        return { name: parts[0] ?? "", number: parts[1] ?? "" };
      })
      .filter((r) => r.name || r.number);
  }

  function generateRoster() {
    const rows = parseRoster(rosterCsv);
    if (!rows.length) {
      setError("Add roster rows — one name and number per line.");
      return;
    }
    const dupes = rows.filter(
      (r, i) => rows.findIndex((x) => x.number && x.number === r.number) !== i,
    );
    if (dupes.length) {
      setError(`Duplicate numbers found: ${dupes.map((d) => d.number).join(", ")}`);
      return;
    }
    const next: CanvasItem[] = [...items];
    let z = nextZIndex(next);
    rows.forEach((row, idx) => {
      const label = `${row.name}${row.number ? ` #${row.number}` : ""}`.trim();
      const w = Math.min(6, sheetWidth - 0.4);
      const h = Math.max(0.4, rosterFontSize / 72);
      next.push({
        assetId: `text-roster-${crypto.randomUUID()}`,
        widthPx: 400,
        heightPx: 80,
        contentType: "image/svg+xml",
        id: crypto.randomUUID(),
        name: label,
        previewUrl: textPreviewDataUrl(label, rosterFontSize, "Impact", "#111827"),
        xIn: 0.2,
        yIn: 0.2 + idx * (h + gap),
        widthIn: w,
        heightIn: h,
        rotationDeg: 0,
        zIndex: z++,
        kind: "text",
        textContent: label,
        fontSize: rosterFontSize,
        fontFamily: "Impact",
        textColor: "#111827",
      });
    });
    pushHistory(next);
    setMessage(`Generated ${rows.length} name/number set${rows.length === 1 ? "" : "s"}.`);
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
      setScreen("auto_build");
      setAutoPhase("setup");
      setMessage("Auto Build — upload, size, and nest in bulk.");
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
      };
      if (res.ok && json.items) {
        setGalleryItems(json.items);
        if (json.categories?.length) setGalleryCategories(json.categories);
      }
    } catch {
      /* fallback to seed data */
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

  async function save() {
    if (!items.length) {
      setError("Add artwork before saving.");
      return;
    }
    setSaving(true);
    setError("");
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
        state?: { pricing: { totalCents: number } };
      };
      if (!res.ok || !json.designId) throw new Error(json.error || "Could not save design");
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
      if (window.parent && window.parent !== window) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save design");
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
      <div className="bags welcome lgs-editor" style={appearanceVars(page.appearance)}>
        <style>{BAGS_BASE_CSS}{CSS}{BACKGROUND_REMOVAL_MODAL_CSS}</style>
        {restoreDialog}
        <div className="home-shell">
          <nav className="icon-rail" aria-label="Builder navigation">
            <button type="button" className="rail-btn active" title="Home" aria-label="Home">
              <span className="rail-icon">🏠</span>
              <span className="rail-label">Home</span>
            </button>
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="rail-btn"
                title={tab.label}
                aria-label={tab.label}
                onClick={() => openCanvas({ tab: tab.id === "auto" ? "uploads" : tab.id })}
              >
                <span className="rail-icon">{tab.icon}</span>
                <span className="rail-label">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="home-main">
            <div className="welcome-card">
              <div className="brand center">
                <b>L</b>
                <span>
                  <strong>LEGENDS BAGS</strong>
                  <small>Welcome Center</small>
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
                  <div className="welcome-icon">🎨</div>
                  <strong>Build a Gang Sheet</strong>
                  <span>Open the canvas with your selected sheet size — upload, place, and arrange.</span>
                </button>
                <a className="welcome-opt" href={ubsHref}>
                  <div className="welcome-icon">📐</div>
                  <strong>Upload by Size</strong>
                  <span>Single-design workflow with presets and live pricing.</span>
                </a>
                <button
                  type="button"
                  className="welcome-opt"
                  onClick={() => {
                    setScreen("auto_build");
                    setAutoPhase("setup");
                    setAutoDrafts([]);
                    setAutoPreview(null);
                    setAutoPreviewError("");
                    setSelectedAutoId(null);
                    setMessage("Upload all designs, set size & quantity — preview updates live.");
                  }}
                >
                  <div className="welcome-icon">⚡</div>
                  <strong>Auto Build</strong>
                  <span>Bulk upload with live nest preview — fastest for many designs.</span>
                </button>
                <button type="button" className="welcome-opt" onClick={() => setShowTemplates((v) => !v)}>
                  <div className="welcome-icon">📋</div>
                  <strong>Start from a template</strong>
                  <span>Pick a preset sheet layout and open the editor.</span>
                </button>
                {savedDesigns.length ? (
                  <button
                    type="button"
                    className="welcome-opt"
                    onClick={() => void loadRemoteDesign(savedDesigns[0].id, savedDesigns[0].version)}
                  >
                    <div className="welcome-icon">💾</div>
                    <strong>Open saved design</strong>
                    <span>
                      {savedDesigns.length} saved design{savedDesigns.length === 1 ? "" : "s"} in your library.
                    </span>
                  </button>
                ) : (
                  <button type="button" className="welcome-opt" disabled>
                    <div className="welcome-icon">💾</div>
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
                    <div className="welcome-icon">↺</div>
                    <strong>Continue draft</strong>
                    <span>Resume the local draft saved on this device.</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="welcome-opt"
                  onClick={() => openCanvas({ tab: "uploads", pickUpload: true })}
                >
                  <div className="welcome-icon">⬆</div>
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
                    : `$${((sheetWidth * sheetHeight) * page.pricePerSqIn).toFixed(2)} max · $${page.pricePerSqIn.toFixed(3)}/in² printed`}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      <div className="bags auto-mode lgs-editor" style={appearanceVars(page.appearance)}>
        <style>{BAGS_BASE_CSS}{CSS}{BACKGROUND_REMOVAL_MODAL_CSS}</style>
        <header>
          <div className="brand">
            <b>L</b>
            <span>
              <strong>Auto Build</strong>
              <small>{autoPhase === "setup" ? "Upload → size & qty → Apply" : "Review nest → Continue"}</small>
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
                      {SHEET_WIDTHS.map((w) => (
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
                      {SHEET_HEIGHTS.map((h) => (
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
    <div className="bags lgs-editor" style={appearanceVars(page.appearance)}>
      <style>{BAGS_BASE_CSS}{CSS}{BACKGROUND_REMOVAL_MODAL_CSS}</style>
      {restoreDialog}
      {librarySaveDialog}
      <header className="editor-header">
        <div className="brand">
          <b>L</b>
          <span>
            <strong>LEGENDS BAGS</strong>
            <small>Gang Sheet Builder</small>
          </span>
        </div>
        <div className="top-toolbar">
          <button type="button" onClick={undo} disabled={!history.length} aria-label="Undo">
            ↶ Undo
          </button>
          <button type="button" onClick={redo} disabled={!future.length} aria-label="Redo">
            ↷ Redo
          </button>
          <div className="zoom">
            <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(20, z - 10))}>
              −
            </button>
            <span>{zoom}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(150, z + 10))}>
              ＋
            </button>
            <button type="button" aria-label="Fit sheet to viewport" onClick={fitToViewport}>
              Fit
            </button>
          </div>
          <label>
            Sheet
            <select value={sheetWidth} aria-label="Sheet width" onChange={(e) => applySheetSize(+e.target.value, sheetHeight)}>
              {SHEET_WIDTHS.map((w) => (
                <option key={w} value={w}>{w}″</option>
              ))}
            </select>
          </label>
          <label>
            Length
            <select value={sheetHeight} aria-label="Sheet length" onChange={(e) => applySheetSize(sheetWidth, +e.target.value)}>
              {SHEET_HEIGHTS.map((h) => (
                <option key={h} value={h}>{h}″</option>
              ))}
            </select>
          </label>
          <span className="price-chip">${estimate.toFixed(2)}</span>
        </div>
        <nav>
          <button type="button" onClick={() => setScreen("welcome")} aria-label="Go to Home">
            Home
          </button>
          <button type="button" onClick={autoArrange} disabled={!items.length} aria-label="Auto arrange artwork">
            Arrange
          </button>
          <label className="btn-upload">
            {uploading ? "Uploading…" : "＋ Add"}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg"
              hidden
              onChange={(e) =>
                void uploadFiles(Array.from(e.target.files ?? []), "canvas", { placeOnSheet: true })
              }
            />
          </label>
          <button
            type="button"
            className="save"
            onClick={() => void save()}
            disabled={saving || !items.length}
            aria-label="Save and add to cart"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save & add to cart"}
          </button>
        </nav>
      </header>
      {overlappingIds.size > 0 ? (
        <p className="warn toast" role="status">
          {overlappingIds.size} piece{overlappingIds.size === 1 ? "" : "s"} overlapping — layouts
          still save; consider rearranging.
        </p>
      ) : null}
      {oobIds.size > 0 ? (
        <p className="warn toast" role="status">
          {oobIds.size} piece{oobIds.size === 1 ? "" : "s"} outside the 0.1″ artboard margin.
        </p>
      ) : null}
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
      <div className="workspace">
        <nav className="icon-rail" aria-label="Builder navigation">
          <button
            type="button"
            className="rail-btn"
            title="Home"
            aria-label="Home"
            onClick={() => setScreen("welcome")}
          >
            <span className="rail-icon">🏠</span>
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
              <span className="rail-icon">{tab.icon}</span>
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
            <>
              <div className="heading">
                <span>
                  <strong>Uploads</strong>
                  <small>{uploadPool.length} file{uploadPool.length === 1 ? "" : "s"}</small>
                </span>
                <button
                  type="button"
                  className="refresh-btn"
                  title="Refresh uploads"
                  aria-label="Refresh uploads"
                  onClick={() => setPoolTick((t) => t + 1)}
                >
                  ↻
                </button>
              </div>
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
              <p className="sidebar-hint">Drag files here or click to upload — then click a thumbnail to place.</p>
              <label
                className="sidebar-upload-btn drop-target"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void uploadFiles(Array.from(e.dataTransfer.files ?? []), "canvas");
                }}
              >
                {uploading ? "Uploading…" : "＋ Upload image(s)"}
                <input
                  ref={sidebarUploadRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg"
                  hidden
                  onChange={(e) => {
                    void uploadFiles(Array.from(e.target.files ?? []), "canvas");
                    e.target.value = "";
                  }}
                />
              </label>
              {!filteredPool.length ? (
                <label className="drop compact drop-target" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void uploadFiles(Array.from(e.dataTransfer.files ?? []), "canvas"); }}>
                  <b>⬆</b>
                  <strong>{uploadPool.length ? "No matches" : "No uploads yet"}</strong>
                  <small>Drop PNG/JPEG files here</small>
                  <input type="file" multiple accept="image/png,image/jpeg" hidden onChange={(e) => { void uploadFiles(Array.from(e.target.files ?? []), "canvas"); e.target.value = ""; }} />
                </label>
              ) : (
                <div className="pool-grid" key={poolTick}>
                  {filteredPool.map((p) => {
                    const onSheet = sheetCountForAsset(p.asset.assetId);
                    const lowDpi = p.asset.dpi != null && p.asset.dpi < 200;
                    return (
                      <div key={p.id} className="pool-item-wrap">
                        <button type="button" className="pool-item" onClick={() => placeFromPool(p.id)} title="Click to place on gang sheet" draggable onDragStart={(e) => e.dataTransfer.setData("text/pool-id", p.id)}>
                          <img src={p.previewUrl} alt="" className="checkerboard" />
                          <span>{p.name}</span>
                          {onSheet ? <em className="on-sheet">{onSheet} on sheet</em> : null}
                          {lowDpi ? <em className="dpi-warn">Low DPI</em> : null}
                        </button>
                        <div className="pool-item-actions">
                          <input type="text" defaultValue={p.name} aria-label="Rename upload" onBlur={(e) => renamePoolItem(p.id, e.target.value || p.name)} />
                          <button type="button" aria-label="Remove background" title="Remove background" onClick={() => openBgRemoveForAsset(p.asset.assetId, p.previewUrl)}>✂</button>
                          <button type="button" aria-label="Delete upload" onClick={() => deletePoolItem(p.id)}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : sidebarTab === "gallery" ? (
            <>
              <div className="heading"><span><strong>Gallery</strong><small>Merchant artwork</small></span></div>
              <div className="sidebar-tools">
                <input type="search" placeholder="Search gallery…" value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} aria-label="Search gallery" />
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
            </>
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
              <p className="sidebar-hint">Paste from Excel or CSV — one row per player: Name, Number</p>
              <div className="sidebar-form">
                <label>Roster<textarea rows={8} value={rosterCsv} placeholder={"Smith, 12\nJones, 7"} onChange={(e) => setRosterCsv(e.target.value)} aria-label="Roster CSV" /></label>
                <label>Font size<input type="number" min={12} max={96} value={rosterFontSize} onChange={(e) => setRosterFontSize(+e.target.value)} /></label>
                <button type="button" className="sidebar-upload-btn" onClick={generateRoster}>Generate on sheet</button>
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
          <div className="canvas-meta">
            <strong>{sheetWidth} × {sheetHeight} in</strong>
            <span>{utilization}% used · {items.length} piece{items.length === 1 ? "" : "s"}</span>
            <label className="toggle-row inline"><input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} /> Snap</label>
          </div>
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
            <div
              ref={canvas}
              className="sheet"
              style={{ width: `${zoom}%`, aspectRatio: `${sheetWidth}/${sheetHeight}` }}
            >
              <i />
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
                    overlappingIds.has(i.id) ? "overlap" : ""
                  } ${oobIds.has(i.id) ? "oob" : ""}`}
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
              {!items.length && (
                <div className="empty">
                  <b>＋</b>
                  <strong>Your gang sheet starts here</strong>
                  <small>Add artwork from Uploads, Gallery, or Text — then drag to position.</small>
                </div>
              )}
            </div>
            </div>
          </div>
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
        <button type="button" onClick={() => { setSidebarTab("uploads"); setMobileDrawer("sidebar"); }}>Uploads</button>
        <button type="button" onClick={undo} disabled={!history.length}>Undo</button>
        <button type="button" onClick={fitToViewport}>Fit</button>
        <button type="button" onClick={() => { setSidebarTab("layers"); setMobileDrawer("sidebar"); }}>Layers</button>
        <button type="button" onClick={() => setMobileDrawer("properties")} disabled={!selected}>Edit</button>
        <button type="button" className="save" onClick={() => void save()} disabled={saving || !items.length}>
          {saving ? "…" : "Save"}
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

const CSS = `
*{box-sizing:border-box}
.bags{--blue:var(--accent);--line:#dfe3e8;min-height:100vh;background:#eef1f5;color:#111827;font:14px/1.35 Inter,system-ui,sans-serif}
.bags>header{height:68px;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:0;z-index:5}
.brand{display:flex;align-items:center;gap:10px}
.brand.center{justify-content:center;margin-bottom:12px}
.brand>b{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:900 20px Georgia}
.brand strong,.brand small{display:block}.brand strong{letter-spacing:.12em}.brand small{font-size:11px;color:#98a2b3}
.bags nav{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.bags nav button,.bags nav label{border:0;border-radius:7px;padding:10px 14px;background:#242b36;color:#fff;font-weight:700;cursor:pointer}
.bags nav label.btn-upload,.bags nav .btn-upload{background:var(--accent)}
.bags nav .save{background:#21a366}
.bags nav button:disabled{opacity:.45;cursor:not-allowed}
.bags input[type=file]{display:none}
.welcome{min-height:100vh;background:#eef1f5}
.home-shell{display:grid;grid-template-columns:72px 1fr;min-height:100vh}
.home-main{display:grid;place-items:center;padding:24px 16px}
.welcome-card{max-width:860px;width:100%;background:#fff;border-radius:12px;padding:28px 32px;box-shadow:0 8px 30px #34405420}
.welcome-card h1{margin:8px 0 10px;font-size:24px;text-align:center}
.welcome-lead{margin:0 0 20px;text-align:center;color:#667085;font-size:13px;line-height:1.5;max-width:560px;margin-inline:auto}
.welcome-grid{display:grid;gap:12px}
.welcome-grid.two-col{grid-template-columns:repeat(2,minmax(0,1fr))}
.welcome-opt{display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:start;text-align:left;border:1px solid #dfe3e8;border-radius:10px;padding:16px;background:#fff;cursor:pointer;transition:border-color .15s,background .15s}
.welcome-opt:hover:not(.disabled){border-color:var(--accent);background:#fffaf5}
.welcome-opt strong{font-size:15px;grid-column:2}.welcome-opt span{font-size:12px;color:#667085;grid-column:2;line-height:1.45}
.welcome-opt.featured{border-color:var(--accent);background:#fff7ed}
.welcome-opt.primary{border-color:var(--accent);background:#fff7ed}
.welcome-opt.disabled{opacity:.55;cursor:not-allowed}
.bags nav button:focus-visible,.bags nav label:focus-visible,.welcome-opt:focus-visible,.rail-btn:focus-visible,.actions button:focus-visible,.layer-actions button:focus-visible,.zoom button:focus-visible,.resize-handle:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.welcome-sheet-pick{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:420px;margin:0 auto 18px}
.welcome-sheet-pick label{font-size:11px;color:#667085;display:grid;gap:4px}
.welcome-sheet-pick select{padding:8px;border:1px solid #ccd2da;border-radius:6px;background:#fff}
.welcome-tip{margin:16px 0 0;padding:10px 12px;background:#f8fafc;border:1px solid #e4e7ec;border-radius:8px;font-size:12px;color:#475467;line-height:1.45;text-align:center}
.welcome-opt.continue-draft{border-color:#21a366;background:#eef7f2}
a.welcome-opt{text-decoration:none;color:inherit}
.draft-modal{position:fixed;inset:0;background:#0d111780;display:grid;place-items:center;z-index:40;padding:16px}
.draft-modal-card{background:#fff;border-radius:12px;padding:24px;max-width:400px;width:100%;box-shadow:0 16px 40px #0004}
.draft-modal-card h2{margin:0 0 8px;font-size:18px}
.draft-modal-card p{margin:0 0 16px;color:#667085;font-size:13px;line-height:1.45}
.draft-modal-actions{display:flex;flex-wrap:wrap;gap:8px}
.draft-modal-actions button{border:0;border-radius:7px;padding:10px 14px;background:#242b36;color:#fff;font-weight:700;cursor:pointer}
.draft-modal-actions .save{background:#21a366}
.draft-modal-actions .ghost-btn{background:#fff;color:#344054;border:1px solid #ccd2da}
.library-name-field{display:grid;gap:6px;margin:0 0 16px;font-size:12px;font-weight:600;color:#344054}
.library-name-field input{width:100%;padding:10px;border:1px solid #ccd2da;border-radius:7px;font:inherit}
.rotate-toggle{display:flex;align-items:center;gap:8px;font-size:12px;color:#475467;margin:0 0 12px}
.toast.warn{background:#fff7ed;color:#9a3412}
.toast.tip{background:#f8fafc;color:#475467;display:flex;align-items:center;justify-content:space-between;gap:12px}
.tip-dismiss{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;white-space:nowrap}
.layer-actions{padding:0 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:7px}
.layer-actions>span{grid-column:1/-1;font-size:11px;color:#667085;font-weight:600}
.layer-actions button{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:8px 4px;font-size:11px;cursor:pointer}
.nest-stats .overflow-note strong{color:#9a3412;font-size:11px;text-align:right;max-width:70%}
.piece.overlap{box-shadow:0 0 0 2px #f59e0b}
.piece.oob{box-shadow:0 0 0 2px #ef4444}
.piece.overlap.oob{box-shadow:0 0 0 2px #ef4444,0 0 0 4px #f59e0b}
.piece.selected{outline:2px solid var(--accent);outline-offset:2px}
.resize-handle{position:absolute;width:12px;height:12px;border:2px solid #fff;background:var(--accent);border-radius:2px;padding:0;cursor:nwse-resize;z-index:3}
.resize-handle.se{right:-7px;bottom:-7px}
.zoom button:last-child{border-left:1px solid #d4d9df;font-size:11px;font-weight:700;padding:6px 10px}
.icon-rail{background:#0d1117;color:#98a2b3;display:flex;flex-direction:column;align-items:stretch;padding:8px 0;gap:4px;z-index:6}
.icon-rail .rail-btn{position:relative;border:0;background:transparent;color:inherit;padding:10px 6px;cursor:pointer;display:grid;justify-items:center;gap:4px;font-size:10px}
.icon-rail .rail-btn:hover:not(:disabled){color:#fff;background:#1a2230}
.icon-rail .rail-btn.active{color:#fff;background:#243044;box-shadow:inset 3px 0 0 var(--accent)}
.icon-rail .rail-btn.soon{opacity:.45;cursor:not-allowed}
.icon-rail .rail-icon{font-size:18px;line-height:1}
.icon-rail .rail-label{font-size:9px;font-weight:600;letter-spacing:.02em}
.icon-rail .rail-badge{position:absolute;top:6px;right:8px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:var(--accent);color:#fff;font-size:9px;font-weight:700;display:grid;place-items:center}
.sidebar-panel{background:#fff;border-right:1px solid var(--line);width:260px;display:flex;flex-direction:column;overflow:auto}
.sidebar-hint{margin:0 14px 10px;font-size:11px;color:#667085;line-height:1.45}
.sidebar-upload-btn{margin:0 14px 12px;display:block;text-align:center;background:var(--accent);color:#fff;border-radius:8px;padding:10px 12px;font-weight:700;font-size:12px;cursor:pointer}
.refresh-btn{border:1px solid #ccd2da;background:#fff;border-radius:6px;width:32px;height:32px;cursor:pointer;font-size:14px}
.pool-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:0 14px 14px}
.pool-item{border:1px solid #dfe3e8;border-radius:8px;padding:8px;background:#fff;cursor:pointer;text-align:left;display:grid;gap:6px}
.pool-item:hover{border-color:var(--accent);background:#fff7ed}
.pool-item img{width:100%;aspect-ratio:1;object-fit:contain;background:#f3f4f6;border-radius:6px}
.pool-item span{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#344054}
.pool-item .on-sheet{font-size:9px;font-style:normal;color:var(--accent-dark);font-weight:600}
.on-sheet-list{border-top:1px solid var(--line);padding:12px 14px;margin-top:auto}
.on-sheet-list h3{margin:0 0 8px;font-size:12px;color:#475467}
.sidebar-empty{margin:0;font-size:11px;color:#667085}
.sidebar-soon{padding:24px 16px;color:#667085;font-size:13px}
.sidebar-soon strong{display:block;color:#344054;margin-bottom:6px}
.drop.compact{margin:0 14px 12px;min-height:120px}
.toast{margin:0;padding:8px 16px;font-size:12px}
.toast.message{background:#eef7f2;color:#17683e}
.toast.error{background:#fff0ee;color:#b42318}
.assets.compact{padding:0}
.assets.compact>button{margin-bottom:4px}
@media(max-width:900px){.welcome-grid.two-col{grid-template-columns:1fr}.sidebar-panel{width:220px}}
.upload-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.upload-tabs .tab{border:1px solid #ccd2da;background:#fff;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer}
.upload-tabs .tab.active{background:#fff7ed;border-color:var(--accent);color:var(--accent-dark)}
.upload-tabs .tab.disabled{opacity:.5;cursor:not-allowed}
.auto-upload-panel.readonly{opacity:.92}
.auto-upload-panel.readonly .auto-row{cursor:default}
.auto-split{display:grid;grid-template-columns:minmax(340px,1fr) minmax(420px,1.2fr);gap:0;min-height:calc(100vh - 68px)}
.auto-upload-panel{background:#fff;border-right:1px solid #dfe3e8;padding:16px;overflow:auto;max-height:calc(100vh - 68px)}
.auto-preview-panel{background:#eef1f5;padding:16px;display:grid;grid-template-rows:auto 1fr auto;gap:12px;max-height:calc(100vh - 68px);overflow:auto}
.auto-panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:12px}
.auto-panel-head h2{margin:0;font-size:16px}
.auto-panel-head p{margin:0;font-size:12px;color:#667085}
.preview-status{font-size:11px;color:#667085}.preview-status.ok{color:#127a4b;font-weight:600}
.auto-sheet-settings{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.auto-sheet-settings label{font-size:11px;color:#667085;display:grid;gap:4px}
.auto-sheet-settings select,.auto-sheet-settings input{padding:7px;border:1px solid #ccd2da;border-radius:6px}
.auto-list.compact{display:grid;gap:8px}
.auto-row{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:start;background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:10px;cursor:pointer}
.auto-row.active{border-color:var(--accent);background:#fff7ed;box-shadow:0 0 0 1px var(--accent)}
.auto-row img{width:64px;height:64px;object-fit:contain;background:#eee;border-radius:6px}
.auto-fields strong{display:block;font-size:12px;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.preset-row{margin-bottom:8px}
.auto-dims{display:grid;grid-template-columns:1fr;gap:6px}
.lock-aspect{display:flex;align-items:center;gap:8px;font-size:11px;color:#667085;margin:6px 0}
.auto-actions{display:grid;gap:6px;align-content:start}
.auto-actions .dup{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:6px 8px;font-size:10px;cursor:pointer}
.auto-actions .remove{border:0;background:#fee2e2;color:#991b1b;width:32px;height:32px;border-radius:6px;cursor:pointer}
.auto-fields small{font-size:10px;color:#667085}
.nest-preview-wrap{min-height:280px;display:grid;place-items:center;background:#d8dde4;border-radius:10px;padding:20px;border:1px solid #cfd5dc}
.nest-preview-sheet{position:relative;width:100%;max-width:520px;background:#fff;background-image:linear-gradient(#f0f2f4 1px,transparent 1px),linear-gradient(90deg,#f0f2f4 1px,transparent 1px);background-size:16px 16px;box-shadow:0 6px 20px #34405430}
.nest-preview-sheet>i{position:absolute;inset:4px;border:1px dashed #e54d4d;pointer-events:none}
.nest-piece{position:absolute;overflow:hidden;border:1px solid #94a3b8;background:#fff}
.nest-piece.highlight{outline:2px solid var(--accent);z-index:2}
.nest-piece img{width:100%;height:100%;object-fit:fill;display:block;pointer-events:none}
.nest-preview-empty{text-align:center;color:#667085;padding:24px;max-width:280px}
.nest-preview-empty strong{display:block;color:#475467;margin-bottom:6px}
.nest-stats{background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:12px;display:grid;gap:4px}
.nest-stats p{display:flex;justify-content:space-between;margin:0;font-size:12px;color:#667085}
.nest-stats strong{color:#111827}
.nest-stats .total{border-top:1px solid #dfe3e8;padding-top:8px;margin-top:4px;font-size:14px}
.nest-stats .total strong{font-size:18px;color:#127a4b}
.error.block,.message.block{margin:0;padding:10px;border-radius:6px;font-size:12px}
.fine{font-size:11px;color:#667085;margin:0;line-height:1.45}
@media(max-width:960px){.auto-split{grid-template-columns:1fr}.auto-upload-panel{max-height:none;border-right:0;border-bottom:1px solid #dfe3e8}}
.auto-row{display:grid;grid-template-columns:80px 1fr auto;gap:12px;align-items:start;background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:12px}
.auto-row img{width:80px;height:80px;object-fit:contain;background:#eee;border-radius:6px}
.auto-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.auto-fields label{font-size:11px;color:#667085;display:grid;gap:4px}
.auto-fields input{padding:8px;border:1px solid #ccd2da;border-radius:6px}
.auto-row .remove{border:0;background:#fee2e2;color:#991b1b;padding:8px 10px;border-radius:6px;cursor:pointer}
.drop.large{min-height:240px}
.workspace{display:grid;grid-template-columns:72px 260px minmax(420px,1fr) 280px;height:calc(100vh - 68px)}
aside{background:#fff;overflow:auto}
.properties{border-left:1px solid var(--line)}
.heading{height:68px;padding:14px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}
.heading strong,.heading small{display:block}.heading small{font-size:11px;color:#667085;margin-top:3px}
.heading .mini-upload{width:32px;height:32px;display:grid;place-items:center;background:#fff7ed;color:var(--accent);border-radius:6px;font-size:20px;cursor:pointer}
.drop{margin:16px;min-height:170px;border:1.5px dashed #b5bfcc;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;text-align:center;color:#667085;cursor:pointer}
.drop>b{font-size:30px;color:var(--accent)}.drop small{font-size:11px}
.assets{padding:10px}
.assets>button{width:100%;border:1px solid transparent;background:#fff;border-radius:8px;padding:8px;display:grid;grid-template-columns:48px 1fr 22px;gap:9px;align-items:center;text-align:left;margin-bottom:5px;cursor:pointer}
.assets>button.active{border-color:var(--accent);background:#fff7ed}
.assets img{width:48px;height:48px;object-fit:contain;background:#eee}
.assets span{min-width:0}.assets strong,.assets small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}
.assets small{color:#667085;margin-top:4px}
.assets>button>b{width:20px;height:20px;border-radius:50%;background:#e8ebef;display:grid;place-items:center;font-size:10px}
.bags main{min-width:0;overflow:hidden;background:#d8dde4}
.toolbar{height:54px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:15px;padding:0 14px;flex-wrap:wrap}
.toolbar label{font-size:11px;color:#667085;display:flex;gap:6px;align-items:center}
.toolbar select{padding:6px;border:1px solid #cfd5dc;border-radius:5px;background:white}
.toolbar>strong{margin-left:auto}
.zoom{display:flex;border:1px solid #d4d9df;border-radius:6px;background:#fff;overflow:hidden}
.zoom button{border:0;background:#fff;padding:6px 9px;cursor:pointer}
.zoom span{min-width:43px;text-align:center;font-size:11px;padding:7px 0}
.scroll{height:calc(100% - 54px);overflow:auto;padding:46px 55px 80px}
.sheet{position:relative;margin:auto;background-color:#fff;background-image:linear-gradient(#f0f2f4 1px,transparent 1px),linear-gradient(90deg,#f0f2f4 1px,transparent 1px);background-size:20px 20px;box-shadow:0 8px 26px #34405438;min-height:300px;touch-action:none}
.sheet>i{position:absolute;inset:5px;border:1px dashed #e54d4d;pointer-events:none}
.piece{position:absolute;cursor:move;touch-action:none;user-select:none}
.piece img{width:100%;height:100%;object-fit:fill;display:block;pointer-events:none}
.piece em{display:none;position:absolute;left:50%;bottom:-23px;transform:translateX(-50%);background:#111827;color:#fff;padding:3px 6px;border-radius:4px;font-size:9px;white-space:nowrap;font-style:normal}
.piece.selected em{display:block}
.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#98a2b3;gap:7px;text-align:center}
.empty b{font-size:38px}.empty strong{color:#475467}
.preview{padding:16px;border-bottom:1px solid var(--line)}
.preview img{width:100%;height:120px;object-fit:contain;background:#eee;border-radius:7px}
.preview strong,.preview small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.preview strong{margin-top:8px}.preview small{color:#667085;font-size:10px}
.fields{padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fields label{font-size:11px;color:#667085}
.fields input{width:100%;padding:8px;margin-top:5px;border:1px solid #ccd2da;border-radius:6px}
.actions{padding:0 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:7px}
.actions button{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:9px 4px;font-size:11px;cursor:pointer}
.spacing{margin:0 14px 16px;display:grid;grid-template-columns:1fr auto;gap:6px;color:#667085;font-size:11px}
.spacing input{display:block!important;grid-column:1/-1;width:100%}
.none{padding:50px 24px;text-align:center;color:#667085}
.none b{font-size:32px}
.summary{margin:14px;border-top:1px solid var(--line);padding-top:10px}
.summary p{display:flex;justify-content:space-between;margin:0;padding:5px 0;color:#667085;font-size:12px}
.summary strong{color:#111827}
.summary .total{border-top:1px solid var(--line);margin-top:7px;padding-top:12px;font-size:14px}
.summary .total strong{font-size:18px;color:#127a4b}
.message,.error{margin:12px 14px;padding:10px;border-radius:6px;font-size:11px}
.message{background:#eef7f2;color:#17683e}.error{background:#fff0ee;color:#b42318}
.bags>header.editor-header{flex-wrap:wrap;height:auto;min-height:68px;padding:10px 16px;gap:10px}
.top-toolbar{display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap;justify-content:center}
.top-toolbar label{font-size:11px;color:#98a2b3;display:flex;gap:6px;align-items:center}
.top-toolbar select{padding:6px 8px;border:1px solid #3a4556;border-radius:6px;background:#1a2230;color:#fff}
.top-toolbar>button{border:0;border-radius:6px;padding:8px 10px;background:#242b36;color:#fff;font-size:12px;font-weight:600;cursor:pointer}
.top-toolbar>button:disabled{opacity:.45;cursor:not-allowed}
.price-chip{background:#fff7ed;color:#c2410c;padding:6px 12px;border-radius:999px;font-weight:700;font-size:13px}
.template-picker,.saved-designs-list{margin:16px 0;padding:12px;border:1px solid #e4e7ec;border-radius:8px;background:#f8fafc}
.template-picker{display:grid;gap:8px}
.template-card{text-align:left;border:1px solid #dfe3e8;border-radius:8px;padding:12px;background:#fff;cursor:pointer}
.template-card:hover{border-color:var(--accent)}
.template-card strong{display:block;font-size:13px}
.template-card span{font-size:11px;color:#667085}
.saved-designs-list h3{margin:0 0 8px;font-size:13px}
.saved-design-row-wrap{display:grid;gap:4px;margin-bottom:8px}
.saved-design-row{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;width:100%;text-align:left;border:1px solid #dfe3e8;border-radius:8px;padding:10px;background:#fff;cursor:pointer}
.saved-design-thumb{width:44px;height:44px;border-radius:6px;overflow:hidden;border:1px solid #dfe3e8;display:grid;place-items:center}
.saved-design-thumb img{width:100%;height:100%;object-fit:contain}
.saved-design-copy strong{display:block;font-size:12px}
.saved-design-copy small{font-size:10px;color:#667085}
.saved-design-actions{display:flex;flex-wrap:wrap;gap:6px}
.saved-design-action{border:1px solid #dfe3e8;background:#fff;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer}
.saved-design-rename{display:flex;gap:6px;align-items:center}
.saved-design-rename input{flex:1;padding:6px 8px;border:1px solid #dfe3e8;border-radius:6px}
.library-archived-toggle{display:flex;align-items:center;gap:6px;font-size:11px;color:#667085;white-space:nowrap}
.sidebar-tools{padding:0 14px 10px;display:grid;grid-template-columns:1fr auto;gap:8px}
.sidebar-tools input,.sidebar-form input,.sidebar-form select,.sidebar-form textarea{width:100%;padding:8px;border:1px solid #ccd2da;border-radius:6px;font:inherit}
.sidebar-form{padding:0 14px 14px;display:grid;gap:10px}
.sidebar-form label{font-size:11px;color:#667085;display:grid;gap:4px}
.chip-row{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}
.chip{border:1px solid #ccd2da;background:#fff;border-radius:999px;padding:5px 10px;font-size:10px;cursor:pointer}
.chip.active{background:#fff7ed;border-color:var(--accent);color:#9a3412;font-weight:700}
.pool-item-wrap{display:grid;gap:4px}
.pool-item-actions{display:flex;gap:4px;padding:0 2px}
.pool-item-actions input{flex:1;font-size:10px;padding:4px 6px;border:1px solid #ccd2da;border-radius:4px}
.pool-item-actions button{width:28px;border:1px solid #ccd2da;background:#fff;border-radius:4px;cursor:pointer}
.checkerboard{background-color:#fff;background-image:linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%);background-size:12px 12px;background-position:0 0,0 6px,6px -6px,-6px 0}
.dpi-warn{color:#b45309;font-size:9px;font-style:normal}
.layer-list{padding:8px 14px;display:grid;gap:6px}
.layer-row{display:grid;grid-template-columns:36px 1fr;gap:8px;align-items:center;border:1px solid #dfe3e8;border-radius:8px;padding:8px;background:#fff;text-align:left;cursor:pointer}
.layer-row.active{border-color:var(--accent);background:#fff7ed}
.layer-row img,.layer-text-thumb{width:36px;height:36px;border-radius:6px;object-fit:contain;background:#f3f4f6;display:grid;place-items:center;font-weight:800}
.layer-row strong,.layer-row small{display:block;font-size:11px}
.layer-row small{color:#667085}
.help-list{list-style:none;margin:0;padding:8px 14px;display:grid;gap:8px}
.help-list li{display:grid;grid-template-columns:110px 1fr;gap:8px;font-size:11px;color:#475467}
.help-list kbd{background:#f3f4f6;border:1px solid #dfe3e8;border-radius:4px;padding:3px 6px;font-size:10px}
.toggle-row{display:flex;align-items:center;gap:8px;font-size:11px;color:#475467;padding:0 14px 10px;margin:0}
.toggle-row.inline{padding:0}
.canvas-main{display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#d8dde4}
.canvas-meta{height:40px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:14px;padding:0 14px;font-size:12px;color:#667085}
.canvas-meta strong{color:#111827}
.scroll{height:calc(100% - 40px);overflow:auto;padding:28px 28px 80px 36px;position:relative}
.scroll.pan-mode{cursor:grab}
.scroll.pan-mode:active{cursor:grabbing}
.ruler-corner{position:sticky;top:0;left:0;width:24px;height:24px;background:#eef1f5;border-right:1px solid #ccd2da;border-bottom:1px solid #ccd2da;z-index:2;float:left}
.ruler-h{position:sticky;top:0;height:24px;margin-left:24px;background:#eef1f5;border-bottom:1px solid #ccd2da;z-index:2}
.ruler-v{position:absolute;left:0;top:24px;width:24px;bottom:0;background:#eef1f5;border-right:1px solid #ccd2da;z-index:2}
.ruler-h span,.ruler-v span{position:absolute;font-size:9px;color:#667085;transform:translate(-50%,-50%)}
.ruler-v span{left:50%}
.canvas-stage{margin-left:24px;padding-top:4px}
.snap-guide{position:absolute;background:#38bdf8;pointer-events:none;z-index:4}
.snap-guide.x{width:1px;top:0;bottom:0}
.snap-guide.y{height:1px;left:0;right:0}
.text-piece{display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-align:center;line-height:1.1;pointer-events:none;word-break:break-word;padding:4px}
.text-preview{display:grid;place-items:center;min-height:80px;font-size:24px;font-weight:700;background:#f3f4f6;border-radius:7px;padding:12px}
.fields.grid-2{grid-template-columns:1fr 1fr}
.align-row{padding:0 14px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.align-row>span{width:100%;font-size:11px;color:#667085;font-weight:600}
.align-row button{border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:6px 8px;font-size:11px;cursor:pointer}
.ghost-save-btn{margin:0 14px 12px;width:calc(100% - 28px);border:1px solid #ccd2da;background:#fff;border-radius:6px;padding:10px;font-weight:600;cursor:pointer}
.mobile-bar{display:none;position:fixed;left:0;right:0;bottom:0;height:56px;background:#0d1117;border-top:1px solid #243044;padding:6px 8px;gap:6px;z-index:8;justify-content:space-around}
.mobile-bar button{flex:1;border:0;border-radius:8px;background:#242b36;color:#fff;font-size:11px;font-weight:700;padding:8px 4px;cursor:pointer}
.mobile-bar button.save{background:#21a366}
.mobile-bar button:disabled{opacity:.45}
.mobile-drawer-close{display:none}
.workspace{height:calc(100vh - 88px)}
@media(max-width:900px){
  .workspace{grid-template-columns:56px minmax(0,1fr);height:calc(100vh - 120px)}
  .sidebar-panel,.properties{display:none;position:fixed;top:88px;bottom:56px;width:min(320px,84vw);z-index:7;box-shadow:8px 0 24px #34405435;flex-direction:column;overflow:auto}
  .sidebar-panel{left:56px}
  .properties{right:0;box-shadow:-8px 0 24px #34405435}
  .sidebar-panel.mobile-open,.properties.mobile-open{display:flex}
  .mobile-drawer-close{display:grid;position:absolute;right:8px;top:8px;z-index:3;width:32px;height:32px;place-items:center;border:1px solid #ccd2da;border-radius:999px;background:#fff;color:#344054;font-size:20px;cursor:pointer}
  .top-toolbar{display:none}
  .mobile-bar{display:flex}
  .canvas-meta{font-size:11px;flex-wrap:wrap;height:auto;min-height:40px;padding:6px 10px}
}
`;
