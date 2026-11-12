import type { CSSProperties, ReactNode } from "react";

/*
 * Small stadium diagrams, drawn from above. Server-safe: all motion is CSS (see motion.css, the
 * .dg rules), gated by data-loop so it pauses offscreen and stops under reduced motion.
 * Every diagram is decorative (aria-hidden); the meaning is in the text beside it.
 * Trig results are rounded so the server and the browser print identical coordinates.
 */

const r2 = (v: number) => Math.round(v * 100) / 100;
const rad = (deg: number) => (deg * Math.PI) / 180;
const CX = 60;
const CY = 60;

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

/** The basin: black floor, ring of rail teeth, two pockets, and the Xtreme zone at the top. */
function Basin({ zone = false }: { zone?: boolean }) {
  return (
    <>
      <circle cx={CX} cy={CY} r="50" fill="var(--ink)" stroke="rgba(246,241,233,.18)" />
      <g stroke="#f6f1e9" strokeWidth="1.6" opacity=".8">
        {TEETH.map((t, i) => (
          <line key={i} {...t} />
        ))}
      </g>
      {/* pockets */}
      <path d={arc(54, 12, 32)} stroke="var(--ink)" strokeWidth="9" fill="none" />
      <path d={arc(54, 12, 32)} stroke="var(--diagram)" strokeWidth="1.4" fill="none" opacity=".9" />
      <path d={arc(54, 192, 212)} stroke="var(--ink)" strokeWidth="9" fill="none" />
      <path d={arc(54, 192, 212)} stroke="var(--diagram)" strokeWidth="1.4" fill="none" opacity=".9" />
      {zone && <path className="dg__zone" d={arc(55, -112, -68)} stroke="var(--energy)" strokeWidth="5" fill="none" />}
    </>
  );
}

/** A top seen from above: three blade lobes, a ratchet ring, a bit hub. */
function Top({ tone = "red", className = "", spinClass = "" }: { tone?: "red" | "steel"; className?: string; spinClass?: string }) {
  const body = tone === "red" ? "var(--brand)" : "var(--steel)";
  return (
    <g className={className}>
      <g className={`dg__spin ${spinClass}`}>
        <circle r="9.5" fill="var(--ink-2)" stroke={body} strokeWidth="1.4" />
        {[0, 120, 240].map((a) => (
          <path key={a} d="M-2.6 -6.5 L0 -13 L2.6 -6.5Z" transform={`rotate(${a})`} fill={body} />
        ))}
        {[60, 180, 300].map((a) => (
          <circle key={a} cx="0" cy="-7.4" r="1.7" fill="#e7e7e7" transform={`rotate(${a})`} />
        ))}
        <circle r="3.4" fill={body} />
        <circle r="1.1" fill="var(--ink)" />
      </g>
    </g>
  );
}

function Panel({ children, className = "", label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div className={`dg ${className}`} data-ground="ink" data-loop aria-hidden="true">
      <svg viewBox="0 0 120 120" focusable="false" role="presentation">
        {children}
      </svg>
      {label ? <span className="dg__label">{label}</span> : null}
    </div>
  );
}

export type FinishKind = "spin" | "over" | "burst" | "xtreme";

