// Loads the supplied models and fits them to the scene. Engine chunk only (imports three and
// GLTFLoader); nothing here runs until a scene is near the viewport.
//
// Units: scene units throughout (see pose.ts). A top stands on its tip at the origin, spin axis +y,
// blade radius TOP_R (0.184). The stadium has the rail's centre at the origin, the floor centre at
// y = 0, rail tooth tips at RAIL_TIP_R (0.86), and its Xtreme zone at XTREME_AT.
//
// Caching: each file is fetched once per page (the response bytes are cached), and every call
// parses its own copy, so a scene can dispose everything it was given without breaking the next.
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import {
  STADIUM_SRC, STADIUM_SCALE, STADIUM_Y, RAIL_Y, XTREME_AT, TOP_SCALE, RAIL_BINS, RAIL_TOP, type PartId,
} from "./pose";
import { TOPS, STADIUM_URL, type TopId } from "./tops";

export { TOPS, type TopId } from "./tops";

/* ---------- fetch once ---------- */

const bytes = new Map<string, Promise<ArrayBuffer>>();

function fetchOnce(url: string, signal?: AbortSignal) {
  let p = bytes.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return r.arrayBuffer();
    });
    p.catch(() => bytes.delete(url)); // let a later visit retry
    bytes.set(url, p);
  }
  if (!signal) return p;
  return Promise.race([
    p,
    new Promise<never>((_, rej) => {
      if (signal.aborted) rej(signal.reason);
      signal.addEventListener("abort", () => rej(signal.reason), { once: true });
    }),
  ]);
}

async function parse(url: string, signal?: AbortSignal): Promise<GLTF> {
  const buf = await fetchOnce(url, signal);
  const gltf = await new GLTFLoader().parseAsync(buf, "");
  signal?.throwIfAborted();
  return gltf;
}

/** Free GPU-side resources of everything under `root` (geometries, materials, textures). */
export function disposeTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const m = obj as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      mat.dispose();
    }
  });
}

/* ---------- tops ---------- */

export interface TopModel {
  id: TopId;
  /** Add this to the scene. Tip at the origin, spin axis +y, scene units. */
  root: THREE.Group;
  /** The three parts, named "Blade", "Ratchet" and "Bit". Each sits at the origin in the assembled
   * pose, so moving one along +y lifts that part off the others. */
  parts: Record<PartId, THREE.Group>;
  /** The model's own rig, fitted to the same frame (a child of root). The meshes are baked out of
   * it, so posing these bones does not move the parts; sample them to drive the parts yourself. */
  bones: Record<string, THREE.Bone>;
  /** The model's clips ("spin", "explode" / "exploded view"), targeting the bones by name. */
  clips: THREE.AnimationClip[];
  /** How far each part rises at the widest point of the model's own explode clip (scene units). */
  explode: Record<PartId, number>;
  /** Frees geometries, materials and textures. Safe to call more than once. */
  dispose(): void;
}

const partOf = (name: string): PartId => (/^bit/i.test(name) ? "bit" : /^ratchet/i.test(name) ? "ratchet" : "blade");
const RENDER_ORDER: Record<PartId, number> = { bit: 1, ratchet: 2, blade: 3 };

