// Pure pose math shared by the scenes, the captions and the labels. No three.js here, so this
// module is safe in the initial bundle and on the server.
//
// Stadium units: rail radius ~0.88. Angle convention (top view): x = r cos(th), z = -r sin(th),
// so th = 0 is the right side, 90deg the far wall, 270deg the side nearest the camera.

export const DEG = Math.PI / 180;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- Stadium and top dimensions: the one place the models are fitted to the scene ---------- */
//
// Measured on the supplied models (assets-src/models), in their own units. assets.ts applies the
// fit below when it loads them; effects, camera and choreography read only the scene values.

/** Supplied stadium (public/models/stadium.glb, built by scripts/build-stadium.mjs). */
export const STADIUM_SRC = {
  centre: [-0.0226, 1.4021] as const, // x, z of the rail's circle
  floorCentreY: 4.647, // bottom of the centre cone
  floorRailY: 5.54, // flat floor just inside the rail
  railTopY: 6.632, // top of the rail and its teeth
  toothTipR: 32.6, // inner tips of the rail teeth
  toothRootR: 33.03, // rail face between the teeth
  flatR: 28.5, // where the centre cone meets the flat run to the rail
  xtremeAt: 270 * DEG, // scene angle (convention above) of the Xtreme zone as authored
};
/** Supplied tops share one unit; Dran Sword's blade radius sets the scene size. */
export const TOP_SRC = { bladeR: 0.245, gearLo: 0.058, gearHi: 0.098, gearR: 0.07 };

/** Scene size of the top: blade radius. Every top is scaled by the same factor. */
export const TOP_R = 0.184;
export const TOP_SCALE = TOP_R / TOP_SRC.bladeR;
export const GEAR_R = TOP_SRC.gearR * TOP_SCALE; // outer reach of the toothed gear on the bit
export const GEAR_Y = ((TOP_SRC.gearLo + TOP_SRC.gearHi) / 2) * TOP_SCALE; // gear centre above the tip
/** Home draws the top larger than the stadium's true scale so the gear reads at stadium distance. */
export const HOME_TOP_SCALE = 1.3;

/** Scene radius of the rail tooth tips; the stadium is scaled to put them here. */
export const RAIL_TIP_R = 0.86;
export const STADIUM_SCALE = RAIL_TIP_R / STADIUM_SRC.toothTipR;
/** Vertical stretch of the whole stadium, and extra stretch of the rail above the floor, so the
 * rail stands as tall as the (exaggerated) top's gear and the two visibly mesh. */
export const STADIUM_Y = 1.25;
export const RAIL_Y = 2.4;
/** Turn the stadium so its Xtreme zone sits here (near side, slightly left of the Home camera). */
export const XTREME_AT = 246 * DEG;

export const FLOOR_H = (STADIUM_SRC.floorRailY - STADIUM_SRC.floorCentreY) * STADIUM_SCALE * STADIUM_Y; // floor at the rail
export const RAIL_TOP = FLOOR_H + (STADIUM_SRC.railTopY - STADIUM_SRC.floorRailY) * STADIUM_SCALE * STADIUM_Y * RAIL_Y;
const FLAT_R = STADIUM_SRC.flatR * STADIUM_SCALE;
/** Top centre radius while meshed: gear tips just inside the rail tooth tips. */
export const R_RUN = RAIL_TIP_R - GEAR_R * HOME_TOP_SCALE + 0.004;

/** Bowl floor height at radius r: a shallow cone from the centre, flat where the top rides the rail. */
export function floorY(r: number) {
  return FLOOR_H * Math.min(1, r / FLAT_R);
}

/** The rail is lit in this many angular bins (about one tooth each). */
export const RAIL_BINS = 384;
export const binAngle = (i: number) => ((i + 0.5) / RAIL_BINS) * Math.PI * 2;

/* ---------- Home: the path of the top ---------- */

type V2 = [number, number];
const polar = (th: number, r = R_RUN): V2 => [r * Math.cos(th), -r * Math.sin(th)];
const ccwTangent = (th: number): V2 => [-Math.sin(th), -Math.cos(th)];
const cubic = (a: V2, b: V2, c: V2, d: V2, t: number): V2 => {
  const u = 1 - t;
  const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
  return [w0 * a[0] + w1 * b[0] + w2 * c[0] + w3 * d[0], w0 * a[1] + w1 * b[1] + w2 * c[1] + w3 * d[1]];
};
const add = (a: V2, b: V2, k = 1): V2 => [a[0] + b[0] * k, a[1] + b[1] * k];

