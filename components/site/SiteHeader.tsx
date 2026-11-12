"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import ExtLink from "./ExtLink";
import { BrandMark } from "./Brand";
import { GooeyNav } from "@/components/ui/gooey-nav";
import { HookSidebar } from "@/components/ui/hook-sidebar";

export interface NavItem {
  path: string;
  label: string;
}

/*
 * Floating nav in separate glass pill groups: crest and club name, the four pages (RareUI Gooey Nav, where
 * the active page separates from the group), and Instagram. Under 60rem the pages and Instagram move into a
 * menu (RareUI Hook Sidebar): a button with aria-expanded; Escape returns focus to it; a click outside or on a link closes it.
 */
export default function SiteHeader({
  items,
  instagramUrl,
  name,
}: {
  items: NavItem[];
  instagramUrl: string;
  name: string;
}) {
  const pathname = usePathname();
  // The menu counts as open only on the page it was opened on, so a route change closes it.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = items.findIndex((i) => i.path === pathname);

  // From 60rem up the outer pills slide in beside the nav as the page scrolls (translate only, so labels and
  // hit targets keep their size). Progress comes straight from scrollY, so scrolling back reverses it.
  const reduced = useReducedMotionSafe();
  const brandRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const igRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const brandDx = useMotionValue(0);
  const navDx = useMotionValue(0);
  const igDx = useMotionValue(0);
  const { scrollY } = useScroll();
  const progress = useTransform(() => {
    const y = scrollY.get();
    return reduced ? (y > 60 ? 1 : 0) : Math.min(Math.max(y / 120, 0), 1);
  });
  const brandX = useTransform(() => progress.get() * brandDx.get());
  const navX = useTransform(() => progress.get() * navDx.get());
  const igX = useTransform(() => progress.get() * igDx.get());

  useEffect(() => {
    const [bar, brand, nav, ig] = [barRef.current, brandRef.current, navRef.current, igRef.current];
    if (!bar || !brand || !nav || !ig) return;
    // Distances from where each pill rests to where it sits in one centred row; the gap is the bar's column-gap.
    const measure = () => {
      if (!window.matchMedia("(min-width: 60rem)").matches) {
        brandDx.set(0);
        navDx.set(0);
        igDx.set(0);
        return;
      }
      const gap = parseFloat(getComputedStyle(bar).columnGap) || 0;
      // Rects keep sub-pixel widths; take back the translate already applied to get the resting left edge.
      const left = (el: HTMLElement, dx: { get(): number }) =>
        el.getBoundingClientRect().left - bar.getBoundingClientRect().left - progress.get() * dx.get();
      const [bw, nw, iw] = [brand, nav, ig].map((el) => el.getBoundingClientRect().width);
      const start = (bar.clientWidth - (bw + nw + iw + 2 * gap)) / 2;
      const navLeft = start + bw + gap;
      brandDx.set(start - left(brand, brandDx));
      navDx.set(navLeft - left(nav, navDx));
      igDx.set(navLeft + nw + gap - left(ig, igDx));
    };
    const ro = new ResizeObserver(measure);
    [bar, brand, nav, ig].forEach((el) => ro.observe(el));
    measure();
    return () => ro.disconnect();
  }, [brandDx, navDx, igDx]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenFor(null);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenFor(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <motion.header
      ref={headerRef}
      className="site-header"
      data-ground="ink"
      style={{ "--header-p": progress } as CSSProperties}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenFor(null);
      }}
    >
      <div ref={barRef} className="site-header__bar">
        <motion.div ref={brandRef} style={{ x: brandX }} className="pill brand-group">
          <Link href="/" className="brand">
            <Image src="/brand/crest-512.png" alt="Coppell Beyblade Club crest" width={36} height={36} priority />
            <span className="brand__word">{name}</span>
          </Link>
        </motion.div>

        <motion.div ref={navRef} style={{ x: navX }} className="site-nav-slot">
          <GooeyNav
            aria-label="Main"
            items={items.map((i) => ({ label: i.label, href: i.path }))}
            value={active}
            size="md"
            radius={22}
            separation={12}
            activeColor="#e8121a"
            activeLabelColor="#ffffff"
          />
        </motion.div>

        <motion.div ref={igRef} style={{ x: igX }} className="pill ig-pill">
          <ExtLink href={instagramUrl} className="btn btn--quiet btn--sm" context="Club Instagram">
            <BrandMark brand="instagram" /> Instagram
          </ExtLink>
        </motion.div>

        <div className="pill menu-group">
          <button
            ref={buttonRef}
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpenFor(open ? null : pathname)}
          >
            <span className="menu-btn__bars" aria-hidden="true" />
            <span className="menu-btn__label">Menu</span>
          </button>
        </div>

        <div
          id="site-nav"
          className="site-nav"
          data-open={open}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpenFor(null);
          }}
        >
          {/* RareUI Hook Sidebar as the phone menu: a hooked rail marks the current page and follows hover and focus. */}
          <HookSidebar
            aria-label="Main menu"
            items={items.map((i) => ({ label: i.label, href: i.path }))}
            color="#ff5148"
          />
          <div className="site-nav__ig">
            <ExtLink href={instagramUrl} className="btn btn--quiet" context="Club Instagram">
              <BrandMark brand="instagram" /> Instagram
            </ExtLink>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