/** Loads, bakes and fits a top. Rejects if the file cannot be fetched or parsed. */
export async function loadTop(id: TopId, signal?: AbortSignal): Promise<TopModel> {
  const info = TOPS.find((t) => t.id === id);
  if (!info) throw new Error(`unknown top ${id}`);
  const gltf = await parse(info.url, signal);
  const src = gltf.scene;
  src.updateMatrixWorld(true);

  // 1. Bake each (rigidly skinned) mesh into its rest pose, in model space.
  type Baked = { mesh: THREE.Mesh; part: PartId; bone: THREE.Bone | null };
  const baked: Baked[] = [];
  const skeletons = new Set<THREE.Skeleton>();
  const m4 = new THREE.Matrix4();
  src.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    let bone: THREE.Bone | null = null;
    const geo = mesh.geometry;
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
      const sk = mesh as THREE.SkinnedMesh;
      skeletons.add(sk.skeleton);
      sk.skeleton.update();
      // dominant joint (every supplied mesh is bound to exactly one)
      const J = geo.getAttribute("skinIndex"), W = geo.getAttribute("skinWeight");
      const tally = new Map<number, number>();
      for (let i = 0; i < J.count; i++)
        for (let k = 0; k < 4; k++) {
          const w = W.getComponent(i, k);
          if (w > 0) tally.set(J.getComponent(i, k), (tally.get(J.getComponent(i, k)) ?? 0) + w);
        }
      const j = [...tally].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
      bone = sk.skeleton.bones[j];
      // world = matrixWorld * bindMatrixInverse * (boneWorld * boneInverse) * bindMatrix
      m4.copy(sk.matrixWorld).multiply(sk.bindMatrixInverse).multiply(bone.matrixWorld).multiply(sk.skeleton.boneInverses[j]).multiply(sk.bindMatrix);
      geo.deleteAttribute("skinIndex");
      geo.deleteAttribute("skinWeight");
    } else m4.copy(mesh.matrixWorld);
    geo.applyMatrix4(m4);
    const plain = new THREE.Mesh(geo, mesh.material);
    plain.name = mesh.name;
    baked.push({ mesh: plain, part: partOf(mesh.name), bone });
  });
  if (!baked.length) throw new Error(`${id}: no meshes`);

  // 2. Fit: centre on the bit's axis, tip on y = 0, one scale for every top.
  const bitBox = new THREE.Box3();
  for (const b of baked) if (b.part === "bit") bitBox.union((b.mesh.geometry.computeBoundingBox(), b.mesh.geometry.boundingBox!));
  if (bitBox.isEmpty()) for (const b of baked) bitBox.union((b.mesh.geometry.computeBoundingBox(), b.mesh.geometry.boundingBox!));
  const c = bitBox.getCenter(new THREE.Vector3());
  const fit = new THREE.Matrix4().makeScale(TOP_SCALE, TOP_SCALE, TOP_SCALE).multiply(new THREE.Matrix4().makeTranslation(-c.x, -bitBox.min.y, -c.z));

  const root = new THREE.Group();
  root.name = "Top";
  const parts = { blade: new THREE.Group(), ratchet: new THREE.Group(), bit: new THREE.Group() } as Record<PartId, THREE.Group>;
  parts.blade.name = "Blade";
  parts.ratchet.name = "Ratchet";
  parts.bit.name = "Bit";
  root.add(parts.bit, parts.ratchet, parts.blade);
  for (const b of baked) {
    b.mesh.geometry.applyMatrix4(fit);
    b.mesh.geometry.computeBoundingBox();
    b.mesh.geometry.computeBoundingSphere();
    conditionMaterials(b.mesh, RENDER_ORDER[b.part], id);
    parts[b.part].add(b.mesh);
  }

  // 3. Keep the rig, fitted to the same frame, for sampling.
  const bones: Record<string, THREE.Bone> = {};
  const rig = new THREE.Group();
  rig.name = "Rig";
  fit.decompose(rig.position, rig.quaternion, rig.scale);
  const firstBone = [...skeletons][0]?.bones[0];
  if (firstBone) {
    let top: THREE.Object3D = firstBone;
    while (top.parent && top.parent !== src) top = top.parent;
    // the armature node may also have held the (now baked) meshes; drop those
    top.traverse((o) => (o as THREE.Bone).isBone && (bones[o.name] = o as THREE.Bone));
    for (const o of [...top.children]) if (!(o as THREE.Bone).isBone && !o.children.some((k) => (k as THREE.Bone).isBone)) top.remove(o);
    rig.add(top);
  }
  root.add(rig);
  for (const sk of skeletons) sk.dispose();

  const explode = measureExplode(gltf.animations, rig, baked, bones);

  let disposed = false;
  return {
    id, root, parts, bones, clips: gltf.animations, explode,
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeTree(root);
    },
  };
}

/**
 * What the Blender exports lost, per top: colours the source viewer shows that the glTF does not
 * carry (Dran Sword's clear dome is exported fully opaque and untinted; its bit reads dark blue).
 * sRGB hex; opacity only for the clear dome.
 */
