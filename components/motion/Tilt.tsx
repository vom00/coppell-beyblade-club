"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";

/**
 * Leans its child a few degrees toward the pointer. Fine pointers only (a mouse, not touch),
 * and never under reduced motion. Resting, it has no transform at all.
 */
export default function Tilt({ children, className = "", max = 5 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useRef(false);
  const rect = useRef<DOMRect | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(false);
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 20 });
  const transform = useMotionTemplate`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const sync = () => {
      enabled.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      if (settle.current) clearTimeout(settle.current);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      className={`tilt ${className}`}
      style={{ transform: active ? transform : "none" }}
      onPointerEnter={(e) => {
        if (!enabled.current || e.pointerType !== "mouse") return;
        if (settle.current) clearTimeout(settle.current);
        rect.current = ref.current?.getBoundingClientRect() ?? null;
        setActive(true);
      }}
      onPointerMove={(e) => {
        const r = rect.current;
        if (!r || !enabled.current || e.pointerType !== "mouse") return;
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry.set(px * max * 2);
        rx.set(-py * max * 2);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
        rect.current = null;
        settle.current = setTimeout(() => setActive(false), 450);
      }}
    >
      {children}
    </motion.div>
  );
}