// The camera looks in from 246deg, so screen-right is ~336deg and screen-left ~156deg. Every move
// is kept lateral to the camera: drift right, catch the rail side-on (gear and teeth in profile),
// run up the right-hand rail, then dash left across the far half of the bowl.
const TH_CONTACT = -22 * DEG;
const TH_EXIT = 42 * DEG;
const START: V2 = [-0.02, 0.1];
const REST: V2 = [-0.4, -0.06];

const P0 = polar(TH_CONTACT);
const T0 = ccwTangent(TH_CONTACT);
const P1 = polar(TH_EXIT);
const T1 = ccwTangent(TH_EXIT);
const N1: V2 = [-Math.cos(TH_EXIT), Math.sin(TH_EXIT)]; // inward normal at the exit
const DASH_C2: V2 = [-0.62, -0.42];

const samples: V2[] = [];
// 1. drift from the centre out to the rail, arriving along the rail
for (let i = 0; i <= 60; i++) samples.push(cubic(START, [0.25, 0.45], add(P0, T0, -0.22), P0, i / 60));
const D_CONTACT_INDEX = samples.length - 1;
// 2. along the rail, counter-clockwise (a right-spin top rolls this way inside a toothed ring)
for (let i = 1; i <= 90; i++) samples.push(polar(lerp(TH_CONTACT, TH_EXIT, i / 90)));
const D_EXIT_INDEX = samples.length - 1;
// 3. the dash: off the rail and across the bowl, then a short settle
for (let i = 1; i <= 90; i++)
  samples.push(cubic(P1, add(add(P1, T1, 0.3), N1, 0.1), DASH_C2, REST, i / 90));

