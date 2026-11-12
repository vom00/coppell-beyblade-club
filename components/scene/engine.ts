// WebGL side of both scenes. Only ever loaded with `import("./engine")`, so three.js and the glTF
// loader stay out of the initial bundle. Models come from assets.ts, the stadium's look from
// materials.ts, effects from fx.ts.
//
// Rule for everything below: what scroll drives is a pure function of progress (pose.ts); time
// only decorates (spin, drift, flicker, the launch on first load) and never accumulates state.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  DEG, FLOOR_H, GEAR_Y, RAIL_TIP_R, RAIL_BINS, floorY, pathAt, railPose, railLight, homeCamAt, dashAt,
  HOME_CAM, HOME_TOP_SCALE, PARTS_CAM, camPos, explodeAt, turnAt, binAngle, LIFT, type CamState,
} from "./pose";
import { palette, dressStadium, type Palette } from "./materials";
import { loadTop, loadStadium, disposeTree, type TopId } from "./assets";
import { RailGlow, Sparks, Ribbon, contactShadow, shockRing, glowTexture, type PathPoint } from "./fx";

export interface SceneHandle {
  /** Scroll progress 0..1 of the owning section. */
  setProgress(p: number): void;
  /** False while offscreen or the tab is hidden: nothing is drawn. */
  setVisible(v: boolean): void;
  resize(w: number, h: number): void;
  /** Learn only: turn the top by this many radians (drag or arrow keys). Eased in the engine. */
  nudge?(radians: number): void;
  /** Conveyor and bay: bring this part or top into view (instant: no travel, for reduced motion). */
  select?(id: string, instant?: boolean): void;
  dispose(): void;
}

