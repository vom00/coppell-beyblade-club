// Packs the Kenney kit pieces each scene uses into one GLB per scene: node scripts/build-kenney.mjs
//
// In:  assets-src/kenney/factory-kit/Models/GLB format/*.glb       (CC0, read-only)
//      assets-src/kenney/space-station-kit/Models/GLB format/*.glb (CC0, read-only)
// Out: public/models/kenney/factory/factory-line.glb   (PartsConveyor)
//      public/models/kenney/space/display-bay.glb      (DisplayBay)
//      plus each kit's License.txt beside its GLB
//
// What it does, and nothing more:
// - Copies the listed pieces into one file, each under a top-level node named after the piece
//   (`scene.getObjectByName("piece_conveyor-stripe-sides")`). Geometry, node transforms and the
//   pieces' own sub-nodes (robot arm joints, cog) are kept as authored, on Kenney's 1-unit grid.
// - Drops the TANGENT attribute (no normal maps in these kits) and any sub-node listed in DROP.
// - The kits' GLBs point at an external Textures/colormap.png, a sheet of flat colour swatches. It is
//   embedded recoloured, once per "tone" a file uses. Each kit has a base tone; a piece (or one of
//   its sub-nodes) can take another, which gets its own copy of the sheet and its own material:
//     factory: violet greys -> charcoal and gunmetal, orange and amber trim -> hazard yellow;
//              the scanner arch and the robot arm's joints -> crest red; boxes -> dull cardboard.
//     space:   violet greys -> navy and steel blue; window and pipe trim -> cyan, the display
//              table's trim a darker cyan, each with a matching emissive sheet so it glows;
//              banner pillars and containers -> crest red.
//   Everywhere: the kits' green becomes the Xtreme green; light blue glass and white stay.
// - Pieces that share a tone share one material, plus the factory kit's glass.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KITS = path.join(ROOT, "assets-src/kenney");

const SETS = [
  {
    kit: "factory-kit",
    out: "public/models/kenney/factory/factory-line.glb",
    base: "gunmetal",
    pieces: [
      "floor-large", "conveyor-long-stripe-sides", ["scanner-high", "arch"], "machine", "machine-window",
      "robot-arm-a", "screen-panel-wide", "cog-a", "warning-orange", ["box-small", "cardboard"], ["box-large", "cardboard"],
    ],
    // the robot arm's joints, by sub-node name
    nodeTones: { "element-b": "arch", "element-d": "arch", "element-f": "arch" },
  },
  {
    kit: "space-station-kit",
    out: "public/models/kenney/space/display-bay.glb",
    base: "navy",
    pieces: [
      "floor-panel", "floor", "wall", ["wall-window", "cyan"], "wall-banner", ["wall-pillar-banner", "redPanel"], "wall-corner",
      ["table-display-small", "pedestal"], "computer-wide", "computer-screen", ["container-tall", "redPanel"], ["container", "redPanel"],
      "pipe", ["pipe-ring-colored", "cyan"],
    ],
    drop: ["planet", "planet-ring"],
  },
];

/* ---------- GLB in and out ---------- */

