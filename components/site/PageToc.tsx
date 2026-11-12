"use client";

import { useEffect, useState } from "react";
import { RailToc, type RailTocItem } from "@/components/ui/rail-toc";

/**
 * RareUI Rail TOC as the in-page table of contents for the long pages. It sits in the left margin on wide
 * screens (the rail rider owns the right edge) and is hidden where there is no room (see .page-toc in globals.css).
 * Entries are the section headings, found by id; the plane on the rail follows the scroll.
 */
export default function PageToc({ items }: { items: RailTocItem[] }) {
  // Step aside once the footer is on screen, so the list never sits on top of it.
  const [off, setOff] = useState(false);
  useEffect(() => {
    const footer = document.querySelector(".site-footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOff(e.isIntersecting), { rootMargin: "0px 0px -20% 0px" });
    io.observe(footer);
    return () => io.disconnect();
  }, []);
  return (
    <div className="page-toc" data-off={off || undefined}>
      <RailToc items={items} title="On this page" offset={96} className="w-40" />
    </div>
  );
}
