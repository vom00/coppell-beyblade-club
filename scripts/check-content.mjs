// Checks lib/content.ts against the client brief.
// Usage: node scripts/check-content.mjs [--online | --text]
//   default  offline string assertions against lib/content.ts
//   --online also fetches each external URL and checks YouTube oEmbed
//   --text   scans visible text in lib/content.ts and app/, components/ .tsx files
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const source = readFileSync(join(root, "lib", "content.ts"), "utf8");
const online = process.argv.includes("--online");
const textMode = process.argv.includes("--text");

// --text mode: flag em/en dashes and banned words in visible text.
const DASH = /[—–]/;
const BANNED = /\b(epic|ultimate|unleash|level\s+up|journey|stunning|vibrant|robust|crucial|pivotal|seamless|delve)\b/i;

function walkTsx(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkTsx(p, out);
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

function visibleText(line) {
  return line
    .replace(/https?:\/\/\S*/g, "") // URLs
    .replace(/className=(\{[^}]*\}|"[^"]*"|'[^']*')/g, "") // class names
    .replace(/\bfrom\s+["'][^"']*["']/g, "") // import paths
    .replace(/\s\/\/.*$/, "") // trailing // comments
    .replace(/^\s*\/\/.*$/, ""); // whole-line // comments
}

if (textMode) {
  const files = [join(root, "lib", "content.ts"), ...walkTsx(join(root, "app")), ...walkTsx(join(root, "components"))];
  let hits = 0;
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t === "" || t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("import")) return;
      const v = visibleText(line);
      if (DASH.test(v) || BANNED.test(v)) {
        hits++;
        console.log(`${relative(root, file).replaceAll("\\", "/")}:${i + 1}: ${t}`);
      }
    });
  }
  console.log(`\n${hits === 0 ? "TEXT CHECK PASSED" : `${hits} TEXT ISSUE(S) FOUND`}`);
  process.exit(hits === 0 ? 0 : 1);
}

// Each entry: [label, exact string that must appear in lib/content.ts, external URL or null]
const checks = [
  // Site
  ["region", "Dallas-Fort Worth", null],
  // Product URLs and IDs
  ["product 1 id", "19625662988", null],
  ["product 1 url", "https://www.walmart.com/ip/19625662988", "https://www.walmart.com/ip/19625662988"],
  ["product 2 id", "19639958152", null],
  ["product 2 url", "https://www.walmart.com/ip/19639958152", "https://www.walmart.com/ip/19639958152"],
  ["product 3 id", "18489300072", null],
  ["product 3 url", "https://www.walmart.com/ip/18489300072", "https://www.walmart.com/ip/18489300072"],
  ["product 4 id", "B0FJQQQDCQ", null],
  ["product 4 url", "https://www.amazon.com/dp/B0FJQQQDCQ", "https://www.amazon.com/dp/B0FJQQQDCQ"],
  ["product 5 id", "B0CS8KQ2ZL", null],
  ["product 5 url", "https://www.amazon.com/dp/B0CS8KQ2ZL", "https://www.amazon.com/dp/B0CS8KQ2ZL"],
  ["product 6 id", "B0FH7976XT", null],
  ["product 6 url", "https://www.amazon.com/dp/B0FH7976XT", "https://www.amazon.com/dp/B0FH7976XT"],
  // YouTube watch URLs
  ["video beginners watchUrl", "https://www.youtube.com/watch?v=c36yRbgqb9Q&t=26s", "https://www.youtube.com/watch?v=c36yRbgqb9Q&t=26s"],
  ["video competitive main watchUrl", "https://www.youtube.com/watch?v=tbJBYJr7bYE&t=63s", "https://www.youtube.com/watch?v=tbJBYJr7bYE&t=63s"],
  ["video competitive buying watchUrl", "https://www.youtube.com/watch?v=tbJBYJr7bYE&t=966s", "https://www.youtube.com/watch?v=tbJBYJr7bYE&t=966s"],
  // Video titles
  ["video title beginners", "Beginners Guide to Beyblade X: EVERYTHING You Need to Know to Get Started", null],
  ["video title competitive", "A Complete Guide to Competitive Beyblade X", null],
  // Links
  ["Discord The Bey Lounge", "https://discord.gg/the-bey-lounge-671191697677352969", "https://discord.gg/the-bey-lounge-671191697677352969"],
  ["Discord DFW Beyblades", "https://discord.gg/7gJhJCgXy", "https://discord.gg/7gJhJCgXy"],
  ["Instagram", "https://www.instagram.com/coppellbeybladeclub/", "https://www.instagram.com/coppellbeybladeclub/"],
  ["WBO winning combos", "https://leagues.worldbeyblade.org/winning-combos/x", "https://leagues.worldbeyblade.org/winning-combos/x"],
  ["WBO rules", "https://worldbeyblade.org/rules/x", "https://worldbeyblade.org/rules/x"],
  ["official reference parent guide", "https://beyblade.com/parent-guide/", "https://beyblade.com/parent-guide/"],
  ["official reference no-ratchet help", "https://beyblade.takaratomy.co.jp/beyblade-x/help/noratchet/", "https://beyblade.takaratomy.co.jp/beyblade-x/help/noratchet/"],
  // Page titles
  ["page title home", "Coppell Beyblade Club", null],
  ["page title learn", "Learn Beyblade X · Coppell Beyblade Club", null],
  ["page title compete", "Compete · Coppell Beyblade Club", null],
  ["page title gear", "Gear Guide · Coppell Beyblade Club", null],
  ["page title community", "Community · Coppell Beyblade Club", null],
  // Nav labels
  ["nav label Home", '"Home"', null],
  ["nav label Learn", '"Learn"', null],
  ["nav label Compete", '"Compete"', null],
  ["nav label Gear", '"Gear"', null],
  ["nav label Community", '"Community"', null],
];

