import Image from "next/image";

/*
 * The crest inside a ring of ticks. The crest image is placed as it is: never redrawn, recoloured,
 * cropped or rotated. All motion is in the layers around it. Server-safe; motion is CSS (.cr rules).
 *  - "arc":   a ring of white ticks with a green highlight that sweeps around it.
 *  - "radar": the same ring turning slowly, a radar sweep behind the crest, and soft pings.
 */

const r2 = (v: number) => Math.round(v * 100) / 100;
const N = 72;

const ring = (r0: number, r1: number, count: number, every = 0) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i * 2 * Math.PI) / count - Math.PI / 2;
    const long = every > 0 && i % every === 0;
    const rr = long ? r1 + 3 : r1;
    return { x1: r2(100 + r0 * Math.cos(a)), y1: r2(100 + r0 * Math.sin(a)), x2: r2(100 + rr * Math.cos(a)), y2: r2(100 + rr * Math.sin(a)) };
  });

const OUTER = ring(94, 99, 90, 5);
const INNER = ring(84, 90, N);
const BLIPS = [
  { left: "74%", top: "26%", angle: 50 },
  { left: "22%", top: "68%", angle: 235 },
  { left: "84%", top: "62%", angle: 125 },
  { left: "36%", top: "16%", angle: 330 },
];
const SWEEP_S = 7;

export default function CrestRing({ variant = "arc", className = "" }: { variant?: "arc" | "radar"; className?: string }) {
  const radar = variant === "radar";
  return (
    <div className={`cr cr--${variant} ${className}`} data-loop>
      {radar && (
        <>
          <span className="cr__sweep" aria-hidden="true" />
          <span className="cr__ping" aria-hidden="true" style={{ animationDelay: "0s" }} />
          <span className="cr__ping" aria-hidden="true" style={{ animationDelay: "1.6s" }} />
          <span className="cr__ping" aria-hidden="true" style={{ animationDelay: "3.2s" }} />
          {BLIPS.map((b) => (
            <i
              key={b.angle}
              className="cr__blip"
              aria-hidden="true"
              style={{ left: b.left, top: b.top, animationDelay: `${((b.angle / 360) * SWEEP_S).toFixed(2)}s` }}
            />
          ))}
        </>
      )}
      <svg className="cr__ticks" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <g className="cr__outer" stroke="#f6f1e9" strokeWidth="1.6" opacity=".75">
          {OUTER.map((t, i) => (
            <line key={i} {...t} />
          ))}
        </g>
        <g className="cr__inner" strokeWidth="2.2" strokeLinecap="butt">
          {INNER.map((t, i) => (
            <line key={i} {...t} style={{ animationDelay: `${((i / N) * SWEEP_S).toFixed(2)}s` }} />
          ))}
        </g>
      </svg>
      <Image className="cr__crest" src="/brand/coppell-beyblade-club-crest.png" alt="" width={560} height={560} sizes="(min-width: 60rem) 20rem, 60vw" />
    </div>
  );
}
