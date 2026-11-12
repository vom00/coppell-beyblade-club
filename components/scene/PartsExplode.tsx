"use client";
import {
  useCallback, useId, useLayoutEffect, useRef, useSyncExternalStore,
  type KeyboardEvent, type PointerEvent,
} from "react";
import { useScroll, useReducedMotion, useMotionValueEvent } from "motion/react";
import { useScene } from "./useScene";
import { explodeAt, partAnchors } from "./pose";
import type { SceneHandle } from "./engine";
import styles from "./PartsExplode.module.css";

export interface PartCopy {
  id: "blade" | "ratchet" | "bit";
  name: string;
  summary: string;
}

const SHORT_LANDSCAPE = "(orientation: landscape) and (max-height: 520px)";
const subscribe = (cb: () => void) => {
  const mq = matchMedia(SHORT_LANDSCAPE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useShortLandscape = () =>
  useSyncExternalStore(subscribe, () => matchMedia(SHORT_LANDSCAPE).matches, () => false);

const DRAG_RAD_PER_PX = 0.012;
const KEY_STEP = 0.35;

export default function PartsExplode({ parts }: { parts: PartCopy[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const benchRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const labelRefs = useRef<(HTMLLIElement | null)[]>([]);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const drag = useRef<{ id: number; x: number } | null>(null);
  const hintId = useId();

  const reduced = useReducedMotion();
  const shortLandscape = useShortLandscape();
  const isStatic = !!reduced || shortLandscape;
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const ready = useScene(sectionRef, frameRef, {
    kind: "parts",
    enabled: !isStatic,
    canvasClass: styles.canvas,
    progress: scrollYProgress,
    handleRef,
  });
  const interactive = ready && !isStatic;

  // Place markers, labels and leader lines from the projected part positions. Pure in progress.
  const layout = useCallback(() => {
    const bench = benchRef.current, frame = frameRef.current, list = listRef.current;
    if (!bench || !frame || !list) return;
    // Until WebGL draws, the poster is showing: assembled while scrubbing, exploded when static.
    const e = isStatic ? 1 : ready ? explodeAt(scrollYProgress.get()) : 0;
    const anchors = partAnchors(e);
    parts.forEach((p, i) => {
      const m = markerRefs.current[i];
      if (!m) return;
      m.style.left = `${anchors[p.id][0] * 100}%`;
      m.style.top = `${anchors[p.id][1] * 100}%`;
    });

    const first = labelRefs.current[0];
    const beside = !!first && getComputedStyle(first).position === "absolute";
    if (!beside) return;

    const b = bench.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    const gap = 16;
    const items = parts.map((p, i) => {
      const el = labelRefs.current[i]!;
      const name = el.firstElementChild as HTMLElement;
      const nameMid = name.offsetTop + name.offsetHeight / 2;
      const ay = f.top + anchors[p.id][1] * f.height - l.top;
      return { i, el, nameMid, h: el.offsetHeight, ay, ax: f.left + anchors[p.id][0] * f.width - b.left, top: ay - nameMid };
    });
    items.sort((a, c) => a.ay - c.ay);
    // push apart top-down, then pull back inside the column bottom-up, then clamp to the top
    for (let k = 1; k < items.length; k++) items[k].top = Math.max(items[k].top, items[k - 1].top + items[k - 1].h + gap);
    const last = items[items.length - 1];
    last.top = Math.min(last.top, l.height - last.h);
    for (let k = items.length - 2; k >= 0; k--) items[k].top = Math.min(items[k].top, items[k + 1].top - items[k].h - gap);
    items[0].top = Math.max(items[0].top, 0);
    for (let k = 1; k < items.length; k++) items[k].top = Math.max(items[k].top, items[k - 1].top + items[k - 1].h + gap);

    const lx = l.left - b.left;
    for (const it of items) {
      it.el.style.transform = `translateY(${it.top.toFixed(1)}px)`;
      const ly = it.top + it.nameMid + l.top - b.top;
      const ay = it.ay + l.top - b.top;
      const bend = lx - 26;
      pathRefs.current[it.i]?.setAttribute(
        "d",
        `M${(it.ax + 7).toFixed(1)} ${ay.toFixed(1)}H${Math.max(it.ax + 14, bend - 22).toFixed(1)}L${bend.toFixed(1)} ${ly.toFixed(1)}H${(lx - 8).toFixed(1)}`,
      );
    }
  }, [parts, isStatic, ready, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", () => {
    if (!isStatic && ready) layout();
  });

  useLayoutEffect(() => {
    layout();
    const ro = new ResizeObserver(layout);
    if (benchRef.current) ro.observe(benchRef.current);
    labelRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [layout]);

  /* Drag or swipe sideways to turn the top; vertical swipes keep scrolling (touch-action: pan-y). */
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { id: e.pointerId, x: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    handleRef.current?.nudge?.((e.clientX - d.x) * DRAG_RAD_PER_PX);
    d.x = e.clientX;
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      handleRef.current?.nudge?.(e.key === "ArrowRight" ? KEY_STEP : -KEY_STEP);
    }
  };

  return (
    <section
      ref={sectionRef}
      data-ground="ink"
      className={styles.section}
      aria-label="The three parts of a top"
      data-ready={ready || undefined}
    >
      <div className={styles.sticky}>
        <div ref={benchRef} className={styles.bench}>
          <div className={styles.stage}>
            <div
              ref={frameRef}
              className={styles.frame}
              data-interactive={interactive || undefined}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? "group" : undefined}
              aria-label={interactive ? "The top on the bench. Turn it with the left and right arrow keys." : undefined}
              aria-describedby={interactive ? hintId : undefined}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKeyDown}
            >
              <picture>
                <source media={`(prefers-reduced-motion: reduce), ${SHORT_LANDSCAPE}`} srcSet="/scene/learn-exploded.webp" />
                <img
                  className={styles.poster}
                  src="/scene/learn-assembled.webp"
                  width={1200}
                  height={1200}
                  alt=""
                  decoding="async"
                  draggable={false}
                />
              </picture>
              {parts.map((p, i) => (
                <span
                  key={p.id}
                  ref={(el) => {
                    markerRefs.current[i] = el;
                  }}
                  className={styles.marker}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <p id={hintId} className={styles.hint} hidden={!interactive}>
              Drag sideways to turn the top, or focus it and use the arrow keys.
            </p>
          </div>

          <ol ref={listRef} className={styles.labels}>
            {parts.map((p, i) => (
              <li
                key={p.id}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className={styles.label}
              >
                <p className={styles.name}>
                  <span className={styles.num} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.nameText}>{p.name}</span>
                </p>
                <p className={styles.summary}>{p.summary}</p>
              </li>
            ))}
          </ol>

          <svg className={styles.leaders} aria-hidden="true" focusable="false">
            {parts.map((p, i) => (
              <path
                key={p.id}
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
