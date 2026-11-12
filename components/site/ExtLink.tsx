import type { ReactNode } from "react";

/** External link: new tab, safe rel, announced as external. `context` extends the accessible name. */
export default function ExtLink({
  href,
  className,
  children,
  context,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  context?: string;
}) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only">
        {context ? `: ${context}` : ""} (opens in a new tab)
      </span>
    </a>
  );
}
