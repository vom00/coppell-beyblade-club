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
