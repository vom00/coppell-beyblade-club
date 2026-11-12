// The rail catch as a loop: seen from above, the gear on the bit meshes with the rail's teeth, and
// the rail slides past one tooth per turn of a tooth on the gear. Same geometry as RailCatchStill
// (which stays for reduced motion). Server-safe; the motion is CSS (.rcl rules in motion.css).

const PITCH = 36;
const TEETH = 12;
const GX = 300;
const GY = 196;
const R_OUT = 80;
const R_ROOT = 60;

function gearPath() {
  const step = (Math.PI * 2) / TEETH;
  const pts: string[] = [];
  for (let i = 0; i < TEETH; i++) {
    const a = -Math.PI / 2 + i * step;
    for (const [r, k] of [[R_ROOT, -0.5], [R_ROOT, -0.27], [R_OUT, -0.15], [R_OUT, 0.15], [R_ROOT, 0.27]] as const) {
      pts.push(`${(GX + r * Math.cos(a + k * step)).toFixed(1)},${(GY + r * Math.sin(a + k * step)).toFixed(1)}`);
    }
  }
  return `M${pts.join("L")}Z`;
}

const GEAR_D = gearPath();
// Teeth well past both edges, so the slide never shows a gap.
const RAIL_TEETH = Array.from({ length: 28 }, (_, i) => GX + PITCH / 2 + (i - 14) * PITCH);

export default function RailCatchLoop({ className = "" }: { className?: string }) {
  return (
    <svg className={`rcl ${className}`} viewBox="0 0 640 360" role="img" aria-label="The gear on the bit catching the rail" data-loop fill="none">
      <title>The gear on the bit catching the rail</title>
      <desc>
        Seen from above: the rail runs along the edge of the stadium with a row of teeth. The small gear on the bit,
        under the top, meshes with those teeth, so each turn of a tooth on the gear moves the rail past one tooth.
      </desc>

      <rect x="0" y="40" width="640" height="72" fill="currentColor" opacity="0.14" />
      <line x1="0" y1="40" x2="640" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <g className="rcl__rail">
        {RAIL_TEETH.map((x) => (
          <rect key={x} x={x - 9} y="112" width="18" height="30" fill="currentColor" />
        ))}
      </g>

      <circle cx={GX} cy={GY} r="150" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" opacity="0.45" />

      <g className="rcl__gear">
        <path d={GEAR_D} fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <circle cx={GX} cy={GY} r="26" fill="currentColor" opacity="0.85" />
        <circle cx={GX} cy={GY - 44} r="5" fill="var(--bg)" />
      </g>

      <g className="rcl__contact">
        <circle cx={GX} cy="122" r="15" stroke="var(--brand, #e8121a)" strokeWidth="4" />
        <circle cx={GX} cy="122" r="5" fill="var(--brand, #e8121a)" />
      </g>

      {/* The tooth in contact lights up as the gear grips it. */}
      <rect className="rcl__live" x={GX - 9} y="112" width="18" height="30" fill="var(--energy, #6dff3a)" />

      <g className="rcl__go" fill="var(--energy, #6dff3a)">
        {[0, 1, 2].map((k) => (
          <polygon key={k} className="rcl__chev" style={{ animationDelay: `${k * 120}ms` }} points={`${486 + k * 26},14 ${470 + k * 26},24 ${486 + k * 26},34`} />
        ))}
      </g>

      <g
        fill="currentColor"
        style={{ fontFamily: "var(--font-mono-stack, monospace)", fontWeight: 400, letterSpacing: "0" }}
        fontSize="26"
      >
        <text x="24" y="30">[Rail]</text>
        <text x="24" y="300">[Gear]</text>
      </g>
      <line x1="92" y1="292" x2={GX - 70} y2={GY + 40} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
