import type { ReactNode } from "react";
import Reveal from "@/components/motion/Reveal";

/** Section header: a heading, then a hairline that draws in. */
export default function SectionHead({
  id,
  children,
  as = "h2",
  lead,
  rule = true,
}: {
  id?: string;
  children: ReactNode;
  as?: "h2" | "h3";
  lead?: ReactNode;
  rule?: boolean;
}) {
  return (
    <>
      <Reveal className="sec-head">
        {as === "h2" ? (
          <h2 id={id} className="h-lg">
            {children}
          </h2>
        ) : (
          <h3 id={id} className="h-md">
            {children}
          </h3>
        )}
      </Reveal>
      {rule && <Reveal variant="draw" className="sec-rule" aria-hidden="true" />}
      {lead && <div className="sec-lead">{lead}</div>}
    </>
  );
}
