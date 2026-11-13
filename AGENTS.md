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
- When and where the club meets is `meeting` in `lib/content.ts`, as the club gave it. The `meet` clip (`video/src/Meet.tsx`) repeats those words: re-render it when they change.
- Page text is plain. No em or en dashes, no "not X but Y" contrasts, no one-line closers, no hype words.
- Gear tiles use actual product photos in `public/products/`, named by retailer product ID. Verify the exact version and record the photo source in `docs/CREDITS.md`.

## Design rules

- The look follows RareUI: pure black, card inside card, pill controls, Open Runde headings, Inter body. Small labels are Geist, uppercase and tracked, in neutral grey: no mono type, no square brackets, no red outline pills.
- Colours, type and spacing come from `app/tokens.css`. Add a token before adding a raw value.
- Brand marks are drawn in their own colours (`components/site/Brand.tsx`). No decorative coloured dots beside text.
- Installed registry components live in `components/ui/` (RareUI) and `components/ui/ruixen/` (Ruixen). Edits to them are listed in `docs/CREDITS.md`; add to that list when you change one.

## Motion and 3D

- Read reduced motion with `useReducedMotionSafe` from `lib/useReducedMotionSafe.ts`, not motion's `useReducedMotion`, which causes hydration mismatches. Nothing may loop under reduced motion.
- Each 3D scene has a still poster in `public/scene/` for browsers without WebGL. After changing a scene or a model, re-render with `node scripts/render-scenes.mjs` (needs Microsoft Edge installed).
- The Kenney scenes are built by `node scripts/build-kenney.mjs` from the kits in `assets-src/kenney/`.
- The clips in `public/clips/` (two on Home, one on Community) are rendered from `video/`, a separate Remotion project with SnapCN components: run `npm install` and `npm run render` inside `video/` (`npm run render -- meet` renders one). If the render cannot start Edge, copy Remotion's `chrome-headless-shell` folder from `video/node_modules/.remotion/` to a short path and set `EDGE` to its `.exe`. Its explode stills come from `node scripts/render-scenes.mjs clips`. Do not add Remotion to the root `package.json`. The clips loop silently while on screen with no controls (`components/site/Clip.tsx`); under reduced motion they stay on the poster and show the browser's controls.
- The header pills gather into one row over the first 220px of scroll, eased by a short spring (`components/site/SiteHeader.tsx`). It moves by translate only, and snaps under reduced motion.
- Model sources are in `assets-src/models/`. The files the site loads are in `public/models/`.

## Working alongside another agent

- Work on a branch and open a pull request. Do not push to `main` directly.
- Keep a change to the files it needs. Another agent may be editing the same repository.
