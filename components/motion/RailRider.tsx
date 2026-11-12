"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll, useSpring, useVelocity } from "motion/react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

const TEETH = 56;
const TOOTH_KEYS = Array.from({ length: TEETH }, (_, i) => i);

/**
 * The top that travels with the visitor. A toothed rail is fixed to the edge of the viewport
 * (right edge on wide screens, under the header on phones and short landscape) and the top rides it
 * at the page's scroll progress. Teeth it has passed are green, teeth ahead are white.
 * Fast scrolling stretches a trace behind it. On a route change it dashes off and drops back in.
 *
 * Scroll work is two CSS variables (--p, --v) set on one element, plus recolouring a tooth only
 * when the progress crosses into the next one. No layout is read per frame.
 */
export default function RailRider() {
  const pathname = usePathname();
  const reduced = useReducedMotionSafe();
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lit = useRef(-1);
  const frozen = useRef(false);
  const navCount = useRef(0);
  const [noSprite, setNoSprite] = useState(false);

  const { scrollYProgress, scrollY } = useScroll();
  const smooth = useSpring(useVelocity(scrollY), { stiffness: 160, damping: 28 });

  const paint = (p: number) => {
    const root = rootRef.current;
    const rail = railRef.current;
    if (!root || !rail || frozen.current) return;
    const clamped = Math.min(1, Math.max(0, p));
    root.style.setProperty("--p", clamped.toFixed(4));
    const n = Math.round(clamped * (TEETH - 1)) + 1; // teeth 0..n-1 are behind the top
    if (n === lit.current) return;
    const teeth = rail.children;
    const from = Math.min(n, lit.current < 0 ? 0 : lit.current);
    const to = Math.max(n, lit.current < 0 ? TEETH : lit.current);
    for (let i = from; i < Math.min(to, TEETH); i++) {
      (teeth[i] as HTMLElement).dataset.on = i < n ? "1" : "0";
    }
    lit.current = n;
  };

  useMotionValueEvent(scrollYProgress, "change", paint);
  useMotionValueEvent(smooth, "change", (v) => {
    const root = rootRef.current;
    if (!root || reduced) return;
    root.style.setProperty("--v", Math.max(-1, Math.min(1, v / 2600)).toFixed(3));
  });

  useEffect(() => {
    paint(scrollYProgress.get());
    // The sprite is produced separately. If it is missing, draw the CSS top instead, quietly.
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setNoSprite(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route change: hold the top where it was while it dashes off, then drop it in at the top.
  const first = useRef(true);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) {
      paint(scrollYProgress.get());
      return;
    }
    navCount.current += 1;
    root.dataset.nav = navCount.current % 2 ? "a" : "b";
    frozen.current = true;
    const t = setTimeout(() => {
      frozen.current = false;
      paint(scrollYProgress.get());
    }, 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div ref={rootRef} className="rider" aria-hidden="true" data-reduced={reduced ? "1" : undefined}>
      <div ref={railRef} className="rider__rail">
        {TOOTH_KEYS.map((i) => (
          <i key={i} className="rider__tooth" data-on="0" />
        ))}
      </div>
      <div className="rider__top">
        <div className="rider__fly">
          <i className="rider__trace rider__trace--up" />
          <i className="rider__trace rider__trace--down" />
          {noSprite ? (
            <svg className="rider__glyph" viewBox="0 0 48 48" focusable="false">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#f6f1e9" strokeWidth="3" />
              <path d="M24 4a20 20 0 0 1 17 10L24 24zM44 28a20 20 0 0 1-12 16L24 24zM12 40A20 20 0 0 1 6 12l18 12z" fill="#e8121a" />
              <circle cx="24" cy="24" r="6" fill="#0c0a0a" stroke="#6dff3a" strokeWidth="2" />
            </svg>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              className="rider__sprite"
              src="/scene/top-sprite.webp"
              alt=""
              width={56}
              height={56}
              decoding="async"
              onError={() => setNoSprite(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
