// Home: the display bay. A space station room from Kenney's Space Station Kit, with the selected
// top on a display table under a light. Switching lowers the top into the table and raises the
// next one. Only the selected top's model is fetched at first; the others load when chosen, and
// the previous top stays on show until the next is ready. Engine chunk only.
//
// Units: Kenney's 1-unit grid (a wall is 1 x 1). Tops are scaled by TOP_K.
import * as THREE from "three";
import { createCore, aimCamera, settle, assertWebGL, type Options, type SceneHandle } from "./engine";
import { palette, glowTexture } from "./materials";
import { loadKit, loadTop, type KitModel, type TopModel } from "./assets";
import { contactShadow } from "./fx";
import { SPACE_KIT_URL, TOPS, type TopId } from "./tops";
import { DEG } from "./pose";

const TOP_K = 1.1; // a top about 0.4 wide on a 0.84-wide display table
const FLOOR = 0.3; // top of the floor tiles
const DOWN = 0.5; // s, the shown top sinks into the table
const UP = 0.8; // s, the next one rises
const TURN = 0.5; // rad/s

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeIn = (u: number) => clamp01(u) ** 3;
const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;

const FRAME = { target: [0, 0.9, 0] as [number, number, number], az: 0.14, el: 12 * DEG, fov: 30 };

function fitCamera(camera: THREE.PerspectiveCamera, w: number, h: number) {
  // narrow canvases frame the table more tightly so the top keeps its size on a phone
  const k = clamp01((w - 360) / 520);
  const fw = 1.3 + 0.5 * k, fh = 0.95 + 0.2 * k;
  const vf = Math.tan((FRAME.fov * DEG) / 2);
  const dist = Math.max(fh / 2 / vf, fw / 2 / (vf * (w / h)));
  aimCamera(camera, { target: FRAME.target, az: FRAME.az, el: FRAME.el, dist, fov: FRAME.fov });
}

function surfaceY(obj: THREE.Object3D, x: number, z: number, fallback: number) {
  obj.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0));
  const hit = rc.intersectObject(obj, true)[0];
  return hit ? hit.point.y : fallback;
}