export interface Options {
  dpr: number;
  /** Aborts model loading (unmount before the scene is ready). */
  signal?: AbortSignal;
  /** Keep the render loop running while visible (spin, drift, hover). */
  animate?: boolean;
  /** Poster capture: draw one deterministic frame at `time` and stop. */
  still?: boolean;
  /** Seconds since the scene started, for still frames (default 0, the first live frame). */
  time?: number;
  /** Home stills only: take the camera from this progress instead of the pose's own. */
  camAt?: number;
  /** Home stills only: override parts of that camera (captures and checks). */
  camera?: Partial<CamState>;
  /** Learn only: force an explode amount (static diagram / poster). */
  explode?: number;
  turn?: number;
  /** Transparent background (sprite capture). */
  alpha?: boolean;
  /** Conveyor and bay: what to show first. */
  select?: string;
  /** Conveyor and bay: switch instantly and keep still (prefers-reduced-motion). */
  reduced?: boolean;
  /** Conveyor and bay: called when the selected part or top has arrived and is on show. */
  onShown?: (id: string) => void;
  onFrame?: () => void;
  onLost?: () => void;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const TAU = Math.PI * 2;
const angDiff = (a: number, b: number) => ((((a - b) % TAU) + TAU * 1.5) % TAU) - Math.PI;

/* ------------------------------------------------------------------ */
/* Core: renderer, environment, lights, render-on-demand, disposal     */
/* ------------------------------------------------------------------ */

export const ENV_LEVEL = 0.55; // overall studio reflection level; materials scale it with envMapIntensity

export function createCore(canvas: HTMLCanvasElement, o: Options, pal: Palette, camera: THREE.Camera) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !!o.alpha, powerPreference: "high-performance" });
  renderer.setPixelRatio(o.dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Without tone mapping the studio lights clip chrome and pale plastics to flat white. Khronos
  // PBR Neutral keeps base colours true and rolls highlights off instead of clipping them.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  if (o.alpha) renderer.setClearColor(0x000000, 0);
  else scene.background = pal.ink.clone();

  // Studio reflections so steel reads as steel and the gloss reads as gloss.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room, 0.03);
  room.dispose();
  pmrem.dispose();
  scene.environment = envRT.texture;
  scene.environmentIntensity = ENV_LEVEL;

  scene.add(new THREE.HemisphereLight(pal.paper, pal.ink, 0.35));
  const key = new THREE.DirectionalLight(new THREE.Color("#ffe6cc"), 2.6); // warm key
  key.position.set(-2, 3.2, 2.4);
  const rim = new THREE.DirectionalLight(new THREE.Color("#dde6ee"), 2.4); // cool rim
  rim.position.set(1.8, 1.4, -2.6);
  const kick = new THREE.DirectionalLight(pal.red, 0.9); // club-red kicker from the far left
  kick.position.set(-2.6, 0.8, -1.4);
  scene.add(key, rim, kick);

  let visible = true;
  let raf = 0;
  let disposed = false;
  let drawFn: (t: number) => boolean = () => false; // returns true to keep looping
  let firstFrame = true;
  let t0 = -1;
  const extras: { dispose(): void }[] = [];

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible) return;
    if (t0 < 0) t0 = now;
    const again = drawFn(o.still ? (o.time ?? 0) : (now - t0) / 1000);
    renderer.render(scene, camera);
    if (firstFrame) {
      firstFrame = false;
      o.onFrame?.();
    }
    if (again && !o.still) raf = requestAnimationFrame(frame);
  };
  const invalidate = () => {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  };

  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    disposed = true;
    o.onLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return {
    renderer, scene, invalidate,
    /** The shared studio lights, for scenes that retint them. */
    lights: { key, rim, kick },
    /** Things outside the scene graph to free on dispose (models, data textures). */
    own(...items: { dispose(): void }[]) {
      extras.push(...items);
    },
    /**
     * Give every lit material the studio map directly, so each material's own envMapIntensity
     * applies (three ignores it for scene.environment). Call once the scene is populated.
     */
    finalize() {
      scene.traverse((obj) => {
        const mats = (obj as THREE.Mesh).material;
        for (const mat of Array.isArray(mats) ? mats : mats ? [mats] : []) {
          if (mat instanceof THREE.MeshStandardMaterial && !mat.envMap) {
            mat.envMap = envRT.texture;
            mat.envMapRotation.copy(scene.environmentRotation);
            mat.envMapIntensity *= ENV_LEVEL;
          }
        }
      });
    },
    setDraw(fn: (t: number) => boolean) {
      drawFn = fn;
    },
    setVisible(v: boolean) {
      visible = v;
      if (v) invalidate();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    resize(w: number, h: number) {
      if (w < 2 || h < 2) return;
      renderer.setSize(w, h, false);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      invalidate();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onLost);
      scene.traverse((obj) => {
        if (obj instanceof THREE.InstancedMesh) obj.dispose(); // frees the per-instance buffers
        if (obj instanceof THREE.SkinnedMesh) obj.skeleton.dispose();
      });
      disposeTree(scene); // geometries, materials, their textures
      for (const x of extras) x.dispose();
      envRT.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

export function aimCamera(camera: THREE.PerspectiveCamera, c: CamState) {
  camera.position.set(...camPos(c));
  camera.lookAt(...c.target);
}

/** Throws before any model is fetched when the browser cannot give a WebGL2 context. */
export function assertWebGL() {
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) throw new Error("WebGL2 is not available");
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}

/** If any load failed or the scene was abandoned, free what did load and throw (the poster stays). */
export function settle(results: PromiseSettledResult<{ dispose(): void }>[], signal?: AbortSignal) {
  const failed = results.find((s) => s.status === "rejected");
  if (failed || signal?.aborted) {
    for (const s of results) if (s.status === "fulfilled") s.value.dispose();
    throw failed ? failed.reason : signal!.reason;
  }
}

/* ------------------------------------------------------------------ */
/* Home: the rail sequence                                             */
/* ------------------------------------------------------------------ */

// Launch on first load: the top drops in from above the frame, lands, wobbles and spins up.
const DROP = 0.62; // s from first frame to touchdown
const DROP_H = 1.3; // start height above the floor (out of frame at the rest camera)
const STREAKS = 7;
// ground-plane axes of the rest camera: toward it, and screen-right
const VIEW_F = [Math.sin(HOME_CAM.az), Math.cos(HOME_CAM.az)] as const;
const VIEW_R = [Math.cos(HOME_CAM.az), -Math.sin(HOME_CAM.az)] as const;
// Each scene shows a different top: Dran Sword stays on the Learn conveyor only.
export const HERO_TOP: TopId = "sol-eclipse";
export const RIVAL_TOP: TopId = "hells-scythe";

export async function createRailScene(canvas: HTMLCanvasElement, o: Options): Promise<SceneHandle> {
  const loaded = await Promise.allSettled([loadStadium(o.signal), loadTop(HERO_TOP, o.signal), loadTop(RIVAL_TOP, o.signal)]);
  settle(loaded, o.signal);
  const [stadium, hero, rival] = loaded.map((r) => (r as PromiseFulfilledResult<unknown>).value) as [
    Awaited<ReturnType<typeof loadStadium>>, Awaited<ReturnType<typeof loadTop>>, Awaited<ReturnType<typeof loadTop>>,
  ];

  const pal = palette();
  const camera = new THREE.PerspectiveCamera(HOME_CAM.fov, canvas.clientWidth / Math.max(1, canvas.clientHeight) || 1.25, 0.1, 30);
  aimCamera(camera, HOME_CAM);
  const core = createCore(canvas, o, pal, camera);
  const { scene } = core;

  // Effects that the stadium's rail reads.
  const glowMap = glowTexture();
  const rail = new RailGlow(pal.xtreme, glowMap, stadium.railPath);
  core.own(rail, stadium, hero, rival);
  dressStadium(stadium, pal, rail.texture);
  scene.add(stadium.root);

  // Hero top, and a plainer rival circling the bowl for life.
  hero.root.scale.setScalar(HOME_TOP_SCALE);
  const heroLean = new THREE.Group();
  heroLean.add(hero.root);
  const heroShadow = contactShadow(0.62);
  rival.root.scale.setScalar(0.92);
  const rivalLean = new THREE.Group();
  rivalLean.add(rival.root);
  const rivalShadow = contactShadow(0.46);
  scene.add(heroLean, heroShadow, rivalLean, rivalShadow);

  const sparks = new Sparks(80, new THREE.Color("#fff3c4"), pal.xtreme, glowMap, 0.085);
  const traceGreen = new Ribbon(48, pal.xtreme, true);
  const traceRed = new Ribbon(48, pal.red, false);
  const streaks = Array.from({ length: STREAKS }, () => new Ribbon(8, pal.paper, true));
  const shock = shockRing(pal.xtreme);
  const contactLight = new THREE.PointLight(pal.xtreme, 0, 0.9, 2);
  scene.add(rail.glow, sparks.points, traceGreen.mesh, traceRed.mesh, shock, contactLight, ...streaks.map((s) => s.mesh));
  core.finalize();
  const amounts = new Float32Array(RAIL_BINS);

  let progress = 0;
  const axis = new THREE.Vector3();
  const spark = new THREE.Vector3();
  const pp: PathPoint = { x: 0, y: 0, z: 0, tx: 1, tz: 0 };
  const along = (s: number, lateral: number, lift: number): PathPoint => {
    const pt = pathAt(s);
    pp.x = pt.x - pt.tz * lateral;
    pp.z = pt.z + pt.tx * lateral;
    pp.y = floorY(Math.hypot(pp.x, pp.z)) + lift;
    pp.tx = pt.tx;
    pp.tz = pt.tz;
    return pp;
  };

  function draw(t: number) {
    const p = progress;
    const ps = railPose(p);
    const rl = railLight(p);

    /* launch (time only, first seconds after load) */
    const air = t < DROP ? DROP_H * (1 - (t / DROP) ** 2) : 0;
    const land = t - DROP;
    const bounce = land > 0 && land < 0.32 ? 0.04 * Math.sin((Math.PI * land) / 0.32) : 0;
    const wobble = land > 0 ? 0.2 * Math.exp(-3.2 * land) : 0.1;
    const spin = 17 * t - (10 * (1 - Math.exp(-2.2 * t))) / 2.2; // spins up from 7 to 17 rad/s

    /* hero */
    heroLean.position.set(ps.x, ps.y + air + bounce, ps.z);
    heroLean.quaternion.identity();
    heroLean.rotateOnWorldAxis(axis.set(ps.tx, 0, ps.tz), Math.min(0.14, ps.speed * 0.012));
    if (wobble > 0.002) heroLean.rotateOnWorldAxis(axis.set(Math.cos(t * 11), 0, Math.sin(t * 11)), wobble);
    hero.root.rotation.y = -(spin + p * 40); // right spin (clockwise from above)
    heroShadow.position.set(ps.x, ps.y + 0.003, ps.z);
    const lift = clamp01(air / DROP_H);
    heroShadow.scale.setScalar(1 + lift * 0.8);
    (heroShadow.material as THREE.MeshBasicMaterial).opacity = 1 - lift * 0.85;

    /* rival: wanders the half of the bowl the hero is not in, as seen from the camera */
    // The hero goes centre -> right-hand rail -> dashes left across the far half. The rival keeps
    // to screen-left until the dash, then crosses over on the near side, so the two never stack.
    const swap = smooth((p - 0.56) / 0.26);
    const across = swap * (1 - swap) * 4; // 0 -> 1 -> 0 while it crosses
    let lat = -0.44 + 0.86 * swap + 0.1 * Math.sin(0.53 * t + 1);
    const near = 0.06 + 0.4 * across + 0.15 * (1 - across) * Math.sin(0.41 * t);
    // safety: keep minS apart on screen (depth counts half at this camera pitch) by sliding
    // sideways, away from the hero. Eased out while crossing, where depth keeps them apart.
    const hLat = ps.x * VIEW_R[0] + ps.z * VIEW_R[1];
    const hNear = ps.x * VIEW_F[0] + ps.z * VIEW_F[1];
    const minS = 0.46;
    const need = minS * minS - ((near - hNear) * 0.5) ** 2;
    if (need > 0 && Math.abs(lat - hLat) < Math.sqrt(need)) {
      const pushed = hLat + Math.sign(lat - hLat || -1) * Math.sqrt(need);
      lat += (pushed - lat) * (1 - across);
    }
    let rx = lat * VIEW_R[0] + near * VIEW_F[0];
    let rz = lat * VIEW_R[1] + near * VIEW_F[1];
    const rR = Math.hypot(rx, rz);
    if (rR > 0.7) {
      rx *= 0.7 / rR;
      rz *= 0.7 / rR;
    }
    const ry = floorY(Math.hypot(rx, rz));
    rivalLean.position.set(rx, ry, rz);
    rivalLean.quaternion.identity();
    rivalLean.rotateOnWorldAxis(axis.set(Math.cos(0.7 * t), 0, Math.sin(0.7 * t)), 0.07);
    rival.root.rotation.y = -t * 14;
    rivalShadow.position.set(rx, ry + 0.003, rz);

    /* rail teeth: lit where the gear is, along the stretch it has run, and a ripple on landing */
    const ripple = land > 0 && land < 1.6 ? 1 - smooth((land - 0.5) / 1.1) : 0;
    const rippleFront = (land / 0.95) * Math.PI;
    for (let i = 0; i < RAIL_BINS; i++) {
      const th = binAngle(i);
      let a = rl.headAmt * Math.exp(-((angDiff(th, rl.head) / (4.5 * DEG)) ** 2));
      const span = rl.arcTo - rl.arcFrom;
      if (rl.arcAmt > 0.001 && span > 0) {
        const d = (((th - rl.arcFrom) % TAU) + TAU) % TAU;
        if (d <= span) a = Math.max(a, rl.arcAmt * (0.35 + 0.65 * (d / span) ** 1.3));
      }
      if (ripple > 0) {
        const ad = Math.abs(angDiff(th, 246 * DEG));
        a = Math.max(a, ripple * Math.exp(-(((ad - rippleFront) / (10 * DEG)) ** 2)));
      }
      if (a > 0.05 && !o.still) a *= 0.88 + 0.12 * Math.sin(t * 31 + i * 2.3); // live shimmer
      amounts[i] = a;
    }
    rail.update(amounts);

    /* sparks and green light at the gear contact */
    spark.set(RAIL_TIP_R * Math.cos(rl.head), FLOOR_H + GEAR_Y * HOME_TOP_SCALE, -RAIL_TIP_R * Math.sin(rl.head));
    sparks.update(t, spark, Math.sin(rl.head), Math.cos(rl.head), rl.sparks, 1.5);
    contactLight.position.copy(spark).multiplyScalar(0.97);
    contactLight.position.y += 0.05;
    contactLight.intensity = rl.headAmt * 0.5;

    /* trace: green and red ribbons side by side behind the top */
    const cam = camera.position;
    const len = ps.traceTo - ps.traceFrom;
    traceGreen.update((f) => along(ps.traceFrom + len * f, 0.013, 0.03), 0.014, len > 0.004 ? 1 : 0, cam);
    traceRed.update((f) => along(ps.traceFrom + len * f, -0.013, 0.03), 0.014, len > 0.004 ? 0.95 : 0, cam);

    /* speed streaks on the dash */
    const dash = dashAt(p) * smooth((ps.speed - 2.5) / 5);
    const d = ps.traceTo;
    for (let k = 0; k < STREAKS; k++) {
      const h = (n: number) => {
        const s = Math.sin((k + 1) * 91.3 + n * 17.7) * 43758.5;
        return s - Math.floor(s);
      };
      const lat = (k - (STREAKS - 1) / 2) * 0.045 + (h(1) - 0.5) * 0.02;
      const lift = 0.05 + h(2) * 0.16;
      const L = (0.22 + 0.3 * h(3)) * Math.min(1.2, ps.speed / 9);
      const gap = 0.1 + 0.14 * h(4) + 0.08 * ((t * (2 + h(5)) + h(6)) % 1);
      const flick = o.still ? 0.8 : 0.55 + 0.45 * Math.sin(t * 23 + k * 1.7);
      streaks[k].update((f) => along(d - gap - L * (1 - f), lat, lift), 0.0045, dash * (0.4 + 0.5 * h(7)) * flick, cam, 0.2);
    }

    /* touchdown ring */
    const u = land / 0.6;
    shock.visible = u > 0 && u < 1;
    if (shock.visible) {
      shock.position.set(ps.x, ps.y + 0.004, ps.z);
      shock.scale.setScalar(0.08 + 0.6 * (1 - (1 - u) ** 3));
      (shock.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - u) ** 2;
    }

    /* camera: scroll beats, plus a slow drift and a small kick on landing */
    const c = { ...homeCamAt(o.camAt ?? p), ...o.camera };
    if (!o.still) {
      c.az += 0.03 * Math.sin(0.23 * t);
      c.el += 0.014 * Math.sin(0.31 * t);
      c.dist += 0.05 * Math.sin(0.17 * t);
    }
    aimCamera(camera, c);
    if (land > 0 && land < 0.5) camera.position.y += 0.012 * Math.exp(-9 * land) * Math.sin(land * 70);

    return !!o.animate;
  }

  core.setDraw(draw);
  core.invalidate();

  return {
    setProgress(p) {
      progress = p;
      core.invalidate();
    },
    setVisible: core.setVisible,
    resize: core.resize,
    dispose: core.dispose,
  };
}

/* ------------------------------------------------------------------ */
/* Learn: the workbench                                                */
/* ------------------------------------------------------------------ */

export const PARTS_TOP: TopId = "knight-shield";

export async function createPartsScene(canvas: HTMLCanvasElement, o: Options): Promise<SceneHandle> {
  const loaded = await Promise.allSettled([loadTop(PARTS_TOP, o.signal)]);
  settle(loaded, o.signal);
  const model = (loaded[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof loadTop>>>).value;
  const pal = palette();
  const camera = new THREE.PerspectiveCamera(PARTS_CAM.fov, 1, 0.05, 20);
  aimCamera(camera, PARTS_CAM);
  const core = createCore(canvas, o, pal, camera);
  core.own(model);
  const { scene } = core;

  // Mat: a finite dark slab with a warm-white front edge, so the frame edges stay pure ink.
  const matGeo = new THREE.BoxGeometry(0.7, 0.016, 0.44);
  matGeo.translate(-0.05, -0.008, -0.04);
  scene.add(new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: pal.ink2, roughness: 0.9, envMapIntensity: 0.25 })));
  const tickMat = new THREE.MeshStandardMaterial({ color: pal.paper, roughness: 0.6, emissive: pal.paper, emissiveIntensity: 0.35 });
  const edgeGeo = new THREE.BoxGeometry(0.7, 0.003, 0.004);
  edgeGeo.translate(-0.05, 0.0005, 0.18);
  scene.add(new THREE.Mesh(edgeGeo, tickMat));

  // Ruler: a dark upright with warm-white ticks every 0.02, longer every 0.1.
  const RX = -0.3, RH = 0.62, RN = Math.floor(RH / 0.02);
  const barGeo = new THREE.BoxGeometry(0.05, RH, 0.014);
  barGeo.translate(RX, RH / 2, -0.06);
  scene.add(new THREE.Mesh(barGeo, new THREE.MeshStandardMaterial({ color: pal.ink3, roughness: 0.6 })));
  const tickGeo = new THREE.BoxGeometry(1, 0.0035, 0.004);
  const ticks = new THREE.InstancedMesh(tickGeo, tickMat, RN);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < RN; i++) {
    const len = i % 5 === 0 ? 0.04 : 0.02;
    m4.makeScale(len, 1, 1).setPosition(RX + 0.025 - len / 2, 0.01 + i * 0.02, -0.052);
    ticks.setMatrixAt(i, m4);
  }
  scene.add(ticks);

  // Turntable: a tick ring under the top that turns with it, so a drag has something to read.
  const table = new THREE.Group();
  const discGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.004, 96);
  discGeo.translate(0, 0.002, 0);
  table.add(new THREE.Mesh(discGeo, new THREE.MeshStandardMaterial({ color: "#1d1818", roughness: 0.5, envMapIntensity: 0.5 })));
  const ringTicks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.014, 0.002, 0.0035), tickMat, 60);
  const q = new THREE.Quaternion();
  const upV = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    q.setFromAxisAngle(upV, -a);
    m4.compose(new THREE.Vector3(0.185 * Math.cos(a), 0.0045, 0.185 * Math.sin(a)), q, new THREE.Vector3(i % 5 === 0 ? 1.6 : 1, 1, 1));
    ringTicks.setMatrixAt(i, m4);
  }
  table.add(ringTicks);
  const notchGeo = new THREE.BoxGeometry(0.03, 0.003, 0.009);
  notchGeo.translate(0.18, 0.005, 0);
  table.add(new THREE.Mesh(notchGeo, new THREE.MeshBasicMaterial({ color: pal.red })));
  scene.add(table);

  const { root: top, parts } = model;
  top.position.y = 0.004; // stands on the turntable
  scene.add(top);
  const shadow = contactShadow(0.42);
  shadow.position.y = 0.0045;
  scene.add(shadow);
  core.finalize();

  let progress = 0;
  let userTarget = 0;
  let user = 0;
  let lastT = 0;
  core.setDraw((t) => {
    const dt = Math.min(0.1, Math.max(0, t - lastT));
    lastT = t;
    user += (userTarget - user) * (o.still ? 1 : Math.min(1, dt * 7));
    const e = o.explode ?? explodeAt(progress);
    const base = (o.turn ?? turnAt(progress)) + user + (o.still ? 0 : t * 0.2);
    top.rotation.y = base;
    table.rotation.y = base;
    // exploded parts hover and drift a little against each other; assembled they sit locked
    parts.blade.position.y = LIFT.blade * e + e * 0.006 * Math.sin(t * 1.15);
    parts.ratchet.position.y = LIFT.ratchet * e + e * 0.005 * Math.sin(t * 1.15 + 1.3);
    parts.bit.position.y = LIFT.bit * e + e * 0.004 * Math.sin(t * 1.15 + 2.6);
    parts.blade.rotation.y = e * 0.22 * Math.sin(t * 0.45);
    parts.ratchet.rotation.y = e * 0.3 * Math.sin(t * 0.45 + 2.1);
    parts.bit.rotation.y = e * 0.25 * Math.sin(t * 0.45 + 4.2);
    (shadow.material as THREE.MeshBasicMaterial).opacity = 1 - 0.35 * e;
    return !!o.animate;
  });
  core.invalidate();

  return {
    setProgress(p) {
      if (p === progress) return;
      progress = p;
      core.invalidate();
    },
    nudge(r) {
      userTarget += r;
      core.invalidate();
    },
    setVisible: core.setVisible,
    resize: core.resize,
    dispose: core.dispose,
  };
}