const OVERRIDES: Partial<Record<TopId, Record<string, { color?: string; opacity?: number }>>> = {
  "dran-sword": { trans: { color: "#3cb4ff", opacity: 0.1 }, bit_plastic: { color: "#123da6" } },
};

const isGrey = (c: THREE.Color) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) < 0.04;
const isWhite = (c: THREE.Color) => c.r > 0.99 && c.g > 0.99 && c.b > 0.99;

/**
 * Turns the Blender export into materials that render like the source viewer:
 * - Blender writes see-through plastics as BLEND even when fully opaque, and BLEND meshes draw
 *   without depth, so a spinning top shows its inside. Opaque-enough plastics become opaque; the
 *   truly see-through ones keep blending but write depth and draw inner parts first.
 * - The clear dome over the face sticker ("trans") becomes thin clear plastic drawn after
 *   everything with no depth write, so the sticker shows through it instead of a white disc.
 * - Some coloured plastics carry their colour only in KHR sheen / specular colour, with the base
 *   colour left at white; three draws those white, so the sheen colour becomes the base colour.
 * - KHR sheen (white cloth fuzz in three), specular colour and ior 2 wash colours out and are
 *   dropped; clearcoat stays.
 * - Bare metals become polished chrome and every metal gets a stronger studio reflection, since a
 *   metal's colour only shows in what it reflects.
 * - Stickers keep their texture in sRGB; a BLEND sticker becomes alpha-tested so it sorts cleanly.
 */
function conditionMaterials(mesh: THREE.Mesh, order: number, id: TopId) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const over = OVERRIDES[id] ?? {};
  for (const m of mats) {
    const mat = m as THREE.MeshPhysicalMaterial;
    if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
    if (mat.userData.conditioned) {
      // shared by an earlier mesh: only the draw order is per mesh
      if (mat.name === "trans") mesh.renderOrder = 10;
      else if (mat.transparent) mesh.renderOrder = order;
      continue;
    }
    mat.userData.conditioned = true;
    const physical = (mat as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial;
    const sheenColor = physical && mat.sheen > 0 ? mat.sheenColor.clone() : null;
    if (physical) {
      mat.sheen = 0;
      mat.specularIntensity = 1;
      mat.specularColor.setRGB(1, 1, 1);
      mat.ior = 1.5;
    }
    if (mat.map) {
      mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.map.anisotropy = 4;
      mat.map.needsUpdate = true;
    }
    const o = over[mat.name];
    const dome = mat.name === "trans";

    if (dome) {
      // thin clear plastic over the sticker
      if (o?.color) mat.color.set(o.color);
      mat.transparent = true;
      mat.opacity = o?.opacity ?? Math.min(0.2, mat.opacity < 0.99 ? mat.opacity * 0.6 : 0.2);
      mat.metalness = 0;
      mat.roughness = 0.04;
      if (physical) mat.clearcoat = 1;
      mat.depthWrite = false;
      mat.side = THREE.FrontSide;
      mat.envMapIntensity = 1.6;
      mesh.renderOrder = 10;
    } else {
      if (mat.transparent && mat.map && mat.alphaTest === 0) {
        mat.transparent = false;
        mat.alphaTest = 0.5;
      }
      if (o?.color) mat.color.set(o.color);
      else if (sheenColor && isWhite(mat.color) && !isWhite(sheenColor)) {
        // the colour lived only in the sheen: use it, as a glossy plastic rather than a metal
        mat.color.copy(sheenColor);
        mat.metalness = Math.min(mat.metalness, 0.3);
      }
      if (mat.transparent) {
        if (mat.opacity >= 0.9) {
          mat.transparent = false;
          mat.opacity = 1;
          mat.depthWrite = true;
        } else {
          mat.depthWrite = true;
          mat.side = THREE.FrontSide;
          mesh.renderOrder = order;
        }
      }
      if (mat.metalness >= 0.9 && !mat.map && isGrey(mat.color)) {
        // bare steel: polished chrome
        mat.color.setScalar(0.62);
        mat.roughness = Math.min(mat.roughness, 0.12);
        mat.envMapIntensity = 2.4;
      } else if (mat.metalness > 0.5) mat.envMapIntensity = 2;
    }
    mat.needsUpdate = true;
  }
}

