// Learn: the parts conveyor. A factory line from Kenney's Factory Kit; the belt brings the chosen
// part of Dran Sword out of one machine, stops it under the scanner, and carries the previous part
// on into the next machine. Engine chunk only (imported by useScene when the section is near).
//
// Units: Kenney's 1-unit grid (a conveyor tile is 1 x 1). The parts are scaled by PART_K.
// Rule as in engine.ts: travel is a pure function of time since the switch; nothing accumulates
// except the belt's total distance, which only moves the belt texture.
import * as THREE from "three";
import { createCore, aimCamera, settle, assertWebGL, type Options, type SceneHandle } from "./engine";
import { palette, glowTexture } from "./materials";
import { loadKit, loadTop, type KitModel, type TopModel } from "./assets";
import { contactShadow } from "./fx";
import { FACTORY_KIT_URL } from "./tops";
import { DEG, type PartId } from "./pose";

export const CONVEYOR_PARTS: PartId[] = ["blade", "ratchet", "bit"];

const PART_K = 2; // the parts on the line: blade about 0.74 wide on a 1-wide belt
const MACHINE_X = 2.6; // in and out machines, either side of the scanner at x = 0
const RUN = MACHINE_X + 0.2; // how far the belt moves per switch: machine to scanner
const TRAVEL = 2.5; // s
const SCAN = 1.1; // s, the scan sweep after a part stops
const DIP = 1.6; // s, the robot arm leans in and back
const TURN = 0.45; // rad/s idle turn under the scanner
const BELT_LEN = 13;
const SLAT = 0.25; // belt texture period along x

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
/** Belt displacement 0..1 over a switch: eases in and out like a motor starting and stopping. */
const travelEase = (u: number) => {
  const t = clamp01(u);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

/** Camera framing: keep this box (centred on target) in view at any aspect. */
const FRAME = { target: [0, 0.6, -0.1] as [number, number, number], az: -0.68, el: 30 * DEG, fov: 28, w: 4.7, h: 2.3 };

function fitCamera(camera: THREE.PerspectiveCamera, w: number, h: number) {
  // narrow canvases frame the scanner more tightly so the part keeps its size on a phone
  const k = clamp01((w - 360) / 520);
  const fw = FRAME.w * (0.8 + 0.2 * k), fh = FRAME.h * (0.85 + 0.15 * k);
  const vf = Math.tan((FRAME.fov * DEG) / 2);
  const dist = Math.max(fh / 2 / vf, fw / 2 / (vf * (w / h)));
  camera.fov = FRAME.fov;
  aimCamera(camera, { target: FRAME.target, az: FRAME.az, el: FRAME.el, dist, fov: FRAME.fov });
}

/** Height of the first surface below (x, z) on this object, from above. */
function surfaceY(obj: THREE.Object3D, x: number, z: number, fallback: number) {
  obj.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0));
  const hit = rc.intersectObject(obj, true)[0];
  return hit ? hit.point.y : fallback;
}

/** Scrolling belt surface: dark rubber with cross slats and a chevron every metre or so. */
function beltTexture(red: THREE.Color) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a1a1a";
  g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = "#2b2b2b";
    g.fillRect(i * 64 + 2, 0, 14, 64);
    g.fillStyle = "#101010";
    g.fillRect(i * 64 + 16, 0, 3, 64);
  }
  // one chevron per texture repeat, pointing along +x
  g.fillStyle = `#${red.getHexString()}`;
  g.globalAlpha = 0.85;
  g.beginPath();
  g.moveTo(150, 18);
  g.lineTo(172, 32);
  g.lineTo(150, 46);
  g.lineTo(140, 46);
  g.lineTo(162, 32);
  g.lineTo(140, 18);
  g.closePath();
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** The screen's face: the part's name in the display face, bracketed mono hint above it. */
function screenTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--font-display").trim() || "system-ui, sans-serif";
  const mono = css.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace";
  const draw = (name: string, index: number, energy: string) => {
    const g = c.getContext("2d")!;
    // a lit panel: deep blue glass with faint scan lines
    const bg = g.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, "#0d2a3f");
    bg.addColorStop(1, "#06141f");
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = "rgba(120, 220, 255, 0.06)";
    for (let y = 0; y < 256; y += 6) g.fillRect(0, y, 512, 2);
    g.font = `400 34px ${mono}`;
    g.fillStyle = energy;
    g.textBaseline = "middle";
    g.fillText(`[${index + 1}/3]`, 42, 72);
    g.font = `600 96px ${display}`;
    g.fillStyle = "#f2f2f2";
    g.fillText(name, 40, 168);
    t.needsUpdate = true;
  };
  return { texture: t, draw, ready: Promise.all([document.fonts.load(`600 96px ${display}`), document.fonts.load(`400 34px ${mono}`)]) };
}

