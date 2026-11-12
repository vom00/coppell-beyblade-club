"use client";
import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useScene } from "./useScene";
import type { SceneHandle } from "./engine";
import type { PartCopy } from "./PartsExplode";
import Segmented from "./Segmented";
import styles from "./PartsConveyor.module.css";

type PartId = PartCopy["id"];

// Rendered from the real scene with each part under the scanner. The first is the poster everyone
// sees until the scene draws; the others only show if WebGL or a model fails.
const POSTERS: Record<PartId, string> = {
  blade: "/scene/conveyor-poster.webp",
  ratchet: "/scene/conveyor-poster-ratchet.webp",
  bit: "/scene/conveyor-poster-bit.webp",
};

/**
 * Learn: the parts selector. A Kenney Factory Kit line; choosing Blade, Ratchet or Bit runs the
 * belt, the shown part rides out and the chosen Dran Sword part rides in under the scanner.
 * The name and summary are HTML and switch at once; the belt is decoration on top of that.
 */
export default function PartsConveyor({ parts }: { parts: PartCopy[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const reduced = !!useReducedMotion();
  const first = parts[0]?.id ?? "blade";
  const [current, setCurrent] = useState<PartId>(first);
  const [shown, setShown] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const currentRef = useRef(current);

  const ready = useScene(sectionRef, frameRef, {
    kind: "conveyor",
    enabled: true,
    canvasClass: styles.canvas,
    animate: !reduced,
    handleRef,
    extra: () => ({ select: currentRef.current, reduced, onShown: setShown }),
    // a choice made while the scene loaded: jump to it, no travel
    onHandle: (h) => h.select?.(currentRef.current, true),
    onFail: () => setFailed(true),
  });

  const choose = (id: PartId) => {
    if (id === currentRef.current) return;
    currentRef.current = id;
    setCurrent(id);
    handleRef.current?.select?.(id, reduced);
  };

  const index = Math.max(0, parts.findIndex((p) => p.id === current));
  const part = parts[index];
  const running = ready && shown !== null && shown !== current;
  // poster: the first part while loading, the chosen part if the scene failed
  const poster = POSTERS[failed ? current : first];

  return (
    <div ref={sectionRef} className={styles.root}>
      <div className={styles.card}>
        <div className={styles.stage} data-ready={ready || undefined}>
          <div ref={frameRef} className={styles.frame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.poster} src={poster} alt="" loading="lazy" decoding="async" />
          </div>
          <span className={styles.status} data-live={running || undefined} aria-hidden="true">
            {running ? "Belt running" : "Under the scanner"}
          </span>
        </div>

        <div className={styles.info}>
          <Segmented
            label="Part"
            options={parts.map((p) => ({ id: p.id, label: p.name }))}
            value={current}
            onChange={choose}
          />
          <div className={styles.copy} aria-live="polite">
            <p className={styles.count}>
              {index + 1} of {parts.length}
            </p>
            <h3 className={styles.name}>{part?.name}</h3>
            <p className={styles.summary}>{part?.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
