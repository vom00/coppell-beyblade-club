import { useId } from "react";
import type { TopId } from "@/lib/content-types";

/**
 * A picture of one of the club's tops, rendered from its 3D model (public/tops, built by the scene scripts).
 * Decorative: it sits beside a title that says what the tile is about, so the alt text is empty.
 */
export function TopImage({ top, className = "" }: { top: TopId; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`top-img ${className}`}
      src={`/tops/${top}.webp`}
      width={512}
      height={512}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}

/** A shopping bag in crest red with a small top printed on it. For the tile that sells parts, not a top. */
export function ShoppingBag({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg className={`bag ${className}`} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ff5148" />
          <stop offset="1" stopColor="#b10d14" />
        </linearGradient>
      </defs>
      <g className="bag__swing">
        {/* back handle */}
        <path d="M18.5 19v-5.5a5.5 5.5 0 0 1 11 0V19" fill="none" stroke="#7a7a7a" strokeWidth="2.2" strokeLinecap="round" />
        {/* body */}
        <path d="M8.6 16.5h30.8l-2.3 23.1a3.8 3.8 0 0 1-3.8 3.4H14.7a3.8 3.8 0 0 1-3.8-3.4z" fill={`url(#${id})`} />
        {/* folded top edge */}
        <path d="M8.6 16.5h30.8l-.45 4.5H9.05z" fill="#000" opacity="0.24" />
        {/* side shade */}
        <path d="M32 16.5h7.4l-2.3 23.1a3.8 3.8 0 0 1-3.8 3.4H31z" fill="#000" opacity="0.14" />
        {/* front handle */}
        <path d="M15.5 21.5v-7.2a8.5 8.5 0 0 1 17 0v7.2" fill="none" stroke="#f3f3f3" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="15.5" cy="21.5" r="1.9" fill="#3a0608" />
        <circle cx="32.5" cy="21.5" r="1.9" fill="#3a0608" />
        {/* a small top printed on the bag */}
        <g transform="translate(24 32.5)" fill="#fff">
          <circle r="6.6" fill="none" stroke="#fff" strokeWidth="1.3" opacity="0.95" />
          <path d="M0-6.6A6.6 6.6 0 0 1 5.7-3.3L0 0z" opacity="0.95" />
          <path d="M5.7 3.3A6.6 6.6 0 0 1 0 6.6L0 0z" opacity="0.7" />
          <path d="M-5.7 3.3A6.6 6.6 0 0 1-5.7-3.3L0 0z" opacity="0.7" />
          <circle r="1.7" fill="#b10d14" stroke="#fff" strokeWidth="0.9" />
        </g>
      </g>
    </svg>
  );
}