let failures = 0;
const externals = [];
for (const [label, needle, url] of checks) {
  const ok = source.includes(needle);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${JSON.stringify(needle)}`);
  if (url) externals.push({ label, url });
}

if (online) {
  const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
  const tally = { OK: 0, BLOCKED: 0, FAILED: 0 };
  console.log("\n-- Online link status --");
  for (const { label, url } of externals) {
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": UA, Accept: "text/html,*/*" },
        signal: AbortSignal.timeout(15000),
      });
      const body = await res.text();
      const s = res.status;
      const finalPath = new URL(res.url || url).pathname;
      const botWall = finalPath.includes("/blocked") || [403, 429, 503].includes(s) || /Robot or human/i.test(body);
      if (botWall) {
        tally.BLOCKED++;
        console.log(`BLOCKED (needs a real browser)  ${s}  ${label}: ${url}`);
      } else if (s >= 200 && s < 400) {
        tally.OK++;
        console.log(`OK  ${s}  ${label}: ${url}`);
      } else {
        tally.FAILED++;
        console.log(`FAILED  ${s}  ${label}: ${url}`);
      }
    } catch (err) {
      tally.FAILED++;
      const reason = err?.name === "TimeoutError" ? "timeout" : err?.cause?.code ?? err?.message;
      console.log(`FAILED  ${reason}  ${label}: ${url}`);
    }
  }
  console.log(`\nLinks: ${tally.OK} OK, ${tally.BLOCKED} BLOCKED, ${tally.FAILED} FAILED`);

  console.log("\n-- YouTube oEmbed --");
  const videoChecks = [
    ["beginners", "https://www.youtube.com/watch?v=c36yRbgqb9Q&t=26s", "Beginners Guide to Beyblade X: EVERYTHING You Need to Know to Get Started", "BeybladeGeeks"],
    ["competitive", "https://www.youtube.com/watch?v=tbJBYJr7bYE&t=63s", "A Complete Guide to Competitive Beyblade X", "LeftBurst"],
  ];
  for (const [name, watchUrl, title, channel] of videoChecks) {
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
    try {
      const res = await fetch(oembed, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        console.log(`BLOCKED  ${res.status}  ${name} oEmbed`);
        continue;
      }
      const data = await res.json();
      const titleOk = data.title === title;
      const channelOk = data.author_name === channel;
      console.log(`${titleOk ? "MATCH" : "MISMATCH"}  title ${name}: brief="${title}" oembed="${data.title}"`);
      console.log(`${channelOk ? "MATCH" : "MISMATCH"}  channel ${name}: brief="${channel}" oembed="${data.author_name}"`);
    } catch (err) {
      const reason = err?.name === "TimeoutError" ? "timeout" : err?.cause?.code ?? err?.message;
      console.log(`BLOCKED  ${reason}  ${name} oEmbed`);
    }
  }
}

console.log(`\n${failures === 0 ? "ALL OFFLINE CHECKS PASSED" : `${failures} OFFLINE CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
