"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { StepPlayer } from "@/components/ui/step-player";

/**
 * The practice drill as a step player (RareUI Step Player): the three steps are listed, and the player
 * walks through them, lighting the current one. It starts when it scrolls into view and stops when it
 * leaves; under reduced motion it waits for the play button. The seek dots jump to a step.
 */
export default function DrillPlayer({ steps }: { steps: string[] }) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPlaying(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={ref}>
      <ol className="drill-steps">
        {steps.map((t, i) => (
          <li key={t} data-active={i === index} aria-current={i === index ? "step" : undefined}>
            <b aria-hidden="true">[{i + 1}]</b>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <StepPlayer
        className="drill-player"
        steps={steps.map((t) => ({ label: t, duration: 3200 }))}
        value={index}
        onValueChange={setIndex}
        playing={playing}
        onPlayingChange={setPlaying}
        loop
        seekable
        size={44}
      />
    </div>
  );
}
