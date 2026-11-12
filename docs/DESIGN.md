# Coppell Beyblade Club: visual direction and build contracts (v3)

Set by the main session. Agents build to this. The club owner's instructions beat any skill default.

## 0. What the club owner asked for (v3)

1. Use the supplied 3D models (three tops and a stadium) instead of home-made geometry. Done in
   `components/scene/assets.ts` and `public/models/`.
2. Remove the banner with text moving across it. Done; do not bring back any marquee or ticker.
3. Kenney **Factory Kit**: a parts selector where an animated conveyor brings the selected Blade,
   Ratchet or Bit into view, so the animation has a purpose while visitors learn how a top fits
   together.
4. Kenney **Space Station Kit**: a display bay built from the sci-fi interior pieces, with the
   selected Beyblade in the centre and its name and stats beside it, added to an existing page.
5. Use other free 3D assets across the site where they help.
6. Study rareui.com and use its interface, UI and UX, and **the same fonts**. Use components from
   rareui.com/components and ruixen.com wherever they suit the site.

7. "I want it to look like RareUI not Ruixen, but keep animated elements we have made so far."
   The visual language is RareUI only. Ruixen components may be used but must be restyled so
   nothing looks like ruixen.com. Every animation already built stays (restyled); only the moving
   text banner is gone.
8. "Make sure to include company logos and just logos in general." Brand marks (from the
   `simple-icons` package, inline monochrome SVG with accessible names) on every tile and button
   that links to Instagram, Discord, YouTube, Walmart or Amazon, the crest in nav, hero and
   footer, and one RareUI-style logo row on Home labelled as the places the site links to. Never
   call them sponsors, partners or backers. Text wordmark chips where a mark is not available.

## 1. The look: RareUI's language, the club's red

Observed on rareui.com (home and components pages):

- **Fonts.** Headings in **Open Runde** (600 to 700, sentence case, letter-spacing about -0.025em,
  line-height 1.0 to 1.1). Body in **Inter** (400 to 500, muted grey). Small labels, hints and
  counts in **Geist Mono**, often inside square brackets: `[3]`, `[Hover to play]`.
  Tokens: `--font-display-stack`, `--font-body-stack`, `--font-mono-stack`.
  No uppercase condensed italic type, no outline type, no skewed text.
- **Ground.** Pure black page. Cards are near-black (`--card`) with a 1px border (`--border`) and
  large radii. The signature pattern is **card in card**: an outer dark card with a small padding,
  an inner panel (dark, or light grey `--panel-light` for diagrams) holding the demo or picture,
  and a footer row with the name on the left and a small accent arrow (↗) on the right.
- **Accent.** RareUI uses one orange accent. We use the crest's red (`--brand`, which is also shadcn `--primary`) in that role:
  primary button, arrows, bracket counts, small "NEW"-style chips. Xtreme green (`--energy`) is
  reserved for live states: rail teeth, progress, the selected part. No teal, amber or violet in the
  interface (the 3D models keep their own colours).
- **Shape.** Fully rounded pills for nav groups, buttons and chips. Cards `--radius-card` (20px),
  inner panels `--radius-panel` (14px). No slanted bands, no `clip-path` cuts, no tick dividers as
  decoration (ticks stay only on the rail rider and the 3D rail).
- **Layout.** Centred. A floating nav of separate pill groups at the top: `[crest + club name]`,
  `[Learn | Compete | Gear | Community]` with thin separators and the active item brighter, and
  `[Instagram]`. Centred hero heading with a small mono badge above it and one primary button plus
  one quiet control below. Section headers are a heading plus a bracketed count in the accent
  colour. Content sits in bento grids of card-in-card tiles, max width about 68rem.
- **Motion.** Blur-in entrances (opacity 0, blur 12px, 8px lower, to sharp), staggered by element.
  Tiles play their animation on hover or when in view. Buttons have a soft glow. Springy, short,
  never looping forever without a reason. The launch wipe from v2 is removed.
