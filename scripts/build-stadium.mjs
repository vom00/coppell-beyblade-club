// Cleans the supplied stadium model for the web: node scripts/build-stadium.mjs
//
// In:  assets-src/models/stadium/source/animation.glb (read-only, 3.6 MB, 147k triangles)
// Out: public/models/stadium.glb
//
// What it does, and nothing more: bakes every node transform into its mesh, drops the empty
// Sketchfab nodes and the two flat "Cube" quads that face down and never show, merges the
// remaining meshes into one mesh per surface (basin, print, pocket, marks, wall, rim, rail),
// removes rail triangles that sit wholly below the stadium floor, and tags each rail vertex as
// tooth or rail body (a `_TOOTH` attribute) so the scene can light teeth individually. Positions
// and normals are stored quantized (KHR_mesh_quantization), which three's GLTFLoader reads
// natively. The rail teeth keep every triangle above the floor; nothing is simplified.
// Units and orientation stay as authored; components/scene/assets.ts fits the result to the scene.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets-src/models/stadium/source/animation.glb");
const OUT = path.join(ROOT, "public/models/stadium.glb");

globalThis.self ??= globalThis; // GLTFLoader touches `self` (no textures in this file)

const buf = fs.readFileSync(SRC);
const gltf = await new Promise((res, rej) =>
  new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "", res, rej),
);
gltf.scene.updateMatrixWorld(true);

// Surface classes, by source mesh name. Anything not listed is dropped (and reported).
const CLASS = {
  Circle003: "basin", Circle007: "basin", Circle: "basin", Circle001: "basin", // centre cone, floor ring, ring under the rail
  Circle005: "print", // the printed ring on the floor
  Circle010: "pocket", // floor of the two Xtreme zone pockets
  Circle010_1: "marks", // the arrow marks in the pockets
  Plane001_2: "wall", Plane002: "wall", // the slope up from the floor, and the upper slope to the rim
  Plane001_1: "rim", // the octagonal outer shell
  "riel_(1)": "rail", // the toothed Xtreme line
};
const FLOOR_AT_RAIL = 5.5; // source units; rail triangles wholly below this are hidden by the floor

const parts = {};
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const cls = CLASS[o.name];
  if (!cls) {
    console.log(`drop ${o.name} (${o.geometry.index ? o.geometry.index.count / 3 : 0} tris)`);
    return;
  }
  const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
  for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
  if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
  // a mirrored node (negative determinant) is drawn with flipped winding by three; baking loses
  // that, so flip the triangles here to keep their front faces pointing the way their normals do
  if (o.matrixWorld.determinant() < 0) {
    const I = g.index;
    for (let i = 0; i < I.count; i += 3) {
      const b = I.getX(i + 1);
      I.setX(i + 1, I.getX(i + 2));
      I.setX(i + 2, b);
    }
  }
  (parts[cls] ??= []).push(g);
});

/** Merge indexed geometries (position + normal only). */
function merge(list) {
  let nv = 0, ni = 0;
  for (const g of list) {
    nv += g.attributes.position.count;
    ni += g.index.count;
  }
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    const P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) {
      pos.set([P.getX(i), P.getY(i), P.getZ(i)], (ov + i) * 3);
      nrm.set([N.getX(i), N.getY(i), N.getZ(i)], (ov + i) * 3);
    }
    for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + ov;
    ov += P.count;
    oi += g.index.count;
  }
  return { pos, nrm, idx };
}

/** Keep only the listed triangles and the vertices they use. */
function compact(m, keepTri) {
  const map = new Int32Array(m.pos.length / 3).fill(-1);
  const idx = [];
  let nv = 0;
  for (let t = 0; t < m.idx.length; t += 3) {
    if (!keepTri(t)) continue;
    for (let k = 0; k < 3; k++) {
      const v = m.idx[t + k];
      if (map[v] < 0) map[v] = nv++;
      idx.push(map[v]);
    }
  }
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3);
  for (let v = 0; v < map.length; v++) {
    if (map[v] < 0) continue;
    pos.set(m.pos.subarray(v * 3, v * 3 + 3), map[v] * 3);
    nrm.set(m.nrm.subarray(v * 3, v * 3 + 3), map[v] * 3);
  }
  return { pos, nrm, idx: Uint32Array.from(idx) };
}

