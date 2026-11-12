// Server-safe still: the gear on the bit meshing with the rail teeth, seen from above.
// Drawn in currentColor so it works on ink and paper grounds; red marks only the contact point.

const PITCH = 36; // rail tooth pitch; the gear's pitch radius below is chosen to match it
const TEETH = 12;
const GX = 300; // gear centre
const GY = 196;
const R_OUT = 80;
const R_ROOT = 60;

function gearPath() {
  const step = (Math.PI * 2) / TEETH;
  const pts: string[] = [];
  for (let i = 0; i < TEETH; i++) {
    const a = -Math.PI / 2 + i * step; // tooth 0 points straight up into the rail
    for (const [r, k] of [[R_ROOT, -0.5], [R_ROOT, -0.27], [R_OUT, -0.15], [R_OUT, 0.15], [R_ROOT, 0.27]] as const) {
      pts.push(`${(GX + r * Math.cos(a + k * step)).toFixed(1)},${(GY + r * Math.sin(a + k * step)).toFixed(1)}`);
    }
  }
  return `M${pts.join("L")}Z`;
}

const GEAR_D = gearPath();
// Rail teeth hang down from the rail; the gap at x = 300 takes the gear's top tooth.
const RAIL_TEETH = Array.from({ length: 17 }, (_, i) => GX + PITCH / 2 + (i - 8) * PITCH).filter((x) => x > 20 && x < 620);

export default function RailCatchStill({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 360"
      role="img"
      aria-label="The gear on the bit catching the rail"
      fill="none"
      stroke="none"
    >
      <title>The gear on the bit catching the rail</title>
      <desc>
        Seen from above: the rail runs along the edge of the stadium with a row of teeth. The small gear on the
        bit, under the top, meshes with those teeth at one point, so the spinning top rolls along the rail.
      </desc>

      {/* Rail body and teeth */}
      <rect x="0" y="40" width="640" height="72" fill="currentColor" opacity="0.14" />
      <line x1="0" y1="40" x2="640" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      {RAIL_TEETH.map((x) => (
        <rect key={x} x={x - 9} y="112" width="18" height="30" fill="currentColor" />
      ))}

      {/* Outline of the blade above, for scale */}
      <circle cx={GX} cy={GY} r="150" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" opacity="0.45" />

      {/* Gear on the bit, and the shaft */}
      <path d={GEAR_D} fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <circle cx={GX} cy={GY} r="26" fill="currentColor" opacity="0.85" />

      {/* Contact point */}
      <circle cx={GX} cy="122" r="15" stroke="var(--red, #e8121a)" strokeWidth="4" />
      <circle cx={GX} cy="122" r="5" fill="var(--red, #e8121a)" />

      {/* Spin direction on the gear */}
      <path
        d={`M ${GX + 104} ${GY + 40} A 112 112 0 0 1 ${GX + 40} ${GY + 104}`}
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.7"
      />
      <polygon points={`${GX + 40},${GY + 104} ${GX + 56},${GY + 93} ${GX + 52},${GY + 112}`} fill="currentColor" opacity="0.7" />

      {/* Travel direction: a clockwise (right-spin) gear rolling under this rail moves the top left */}
      {[0, 1, 2].map((k) => (
        <polygon key={k} points={`${486 + k * 26},14 ${470 + k * 26},24 ${486 + k * 26},34`} fill="currentColor" />
      ))}

      <g
        fill="currentColor"
        style={{ fontFamily: "var(--font-display-stack, 'Arial Narrow', sans-serif)", fontWeight: 700, letterSpacing: "0.06em" }}
        fontSize="26"
      >
        <text x="24" y="30">RAIL</text>
        <text x="24" y="300">GEAR</text>
      </g>
      <line x1="92" y1="292" x2={GX - 70} y2={GY + 40} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
