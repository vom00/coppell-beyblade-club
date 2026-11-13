// Clip "meet": when and where the club meets. The schedule cross-fades in a pill on the club red,
// then Text Highlight underlines the room. The words are the `meeting` facts in lib/content.ts.
import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Freeze, interpolate, Sequence, useCurrentFrame } from "remotion";
import { TextHighlight } from "@/components/snap-cn/text-highlight";
import { C, DISPLAY, SNAP_THEME } from "./look";

const WHEN = ["every two weeks", "on A-week Tuesdays", "from 4:20 to 5:20", "in room C112"];
const HOLD = 46; // frames a label is up
const FADE = 7; // half the swap between two labels
export const MEET = { cycle: WHEN.length * HOLD, room: 84 };
export const MEET_FRAMES = MEET.cycle + MEET.room; // 268, 8.9 s

// A frame drawn before Open Runde has loaded is laid out in a fallback font, a few pixels to one side.
// So nothing is drawn until the font is in.
function useDisplayFont() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Open Runde"));
  useEffect(() => {
    Promise.all([document.fonts.load('600 40px "Open Runde"'), document.fonts.load('700 40px "Open Runde"')])
      .then(() => document.fonts.ready)
      .then(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
}

// Nothing in this shot changes position or size: on a small looping clip any travel reads as shaking.
// Every label sits in the same grid cell, so the line is laid out once for the widest one, and a label
// only fades while its words roll inside the box.
function Cycle() {
  const frame = useCurrentFrame();
  const ready = useDisplayFont();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) } as const;
  return (
    <AbsoluteFill style={{ background: C.brand, alignItems: "center", justifyContent: "center" }}>
      {ready && (
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: DISPLAY, fontSize: 64, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" }}>
          <span style={{ color: "#ffffff" }}>The club meets</span>
          <span style={{ display: "grid", justifyItems: "start" }}>
            {WHEN.map((label, i) => {
              const start = i * HOLD;
              const end = start + HOLD;
              const fadeIn = i === 0 ? 1 : interpolate(frame, [start - FADE, start + FADE], [0, 1], clamp);
              const fadeOut = i === WHEN.length - 1 ? 1 : interpolate(frame, [end - FADE, end + FADE], [1, 0], clamp);
              // The words roll up through the box: in from below, out through the top. The box itself stays put.
              const y = (1 - fadeIn) * 70 - (1 - fadeOut) * 70;
              return (
                <span key={label} style={{ gridArea: "1 / 1", opacity: fadeIn * fadeOut, background: "#ffffff", color: "#111111", padding: "12px 20px", borderRadius: 16, overflow: "hidden" }}>
                  <span style={{ display: "block", transform: `translateY(${y}%)` }}>{label}</span>
                </span>
              );
            })}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
}

function Room() {
  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <TextHighlight
        before="Tuesdays in "
        highlight="room C112"
        preset="underline"
        thickness={9}
        baseColor={C.fg}
        accentColor={C.brand}
        highlightedTextColor="#ffffff"
        fontFamily={DISPLAY}
        fontSize={78}
        fontWeight={600}
        startAt={10}
        drawDuration={16}
        mode="dark"
        theme={SNAP_THEME}
      />
    </AbsoluteFill>
  );
}

/** The last shot with the underline drawn: the poster. */
export function MeetPoster() {
  return (
    <Freeze frame={MEET.room - 1}>
      <Room />
    </Freeze>
  );
}

export function Meet() {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence durationInFrames={MEET.cycle}>
        <Cycle />
      </Sequence>
      <Sequence from={MEET.cycle}>
        <Room />
      </Sequence>
    </AbsoluteFill>
  );
}
