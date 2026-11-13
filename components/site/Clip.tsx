"use client";

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

/**
 * A short silent clip that loops on its own while it is on screen, with no controls.
 * Nothing downloads until it scrolls into view. Under reduced motion it stays on its poster and
 * gets the browser's controls instead, so nothing moves unless the visitor presses play.
 */
export default function Clip({ name, label }: { name: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    const v = ref.current;
    if (!v || reduced) return;
    v.muted = true; // React does not reliably set the muted attribute, and autoplay needs it
    const io = new IntersectionObserver(
      ([e]) => {
        // A blocked autoplay (an iPhone in Low Power Mode) leaves the poster up, so give it the controls.
        if (e.isIntersecting) v.play().catch((err) => { if (err?.name === "NotAllowedError") v.controls = true; });
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.pause();
    };
  }, [reduced]);

  return (
    <video
      ref={ref}
      className="clip"
      muted
      loop
      playsInline
      preload="none"
      controls={reduced}
      poster={`/clips/${name}-poster.webp`}
      width={1280}
      height={720}
      aria-label={label}
    >
      <source src={`/clips/${name}.mp4`} type="video/mp4" />
    </video>
  );
}
