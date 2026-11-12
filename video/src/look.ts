// The site's tokens (app/tokens.css) as plain values: a Remotion render has none of the site's CSS.
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONTS } from "@/lib/snap-cn-ui";

export const C = {
  bg: "#000000",
  card: "#0e0e0e",
  card2: "#141414",
  border: "#2a2a2a",
  borderStrong: "#3a3a3a",
  fg: "#e7e7e7",
  muted: "#a3a3a3",
  brand: "#e8121a",
  brandBright: "#ff5148",
  energy: "#6dff3a",
  steel: "#c5c9cf",
};

for (const [file, weight] of [["OpenRunde-Semibold.woff2", "600"], ["OpenRunde-Bold.woff2", "700"]] as const) {
  loadFont({ family: "Open Runde", url: staticFile(`site/${file}`), weight, format: "woff2" });
}
export const DISPLAY = '"Open Runde", sans-serif';
/** Inter, loaded by SnapCN's font module. */
export const BODY = `${FONTS.Inter}, sans-serif`;

/** SnapCN theme for a black ground. */
export const SNAP_THEME = {
  background: C.bg,
  foreground: C.fg,
  card: C.card,
  mutedForeground: C.muted,
  border: C.border,
  primary: C.brand,
};