/** Lift of each part at the widest point of the model's explode clip, from its bones. */
function measureExplode(clips: THREE.AnimationClip[], rig: THREE.Object3D, baked: { part: PartId; bone: THREE.Bone | null }[], bones: Record<string, THREE.Bone>) {
  const out: Record<PartId, number> = { blade: 0, ratchet: 0, bit: 0 };
  const clip = clips.find((c) => /explo/i.test(c.name));
  if (!clip || !Object.keys(bones).length) return out;
  // each part follows its lowest bone
  const lead = {} as Record<PartId, THREE.Bone | undefined>;
  const p = new THREE.Vector3();
  rig.updateMatrixWorld(true);
  const restY = new Map<THREE.Bone, number>();
  for (const b of Object.values(bones)) restY.set(b, b.getWorldPosition(p).y);
  for (const { part, bone } of baked) if (bone && (!lead[part] || restY.get(bone)! < restY.get(lead[part]!)!)) lead[part] = bone;
  const saved = Object.values(bones).map((b) => [b, b.position.clone(), b.quaternion.clone(), b.scale.clone()] as const);
  const mixer = new THREE.AnimationMixer(rig);
  mixer.clipAction(clip).play();
  let best = -Infinity;
  for (let i = 0; i <= 48; i++) {
    mixer.setTime((i / 48) * clip.duration);
    rig.updateMatrixWorld(true);
    const lift = {} as Record<PartId, number>;
    let sum = 0;
    for (const id of ["blade", "ratchet", "bit"] as PartId[]) {
      const b = lead[id];
      lift[id] = b ? b.getWorldPosition(p).y - restY.get(b)! : 0;
      sum += lift[id];
    }
    if (sum > best) {
      best = sum;
      Object.assign(out, lift);
    }
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(rig);
  for (const [b, pos, q, s] of saved) b.position.copy(pos), b.quaternion.copy(q), b.scale.copy(s);
  rig.updateMatrixWorld(true);
  return out;
}

/* ---------- stadium ---------- */

export type StadiumSurface = "basin" | "print" | "pocket" | "marks" | "wall" | "rim" | "rail";

export interface StadiumModel {
  /** Add this to the scene. Fitted per pose.ts: rail centre at the origin, floor centre y = 0. */
  root: THREE.Group;
  /** Meshes by surface (the material names written by scripts/build-stadium.mjs). */
  surfaces: Record<StadiumSurface, THREE.Mesh[]>;
  /** Where the rail teeth are, per lighting bin (RAIL_BINS): x, z of the teeth in that bin, in
   * scene units, or NaN where the bin has no teeth. Glows and sparks can follow the real rail. */
  railPath: Float32Array;
  dispose(): void;
}

/** Loads and fits the stadium. The rail carries a `toothMask` attribute (1 on teeth, 0 on the rail). */
export async function loadStadium(signal?: AbortSignal): Promise<StadiumModel> {
  const gltf = await parse(STADIUM_URL, signal);
  const src = gltf.scene;
  const S = STADIUM_SRC;
  // source -> scene: centre on the rail, floor centre at 0, scale, stretch, turn the Xtreme zone round
  const fit = new THREE.Matrix4()
    .makeRotationY(XTREME_AT - S.xtremeAt)
    .multiply(new THREE.Matrix4().makeScale(STADIUM_SCALE, STADIUM_SCALE * STADIUM_Y, STADIUM_SCALE))
    .multiply(new THREE.Matrix4().makeTranslation(-S.centre[0], -S.floorCentreY, -S.centre[1]));
  src.updateMatrixWorld(true);

  const root = new THREE.Group();
  root.name = "Stadium";
  const surfaces = { basin: [], print: [], pocket: [], marks: [], wall: [], rim: [], rail: [] } as Record<StadiumSurface, THREE.Mesh[]>;
  const meshes: THREE.Mesh[] = [];
  src.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
  for (const mesh of meshes) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const name = (mat.name in surfaces ? mat.name : "basin") as StadiumSurface;
    // dequantize into plain float geometry in scene units (the rail is stretched above the floor)
    const g = mesh.geometry;
    const pos = g.getAttribute("position"), nrm = g.getAttribute("normal");
    const P = new Float32Array(pos.count * 3), N = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3(), n = new THREE.Vector3();
    const nm = new THREE.Matrix3();
    const toWorld = mesh.matrixWorld;
    const all = new THREE.Matrix4().multiplyMatrices(fit, toWorld);
    nm.getNormalMatrix(all);
    const railFloor = (S.floorRailY - S.floorCentreY) * STADIUM_SCALE * STADIUM_Y;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(all);
      n.fromBufferAttribute(nrm, i).applyMatrix3(nm);
      if (name === "rail" && v.y > railFloor) {
        v.y = railFloor + (v.y - railFloor) * RAIL_Y;
        n.y /= RAIL_Y;
      }
      n.normalize();
      P.set([v.x, v.y, v.z], i * 3);
      N.set([n.x, n.y, n.z], i * 3);
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.BufferAttribute(P, 3));
    out.setAttribute("normal", new THREE.BufferAttribute(N, 3));
    if (g.index) out.setIndex(g.index);
    const tooth = g.getAttribute("_tooth");
    if (tooth) out.setAttribute("toothMask", tooth);
    out.computeBoundingBox();
    out.computeBoundingSphere();
    g.dispose();
    const m = new THREE.Mesh(out, mat);
    m.name = name;
    surfaces[name].push(m);
    root.add(m);
  }

  // where the teeth are, per bin
  const railPath = new Float32Array(RAIL_BINS * 2);
  const acc = new Float64Array(RAIL_BINS * 3);
  for (const m of surfaces.rail) {
    const P = m.geometry.getAttribute("position"), T = m.geometry.getAttribute("toothMask");
    if (!T) continue;
    for (let i = 0; i < P.count; i++) {
      if (T.getX(i) < 0.5 || P.getY(i) < RAIL_TOP - 0.01) continue; // tooth tops only
      const x = P.getX(i), z = P.getZ(i);
      let th = Math.atan2(-z, x);
      if (th < 0) th += Math.PI * 2;
      const b = Math.min(RAIL_BINS - 1, Math.floor((th / (Math.PI * 2)) * RAIL_BINS));
      acc[b * 3] += x;
      acc[b * 3 + 1] += z;
      acc[b * 3 + 2]++;
    }
  }
  for (let b = 0; b < RAIL_BINS; b++) {
    const k = acc[b * 3 + 2];
    railPath[b * 2] = k ? acc[b * 3] / k : NaN;
    railPath[b * 2 + 1] = k ? acc[b * 3 + 1] / k : NaN;
  }

  let disposed = false;
  return {
    root, surfaces, railPath,
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeTree(root);
    },
  };
}

/* ---------- Kenney kits ---------- */

export interface KitModel {
  /** A fresh copy of a piece, as authored on Kenney's 1-unit grid (origin on the floor). It shares
   * geometry and materials with the kit, so disposing the kit frees every copy. */
  piece(name: string): THREE.Group;
  dispose(): void;
}

/** Loads a kit GLB written by scripts/build-kenney.mjs (each piece under a node "piece_<name>"). */
export async function loadKit(url: string, signal?: AbortSignal): Promise<KitModel> {
  const gltf = await parse(url, signal);
  const templates = new Map<string, THREE.Object3D>();
  for (const c of gltf.scene.children) if (c.name.startsWith("piece_")) templates.set(c.name.slice(6), c);
  let disposed = false;
  return {
    piece(name) {
      const t = templates.get(name);
      if (!t) throw new Error(`${url}: no piece ${name}`);
      const g = new THREE.Group();
      g.name = name;
      for (const c of t.children) g.add(c.clone(true));
      return g;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeTree(gltf.scene);
    },
  };
}
