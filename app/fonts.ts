import localFont from "next/font/local";
import { Geist_Mono, Inter } from "next/font/google";

// The same three faces rareui.com uses.

// Headings: Open Runde (SIL OFL, github.com/lauridskern/open-runde). Exposed as --font-display.
export const display = localFont({
  src: [
    { path: "./fonts/OpenRunde-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/OpenRunde-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/OpenRunde-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/OpenRunde-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

// Body: Inter. Exposed as --font-body.
export const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Labels, hints and counts: Geist Mono. Exposed as --font-mono.
export const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
