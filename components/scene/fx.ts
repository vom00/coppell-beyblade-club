// Light and speed effects. They read layout constants from pose.ts and positions handed to them;
// the only thing taken from a model is where the real rail's teeth are (StadiumModel.railPath).
// Every update() is stateless: the same inputs draw the same frame, so fast or reversed scrolling
// cannot leave anything behind.
import * as THREE from "three";
import { RAIL_BINS, RAIL_TOP, RAIL_TIP_R, binAngle } from "./pose";
import { glowTexture, shadowTexture } from "./materials";

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* ---------- rail teeth that light up ---------- */

/**
 * The lit amount per rail bin, as a one-row texture the rail material reads (so the real teeth
 * light individually), plus a soft additive glow above each lit stretch of teeth.
 */
export class RailGlow {
  readonly texture: THREE.DataTexture;
  readonly glow: THREE.Points;
  private data = new Uint8Array(RAIL_BINS * 4);
  private glowCol: Float32Array;
  private last = new Float32Array(RAIL_BINS).fill(-1);

  /** railPath: x, z per bin of the real teeth (NaN where none); falls back to the tip circle. */
  constructor(private lit: THREE.Color, glowMap: THREE.Texture, railPath?: Float32Array) {
    this.texture = new THREE.DataTexture(this.data, RAIL_BINS, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.magFilter = this.texture.minFilter = THREE.LinearFilter;
    this.texture.needsUpdate = true;
    const pos = new Float32Array(RAIL_BINS * 3);
    for (let i = 0; i < RAIL_BINS; i++) {
      const th = binAngle(i);
      let x = railPath?.[i * 2] ?? NaN, z = railPath?.[i * 2 + 1] ?? NaN;
      if (Number.isNaN(x)) (x = RAIL_TIP_R * Math.cos(th)), (z = -RAIL_TIP_R * Math.sin(th));
      pos.set([x * 0.99, RAIL_TOP + 0.006, z * 0.99], i * 3);
    }
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.glowCol = new Float32Array(RAIL_BINS * 3);
    gGeo.setAttribute("color", new THREE.BufferAttribute(this.glowCol, 3));
    this.glow = new THREE.Points(gGeo, new THREE.PointsMaterial({
      size: 0.11, map: glowMap, vertexColors: true, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false,
    }));
    this.glow.frustumCulled = false;
    this.glow.renderOrder = 6;
  }

  /** amounts[i] in 0..1 per bin. */
  update(amounts: Float32Array) {
    let dirty = false;
    for (let i = 0; i < RAIL_BINS; i++) {
      const a = Math.min(1, amounts[i]);
      if (Math.abs(a - this.last[i]) < 0.003) continue;
      this.last[i] = a;
      dirty = true;
      this.data[i * 4] = Math.round(a * 255);
      const g = a * a * 0.55;
      this.glowCol.set([this.lit.r * g, this.lit.g * g, this.lit.b * g], i * 3);
    }
    if (!dirty) return;
    this.texture.needsUpdate = true;
    (this.glow.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}

/* ---------- sparks ---------- */

export class Sparks {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private col: Float32Array;
  constructor(private n: number, private hot: THREE.Color, private cool: THREE.Color, map: THREE.Texture, size = 0.05) {
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size, map, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      sizeAttenuation: true, toneMapped: false,
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 7;
  }

  /**
   * Sparks thrown from point o. back: unit direction they fly (x, z). out: sideways spread
   * direction. amount 0..1. t is decoration time: it only animates, never accumulates.
   */
  update(t: number, o: THREE.Vector3, backX: number, backZ: number, amount: number, speed = 1.6, seed = 0) {
    const sx = -backZ, sz = backX;
    for (let i = 0; i < this.n; i++) {
      const h = (k: number) => hash(i * 13.7 + k * 3.1 + seed);
      const life = 0.22 + 0.22 * h(1);
      const ph = (t / life + h(2)) % 1;
      const age = ph * life;
      const v = speed * (0.55 + 0.9 * h(3));
      const dx = backX * (0.5 + 0.7 * h(4)) + sx * (h(5) - 0.5) * 1.3;
      const dz = backZ * (0.5 + 0.7 * h(4)) + sz * (h(5) - 0.5) * 1.3;
      const dy = 0.25 + 0.9 * h(6);
      this.pos.set([o.x + dx * v * age, o.y + dy * v * age - 3.2 * age * age, o.z + dz * v * age], i * 3);
      const on = h(7) < amount ? 1 : 0;
      const b = on * Math.pow(1 - ph, 1.4) * (0.6 + 0.6 * amount);
      const k = Math.min(1, ph * 1.6);
      this.col.set([
        (this.hot.r + (this.cool.r - this.hot.r) * k) * b,
        (this.hot.g + (this.cool.g - this.hot.g) * k) * b,
        (this.hot.b + (this.cool.b - this.hot.b) * k) * b,
      ], i * 3);
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    this.points.visible = amount > 0.01;
  }
}

/* ---------- camera-facing ribbons (traces and speed streaks) ---------- */

export interface PathPoint {
  x: number;
  y: number;
  z: number;
  tx: number;
  tz: number;
}

export class Ribbon {
  readonly mesh: THREE.Mesh;
  private pos: Float32Array;
  private col: Float32Array;
  private v = new THREE.Vector3();
  private s = new THREE.Vector3();
  constructor(private segs: number, color: THREE.Color, additive: boolean) {
    this.pos = new Float32Array((segs + 1) * 6);
    this.col = new Float32Array((segs + 1) * 8);
    const idx: number[] = [];
    for (let i = 0; i < segs; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.col, 4));
    geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
  }

  /** at(f) gives the centre line for f in 0 (tail) .. 1 (head); width and alpha taper toward the tail. */
  update(at: (f: number) => PathPoint, width: number, alpha: number, cam: THREE.Vector3, taper = 0.5) {
    this.mesh.visible = alpha > 0.005 && width > 0;
    if (!this.mesh.visible) return;
    for (let i = 0; i <= this.segs; i++) {
      const f = i / this.segs;
      const p = at(f);
      this.v.set(cam.x - p.x, cam.y - p.y, cam.z - p.z);
      this.s.set(p.tx, 0, p.tz).cross(this.v).normalize().multiplyScalar(width * Math.pow(f, taper));
      this.pos.set([p.x + this.s.x, p.y + this.s.y, p.z + this.s.z, p.x - this.s.x, p.y - this.s.y, p.z - this.s.z], i * 6);
      const a = alpha * Math.min(1, 1.6 * Math.pow(f, 0.9));
      this.col.set([1, 1, 1, a, 1, 1, 1, a], i * 8);
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}

/* ---------- small pieces ---------- */

export function contactShadow(size: number) {
  const mat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  const geo = new THREE.PlaneGeometry(size, size);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 1;
  return m;
}

/** A flat expanding ring on the floor (the touchdown on launch). */
export function shockRing(color: THREE.Color) {
  const geo = new THREE.RingGeometry(0.86, 1, 96);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  m.renderOrder = 6;
  m.visible = false;
  return m;
}

export { glowTexture };
