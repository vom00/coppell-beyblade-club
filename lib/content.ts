import type {
  BayTop,
  FaqItem,
  ExternalLink,
  Product,
  ProductGroup,
  SiteRoute,
  Video,
} from "./content-types";

export const site = {
  name: "Coppell Beyblade Club",
  school: "Coppell High School",
  region: "Dallas-Fort Worth",
} as const;

export const routes: SiteRoute[] = [
  {
    id: "home",
    path: "/",
    navLabel: "Home",
    title: "Coppell Beyblade Club",
    description:
      "Coppell Beyblade Club is a Beyblade X club at Coppell High School in the Dallas-Fort Worth area. Learn how the game works, see how matches are scored and find local players.",
  },
  {
    id: "learn",
    path: "/learn",
    navLabel: "Learn",
    title: "Learn Beyblade X · Coppell Beyblade Club",
    description:
      "What Beyblade X is, how the gear on the bit catches the stadium rail, the three parts of a top, and what two players need for a first battle.",
  },
  {
    id: "competitive",
    path: "/competitive",
    navLabel: "Compete",
    title: "Compete · Coppell Beyblade Club",
    description:
      "How the four finishes score, how a deck covers different matchups, one practice drill, and where the WBO keeps its winning combos.",
  },
  {
    id: "gear",
    path: "/gear",
    navLabel: "Gear",
    title: "Gear Guide · Coppell Beyblade Club",
    description:
      "The club’s six picks for starting Beyblade X, grouped by what is in the box: starter packs with launchers, string launcher sets, and a parts expansion.",
  },
  {
    id: "community",
    path: "/community",
    navLabel: "Community",
    title: "Community · Coppell Beyblade Club",
    description:
      "Follow the club on Instagram for Coppell updates, and find the wider Dallas-Fort Worth Beyblade community on Discord.",
  },
];

export const videos: { beginners: Video; competitive: Video } = {
  beginners: {
    id: "c36yRbgqb9Q",
    channel: "BeybladeGeeks",
    title:
      "Beginners Guide to Beyblade X: EVERYTHING You Need to Know to Get Started",
    starts: {
      main: {
        seconds: 26,
        stamp: "0:26",
        watchUrl: "https://www.youtube.com/watch?v=c36yRbgqb9Q&t=26s",
      },
    },
  },
  competitive: {
    id: "tbJBYJr7bYE",
    channel: "LeftBurst",
    title: "A Complete Guide to Competitive Beyblade X",
    starts: {
      main: {
        seconds: 63,
        stamp: "1:03",
        watchUrl: "https://www.youtube.com/watch?v=tbJBYJr7bYE&t=63s",
      },
      buying: {
        seconds: 966,
        stamp: "16:06",
        watchUrl: "https://www.youtube.com/watch?v=tbJBYJr7bYE&t=966s",
      },
    },
  },
};

export const productGroups: ProductGroup[] = [
  {
    id: "starter",
    heading: "Starter packs with launchers",
    inTheBox: "A top and a launcher in one box.",
  },
  {
    id: "string-launcher",
    heading: "String launcher sets",
    inTheBox: "A top and a string launcher in one box.",
  },
  {
    id: "expansion",
    heading: "Parts expansion",
    inTheBox: "Parts only, for building new combinations. The launcher and stadium are sold separately.",
  },
];