/** Stars for the view through the windows. */
function starTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  // deep space with a faint blue nebula band
  g.fillStyle = "#03060d";
  g.fillRect(0, 0, 1024, 512);
  const neb = g.createRadialGradient(620, 220, 10, 620, 220, 420);
  neb.addColorStop(0, "rgba(40, 90, 170, 0.35)");
  neb.addColorStop(0.5, "rgba(60, 40, 140, 0.14)");
  neb.addColorStop(1, "rgba(0, 0, 0, 0)");
  g.fillStyle = neb;
  g.fillRect(0, 0, 1024, 512);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 420; i++) {
    const r = rnd() < 0.92 ? 0.7 + rnd() * 0.8 : 1.4 + rnd() * 1.2;
    g.globalAlpha = 0.35 + rnd() * 0.65;
    const k = rnd();
    g.fillStyle = k < 0.6 ? "#ffffff" : k < 0.78 ? "#a8e6ff" : k < 0.9 ? "#c9b8ff" : k < 0.96 ? "#ffd2a0" : "#ff8a8a";
    g.beginPath();
    g.arc(rnd() * 1024, rnd() * 512, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A soft vertical beam: bright at the lamp, fading toward the table. */
function beamTexture() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, "rgba(255,255,255,0.0)");
  grd.addColorStop(0.15, "rgba(255,255,255,0.5)");
  grd.addColorStop(1, "rgba(255,255,255,0.06)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
}

interface Shown {
  id: TopId;
  model: TopModel;
  holder: THREE.Group; // rises and sinks
}

export async function createBayScene(canvas: HTMLCanvasElement, o: Options): Promise<SceneHandle> {
  const first: TopId = TOPS.some((t) => t.id === o.select) ? (o.select as TopId) : "drake-brave";
  assertWebGL(); // no WebGL: fail now, before the models download
  const loaded = await Promise.allSettled([loadKit(SPACE_KIT_URL, o.signal), loadTop(first, o.signal)]);
  settle(loaded, o.signal);
  const kit = (loaded[0] as PromiseFulfilledResult<KitModel>).value;
  const firstModel = (loaded[1] as PromiseFulfilledResult<TopModel>).value;

  const pal = palette();
  const camera = new THREE.PerspectiveCamera(FRAME.fov, 4 / 3, 0.05, 40);
  fitCamera(camera, 800, 600);
  const core = createCore(canvas, o, pal, camera);
  core.own(kit);
  const { scene, renderer } = core;
  renderer.localClippingEnabled = true;
  scene.background = pal.panel.clone();
  scene.fog = new THREE.Fog(pal.panel, 4.5, 9);
  const reduced = !!o.reduced;

  /* ---------- the room ---------- */
  const room = new THREE.Group();
  scene.add(room);
  const place = (name: string, x: number, y: number, z: number, ry = 0, s = 1) => {
    const p = kit.piece(name);
    p.position.set(x, y, z);
    p.rotation.y = ry;
    p.scale.setScalar(s);
    room.add(p);
    return p;
  };
  for (let x = -4; x <= 4; x++) for (let z = -2; z <= 3; z++) place(Math.abs(x) <= 1 && Math.abs(z) <= 1 ? "floor-panel" : "floor", x, 0, z);
  // back wall, two storeys: windows below, plain panels above, banner pillars between
  const backZ = -2.35;
  const back: [number, string][] = [[-3, "wall"], [-2, "wall-pillar-banner"], [-1, "wall-window"], [0, "wall-banner"], [1, "wall-window"], [2, "wall-pillar-banner"], [3, "wall"]];
  for (const [x, n] of back) {
    place(n, x, FLOOR, backZ);
    place(n === "wall-window" ? "wall" : n === "wall-banner" ? "wall" : n, x, FLOOR + 1, backZ);
  }
  // side walls closing the bay, turned to face in
  for (const sx of [-1, 1]) {
    place("wall-corner", sx * 3.5, FLOOR, backZ + 0.05, sx > 0 ? -Math.PI / 2 : 0);
    for (let z = -1.5; z <= 1.5; z++) {
      place("wall", sx * 3.65, FLOOR, z, sx * -Math.PI / 2);
      place("wall", sx * 3.65, FLOOR + 1, z, sx * -Math.PI / 2);
    }
  }
  // consoles either side of the table, angled toward it
  place("computer-wide", -1.45, FLOOR, -1.25, 0.45);
  place("computer-screen", 1.4, FLOOR, -1.3, -0.4);
  // storage and pipework along the walls
  place("container-tall", -2.45, FLOOR, -1.6, 0.3);
  place("container", -2.05, FLOOR, -0.65, -0.2, 0.9);
  place("container-tall", 2.45, FLOOR, -1.55, -0.2);
  for (const x of [-2.75, 2.75]) {
    place("pipe", x, FLOOR, -2.05);
    place("pipe-ring-colored", x, FLOOR + 0.5, -2.05);
    place("pipe", x, FLOOR + 1, -2.05);
    place("pipe", x, FLOOR + 1.5, -2.05);
  }

  // the view out: stars behind the back wall's windows
  const stars = starTexture();
  core.own(stars);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: stars, fog: false, toneMapped: false }));
  sky.position.set(0, 1.2, backZ - 1.2);
  scene.add(sky);

  /* ---------- the display table ---------- */
  const table = place("table-display-small", 0, 0, 0);
  table.updateMatrixWorld(true);
  const tb = new THREE.Box3().setFromObject(table);
  table.position.y = FLOOR - tb.min.y;
  const padY = surfaceY(table, 0, 0.02, FLOOR + 0.41) + 0.002;

  // sinking tops are cut off at the table's surface, so they pass into it
  const clip = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(padY - 0.004));
  const shadow = contactShadow(0.62);
  shadow.position.y = padY + 0.001;
  scene.add(shadow);
  const glow = glowTexture();
  core.own(glow);
  const ringGeo = new THREE.RingGeometry(0.255, 0.275, 72);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: pal.xtreme, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
  ring.position.y = padY + 0.003;
  ring.renderOrder = 4;
  scene.add(ring);

  // the light over the table, and its beam
  const spot = new THREE.SpotLight(new THREE.Color("#eef4ff"), 12, 3.4, 19 * DEG, 0.7, 1.2);
  spot.position.set(0, 2.35, 0.12);
  spot.target.position.set(0, padY, 0);
  scene.add(spot, spot.target);
  const beamTex = beamTexture();
  core.own(beamTex);
  const beamH = 2.3 - padY;
  const beamGeo = new THREE.CylinderGeometry(0.06, 0.34, beamH, 40, 1, true);
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
    alphaMap: beamTex, color: new THREE.Color("#e6f2ff"), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.07, toneMapped: false, fog: false,
  }));
  beam.position.set(0, padY + beamH / 2, 0);
  beam.renderOrder = 6;
  scene.add(beam);
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.05, 32);
  const lamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color("#eef4ff"), toneMapped: false }));
  lamp.position.set(0, 2.33, 0);
  scene.add(lamp);
  // cool light from the windows; the studio rim goes cyan to match the trim
  const windowLight = new THREE.DirectionalLight(new THREE.Color("#9fd0ff"), 0.6);
  windowLight.position.set(0.5, 2, -4);
  scene.add(windowLight);
  core.lights.rim.color.set("#7fdcff");

  core.finalize();
  const env = (scene.environment as THREE.Texture | null);

  /* ---------- tops ---------- */
  const models = new Map<TopId, TopModel>([[first, firstModel]]);
  const loading = new Map<TopId, Promise<TopModel>>();
  core.own({ dispose: () => models.forEach((m) => m.dispose()) });

  const holder = new THREE.Group();
  scene.add(holder);
  const prepare = (m: TopModel) => {
    m.root.scale.setScalar(TOP_K);
    m.root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        mat.clippingPlanes = [clip];
        // the same studio reflections the rest of the engine gives its materials
        if (mat instanceof THREE.MeshStandardMaterial && !mat.envMap && env) {
          mat.envMap = env;
          mat.envMapIntensity *= 0.55;
        }
        mat.needsUpdate = true;
      }
    });
  };
  prepare(firstModel);

  let current: Shown = { id: first, model: firstModel, holder };
  holder.add(firstModel.root);
  holder.position.y = padY;
  let height = new THREE.Box3().setFromObject(firstModel.root).max.y + 0.02;

  let target: TopId = first;
  let next: TopId | null = null; // loaded and waiting to rise
  let phaseStart = -1; // -1 idle
  let phase: "down" | "up" | "idle" = "idle";
  let pendingStart = false;
  let lastT = 0;
  let turn = 0.6;
  let turnFrom = 0;
  o.onShown?.(first);

  const begin = (id: TopId) => {
    next = id;
    pendingStart = true;
    phase = "down";
    core.invalidate();
  };
  const swapNow = (id: TopId) => {
    const m = models.get(id)!;
    holder.remove(current.model.root);
    holder.add(m.root);
    current = { id, model: m, holder };
    height = new THREE.Box3().setFromObject(m.root).max.y + 0.02;
    turnFrom = lastT;
  };
  const request = (id: TopId) => {
    if (models.has(id) || loading.has(id)) return;
    const p = loadTop(id, o.signal);
    loading.set(id, p);
    p.then((m) => {
      loading.delete(id);
      if (o.signal?.aborted) return m.dispose();
      prepare(m);
      models.set(id, m);
      if (target === id && phase === "idle" && current.id !== id) {
        if (reduced) {
          swapNow(id);
          o.onShown?.(id);
          core.invalidate();
        } else begin(id);
      }
    }).catch(() => {
      loading.delete(id);
      // the previous top stays; the HTML has already switched
    });
  };

  core.setDraw((t) => {
    lastT = t;
    if (pendingStart) {
      phaseStart = t;
      pendingStart = false;
    }
    let y = 0;
    if (phase === "down") {
      const u = (t - phaseStart) / DOWN;
      y = -height * easeIn(u);
      if (u >= 1) {
        swapNow(next!);
        next = null;
        phase = "up";
        phaseStart = t;
        y = -height;
      }
    }
    if (phase === "up") {
      const u = (t - phaseStart) / UP;
      y = -height * (1 - easeOut(u));
      if (u >= 1) {
        phase = "idle";
        y = 0;
        o.onShown?.(current.id);
        if (target !== current.id && models.has(target)) begin(target);
      }
    }
    holder.position.y = padY + y;
    const live = !reduced && !o.still;
    turn = live ? 0.6 + (t - turnFrom) * TURN : 0.6;
    current.model.root.rotation.y = -turn;
    const up = 1 + y / height; // 1 when fully up
    (shadow.material as THREE.MeshBasicMaterial).opacity = up;
    const waiting = target !== current.id;
    const pulse = waiting && live ? 0.5 + 0.5 * Math.sin(t * 6) : 1;
    (ring.material as THREE.MeshBasicMaterial).opacity = 0.8 * (waiting ? 0.35 + 0.4 * pulse : up);
    return !!o.animate && !reduced;
  });
  core.invalidate();

  return {
    setProgress() {},
    select(id, instant) {
      if (!TOPS.some((t) => t.id === id)) return;
      target = id as TopId;
      if (!models.has(target)) {
        request(target);
        core.invalidate();
        return;
      }
      if (target === current.id && phase === "idle") return;
      if (instant || reduced) {
        phase = "idle";
        next = null;
        pendingStart = false;
        if (current.id !== target) swapNow(target);
        o.onShown?.(target);
        core.invalidate();
        return;
      }
      if (phase === "idle") begin(target);
    },
    setVisible: core.setVisible,
    resize(w, h) {
      if (w > 1 && h > 1) fitCamera(camera, w, h);
      core.resize(w, h);
    },
    dispose: core.dispose,
  };
}
