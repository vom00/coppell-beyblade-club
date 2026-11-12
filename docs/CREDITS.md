# Credits

## Interface components

### RareUI (https://www.rareui.com/)

Installed with `npx shadcn@latest add swamimalode07/rare-ui/<name>` into `components/ui/`:

- `gooey-nav` (header page links)
- `folder-component` ("What is in the box?" tiles on Gear)
- `animated-counter` (finish points on Home and Compete)
- `task-list` (first battle checklist on Learn)
- `step-player` (practice drill on Compete)
- `gravity-letters` (404 page)
- `faq` (Home, the "Questions" section; answers and follow-up links come from `faq` in `lib/content.ts`)
- `rail-toc` (in-page contents on Learn and Compete, left margin from 1440px wide)
- `grid-reveal` (the four type diagrams on Learn; the grid resolves into a still of each diagram, then the live loop shows)
- `fluid-orb` (red orb behind the crest on the Community hero)
- `toast` (the "Link copied" message after the Copy link buttons on Community; mounted once in `app/layout.tsx`)
- `hook-sidebar` (the phone menu that opens from the Menu pill)

Changes made to installed RareUI files, all small: `folder-component` gained `cards` (real content on up to three
cards) and `open` (opened by the tile around it), and its stock cards got a fixed size because they collapsed to nothing
under the site's image rule; `fluid-orb` gained a `base` colour prop (RareUI's white is still the
default) and stops drawing while offscreen or in a hidden tab; the accent `#FC4C01` in `toast` and `faq` is the club red.
Tried and removed: `bounce-sidebar` and `proximity-sidebar` (hook-sidebar fit the phone menu better). The Scroll Progress
indicator was left out because the rail rider already shows scroll progress.
Extra npm packages the new components need: `sonner` (toast) and `figma-squircle` (toast shapes).

Licence as stated in https://github.com/swamimalode07/rare-ui/blob/main/LICENSE: MIT with the Commons Clause and an
attribution requirement. The attribution requirement is met by the visible link to rareui.com in the site footer. The
components are used inside this site and are not redistributed on their own. The name Rare UI, its logo and its site
design are not covered by the licence; this site follows RareUI's visual language (black ground, card in card tiles,
pill controls, bracketed counts) and uses the club's own colours and crest.

### Ruixen UI (https://ruixen.com/)

Installed with `npx shadcn@latest add "https://ruixen.com/r/<name>"` into `components/ui/ruixen/`:

- `wordmark-footer` (footer wordmark)
- `rising-glow` (Instagram call on Home)
- `badge-morph` ("External community" chip on Community)

Licence: no licence file was found in the Ruixen repositories checked, so the licence is to be confirmed by the club.
The components are restyled through tokens and class names; behaviour is unchanged except that looping motion stops
under reduced motion, the wordmark footer is tall enough to show the whole word, and the idle badge has no dot.

