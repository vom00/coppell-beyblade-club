"use client";

import { useEffect, useRef, useState } from "react";
import type { Video } from "@/lib/content-types";
import ExtLink from "./ExtLink";
import { BrandMark } from "./Brand";

type StartKey = "main" | "buying";

const actionLabel: Record<StartKey, (stamp: string) => string> = {
  main: (s) => `Play from ${s}`,
  buying: (s) => `Jump to buying advice · ${s}`,
};

/**
 * Click-to-load player. Nothing from YouTube loads until a play button is pressed.
 * A plain timestamped watch link is always visible underneath.
 */
export default function VideoPlayer({
  video,
  offer = ["main"],
}: {
  video: Video;
  offer?: StartKey[];
}) {
  const [playing, setPlaying] = useState<StartKey | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);

  const starts = offer.flatMap((key) => {
    const s = video.starts[key];
    return s ? [{ key, ...s }] : [];
  });
  if (starts.length === 0) return null;
  const main = starts[0];
  const extras = starts.slice(1);
  const current = playing ? (starts.find((s) => s.key === playing) ?? main) : null;
  const label = `${video.title} by ${video.channel}`;

  return (
    <div className="video">
      <div className="video__stage" data-playing={Boolean(current)}>
        {current ? (
          <iframe
            key={current.key}
            ref={frameRef}
            title={label}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?start=${current.seconds}&autoplay=1&playsinline=1`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="video__facade">
            <p className="chip"><BrandMark brand="youtube" /> {video.channel}</p>
            <p className="video__title">{video.title}</p>
            <p className="video__stamp">Starts at {main.stamp}</p>
            <button
              type="button"
              className="btn video__play"
              onClick={() => setPlaying(main.key)}
              aria-label={`Play video: ${video.title}, from ${main.stamp}`}
            >
              <svg viewBox="0 0 12 14" width="14" height="16" aria-hidden="true">
                <path d="M0 0l12 7-12 7z" fill="currentColor" />
              </svg>
              {actionLabel.main(main.stamp)}
            </button>
          </div>
        )}
      </div>

      {extras.length > 0 && (
        <div className="video__actions">
          {extras.map((s) => (
            <button key={s.key} type="button" className="btn btn--quiet" onClick={() => setPlaying(s.key)}>
              {actionLabel[s.key](s.stamp)}
            </button>
          ))}
        </div>
      )}

      <ul className="video__fallback">
        {starts.map((s) => (
          <li key={s.key}>
            <ExtLink href={s.watchUrl} className="textlink" context={video.title}>
              <BrandMark brand="youtube" className="video__yt" />
              Watch on YouTube from {s.stamp}
              {s.key === "buying" ? " (buying advice)" : ""}
            </ExtLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
