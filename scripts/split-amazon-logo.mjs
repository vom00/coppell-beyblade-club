// Splits the single simple-icons Amazon path into its subpaths with absolute starts, and reports each start,
// so the smile can be drawn in Amazon orange and the letter in the text colour.
import { readFileSync, writeFileSync } from "node:fs";
const d = readFileSync("assets-src/logos/amazon.svg", "utf8").match(/ d="([^"]+)"/)[1];
const num = "(-?\\d*\\.?\\d+(?:e-?\\d+)?)";
const startRe = new RegExp(`^[Mm]\\s*${num}\\s*,?\\s*${num}`);
const pieces = d.split(/(?=[Mm])/);
let start = [0, 0];
const out = [];
for (const p of pieces) {
  const m = p.match(startRe);
  if (!m) throw new Error("no start in " + p.slice(0, 30));
  const rel = p[0] === "m";
  const x = +m[1] + (rel ? start[0] : 0);
  const y = +m[2] + (rel ? start[1] : 0);
  start = [x, y];
  let rest = p.slice(m[0].length);
  if (/^\s*,?\s*[-.\d]/.test(rest)) rest = (rel ? "l" : "L") + rest; // implicit lineto after a moveto
  out.push({ x, y, d: `M${+x.toFixed(4)} ${+y.toFixed(4)}${rest}` });
}
out.forEach((o, i) => console.log(i, o.x.toFixed(2), o.y.toFixed(2), "len", o.d.length, o.d.slice(-6)));
// The smile and its arrowhead sit in the lower band of the 24-unit box.
const smile = out.filter((o) => o.y > 16).map((o) => o.d).join("");
const letter = out.filter((o) => o.y <= 16).map((o) => o.d).join("");
const file = "components/site/brand-paths.ts";
let ts = readFileSync(file, "utf8");
ts = ts.replace(/\n\/\/ Amazon in two parts[\s\S]*$/, "\n");
ts = ts.trimEnd() + `\n\n// Amazon in two parts, split from the path above by scripts/build-logos.mjs: the letter and the smile.\nexport const amazonParts = {\n  letter: "${letter}",\n  smile: "${smile}",\n} as const;\n`;
writeFileSync(file, ts);
console.log("letter", letter.length, "smile", smile.length);
