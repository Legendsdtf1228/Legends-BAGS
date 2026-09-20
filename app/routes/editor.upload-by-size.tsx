import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ChangeEvent } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
import { loadEditorPageConfig } from "../lib/editor-config.server";
import { buildEditorAuthHeaders } from "../lib/editor-auth.server";
import { mergeEditorLaunchFromUrl } from "../lib/editor-launch.server";
import { getShopAppearance, DEFAULT_APPEARANCE, type ShopAppearance } from "../lib/shop-appearance.server";
import type { SizeInput } from "../domain/pricing";
import { SIZE_PRESETS } from "../domain/design/types";
import {
  applyLongestSidePreset,
  BAGS_BASE_CSS,
} from "../components/editor/bags-ui";
import {
  CopiesThumbStrip,
  RequestedVsPlacedBanner,
  WorkflowAlert,
  WorkflowDimQtyFields,
  WorkflowProgress,
} from "../components/editor/workflow/workflow-controls";
import { PRODUCTION_WORKFLOW_CSS } from "../components/editor/workflow/workflow-styles";
import {
  productionAlert,
  summarizeRequestedVsPlaced,
} from "../components/editor/workflow/workflow-helpers";
import { EditorRailIcon } from "../components/editor/editor-rail-icons";
import {
  BACKGROUND_REMOVAL_MODAL_CSS,
  BackgroundRemovalModal,
  type ProcessedAsset,
} from "../components/editor/background-removal-modal";

const CHIP_PRESETS = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16] as const;

type UploadedAsset = {
  assetId: string;
  widthPx: number;
  heightPx: number;
  dpi?: number | null;
  contentType: string;
};

type QueueLine = {
  id: string;
  asset: UploadedAsset;
  previewUrl: string;
  name: string;
  mode: "preset" | "custom";
  presetId: string;
  widthIn: number;
  heightIn: number;
  lockAspect: boolean;
  quantity: number;
};

type QuoteLine = {
  assetId: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
  areaSqIn: number;
  effectiveDpi: number;
  lowDpi: boolean;
};

type RemovedSnapshot = {
  line: QueueLine;
  index: number;
};

type BgRemoveTarget = {
  lineId: string;
  sourceAssetId: string;
  sourcePreviewUrl: string;
};

type RemoteDesignPayload = {
  designId: string;
  version: number;
  name: string | null;
  state: {
    items: Array<{
      assetId: string;
      widthIn: number;
      heightIn: number;
      quantity: number;
      name?: string;
    }>;
    pricing: { totalCents: number };
  };
  assets?: Record<
    string,
    { widthPx: number; heightPx: number; dpi?: number | null; contentType: string }
  >;
  cartProperties?: Record<string, string>;
};

type LibraryDesign = {
  id: string;
  name: string | null;
  version: number;
  sheetLabel: string;
  priceCents: number;
  updatedAt: string;
};

function assetPreviewUrl(assetId: string) {
  return `/api/assets/${encodeURIComponent(assetId)}`;
}

function inferPresetId(
  widthIn: number,
  heightIn: number,
  presets: Array<{ id: string; longestSideIn: number }>,
) {
  const longest = Math.max(widthIn, heightIn);
  const match = presets.find((p) => Math.abs(p.longestSideIn - longest) < 0.06);
  return match?.id ?? "4in";
}

