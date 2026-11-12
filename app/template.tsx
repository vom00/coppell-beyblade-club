"use client";

import { useState, type ReactNode } from "react";

/**
 * Re-mounts on every navigation. The new page blurs in (opacity, blur, a small rise) while a slim red
 * pill sweeps across the top of the window. Both are plain CSS animations with backwards fill, and
 * both are removed from the DOM when they finish, so nothing (filter, transform, will-change, overflow)
 * stays on an ancestor of the page content and position: sticky keeps working. Reduced motion shows neither.
 */
export default function Template({ children }: { children: ReactNode }) {
  const [sweeping, setSweeping] = useState(true);
  const [entering, setEntering] = useState(true);
  return (
    <>
      {sweeping && (
        <div className="route-sweep" aria-hidden="true">
          <i
            className="route-sweep__pill"
            onAnimationEnd={() => {
              setSweeping(false);
            }}
          />
        </div>
      )}
      <div
        className={entering ? "page-in" : undefined}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setEntering(false);
        }}
      >
        {children}
      </div>
    </>
  );
}