export const products: Product[] = [
  {
    productId: "19625662988",
    retailer: "Walmart",
    url: "https://www.walmart.com/ip/19625662988",
    name: "Nether Incendio Z UX Infinity Starter Pack",
    group: "starter",
    includesLauncher: true,
    launcher: "Launcher included",
    reason:
      "The ratchet is built into the blade on this one, so it shows how a ratchet-integrated top goes together. The launcher is in the box.",
  },
  {
    productId: "19639958152",
    retailer: "Walmart",
    url: "https://www.walmart.com/ip/19639958152",
    name: "Suppress Superion 0-70LP BX Infinity Starter Pack",
    group: "starter",
    includesLauncher: true,
    launcher: "Launcher included",
    spin: "Right-spin",
    type: "Balance",
    reason:
      "A right-spin Balance Type with a launcher in the box. It suits a mixed play style.",
  },
  {
    productId: "18489300072",
    retailer: "Walmart",
    url: "https://www.walmart.com/ip/18489300072",
    name: "Strike Dran 4-50FF BX Infinity Starter Pack",
    group: "starter",
    includesLauncher: true,
    launcher: "Launcher included",
    spin: "Right-spin",
    type: "Attack",
    reason:
      "A right-spin Attack Type with a launcher in the box. Use it to practice knockouts.",
    note: "Walmart’s link has “Canyonlands” in its address. The product is Strike Dran 4-50FF.",
  },
  {
    productId: "B0FJQQQDCQ",
    retailer: "Amazon",
    url: "https://www.amazon.com/dp/B0FJQQQDCQ",
    name: "Meteoroid Dragoon 3-70J",
    group: "string-launcher",
    includesLauncher: true,
    launcher: "Left-spin string launcher included",
    spin: "Left-spin",
    reason:
      "Comes with a left-spin string launcher, so it is the set for trying left-spin play.",
  },
  {
    productId: "B0CS8KQ2ZL",
    retailer: "Amazon",
    url: "https://www.amazon.com/dp/B0CS8KQ2ZL",
    name: "Soar Phoenix 9-60GF",
    group: "string-launcher",
    includesLauncher: true,
    launcher: "String launcher included",
    spin: "Right-spin",
    type: "Attack",
    reason:
      "Pairs a right-spin attack top with a string launcher. LeftBurst discusses this set in the buying chapter of the guide.",
  },
  {
    productId: "B0FH7976XT",
    retailer: "Amazon",
    url: "https://www.amazon.com/dp/B0FH7976XT",
    name: "X-Treme Expansion Pack",
    group: "expansion",
    includesLauncher: false,
    launcher: "Launcher sold separately",
    reason:
      "Extra parts for experimenting with builds. The launcher and stadium are sold separately.",
  },
];

export const links: {
  instagram: ExternalLink;
  beyLounge: ExternalLink;
  dfwBeyblades: ExternalLink;
  wboWinningCombos: ExternalLink;
  wboRules: ExternalLink;
  parentGuide: ExternalLink;
  noRatchetHelp: ExternalLink;
} = {
  instagram: {
    label: "Club Instagram",
    url: "https://www.instagram.com/coppellbeybladeclub/",
    purpose: "club updates and local questions",
  },
  beyLounge: {
    label: "The Bey Lounge",
    url: "https://discord.gg/the-bey-lounge-671191697677352969",
    purpose: "Beyblade news and leaks",
  },
  dfwBeyblades: {
    label: "DFW Beyblades",
    url: "https://discord.gg/7gJhJCgXy",
    purpose: "regional Beyblade community",
  },
  wboWinningCombos: {
    label: "Browse WBO winning combos",
    url: "https://leagues.worldbeyblade.org/winning-combos/x",
    purpose: "current winning combos, kept by the WBO",
  },
  wboRules: {
    label: "WBO X rules",
    url: "https://worldbeyblade.org/rules/x",
    purpose: "the WBO's Beyblade X ruleset",
  },
  parentGuide: {
    label: "Beyblade parent guide",
    url: "https://beyblade.com/parent-guide/",
    purpose: "official brand guide",
  },
  noRatchetHelp: {
    label: "Takara Tomy: blades without a separate ratchet",
    url: "https://beyblade.takaratomy.co.jp/beyblade-x/help/noratchet/",
    purpose: "official help page on ratchet-integrated blades",
  },
};

