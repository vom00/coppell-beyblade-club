// Clip "match": how a round ends. Each finish diagram plays once, then a Punch Lines score card.
// The diagrams are the site's FinishDiagram (components/motion/Diagrams.tsx): same shapes, and the
// moves from components/motion/motion.css (.dg rules), driven by the frame number instead of CSS.
import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { PunchLines } from "@/components/snap-cn/punch-lines";
import { BODY, C, DISPLAY, SNAP_THEME } from "./look";

export type FinishKind = "spin" | "over" | "burst" | "xtreme";

/** Copy from app/competitive/page.tsx; names and points as on the scoresheet. */
export const FINISHES: { kind: FinishKind; name: string; pts: number; text: string }[] = [
  { kind: "spin", name: "Spin Finish", pts: 1, text: "Your top outspins the opponent's." },
  { kind: "over", name: "Over Finish", pts: 2, text: "You send the opposing top into a knockout pocket." },
  { kind: "burst", name: "Burst Finish", pts: 2, text: "The opposing top comes apart." },
  { kind: "xtreme", name: "Xtreme Finish", pts: 3, text: "You send the opposing top into the Xtreme Zone." },
];
const points = (n: number) => `${n} ${n === 1 ? "point" : "points"}`;

export const MATCH = { motion: 56, card: 51, summary: 45 };
export const MATCH_FRAMES = FINISHES.length * (MATCH.motion + MATCH.card) + MATCH.summary; // 473, 15.8 s

/* ---------- the diagram (Diagrams.tsx shapes, colours from app/tokens.css) ---------- */

const r2 = (v: number) => Math.round(v * 100) / 100;
const rad = (deg: number) => (deg * Math.PI) / 180;
const CX = 60;
const CY = 60;
const INK = "#000000";
const INK2 = "#0e0e0e";
const DIAGRAM = "#e7e7e7";

