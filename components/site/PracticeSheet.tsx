"use client";

import { useEffect, useState } from "react";

const KEY = "cbc-practice-sheet-v1";
type Row = { angle: string; result: string };
const blank = (n: number): Row[] => Array.from({ length: n }, () => ({ angle: "", result: "" }));

/**
 * The sheet that goes with the practice drill: one row per round, an angle and what the top did.
 * Notes are kept in this browser only (localStorage), so they are still there after a refresh.
 * If storage is blocked the sheet still works; it just forgets on reload.
 */
export default function PracticeSheet({ rounds = 4 }: { rounds?: number }) {
  const [rows, setRows] = useState<Row[]>(() => blank(rounds));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Row[] | null;
      if (Array.isArray(saved) && saved.length === rounds) {
        setRows(saved.map((r) => ({ angle: String(r?.angle ?? ""), result: String(r?.result ?? "") })));
      }
    } catch {
      /* storage blocked or empty: start blank */
    }
    setLoaded(true);
  }, [rounds]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(rows));
    } catch {
      /* storage blocked: nothing to do */
    }
  }, [rows, loaded]);

  const set = (i: number, key: keyof Row, value: string) =>
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, [key]: value } : r)));
  const filled = rows.some((r) => r.angle || r.result);

  return (
    <div className="practice">
      <div className="practice__head">
        <div>
          <h3 id="sheet-h" className="practice__title">
            Practice sheet
          </h3>
          <p className="practice__hint">
            Type in your notes as you run the drill, one row per round. They are saved in this browser only.
          </p>
        </div>
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => setRows(blank(rounds))} disabled={!filled}>
          Clear sheet
        </button>
      </div>
      <table aria-labelledby="sheet-h">
        <thead>
          <tr>
            <th scope="col">Round</th>
            <th scope="col">Launch angle</th>
            <th scope="col">What the top did</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row"><span className="practice__round-label">Round </span>{i + 1}</th>
              <td>
                <label className="practice__field-label" htmlFor={`round-${i}-angle`}>Launch angle</label>
                <input
                  id={`round-${i}-angle`}
                  type="text"
                  value={r.angle}
                  onChange={(e) => set(i, "angle", e.target.value)}
                  placeholder="Your angle"
                  aria-label={`Round ${i + 1} launch angle`}
                  autoComplete="off"
                />
              </td>
              <td>
                <label className="practice__field-label" htmlFor={`round-${i}-result`}>What the top did</label>
                <input
                  id={`round-${i}-result`}
                  type="text"
                  value={r.result}
                  onChange={(e) => set(i, "result", e.target.value)}
                  placeholder="What you saw"
                  aria-label={`Round ${i + 1} what the top did`}
                  autoComplete="off"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
