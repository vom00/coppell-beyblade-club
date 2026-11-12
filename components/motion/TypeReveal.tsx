"use client";

import { useEffect, useState, type ReactNode } from "react";
import GridReveal from "@/components/ui/grid-reveal";

/**
 * RareUI Grid Reveal over a type diagram. The grid splits and settles into a still of the diagram the first
 * time the tile is on screen, then it is removed and the live looping diagram underneath shows. The diagram is
 * always in the markup, so with JavaScript off (or if the still fails to load) the tile reads the same.
 */
export default function TypeReveal({ kind, children }: { kind: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => setMounted(true), []);

  // A safety net: never leave the cover up if something stalls.
  useEffect(() => {
    if (!mounted || done) return;
    const t = setTimeout(() => setDone(true), 30000);
    return () => clearTimeout(t);
  }, [mounted, done]);

  return (
    <div className="type-reveal">
      {children}
      {mounted && !done && (
        <div className="type-reveal__cover" aria-hidden="true">
          <GridReveal
            src={`/types/${kind}.svg`}
            aspect={1}
            estimatedDuration={1400}
            className="type-reveal__grid"
            onRevealComplete={() => setDone(true)}
            onError={() => setDone(true)}
          />
        </div>
      )}
    </div>
  );
}