function readGlb(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file}: not a GLB`);
  let off = 12, json, bin;
  while (off < b.length) {
    const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
    const chunk = b.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8"));
    else if (type === 0x004e4942) bin = chunk;
    off += 8 + len;
  }
  return { json, bin };
}

function writeGlb(file, json, bin) {
  const pad = (buf, byte) => {
    const n = (4 - (buf.length % 4)) % 4;
    return n ? Buffer.concat([buf, Buffer.alloc(n, byte)]) : buf;
  };
  const j = pad(Buffer.from(JSON.stringify(json), "utf8"), 0x20);
  const bb = pad(bin, 0);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + 8 + j.length + 8 + bb.length, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(j.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(bb.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([head, jh, j, bh, bb]));
}

/* ---------- recolour the swatch sheet ---------- */

function rgbToHsl(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
// site colours as swatch makers; each keeps a little of the swatch's own light and dark
const gunmetal = (l) => hslToRgb(214, 0.1, lerp(0.1, 0.3, (l - 0.3) / 0.4));
const hazard = (l) => hslToRgb(45, 0.95, lerp(0.44, 0.56, (l - 0.4) / 0.4));
const crest = (l) => hslToRgb(358, 0.86, lerp(0.3, 0.5, (l - 0.3) / 0.45));
const cardboard = (l) => hslToRgb(28, 0.3, lerp(0.24, 0.38, (l - 0.4) / 0.4));
const crestDeep = (l) => hslToRgb(358, 0.8, lerp(0.24, 0.4, (l - 0.3) / 0.45));
const navy = (l) => hslToRgb(218, 0.45, lerp(0.06, 0.26, (l - 0.38) / 0.47));
const steel = (l) => hslToRgb(210, 0.4, lerp(0.2, 0.34, (l - 0.5) / 0.3));
const cyan = (l) => hslToRgb(188, 0.9, lerp(0.3, 0.38, (l - 0.4) / 0.4));
const xtreme = (l) => hslToRgb(103, 1, Math.min(0.62, l));
const cyanGlow = () => hslToRgb(188, 1, 0.24);

/** Swatch kinds, from hue, saturation and lightness. */
function kind(h, s, l) {
  if (s < 0.08) return "neutral"; // greys, black, white
  if (h >= 195 && h <= 225 && l > 0.85) return "glass"; // light blue glass, screens, lights
  if (h >= 90 && h <= 170) return "green";
  if ((h < 12 || h >= 345) && s > 0.45) return "red";
  if (h < 60 || h >= 345) return "warm"; // orange, amber, yellow, peach, tan
  if (h >= 200 && h <= 222 && s > 0.45) return "blue"; // saturated blues (the display table top)
  return "grey"; // the kits' violet and blue greys, pink, purple
}

/** Tones: a maker per swatch kind (grey is the fallback), and optionally what glows. */
const TONES = {
  gunmetal: { warm: hazard, grey: gunmetal },
  arch: { warm: hazard, grey: crestDeep }, // the scanner arch and the robot arm joints
  cardboard: { warm: cardboard, grey: gunmetal },
  navy: { warm: cyan, grey: navy, blue: steel },
  cyan: { warm: cyan, grey: navy, blue: steel, glow: { warm: cyanGlow } },
  // the display table: the same cyan, darker, so the lit top leads
  pedestal: { warm: (l) => hslToRgb(188, 0.85, lerp(0.2, 0.26, (l - 0.4) / 0.4)), grey: navy, blue: steel, glow: { warm: () => hslToRgb(188, 1, 0.12) } },
  redPanel: { warm: crestDeep, grey: navy, blue: steel },
};

function recolour(tone, r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  const k = kind(h, s, l);
  const t = TONES[tone];
  if (k === "neutral" || k === "glass") return [r, g, b];
  if (k === "green") return xtreme(l);
  if (k === "red") return crest(0.55);
  return (t[k] ?? t.grey)(l);
}
function glowOf(tone, r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  const make = TONES[tone].glow?.[kind(h, s, l)];
  return make ? make(l) : [0, 0, 0];
}

async function recolourPng(file, fn) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  const cache = new Map();
  for (let i = 0; i < out.length; i += 4) {
    const key = (out[i] << 16) | (out[i + 1] << 8) | out[i + 2];
    let c = cache.get(key);
    if (!c) {
      c = fn(out[i] / 255, out[i + 1] / 255, out[i + 2] / 255).map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255));
      cache.set(key, c);
    }
    out[i] = c[0];
    out[i + 1] = c[1];
    out[i + 2] = c[2];
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .removeAlpha()
    .png({ compressionLevel: 9, palette: true, colours: 256 })
    .toBuffer();
}

/* ---------- merge ---------- */

async function build(set) {
  const dir = path.join(KITS, set.kit, "Models/GLB format");
  const drop = new Set(set.drop ?? []);
  const out = {
    asset: { version: "2.0", generator: "scripts/build-kenney.mjs", extras: { source: `Kenney ${set.kit} (CC0)` } },
    scene: 0,
    scenes: [{ name: path.basename(set.out, ".glb"), nodes: [] }],
    nodes: [], meshes: [], accessors: [], bufferViews: [], materials: [], textures: [], images: [], samplers: [],
    buffers: [{ byteLength: 0 }],
  };
  const chunks = [];
  let binLen = 0;
  const addBytes = (buf) => {
    const padN = (4 - (binLen % 4)) % 4;
    if (padN) chunks.push(Buffer.alloc(padN)), (binLen += padN);
    const at = binLen;
    chunks.push(buf);
    binLen += buf.length;
    return at;
  };

  // one recoloured swatch sheet per tone used, and an emissive sheet for tones that glow
  const sheet = path.join(dir, "Textures/colormap.png");
  const texIndex = new Map(); // "tone" or "tone-glow" -> texture index
  const texture = async (key, fn) => {
    if (texIndex.has(key)) return texIndex.get(key);
    const png = await recolourPng(sheet, fn);
    out.bufferViews.push({ buffer: 0, byteOffset: addBytes(png), byteLength: png.length });
    out.images.push({ name: `colormap-${key}`, mimeType: "image/png", bufferView: out.bufferViews.length - 1 });
    out.textures.push({ name: `colormap-${key}`, source: out.images.length - 1, sampler: 0 });
    texIndex.set(key, out.textures.length - 1);
    return out.textures.length - 1;
  };
  let samplerSet = false;
  const matIndex = new Map(); // "material|tone" -> index in out

  for (const entry of set.pieces) {
    const [name, pieceTone] = Array.isArray(entry) ? entry : [entry, set.base];
    const { json: j, bin } = readGlb(path.join(dir, `${name}.glb`));
    if (!samplerSet) {
      out.samplers.push({ ...(j.samplers?.[0] ?? {}), wrapS: 33071, wrapT: 33071 });
      samplerSet = true;
    }
    // materials: dedupe by name and tone; the swatch material points at its tone's sheet
    const material = async (i, tone) => {
      const m = j.materials[i];
      const swatch = !!m.pbrMetallicRoughness?.baseColorTexture;
      const key = swatch ? `${m.name}|${tone}` : m.name;
      if (matIndex.has(key)) return matIndex.get(key);
      const copy = structuredClone(m);
      if (swatch) {
        copy.name = `${m.name}-${tone}`;
        copy.pbrMetallicRoughness.baseColorTexture = { index: await texture(tone, (r, g, b) => recolour(tone, r, g, b)) };
        if (TONES[tone].glow) {
          copy.emissiveTexture = { index: await texture(`${tone}-glow`, (r, g, b) => glowOf(tone, r, g, b)) };
          copy.emissiveFactor = [1, 1, 1];
        }
      }
      out.materials.push(copy);
      matIndex.set(key, out.materials.length - 1);
      return out.materials.length - 1;
    };
    // accessors and their buffer views, copied on first use
    const bvMap = new Map(), accMap = new Map();
    const accessor = (i) => {
      if (accMap.has(i)) return accMap.get(i);
      const a = structuredClone(j.accessors[i]);
      const bvi = a.bufferView;
      if (!bvMap.has(bvi)) {
        const bv = j.bufferViews[bvi];
        const bytes = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
        const nb = { buffer: 0, byteOffset: addBytes(Buffer.from(bytes)), byteLength: bv.byteLength };
        if (bv.byteStride) nb.byteStride = bv.byteStride;
        if (bv.target) nb.target = bv.target;
        out.bufferViews.push(nb);
        bvMap.set(bvi, out.bufferViews.length - 1);
      }
      a.bufferView = bvMap.get(bvi);
      out.accessors.push(a);
      accMap.set(i, out.accessors.length - 1);
      return out.accessors.length - 1;
    };
    const meshMap = new Map();
    const mesh = async (i, tone) => {
      const key = `${i}|${tone}`;
      if (meshMap.has(key)) return meshMap.get(key);
      const m = j.meshes[i];
      const primitives = [];
      for (const p of m.primitives) {
        const attributes = {};
        for (const [k, v] of Object.entries(p.attributes)) if (k !== "TANGENT") attributes[k] = accessor(v);
        const q = { attributes, material: await material(p.material, tone) };
        if (p.indices != null) q.indices = accessor(p.indices);
        if (p.mode != null) q.mode = p.mode;
        primitives.push(q);
      }
      out.meshes.push({ name: m.name, primitives });
      meshMap.set(key, out.meshes.length - 1);
      return out.meshes.length - 1;
    };
    const node = async (i, tone) => {
      const n = j.nodes[i];
      const own = set.nodeTones?.[n.name] ?? tone;
      const copy = { name: n.name };
      for (const k of ["translation", "rotation", "scale", "matrix"]) if (n[k]) copy[k] = n[k];
      if (n.mesh != null) copy.mesh = await mesh(n.mesh, own);
      const kids = [];
      for (const c of n.children ?? []) if (!drop.has(j.nodes[c].name)) kids.push(await node(c, tone));
      if (kids.length) copy.children = kids;
      out.nodes.push(copy);
      return out.nodes.length - 1;
    };
    const roots = [];
    for (const r of j.scenes[j.scene ?? 0].nodes) if (!drop.has(j.nodes[r].name)) roots.push(await node(r, pieceTone));
    // a wrapper named after the piece, so the engine can find and clone it
    out.nodes.push({ name: `piece_${name}`, children: roots });
    out.scenes[0].nodes.push(out.nodes.length - 1);
  }

  const bin = Buffer.concat(chunks);
  out.buffers[0].byteLength = bin.length;
  const file = path.join(ROOT, set.out);
  writeGlb(file, out, bin);
  fs.copyFileSync(path.join(KITS, set.kit, "License.txt"), path.join(path.dirname(file), "License.txt"));
  console.log(set.out, `${(fs.statSync(file).size / 1024).toFixed(1)} KB`, `${set.pieces.length} pieces`, `sheets: ${[...texIndex.keys()].join(", ")}`);
}

for (const set of SETS) await build(set);