Ruixen tools (https://ruixen.com/tools) were used for the form of the theme variables, shadows, glass and gradient
values in `app/tokens.css`. New values written in the same form (the pill glass group, the card glow and the hero
glow gradients in `app/globals.css`) follow the Glassmorphism, Shadow and Gradient generators.

## Fonts

- Open Runde, SIL Open Font Licence 1.1, https://github.com/lauridskern/open-runde (licence text in `app/fonts/`)
- Inter, SIL Open Font Licence 1.1, https://rsms.me/inter/
- Geist Mono, SIL Open Font Licence 1.1, https://vercel.com/font

## Icons and brand marks

- simple-icons (CC0 1.0), https://simpleicons.org/. The Instagram, Discord and YouTube paths are copied into
  `components/site/brand-paths.ts`. Walmart and Amazon come from simple-icons 9.21.0, the last release that carried
  them (source files in `assets-src/logos/`). Each mark is drawn in its brand's own colours; inside a solid red button
  it takes the button's text colour so it stays readable. The Walmart mark is cropped to the spark, and the Amazon path
  is split into the letter and the smile by `scripts/split-amazon-logo.mjs`.
- The WBO logo (`public/logos/wbo.webp`) is the World Beyblade Organization's own logo, saved from worldbeyblade.org
  and resized by `scripts/build-logos.mjs`. It is used only on links to the WBO. The club should ask the WBO if it wants
  written permission to show it.
- lucide-react (ISC), https://lucide.dev/, a dependency of the installed components.
- All trademarks and logos belong to their owners. The site links to these services; it is not affiliated with or
  endorsed by any of them.

## 3D models

- Kenney Factory Kit and Space Station Kit (CC0 1.0), https://kenney.nl/
- The stadium and six top models (Dran Sword 3-60F, Drake Brave G4-70I, Unicorn Delta PO3-60GU, Knight Shield 3-80N,
  Hells Scythe 4-60T, Sol Eclipse D5-70TK) were supplied by the club. Source and licence are to be confirmed by the club.
- The Home tiles (`public/tops/`) and scene posters (`public/scene/`) use renders of those models.

## Product photos

The Gear and deck coverage cards use cropped, locally stored versions of these product photos.

| Product | Listing | Original image |
| --- | --- | --- |
| Nether Incendio Z | [BigBadToyStore](https://www.bigbadtoystore.com/product/beyblade-x-nether-incendio-z-ux-infinity-starter-pack-200028?variation=394380) | [Top](https://images.bigbadtoystore.com/images/product/200028/05568982-4684-41a2-85fb-3e74f16ac15a/original.jpg) |
| Suppress Superion 0-70LP | [BeysAndBricks, Hasbro G2745](https://beysandbricks.com/hasbro-sieg-suppress-superion-0-70lp-beyblade-x-starter-g2745/) | [Starter set](https://cdn11.bigcommerce.com/s-iodt3qca/images/stencil/1280x1280/products/5581/64745/Screenshot_2026-10-08_164045__27584.1791502884.png) |
| Strike Dran 4-50FF | [Walmart](https://www.walmart.com/ip/18489300072) | [Top](https://i5.walmartimages.com/asr/c165bc29-0ed2-457a-8cd4-58681b9d0e90.a18e2dc4614dc55120f96dd9e276f4d2.jpeg) |
| Meteoroid Dragoon 3-70J | [Beyblade Toys, Hasbro set](https://beyblade-toys.com/products/meteoroid-dragoon) | [Top and launcher](https://cdn.shopify.com/s/files/1/0257/5410/7976/files/toys-migration-meteoroid-dragoon-2.jpg?v=1784130784) |
| Soar Phoenix 9-60GF | [Hasbro, F9324](https://instructions.hasbro.com/en-ca/instruction/beyblade-x-soar-phoenix-9-60gf-deluxe-string-launcher-set-with-right-spinning-top-toy) | [Top and launcher](https://www.hasbro.com/common/productimages/en_CA/51FD8C99AA6B41EB95D642558B40139A/4da484a1f4662377fd8860f483ba847fde89bcd5.jpg) |
| X-Treme Expansion Pack | [Enarxis, Hasbro G3195](https://b2b.enarxis.eu/hasbro-beyblade-x-wind-cave-x-treme-expansion-pack-g3195) | [All twelve parts](https://b2b.enarxis.eu/images/thumbs/0210232_550.jpeg) |
| Silver Wolf 3-80FB | [Takara Tomy, UX-08](https://beyblade.takaratomy.co.jp/beyblade-x/lineup/ux08.html) | [Starter set](https://beyblade.takaratomy.co.jp/beyblade-x/lineup/_image/UX08@1.png) |
| Glory Valkyrie LF | [Takara Tomy Mall, UX-20](https://takaratomymall.jp/shop/g/g8202701096139/) | [Top](https://takaratomymall.jp/img/goods/5/4904810096139_9150ace600ac4d6b8de03ed4369c6346.jpg) |

## Other packages

Next.js, React, Motion, Three.js, Tailwind CSS, tw-animate-css, class-variance-authority, clsx, tailwind-merge and
flubber (used by the Step Player), each under its own open source licence.
