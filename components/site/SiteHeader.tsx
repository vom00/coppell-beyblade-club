"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
    <header
      ref={headerRef}
      className="site-header"
      data-ground="ink"
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenFor(null);
      }}
    >
      <div className="site-header__bar">
        <div className="pill brand-group">
          <Link href="/" className="brand">
            <Image src="/brand/crest-512.png" alt="Coppell Beyblade Club crest" width={36} height={36} priority />
            <span className="brand__word">{name}</span>
          </Link>
        </div>

        <GooeyNav
          aria-label="Main"
          className="site-nav--wide"
          items={items.map((i) => ({ label: i.label, href: i.path }))}
          value={active}
          size="md"
          radius={22}
          separation={12}
          activeColor="#e8121a"
          activeLabelColor="#ffffff"
        />

        <div className="pill ig-pill">
          <ExtLink href={instagramUrl} className="btn btn--quiet btn--sm" context="Club Instagram">
            <BrandMark brand="instagram" /> Instagram
          </ExtLink>
        </div>

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
    </header>
  );
}