const meshes = {};
for (const [cls, list] of Object.entries(parts)) meshes[cls] = merge(list);

// Rail: drop what the floor hides.
{
  const m = meshes.rail;
  const before = m.idx.length / 3;
  meshes.rail = compact(m, (t) => !(m.pos[m.idx[t] * 3 + 1] < FLOOR_AT_RAIL && m.pos[m.idx[t + 1] * 3 + 1] < FLOOR_AT_RAIL && m.pos[m.idx[t + 2] * 3 + 1] < FLOOR_AT_RAIL));
  console.log(`rail: ${before} -> ${meshes.rail.idx.length / 3} tris, ${meshes.rail.pos.length / 3} verts`);
}

// Rail: tooth mask. Rasterise the rail's footprint seen from above, open it with a square a little
// wider than a tooth (erode, then dilate) so only the solid rail band survives; what the opening
// removed is teeth. Works on the round run and round the Xtreme zone lobes alike.
const tooth = (() => {
  const m = meshes.rail;
  const CELL = 0.04, OPEN = 4; // source units per cell; half-width of the opening square in cells
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < m.pos.length; i += 3) {
    x0 = Math.min(x0, m.pos[i]); x1 = Math.max(x1, m.pos[i]);
    z0 = Math.min(z0, m.pos[i + 2]); z1 = Math.max(z1, m.pos[i + 2]);
  }
  x0 -= 1; z0 -= 1; x1 += 1; z1 += 1;
  const W = Math.ceil((x1 - x0) / CELL), H = Math.ceil((z1 - z0) / CELL);
  let grid = new Uint8Array(W * H);
  const cx = (x) => (x - x0) / CELL, cz = (z) => (z - z0) / CELL;
  for (let t = 0; t < m.idx.length; t += 3) {
    const a = m.idx[t] * 3, b = m.idx[t + 1] * 3, c = m.idx[t + 2] * 3;
    const ax = cx(m.pos[a]), az = cz(m.pos[a + 2]), bx = cx(m.pos[b]), bz = cz(m.pos[b + 2]), qx = cx(m.pos[c]), qz = cz(m.pos[c + 2]);
    const area = (bx - ax) * (qz - az) - (qx - ax) * (bz - az);
    if (Math.abs(area) < 1e-9) continue; // vertical faces add nothing to the footprint
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, qx))), maxX = Math.min(W - 1, Math.ceil(Math.max(ax, bx, qx)));
    const minZ = Math.max(0, Math.floor(Math.min(az, bz, qz))), maxZ = Math.min(H - 1, Math.ceil(Math.max(az, bz, qz)));
    for (let z = minZ; z <= maxZ; z++)
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, pz = z + 0.5;
        const w0 = ((bx - px) * (qz - pz) - (qx - px) * (bz - pz)) / area;
        const w1 = ((qx - px) * (az - pz) - (ax - px) * (qz - pz)) / area;
        if (w0 >= -0.02 && w1 >= -0.02 && 1 - w0 - w1 >= -0.02) grid[z * W + x] = 1;
      }
  }
  const pass = (src, r, op) => {
    // separable square min/max
    const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++) {
        let v = op === "min" ? 1 : 0;
        for (let k = -r; k <= r; k++) {
          const xx = x + k;
          const s = xx < 0 || xx >= W ? 0 : src[z * W + xx];
          v = op === "min" ? Math.min(v, s) : Math.max(v, s);
        }
        tmp[z * W + x] = v;
      }
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++) {
        let v = op === "min" ? 1 : 0;
        for (let k = -r; k <= r; k++) {
          const zz = z + k;
          const s = zz < 0 || zz >= H ? 0 : tmp[zz * W + x];
          v = op === "min" ? Math.min(v, s) : Math.max(v, s);
        }
        out[z * W + x] = v;
      }
    return out;
  };
  const body = pass(pass(grid, OPEN, "min"), OPEN + 1, "max");
  const flag = new Uint8Array(m.pos.length / 3);
  let n = 0;
  for (let v = 0; v < flag.length; v++) {
    const x = Math.floor(cx(m.pos[v * 3])), z = Math.floor(cz(m.pos[v * 3 + 2]));
    const inBody = x >= 0 && z >= 0 && x < W && z < H && body[z * W + x];
    // tooth tops and faces are outside the body band; the rail's own top stays body
    if (!inBody && m.pos[v * 3 + 1] > FLOOR_AT_RAIL) {
      flag[v] = 255;
      n++;
    }
  }
  console.log(`rail teeth: ${n} of ${flag.length} vertices tagged`);
  return flag;
})();

