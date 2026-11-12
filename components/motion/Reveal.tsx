"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

export type RevealVariant = "deal" | "left" | "right" | "draw" | "stamp" | "tag" | "fade" | "line";

type Props = {
  as?: ElementType;
  variant?: RevealVariant;
  /** Position in a group. Each step adds 80ms (capped), so lists deal in one after another. */
  index?: number;
  /** Explicit delay in ms; wins over index. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [attr: string]: unknown;
};

/*
 * One shared observer. Three rules keep it safe under fast scrolling and direct links:
 *  - hidden-until-revealed styles exist only under html.js (see motion.css), so no JS means visible;
 *  - an element that is already above the viewport when it is first seen is revealed with no transition;
 *  - once revealed, an element stays revealed, so reversing never leaves anything hidden.
 */
let observer: IntersectionObserver | null = null;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) {
          el.dataset.in = "1";
          observer?.unobserve(el);
        } else if (e.boundingClientRect.top < 0) {
          el.dataset.in = "instant";
          observer?.unobserve(el);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  return observer;
}

export default function Reveal({
  as: Tag = "div",
  variant = "deal",
  index = 0,
  delay,
  className,
  style,
  children,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.in = "instant";
      return;
    }
    const io = getObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  const d = delay ?? Math.min(index, 8) * 80;
  const Comp = Tag as ElementType;
  return (
    <Comp
      ref={ref}
      data-reveal={variant}
      className={className}
      style={{ ...style, "--d": `${d}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </Comp>
  );
}
