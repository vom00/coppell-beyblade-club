"use client";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { MotionValue } from "motion/react";
import type { Options, SceneHandle } from "./engine";

type Factory = (canvas: HTMLCanvasElement, o: Options) => Promise<SceneHandle>;

// Each scene's code is fetched only when its section nears the viewport. The conveyor and the bay
// live in their own modules; all of them share the engine chunk (three, the glTF loader, the core).
const FACTORIES: Record<SceneKind, () => Promise<Factory>> = {
  rail: () => import("./engine").then((m) => m.createRailScene),
  parts: () => import("./engine").then((m) => m.createPartsScene),
  conveyor: () => import("./conveyor").then((m) => m.createConveyorScene),
  bay: () => import("./bay").then((m) => m.createBayScene),
};

export type SceneKind = "rail" | "parts" | "conveyor" | "bay";

/**
 * Lazy-loads the WebGL scene into `frameRef` once the section is near the viewport.
 * Draws only while the section is on screen and the tab is visible; disposes everything on unmount.
 * The poster underneath stays visible until the first frame lands, and for good if WebGL fails.
 */
export function useScene(
  sectionRef: RefObject<HTMLElement | null>,
  frameRef: RefObject<HTMLDivElement | null>,
  opts: {
    kind: SceneKind;
    enabled: boolean;
    canvasClass: string;
    /** Scroll progress for scrubbed scenes (rail, parts). */
    progress?: MotionValue<number>;
    /** Keep the render loop running while visible (default true). False renders on demand only. */
    animate?: boolean;
    /** Receives the live handle (or null) so the component can drive extras such as drag-to-turn. */
    handleRef?: RefObject<SceneHandle | null>;
    /** Extra engine options, read when loading starts (for example the current selection). */
    extra?: () => Partial<Options>;
    /** Called once the scene is live, so the component can sync state that changed while it loaded. */
    onHandle?: (h: SceneHandle) => void;
    /** Called when WebGL or a model fails; the poster stays. */
    onFail?: () => void;
  },
) {
  const [ready, setReady] = useState(false);
  const { kind, enabled, canvasClass, progress, handleRef } = opts;
  const animate = opts.animate ?? true;
  // callbacks change identity every render; read the latest without restarting the scene
  const cb = useRef({ extra: opts.extra, onHandle: opts.onHandle, onFail: opts.onFail });
  useLayoutEffect(() => {
    cb.current = { extra: opts.extra, onHandle: opts.onHandle, onFail: opts.onFail };
  });

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    if (!enabled || !section || !frame) return;

    // A fresh canvas per mount: a canvas whose context was force-lost cannot be reused.
    const canvas = document.createElement("canvas");
    canvas.className = canvasClass;
    canvas.setAttribute("aria-hidden", "true");
    frame.appendChild(canvas);

    let handle: SceneHandle | null = null;
    let cancelled = false;
    let loading = false;
    let inView = false;

    const setHandle = (h: SceneHandle | null) => {
      handle = h;
      if (handleRef) handleRef.current = h;
    };
    const sync = () => handle?.setVisible(inView && !document.hidden);
    const fail = () => {
      setReady(false);
      setHandle(null);
      canvas.remove(); // poster stays
      if (!cancelled) cb.current.onFail?.();
    };
    const abort = new AbortController();
    const load = () => {
      if (loading) return;
      loading = true;
      // The engine chunk (three + glTF loader) and the models are fetched only now, near the viewport.
      FACTORIES[kind]()
        .then((make) => {
          if (cancelled) return null;
          const coarse = matchMedia("(pointer: coarse)").matches;
          const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
          return make(canvas, {
            ...cb.current.extra?.(),
            dpr,
            signal: abort.signal,
            animate, // loops while visible; paused offscreen and when hidden
            onFrame: () => !cancelled && setReady(true),
            onLost: fail,
          });
        })
        .then((h) => {
          if (!h) return;
          if (cancelled) {
            h.dispose();
            return;
          }
          setHandle(h);
          h.resize(frame.clientWidth, frame.clientHeight);
          if (progress) h.setProgress(progress.get());
          cb.current.onHandle?.(h);
          sync();
          ro.observe(frame);
        })
        .catch(() => {
          if (!cancelled) fail(); // no WebGL, or a model failed to load: the poster stays
        });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) load();
        sync();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(section);
    const ro = new ResizeObserver(() => handle?.resize(frame.clientWidth, frame.clientHeight));
    document.addEventListener("visibilitychange", sync);
    const unsub = progress?.on("change", (v) => handle?.setProgress(v));

    return () => {
      cancelled = true;
      abort.abort();
      io.disconnect();
      ro.disconnect();
      unsub?.();
      document.removeEventListener("visibilitychange", sync);
      handle?.dispose();
      setHandle(null);
      canvas.remove();
      setReady(false);
    };
  }, [sectionRef, frameRef, kind, enabled, canvasClass, progress, handleRef, animate]);

  return ready;
}