- **Voice and text rules (unchanged).** A club member explaining across a stadium table. No em or
  en dashes in visible text. No "not X but Y" contrasts, one-line dramatic closers, forced groups
  of three, staged openers, hype or sales words, or decorative bold. Buttons name their
  destination. No invented meeting times, rooms, dates, member counts, quotes, prices, stock,
  rankings, results or testimonials. Every link, product, video, title and top spec comes from
  `lib/content.ts`.
- **Crest.** Never redrawn, recoloured, cropped or rotated.

## 2. Pages (same five routes, same facts, same link targets and titles)

| Route | Composition in v3 |
|---|---|
| `/` | Centred hero copy over the stadium rail sequence (`RailSequence`). Then **the display bay** (`DisplayBay`, three tops from `bayTops`). Then "Two ways in" as two large card-in-card tiles, the four finishes as four small tiles with their looping diagrams and animated point counters, and the Instagram call as a card with a soft red glow. |
| `/learn` | Hero, the exploded diagram (`PartsExplode`), **the parts conveyor** (`PartsConveyor`), rail catch tile, four type tiles with their looping diagrams, first-battle checklist as an animated task list, video, official references. |
| `/competitive` | Hero, WBO winning combos as the loudest tile, the scoresheet as a light inner panel with animated counters, the "first to 4" tally, deck coverage tiles, the practice drill as a step player, video. |
| `/gear` | Hero, stadium notice, "What is in the box?" as three folder-style tiles that open, six product tiles (name, launcher chip, spin and type, reason, retailer button with ↗), second-opinion video. |
| `/community` | Hero with the crest in its ring, Instagram as the big tile, the two Discords as tiles with an "External community" chip. |

The **rail rider** (the top riding a toothed rail at the viewport edge) stays: it is the object that
carries the visitor through the site. Restyle its rail to sit in a slim rounded pill.

## 3. Components to bring in from RareUI and Ruixen (owner: pages agent)

The club owner was explicit: **use what the two sites actually offer**. That means installing
their real components through their own install route and using their tools, not hand-writing
look-alikes.

- **Install route.** Both are shadcn registries on Tailwind v4 and Motion.
  RareUI: `npx shadcn@latest add swamimalode07/rare-ui/<component>` (for example `fluid-orb`).
  Ruixen: `npx shadcn@latest add "https://ruixen.com/r/<component>"`.
  Tailwind v4, PostCSS and `components.json` are already set up by the main session; components
  land in `components/ui/`. Read each installed file before wiring it in, keep its behaviour, and
  restyle only through tokens, props and class names. A hand-written imitation does not count.
