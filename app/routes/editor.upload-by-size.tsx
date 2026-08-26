import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
import type { SizeInput } from "../domain/pricing";
import { SIZE_PRESETS } from "../domain/design/types";
import {
  applyLongestSidePreset,
  BAGS_BASE_CSS,
  PresetSizeChips,
  StepperField,
} from "../components/editor/bags-ui";

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

  return data(
    {
      productGid,
      variantId,
      shop,
      pricePerSqIn: 0.049,
      presets: Object.entries(SIZE_PRESETS).map(([id, p]) => ({
        id,
        label: p.label,
        longestSideIn: p.longestSideIn,
      })),
      hasDevAuth: Boolean(token && shop),
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
  const [totalCents, setTotalCents] = useState<number | null>(null);
  const [totalArea, setTotalArea] = useState<number | null>(null);

  const active = queue.find((l) => l.id === activeId) ?? queue[0] ?? null;

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

  const refreshQuote = useCallback(
    async (lines: QueueLine[]) => {
      if (!lines.length) {
        setQuoteLines([]);
        setTotalCents(null);
        setTotalArea(null);
        return;
      }
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
          pricing?: { totalCents: number; areaSqIn: number };
          lines?: QuoteLine[];
          error?: string;
        };
        if (!res.ok) throw new Error(json.error || "Quote failed");
        setQuoteLines(json.lines ?? []);
        setTotalCents(json.pricing?.totalCents ?? null);
        setTotalArea(json.pricing?.areaSqIn ?? null);
      } catch {
        const area = lines.reduce((sum, line) => {
          const d = resolvedDims(line);
          return sum + d.widthIn * d.heightIn * line.quantity;
        }, 0);
        setTotalArea(area);
        setTotalCents(Math.round(area * page.pricePerSqIn * 100));
        setQuoteLines([]);
      }
    },
    [headers, page.presets, page.pricePerSqIn],
  );

  useEffect(() => {
    const t = setTimeout(() => void refreshQuote(queue), 200);
    return () => clearTimeout(t);
  }, [queue, refreshQuote]);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    setSaved(false);
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
          quantity: 1,
        });
      }
      setQueue((q) => [...q, ...added]);
      setActiveId(added.at(-1)?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function patchActive(patch: Partial<QueueLine>) {
    if (!active) return;
    setSaved(false);
    setQueue((lines) =>
      lines.map((line) => (line.id === active.id ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(id: string) {
    setSaved(false);
    setQueue((lines) => lines.filter((l) => l.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function save() {
    if (!queue.length) {
      setError("Upload at least one design");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload =
        queue.length === 1
          ? {
              assetId: queue[0].asset.assetId,
              size: sizePayload(queue[0]),
              productGid: page.productGid,
              variantGid: page.variantId
                ? `gid://shopify/ProductVariant/${page.variantId}`
                : undefined,
            }
          : {
              uploads: queue.map((line) => ({
                assetId: line.asset.assetId,
                size: sizePayload(line),
              })),
              productGid: page.productGid,
              variantGid: page.variantId
                ? `gid://shopify/ProductVariant/${page.variantId}`
                : undefined,
            };

      const res = await fetch("/api/designs", {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
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
      setTotalCents(json.state?.pricing.totalCents ?? totalCents);
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

  const activeQuote = useMemo(
    () => quoteLines.find((l) => l.assetId === active?.asset.assetId),
    [quoteLines, active],
  );

  const activeDims = active ? resolvedDims(active) : null;

  return (
    <div className="ubs lgs-editor">
      <style>{BAGS_BASE_CSS}{CSS}</style>
      <header>
        <div className="brand">
          <b>L</b>
          <span>
            <strong>LEGENDS BAGS</strong>
            <small>Images By Size</small>
          </span>
        </div>
        <div className="actions">
          <label className="btn primary">
            {uploading ? "Uploading…" : "＋ Choose images"}
            <input type="file" multiple accept="image/png,image/jpeg" hidden onChange={onFiles} />
          </label>
          <button
            type="button"
            className="btn save"
            disabled={saving || !queue.length}
            onClick={save}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Add to cart"}
          </button>
        </div>
      </header>

      {!page.hasDevAuth ? (
        <p className="banner err">
          Dev auth missing — set DEV_SHOP and TEST_API_TOKEN in <code>.env</code>, then restart{" "}
          <code>shopify app dev</code>.
        </p>
      ) : null}

      <div className="layout">
        <aside className="queue">
          <h2>Your designs</h2>
          <p className="panel-sub">Upload multiple images — size each one before checkout.</p>
          {!queue.length ? (
            <label className="drop">
              <strong>Upload to get started</strong>
              <small>PNG or JPEG · transparent PNG recommended</small>
              <input type="file" multiple accept="image/png,image/jpeg" hidden onChange={onFiles} />
            </label>
          ) : (
            <ul>
              {queue.map((line) => {
                const d = resolvedDims(line);
                const q = quoteLines.find((x) => x.assetId === line.asset.assetId);
                return (
                  <li key={line.id}>
                    <button
                      type="button"
                      className={line.id === active?.id ? "active" : ""}
                      onClick={() => setActiveId(line.id)}
                    >
                      <img src={line.previewUrl} alt="" />
                      <span>
                        <strong>{line.name}</strong>
                        <small>
                          {d.widthIn.toFixed(2)}×{d.heightIn.toFixed(2)} in · qty {line.quantity}
                          {q?.lowDpi ? " · low DPI" : ""}
                        </small>
                      </span>
                    </button>
                    <button type="button" className="remove" onClick={() => removeLine(line.id)}>
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {queue.length ? (
            <label className="btn ghost block">
              ＋ Add more
              <input type="file" multiple accept="image/png,image/jpeg" hidden onChange={onFiles} />
            </label>
          ) : null}
        </aside>

        <main>
          {active ? (
            <>
              <div className="preview checkerboard">
                <img src={active.previewUrl} alt={active.name} />
              </div>
              <div className="meta">
                <strong>{active.name}</strong>
                <span>
                  {active.asset.widthPx}×{active.asset.heightPx}px
                  {active.asset.dpi ? ` · ${active.asset.dpi} DPI tagged` : " · DPI not tagged"}
                  {activeQuote ? ` · ~${activeQuote.effectiveDpi} DPI effective` : ""}
                </span>
                {activeQuote?.lowDpi || (activeQuote && activeQuote.effectiveDpi < 200) ? (
                  <span className="warn">
                    Low resolution for print — upload a higher-resolution file or use Upscale (soon).
                  </span>
                ) : null}
              </div>

              <div className="tool-row">
                <span className="tool-toggle">Remove background (soon)</span>
                <span className="tool-toggle">Upscale to 300 DPI (soon)</span>
              </div>

              <div className="fields">
                <label className="full">
                  Sizing mode
                  <select
                    value={active.mode}
                    onChange={(e) =>
                      patchActive({ mode: e.target.value as "preset" | "custom" })
                    }
                  >
                    <option value="preset">Preset (longest side)</option>
                    <option value="custom">Custom dimensions</option>
                  </select>
                </label>

                {active.mode === "preset" ? (
                  <>
                    <label className="full">
                      Preset
                      <select
                        value={active.presetId}
                        onChange={(e) => patchActive({ presetId: e.target.value })}
                      >
                        {page.presets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="full">
                      <span className="field-label">Quick sizes</span>
                      <PresetSizeChips
                        presets={CHIP_PRESETS}
                        activeIn={
                          page.presets.find((p) => p.id === active.presetId)?.longestSideIn
                        }
                        onPick={(inches) => {
                          const id =
                            page.presets.find((p) => p.longestSideIn === inches)?.id ??
                            `${inches}in`;
                          patchActive({ presetId: id, mode: "preset" });
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <StepperField
                      label="Width (in)"
                      value={active.widthIn}
                      step={0.1}
                      onChange={(w) => {
                        const aspect = aspectFor(active);
                        patchActive({
                          widthIn: w,
                          heightIn: active.lockAspect ? w / aspect : active.heightIn,
                        });
                      }}
                    />
                    <StepperField
                      label="Height (in)"
                      value={active.heightIn}
                      step={0.1}
                      onChange={(h) => {
                        const aspect = aspectFor(active);
                        patchActive({
                          heightIn: h,
                          widthIn: active.lockAspect ? h * aspect : active.widthIn,
                        });
                      }}
                    />
                    <label className="check full">
                      <input
                        type="checkbox"
                        checked={active.lockAspect}
                        onChange={(e) => patchActive({ lockAspect: e.target.checked })}
                      />
                      Keep aspect ratio
                    </label>
                    <div className="full">
                      <span className="field-label">Quick sizes (longest side)</span>
                      <PresetSizeChips
                        presets={CHIP_PRESETS}
                        onPick={(inches) => {
                          const dims = applyLongestSidePreset(
                            active.asset.widthPx,
                            active.asset.heightPx,
                            inches,
                          );
                          patchActive({ ...dims, mode: "custom" });
                        }}
                      />
                    </div>
                  </>
                )}

                <StepperField
                  label="Quantity"
                  value={active.quantity}
                  step={1}
                  min={1}
                  onChange={(q) => patchActive({ quantity: Math.max(1, Math.round(q)) })}
                />
              </div>

              {activeDims ? (
                <p className="line-area">
                  Printed area: {(activeDims.widthIn * activeDims.heightIn * active.quantity).toFixed(3)} in²
                </p>
              ) : null}
            </>
          ) : (
            <div className="empty">
              <strong>Select or upload a design</strong>
              <p>Size each artwork, set quantity, then add everything to cart in one order.</p>
            </div>
          )}
        </main>

        <aside className="summary">
          <h2>Your design order</h2>
          <p>
            <span>Price</span>
            <strong>${page.pricePerSqIn.toFixed(3)}/in²</strong>
          </p>
          <p>
            <span>Total area</span>
            <strong>{totalArea != null ? `${totalArea.toFixed(3)} in²` : "—"}</strong>
          </p>
          <p className="total">
            <span>Total</span>
            <strong>{totalCents != null ? `$${(totalCents / 100).toFixed(2)}` : "—"}</strong>
          </p>
          <p className="fine">Pricing is verified server-side when you save.</p>
          {error ? <p className="err">{error}</p> : null}
          {saved ? <p className="ok">Design saved — return to the product page and add to cart.</p> : null}
        </aside>
      </div>
    </div>
  );
}

function round(v: number) {
  return Math.round(v * 100) / 100;
}

const CSS = `
.ubs{--blue:var(--accent);--green:var(--green);min-height:100vh;background:#eef1f5;color:#111827;font:14px/1.35 Inter,system-ui,sans-serif}
.ubs>header{height:68px;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:0;z-index:5}
.brand{display:flex;align-items:center;gap:10px}
.brand>b{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#ffd45e,#e89119);color:#111;font:900 20px Georgia}
.brand strong,.brand small{display:block}.brand strong{letter-spacing:.12em}.brand small{font-size:11px;color:#98a2b3}
.actions{display:flex;gap:8px;align-items:center}
.btn{border:0;border-radius:7px;padding:10px 14px;font-weight:700;cursor:pointer}
.btn.primary{background:var(--accent);color:#fff;display:inline-grid;place-items:center}
.btn.save{background:var(--green);color:#fff}
.btn.ghost{background:#fff;border:1px solid #ccd2da;color:#111}
.btn.block{display:block;text-align:center;margin-top:8px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.banner{margin:0;padding:10px 20px}.banner.err{background:#fff0ee;color:#b42318}
.layout{display:grid;grid-template-columns:260px minmax(420px,1fr) 240px;min-height:calc(100vh - 68px)}
aside{background:#fff;border-right:1px solid #dfe3e8}
.summary{border-right:0;border-left:1px solid #dfe3e8;padding:16px;display:grid;gap:10px;align-content:start}
.queue{padding:14px}
.queue h2,.summary h2{margin:0 0 4px;font-size:15px}
.panel-sub{margin:0 0 10px;font-size:11px;color:var(--muted)}
.drop{display:grid;gap:6px;place-items:center;text-align:center;border:1.5px dashed #b5bfcc;border-radius:10px;padding:28px 16px;cursor:pointer;color:#667085}
.queue ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.queue li{display:grid;grid-template-columns:1fr auto;gap:4px;align-items:start}
.queue li button{display:grid;grid-template-columns:48px 1fr;gap:8px;width:100%;text-align:left;border:1px solid transparent;background:#fff;border-radius:8px;padding:8px;cursor:pointer}
.queue li button.active{border-color:var(--accent);background:#fff7ed}
.queue img{width:48px;height:48px;object-fit:contain;background:#eee;border-radius:6px}
.queue strong,.queue small{display:block;font-size:11px}.queue small{color:#667085;margin-top:3px}
.remove{border:0;background:#fee2e2;color:#991b1b;width:28px;height:28px;border-radius:6px;cursor:pointer}
main{padding:20px;display:grid;gap:14px;align-content:start}
.preview{display:grid;place-items:center;padding:16px;border-radius:10px;border:1px solid #dfe3e8;min-height:200px}
.preview img{max-width:100%;max-height:260px;object-fit:contain}
.meta{display:grid;gap:4px}.meta span{font-size:12px;color:#667085}.warn{color:#b45309;font-size:12px}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fields label,.stepper-field{display:grid;gap:5px;font-size:12px;color:#667085}
.field-label{font-size:12px;color:#667085;display:block;margin-bottom:4px}
.fields .full{grid-column:1/-1}
.fields input,.fields select{padding:8px;border:1px solid #ccd2da;border-radius:6px}
.check{flex-direction:row;align-items:center;display:flex!important;gap:8px;color:#111}
.line-area{margin:0;font-size:13px;color:#667085}
.empty{padding:40px 10px;color:#667085;text-align:center}
.summary p{display:flex;justify-content:space-between;margin:0;font-size:13px;color:#667085}
.summary strong{color:#111}
.summary .total{border-top:1px solid #dfe3e8;padding-top:10px;font-size:15px}
.summary .total strong{font-size:20px;color:var(--green)}
.fine{font-size:11px;opacity:.8}
.err{color:#b42318;font-size:12px;margin:0}.ok{color:#17683e;font-size:12px;margin:0}
@media(max-width:960px){.layout{grid-template-columns:1fr}.summary{border-left:0;border-top:1px solid #dfe3e8}}
`;