/* ---------- GLB writer (quantized) ---------- */

const MATERIALS = {
  basin: { color: [0.02, 0.018, 0.018], rough: 0.4 },
  print: { color: [0.08, 0.07, 0.07], rough: 0.6 },
  pocket: { color: [0.0, 0.0, 0.0], rough: 0.7 },
  marks: { color: [0.8, 0.8, 0.8], rough: 0.6 },
  wall: { color: [0.03, 0.025, 0.025], rough: 0.4 },
  rim: { color: [0.05, 0.045, 0.045], rough: 0.5 },
  rail: { color: [0.6, 0.6, 0.6], rough: 0.5 },
};
const ORDER = ["basin", "print", "pocket", "marks", "wall", "rim", "rail"];

const chunks = [];
let offset = 0;
const json = {
  asset: { version: "2.0", generator: "coppell-beyblade-club scripts/build-stadium.mjs" },
  extensionsUsed: ["KHR_mesh_quantization"],
  extensionsRequired: ["KHR_mesh_quantization"],
  scene: 0,
  scenes: [{ name: "Stadium", nodes: [] }],
  nodes: [],
  meshes: [],
  materials: [],
  accessors: [],
  bufferViews: [],
  buffers: [],
};
function view(bytes, target, stride) {
  const pad = (4 - (offset % 4)) % 4;
  if (pad) chunks.push(new Uint8Array(pad)), (offset += pad);
  json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, ...(target ? { target } : {}), ...(stride ? { byteStride: stride } : {}) });
  chunks.push(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  offset += bytes.byteLength;
  return json.bufferViews.length - 1;
}
function accessor(a) {
  json.accessors.push(a);
  return json.accessors.length - 1;
}

