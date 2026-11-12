"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Runs once in the root layout and renders nothing.
 *  - Marks the document as hydrated, so the html.js failsafe in the layout script stands down.
 *  - Pauses decorative loops (anything with data-loop) while offscreen, and while the tab is hidden.
 */
export default function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-ready", "1");
    const onVis = () => root.toggleAttribute("data-hidden", document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-loop]");
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.setAttribute("data-live", "1"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.setAttribute("data-live", e.isIntersecting ? "1" : "0")),
      { rootMargin: "80px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
