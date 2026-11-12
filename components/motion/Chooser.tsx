"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Folder } from "@/components/ui/folder-component";
import { RetailerMark } from "@/components/site/Brand";

interface Group {
  id: string;
  heading: string;
  inTheBox: string;
  /** The products on this shelf: one card each inside the folder. */
  items: { name: string; retailer: string; launcher: string }[];
}

/*
 * The "what is in the box" chooser: three folder tiles (RareUI Folder). Each folder holds one card per product
 * on its shelf and opens when its tile is pointed at or focused, or when its shelf is on screen. A rounded
 * red ring sits on the active choice and slides to whichever tile is hovered or focused; at rest it
 * follows the shelf that is on screen. Each tile's link is an ordinary in-page anchor, so it works the
 * same with the ring removed.
 */
export default function Chooser({ groups }: { groups: Group[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [spy, setSpy] = useState(0);
  const [point, setPoint] = useState<number | null>(null);
  const [plate, setPlate] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [armed, setArmed] = useState(false);
  const target = point ?? spy;

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const li = list.children[target] as HTMLElement | undefined;
      if (li) setPlate({ x: li.offsetLeft, y: li.offsetTop, w: li.offsetWidth, h: li.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [target]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = groups.findIndex((g) => g.id === e.target.id);
            if (i >= 0) setSpy(i);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    groups.forEach((g) => {
      const el = document.getElementById(g.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [groups]);

  return (
    <ul ref={listRef} className="chooser" onPointerLeave={() => setPoint(null)}>
      {groups.map((g, i) => (
        <li key={g.id}>
          <div className="tile tile--link chooser__item" onPointerEnter={() => setPoint(i)}>
            <div className="tile__panel tile__panel--media chooser__folder" aria-hidden="true">
              <Folder
                color="black"
                size="sm"
                className="chooser__folder-art"
                open={target === i}
                cards={g.items.map((p) => (
                  <span key={p.name} className="fcard">
                    <span className="fcard__shop">
                      <RetailerMark retailer={p.retailer} /> {p.retailer}
                    </span>
                    <span className="fcard__name">{p.name}</span>
                    <span className="fcard__note">{p.launcher}</span>
                  </span>
                ))}
              />
            </div>
            <div className="tile__body">
              <p className="chooser__name">{g.heading}</p>
              <p className="chooser__text">{g.inTheBox}</p>
            </div>
            <div className="tile__foot">
              <a href={`#${g.id}`} className="tile__go" onFocus={() => setPoint(i)} onBlur={() => setPoint(null)}>
                Jump to {g.heading.toLowerCase()}
              </a>
              <span className="go-arrow" aria-hidden="true">
                ↓
              </span>
            </div>
          </div>
        </li>
      ))}
      <i
        className="chooser__plate"
        aria-hidden="true"
        data-armed={armed ? "1" : undefined}
        style={plate ? { opacity: 1, width: plate.w, height: plate.h, transform: `translate3d(${plate.x}px, ${plate.y}px, 0)` } : undefined}
      />
    </ul>
  );
}
