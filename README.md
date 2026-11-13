# Coppell Beyblade Club

The website for Coppell Beyblade Club, a Beyblade X club at Coppell High School.
Next.js (App Router), TypeScript, Motion for the scroll link, Three.js for the top and stadium.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run start      # http://localhost:3000
```

Checks:

```bash
npm run typecheck
npm run check:content              # every supplied URL, ID, title and timestamp is in lib/content.ts
npm run check:content -- --online  # also requests each external URL and reports its status
```

## Routes

| Path | Page |
|---|---|
| `/` | Home: the club, the rail sequence, paths for newcomers and competitors |
| `/learn` | What Beyblade X is, the three parts, the four types, a first battle |
| `/competitive` | The four finishes, deck coverage, a practice drill, WBO links |
| `/gear` | The club's six picks, grouped by what is in the box |
| `/community` | Club Instagram and the two Discord communities |

## Where things live

- `lib/content.ts` — the one record of every link, product, video and page title. Change a URL here, not in a page.
- `app/tokens.css`, `app/fonts.ts` — colours, type and spacing, all drawn from the crest.
- `components/scene/` — the top, the stadium, the Home rail sequence and the Learn exploded diagram.
- `components/site/` — header, footer, video player and other shared pieces.
- `video/`: the Remotion project for the two Home clips and the Community meeting clip (its own `package.json`). `npm install` then `npm run render` inside it rewrites `public/clips/`; `npm run studio` opens the editor.
- `public/brand/` — the original club crest, unmodified, plus a 512px copy for the header.
- `docs/DESIGN.md` — the visual direction the site was built to.
- `docs/content-inventory.md` — every external destination and its last check result.