/** Display bay. Part names are read off each combo name; nothing here is a ranking or a recommendation. */
export const bayTops: BayTop[] = [
  {
    id: "drake-brave",
    name: "Drake Brave G4-70I",
    code: "CX-00",
    parts: [
      { label: "Lock chip", value: "Drake" },
      { label: "Main blade", value: "Brave" },
      { label: "Assist blade", value: "Gravity (G)" },
      { label: "Ratchet", value: "4-70" },
      { label: "Bit", value: "Ignition (I)" },
    ],
    facts: [
      { label: "Type", value: "Attack" },
      { label: "Spin", value: "Right" },
    ],
  },
  {
    id: "knight-shield",
    name: "Knight Shield 3-80N",
    code: "BX-04",
    parts: [
      { label: "Blade", value: "Knight Shield" },
      { label: "Ratchet", value: "3-80" },
      { label: "Bit", value: "Needle (N)" },
    ],
    facts: [
      { label: "Type", value: "Defense" },
      { label: "Spin", value: "Right" },
    ],
  },
  {
    id: "hells-scythe",
    name: "Hells Scythe 4-60T",
    code: "BX-02",
    parts: [
      { label: "Blade", value: "Hells Scythe" },
      { label: "Ratchet", value: "4-60" },
      { label: "Bit", value: "Taper (T)" },
    ],
    facts: [
      { label: "Type", value: "Balance" },
      { label: "Spin", value: "Right" },
    ],
  },
  {
    id: "sol-eclipse",
    name: "Sol Eclipse D5-70TK",
    code: "CX-09",
    parts: [
      { label: "Lock chip", value: "Sol" },
      { label: "Main blade", value: "Eclipse" },
      { label: "Assist blade", value: "D" },
      { label: "Ratchet", value: "5-70" },
      { label: "Bit", value: "TK" },
    ],
    facts: [
      { label: "Type", value: "Balance" },
      { label: "Spin", value: "Right" },
    ],
  },
  {
    id: "unicorn-delta",
    name: "Unicorn Delta PO3-60GU",
    code: "CX-17",
    parts: [
      { label: "Lock chip", value: "Unicorn" },
      { label: "Main blade", value: "Delta" },
      { label: "Assist blade", value: "PO" },
      { label: "Ratchet", value: "3-60" },
      { label: "Bit", value: "GU" },
    ],
    facts: [],
  },
  {
    id: "dran-sword",
    name: "Dran Sword 3-60F",
    code: "BX-01",
    parts: [
      { label: "Blade", value: "Dran Sword" },
      { label: "Ratchet", value: "3-60" },
      { label: "Bit", value: "Flat (F)" },
    ],
    facts: [
      { label: "Type", value: "Attack" },
      { label: "Spin", value: "Right" },
    ],
  },
];

/** Questions and answers. Every answer restates copy from the pages; nothing new is claimed here. */
export const faq: FaqItem[] = [
  {
    q: "What is Beyblade X?",
    a: "Two players each launch a customizable spinning top into a stadium and let the tops fight. It is the fourth generation of Beyblade.",
    href: "/learn",
    linkLabel: "Learn Beyblade X",
  },
  {
    q: "What is an Xtreme Dash?",
    a: "The bit carries a small gear and the stadium has a toothed rail around its edge. When the gear meets the rail, it grips the teeth and the rail drives the top forward in a burst of speed.",
    href: "/learn",
    linkLabel: "See how the rail catch works",
  },
  {
    q: "What do two players need for a first battle?",
    a: "A top for each player, a compatible launcher for each player, and one Beyblade X stadium between you.",
    href: "/gear",
    linkLabel: "Club gear picks",
  },
  {
    q: "Does every top come apart into three parts?",
    a: "The classic layout is Blade, Ratchet and Bit, but not every release follows it. Some integrate parts: Nether Incendio Z, for example, integrates the ratchet into its blade.",
    href: "https://beyblade.takaratomy.co.jp/beyblade-x/help/noratchet/",
    linkLabel: "Takara Tomy: blades without a separate ratchet",
    external: true,
  },
  {
    q: "How is a match scored?",
    a: "A Spin Finish is 1 point, an Over Finish 2, a Burst Finish 2 and an Xtreme Finish 3. First to 4 points is the standard match in the brand guide. Check your event organizer's rules for the format and score target.",
    href: "/competitive",
    linkLabel: "Scoring and deck building",
  },
  {
    q: "Where are the current winning combos?",
    a: "With the WBO, which keeps the results and rankings. The club does not copy them here.",
    href: "https://leagues.worldbeyblade.org/winning-combos/x",
    linkLabel: "Browse WBO winning combos",
    external: true,
  },
  {
    q: "When and where does the club meet?",
    a: "Meeting times, rooms and who is eligible are not posted on this site. Message the club account on Instagram.",
    href: "https://www.instagram.com/coppellbeybladeclub/",
    linkLabel: "Club Instagram",
    external: true,
  },
];
