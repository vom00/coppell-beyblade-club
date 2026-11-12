"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

/*
 * "First to 4" as four pips that fill as the tally scrolls into view. The fill is a pure function
 * of scroll position, so scrolling back empties it and a direct load below it shows it full.
 * Decorative: the sentence beside it says the same thing.
 */
function Pip({ n, progress, reduced }: { n: number; progress: MotionValue<number>; reduced: boolean }) {
  const start = (n - 1) * 0.2;
  const fill = useTransform(progress, [start, start + 0.22], [0, 1], { clamp: true });
  const ink = useTransform(fill, [0.45, 0.6], ["#111111", "#ffffff"]);
  return (
    <span className="tally__pip">
      <motion.i className="tally__fill" style={{ scaleY: reduced ? 1 : fill }} />
      <motion.b style={{ color: reduced ? "#ffffff" : ink }}>{n}</motion.b>
    </span>
  );
}

export default function Tally() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = !!useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "start 38%"] });
  return (
    <div ref={ref} className="tally" aria-hidden="true">
      {[1, 2, 3, 4].map((n) => (
        <Pip key={n} n={n} progress={scrollYProgress} reduced={reduced} />
      ))}
    </div>
  );
}
