// Copies the site's renders and fonts that the clips use into video/public/site/ (git-ignored),
// because Remotion's staticFile() only serves video/public/. Run by `npm run studio` and `npm run render`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..");
const OUT = path.join(HERE, "public/site");
const FILES = [
  "public/scene/conveyor-poster.webp",
  "public/scene/conveyor-poster-ratchet.webp",
  "public/scene/conveyor-poster-bit.webp",
  "app/fonts/OpenRunde-Semibold.woff2",
  "app/fonts/OpenRunde-Bold.woff2",
];
fs.mkdirSync(OUT, { recursive: true });
for (const f of FILES) fs.copyFileSync(path.join(SITE, f), path.join(OUT, path.basename(f)));
console.log(`copied ${FILES.length} site files to video/public/site/`);