for (const cls of ORDER) {
  const whole = meshes[cls];
  if (!whole) continue;
  // positions: normalized int16 inside the mesh's bounding cube; the node carries the dequantize transform
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < whole.pos.length; i += 3) for (let k = 0; k < 3; k++) (lo[k] = Math.min(lo[k], whole.pos[i + k])), (hi[k] = Math.max(hi[k], whole.pos[i + k]));
  const ctr = lo.map((v, k) => (v + hi[k]) / 2);
  const half = Math.max(...hi.map((v, k) => (v - lo[k]) / 2)) || 1;
  const flags = cls === "rail" ? tooth : null;
  // split into primitives of at most 65535 vertices so every index buffer is 16-bit
  const prims = [];
  for (let t0 = 0; t0 < whole.idx.length; ) {
    const seen = new Set();
    let t1 = t0;
    while (t1 < whole.idx.length) {
      const add = [whole.idx[t1], whole.idx[t1 + 1], whole.idx[t1 + 2]].filter((v) => !seen.has(v)).length;
      if (seen.size + add > 65535) break;
      for (let k = 0; k < 3; k++) seen.add(whole.idx[t1 + k]);
      t1 += 3;
    }
    const sub = { pos: whole.pos, nrm: whole.nrm, idx: whole.idx.subarray(t0, t1), flag: flags };
    // compact this slice (and its tooth flags) to its own vertices
    const map = new Map();
    const idx = new Uint16Array(t1 - t0);
    for (let i = 0; i < idx.length; i++) {
      const v = sub.idx[i];
      if (!map.has(v)) map.set(v, map.size);
      idx[i] = map.get(v);
    }
    const nv = map.size, pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), fl = new Uint8Array(nv);
    for (const [v, j] of map) {
      pos.set(whole.pos.subarray(v * 3, v * 3 + 3), j * 3);
      nrm.set(whole.nrm.subarray(v * 3, v * 3 + 3), j * 3);
      if (flags) fl[j] = flags[v];
    }
    prims.push({ pos, nrm, idx, fl });
    t0 = t1;
  }
  const mat = MATERIALS[cls];
  json.materials.push({ name: cls, pbrMetallicRoughness: { baseColorFactor: [...mat.color, 1], metallicFactor: 0, roughnessFactor: mat.rough } });
  const primitives = [];
  for (const m of prims) {
    const nv = m.pos.length / 3;
    const qp = new Int16Array(nv * 4); // stride 8
    const qmin = [32767, 32767, 32767], qmax = [-32767, -32767, -32767];
    for (let v = 0; v < nv; v++)
      for (let k = 0; k < 3; k++) {
        const q = Math.max(-32767, Math.min(32767, Math.round(((m.pos[v * 3 + k] - ctr[k]) / half) * 32767)));
        qp[v * 4 + k] = q;
        qmin[k] = Math.min(qmin[k], q);
        qmax[k] = Math.max(qmax[k], q);
      }
    const qn = new Int8Array(nv * 4); // stride 4
    for (let v = 0; v < nv; v++) {
      const x = m.nrm[v * 3], y = m.nrm[v * 3 + 1], z = m.nrm[v * 3 + 2];
      const l = Math.hypot(x, y, z) || 1;
      qn[v * 4] = Math.round((x / l) * 127);
      qn[v * 4 + 1] = Math.round((y / l) * 127);
      qn[v * 4 + 2] = Math.round((z / l) * 127);
    }
    const attributes = {
      POSITION: accessor({ bufferView: view(qp, 34962, 8), componentType: 5122, normalized: true, count: nv, type: "VEC3", min: qmin, max: qmax }),
      NORMAL: accessor({ bufferView: view(qn, 34962, 4), componentType: 5120, normalized: true, count: nv, type: "VEC3" }),
    };
    if (flags) {
      const t4 = new Uint8Array(nv * 4);
      for (let v = 0; v < nv; v++) t4[v * 4] = m.fl[v];
      attributes._TOOTH = accessor({ bufferView: view(t4, 34962, 4), componentType: 5121, normalized: true, count: nv, type: "SCALAR" });
    }
    const indices = accessor({ bufferView: view(m.idx, 34963), componentType: 5123, count: m.idx.length, type: "SCALAR" });
    primitives.push({ attributes, indices, material: json.materials.length - 1 });
  }
  json.meshes.push({ name: cls, primitives });
  json.nodes.push({ name: cls, mesh: json.meshes.length - 1, translation: ctr, scale: [half, half, half] });
  json.scenes[0].nodes.push(json.nodes.length - 1);
  console.log(`${cls}: ${prims.map((p) => `${p.pos.length / 3} verts / ${p.idx.length / 3} tris`).join(" + ")}`);
}

const pad4 = (n) => (4 - (n % 4)) % 4;
const binLen = offset + pad4(offset);
json.buffers.push({ byteLength: binLen });
let jsonBytes = Buffer.from(JSON.stringify(json), "utf8");
jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc(pad4(jsonBytes.length), 0x20)]);
const bin = Buffer.concat([...chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength)), Buffer.alloc(binLen - offset)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonBytes.length + 8 + bin.length, 8);
const jh = Buffer.alloc(8);
jh.writeUInt32LE(jsonBytes.length, 0);
jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8);
bh.writeUInt32LE(bin.length, 0);
bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(OUT, Buffer.concat([header, jh, jsonBytes, bh, bin]));
console.log(`wrote ${path.relative(ROOT, OUT)} ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB (source ${(buf.length / 1024).toFixed(0)} KB)`);
