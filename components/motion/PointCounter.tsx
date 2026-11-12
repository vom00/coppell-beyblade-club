"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { AnimatedCounter } from "@/components/ui/animated-counter";

/**
 * A finish's point value, counted up on a wheel of digits (RareUI Animated Counter) when it scrolls
 * into view. Without JavaScript, or with reduced motion, it simply shows the number.
 */
export default function PointCounter({ value, label, className = "" }: { value: number; label: string; className?: string }) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;
    setShown(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(value);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, reduced]);

  return (
    <span ref={ref} role="img" aria-label={label} className={className}>
      <AnimatedCounter value={shown} duration={0.7} aria-hidden="true" />
    </span>
  );
}