/** One looping diagram per finish. The moves match the scoresheet copy beside each one. */
export function FinishDiagram({ kind }: { kind: FinishKind }) {
  switch (kind) {
    case "spin":
      return (
        <Panel className="dg--spin">
          <Basin />
          <g transform="translate(40 62)">
            <Top spinClass="dg__spin--fast" />
          </g>
          <g transform="translate(80 58)">
            <Top tone="steel" spinClass="dg__spin--stop" />
          </g>
        </Panel>
      );
    case "over":
      return (
        <Panel className="dg--over">
          <Basin />
          <g transform="translate(46 56)">
            <Top className="dg__push" spinClass="dg__spin--fast" />
          </g>
          <g transform="translate(64 62)">
            <Top tone="steel" className="dg__leave" spinClass="dg__spin--fast" />
          </g>
        </Panel>
      );
    case "burst":
      return (
        <Panel className="dg--burst">
          <Basin />
          <g transform="translate(36 70)">
            <Top spinClass="dg__spin--fast" />
          </g>
          <g transform="translate(74 52)">
            <g className="dg__shake">
              <circle className="dg__piece dg__piece--blade" r="9" fill="none" stroke="var(--steel)" strokeWidth="2.6" />
              <polygon className="dg__piece dg__piece--ratchet" points="-5,-3 0,-6 5,-3 5,3 0,6 -5,3" fill="var(--steel)" opacity=".9" />
              <circle className="dg__piece dg__piece--bit" r="3.2" fill="#e7e7e7" />
            </g>
          </g>
        </Panel>
      );
    case "xtreme":
      return (
        <Panel className="dg--xtreme">
          <Basin zone />
          <g transform="translate(60 74)">
            <Top className="dg__home" spinClass="dg__spin--fast" />
          </g>
          <g transform="translate(60 52)">
            <line className="dg__trace" x1="0" y1="0" x2="0" y2="34" stroke="var(--energy)" strokeWidth="3" strokeLinecap="round" />
            <Top tone="steel" className="dg__fly" spinClass="dg__spin--fast" />
          </g>
        </Panel>
      );
  }
}

export type TypeKind = "attack" | "defense" | "stamina" | "balance";

/** Where each type's top goes, drawn as a dashed route and a top that follows it in a loop. */
const ROUTES: Record<TypeKind, string> = {
  attack: "M22 86L96 30L28 34L94 88L56 60Z",
  defense: "M50 60a10 10 0 1 0 20 0a10 10 0 1 0-20 0",
  stamina: "M30 60a30 30 0 1 0 60 0a30 30 0 1 0-60 0",
  balance: "M90 60L81 81L60 90L39 81L30 60L36 42L94 40L82 34L90 60",
};

export function TypeDiagram({ kind }: { kind: TypeKind }) {
  return (
    <Panel className={`dg--${kind} dg--type`}>
      <Basin />
      <path d={ROUTES[kind]} fill="none" stroke="var(--diagram)" strokeWidth="1.4" strokeDasharray="3 4" opacity=".75" />
      {kind === "defense" && <circle className="dg__shield" cx={CX} cy={CY} r="16" fill="none" stroke="var(--diagram)" strokeWidth="2" />}
      <g transform={`translate(${CX} ${CY})`}>
        <g className="dg__route">
          <Top spinClass="dg__spin--fast" />
        </g>
      </g>
    </Panel>
  );
}

const TYPE_COLOR: Record<string, string> = {
  Attack: "var(--brand-bright)",
  Defense: "#e7e7e7",
  Stamina: "#a3a3a3",
  Balance: "#6f6f6f",
};

/** A small spinning top-down glyph, coloured by type. Steel when the type is not named. */
export function TopGlyph({ type, color: tint, className = "" }: { type?: string; color?: string; className?: string }) {
  const color = tint ?? (type && TYPE_COLOR[type]) ?? "var(--steel)";
  return (
    <svg
      className={`glyph ${className}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      data-loop
      style={{ "--g": color } as CSSProperties}
    >
      <g className="glyph__spin">
        <circle cx="24" cy="24" r="21" fill="none" stroke="var(--g)" strokeWidth="2.5" />
        <path d="M24 3a21 21 0 0 1 18 10.5L24 24z" fill="var(--g)" />
        <path d="M44.2 31A21 21 0 0 1 30.5 44L24 24z" fill="var(--g)" opacity=".62" />
        <path d="M17.5 44A21 21 0 0 1 3.8 17L24 24z" fill="var(--g)" opacity=".62" />
        <circle cx="24" cy="24" r="7" fill="var(--ink)" stroke="var(--g)" strokeWidth="2" />
        <circle cx="24" cy="24" r="2.2" fill="var(--g)" />
      </g>
    </svg>
  );
}