interface Carrier {
  id: PartId;
  group: THREE.Group; // moves along the belt
  spin: THREE.Group; // turns under the scanner
  shadow: THREE.Mesh;
}

export async function createConveyorScene(canvas: HTMLCanvasElement, o: Options): Promise<SceneHandle> {
  assertWebGL(); // no WebGL: fail now, before the models download
  const loaded = await Promise.allSettled([loadKit(FACTORY_KIT_URL, o.signal), loadTop("dran-sword", o.signal)]);
  settle(loaded, o.signal);
  const kit = (loaded[0] as PromiseFulfilledResult<KitModel>).value;
  const top = (loaded[1] as PromiseFulfilledResult<TopModel>).value;

  const pal = palette();
  const camera = new THREE.PerspectiveCamera(FRAME.fov, 4 / 3, 0.1, 60);
  fitCamera(camera, 800, 600);
  const core = createCore(canvas, o, pal, camera);
  core.own(kit, top);
  const { scene } = core;
  scene.background = pal.panel.clone();
  scene.fog = new THREE.Fog(pal.panel, 9, 15);
  const reduced = !!o.reduced;

  /* ---------- the set ---------- */
  const set = new THREE.Group();
  scene.add(set);
  const place = (name: string, x: number, y: number, z: number, ry = 0, s = 1) => {
    const p = kit.piece(name);
    p.position.set(x, y, z);
    p.rotation.y = ry;
    p.scale.setScalar(s);
    set.add(p);
    return p;
  };
  // floor tiles, a step darker than the gunmetal machines so the line stands out against them
  const floorMat = (kit.piece("floor-large").children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
  const darkFloor = floorMat.clone();
  darkFloor.color.setScalar(0.6);
  for (let x = -9; x <= 9; x += 2)
    for (let z = -9; z <= 5; z += 2) {
      const f = place("floor-large", x, 0, z);
      f.traverse((m) => (m as THREE.Mesh).isMesh && ((m as THREE.Mesh).material = darkFloor));
    }
  const belt: THREE.Object3D[] = [];
  for (let x = -6; x <= 6; x += 2) belt.push(place("conveyor-long-stripe-sides", x, 0, 0));
  place("machine", -MACHINE_X, 0, 0);
  place("machine-window", MACHINE_X, 0, 0, Math.PI);
  const scanner = place("scanner-high", 0, 0, 0);
  scanner.scale.z = 1.5; // legs clear of the belt edges, so the camera sees the part between them
  // back of the line: a screen that names the part, the robot arm, a hopper feeding the first machine
  const screen = place("screen-panel-wide", 2.3, 0, -1.55, Math.PI - 0.45, 0.8);
  const arm = place("robot-arm-a", -1.15, 0, -0.95, 0, 0.55);
  place("box-large", 3.4, 0, -1.5, 0.3, 0.8);
  place("box-small", 3.25, 0.44, -1.55, -0.2, 0.8);
  place("box-small", 4.1, 0, -1.0, 0.5, 0.8);
  const lamp = place("warning-orange", MACHINE_X + 0.25, 1.28, -0.35, 0, 0.5);

  // two cogs on the face of the first machine, turning with the belt
  const cogs: THREE.Object3D[] = [];
  for (const [dx, dy] of [[-0.18, 0.78], [0.2, 0.52]] as const) {
    const pivot = new THREE.Group();
    pivot.position.set(-MACHINE_X + dx, dy, 0.79);
    pivot.rotation.x = Math.PI / 2;
    const cog = kit.piece("cog-a");
    cog.scale.setScalar(0.3);
    pivot.add(cog);
    set.add(pivot);
    cogs.push(cog);
  }

  const beltY = surfaceY(belt[3], 0.35, 0, 0.36);

  /* ---------- the moving belt surface ---------- */
  const beltTex = beltTexture(pal.red);
  beltTex.repeat.set(BELT_LEN / (SLAT * 4), 1);
  const beltGeo = new THREE.PlaneGeometry(BELT_LEN, 0.72);
  beltGeo.rotateX(-Math.PI / 2);
  const beltMesh = new THREE.Mesh(beltGeo, new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.85, envMapIntensity: 0.3 }));
  beltMesh.position.y = beltY + 0.004;
  scene.add(beltMesh);
  core.own(beltTex);

  /* ---------- the parts, each on its own carrier ---------- */
  const carriers = {} as Record<PartId, Carrier>;
  const box = new THREE.Box3();
  for (const id of CONVEYOR_PARTS) {
    const part = top.parts[id];
    part.removeFromParent();
    part.updateMatrixWorld(true);
    box.setFromObject(part);
    part.position.y = -box.min.y; // sit on its lowest point
    const spin = new THREE.Group();
    spin.add(part);
    spin.scale.setScalar(PART_K);
    const group = new THREE.Group();
    group.add(spin);
    const r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * PART_K;
    const shadow = contactShadow(r * 1.5);
    shadow.position.y = 0.002;
    group.add(shadow);
    group.position.y = beltY + 0.006;
    group.visible = false;
    scene.add(group);
    carriers[id] = { id, group, spin, shadow };
  }
  top.root.removeFromParent(); // the rig is not drawn here

  /* ---------- scanner light, scan sweep, ring ---------- */
  const glow = glowTexture();
  core.own(glow);
  const scanH = surfaceY(scanner, 0, 0, 1.0); // underside of the scanner head
  const scanLight = new THREE.SpotLight(new THREE.Color("#ffffff"), 0, 4, 34 * DEG, 0.6, 1.2);
  scanLight.position.set(0, scanH - 0.02, 0.05);
  scanLight.target.position.set(0, beltY, 0);
  scene.add(scanLight, scanLight.target);
  const sweepGeo = new THREE.PlaneGeometry(0.9, 0.9);
  sweepGeo.rotateX(-Math.PI / 2);
  const sweep = new THREE.Mesh(sweepGeo, new THREE.MeshBasicMaterial({
    map: glow, color: pal.xtreme, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0,
  }));
  sweep.renderOrder = 5;
  scene.add(sweep);
  const ringGeo = new THREE.RingGeometry(0.42, 0.46, 72);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: pal.xtreme, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
  ring.position.y = beltY + 0.008;
  ring.renderOrder = 4;
  scene.add(ring);

  /* ---------- the screen face ---------- */
  const face = screenTexture();
  core.own(face.texture);
  const faceMat = new THREE.MeshBasicMaterial({ map: face.texture, toneMapped: false, color: new THREE.Color(0.6, 0.6, 0.6) });
  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.49), faceMat);
  faceMesh.position.set(0, 0.72, -0.2);
  faceMesh.rotation.y = Math.PI;
  screen.add(faceMesh);

  /* ---------- the robot arm's joints ---------- */
  const joint = (n: string) => arm.getObjectByName(n) ?? new THREE.Object3D();
  const J = { turret: joint("element-a"), shoulder: joint("element-b"), elbow: joint("element-d"), wrist: joint("element-f"), clawA: joint("claw-a"), clawB: joint("claw-b") };
  const clawX = J.clawA.position.x;
  // the turret turns to face the scanner; the arm folds forward over the belt
  const armYaw = Math.atan2(0 - arm.position.x, 0 - arm.position.z);
  const poseArm = (k: number) => {
    J.turret.rotation.y = armYaw;
    J.shoulder.rotation.x = 0.15 + 0.55 * k;
    J.elbow.rotation.x = 0.55 + 0.6 * k;
    J.wrist.rotation.x = 0.45 + 0.35 * k;
    J.clawA.position.x = clawX * (1 - 0.35 * k);
    J.clawB.position.x = -clawX * (1 - 0.35 * k);
  };
  poseArm(0);

  // warm key from the front left, a cool cyan rim from behind, a soft fill so the gunmetal reads
  core.lights.key.color.set("#ffd9b0");
  core.lights.rim.color.set("#5fd8ff");
  core.lights.rim.intensity = 3;
  const fill = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 0.7);
  fill.position.set(1.5, 4, 5);
  scene.add(fill);
  const lampLight = new THREE.PointLight(pal.red, 0, 2.2, 2);
  lampLight.position.set(lamp.position.x, lamp.position.y + 0.6, lamp.position.z + 0.2);
  scene.add(lampLight);
  const lampMats: THREE.MeshStandardMaterial[] = [];
  lamp.traverse((m) => {
    const mesh = m as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.emissive = pal.red.clone();
    mat.emissiveMap = mat.map;
    mat.emissiveIntensity = 0;
    mesh.material = mat;
    lampMats.push(mat);
  });

  core.finalize();

  /* ---------- state ---------- */
  let shown: PartId = (CONVEYOR_PARTS as string[]).includes(o.select ?? "") ? (o.select as PartId) : "blade";
  let target: PartId = shown;
  let leaving: PartId | null = null;
  let travelStart = -1; // time the current switch started (-1: none running)
  let pendingStart = false;
  let arrivedAt = o.still ? -10 : 0; // time the shown part stopped under the scanner
  let beltBase = 0; // belt distance before the current switch
  let turnBase = 0;
  let lastT = 0;
  let instant = reduced;
  const index = (id: PartId) => CONVEYOR_PARTS.indexOf(id);
  const names: Record<PartId, string> = { blade: "Blade", ratchet: "Ratchet", bit: "Bit" };
  const paintScreen = () => face.draw(names[shown], index(shown), `#${pal.xtreme.getHexString()}`);
  paintScreen();
  face.ready.then(() => {
    paintScreen();
    core.invalidate();
  }).catch(() => {});

  const startSwitch = () => {
    leaving = shown;
    shown = target;
    pendingStart = true;
  };
  carriers[shown].group.visible = true;
  o.onShown?.(shown);

  core.setDraw((t) => {
    lastT = t;
    if (pendingStart) {
      travelStart = t;
      pendingStart = false;
    }
    let belt = beltBase;
    let moving = false;
    let u = 1;
    if (travelStart >= 0) {
      u = clamp01((t - travelStart) / TRAVEL);
      const s = RUN * travelEase(u);
      belt = beltBase + s;
      moving = u < 1;
      const inC = carriers[shown];
      inC.group.visible = true;
      inC.group.position.x = -RUN + s;
      if (leaving) {
        const outC = carriers[leaving];
        outC.group.visible = true;
        outC.group.position.x = s;
      }
      if (u >= 1) {
        // arrived: the leaving part is inside the next machine; park it out of sight
        if (leaving) carriers[leaving].group.visible = false;
        leaving = null;
        travelStart = -1;
        beltBase += RUN;
        belt = beltBase;
        arrivedAt = t;
        turnBase = 0;
        paintScreen();
        o.onShown?.(shown);
        if (target !== shown) startSwitch(); // chosen again while travelling: run the belt once more
      }
    } else {
      carriers[shown].group.position.x = 0;
    }

    // belt surface, cogs and lamp follow the belt
    beltTex.offset.x = -(belt / (SLAT * 4)) % 1;
    for (let i = 0; i < cogs.length; i++) cogs[i].rotation.y = (i ? -1 : 1) * belt * 1.6 + (i ? 0.39 : 0);
    const run = moving ? smooth(Math.min(u, 1 - u) * 6) : 0;
    const blink = moving && !o.still ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
    for (const m of lampMats) m.emissiveIntensity = run * blink * 1.4;
    lampLight.intensity = run * blink * 0.9;

    // the part under the scanner: idle turn, scan sweep, ring and screen light up
    const restC = carriers[shown];
    const atRest = travelStart < 0;
    const since = atRest ? t - arrivedAt : 0;
    if (atRest && !reduced && !o.still) restC.spin.rotation.y = turnBase + since * TURN;
    else if (atRest) restC.spin.rotation.y = 0.5;
    const scanU = atRest ? (instant || o.still ? 1 : clamp01(since / SCAN)) : 0;
    sweep.visible = atRest && scanU > 0 && scanU < 1;
    if (sweep.visible) {
      sweep.position.set(0, scanH - (scanH - beltY - 0.01) * smooth(scanU), 0);
      (sweep.material as THREE.MeshBasicMaterial).opacity = 0.9 * Math.sin(Math.PI * scanU);
    }
    const lit = atRest ? smooth((scanU - 0.6) / 0.4) : 0;
    (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * lit;
    faceMat.color.setScalar(0.6 + 0.4 * lit);
    scanLight.intensity = 0.4 + 2.2 * lit;
    const dipU = atRest && !reduced && !o.still ? clamp01((since - SCAN * 0.4) / DIP) : 0;
    poseArm(Math.sin(Math.PI * dipU));

    instant = reduced;
    // keep drawing while something moves; reduced motion draws on demand only
    return !!o.animate && !reduced;
  });
  core.invalidate();

  return {
    setProgress() {},
    select(id, now) {
      if (!(CONVEYOR_PARTS as string[]).includes(id)) return;
      target = id as PartId;
      if (now || reduced) {
        // instant: no travel
        if (leaving) carriers[leaving].group.visible = false;
        for (const c of CONVEYOR_PARTS) carriers[c].group.visible = c === target;
        leaving = null;
        travelStart = -1;
        pendingStart = false;
        shown = target;
        carriers[shown].group.position.x = 0;
        arrivedAt = lastT;
        instant = true;
        paintScreen();
        o.onShown?.(shown);
        core.invalidate();
        return;
      }
      if (travelStart < 0 && !pendingStart && target !== shown) startSwitch();
      core.invalidate();
    },
    setVisible: core.setVisible,
    resize(w, h) {
      if (w > 1 && h > 1) fitCamera(camera, w, h);
      core.resize(w, h);
    },
    dispose: core.dispose,
  };
}