/* ------------------------------------------------------------------ */
/* The rail rider sprite: a top straight down, transparent             */
/* ------------------------------------------------------------------ */

export const SPRITE_TOP: TopId = "unicorn-delta";

export async function createSpriteScene(canvas: HTMLCanvasElement, o: Options): Promise<SceneHandle> {
  const model = await loadTop(SPRITE_TOP, o.signal);
  const pal = palette();
  const R = 0.196;
  const camera = new THREE.OrthographicCamera(-R, R, R, -R, 0.1, 5);
  camera.position.set(0, 2, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);
  const core = createCore(canvas, { ...o, alpha: true }, pal, camera);
  core.own(model);
  model.root.rotation.y = o.turn ?? 0.5;
  core.scene.add(model.root);
  // Straight down, flat faces would mirror the studio ceiling and blow out. Tip the studio so
  // they reflect what they reflect from the Home camera's height instead.
  core.scene.environmentRotation.set(66 * DEG, 0, 0);
  core.finalize();
  core.setDraw(() => false);
  core.invalidate();
  return {
    setProgress() {},
    setVisible: core.setVisible,
    resize: core.resize,
    dispose: core.dispose,
  };
}

/* ------------------------------------------------------------------ */
/* Studio: one top, three-quarter view (close-ups and product tiles)   */
/* ------------------------------------------------------------------ */

