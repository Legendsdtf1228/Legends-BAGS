import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";

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
};

type AutoDraft = {
  id: string;
  asset: Asset;
  previewUrl: string;
  name: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
};

type Screen = "welcome" | "auto_build" | "canvas";

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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || process.env.DEV_SHOP || "";
  const productGid = url.searchParams.get("productGid") ?? "";
  const variantId = url.searchParams.get("variantId") ?? "";
  const token = process.env.TEST_API_TOKEN || "";
  const headers = new Headers();
  if (token && shop) {
    headers.append(
      "Set-Cookie",
      `lgs_shop=${encodeURIComponent(shop)}; Path=/; SameSite=None; Secure; HttpOnly`,
    );
    headers.append(
      "Set-Cookie",
      `lgs_test_token=${encodeURIComponent(token)}; Path=/; SameSite=None; Secure; HttpOnly`,
    );
  }
  return data({ shop, productGid, variantId, hasDevAuth: Boolean(token && shop) }, { headers });
}

export default function GangSheetEditor() {
  const page = useLoaderData<typeof loader>();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [history, setHistory] = useState<CanvasItem[][]>([]);
  const [future, setFuture] = useState<CanvasItem[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetWidth, setSheetWidth] = useState(22.5);
  const [sheetHeight, setSheetHeight] = useState(24);
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

  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; sx: number; sy: number } | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const usedArea = useMemo(
    () => items.reduce((s, i) => s + i.widthIn * i.heightIn, 0),
    [items],
  );
  const estimate = Math.round(usedArea * 4.9) / 100;
  const utilization = Math.min(100, Math.round((usedArea / (sheetWidth * sheetHeight)) * 100));

  const pushHistory = useCallback((next: CanvasItem[]) => {
    setHistory((h) => [...h.slice(-30), items]);
    setFuture([]);
    setItems(next);
    setSaved(false);
  }, [items]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      const c = canvas.current;
      if (!d || !c) return;
      const r = c.getBoundingClientRect();
      setItems((all) =>
        all.map((i) =>
          i.id === d.id
            ? inside(
                {
                  ...i,
                  xIn: d.x + ((e.clientX - d.sx) / r.width) * sheetWidth,
                  yIn: d.y + ((e.clientY - d.sy) / r.height) * sheetHeight,
                },
                sheetWidth,
                sheetHeight,
              )
            : i,
        ),
      );
    };
    const up = () => {
      if (drag.current) {
        pushHistory(itemsRef.current);
        drag.current = null;
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [items, pushHistory, sheetHeight, sheetWidth]);

  async function uploadFiles(files: File[], target: "canvas" | "auto") {
    if (!files.length) return;
    setUploading(true);
    setError("");
    setSaved(false);
    try {
      if (target === "canvas") {
        const added: CanvasItem[] = [];
        for (const file of files) {
          const asset = await postUpload(file);
          const w = Math.min(6, sheetWidth - 0.4);
          const h = w / (asset.widthPx / asset.heightPx);
          added.push({
            ...asset,
            id: crypto.randomUUID(),
            name: file.name,
            previewUrl: URL.createObjectURL(file),
            xIn: 0.2 + added.length * 0.3,
            yIn: 0.2 + added.length * 0.3,
            widthIn: w,
            heightIn: h,
            rotationDeg: 0,
          });
        }
        pushHistory([...items, ...added]);
        setSelectedId(added.at(-1)?.id ?? null);
        setMessage(`${added.length} artwork file${added.length === 1 ? "" : "s"} added.`);
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
      },
      sheetWidth,
      sheetHeight,
    );
    pushHistory([...items, copy]);
    setSelectedId(copy.id);
  }

  function removeSelected() {
    if (!selectedId) return;
    pushHistory(items.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  }

  function rotate() {
    if (!selected) return;
    change({
      widthIn: selected.heightIn,
      heightIn: selected.widthIn,
      rotationDeg: selected.rotationDeg ? 0 : 90,
    });
  }

  function fillSheet() {
    if (!selected) return;
    const copies: CanvasItem[] = [];
    for (let y = 0.1; y + selected.heightIn <= sheetHeight; y += selected.heightIn + gap) {
      for (let x = 0.1; x + selected.widthIn <= sheetWidth; x += selected.widthIn + gap) {
        copies.push({ ...selected, id: crypto.randomUUID(), xIn: x, yIn: y });
        if (copies.length >= 250) break;
      }
      if (copies.length >= 250) break;
    }
    pushHistory([...items.filter((i) => i.id !== selected.id), ...copies]);
    setSelectedId(copies[0]?.id ?? null);
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
          allowRotate90: true,
        }),
      });
      const json = (await res.json()) as {
        placements?: NestPlacement[];
        sheetHeightIn?: number;
        sheetWidthIn?: number;
        utilization?: number;
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
  }, [autoDrafts, gap, page.shop, sheetHeight, sheetWidth]);

  useEffect(() => {
    if (screen !== "auto_build") return;
    const t = setTimeout(() => void refreshAutoPreview(), 350);
    return () => clearTimeout(t);
  }, [screen, refreshAutoPreview]);

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
        };
      });

      const needed = preview.sheetHeightIn;
      if (needed > sheetHeight) {
        setSheetHeight(SHEET_HEIGHTS.find((h) => h >= needed) ?? Math.ceil(needed));
      }

      setHistory([]);
      setFuture([]);
      setItems(placed);
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

  async function save() {
    if (!items.length) {
      setError("Add artwork before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-LGS-Shop": page.shop },
        body: JSON.stringify({
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
          items: items.map(({ assetId, widthIn, heightIn, xIn, yIn, rotationDeg }) => ({
            assetId,
            widthIn,
            heightIn,
            xIn,
            yIn,
            rotationDeg,
            quantity: 1,
          })),
        }),
      });
      const json = (await res.json()) as {
        designId?: string;
        version?: number;
        cartProperties?: Record<string, string>;
        error?: string;
        state?: { pricing: { totalCents: number } };
      };
      if (!res.ok || !json.designId) throw new Error(json.error || "Could not save design");
      setSaved(true);
      setMessage(
        `Design saved · $${((json.state?.pricing.totalCents || 0) / 100).toFixed(2)}`,
      );
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "lgs:design-ready",
            designId: json.designId,
            version: json.version,
            cartProperties: json.cartProperties,
          },
          "*",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save design");
    } finally {
      setSaving(false);
    }
  }

  if (screen === "welcome") {
    return (
      <div className="bags welcome">
        <style>{CSS}</style>
        <div className="welcome-card">
          <div className="brand center">
            <b>L</b>
            <span>
              <strong>LEGENDS BAGS</strong>
              <small>Gang Sheet Builder</small>
            </span>
          </div>
          <h1>How would you like to start?</h1>
          {!page.hasDevAuth ? (
            <p className="error">Dev auth not configured — check DEV_SHOP / TEST_API_TOKEN.</p>
          ) : null}
          <div className="welcome-grid">
            <button
              type="button"
              className="welcome-opt"
              onClick={() => {
                setScreen("canvas");
                setMessage("Upload artwork and arrange it on the sheet.");
              }}
            >
              <strong>Start a brand new gang sheet</strong>
              <span>Manual canvas — upload, drag, resize, and save.</span>
            </button>
            <button
              type="button"
              className="welcome-opt primary"
              onClick={() => {
                setScreen("auto_build");
                setAutoDrafts([]);
                setAutoPreview(null);
                setAutoPreviewError("");
                setSelectedAutoId(null);
                setMessage("Upload all designs, set size & quantity — preview updates live.");
              }}
            >
              <strong>Auto Build</strong>
              <span>Bulk upload — we nest everything onto the sheet for you.</span>
            </button>
            <button type="button" className="welcome-opt disabled" disabled>
              <strong>Reorder a previous sheet</strong>
              <span>Coming soon — requires customer accounts.</span>
            </button>
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
      <div className="bags auto-mode">
        <style>{CSS}</style>
        <header>
          <div className="brand">
            <b>L</b>
            <span>
              <strong>Auto Build</strong>
              <small>Upload → size & qty → nest preview → build</small>
            </span>
          </div>
          <nav>
            <button type="button" onClick={() => setScreen("welcome")}>
              ← Back
            </button>
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
              disabled={autoBusy || !autoDrafts.length || !!autoPreviewError || autoPreviewLoading}
              onClick={() => void applyAutoBuild()}
            >
              {autoBusy ? "Building…" : "Build gang sheet"}
            </button>
          </nav>
        </header>

        <div className="auto-split">
          <section className="auto-upload-panel">
            <div className="auto-panel-head">
              <h2>1. Upload & size</h2>
              <p>{autoDrafts.length} design{autoDrafts.length === 1 ? "" : "s"}</p>
            </div>

            {!autoDrafts.length ? (
              <label className="drop large">
                <b>⬆</b>
                <strong>Upload all your images</strong>
                <small>PNG/JPEG · select multiple files at once</small>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg"
                  hidden
                  onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []), "auto")}
                />
              </label>
            ) : (
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
                          {AUTO_PRESETS.map((inches) => (
                            <button
                              key={inches}
                              type="button"
                              className="preset-chip"
                              onClick={(e) => {
                                e.stopPropagation();
                                const aspect = d.asset.widthPx / d.asset.heightPx;
                                const w = aspect >= 1 ? inches : inches * aspect;
                                const h = aspect >= 1 ? inches / aspect : inches;
                                setAutoDrafts((rows) =>
                                  rows.map((r) =>
                                    r.id === d.id
                                      ? { ...r, widthIn: w, heightIn: h }
                                      : r,
                                  ),
                                );
                              }}
                            >
                              {inches}"
                            </button>
                          ))}
                        </div>
                        <div className="auto-dims">
                          <label>
                            W
                            <input
                              type="number"
                              min={0.1}
                              step={0.1}
                              value={round(d.widthIn)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const w = +e.target.value;
                                const aspect = d.asset.widthPx / d.asset.heightPx;
                                setAutoDrafts((rows) =>
                                  rows.map((r) =>
                                    r.id === d.id
                                      ? { ...r, widthIn: w, heightIn: w / aspect }
                                      : r,
                                  ),
                                );
                              }}
                            />
                          </label>
                          <label>
                            H
                            <input
                              type="number"
                              min={0.1}
                              step={0.1}
                              value={round(d.heightIn)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const h = +e.target.value;
                                const aspect = d.asset.widthPx / d.asset.heightPx;
                                setAutoDrafts((rows) =>
                                  rows.map((r) =>
                                    r.id === d.id
                                      ? { ...r, heightIn: h, widthIn: h * aspect }
                                      : r,
                                  ),
                                );
                              }}
                            />
                          </label>
                          <label>
                            Qty
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={d.quantity}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setAutoDrafts((rows) =>
                                  rows.map((r) =>
                                    r.id === d.id
                                      ? {
                                          ...r,
                                          quantity: Math.max(
                                            1,
                                            parseInt(e.target.value, 10) || 1,
                                          ),
                                        }
                                      : r,
                                  ),
                                )
                              }
                            />
                          </label>
                        </div>
                        <small>
                          {(d.widthIn * d.heightIn * d.quantity).toFixed(2)} in² ·{" "}
                          {d.asset.widthPx}×{d.asset.heightPx}px
                        </small>
                      </div>
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
                    onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []), "auto")}
                  />
                </label>
              </>
            )}
          </section>

          <section className="auto-preview-panel">
            <div className="auto-panel-head">
              <h2>2. Auto nest preview</h2>
              {autoPreviewLoading ? (
                <span className="preview-status">Updating…</span>
              ) : autoPreview ? (
                <span className="preview-status ok">Live preview</span>
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
              When the preview looks good, click <strong>Build gang sheet</strong> to open the
              full editor (adjust placements, then save to cart).
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="bags">
      <style>{CSS}</style>
      <header>
        <div className="brand">
          <b>L</b>
          <span>
            <strong>LEGENDS BAGS</strong>
            <small>Gang Sheet Builder</small>
          </span>
        </div>
        <nav>
          <button type="button" onClick={() => setScreen("welcome")}>
            Home
          </button>
          <button type="button" onClick={undo} disabled={!history.length}>
            Undo
          </button>
          <button type="button" onClick={redo} disabled={!future.length}>
            Redo
          </button>
          <button type="button" onClick={autoArrange} disabled={!items.length}>
            Auto arrange
          </button>
          <label className="btn-upload">
            {uploading ? "Uploading…" : "＋ Add artwork"}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg"
              hidden
              onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []), "canvas")}
            />
          </label>
          <button type="button" className="save" onClick={() => void save()} disabled={saving || !items.length}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save & add to cart"}
          </button>
        </nav>
      </header>
      <div className="workspace">
        <aside className="library">
          <div className="heading">
            <span>
              <strong>Artwork</strong>
              <small>{items.length} placed</small>
            </span>
            <label className="mini-upload">
              ＋
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg"
                hidden
                onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []), "canvas")}
              />
            </label>
          </div>
          {!items.length && (
            <label className="drop">
              <b>⬆</b>
              <strong>Upload your designs</strong>
              <small>Transparent PNG recommended</small>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg"
                hidden
                onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []), "canvas")}
              />
            </label>
          )}
          <div className="assets">
            {items.map((i, n) => (
              <button
                key={i.id}
                type="button"
                className={i.id === selectedId ? "active" : ""}
                onClick={() => setSelectedId(i.id)}
              >
                <img src={i.previewUrl} alt="" />
                <span>
                  <strong>{i.name}</strong>
                  <small>
                    {i.widthIn.toFixed(2)} × {i.heightIn.toFixed(2)} in
                  </small>
                </span>
                <b>{n + 1}</b>
              </button>
            ))}
          </div>
        </aside>
        <main>
          <div className="toolbar">
            <label>
              Sheet
              <select
                value={sheetWidth}
                onChange={(e) => {
                  setSheetWidth(+e.target.value);
                  setSaved(false);
                }}
              >
                {SHEET_WIDTHS.map((w) => (
                  <option key={w} value={w}>
                    {w} in wide
                  </option>
                ))}
              </select>
            </label>
            <label>
              Length
              <select
                value={sheetHeight}
                onChange={(e) => {
                  setSheetHeight(+e.target.value);
                  setSaved(false);
                }}
              >
                {SHEET_HEIGHTS.map((h) => (
                  <option key={h} value={h}>
                    {h} in
                  </option>
                ))}
              </select>
            </label>
            <strong>
              {sheetWidth} × {sheetHeight} in
            </strong>
            <div className="zoom">
              <button type="button" onClick={() => setZoom((z) => Math.max(35, z - 10))}>
                −
              </button>
              <span>{zoom}%</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(120, z + 10))}>
                ＋
              </button>
            </div>
          </div>
          <div className="scroll" onClick={() => setSelectedId(null)}>
            <div
              ref={canvas}
              className="sheet"
              style={{ width: `${zoom}%`, aspectRatio: `${sheetWidth}/${sheetHeight}` }}
            >
              <i />
              {items.map((i) => (
                <div
                  key={i.id}
                  className={`piece ${i.id === selectedId ? "selected" : ""}`}
                  style={{
                    left: `${(i.xIn / sheetWidth) * 100}%`,
                    top: `${(i.yIn / sheetHeight) * 100}%`,
                    width: `${(i.widthIn / sheetWidth) * 100}%`,
                    height: `${(i.heightIn / sheetHeight) * 100}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(i.id);
                  }}
                  onPointerDown={(e: ReactPointerEvent) => {
                    e.stopPropagation();
                    setSelectedId(i.id);
                    drag.current = { id: i.id, x: i.xIn, y: i.yIn, sx: e.clientX, sy: e.clientY };
                  }}
                >
                  <img
                    src={i.previewUrl}
                    alt={i.name}
                    style={{ transform: `rotate(${i.rotationDeg}deg)` }}
                    draggable={false}
                  />
                  <em>{i.widthIn.toFixed(1)}″</em>
                </div>
              ))}
              {!items.length && (
                <div className="empty">
                  <b>＋</b>
                  <strong>Your gang sheet starts here</strong>
                  <small>Add artwork, then position and size it.</small>
                </div>
              )}
            </div>
          </div>
        </main>
        <aside className="properties">
          <div className="heading">
            <span>
              <strong>Properties</strong>
              <small>{selected ? "Artwork selected" : "Select an item"}</small>
            </span>
          </div>
          {selected ? (
            <>
              <div className="preview">
                <img src={selected.previewUrl} alt="" />
                <strong>{selected.name}</strong>
                <small>
                  {selected.widthPx} × {selected.heightPx}px ·{" "}
                  {selected.dpi ? `${selected.dpi} DPI` : "DPI not tagged"}
                </small>
              </div>
              <div className="fields">
                <label>
                  Width (in)
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={round(selected.widthIn)}
                    onChange={(e) => {
                      const w = +e.target.value;
                      change({
                        widthIn: w,
                        heightIn: w / (selected.widthPx / selected.heightPx),
                      });
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
                      change({
                        heightIn: h,
                        widthIn: h * (selected.widthPx / selected.heightPx),
                      });
                    }}
                  />
                </label>
              </div>
              <div className="actions">
                <button type="button" onClick={duplicate}>
                  ⧉ Duplicate
                </button>
                <button type="button" onClick={rotate}>
                  ↻ Rotate
                </button>
                <button type="button" onClick={fillSheet}>
                  ▦ Fill sheet
                </button>
                <button type="button" onClick={removeSelected}>
                  ⌫ Delete
                </button>
              </div>
              <label className="spacing">
                Spacing <span>{gap.toFixed(2)} in</span>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.05}
                  value={gap}
                  onChange={(e) => setGap(+e.target.value)}
                />
              </label>
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
          <p className={error ? "error" : "message"}>{error || message}</p>
        </aside>
      </div>
    </div>
  );
}

function inside<T extends CanvasItem>(i: T, w: number, h: number): T {
  const iw = clamp(i.widthIn, 0.1, w);
  const ih = clamp(i.heightIn, 0.1, h);
  return {
    ...i,
    widthIn: iw,
    heightIn: ih,
    xIn: clamp(i.xIn, 0, w - iw),
    yIn: clamp(i.yIn, 0, h - ih),
  };
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function round(v: number) {
  return Math.round(v * 100) / 100;
}

const CSS = `
*{box-sizing:border-box}
.bags{--blue:#2463eb;--line:#dfe3e8;min-height:100vh;background:#eef1f5;color:#111827;font:14px/1.35 Inter,system-ui,sans-serif}
.bags button,.bags input,.bags select{font:inherit}
.bags>header{height:68px;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:0;z-index:5}
.brand{display:flex;align-items:center;gap:10px}
.brand.center{justify-content:center;margin-bottom:12px}
.brand>b{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:900 20px Georgia}
.brand strong,.brand small{display:block}.brand strong{letter-spacing:.12em}.brand small{font-size:11px;color:#98a2b3}
.bags nav{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.bags nav button,.bags nav label{border:0;border-radius:7px;padding:10px 14px;background:#242b36;color:#fff;font-weight:700;cursor:pointer}
.bags nav label.btn-upload,.bags nav .btn-upload{background:var(--blue)}
.bags nav .save{background:#21a366}
.bags nav button:disabled{opacity:.45;cursor:not-allowed}
.bags input[type=file]{display:none}
.welcome{display:grid;place-items:center;padding:32px 16px}
.welcome-card{max-width:720px;width:100%;background:#fff;border-radius:12px;padding:28px;box-shadow:0 8px 30px #34405420}
.welcome-card h1{margin:8px 0 18px;font-size:22px;text-align:center}
.welcome-grid{display:grid;gap:12px}
.welcome-opt{display:grid;gap:6px;text-align:left;border:1px solid #dfe3e8;border-radius:10px;padding:16px;background:#fff;cursor:pointer}
.welcome-opt strong{font-size:15px}.welcome-opt span{font-size:12px;color:#667085}
.welcome-opt.primary{border-color:#7aa2f8;background:#edf3ff}
.welcome-opt.disabled{opacity:.55;cursor:not-allowed}
.auto-wrap{padding:20px;max-width:900px;margin:0 auto}
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
.auto-row.active{border-color:#7aa2f8;background:#edf3ff;box-shadow:0 0 0 1px #7aa2f8}
.auto-row img{width:64px;height:64px;object-fit:contain;background:#eee;border-radius:6px}
.auto-fields strong{display:block;font-size:12px;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.preset-row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.preset-chip{border:1px solid #ccd2da;background:#f8fafc;border-radius:999px;padding:3px 8px;font-size:10px;cursor:pointer}
.preset-chip:hover{background:#edf3ff;border-color:#7aa2f8}
.auto-dims{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.auto-dims label{font-size:10px;color:#667085;display:grid;gap:3px}
.auto-dims input{padding:6px;border:1px solid #ccd2da;border-radius:5px;width:100%}
.auto-fields small{font-size:10px;color:#667085}
.nest-preview-wrap{min-height:280px;display:grid;place-items:center;background:#d8dde4;border-radius:10px;padding:20px;border:1px solid #cfd5dc}
.nest-preview-sheet{position:relative;width:100%;max-width:520px;background:#fff;background-image:linear-gradient(#f0f2f4 1px,transparent 1px),linear-gradient(90deg,#f0f2f4 1px,transparent 1px);background-size:16px 16px;box-shadow:0 6px 20px #34405430}
.nest-preview-sheet>i{position:absolute;inset:4px;border:1px dashed #e54d4d;pointer-events:none}
.nest-piece{position:absolute;overflow:hidden;border:1px solid #94a3b8;background:#fff}
.nest-piece.highlight{outline:2px solid var(--blue);z-index:2}
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
.workspace{display:grid;grid-template-columns:248px minmax(480px,1fr) 280px;height:calc(100vh - 68px)}
aside{background:#fff;overflow:auto}
.library{border-right:1px solid var(--line)}
.properties{border-left:1px solid var(--line)}
.heading{height:68px;padding:14px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}
.heading strong,.heading small{display:block}.heading small{font-size:11px;color:#667085;margin-top:3px}
.heading .mini-upload{width:32px;height:32px;display:grid;place-items:center;background:#edf3ff;color:var(--blue);border-radius:6px;font-size:20px;cursor:pointer}
.drop{margin:16px;min-height:170px;border:1.5px dashed #b5bfcc;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;text-align:center;color:#667085;cursor:pointer}
.drop>b{font-size:30px;color:var(--blue)}.drop small{font-size:11px}
.assets{padding:10px}
.assets>button{width:100%;border:1px solid transparent;background:#fff;border-radius:8px;padding:8px;display:grid;grid-template-columns:48px 1fr 22px;gap:9px;align-items:center;text-align:left;margin-bottom:5px;cursor:pointer}
.assets>button.active{border-color:#7aa2f8;background:#edf3ff}
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
.piece.selected{outline:2px solid var(--blue);outline-offset:2px}
.piece.selected:after{content:'';position:absolute;width:10px;height:10px;border:2px solid #fff;background:var(--blue);right:-7px;bottom:-7px;border-radius:50%}
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
@media(max-width:900px){.workspace{grid-template-columns:190px minmax(420px,1fr)}.properties{position:fixed;right:0;top:68px;bottom:0;width:270px;z-index:4;box-shadow:-8px 0 24px #34405420}}
`;