- **Ruixen tools** (ruixen.com/tools): Shadcn Theme Generator (the site's shadcn CSS variables),
  Shadow Generator (card and button shadows), Glassmorphism generator (the floating nav pills),
  Gradient Generator and the Gradient Gallery (hero and call-to-action glows). The values in
  `app/tokens.css` follow those tools' output formats; when you need a new shadow, glass or
  gradient value, write it in the same form and note it in `docs/CREDITS.md`.

Candidates:

- RareUI: Gooey nav (header), Scroll Progress or Rail TOC (only if it does not fight the rail
  rider), Step player (practice drill), Animated counter (finish points, tally), Task list
  (first-battle checklist), Folder component ("What is in the box?"), FAQ (only with questions
  answered by copy that already exists), Gravity Letters (404 page), Grid Reveal.
- Ruixen: Floating Navbar, Split Feature Showcase or Feature Highlights ("Two ways in"), Wordmark
  Footer, Badge Morph (type and launcher chips), Rising Glow (hero and Instagram call), a FAQ
  accordion, Product Card Hero ideas for gear tiles.

Use at least six components across the two libraries. List which ones in the report, with their
source URLs, and keep a `docs/CREDITS.md` entry for each library.

## 4. 3D scenes (owner: scene agent, `components/scene/**`, `public/scene/**`, `public/models/**`)

Existing: `RailSequence`, `PartsExplode`, `RailCatchStill`, loader `assets.ts`, effects, posters.

New, built on the Kenney kits in `assets-src/kenney/` (CC0; copy only the GLBs you use into
`public/models/kenney/`):

```tsx
// components/scene/PartsConveyor.tsx ("use client")
import type { PartCopy } from "./PartsExplode";
export default function PartsConveyor(props: { parts: PartCopy[] }): JSX.Element;

// components/scene/DisplayBay.tsx ("use client")
import type { BayTop } from "@/lib/content-types";
export default function DisplayBay(props: { tops: BayTop[] }): JSX.Element;
```

- **PartsConveyor.** A factory line from the Factory Kit (conveyor pieces, a scanner or screen, a
  robot arm or machine as set dressing). Three real buttons (Blade, Ratchet, Bit) in a pill
  segmented control. Choosing one runs the belt: the current part rides out, the chosen part
  (from the Dran Sword model) rides in under the scanner and stops, turning slowly, while its
  name and summary (from `parts`) show beside it in HTML. The belt surface should visibly move
  while parts travel. Keyboard operable, `aria-live="polite"` on the description, selected part
  ring in `--energy`.
- **DisplayBay.** A display bay from the Space Station Kit (floor panels, walls, a display table
  or pedestal, pipes or screens as dressing). A pill segmented control of the three tops. The
  selected top sits on the pedestal turning slowly under a light; switching lowers one and
  raises the next. Name, product code, parts list and facts from `tops` in HTML beside it
  (definition list). Do not add stats that are not in `tops`.
- Both render one block (not full-bleed) that fills its container: a card-in-card tile per
  section 1, with the canvas as the inner panel. The page supplies the section heading.
- Both follow the standing scene rules: poster first (`public/scene/conveyor-poster.webp`,
  `bay-poster.webp`), lazy engine and model loading near the viewport, DPR cap 1.5 on coarse
  pointers, draw only while visible, pause when the tab is hidden, dispose on unmount, poster and
  full HTML content remain if WebGL or a fetch fails, reduced motion switches instantly with no
  travel animation, works at 320px wide and on short landscape phones.
- Restyle the existing scene modules to section 1: Open Runde headings in sentence case, mono
  bracket hints, rounded panels, accent red, green only for live states. Remove the oversize
  italic outline words and teal labels.

## 5. Contracts

Owned by the main session, read-only for agents: `app/tokens.css`, `app/fonts.ts`, `app/fonts/**`,
`lib/**`, `docs/DESIGN.md`, `assets-src/**`.

Tokens available (`app/tokens.css`): the shadcn theme set (`--background --foreground --card
--primary --secondary --muted --muted-foreground --accent --border --input --ring --radius` and
their `-foreground` pairs; note that `--accent` is shadcn's hover surface, not the red), club
extras `--brand --brand-bright --brand-fg --energy --card-2 --border-strong --fg-dim --panel-light
--panel-light-fg --focus --shadow-card --shadow-glow --glass-bg --glass-blur --glass-border
--glow-brand`, grounds `--bg --surface --line --fg --fg-muted --accent-text`,
`--radius-card --radius-panel --radius-pill`, `--font-display-stack --font-body-stack
--font-mono-stack`, `--step--1 … --step-5`, `--space-1 … --space-9`, `--wrap --gutter --header-h
--measure`, `--ease-out --ease-snap --dur-fast --dur --dur-slow`, `--blur-in`.
Legacy names (`--ink`, `--paper`, `--red`, `--surface`, `--line`, `--xtreme`, `--diagram` and so
on) still resolve so old CSS keeps working, but new CSS should use the names above.

- **Pages agent** owns `app/**` (except tokens, fonts, lab), `components/site/**`,
  `components/motion/**`, `components/ui/**`, Tailwind and PostCSS config, `docs/CREDITS.md`.
- **Scene agent** owns `components/scene/**`, `public/scene/**`, `public/models/**`, temporary
  `app/lab/**`.

## 6. Dev environment rules for agents

- A dev server is running at **http://localhost:3000**. Do not start another, do not run
  `next build`, do not stop it. `npx tsc --noEmit` is fine.
- Do not use the Browser pane, Chrome tools or computer-use. For screenshots use headless Edge:
  `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --screenshot=<abs path> --window-size=1440,900 --virtual-time-budget=6000 <url>`
  (add `--force-prefers-reduced-motion` for reduced motion). Write shots to `shots/v3/`.
- Stay inside the files you own. Report anything you need from another owner.
