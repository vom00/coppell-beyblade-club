# Coppell Beyblade Club

Coppell Beyblade Club is the Beyblade X club at Coppell High School. Its website runs on Next.js (App Router) and TypeScript. Motion ties the rail animation to scrolling, and Three.js renders the top and stadium.

## Run the site locally

```bash
npm install
npm run dev        # http://localhost:3000
```

To run a production build locally:

```bash
npm run build
npm run start      # http://localhost:3000
```

To check the types and site content:

```bash
npm run typecheck
npm run check:content              # every supplied URL, ID, title and timestamp is in lib/content.ts
npm run check:content -- --online  # also requests each external URL and reports its status
```

## Routes

| Path | Page |
|---|---|
| `/` | Meet the club, follow the rail sequence and find a starting point for new or competitive players. |
| `/learn` | Learn how Beyblade X works, from the three parts of a top and the four types to your first battle. |
| `/competitive` | Review the four finishes and deck coverage, try a practice drill or find the WBO links. |
| `/gear` | Browse the club's six picks by what comes in the box. |
| `/community` | Find the club on Instagram and join either of the two Discord communities. |

## Where things live

To change a URL, edit `lib/content.ts`. It holds every link, product, video and page title.

The crest sets the site's colours, type and spacing. You'll find those settings in `app/tokens.css` and `app/fonts.ts`. The original crest and the 512px copy used in the header are in `public/brand/`.

The header, footer, video player and other shared components live in `components/site/`. The top, stadium, Home rail sequence and exploded diagram on the Learn page live in `components/scene/`.

To edit the two Home clips or the Community meeting clip, work in `video/`. This Remotion project has its own `package.json`. Run `npm install` there, then use `npm run render` to regenerate the clips in `public/clips/` or `npm run studio` to open the editor.

`docs/DESIGN.md` explains the site's visual design. `docs/content-inventory.md` lists each external destination and the result of its last link check.
