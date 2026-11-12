"use client";
import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { BayTop } from "@/lib/content-types";
import { useScene } from "./useScene";
import type { SceneHandle } from "./engine";
import Segmented from "./Segmented";
import styles from "./DisplayBay.module.css";

// Rendered from the real scene with each top on the pedestal. The first is the poster everyone sees
// until the scene draws; the others only show if WebGL or a model fails.
const POSTERS: Record<string, string> = {
  "drake-brave": "/scene/bay-poster.webp",
  "knight-shield": "/scene/bay-poster-knight-shield.webp",
  "hells-scythe": "/scene/bay-poster-hells-scythe.webp",
  "sol-eclipse": "/scene/bay-poster-sol-eclipse.webp",
  "unicorn-delta": "/scene/bay-poster-unicorn-delta.webp",
  "dran-sword": "/scene/bay-poster-dran-sword.webp",
};

/** "Dran Sword 3-60F" -> "Dran Sword": the selector shows the name without the combo code. */
const shortName = (name: string) => {
  const words = name.split(" ");
  return words.length > 1 && /\d/.test(words[words.length - 1]) ? words.slice(0, -1).join(" ") : name;
};

/**
 * Home: the display bay. A Kenney Space Station Kit room with one pedestal under a light; the chosen
 * top sits on it and turns. Switching lowers the shown top into the pedestal and raises the next.
 * Only the chosen top's model is fetched; the others load when picked, and the shown top stays
 * until the next one is ready. The name, code, parts and facts are HTML and switch at once.
 */
export default function DisplayBay({ tops }: { tops: BayTop[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const reduced = !!useReducedMotion();
  const first = tops[0]?.id ?? "drake-brave";
  const [current, setCurrent] = useState<string>(first);
  const [shown, setShown] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const currentRef = useRef(current);

  const ready = useScene(sectionRef, frameRef, {
    kind: "bay",
    enabled: true,
    canvasClass: styles.canvas,
    animate: !reduced,
    handleRef,
    extra: () => ({ select: currentRef.current, reduced, onShown: setShown }),
    onHandle: (h) => h.select?.(currentRef.current, true),
    onFail: () => setFailed(true),
  });

  const choose = (id: string) => {
    if (id === currentRef.current) return;
    currentRef.current = id;
    setCurrent(id);
    handleRef.current?.select?.(id, reduced);
  };

  const top = tops.find((t) => t.id === current) ?? tops[0];
  const loading = ready && shown !== null && shown !== current;
  const poster = POSTERS[failed ? current : first] ?? POSTERS["drake-brave"];

  return (
    <div ref={sectionRef} className={styles.root}>
      <div className={styles.card}>
        <div className={styles.stage} data-ready={ready || undefined}>
          <div ref={frameRef} className={styles.frame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.poster} src={poster} alt="" loading="lazy" decoding="async" />
          </div>
          {loading && (
            <span className={styles.status} aria-hidden="true">
              [Loading 3D model]
            </span>
          )}
        </div>

        <div className={styles.info}>
          <Segmented
            label="Top"
            options={tops.map((t) => ({ id: t.id, label: shortName(t.name) }))}
            value={current}
            onChange={choose}
          />
          {top && (
            <div className={styles.copy} aria-live="polite">
              <div className={styles.head}>
                <h3 className={styles.name}>{top.name}</h3>
                <span className={styles.code}>{top.code}</span>
              </div>
              <dl className={styles.list}>
                {[...top.parts, ...top.facts].map((r, i) => (
                  <div key={r.label} className={styles.row} data-fact={i >= top.parts.length || undefined}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
