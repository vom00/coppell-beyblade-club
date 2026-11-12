"use client";
import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import styles from "./Segmented.module.css";

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

/**
 * A pill segmented control with radio semantics: Tab enters at the chosen option, the arrow keys
 * (and Home, End) move the choice, which takes effect at once, like a native radio group. Past four
 * options the track wraps into two rows; the arrow keys still step through them in reading order.
 */
export default function Segmented<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  // Up to four options sit in one row; more wrap into two even rows, so six read as three by two.
  const cols = options.length <= 4 ? options.length : Math.ceil(options.length / 2);
  const rows = Math.ceil(options.length / cols);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = options.length;
    let k = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") k = (index + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") k = (index - 1 + n) % n;
    else if (e.key === "Home") k = 0;
    else if (e.key === "End") k = n - 1;
    if (k < 0) return;
    e.preventDefault();
    onChange(options[k].id);
    refs.current[k]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={styles.seg}
      data-rows={rows > 1 || undefined}
      style={{ "--cols": cols, "--rows": rows, "--col": index % cols, "--row": Math.floor(index / cols) } as CSSProperties}
      onKeyDown={onKeyDown}
    >
      <span className={styles.thumb} aria-hidden="true" />
      {options.map((o, i) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            className={styles.opt}
            onClick={() => onChange(o.id)}
          >
            <span className={styles.text}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