/**
 * One top on its own, seen from about 35 degrees above, filling `fill` of the frame. Lit like the
 * display bay: the studio lights plus a slightly cool spot from above. Capture only (scripts/).
 */
export async function createStudioScene(canvas: HTMLCanvasElement, o: Options & { fill?: number; el?: number }): Promise<SceneHandle> {
  const id = (o.select ?? "dran-sword") as TopId;
  const model = await loadTop(id, o.signal);
  const pal = palette();
  const camera = new THREE.PerspectiveCamera(22, 1, 0.01, 20);
  const core = createCore(canvas, o, pal, camera);
  core.own(model);
  if (!o.alpha) core.scene.background = pal.panel.clone();
  model.root.rotation.y = o.turn ?? 0.6;
  core.scene.add(model.root);
  const spot = new THREE.SpotLight("#eef4ff", 6, 3, 24 * DEG, 0.6, 1.2);
  spot.position.set(0.05, 1.4, 0.2);
  spot.target.position.set(0, 0.05, 0);
  core.scene.add(spot, spot.target);
  core.finalize();

  const el = o.el ?? 35 * DEG;
  const fill = o.fill ?? 0.88;
  // fit to the silhouette, not the bounding box (a round top's box corners stick out a lot)
  model.root.updateMatrixWorld(true);
  const pts: THREE.Vector3[] = [];
  model.root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.getAttribute("position");
    const step = Math.max(1, Math.floor(pos.count / 1500));
    for (let i = 0; i < pos.count; i += step) pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld));
  });
  const centre = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
  const v = new THREE.Vector3();
  const bounds = () => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      v.copy(p).project(camera);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    return { x0, x1, y0, y1 };
  };
  const frame = () => {
    let lo = 0.1, hi = 10;
    for (let i = 0; i < 36; i++) {
      const d = (lo + hi) / 2;
      aimCamera(camera, { target: [centre.x, centre.y, centre.z], az: 0, el, dist: d, fov: 22 });
      camera.updateMatrixWorld();
      const b = bounds();
      if (Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2 > fill) lo = d;
      else hi = d;
    }
    // centre the silhouette in the frame
    const b = bounds();
    camera.projectionMatrix.elements[8] += (b.x0 + b.x1) / 2;
    camera.projectionMatrix.elements[9] += (b.y0 + b.y1) / 2;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  };
  core.setDraw(() => false);
  core.invalidate();
  return {
    setProgress() {},
    setVisible: core.setVisible,
    resize(w, h) {
      core.resize(w, h); // sets the aspect
      frame();
    },
    dispose: core.dispose,
  };
}