function appearanceVars(appearance: ShopAppearance): CSSProperties {
  return {
    ["--accent" as string]: appearance.accentColor,
    ["--accent-dark" as string]: appearance.accentColorDark,
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const launch = mergeEditorLaunchFromUrl(request, process.env.DEV_SHOP || "");
  const { headers, hasApiAuth } = buildEditorAuthHeaders(request, launch.shop);

  const editorConfig = launch.shop
    ? await loadEditorPageConfig(launch.shop, launch.productGid || undefined, launch.variantId || undefined)
    : null;

  return data(
    {
      productGid: launch.productGid,
      variantId: launch.variantId,
      shop: launch.shop,
      designId: launch.designId,
      designVersion: launch.designVersion,
      parentOrigin: launch.parentOrigin,
      quantity: launch.quantity,
      shopMode: launch.shopMode,
      pricePerSqIn: editorConfig?.pricePerSqIn ?? 0.049,
      appearance: editorConfig?.appearance ?? DEFAULT_APPEARANCE,
      presets: Object.entries(SIZE_PRESETS).map(([id, p]) => ({
        id,
        label: p.label,
        longestSideIn: p.longestSideIn,
      })),
      hasDevAuth: hasApiAuth,
    },
    { headers },
  );
}

export default function UploadBySizeEditor() {
  const page = useLoaderData<typeof loader>();
  const [queue, setQueue] = useState<QueueLine[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([]);
  const [quoting, setQuoting] = useState(false);
  const [lastTally, setLastTally] = useState<{ requested: number; placed: number } | null>(null);
  const [totalCents, setTotalCents] = useState<number | null>(null);
  const [totalArea, setTotalArea] = useState<number | null>(null);
  const [pricePerSqIn, setPricePerSqIn] = useState(page.pricePerSqIn);
  const [lastRemoved, setLastRemoved] = useState<RemovedSnapshot | null>(null);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(page.designId || null);
  const [editingVersion, setEditingVersion] = useState<number | null>(
    page.designVersion ? Number(page.designVersion) : null,
  );
  const [dirty, setDirty] = useState(false);
  const [loadingDesign, setLoadingDesign] = useState(Boolean(page.designId));
  const [bgRemove, setBgRemove] = useState<BgRemoveTarget | null>(null);
  const [savedDesigns, setSavedDesigns] = useState<LibraryDesign[]>([]);
  const [libraryName, setLibraryName] = useState("");
  const [librarySaving, setLibrarySaving] = useState(false);
  const [designName, setDesignName] = useState<string | null>(null);

  const active = queue.find((l) => l.id === activeId) ?? queue[0] ?? null;
  const busy = uploading || saving;
  const emptyQueue = queue.length === 0;
  const hasLowDpi = quoteLines.some((l) => l.lowDpi);

  const headers = useCallback(
    (extra?: Record<string, string>) =>
      Object.assign({ "X-LGS-Shop": page.shop }, extra ?? {}),
    [page.shop],
  );

  function aspectFor(line: QueueLine) {
    return line.asset.widthPx / line.asset.heightPx;
  }

  function sizePayload(line: QueueLine): SizeInput {
    if (line.mode === "preset") {
      return { mode: "preset", presetId: line.presetId, quantity: line.quantity };
    }
    return {
      mode: "custom",
      widthIn: line.widthIn,
      heightIn: line.heightIn,
      lockAspect: line.lockAspect,
      quantity: line.quantity,
      sourceWidthPx: line.asset.widthPx,
      sourceHeightPx: line.asset.heightPx,
    };
  }

  function resolvedDims(line: QueueLine) {
    const aspect = aspectFor(line);
    if (line.mode === "preset") {
      const longest =
        page.presets.find((p) => p.id === line.presetId)?.longestSideIn ?? 4;
      if (aspect >= 1) {
        return { widthIn: longest, heightIn: longest / aspect };
      }
      return { widthIn: longest * aspect, heightIn: longest };
    }
    const w = line.widthIn;
    const h = line.lockAspect ? w / aspect : line.heightIn;
    return { widthIn: w, heightIn: h };
  }

  function lineCents(quote: QuoteLine | undefined) {
    if (!quote) return null;
    return Math.round(quote.areaSqIn * pricePerSqIn * 100);
  }

  function formatMoney(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  async function upscaleActive() {
    if (!active) return;
    setUploading(true);
    setError("");
    try {
      const dims = resolvedDims(active);
      const res = await fetch(`/api/assets/${encodeURIComponent(active.asset.assetId)}/upscale`, {
        method: "POST",
        credentials: "include",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ widthIn: dims.widthIn, heightIn: dims.heightIn }),
      });
      const json = (await res.json()) as UploadedAsset & { error?: string };
      if (!res.ok) throw new Error(json.error || "Upscale failed");
      const previewUrl = assetPreviewUrl(json.assetId);
      setQueue((lines) =>
        lines.map((line) =>
          line.id === active.id
            ? {
                ...line,
                asset: {
                  assetId: json.assetId,
                  widthPx: json.widthPx,
                  heightPx: json.heightPx,
                  dpi: json.dpi,
                  contentType: json.contentType,
                },
                previewUrl,
              }
            : line,
        ),
      );
      setDirty(true);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upscale failed");
    } finally {
      setUploading(false);
    }
  }

  function openBgRemoveModal() {
    if (!active) return;
    setBgRemove({
      lineId: active.id,
      sourceAssetId: active.asset.assetId,
      sourcePreviewUrl: active.previewUrl,
    });
  }

  function applyBgRemoveResult(asset: ProcessedAsset, previewUrl: string) {
    if (!bgRemove) return;
    setQueue((lines) =>
      lines.map((line) =>
        line.id === bgRemove.lineId
          ? {
              ...line,
              asset: {
                assetId: asset.assetId,
                widthPx: asset.widthPx,
                heightPx: asset.heightPx,
                dpi: asset.dpi,
                contentType: asset.contentType,
              },
              previewUrl,
            }
          : line,
      ),
    );
    setDirty(true);
    setSaved(false);
    setBgRemove(null);
  }

  const refreshQuote = useCallback(
    async (lines: QueueLine[]) => {
      if (!lines.length) {
        setQuoteLines([]);
        setTotalCents(null);
        setTotalArea(null);
        setQuoting(false);
        return;
      }
      setQuoting(true);
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: headers({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({
            uploads: lines.map((line) => ({
              assetId: line.asset.assetId,
              size: sizePayload(line),
            })),
          }),
        });
        const json = (await res.json()) as {
          pricing?: { totalCents: number; areaSqIn: number; pricePerSqIn?: number };
          lines?: QuoteLine[];
          error?: string;
        };
        if (!res.ok) throw new Error(json.error || "Quote failed");
        setQuoteLines(json.lines ?? []);
        setTotalCents(json.pricing?.totalCents ?? null);
        setTotalArea(json.pricing?.areaSqIn ?? null);
        if (json.pricing?.pricePerSqIn != null) {
          setPricePerSqIn(json.pricing.pricePerSqIn);
        }
      } catch {
        const area = lines.reduce((sum, line) => {
          const d = resolvedDims(line);
          return sum + d.widthIn * d.heightIn * line.quantity;
        }, 0);
        setTotalArea(area);
        setTotalCents(Math.round(area * page.pricePerSqIn * 100));
        setQuoteLines([]);
      } finally {
        setQuoting(false);
      }
    },
    [headers, page.presets, page.pricePerSqIn],
  );

  useEffect(() => {
    const t = setTimeout(() => void refreshQuote(queue), 200);
    return () => clearTimeout(t);
  }, [queue, refreshQuote]);

  useEffect(() => {
    if (!page.designId) return;
    void loadRemoteDesign(
      page.designId,
      page.designVersion ? Number(page.designVersion) : undefined,
    );
  }, [page.designId, page.designVersion]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty && !saved) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, saved]);

  useEffect(() => {
    void refreshLibrary();
  }, [page.shop]);

  async function refreshLibrary() {
    try {
      const res = await fetch("/api/design-library?sort=recent", {
        credentials: "include",
        headers: headers(),
      });
      const json = (await res.json()) as { designs?: LibraryDesign[] };
      if (res.ok && json.designs) setSavedDesigns(json.designs);
    } catch {
      /* offline */
    }
  }

  async function saveToLibrary() {
    if (!editingDesignId || !libraryName.trim() || librarySaving) return;
    setLibrarySaving(true);
    setError("");
    try {
      const res = await fetch("/api/design-library", {
        method: "POST",
        credentials: "include",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          intent: "save",
          designId: editingDesignId,
          name: libraryName.trim(),
        }),
      });
      const json = (await res.json()) as { error?: string; name?: string };
      if (!res.ok) throw new Error(json.error || "Could not save to library");
      setDesignName(json.name ?? libraryName.trim());
      setLibraryName("");
      await refreshLibrary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save to library");
    } finally {
      setLibrarySaving(false);
    }
  }

  async function loadRemoteDesign(designId: string, version?: number) {
    setLoadingDesign(true);
    setError("");
    try {
      const url = version
        ? `/api/designs/${encodeURIComponent(designId)}?version=${version}`
        : `/api/designs/${encodeURIComponent(designId)}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: headers(),
      });
      const json = (await res.json()) as RemoteDesignPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not load design");

      const restored: QueueLine[] = json.state.items.map((item, idx) => {
        const meta = json.assets?.[item.assetId];
        const presetId = inferPresetId(item.widthIn, item.heightIn, page.presets);
        return {
          id: crypto.randomUUID(),
          asset: {
            assetId: item.assetId,
            widthPx: meta?.widthPx ?? 400,
            heightPx: meta?.heightPx ?? 400,
            dpi: meta?.dpi,
            contentType: meta?.contentType ?? "image/png",
          },
          previewUrl: assetPreviewUrl(item.assetId),
          name: item.name || `Artwork ${idx + 1}`,
          mode: "custom" as const,
          presetId,
          widthIn: item.widthIn,
          heightIn: item.heightIn,
          lockAspect: true,
          quantity: item.quantity ?? 1,
        };
      });

      setQueue(restored);
      setActiveId(restored[0]?.id ?? null);
      setEditingDesignId(json.designId);
      setEditingVersion(json.version);
      setDesignName(json.name);
      setSaved(true);
      setDirty(false);
      setTotalCents(json.state.pricing.totalCents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load design");
    } finally {
      setLoadingDesign(false);
    }
  }

  function markDirty() {
    setSaved(false);
    setDirty(true);
  }

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length || busy) return;
    setUploading(true);
    setError("");
    markDirty();
    try {
      const added: QueueLine[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads", {
          method: "POST",
          headers: headers(),
          body: fd,
          credentials: "include",
        });
        const json = (await res.json()) as UploadedAsset & { error?: string };
        if (!res.ok) throw new Error(json.error || `Could not upload ${file.name}`);
        const aspect = json.widthPx / json.heightPx;
        const longest = 4;
        const widthIn = aspect >= 1 ? longest : longest * aspect;
        const heightIn = aspect >= 1 ? longest / aspect : longest;
        added.push({
          id: crypto.randomUUID(),
          asset: json,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          mode: "preset",
          presetId: "4in",
          widthIn,
          heightIn,
          lockAspect: true,
          quantity: Math.max(1, page.quantity ?? 1),
        });
      }
      setQueue((q) => [...q, ...added]);
      setActiveId(added.at(-1)?.id ?? null);
      setLastRemoved(null);
      markDirty();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function patchActive(patch: Partial<QueueLine>) {
    if (!active) return;
    markDirty();
    setQueue((lines) =>
      lines.map((line) => (line.id === active.id ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(id: string) {
    const index = queue.findIndex((l) => l.id === id);
    if (index < 0) return;
    setLastRemoved({ line: queue[index], index });
    markDirty();
    setQueue((lines) => lines.filter((l) => l.id !== id));
    if (activeId === id) {
      const next = queue.filter((l) => l.id !== id);
      setActiveId(next[Math.min(index, next.length - 1)]?.id ?? null);
    }
  }

  function undoRemove() {
    if (!lastRemoved) return;
    const { line, index } = lastRemoved;
    setQueue((lines) => {
      const next = [...lines];
      next.splice(Math.min(index, next.length), 0, line);
      return next;
    });
    setActiveId(line.id);
    setLastRemoved(null);
    markDirty();
    setError("");
  }

  function duplicateLine(id: string) {
    const index = queue.findIndex((l) => l.id === id);
    if (index < 0) return;
    const source = queue[index];
    const copy: QueueLine = {
      ...source,
      id: crypto.randomUUID(),
    };
    setQueue((lines) => {
      const next = [...lines];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setActiveId(copy.id);
    markDirty();
    setError("");
  }

  async function save() {
    if (busy) return;
    if (!queue.length) {
      setError("Add at least one image before saving — your design queue is empty.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        uploads: queue.map((line) => ({
          assetId: line.asset.assetId,
          size: sizePayload(line),
        })),
        productGid: page.productGid,
        variantGid: page.variantId
          ? `gid://shopify/ProductVariant/${page.variantId}`
          : undefined,
      };

      const res = await fetch(
        editingDesignId
          ? `/api/designs/${encodeURIComponent(editingDesignId)}`
          : "/api/designs",
        {
          method: editingDesignId ? "PUT" : "POST",
          headers: headers({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json()) as {
        designId?: string;
        version?: number;
        cartProperties?: Record<string, string>;
        state?: { pricing: { totalCents: number } };
        error?: string;
      };
      if (!res.ok || !json.designId) {
        throw new Error(json.error || "Could not save design");
      }
      setSaved(true);
      setDirty(false);
      setEditingDesignId(json.designId);
      setEditingVersion(json.version ?? editingVersion);
      setTotalCents(json.state?.pricing.totalCents ?? totalCents);
      const requestedCopies = queue.reduce((sum, line) => sum + line.quantity, 0);
      setLastTally({ requested: requestedCopies, placed: requestedCopies });
      if (window.parent && window.parent !== window) {
        const target = page.parentOrigin || "*";
        window.parent.postMessage(
          {
            type: "lgs:design-ready",
            designId: json.designId,
            version: json.version,
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

  const activeQuote = useMemo(() => {
    if (!active) return undefined;
    const idx = queue.findIndex((l) => l.id === active.id);
    return idx >= 0 ? quoteLines[idx] : undefined;
  }, [quoteLines, active, queue]);

  const activeDims = active ? resolvedDims(active) : null;
  const activeCents = lineCents(activeQuote);
  const showWelcome = emptyQueue && !loadingDesign;
  const gangHref = `/editor/gang-sheet?shop=${encodeURIComponent(page.shop)}`;
  const requestedCopies = queue.reduce((sum, line) => sum + Math.max(0, line.quantity), 0);
  const quotedCopies = quoteLines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);
  const placedCopies =
    quoting || requestedCopies === 0
      ? requestedCopies
      : saved && lastTally && !dirty
        ? lastTally.placed
        : quotedCopies || requestedCopies;
  const ubsTally = summarizeRequestedVsPlaced(requestedCopies, placedCopies, "copies");
  const ubsAlert = error ? productionAlert(error, "images-by-size") : null;
  const ubsProgress = uploading
    ? { status: "working" as const, step: "Uploading artwork", detail: "Reading files and creating previews." }
    : saving
      ? { status: "working" as const, step: "Saving this order", detail: "Writing sizes and quantities." }
      : quoting
        ? { status: "working" as const, step: "Updating sizes and quantities", detail: "Checking print area for this order." }
        : error
          ? { status: "error" as const, step: "Stopped", detail: "See the error — fix size or quantity, then Add to cart." }
          : emptyQueue
            ? { status: "idle" as const, step: "Waiting for artwork", detail: "Upload a PNG or JPEG, then set width × height and quantity." }
            : {
                status: "ready" as const,
                step: saved && !dirty ? "Order saved" : "Ready to add to cart",
                detail: `${placedCopies} of ${requestedCopies} copies in this order.`,
              };

  if (showWelcome) {
    return (
      <div className="ubs welcome lgs-editor" style={appearanceVars(page.appearance)}>
        <style>{BAGS_BASE_CSS}{CSS}</style>
        {!page.hasDevAuth ? (
          <p className="banner err" role="alert">
            Dev auth missing — set DEV_SHOP and TEST_API_TOKEN in <code>.env</code>, then restart{" "}
            <code>shopify app dev</code>.
          </p>
        ) : null}
        <div className="home-shell">
          <nav className="icon-rail" aria-label="Builder navigation">
            <button type="button" className="rail-btn active" title="Home" aria-label="Home">
              <EditorRailIcon name="home" label="Home" />
              <span className="rail-label">Home</span>
            </button>
            <label className={`rail-btn${busy ? " soon" : ""}`} title="Upload" aria-label="Upload">
              <EditorRailIcon name="upload" label="Upload" />
              <span className="rail-label">Upload</span>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg"
                hidden
                disabled={busy}
                onChange={onFiles}
              />
            </label>
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

              <div className="welcome-grid two-col">
                <label className={`welcome-opt primary featured${busy ? " disabled" : ""}`}>
                  <div className="welcome-icon"><EditorRailIcon name="upload" label="Upload by Size" /></div>
                  <strong>Upload by Size</strong>
                  <span>
                    Choose PNG or JPEG files — size each design with presets or custom dimensions,
                    then add everything to cart in one order.
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    hidden
                    disabled={busy}
                    onChange={onFiles}
                  />
                </label>
                <a className="welcome-opt" href={gangHref}>
                  <div className="welcome-icon"><EditorRailIcon name="sheet" label="Gang Sheet" /></div>
                  <strong>Build a Gang Sheet</strong>
                  <span>Nest multiple designs on a shared sheet with drag-and-drop placement.</span>
                </a>
                {savedDesigns.length ? (
                  <button
                    type="button"
                    className="welcome-opt"
                    onClick={() => void loadRemoteDesign(savedDesigns[0].id, savedDesigns[0].version)}
                  >
                    <div className="welcome-icon"><EditorRailIcon name="saved" label="Saved" /></div>
                    <strong>Open saved design</strong>
                    <span>
                      {savedDesigns.length} saved design{savedDesigns.length === 1 ? "" : "s"} in your
                      library.
                    </span>
                  </button>
                ) : (
                  <button type="button" className="welcome-opt disabled">
                    <div className="welcome-icon"><EditorRailIcon name="saved" label="Saved" /></div>
                    <strong>Open saved design</strong>
                    <span>Save a design from the editor to build your library.</span>
                  </button>
                )}
              </div>

              <p className="welcome-tip">
                Transparent PNG is recommended for DTF print. After upload you can set size, quantity,
                upscale, and remove backgrounds before checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ubs lgs-editor prod-wf" style={appearanceVars(page.appearance)}>
      <style>{BAGS_BASE_CSS}{PRODUCTION_WORKFLOW_CSS}{CSS}</style>
      <header className="prod-wf-bar">
        <div className="prod-wf-brand">
          <span className="prod-wf-mark" aria-hidden>
            L
          </span>
          <span>
            <strong>IMAGES BY SIZE</strong>
            <small>Size, quantity, preview — then Add to cart</small>
          </span>
        </div>
        <nav className="prod-wf-nav">
          {lastRemoved ? (
            <button type="button" className="prod-wf-btn prod-wf-btn-quiet" onClick={undoRemove} disabled={busy}>
              Undo remove
            </button>
          ) : null}
          <label className={`prod-wf-btn prod-wf-btn-upload${busy ? " disabled" : ""}`}>
            {uploading ? "Uploading…" : "Upload images"}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg"
              hidden
              disabled={busy}
              onChange={onFiles}
            />
          </label>
          <button
            type="button"
            className="prod-wf-btn prod-wf-btn-primary"
            disabled={busy || emptyQueue}
            onClick={save}
          >
            {saving ? "Saving…" : saved ? "Saved" : "Add to cart"}
          </button>
        </nav>
      </header>

      {!page.hasDevAuth ? (
        <p className="banner err" role="alert">
          Dev auth missing — set DEV_SHOP and TEST_API_TOKEN in <code>.env</code>, then restart{" "}
          <code>shopify app dev</code>.
        </p>
      ) : null}

      {loadingDesign ? (
        <p className="banner info" role="status">
          Loading your design…
        </p>
      ) : null}

      {editingDesignId ? (
        <p className="banner info" role="status">
          Editing design · v{editingVersion ?? "—"}
          {dirty ? " · unsaved changes" : saved ? " · saved" : ""}
        </p>
      ) : null}

      {emptyQueue ? (
        <p className="banner info" role="status">
          Upload at least one PNG or JPEG to build your order. Transparent PNG is recommended for
          print.
        </p>
      ) : null}

      {hasLowDpi ? (
        <p className="banner warn" role="status">
          Low DPI detected on one or more items — print quality may suffer. Use a smaller size or a
          higher-resolution file before saving.
        </p>
      ) : null}

      <div className="layout">
        <aside className="queue">
          <h2>Your designs</h2>
          <p className="panel-sub">Upload multiple images — size each one before checkout.</p>
          {!queue.length ? (
            <label className={`drop${busy ? " disabled" : ""}`}>
              <strong>Upload to get started</strong>
              <small>PNG or JPEG · transparent PNG recommended</small>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg"
                hidden
                disabled={busy}
                onChange={onFiles}
              />
            </label>
          ) : (
            <ul>
              {queue.map((line, idx) => {
                const d = resolvedDims(line);
                const q = quoteLines[idx];
                const cents = lineCents(q);
                return (
                  <li key={line.id}>
                    <button
                      type="button"
                      className={line.id === active?.id ? "active" : ""}
                      onClick={() => setActiveId(line.id)}
                    >
                      <span className="thumb checkerboard">
                        <img src={line.previewUrl} alt="" />
                      </span>
                      <span>
                        <strong>{line.name}</strong>
                        <small>
                          {d.widthIn.toFixed(2)}×{d.heightIn.toFixed(2)} in · qty {line.quantity}
                          {cents != null ? ` · ${formatMoney(cents)}` : ""}
                          {q?.lowDpi ? " · low DPI" : ""}
                        </small>
                      </span>
                    </button>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="dup"
                        aria-label={`Duplicate ${line.name}`}
                        title="Duplicate"
                        disabled={busy}
                        onClick={() => duplicateLine(line.id)}
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        className="remove"
                        aria-label={`Remove ${line.name}`}
                        title="Remove"
                        disabled={busy}
                        onClick={() => removeLine(line.id)}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {queue.length ? (
            <label className={`btn ghost block${busy ? " disabled" : ""}`}>
              ＋ Add more
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg"
                hidden
                disabled={busy}
                onChange={onFiles}
              />
            </label>
          ) : null}
        </aside>

        <main>
          <WorkflowProgress status={ubsProgress.status} step={ubsProgress.step} detail={ubsProgress.detail} />
          {active ? (
            <>
              <div className="preview checkerboard prod-wf-art-preview">
                <img src={active.previewUrl} alt={active.name} />
              </div>
              <CopiesThumbStrip previewUrl={active.previewUrl} quantity={active.quantity} />
              <div className="meta">
                <strong>{active.name}</strong>
                <span>
                  {activeDims
                    ? `${activeDims.widthIn.toFixed(2)} × ${activeDims.heightIn.toFixed(2)} in`
                    : null}
                  {` · ${active.asset.widthPx}×${active.asset.heightPx}px`}
                  {active.asset.dpi ? ` · ${active.asset.dpi} DPI tagged` : " · DPI not tagged"}
                  {activeQuote ? ` · ~${activeQuote.effectiveDpi} DPI effective` : ""}
                  {activeCents != null ? ` · ${formatMoney(activeCents)}` : ""}
                </span>
                {activeQuote?.lowDpi || (activeQuote && activeQuote.effectiveDpi < 200) ? (
                  <span className="warn">
                    Low resolution for print — upload a higher-resolution file, use a smaller size, or
                    upscale below.
                  </span>
                ) : null}
              </div>

              <div className="tool-row">
                <button
                  type="button"
                  className="tool-toggle on"
                  disabled={busy || !active}
                  onClick={() => void upscaleActive()}
                >
                  Upscale to ~300 DPI
                </button>
                <button
                  type="button"
                  className="tool-toggle on"
                  disabled={busy || !active}
                  onClick={openBgRemoveModal}
                >
                  Remove background
                </button>
              </div>

              <div className="fields">
                <label className="full prod-wf-field">
                  Sizing mode
                  <select
                    value={active.mode}
                    disabled={busy}
                    onChange={(e) =>
                      patchActive({ mode: e.target.value as "preset" | "custom" })
                    }
                  >
                    <option value="preset">Preset (longest side)</option>
                    <option value="custom">Custom dimensions</option>
                  </select>
                </label>

                {active.mode === "preset" ? (
                  <div className="full">
                    <label className="prod-wf-field">
                      Preset
                      <select
                        value={active.presetId}
                        disabled={busy}
                        onChange={(e) => patchActive({ presetId: e.target.value })}
                      >
                        {page.presets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <WorkflowDimQtyFields
                      widthIn={activeDims?.widthIn ?? active.widthIn}
                      heightIn={activeDims?.heightIn ?? active.heightIn}
                      quantity={active.quantity}
                      lockAspect
                      disabled={busy}
                      onWidth={(w) => {
                        const aspect = aspectFor(active);
                        const dims = { widthIn: w, heightIn: w / aspect };
                        patchActive({ ...dims, mode: "custom", lockAspect: true });
                      }}
                      onHeight={(h) => {
                        const aspect = aspectFor(active);
                        const dims = { heightIn: h, widthIn: h * aspect };
                        patchActive({ ...dims, mode: "custom", lockAspect: true });
                      }}
                      onQuantity={(q) => patchActive({ quantity: q })}
                      onLockAspect={() => patchActive({ mode: "custom", lockAspect: true })}
                      presets={CHIP_PRESETS}
                      activePresetIn={
                        page.presets.find((p) => p.id === active.presetId)?.longestSideIn
                      }
                      onPreset={(inches) => {
                        const id =
                          page.presets.find((p) => p.longestSideIn === inches)?.id ??
                          `${inches}in`;
                        patchActive({ presetId: id, mode: "preset", lockAspect: true });
                      }}
                    />
                  </div>
                ) : (
                  <div className="full">
                    <WorkflowDimQtyFields
                      widthIn={active.widthIn}
                      heightIn={active.heightIn}
                      quantity={active.quantity}
                      lockAspect={active.lockAspect}
                      disabled={busy}
                      onWidth={(w) => {
                        const aspect = aspectFor(active);
                        patchActive({
                          widthIn: w,
                          heightIn: active.lockAspect ? w / aspect : active.heightIn,
                        });
                      }}
                      onHeight={(h) => {
                        const aspect = aspectFor(active);
                        patchActive({
                          heightIn: h,
                          widthIn: active.lockAspect ? h * aspect : active.widthIn,
                        });
                      }}
                      onQuantity={(q) => patchActive({ quantity: q })}
                      onLockAspect={(lockAspect) => patchActive({ lockAspect })}
                      presets={CHIP_PRESETS}
                      onPreset={(inches) => {
                        const dims = applyLongestSidePreset(
                          active.asset.widthPx,
                          active.asset.heightPx,
                          inches,
                        );
                        patchActive({ ...dims, mode: "custom", lockAspect: true });
                      }}
                    />
                  </div>
                )}
              </div>

              {activeDims ? (
                <p className="line-area">
                  Printed area:{" "}
                  {(activeDims.widthIn * activeDims.heightIn * active.quantity).toFixed(3)} in²
                  {activeCents != null ? ` · ${formatMoney(activeCents)}` : ""}
                  {` · qty ${active.quantity}`}
                </p>
              ) : null}
            </>
          ) : (
            <div className="empty">
              <div className="welcome-icon" aria-hidden>
                ＋
              </div>
              <strong>Select or upload a design</strong>
              <p>Set width × height and quantity, preview copies, then Add to cart.</p>
            </div>
          )}
        </main>

        <aside className="summary">
          {savedDesigns.length ? (
            <div className="library-panel">
              <h3>My saved designs</h3>
              <ul className="library-list">
                {savedDesigns.slice(0, 8).map((d) => (
                  <li key={d.id}>
                    <button type="button" onClick={() => void loadRemoteDesign(d.id, d.version)}>
                      <strong>{d.name || "Untitled"}</strong>
                      <small>
                        {d.sheetLabel} · v{d.version}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {editingDesignId && saved && !designName ? (
            <div className="library-save">
              <label>
                Save to library
                <input
                  type="text"
                  value={libraryName}
                  placeholder="Design name"
                  onChange={(e) => setLibraryName(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn ghost block"
                disabled={librarySaving || !libraryName.trim()}
                onClick={() => void saveToLibrary()}
              >
                {librarySaving ? "Saving…" : "Save to library"}
              </button>
            </div>
          ) : null}
          <h2>Your design order</h2>
          <div className="prod-wf-inline-tally">
            <RequestedVsPlacedBanner summary={ubsTally} remainingLabel="Not in quote" />
          </div>
          <p>
            <span>Price</span>
            <strong>${pricePerSqIn.toFixed(3)}/in²</strong>
          </p>
          <p>
            <span>Total area</span>
            <strong>{totalArea != null ? `${totalArea.toFixed(3)} in²` : "—"}</strong>
          </p>
          {quoteLines.length ? (
            <ul className="line-prices">
              {queue.map((line, idx) => {
                const q = quoteLines[idx];
                const cents = lineCents(q);
                if (cents == null) return null;
                return (
                  <li key={line.id}>
                    <span>
                      {line.name} · qty {line.quantity}
                    </span>
                    <strong>{formatMoney(cents)}</strong>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <p className="total">
            <span>Total</span>
            <strong>{totalCents != null ? formatMoney(totalCents) : "—"}</strong>
          </p>
          <p className="fine">Pricing is verified server-side when you save. Requested vs placed is the copy count in this order.</p>
          {emptyQueue ? (
            <p className="err" role="status">
              Queue is empty — upload an image to continue.
            </p>
          ) : null}
          {hasLowDpi ? (
            <p className="warn-inline" role="status">
              Fix low-DPI items before saving for best print quality.
            </p>
          ) : null}
          {ubsAlert ? (
            <WorkflowAlert tone="error" title={ubsAlert.title} body={ubsAlert.body} />
          ) : error ? (
            <p className="err" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="ok" role="status">
              {ubsTally.headline}. Return to the product page to finish checkout.
            </p>
          ) : null}
          <button
            type="button"
            className="prod-wf-btn prod-wf-btn-primary"
            style={{ width: "100%" }}
            disabled={busy || emptyQueue}
            onClick={save}
          >
            {saving ? "Saving…" : saved ? "Saved" : "Add to cart"}
          </button>
        </aside>
      </div>

      {bgRemove ? (
        <BackgroundRemovalModal
          open
          sourceAssetId={bgRemove.sourceAssetId}
          sourcePreviewUrl={bgRemove.sourcePreviewUrl}
          requestHeaders={headers()}
          onClose={() => setBgRemove(null)}
          onApply={applyBgRemoveResult}
        />
      ) : null}
    </div>
  );
}

const CSS = `
.ubs.prod-wf{background:#1a1f28}
.ubs.prod-wf .layout{min-height:calc(100vh - 64px)}
.ubs.prod-wf .layout main{background:#f7f8fa;color:#111827}
.ubs.prod-wf .prod-wf-progress{margin-bottom:4px}
.ubs.prod-wf .prod-wf-tally-cell{background:#fff}
.ubs.prod-wf header.prod-wf-bar{position:sticky}
.ubs.welcome{min-height:100vh;background:#eef1f5}
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
.welcome-tip{margin:16px 0 0;padding:10px 12px;background:#f8fafc;border:1px solid #e4e7ec;border-radius:8px;font-size:12px;color:#475467;line-height:1.45;text-align:center}
a.welcome-opt{text-decoration:none;color:inherit}
.brand.center{justify-content:center;margin-bottom:8px}
.icon-rail{background:#0d1117;color:#98a2b3;display:flex;flex-direction:column;align-items:stretch;padding:8px 0;gap:4px;z-index:6}
.icon-rail .rail-btn{position:relative;border:0;background:transparent;color:inherit;padding:10px 6px;cursor:pointer;display:grid;justify-items:center;gap:4px;font-size:10px}
.icon-rail label.rail-btn{margin:0}
.icon-rail .rail-btn:hover:not(.soon){color:#fff;background:#1a2230}
.icon-rail .rail-btn.active{color:#fff;background:#243044;box-shadow:inset 3px 0 0 var(--accent)}
.icon-rail .rail-btn.soon{opacity:.45;cursor:not-allowed}
.icon-rail .rail-icon{font-size:18px;line-height:1}
.icon-rail .rail-label{font-size:9px;font-weight:600;letter-spacing:.02em}
.ubs>header{height:68px;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:0;z-index:5}
.brand{display:flex;align-items:center;gap:10px}
.brand>b{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:900 20px Georgia}
.brand strong,.brand small{display:block}.brand strong{letter-spacing:.12em}.brand small{font-size:11px;color:#98a2b3}
.actions{display:flex;gap:8px;align-items:center}
.btn{border:0;border-radius:7px;padding:10px 14px;font-weight:700;cursor:pointer}
.btn.primary{background:var(--accent);color:#fff;display:inline-grid;place-items:center}
.btn.save{background:var(--green);color:#fff}
.btn.ghost{background:#fff;border:1px solid #ccd2da;color:#111}
.btn.block{display:block;width:100%;text-align:center;margin-top:8px}
.btn:disabled,.btn.disabled{opacity:.5;cursor:not-allowed;pointer-events:none}
.banner{margin:0;padding:10px 20px;font-size:13px}
.banner.err{background:#fff0ee;color:#b42318}
.banner.info{background:#eff6ff;color:#1d4ed8}
.banner.warn{background:#fff7ed;color:#b45309}
.layout{display:grid;grid-template-columns:280px minmax(420px,1fr) 260px;min-height:calc(100vh - 68px)}
aside{background:#fff;border-right:1px solid var(--line)}
.summary{border-right:0;border-left:1px solid var(--line);padding:16px;display:grid;gap:10px;align-content:start}
.queue{padding:14px}
.queue h2,.summary h2{margin:0 0 4px;font-size:15px}
.panel-sub{margin:0 0 10px;font-size:11px;color:var(--muted)}
.drop{display:grid;gap:6px;place-items:center;text-align:center;border:1.5px dashed #b5bfcc;border-radius:10px;padding:28px 16px;cursor:pointer;color:#667085;background:#fafbfc}
.drop.disabled{opacity:.55;pointer-events:none}
.queue ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.queue li{display:grid;grid-template-columns:1fr auto;gap:4px;align-items:start}
.queue li>button:first-child{display:grid;grid-template-columns:48px 1fr;gap:8px;width:100%;text-align:left;border:1px solid transparent;background:#fff;border-radius:8px;padding:8px;cursor:pointer}
.queue li>button:first-child.active{border-color:var(--accent);background:#fff7ed}
.thumb{width:48px;height:48px;border-radius:6px;display:grid;place-items:center;overflow:hidden;border:1px solid var(--line)}
.queue img{width:100%;height:100%;object-fit:contain}
.queue strong,.queue small{display:block;font-size:11px}.queue small{color:#667085;margin-top:3px}
.row-actions{display:grid;gap:4px}
.dup,.remove{border:0;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;line-height:1}
.dup{background:#f3f4f6;color:#344054}
.dup:hover{background:#ffe8d5;color:var(--accent-dark)}
.remove{background:#fee2e2;color:#991b1b}
.dup:disabled,.remove:disabled{opacity:.45;cursor:not-allowed}
main{padding:20px;display:grid;gap:14px;align-content:start}
.preview{display:grid;place-items:center;padding:16px;border-radius:10px;border:1px solid var(--line);min-height:200px}
.preview img{max-width:100%;max-height:260px;object-fit:contain}
.meta{display:grid;gap:4px}.meta span{font-size:12px;color:#667085}.warn{color:#b45309;font-size:12px}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fields label,.stepper-field{display:grid;gap:5px;font-size:12px;color:#667085}
.field-label{font-size:12px;color:#667085;display:block;margin-bottom:4px}
.fields .full{grid-column:1/-1}
.fields input,.fields select{padding:8px;border:1px solid #ccd2da;border-radius:6px}
.check{flex-direction:row;align-items:center;display:flex!important;gap:8px;color:#111}
.line-area{margin:0;font-size:13px;color:#667085}
.empty{padding:40px 10px;color:#667085;text-align:center;display:grid;gap:8px;justify-items:center}
.summary p{display:flex;justify-content:space-between;margin:0;font-size:13px;color:#667085}
.summary strong{color:#111}
.summary .total{border-top:1px solid var(--line);padding-top:10px;font-size:15px}
.summary .total strong{font-size:20px;color:var(--green)}
.line-prices{list-style:none;margin:0;padding:0;display:grid;gap:6px;border-top:1px solid var(--line);padding-top:8px}
.line-prices li{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:#667085}
.line-prices strong{color:#111;font-weight:600;white-space:nowrap}
.fine{font-size:11px;opacity:.8}
.err{color:#b42318;font-size:12px;margin:0}
.warn-inline{color:#b45309;font-size:12px;margin:0}
.ok{color:#17683e;font-size:12px;margin:0}
.library-panel{border:1px solid var(--line);border-radius:8px;padding:10px;background:#fafbfc}
.library-panel h3{margin:0 0 8px;font-size:13px}
.library-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.library-list button{width:100%;text-align:left;border:1px solid #e4e7ec;border-radius:6px;padding:8px;background:#fff;cursor:pointer}
.library-list strong{display:block;font-size:12px}
.library-list small{display:block;font-size:11px;color:#667085;margin-top:2px}
.library-save{border:1px solid var(--line);border-radius:8px;padding:10px;background:#fff}
.library-save label{display:grid;gap:4px;font-size:11px;font-weight:600;color:#667085}
.library-save input{padding:8px;border:1px solid #ccd2da;border-radius:6px;font:inherit}
${BACKGROUND_REMOVAL_MODAL_CSS}
@media(max-width:960px){.layout{grid-template-columns:1fr}.summary{border-left:0;border-top:1px solid var(--line)}.welcome-grid.two-col{grid-template-columns:1fr}}
`;