const dist: number[] = [0];
for (let i = 1; i < samples.length; i++) {
  const a = samples[i - 1], b = samples[i];
  dist.push(dist[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
}
const D_CONTACT = dist[D_CONTACT_INDEX];
const D_EXIT = dist[D_EXIT_INDEX];
const D_END = dist[dist.length - 1];

/** Point and unit heading at arc length d along the path. */
export function pathAt(d: number): { x: number; z: number; tx: number; tz: number } {
  const dd = Math.min(Math.max(d, 0), D_END);
  let lo = 0, hi = dist.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (dist[mid] <= dd) lo = mid;
    else hi = mid;
  }
  const a = samples[lo], b = samples[hi];
  const seg = dist[hi] - dist[lo] || 1;
  const t = (dd - dist[lo]) / seg;
  const tx = (b[0] - a[0]) / seg, tz = (b[1] - a[1]) / seg;
  return { x: lerp(a[0], b[0], t), z: lerp(a[1], b[1], t), tx, tz };
}

/* ---------- Home: the scroll timeline (progress 0..1) ---------- */

export const T = {
  approach: [0.12, 0.38] as const, // top drifts from the centre to the rail
  catch: [0.38, 0.5] as const, // gear meets the rail; highlight peaks at 0.44
  run: [0.5, 0.84] as const, // accelerates along the rail, dashes across, slows
};
// Split the run so speed is continuous where the top leaves the rail.
const P_EXIT = T.run[0] + ((T.run[1] - T.run[0]) * (D_EXIT - D_CONTACT)) / (D_END - D_CONTACT);

function distAt(p: number) {
  if (p <= T.approach[0]) return 0;
  if (p < T.approach[1]) return D_CONTACT * smooth((p - T.approach[0]) / (T.approach[1] - T.approach[0]));
  if (p < T.run[0]) return D_CONTACT;
  if (p < P_EXIT) {
    const u = (p - T.run[0]) / (P_EXIT - T.run[0]);
    return D_CONTACT + (D_EXIT - D_CONTACT) * u * u; // accelerating on the rail
  }
  if (p < T.run[1]) {
    const u = (p - P_EXIT) / (T.run[1] - P_EXIT);
    return D_EXIT + (D_END - D_EXIT) * (1 - (1 - u) * (1 - u)); // decelerating across the bowl
  }
  return D_END;
}

export interface RailPose {
  x: number;
  y: number;
  z: number;
  tx: number;
  tz: number;
  /** path speed, used for the lean and the trace length */
  speed: number;
  /** 0..1 strength of the gear/rail contact highlight */
  highlight: number;
  /** arc-length range of the red trace (from === to means no trace) */
  traceFrom: number;
  traceTo: number;
}

const TRACE_MAX = 0.75;

/** The whole Home pose as a pure function of scroll progress. */
export function railPose(p: number): RailPose {
  const d = distAt(p);
  const eps = 0.002;
  const speed = (distAt(p + eps) - distAt(p - eps)) / (2 * eps);
  const pt = pathAt(d);
  const r = Math.hypot(pt.x, pt.z);
  const highlight = smooth((p - 0.365) / 0.04) * (1 - smooth((p - 0.48) / 0.05));
  const len = p > T.run[0] ? Math.min(TRACE_MAX, speed * 0.07, d - D_CONTACT) : 0;
  return { x: pt.x, y: floorY(r), z: pt.z, tx: pt.tx, tz: pt.tz, speed, highlight, traceFrom: d - len, traceTo: d };
}

/* ---------- Home: which rail teeth are lit (pure in progress) ---------- */

export interface RailLight {
  /** stadium angle of the gear contact, and how strongly the teeth there glow */
  head: number;
  headAmt: number;
  /** the stretch of rail the top has run along (angles, from <= to), and its glow */
  arcFrom: number;
  arcTo: number;
  arcAmt: number;
  /** 0..1 strength of sparks at the contact */
  sparks: number;
}

export function railLight(p: number): RailLight {
  const d = distAt(p);
  const pt = pathAt(d);
  const r = Math.hypot(pt.x, pt.z);
  const th = Math.atan2(-pt.z, pt.x);
  // the gear lights the teeth as it closes on them, and stops as the dash pulls it away
  const engage = smooth((r - (R_RUN - 0.06)) / 0.055);
  const onRail = d >= D_CONTACT - 1e-6;
  const arcTo = onRail ? (d <= D_EXIT ? TH_CONTACT + ((TH_EXIT - TH_CONTACT) * (d - D_CONTACT)) / (D_EXIT - D_CONTACT) : TH_EXIT) : TH_CONTACT;
  const arcAmt = onRail ? 1 - smooth((p - P_EXIT) / 0.11) : 0;
  const eps = 0.002;
  const speed = (distAt(p + eps) - distAt(p - eps)) / (2 * eps);
  // sparks: a steady grind while the gear sits meshed, harder while it runs the rail
  const sparks = engage * (onRail ? Math.min(1, 0.55 + speed * 0.06) : 0.35);
  return { head: th, headAmt: engage, arcFrom: TH_CONTACT - 3 * DEG, arcTo, arcAmt, sparks };
}

/** Progress where the top leaves the rail; the dash runs from here to T.run[1]. */
export const DASH_START = P_EXIT;

/** Caption cross-fade keyframes: [in-start, in-end, out-start, out-end] in progress. */
export const CAPTION_RANGES: [number, number, number, number][] = [
  [0.13, 0.17, 0.33, 0.37],
  [0.37, 0.41, 0.49, 0.53],
  [0.53, 0.57, 0.77, 0.81],
];
export const INTRO_OUT: [number, number] = [0.09, 0.14];
export const OUTRO_IN: [number, number] = [0.81, 0.86];

/** Progress at which each copy layer is fully shown; used to scroll a focused layer into view. */
export const LAYER_FOCUS_P = { intro: 0, captions: [0.25, 0.45, 0.66], outro: 0.95 };

/* ---------- Home camera (shared so the poster capture matches) ---------- */

export const HOME_CAM = { target: [0.02, 0.0, 0.05] as V3, az: -24 * DEG, el: 30 * DEG, dist: 4.6, fov: 27 };

export interface CamState {
  target: V3;
  az: number;
  el: number;
  dist: number;
  fov: number;
}

// Camera beats: rest, push in on the catch, ride the rail, pull wide for the dash, settle.
const CP = polar(TH_CONTACT);
const XP = polar(TH_EXIT);
const CAM_KEYS: [number, CamState][] = [
  [0, HOME_CAM],
  [0.13, HOME_CAM],
  [0.36, { target: [CP[0] * 0.55, 0.05, CP[1] * 0.55], az: -20 * DEG, el: 26 * DEG, dist: 3.6, fov: 27 }],
  [0.45, { target: [CP[0] * 0.95, 0.07, CP[1] * 0.95], az: -30 * DEG, el: 21 * DEG, dist: 2.55, fov: 27 }],
  [0.5, { target: [CP[0] * 0.93, 0.07, CP[1] * 0.93], az: -28 * DEG, el: 22 * DEG, dist: 2.65, fov: 27 }],
  [P_EXIT, { target: [XP[0] * 0.55, 0.05, XP[1] * 0.55], az: -20 * DEG, el: 26 * DEG, dist: 3.6, fov: 27 }],
  [0.74, { target: [-0.1, 0.0, -0.02], az: -27 * DEG, el: 36 * DEG, dist: 5.2, fov: 27 }],
  [0.86, { target: [-0.04, 0.0, 0.02], az: -26 * DEG, el: 33 * DEG, dist: 4.95, fov: 27 }],
  [1, { target: [0.01, 0.0, 0.04], az: -24 * DEG, el: 31 * DEG, dist: 4.75, fov: 27 }],
];

/** Home camera as a pure function of progress (time-based drift is added by the engine). */
export function homeCamAt(p: number): CamState {
  let k = 1;
  while (k < CAM_KEYS.length - 1 && CAM_KEYS[k][0] < p) k++;
  const [p0, a] = CAM_KEYS[k - 1];
  const [p1, b] = CAM_KEYS[k];
  const t = smooth((p - p0) / Math.max(1e-6, p1 - p0));
  return {
    target: [lerp(a.target[0], b.target[0], t), lerp(a.target[1], b.target[1], t), lerp(a.target[2], b.target[2], t)],
    az: lerp(a.az, b.az, t),
    el: lerp(a.el, b.el, t),
    dist: lerp(a.dist, b.dist, t),
    fov: lerp(a.fov, b.fov, t),
  };
}

/** 0..1 how much the dash is under way (speed words, streaks). Pure in progress. */
export const dashAt = (p: number) => smooth((p - (P_EXIT - 0.02)) / 0.05) * (1 - smooth((p - 0.8) / 0.06));

/* ---------- Learn: exploded view ---------- */

type V3 = [number, number, number];

export const PARTS_CAM = { target: [-0.03, 0.265, 0] as V3, az: 0, el: 14 * DEG, dist: 1.78, fov: 24 };
export const PARTS_ASPECT = 1;

/** Explode amount 0..1 from the Learn section's scroll progress. */
export const explodeAt = (p: number) => smooth((p - 0.1) / 0.55);
/** A slow quarter-turn tied to progress so the blade's wings read; still a pure function. */
export const turnAt = (p: number) => 0.45 + p * 1.1;

/**
 * Vertical lift of each part at full explode. The spacing is Knight Shield's own "explode" clip at
 * its widest (blade 0.269, ratchet 0.158, bit 0; TopModel.explode measures it on load), plus 0.02
 * for every part so all three float off the mat like the official diagram.
 */
export const LIFT = { blade: 0.289, ratchet: 0.178, bit: 0.02 } as const;
/**
 * Label anchors on the right-hand edge of each part of Knight Shield, in the top's own frame (r, y):
 * the widest radius of each part and the mean height of the points out there.
 */
const ANCHOR = { blade: [0.18, 0.229], ratchet: [0.15, 0.162], bit: [0.06, 0.081] } as const;

export function camPos(c: { target: V3; az: number; el: number; dist: number }): V3 {
  const ce = Math.cos(c.el);
  return [
    c.target[0] + c.dist * ce * Math.sin(c.az),
    c.target[1] + c.dist * Math.sin(c.el),
    c.target[2] + c.dist * ce * Math.cos(c.az),
  ];
}

/** Project a world point with a look-at camera to normalised frame coords (0..1, y down). */
export function project(c: typeof PARTS_CAM, aspect: number, P: V3): [number, number] {
  const C = camPos(c);
  let f: V3 = [c.target[0] - C[0], c.target[1] - C[1], c.target[2] - C[2]];
  const fl = Math.hypot(...f);
  f = [f[0] / fl, f[1] / fl, f[2] / fl];
  // right = f x up(0,1,0)
  let rt: V3 = [-f[2], 0, f[0]];
  const rl = Math.hypot(...rt);
  rt = [rt[0] / rl, 0, rt[2] / rl];
  const up: V3 = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]];
  const d: V3 = [P[0] - C[0], P[1] - C[1], P[2] - C[2]];
  const xc = d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2];
  const yc = d[0] * up[0] + d[1] * up[1] + d[2] * up[2];
  const zc = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
  const t = Math.tan((c.fov * DEG) / 2);
  return [(xc / (zc * t * aspect) + 1) / 2, (1 - yc / (zc * t)) / 2];
}

export type PartId = keyof typeof LIFT;

/** Where each part's label anchor sits in the frame (normalised), for an explode amount. */
export function partAnchors(e: number): Record<PartId, [number, number]> {
  const out = {} as Record<PartId, [number, number]>;
  for (const id of Object.keys(LIFT) as PartId[]) {
    const [r, y] = ANCHOR[id];
    out[id] = project(PARTS_CAM, PARTS_ASPECT, [r, y + LIFT[id] * e, 0]);
  }
  return out;
}
