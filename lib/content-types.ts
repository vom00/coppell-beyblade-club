// Shapes for the site's shared content. Data lives in lib/content.ts.

export type RouteId = "home" | "learn" | "competitive" | "gear" | "community";

export interface SiteRoute {
  id: RouteId;
  path: "/" | "/learn" | "/competitive" | "/gear" | "/community";
  navLabel: string; // "Home" | "Learn" | "Compete" | "Gear" | "Community"
  title: string; // full document <title>
  description: string; // meta description, one sentence
}

export interface VideoStart {
  seconds: number; // 26
  stamp: string; // "0:26"
  watchUrl: string; // the supplied youtube.com/watch URL, unchanged
}

/** One record per YouTube video ID. A video may have more than one start point. */
export interface Video {
  id: string; // YouTube video ID
  channel: string;
  title: string;
  starts: { main: VideoStart; buying?: VideoStart };
}

export type ProductGroupId = "starter" | "string-launcher" | "expansion";

export interface ProductGroup {
  id: ProductGroupId;
  heading: string;
  inTheBox: string; // one plain sentence: what you get
}

export interface Product {
  productId: string; // retailer's ID exactly as in the URL
  retailer: "Walmart" | "Amazon";
  url: string;
  name: string; // exact product name
  group: ProductGroupId;
  includesLauncher: boolean;
  launcher: string; // e.g. "Launcher included", "Left-spin string launcher included", "Launcher sold separately"
  spin?: "Right-spin" | "Left-spin";
  type?: "Attack" | "Defense" | "Stamina" | "Balance";
  reason: string; // practical reason to choose it, one or two sentences
  note?: string; // e.g. the Walmart slug caveat
}

export interface ExternalLink {
  label: string;
  url: string;
  purpose: string;
}

/** The three tops with supplied 3D models, shown in the display bay. */
export type TopId = "dran-sword" | "drake-brave" | "unicorn-delta" | "knight-shield" | "hells-scythe" | "sol-eclipse";

export interface BayTop {
  id: TopId;
  /** Full combo name as printed on the box. */
  name: string;
  /** Product line code. */
  code: string;
  /** Parts, read off the combo name. Values we could not confirm stay as the printed code. */
  parts: { label: string; value: string }[];
  /** Type and spin, only where retailer listings agree. */
  facts: { label: string; value: string }[];
}

/** A question answered with copy that already appears elsewhere on the site. */
export interface FaqItem {
  q: string;
  a: string;
  /** Optional follow-up link: an internal path or a key of `links`. */
  href?: string;
  linkLabel?: string;
  external?: boolean;
}
