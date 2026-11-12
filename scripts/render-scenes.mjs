// Renders the scene stills from the real engine code: posters, the rail rider sprite, product
// tiles and top close-ups.  node scripts/render-scenes.mjs [group or job name ...]
//
// Groups: posters, sprite, tiles, closeups (default: all). A job name such as "bay-poster" or
// "tile-sol-eclipse" runs just that one.
//
// How: a small local server (no Next route) serves a capture page that imports
// components/scene/*.ts, transpiled on the fly with Next's own SWC binding, and three from
// node_modules. Headless Edge (SwiftShader) draws each still at an exact size; the PNG goes to
// shots/v4/scene/raw/ and, for the site's images, to public/ as WebP.
//
// Needs Microsoft Edge (set EDGE to another Chromium if needed). Nothing is downloaded.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "package.json"));
const swc = require("next/dist/build/swc/index.js");
const EDGE = process.env.EDGE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const RAW = path.join(ROOT, "shots/v4/scene/raw");

const IDS = ["drake-brave", "knight-shield", "hells-scythe", "sol-eclipse", "unicorn-delta", "dran-sword"];

/* ---------- the jobs ---------- */

const webp = (file, q = 80) => ({ file, q });
const JOBS = [
  // posters: the first frame each scene draws, at the size its frame is laid out in
  { name: "home-poster", group: "posters", kind: "rail", w: 1500, h: 1200, o: { time: 0 }, p: 0, out: webp("public/scene/home-poster.webp") },
  { name: "home-still", group: "posters", kind: "rail", w: 1500, h: 1200, o: { time: 4 }, p: 0.62, out: webp("public/scene/home-still.webp") },
  { name: "learn-assembled", group: "posters", kind: "parts", w: 1200, h: 1200, o: { explode: 0 }, out: webp("public/scene/learn-assembled.webp") },
  { name: "learn-exploded", group: "posters", kind: "parts", w: 1200, h: 1200, o: { explode: 1 }, out: webp("public/scene/learn-exploded.webp") },
  ...["blade", "ratchet", "bit"].map((id) => ({
    name: id === "blade" ? "conveyor-poster" : `conveyor-poster-${id}`, group: "posters", kind: "conveyor", w: 1200, h: 900,
    o: { select: id, time: 2 }, out: webp(`public/scene/${id === "blade" ? "conveyor-poster" : `conveyor-poster-${id}`}.webp`, 74),
  })),
  ...IDS.map((id) => ({
    name: id === "drake-brave" ? "bay-poster" : `bay-poster-${id}`, group: "posters", kind: "bay", w: 1200, h: 900,
    o: { select: id, time: 2 }, out: webp(`public/scene/${id === "drake-brave" ? "bay-poster" : `bay-poster-${id}`}.webp`, 74),
  })),
  { name: "top-sprite", group: "sprite", kind: "sprite", w: 512, h: 512, alpha: true, o: {}, out: webp("public/scene/top-sprite.webp", 82) },
  ...IDS.map((id) => ({ name: `tile-${id}`, group: "tiles", kind: "studio", w: 512, h: 512, alpha: true, o: { select: id, alpha: true, fill: 0.88 }, out: webp(`public/tops/${id}.webp`, 84) })),
  ...IDS.map((id) => ({ name: `closeup-${id}`, group: "closeups", kind: "studio", w: 900, h: 900, o: { select: id, fill: 0.8 }, copy: `shots/v4/scene/closeup-${id}.png` })),
];

