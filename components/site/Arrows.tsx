import type { CSSProperties } from "react";

// The crest's three arrows, as a small mark after a link label. On hover they dash, one after another.
const CHEVRONS = ["M1 1l5 5-5 5", "M9 1l5 5-5 5", "M17 1l5 5-5 5"];

export default function Arrows() {
  return (
    <svg className="arrows" viewBox="0 0 24 12" aria-hidden="true" focusable="false">
      {CHEVRONS.map((d, k) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="2" style={{ "--k": k } as CSSProperties} />
      ))}
    </svg>
  );
}
