import type { CSSProperties, ElementType } from "react";

/**
 * A title that blurs in one word at a time. Plain CSS animation, so it needs no hydration and
 * always ends visible and clean (no filter or transform is left behind). The text stays ordinary words
 * with spaces between, so screen readers read it as written. `delay` (ms) is when the first word starts.
 */
export default function SplitTitle({
  as: Tag = "h1",
  text,
  className,
  id,
  delay = 120,
}: {
  as?: ElementType;
  text: string;
  className?: string;
  id?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  const Comp = Tag as ElementType;
  return (
    <Comp id={id} className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="st-i" style={{ "--i": i, "--st-delay": `${delay}ms` } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Comp>
  );
}
