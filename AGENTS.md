# Notes for coding agents

Read `README.md` first for the commands, the routes and where things live. This file holds the rules that are easy to break.

## Before you finish a change

```bash
npm run typecheck
npm run check:content
npm run build
```

All three must pass. `npm run check:content -- --online` also requests every external link; the two WBO links answer 403 to scripts and are expected to show as blocked.

## Content rules

- Every link, product ID, video ID and timestamp lives in `lib/content.ts`. Change them there, never in a page.
- Do not invent facts: no dates, events, member counts, testimonials or prices.
- Page text is plain. No em or en dashes, no "not X but Y" contrasts, no one-line closers, no hype words.
- The pictures on the Gear tiles are renders of the club's models, not product photos. Keep the note on the page that says so.

## Design rules

- The look follows RareUI: pure black, card inside card, pill controls, Open Runde headings, Inter body, Geist Mono bracketed labels.
- Colours, type and spacing come from `app/tokens.css`. Add a token before adding a raw value.
- Brand marks are drawn in their own colours (`components/site/Brand.tsx`). No decorative coloured dots beside text.
- Installed registry components live in `components/ui/` (RareUI) and `components/ui/ruixen/` (Ruixen). Edits to them are listed in `docs/CREDITS.md`; add to that list when you change one.

## Motion and 3D

- Read reduced motion with `useReducedMotionSafe` from `lib/useReducedMotionSafe.ts`, not motion's `useReducedMotion`, which causes hydration mismatches. Nothing may loop under reduced motion.
- Each 3D scene has a still poster in `public/scene/` for browsers without WebGL. After changing a scene or a model, re-render with `node scripts/render-scenes.mjs` (needs Microsoft Edge installed).
- The Kenney scenes are built by `node scripts/build-kenney.mjs` from the kits in `assets-src/kenney/`.
- Model sources are in `assets-src/models/`. The files the site loads are in `public/models/`.

## Working alongside another agent

- Work on a branch and open a pull request. Do not push to `main` directly.
- Keep a change to the files it needs. Another agent may be editing the same repository.
