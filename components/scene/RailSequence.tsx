"use client";
import { useRef, type ReactNode } from "react";
import {
  motion, useScroll, useTransform, useReducedMotion, useMotionValueEvent, type MotionValue,
} from "motion/react";
import RailCatchStill from "./RailCatchStill";
import { useScene } from "./useScene";
import { CAPTION_RANGES, INTRO_OUT, OUTRO_IN, LAYER_FOCUS_P, DASH_START, dashAt } from "./pose";
import styles from "./RailSequence.module.css";

const CAPTIONS = [
  {
    label: "The rail",
    text: "A Beyblade X stadium has a rail of teeth around its edge. A spinning top drifts outward until it meets that rail.",
  },
  {
    label: "The catch",
    text: "The bit at the bottom of the top carries a small gear. When that gear touches the rail, its teeth lock into the rail's teeth.",
  },
  {
    label: "Xtreme Dash",
    text: "The gear on the tip catches the rail and sends the top across the stadium. That burst is an Xtreme Dash, and it is what makes Beyblade X different.",
  },
];

const TICKS = 30;
// Round SVG coordinates so server and browser trig agree (avoids a hydration mismatch).
const r2 = (v: number) => Math.round(v * 100) / 100;

export default function RailSequence({ intro, outro }: { intro: ReactNode; outro: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const ready = useScene(sectionRef, frameRef, {
    kind: "rail",
    enabled: !reduced,
    canvasClass: styles.canvas,
    progress: scrollYProgress,
  });

  const introOpacity = useTransform(scrollYProgress, INTRO_OUT, [1, 0]);
  const outroOpacity = useTransform(scrollYProgress, OUTRO_IN, [0, 1]);

  // Keyboard users can tab into a faded layer; bring the sequence to the point where it shows.
  const focusAt = (p: number, opacity: MotionValue<number>) => () => {
    const sec = sectionRef.current;
    const sticky = sec?.firstElementChild;
    if (!sec || !sticky || opacity.get() > 0.5 || getComputedStyle(sticky).position !== "sticky") return;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + p * (sec.offsetHeight - window.innerHeight), behavior: "instant" });
  };

  return (
    <section ref={sectionRef} data-ground="ink" className={styles.section} data-ready={ready || undefined}>
      <div className={styles.sticky}>
        <div className={styles.grid}>
          <div className={styles.copy}>
            <Layer className={styles.intro} opacity={introOpacity} onFocus={focusAt(LAYER_FOCUS_P.intro, introOpacity)}>
              {intro}
            </Layer>
            {CAPTIONS.map((c, i) => (
              <Caption key={c.label} index={i} progress={scrollYProgress} label={c.label} text={c.text} focusAt={focusAt}>
                {i === 1 && <RailCatchStill className={styles.still} />}
              </Caption>
            ))}
            <Layer className={styles.outro} opacity={outroOpacity} onFocus={focusAt(LAYER_FOCUS_P.outro, outroOpacity)}>
              {outro}
            </Layer>
          </div>

          <div className={styles.stage}>
            <div ref={frameRef} className={styles.frame}>
              {/* Matches the first WebGL frame (progress 0, before the top drops in); stays if WebGL
                  is unavailable. Reduced motion gets a still of the top running the rail instead. */}
              <picture>
                <source media="(prefers-reduced-motion: reduce)" srcSet="/scene/home-still.webp" />
                <img
                  className={styles.poster}
                  src="/scene/home-poster.webp"
                  width={1500}
                  height={1200}
                  alt="A 3D model of a Beyblade X stadium seen from above at an angle: a black bowl ringed by the green Xtreme line, with white rail teeth along its inner edge and a top spinning inside."
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
              <SceneWord progress={scrollYProgress} />
              <Gauge progress={scrollYProgress} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Layer({
  className, opacity, onFocus, children,
}: { className: string; opacity: MotionValue<number>; onFocus: () => void; children: ReactNode }) {
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));
  return (
    <motion.div className={`${styles.layer} ${className}`} style={{ opacity, pointerEvents }} onFocusCapture={onFocus}>
      {children}
    </motion.div>
  );
}

function Caption({
  index, progress, label, text, focusAt, children,
}: {
  index: number;
  progress: MotionValue<number>;
  label: string;
  text: string;
  focusAt: (p: number, o: MotionValue<number>) => () => void;
  children?: ReactNode;
}) {
  const opacity = useTransform(progress, CAPTION_RANGES[index], [0, 1, 1, 0]);
  return (
    <Layer className={styles.caption} opacity={opacity} onFocus={focusAt(LAYER_FOCUS_P.captions[index], opacity)}>
      <p className={styles.capLabel}>{label}</p>
      <p className={styles.capText}>{text}</p>
      {children}
    </Layer>
  );
}

/** Oversize outline scene type that sweeps across the frame during the dash. Decorative. */
function SceneWord({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (p) => dashAt(p));
  const x = useTransform(progress, [DASH_START - 0.02, 0.84], ["18%", "-22%"]);
  return (
    <div className={styles.wordClip} aria-hidden="true">
      <motion.p className={styles.word} style={{ opacity, x }}>
        Xtreme Dash
      </motion.p>
    </div>
  );
}

/** The crest's arc of ticks, lighting up green as the sequence advances. Decorative. */
function Gauge({ progress }: { progress: MotionValue<number> }) {
  const ref = useRef<SVGGElement>(null);
  const lit = useRef(-1);
  const paint = (p: number) => {
    const n = Math.round(p * (TICKS + 3));
    if (n === lit.current || !ref.current) return;
    lit.current = n;
    Array.from(ref.current.children).forEach((el, i) => el.setAttribute("data-on", i < n ? "1" : "0"));
  };
  useMotionValueEvent(progress, "change", paint);

  const cx = 186, cy = 322, R = 300;
  const a0 = -118, a1 = -70; // degrees: a shallow arc across the top of the frame, arrows after it
  const marks: ReactNode[] = [];
  for (let i = 0; i < TICKS; i++) {
    const a = ((a0 + ((a1 - a0) * i) / (TICKS - 1)) * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    marks.push(<line key={i} x1={r2(cx + R * c)} y1={r2(cy + R * s)} x2={r2(cx + (R + 16) * c)} y2={r2(cy + (R + 16) * s)} />);
  }
  for (let k = 0; k < 3; k++) {
    const a = ((a1 + 4 + k * 4) * Math.PI) / 180;
    const x = cx + (R + 8) * Math.cos(a), y = cy + (R + 8) * Math.sin(a);
    const rot = r2((a * 180) / Math.PI + 90);
    marks.push(
      <polygon key={`a${k}`} className={styles.arrow} points="-6,-7 8,0 -6,7" transform={`translate(${r2(x)} ${r2(y)}) rotate(${rot})`} />,
    );
  }
  return (
    <svg className={styles.gauge} viewBox="0 0 400 66" aria-hidden="true" focusable="false">
      <g ref={(el) => {
        ref.current = el;
        if (el) paint(progress.get());
      }}>{marks}</g>
    </svg>
  );
}
