/**
 * Production-readiness Chromium smoke: viewports + gallery/upload/review against a local server.
 * Requires Chrome and a running editor with TEST_API_TOKEN cookies.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:3011";
const SHOP = process.env.DEV_SHOP || "legends-bags-in2lwdll.myshopify.com";
const TOKEN = process.env.TEST_API_TOKEN || "dev-ui-smoke-token";
const OUT = path.resolve("tmp-ui-smoke-prod");
const PORT = 9226;
const EDITOR = `${BASE}/editor/gang-sheet?shop=${encodeURIComponent(SHOP)}`;

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "tablet-900", width: 900, height: 1200 },
];

function chromeArgs(profile) {
  return [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=1440,900`,
    EDITOR,
  ];
}

async function cdpHttp(pathname) {
  const res = await fetch(`http://127.0.0.1:${PORT}${pathname}`);
  if (!res.ok) throw new Error(`CDP HTTP ${res.status} ${pathname}`);
  return res.json();
}

function cdpSession(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", (err) => reject(err));
  });
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  async function send(method, params = {}) {
    await ready;
    const id = nextId++;
    const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    ws.send(JSON.stringify({ id, method, params }));
    return result;
  }
  return { send, close: () => ws.close() };
}

async function evalExpr(session, expression, returnByValue = true) {
  const result = await session.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result?.value;
}

async function screenshot(session, file) {
  const { data } = await session.send("Page.captureScreenshot", { format: "png" });
  await writeFile(path.join(OUT, file), Buffer.from(data, "base64"));
}

async function setViewport(session, width, height) {
  await session.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 900,
  });
}

async function waitFor(session, expression, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await evalExpr(session, `Boolean(${expression})`);
    if (ok) return true;
    await delay(200);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function apiChecks() {
  const jar = [];
  const page = await fetch(EDITOR, { redirect: "manual" });
  const setCookie = page.headers.getSetCookie?.() || [];
  jar.push(...setCookie.map((c) => c.split(";")[0]));
  const headers = {
    "X-LGS-Shop": SHOP,
    "X-LGS-Test-Token": TOKEN,
    Cookie: jar.join("; "),
  };

  const gallery = await fetch(`${BASE}/api/gallery`, { headers });
  const galleryJson = await gallery.json();
  const png = await sharp({
    create: { width: 600, height: 400, channels: 4, background: { r: 10, g: 90, b: 40, alpha: 1 } },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "smoke-upload.png");
  const upload = await fetch(`${BASE}/api/uploads`, { method: "POST", headers, body: form });
  const uploadJson = await upload.json();

  return {
    editorStatus: page.status,
    cookies: setCookie.map((c) => c.split(";")[0].split("=")[0] + " " + (c.includes("SameSite=Lax") ? "Lax" : c.includes("SameSite=None") ? "None" : "?")),
    galleryStatus: gallery.status,
    galleryCount: galleryJson.items?.length ?? 0,
    galleryNames: (galleryJson.items ?? []).map((i) => i.name),
    galleryPixels: (galleryJson.items ?? []).map((i) => ({ name: i.name, widthPx: i.widthPx, heightPx: i.heightPx, dpi: i.dpi })),
    uploadStatus: upload.status,
    uploadAsset: uploadJson,
  };
}

async function uiFlow(session, report) {
  await session.send("Page.enable");
  await session.send("Runtime.enable");
  await waitFor(session, `document.querySelector('.welcome-card, .gs-command-bar')`);

  const welcome = await evalExpr(
    session,
    `!!document.querySelector('.welcome-card')`,
  );
  report.welcome = welcome;
  if (welcome) {
    await screenshot(session, "desktop-welcome.png");
    await evalExpr(
      session,
      `document.querySelector('[aria-label="Build a Gang Sheet"], button.welcome-opt.featured, button.welcome-opt.primary')?.click(); true`,
    );
    await delay(400);
  }

  await waitFor(session, `document.querySelector('.gs-command-bar, .workspace')`);
  await screenshot(session, "desktop-canvas.png");

  await evalExpr(session, `document.querySelector('[aria-label="Gallery"], [title="Gallery"]')?.click(); true`);
  await delay(500);
  const galleryUi = await evalExpr(session, `(() => {
    const text = document.body.innerText.slice(0, 2000);
    return {
      hasMascot: text.includes('Production mascot'),
      hasDpi: /\\d+ DPI/.test(text),
      empty: text.includes('No gallery artwork yet'),
      error: text.includes('Could not load gallery') || text.includes('requires shop authentication'),
    };
  })()`);
  report.galleryUi = galleryUi;
  await screenshot(session, "desktop-gallery.png");

  if (galleryUi.hasMascot) {
    await evalExpr(
      session,
      `const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Add to Sheet'); btn?.click(); true`,
    );
    await delay(800);
  }
  const afterAdd = await evalExpr(session, `({
    hasPiece: !!document.querySelector('.piece, [data-piece], .sheet img'),
    dpiText: (document.body.innerText.match(/\\d+ DPI/) || [])[0] || null,
    printQuality: document.body.innerText.includes('Print quality'),
  })`);
  report.afterAdd = afterAdd;
  await screenshot(session, "desktop-placed.png");

  const saveDisabledEmpty = await evalExpr(
    session,
    `document.querySelector('[aria-label="Save and add to cart"]')?.disabled === true || document.querySelector('[aria-label="Production Review"]')?.disabled === true`,
  );
  report.primaryDisabledWhenEmptyGuess = saveDisabledEmpty;

  await evalExpr(
    session,
    `document.querySelector('[aria-label="Save and add to cart"], [aria-label="Production Review"], [aria-label="Save design"]')?.click(); true`,
  );
  await delay(500);
  const review = await evalExpr(session, `(() => {
    const text = document.body.innerText;
    const dialog = document.querySelector('.gs-save-dialog, [role=dialog]');
    return {
      open: text.includes('Production Review'),
      ready: text.includes('Export ready') || text.includes('Export with cautions') || text.includes('Not print-ready'),
      blocked: text.includes('No artwork on this sheet') || text.includes('Export blocked'),
      dialog: dialog ? dialog.innerText.slice(0, 800) : null,
    };
  })()`);
  report.review = review;
  await screenshot(session, "desktop-review.png");

  for (const vp of VIEWPORTS) {
    await setViewport(session, vp.width, vp.height);
    await delay(250);
    await evalExpr(
      session,
      `document.querySelector('[aria-label="Close"]')?.click(); true`,
    );
    await delay(150);
    const layout = await evalExpr(session, `({
      mobileBar: getComputedStyle(document.querySelector('nav.mobile-bar') || document.body).display,
      commandBar: !!document.querySelector('.gs-command-bar'),
      canvas: !!document.querySelector('.workspace, .canvas-main'),
      width: window.innerWidth,
      height: window.innerHeight,
    })`);
    report[vp.name] = layout;
    await screenshot(session, `${vp.name}.png`);
  }
}

const report = { ok: false };
await mkdir(OUT, { recursive: true });
report.api = await apiChecks();

const profile = path.join(OUT, "chrome-profile");
await mkdir(profile, { recursive: true });
const chrome = spawn(CHROME, chromeArgs(profile), { stdio: "ignore" });
try {
  let targets;
  for (let i = 0; i < 25; i++) {
    try {
      targets = await cdpHttp("/json/list");
      if (targets?.length) break;
    } catch {
      /* retry */
    }
    await delay(200);
  }
  if (!targets?.length) throw new Error("Chrome CDP targets not available");
  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  const session = cdpSession(pageTarget.webSocketDebuggerUrl);
  try {
    await uiFlow(session, report);
    report.ok = true;
  } finally {
    session.close();
  }
} catch (err) {
  report.error = err instanceof Error ? err.message : String(err);
} finally {
  chrome.kill();
}

await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
