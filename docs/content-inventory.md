# Content inventory

Source of truth: the client brief, as transcribed into `lib/content.ts`.
Checks: `node scripts/check-content.mjs` (offline string checks) and `node scripts/check-content.mjs --online` (HTTP status and YouTube oEmbed).

Run date: 2026-11-11.

## How to check

`node scripts/check-content.mjs` has three modes:

- Default: offline assertions that the brief's IDs, URLs, titles and nav labels appear in `lib/content.ts`. Exits 1 on any failure.
- `--online`: fetches each external URL (following redirects) and reports OK, BLOCKED (needs a real browser, for bot walls) or FAILED, with a summary count. Also checks YouTube oEmbed titles and channels.
- `--text`: scans visible text in `lib/content.ts` and `.tsx` files under `app/` and `components/` for dashes and banned words. Exits 1 if anything is found.

## Pages

| id | Path | Nav label | Document title |
| --- | --- | --- | --- |
| home | `/` | Home | Coppell Beyblade Club |
| learn | `/learn` | Learn | Learn Beyblade X · Coppell Beyblade Club |
| competitive | `/competitive` | Compete | Compete · Coppell Beyblade Club |
| gear | `/gear` | Gear | Gear Guide · Coppell Beyblade Club |
| community | `/community` | Community | Community · Coppell Beyblade Club |

## External destinations

"Used on" follows the brief where the brief assigns it. Where the brief does not say, the cell reads "not assigned in brief".

| Destination | Exact URL | Used on | Offline check | Online result |
| --- | --- | --- | --- | --- |
| Product 1: Nether Incendio Z UX Infinity Starter Pack (Walmart) | https://www.walmart.com/ip/19625662988 | /gear | PASS | 301 from Node; curl shows 307 to `walmart.com/blocked` (bot block). Treat as BLOCKED. |
| Product 2: Suppress Superion 0-70LP BX Infinity Starter Pack (Walmart) | https://www.walmart.com/ip/19639958152 | /gear | PASS | 301 from Node; curl shows 307 to `walmart.com/blocked` (bot block). Treat as BLOCKED. |
| Product 3: Strike Dran 4-50FF BX Infinity Starter Pack (Walmart) | https://www.walmart.com/ip/18489300072 | /gear | PASS | 301 from Node; curl shows 307 to `walmart.com/blocked` (bot block). Treat as BLOCKED. |
| Product 4: Meteoroid Dragoon 3-70J (Amazon) | https://www.amazon.com/dp/B0FJQQQDCQ | /gear | PASS | 200 |
| Product 5: Soar Phoenix 9-60GF (Amazon) | https://www.amazon.com/dp/B0CS8KQ2ZL | /gear | PASS | 200 |
| Product 6: X-Treme Expansion Pack (Amazon) | https://www.amazon.com/dp/B0FH7976XT | /gear | PASS | 200 |
| BeybladeGeeks video, main start 0:26 | https://www.youtube.com/watch?v=c36yRbgqb9Q&t=26s | /learn | PASS | 200 |
| LeftBurst video, main start 1:03 | https://www.youtube.com/watch?v=tbJBYJr7bYE&t=63s | /competitive | PASS | 200 |
| LeftBurst video, buying start 16:06 | https://www.youtube.com/watch?v=tbJBYJr7bYE&t=966s | /competitive | PASS | 200 |
| Club Instagram | https://www.instagram.com/coppellbeybladeclub/ | /community | PASS | 200 |
| The Bey Lounge (Discord) | https://discord.gg/the-bey-lounge-671191697677352969 | /community | PASS | 301 to `discord.com/invite/the-bey-lounge-671191697677352969` |
| DFW Beyblades (Discord) | https://discord.gg/7gJhJCgXy | /community | PASS | 301 to `discord.com/invite/7gJhJCgXy` |
| Browse WBO winning combos | https://leagues.worldbeyblade.org/winning-combos/x | not assigned in brief | PASS | 403, BLOCKED |
| WBO X rules | https://worldbeyblade.org/rules/x | not assigned in brief | PASS | 301 to `worldbeyblade.org/Thread-Beyblade-X-Rules`; the redirect target was not fetched |
| Beyblade parent guide | https://beyblade.com/parent-guide/ | not assigned in brief | PASS | 200 |
| Takara Tomy: blades without a separate ratchet | https://beyblade.takaratomy.co.jp/beyblade-x/help/noratchet/ | not assigned in brief | PASS | 200 |

YouTube oEmbed (`youtube.com/oembed`), both videos: title and channel MATCH the brief.

## Checks

- Offline: 42 of 42 checks PASS.
- Online: every external URL returned a status. Walmart (3 URLs) and the WBO combos page are BLOCKED. Everything else is OK.

## Did not match the brief or needs attention

1. Walmart product pages: all three returned 301 from Node, but curl follows them to `walmart.com/blocked`. The product pages could not be verified. The check script counts 3xx as OK, so it reports these as OK when they are actually bot-blocked.
2. WBO winning combos (`leagues.worldbeyblade.org`): returns 403. It is marked BLOCKED, not failed.
3. Product 3 Walmart slug: the supplied link uses "Canyonlands" in the slug. The product is Strike Dran 4-50FF. This is recorded in the `note` field of that product and was kept unchanged in the URL.
4. Brief does not say which page uses the WBO rules, WBO combos, parent guide and no-ratchet help links. They are listed as "not assigned in brief".
5. The YouTube oEmbed title and channel matched the brief for both videos. No mismatch.
