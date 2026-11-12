// Clip "basics": how Dran Sword 3-60F fits together.
// Assembled top, one Card Rail pass across blade, ratchet and bit, then the exploded view with labels.
import type { ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CARD_W, CardRail, FLICK, GAP, read, TRAVEL } from "@/components/snap-cn/card-rail";
import { BODY, C, DISPLAY, SNAP_THEME } from "./look";

export const BASICS = { open: 30, rail: 150, explode: 120 };
export const BASICS_FRAMES = BASICS.open + BASICS.rail + BASICS.explode; // 300 = 10 s

// video/public/explode/dran-sword-00..18.webp: explode 0..1, rendered by `node scripts/render-scenes.mjs clips`
const STEPS = 18;
const still = (i: number) => staticFile(`explode/dran-sword-${String(i).padStart(2, "0")}.webp`);
const fade = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** The Learn turntable render, 720 px square, left of centre. `e` is the explode amount 0..1. */
function Top({ e }: { e: number }) {
  return <Img src={still(Math.round(e * STEPS))} style={{ position: "absolute", left: 100, top: 0, width: 720, height: 720 }} />;
}

/** Copy from lib/content.ts (bayTops, dran-sword). Heights are where each part sits in the exploded render. */
const PARTS = [
  { name: "Blade", value: "Dran Sword", y: 136, edge: 672 },
  { name: "Ratchet", value: "3-60", y: 290, edge: 622 },
  { name: "Bit", value: "Flat (F)", y: 470, edge: 545 },
];

/** The last shot (and the poster): the exploded view, each part named. */
export function Exploded({ f = 999 }: { f?: number }) {
  const e = Easing.inOut(Easing.cubic)(fade(f, 10, 42));
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Top e={e} />
      {PARTS.map((p, n) => {
        const a = fade(f, 38 + n * 5, 54 + n * 5);
        return (
          <div key={p.name} style={{ opacity: a }}>
            <div style={{ position: "absolute", left: p.edge + 16, top: p.y - 1.5, width: (836 - p.edge - 16) * a, height: 3, background: C.brand }} />
            <div style={{ position: "absolute", left: 852, top: p.y - 38, transform: `translateX(${(1 - a) * 24}px)` }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 60, lineHeight: 1, color: C.fg, letterSpacing: "-0.02em" }}>{p.name}</div>
              <div style={{ fontFamily: BODY, fontSize: 38, lineHeight: 1, marginTop: 12, color: C.muted }}>{p.value}</div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 852, top: 620, opacity: fade(f, 56, 70), fontFamily: DISPLAY, fontWeight: 600, fontSize: 40, color: C.muted }}>
        Dran Sword 3-60F
      </div>
    </AbsoluteFill>
  );
}

function Opening() {
  const f = useCurrentFrame();
  const a = fade(f, 0, 10);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Top e={0} />
      <div style={{ position: "absolute", left: 852, top: 280, opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 64, lineHeight: 1.02, color: C.fg, letterSpacing: "-0.025em" }}>
          Dran Sword
          <br />
          3-60F
        </div>
        <div style={{ fontFamily: BODY, fontSize: 40, marginTop: 20, color: C.muted }}>Three parts</div>
      </div>
    </AbsoluteFill>
  );
}

const CARDS = [
  { image: still(0) },
  { image: staticFile("site/conveyor-poster.webp") },
  { image: staticFile("site/conveyor-poster-ratchet.webp") },
  { image: staticFile("site/conveyor-poster-bit.webp") },
  { image: still(STEPS) },
];
const CAPTIONS = [
  { name: "Dran Sword 3-60F", value: "" },
  ...PARTS.map(({ name, value }) => ({ name, value })),
];
const RAIL = { from: 6, every: 46, flicks: 3, nudge: 15 }; // nudge: TRAVEL overshoots PITCH, so split the error between the first and last card
const PITCH = CARD_W + GAP;
const CENTRE = (714 - CARD_W) / 2; // card-rail's own 714 px reference stage

function Rail() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // The same sum card-rail uses, to know which card is in the middle and when it has slowed down.
  let travelled = 0;
  for (let k = 0; k < RAIL.flicks; k++) travelled += TRAVEL * read(FLICK, (f - RAIL.from - k * RAIL.every) / fps);
  const at = (travelled - RAIL.nudge) / PITCH;
  const idx = Math.round(at);
  const cap = CAPTIONS[idx] ?? CAPTIONS[0];
  const show = interpolate(Math.abs(at - idx), [0.15, 0.35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <CardRail
        cards={CARDS}
        heading="How a top fits together"
        from={RAIL.from}
        every={RAIL.every}
        flicks={RAIL.flicks}
        offset={CENTRE + RAIL.nudge}
        fontFamily={DISPLAY}
        mode="dark"
        theme={{ ...SNAP_THEME, background: "rgba(0,0,0,0)" }}
      />
      <div
        style={{
          position: "absolute", left: "50%", bottom: 40, transform: `translateX(-50%) translateY(${(1 - show) * 12}px)`, opacity: show,
          background: C.card, border: `2px solid ${C.borderStrong}`, borderRadius: 999, padding: "16px 40px",
          display: "flex", alignItems: "baseline", gap: 22, whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 52, lineHeight: 1, color: C.fg }}>{cap.name}</span>
        {cap.value && <span style={{ fontFamily: BODY, fontSize: 38, lineHeight: 1, color: C.muted }}>{cap.value}</span>}
      </div>
    </AbsoluteFill>
  );
}

function ExplodedShot() {
  return <Exploded f={useCurrentFrame()} />;
}

/** One shot. Shot boundaries dip through black, DIP frames each way. */
const DIP = 5;
function Shot({ from, len, children }: { from: number; len: number; children: ReactNode }) {
  const f = useCurrentFrame();
  const a = Math.min(from === 0 ? 1 : fade(f, from, from + DIP), from + len >= BASICS_FRAMES ? 1 : 1 - fade(f, from + len - DIP, from + len));
  return (
    <Sequence from={from} durationInFrames={len} style={{ opacity: a }}>
      {children}
    </Sequence>
  );
}

export function Basics() {
  const { open, rail, explode } = BASICS;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Shot from={0} len={open}>
        <Opening />
      </Shot>
      <Shot from={open} len={rail}>
        <Rail />
      </Shot>
      <Shot from={open + rail} len={explode}>
        <ExplodedShot />
      </Shot>
    </AbsoluteFill>
  );
}
