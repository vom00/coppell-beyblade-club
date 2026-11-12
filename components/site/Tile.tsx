import type { ReactNode } from "react";
import Link from "next/link";
import ExtLink from "./ExtLink";

/**
 * Card in card, the RareUI tile: an outer dark card with a small padding, an inner panel (dark, or light
 * for diagrams) and a footer row with a label and a small arrow.
 * `media` fills the inner panel; without it the body is the inner panel. A link tile stretches its link
 * over the whole card.
 */
export default function Tile({
  media,
  tone = "dark",
  title,
  index,
  eyebrow,
  children,
  href,
  cta,
  external,
  context,
  foot,
  className = "",
  glow,
  as: Tag = "article",
}: {
  media?: ReactNode;
  tone?: "dark" | "light";
  title?: ReactNode;
  index?: string;
  eyebrow?: ReactNode;
  children?: ReactNode;
  href?: string;
  cta?: string;
  external?: boolean;
  context?: string;
  foot?: ReactNode;
  className?: string;
  glow?: boolean;
  as?: "article" | "div" | "li";
}) {
  const heading = title ? <h3 className="tile__title">{title}</h3> : null;
  const idx = index ? (
    <span className="tile__index" aria-hidden="true">
      [{index}]
    </span>
  ) : null;
  const body =
    children || heading ? (
      <div className={media ? "tile__body" : "tile__panel"} data-panel={!media && tone === "light" ? "light" : undefined}>
        {eyebrow}
        {idx}
        {heading}
        {children}
      </div>
    ) : null;
  const arrow = (
    <span className="go-arrow" aria-hidden="true">
      ↗
    </span>
  );
  return (
    <Tag className={`tile ${href ? "tile--link" : ""} ${glow ? "tile--glow" : ""} ${className}`}>
      {media && (
        <div className="tile__panel tile__panel--media" data-panel={tone === "light" ? "light" : undefined}>
          {media}
        </div>
      )}
      {body}
      {href && cta && (
        <div className="tile__foot">
          {external ? (
            <ExtLink href={href} className="tile__go" context={context}>
              {cta}
            </ExtLink>
          ) : (
            <Link href={href} className="tile__go">
              {cta}
            </Link>
          )}
          {arrow}
        </div>
      )}
      {foot && <div className="tile__foot">{foot}</div>}
    </Tag>
  );
}