/* ---------- the capture page and its modules ---------- */

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/tokens.css">
<style>
@font-face { font-family: "Open Runde"; src: url("/fonts/OpenRunde-Semibold.woff2") format("woff2"); font-weight: 600; }
:root { --font-display: "Open Runde"; }
html, body { margin: 0; background: transparent; overflow: hidden; }
canvas { display: block; width: 100vw; height: 100vh; }
</style>
<script type="importmap">{ "imports": { "three": "/three/build/three.module.js", "three/addons/": "/three/examples/jsm/" } }</script>
</head><body><canvas id="c"></canvas><script type="module" src="/main.js"></script></body></html>`;

const MAIN = `
import * as E from "/m/engine";
import { createConveyorScene } from "/m/conveyor";
import { createBayScene } from "/m/bay";
const q = new URLSearchParams(location.search);
const o = JSON.parse(q.get("o") || "{}");
const make = { rail: E.createRailScene, parts: E.createPartsScene, sprite: E.createSpriteScene, studio: E.createStudioScene, conveyor: createConveyorScene, bay: createBayScene }[q.get("kind")];
const c = document.getElementById("c");
try {
  const h = await make(c, { dpr: 1, still: true, animate: false, ...o });
  h.resize(innerWidth, innerHeight);
  if (q.has("p")) h.setProgress(Number(q.get("p")));
  h.setVisible(true);
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 600));
  h.resize(innerWidth, innerHeight); // one more frame, after the fonts
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  document.title = "done";
} catch (e) {
  console.error(e);
  document.title = "error";
}
`;

const transpiled = new Map();
async function moduleFor(name) {
  const file = path.join(ROOT, "components/scene", `${name}.ts`);
  if (!fs.existsSync(file)) return null;
  if (!transpiled.has(name)) {
    const src = fs.readFileSync(file, "utf8");
    const out = await swc.transform(src, { filename: file, jsc: { parser: { syntax: "typescript" }, target: "es2022" }, module: { type: "es6" }, isModule: true, sourceMaps: false });
    transpiled.set(name, out.code);
  }
  return transpiled.get(name);
}

const TYPES = { ".js": "text/javascript", ".css": "text/css", ".glb": "model/gltf-binary", ".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png" };
function serveFile(res, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return void res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    try {
      if (url === "/") return void res.writeHead(200, { "content-type": "text/html" }).end(PAGE);
      if (url === "/main.js") return void res.writeHead(200, { "content-type": "text/javascript" }).end(MAIN);
      if (url === "/tokens.css") return serveFile(res, path.join(ROOT, "app/tokens.css"));
      if (url.startsWith("/fonts/")) return serveFile(res, path.join(ROOT, "app/fonts", path.basename(url)));
      if (url.startsWith("/three/")) return serveFile(res, path.join(ROOT, "node_modules/three", url.slice(7)));
      if (url.startsWith("/m/")) {
        const code = await moduleFor(url.slice(3).replace(/\.(ts|js)$/, ""));
        if (code == null) return void res.writeHead(404).end();
        return void res.writeHead(200, { "content-type": "text/javascript" }).end(code);
      }
      return serveFile(res, path.join(ROOT, "public", url));
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

/* ---------- headless Edge over CDP ---------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function startBrowser() {
  const port = 9600 + Math.floor(Math.random() * 300);
  const prof = fs.mkdtempSync(path.join(process.env.TEMP ?? "/tmp", "render-"));
  const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--no-first-run", "--hide-scrollbars",
    "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox", "about:blank"], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 80 && !list?.length; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { /* not up yet */ }
    await sleep(200);
  }
  const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pend = new Map();
  const errors = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) pend.get(d.id)(d), pend.delete(d.id);
    if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" "));
    if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  return {
    send, errors,
    close() {
      ws.close();
      proc.kill();
      setTimeout(() => fs.rmSync(prof, { recursive: true, force: true }), 500);
    },
  };
}

async function run(b, base, job) {
  await b.send("Emulation.setDeviceMetricsOverride", { width: job.w, height: job.h, deviceScaleFactor: 1, mobile: false });
  await b.send("Emulation.setDefaultBackgroundColorOverride", job.alpha ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
  const qs = new URLSearchParams({ kind: job.kind, o: JSON.stringify(job.o ?? {}) });
  if (job.p != null) qs.set("p", String(job.p));
  b.errors.length = 0;
  await b.send("Page.navigate", { url: `${base}/?${qs}` });
  const t0 = Date.now();
  let title = "";
  while (Date.now() - t0 < 120000) {
    await sleep(300);
    const r = await b.send("Runtime.evaluate", { expression: "document.title", returnByValue: true });
    title = r.result?.result?.value ?? "";
    if (title === "done" || title === "error") break;
  }
  if (title !== "done") throw new Error(`${job.name}: ${title || "timed out"} ${b.errors.join(" | ")}`);
  const shot = await b.send("Page.captureScreenshot", { format: "png" });
  const png = Buffer.from(shot.result.data, "base64");
  fs.mkdirSync(RAW, { recursive: true });
  fs.writeFileSync(path.join(RAW, `${job.name}.png`), png);
  if (job.out) {
    const file = path.join(ROOT, job.out.file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const info = await sharp(png).webp({ quality: job.out.q, effort: 6, alphaQuality: 90 }).toFile(file);
    console.log(job.out.file, `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(1)} KB`);
  }
  if (job.copy) {
    fs.mkdirSync(path.dirname(path.join(ROOT, job.copy)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, job.copy), png);
    console.log(job.copy);
  }
}

const want = process.argv.slice(2);
const jobs = want.length ? JOBS.filter((j) => want.includes(j.group) || want.includes(j.name)) : JOBS;
if (!jobs.length) throw new Error(`no job matches ${want.join(" ")}`);
await swc.loadBindings();
const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await startBrowser();
let failed = 0;
try {
  for (const job of jobs) {
    try {
      await run(browser, base, job);
    } catch (e) {
      failed++;
      console.error(String(e.message ?? e));
    }
  }
} finally {
  browser.close();
  server.close();
}
process.exitCode = failed ? 1 : 0;
