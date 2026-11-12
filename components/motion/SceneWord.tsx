"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

/**
 * An oversize outlined word set behind a section, the way the official diagrams set BLADE,
 * RATCHET and BIT. It drifts sideways a little as the section scrolls past. Decorative.
 * The parent section must be position: relative with overflow: clip (the .has-word class).
 */
export default function SceneWord({
  children,
  place = "top-right",
  className = "",
}: {
  children: string;
  place?: "top-right" | "bottom-left" | "bottom-right" | "top-left";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["7%", "-7%"]);
  return (
    <div ref={ref} className={`scene-word scene-word--${place} ${className}`} aria-hidden="true">
      <motion.span style={{ x: reduced ? 0 : x }}>{children}</motion.span>
    </div>
  );
}
