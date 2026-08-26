import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { SIZE_PRESETS } from "../domain/design/types";

/**
 * Customer Upload-by-Size editor (Phase 1 vertical slice).
 * Dev auth: sessionStorage lgs_test_token + lgs_shop (or DEV_SHOP).
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  return {
    productGid: url.searchParams.get("productGid") ?? "",
    variantId: url.searchParams.get("variantId") ?? "",
    presets: Object.entries(SIZE_PRESETS).map(([id, p]) => ({
      id,
      label: p.label,
      longestSideIn: p.longestSideIn,
    })),
    shop: process.env.DEV_SHOP || "",
  };
}

export default function UploadBySizeEditor() {
  const data = useLoaderData<typeof loader>();
  const boot = buildBootScript(data);

  return (
    <div className="lgs-editor">
      <style>{EDITOR_CSS}</style>
      <main>
        <h1>Upload by Size</h1>
        <p className="muted">
          Transparent PNG recommended. Price is calculated from printed area and
          verified on the server.
        </p>
        <div id="ubs-app" className="card">
          <label>
            Artwork (PNG/JPEG)
            <input
              data-file
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            />
          </label>
          <p className="muted" data-meta>
            No file selected
          </p>
          <label>
            Sizing mode
            <select data-mode defaultValue="preset">
              <option value="preset">Preset (longest side)</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <div data-preset-wrap>
            <label>
              Preset
              <select data-preset defaultValue="4in">
                {data.presets.map((p) => (
                  <option key={p.id} value={p.id} data-longest={p.longestSideIn}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div data-custom-wrap hidden>
            <div className="row">
              <label>
                Width (in)
                <input
                  data-width
                  type="number"
                  min={0.1}
                  step={0.01}
                  defaultValue={4}
                />
              </label>
              <label>
                Height (in)
                <input
                  data-height
                  type="number"
                  min={0.1}
                  step={0.01}
                  defaultValue={4}
                />
              </label>
            </div>
            <label>
              <input data-lock type="checkbox" defaultChecked /> Lock aspect
              ratio
            </label>
          </div>
          <label>
            Quantity
            <input data-qty type="number" min={1} step={1} defaultValue={1} />
          </label>
          <p className="price">
            Est. total: <span data-price>—</span>
          </p>
          <p className="err" data-err />
          <button type="button" data-submit>
            Save design & return to product
          </button>
          <p className="muted">
            Dev: set sessionStorage <code>lgs_test_token</code> and{" "}
            <code>lgs_shop</code>. Shop hint: {data.shop || "(set DEV_SHOP)"}
          </p>
        </div>
      </main>
      <script dangerouslySetInnerHTML={{ __html: boot }} />
    </div>
  );
}

const EDITOR_CSS = `
  .lgs-editor {
    --bg: #f3efe6;
    --ink: #1c1915;
    --accent: #0f5c4c;
    --line: #cbbfaa;
    min-height: 100vh;
    color: var(--ink);
    background:
      radial-gradient(circle at 10% 0%, #fff8e8, transparent 40%),
      linear-gradient(160deg, #efe7d8, #f7f3ea 45%, #e7eee9);
    font-family: "Segoe UI", "Helvetica Neue", sans-serif;
  }
  .lgs-editor main {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.25rem;
    display: grid;
    gap: 1rem;
  }
  .lgs-editor h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 600;
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    margin: 0;
  }
  .lgs-editor .card {
    border: 1px solid var(--line);
    padding: 1rem;
    background: rgba(255,255,255,0.55);
    display: grid;
    gap: 0.75rem;
  }
  .lgs-editor label { display: grid; gap: 0.35rem; font-size: 0.95rem; }
  .lgs-editor input, .lgs-editor select, .lgs-editor button {
    font: inherit;
    padding: 0.6rem 0.7rem;
  }
  .lgs-editor button {
    background: var(--accent);
    color: #f4fffb;
    border: 0;
    cursor: pointer;
  }
  .lgs-editor button:disabled { opacity: 0.5; cursor: not-allowed; }
  .lgs-editor .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  @media (max-width: 600px) {
    .lgs-editor .row { grid-template-columns: 1fr; }
  }
  .lgs-editor .price { font-size: 1.25rem; font-weight: 600; }
  .lgs-editor .muted { opacity: 0.75; font-size: 0.9rem; }
  .lgs-editor .err { color: #8b1e1e; min-height: 1.2em; }
`;

function buildBootScript(data: {
  shop: string;
  productGid: string;
}): string {
  return `
(() => {
  const shop = ${JSON.stringify(data.shop)};
  const productGid = ${JSON.stringify(data.productGid)};
  const root = document.getElementById('ubs-app');
  if (!root) return;
  const fileInput = root.querySelector('[data-file]');
  const preset = root.querySelector('[data-preset]');
  const qty = root.querySelector('[data-qty]');
  const widthIn = root.querySelector('[data-width]');
  const heightIn = root.querySelector('[data-height]');
  const lock = root.querySelector('[data-lock]');
  const mode = root.querySelector('[data-mode]');
  const priceEl = root.querySelector('[data-price]');
  const metaEl = root.querySelector('[data-meta]');
  const errEl = root.querySelector('[data-err]');
  const submit = root.querySelector('[data-submit]');
  let asset = null;
  let aspect = 1;

  function headers() {
    const token = sessionStorage.getItem('lgs_test_token') || '';
    return {
      'X-LGS-Shop': shop || sessionStorage.getItem('lgs_shop') || '',
      'X-LGS-Test-Token': token,
    };
  }

  async function onFile() {
    errEl.textContent = '';
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    const res = await fetch('/api/uploads', { method: 'POST', headers: headers(), body: fd });
    const json = await res.json();
    if (!res.ok) { errEl.textContent = json.error || 'Upload failed'; return; }
    asset = json;
    aspect = json.widthPx / json.heightPx;
    metaEl.textContent = json.widthPx + '×' + json.heightPx + 'px' + (json.dpi ? (' · ' + json.dpi + ' DPI') : ' · DPI not tagged');
    updateQuote();
  }

  function sizePayload() {
    const quantity = Math.max(1, parseInt(qty.value || '1', 10));
    if (mode.value === 'preset') {
      return { mode: 'preset', presetId: preset.value, quantity };
    }
    return {
      mode: 'custom',
      widthIn: parseFloat(widthIn.value),
      heightIn: parseFloat(heightIn.value),
      lockAspect: !!lock.checked,
      quantity,
    };
  }

  function updateQuote() {
    if (!asset) { priceEl.textContent = '—'; return; }
    const size = sizePayload();
    let w, h, q = size.quantity;
    if (size.mode === 'preset') {
      const opt = preset.selectedOptions[0];
      const longest = parseFloat(opt.getAttribute('data-longest') || '4');
      if (aspect >= 1) { w = longest; h = longest / aspect; }
      else { h = longest; w = longest * aspect; }
    } else {
      w = size.widthIn; h = size.lockAspect ? (w / aspect) : size.heightIn;
    }
    const area = w * h * q;
    const cents = Math.round(area * 0.049 * 100);
    priceEl.textContent = '$' + (cents / 100).toFixed(2) + ' · ' + area.toFixed(3) + ' in²';
  }

  async function onSubmit() {
    errEl.textContent = '';
    if (!asset) { errEl.textContent = 'Upload artwork first'; return; }
    submit.disabled = true;
    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: asset.assetId, size: sizePayload(), productGid }),
      });
      const json = await res.json();
      if (!res.ok) { errEl.textContent = json.error || 'Could not save design'; return; }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'lgs:design-ready',
          designId: json.designId,
          version: json.version,
        }, '*');
      }
      metaEl.textContent = 'Design ' + json.designId + ' ready for cart';
      priceEl.textContent = '$' + (json.state.pricing.totalCents / 100).toFixed(2);
    } finally {
      submit.disabled = false;
    }
  }

  fileInput.addEventListener('change', onFile);
  [preset, qty, widthIn, heightIn, lock, mode].forEach((el) => el.addEventListener('change', updateQuote));
  [qty, widthIn, heightIn].forEach((el) => el.addEventListener('input', updateQuote));
  submit.addEventListener('click', onSubmit);
  mode.addEventListener('change', () => {
    root.querySelector('[data-preset-wrap]').hidden = mode.value !== 'preset';
    root.querySelector('[data-custom-wrap]').hidden = mode.value !== 'custom';
    updateQuote();
  });
})();`;
}
