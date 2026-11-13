// npm run render: the clips and their posters into ../public/clips/.
// H.264, yuv420p, no audio, moov atom first (Remotion moves it with ffmpeg -movflags faststart).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("../public/clips");
const CRF = 21; // about 1 MB a clip; no banding on the black ground or the render gradients
const run = (...args) => execFileSync(process.execPath, args, { stdio: "inherit" });
const remotion = (...args) => run("node_modules/@remotion/cli/remotion-cli.js", ...args);

run("prepare.mjs");
fs.mkdirSync(OUT, { recursive: true });
// npm run render -- meet renders one clip
const only = process.argv.slice(2);
// --concurrency=1: parallel browser tabs can lay text out differently, which shows as single frames that jump.
for (const id of only.length ? only : ["basics", "match", "meet"]) {
  remotion("render", id, path.join(OUT, `${id}.mp4`), "--codec=h264", `--crf=${CRF}`, "--x264-preset=veryslow", "--pixel-format=yuv420p", "--color-space=bt709", "--muted", "--concurrency=1");
  remotion("still", `${id}-poster`, path.join(OUT, `${id}-poster.webp`), "--jpeg-quality=80");
}
for (const f of fs.readdirSync(OUT)) console.log(`public/clips/${f}`, `${(fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1)} KB`);