function arc(r: number, a0: number, a1: number) {
  const x0 = r2(CX + r * Math.cos(rad(a0)));
  const y0 = r2(CY + r * Math.sin(rad(a0)));
  const x1 = r2(CX + r * Math.cos(rad(a1)));
  const y1 = r2(CY + r * Math.sin(rad(a1)));
  return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`;
}
const TEETH = Array.from({ length: 48 }, (_, i) => {
  const a = rad((i * 360) / 48);
  return { x1: r2(CX + 51 * Math.cos(a)), y1: r2(CY + 51 * Math.sin(a)), x2: r2(CX + 57 * Math.cos(a)), y2: r2(CY + 57 * Math.sin(a)) };
});

function Basin({ zone }: { zone?: number }) {
  return (
    <>
      <circle cx={CX} cy={CY} r="50" fill={INK} stroke="rgba(246,241,233,.18)" />
      <g stroke="#f6f1e9" strokeWidth="1.6" opacity=".8">
        {TEETH.map((t, i) => (
          <line key={i} {...t} />
        ))}
      </g>
      <path d={arc(54, 12, 32)} stroke={INK} strokeWidth="9" fill="none" />
      <path d={arc(54, 12, 32)} stroke={DIAGRAM} strokeWidth="1.4" fill="none" opacity=".9" />
      <path d={arc(54, 192, 212)} stroke={INK} strokeWidth="9" fill="none" />
      <path d={arc(54, 192, 212)} stroke={DIAGRAM} strokeWidth="1.4" fill="none" opacity=".9" />
      {zone != null && <path d={arc(55, -112, -68)} stroke={C.energy} strokeWidth="5" fill="none" opacity={zone} />}
    </>
  );
}

function Top({ tone = "red", turn }: { tone?: "red" | "steel"; turn: number }) {
  const body = tone === "red" ? C.brand : C.steel;
  return (
    <g transform={`rotate(${turn})`}>
      <circle r="9.5" fill={INK2} stroke={body} strokeWidth="1.4" />
      {[0, 120, 240].map((a) => (
        <path key={a} d="M-2.6 -6.5 L0 -13 L2.6 -6.5Z" transform={`rotate(${a})`} fill={body} />
      ))}
      {[60, 180, 300].map((a) => (
        <circle key={a} cx="0" cy="-7.4" r="1.7" fill="#e7e7e7" transform={`rotate(${a})`} />
      ))}
      <circle r="3.4" fill={body} />
      <circle r="1.1" fill={INK} />
    </g>
  );
}

/** CSS keyframes as frames: one easing per segment, like a CSS animation-timing-function. */
const DASH = Easing.bezier(0.7, 0, 0.2, 1); // --ease-dash
const kf = (f: number, at: number[], v: number[], easing = DASH) =>
  interpolate(f, at, v, { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
/** .dg__spin--fast: one turn per 0.45 s. */
const fast = (f: number) => (f * 360) / 13.5;

/** One finish at frame `f` of its motion (0..MATCH.motion). Timings are motion.css compressed to about 1.9 s. */
export function Finish({ kind, f }: { kind: FinishKind; f: number }) {
  let body: ReactNode;
  switch (kind) {
    case "spin":
      // dg-wind-down: the steel top turns 1080deg and stops; the red one keeps going.
      body = (
        <>
          <Basin />
          <g transform="translate(40 62)"><Top turn={fast(f)} /></g>
          <g transform="translate(80 58)"><Top tone="steel" turn={kf(f, [0, 40], [0, 1080], Easing.bezier(0.1, 0.55, 0.3, 1))} /></g>
        </>
      );
      break;
    case "over": {
      // dg-push / dg-leave: the red top nudges in, the steel one slides out through the pocket.
      const px = kf(f, [8, 16, 56], [0, 9, 0]);
      const py = kf(f, [8, 16, 56], [0, 5, 0]);
      const lx = kf(f, [8, 34, 42], [0, 42, 56]);
      const ly = kf(f, [8, 34, 42], [0, 16, 20]);
      const ls = kf(f, [8, 34, 42], [1, 0.9, 0.45]);
      const lo = kf(f, [34, 42], [1, 0]);
      body = (
        <>
          <Basin />
          <g transform={`translate(${46 + px} ${56 + py})`}><Top turn={fast(f)} /></g>
          <g transform={`translate(${64 + lx} ${62 + ly}) scale(${ls})`} opacity={lo}><Top tone="steel" turn={fast(f)} /></g>
        </>
      );
      break;
    }
    case "burst": {
      // dg-shake, then dg-blade / dg-ratchet / dg-bit: blade, ratchet and bit fly apart.
      const shake = f >= 8 && f < 14 ? (Math.floor((f - 8) / 2) % 2 === 0 ? [-1.5, 1] : [1.5, -1]) : [0, 0];
      const at = [14, 38, 56];
      const piece = (x: number[], y: number[], r: number[]) =>
        `translate(${kf(f, at, [0, ...x])} ${kf(f, at, [0, ...y])}) rotate(${kf(f, at, [0, ...r])})`;
      body = (
        <>
          <Basin />
          <g transform="translate(36 70)"><Top turn={fast(f)} /></g>
          <g transform={`translate(${74 + shake[0]} ${52 + shake[1]})`}>
            <circle transform={piece([-26, -32], [-18, -22], [160, 220])} r="9" fill="none" stroke={C.steel} strokeWidth="2.6" />
            <polygon transform={piece([24, 30], [-22, -26], [-140, -200])} points="-5,-3 0,-6 5,-3 5,3 0,6 -5,3" fill={C.steel} opacity=".9" />
            <circle transform={piece([4, 6], [26, 32], [0, 0])} r="3.2" fill="#e7e7e7" />
          </g>
        </>
      );
      break;
    }
    case "xtreme": {
      // dg-fly / dg-trace / dg-zone: the steel top is sent up through the green zone.
      const fy = kf(f, [8, 26, 33], [0, -50, -60]);
      const fs = kf(f, [8, 26, 33], [1, 0.8, 0.4]);
      const fo = kf(f, [26, 33], [1, 0]);
      const to = kf(f, [8, 16, 33], [0, 1, 0]);
      const zone = kf(f, [8, 26, 40], [0.55, 1, 0.55], Easing.linear);
      body = (
        <>
          <Basin zone={zone} />
          <g transform="translate(60 74)"><Top turn={fast(f)} /></g>
          <g transform="translate(60 52)">
            {/* the trace follows the top up into the zone */}
            <line x1="0" y1="0" x2="0" y2={Math.min(fy, -0.1)} stroke={C.energy} strokeWidth="3" strokeLinecap="round" opacity={to} />
            <g transform={`translate(0 ${fy}) scale(${fs})`} opacity={fo}><Top tone="steel" turn={fast(f)} /></g>
          </g>
        </>
      );
      break;
    }
  }
  return (
    <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", display: "block" }}>
      {body}
    </svg>
  );
}

/* ---------- shots ---------- */

/** The diagram in a dark card, its sentence beside it. */
function MotionShot({ i }: { i: number }) {
  const f = useCurrentFrame();
  const fin = FINISHES[i];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 70, top: 50, width: 620, height: 620, background: C.card, border: `2px solid ${C.border}`, borderRadius: 40, padding: 20 }}>
        <div style={{ width: "100%", height: "100%", background: INK, borderRadius: 26, overflow: "hidden" }}>
          <Finish kind={fin.kind} f={f} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 750, top: 0, bottom: 0, width: 470, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: BODY, fontSize: 30, color: C.muted, marginBottom: 22 }}>[{i + 1}/4]</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 54, lineHeight: 1.12, color: C.fg, letterSpacing: "-0.02em" }}>{fin.text}</div>
        <div style={{ fontFamily: BODY, fontSize: 30, lineHeight: 1.4, color: C.muted, marginTop: 30 }}>
          Red: your top
          <br />
          Silver: the opponent&apos;s
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ScoreCard({ i }: { i: number }) {
  const fin = FINISHES[i];
  return (
    <PunchLines
      script={`${fin.name} / ${points(fin.pts)}`}
      styles="punch"
      sizes="1"
      holds={String(MATCH.card)}
      accentBeat={0}
      fontSize={132}
      fontFamily={DISPLAY}
      lineHeight={1.02}
      punchFrames={10}
      wordStagger={2}
      pushFrom={0.97}
      pushRate={0.03}
      fit={0.86}
      ground={C.bg}
      ink={C.fg}
      mode="dark"
      theme={SNAP_THEME}
    />
  );
}

/** The four finishes and their points: the last shot and the poster. */
export function Summary({ f = 999 }: { f?: number }) {
  return (
    <AbsoluteFill style={{ background: C.bg, padding: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 24 }}>
      {FINISHES.map((fin, n) => {
        const a = interpolate(f, [n * 4, n * 4 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={fin.kind}
            style={{
              opacity: a, transform: `translateY(${(1 - a) * 14}px)`,
              background: C.card, border: `2px solid ${C.border}`, borderRadius: 36, padding: 18, display: "flex", alignItems: "center", gap: 26,
            }}
          >
            <div style={{ width: 236, height: 236, flex: "none", background: INK, borderRadius: 22, overflow: "hidden" }}>
              {/* a frame from the middle of each move, where it reads best as a still */}
              <Finish kind={fin.kind} f={{ spin: 56, over: 30, burst: 40, xtreme: 20 }[fin.kind]} />
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 42, lineHeight: 1.05, color: C.fg, letterSpacing: "-0.02em" }}>{fin.name}</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 60, lineHeight: 1, marginTop: 14, color: C.brandBright }}>{points(fin.pts)}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function SummaryShot() {
  return <Summary f={useCurrentFrame()} />;
}

export function Match() {
  const per = MATCH.motion + MATCH.card;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {FINISHES.map((fin, i) => (
        <Sequence key={fin.kind} from={i * per} durationInFrames={per}>
          <Sequence durationInFrames={MATCH.motion}>
            <MotionShot i={i} />
          </Sequence>
          <Sequence from={MATCH.motion} durationInFrames={MATCH.card}>
            <ScoreCard i={i} />
          </Sequence>
        </Sequence>
      ))}
      <Sequence from={FINISHES.length * per}>
        <SummaryShot />
      </Sequence>
    </AbsoluteFill>
  );
}
