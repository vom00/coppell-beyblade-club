// Builds the logo assets the site uses from the files in assets-src/logos.
// - Walmart and Amazon: path data from simple-icons 9.21.0 (CC0) is written into components/site/brand-paths.ts.
// - WBO: the organisation's own logo (worldbeyblade.org), resized. It is full colour, so it is an <img>, not a path.
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("public/logos", { recursive: true });
const info = await sharp("assets-src/logos/wbo-brand-logo.png")
  .resize({ width: 264 })
  .webp({ quality: 88, alphaQuality: 100 })
  .toFile("public/logos/wbo.webp");
console.log("wbo.webp", info.width, info.height, info.size);

const d = (name) => readFileSync(`assets-src/logos/${name}.svg`, "utf8").match(/ d="([^"]+)"/)[1];
const file = "components/site/brand-paths.ts";
let ts = readFileSync(file, "utf8");
for (const name of ["walmart", "amazon"]) {
  if (ts.includes(`  ${name}: "`)) continue;
  ts = ts.replace("} as const;", `  ${name}: "${d(name)}",\n} as const;`);
}
writeFileSync(file, ts);
console.log("brand paths:", [...ts.matchAll(/^  (\w+): "/gm)].map((m) => m[1]).join(", "));
