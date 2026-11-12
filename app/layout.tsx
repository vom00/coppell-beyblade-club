import type { ReactNode } from "react";
import type { Metadata } from "next";
import { display, body, label } from "./fonts";
import "./tokens.css";
import "./globals.css";
import "@/components/motion/motion.css";
import "./scenes.css";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import MotionRoot from "@/components/motion/MotionRoot";
import { Toaster } from "@/components/ui/toast";
import RailRider from "@/components/motion/RailRider";
import { links, routes, site } from "@/lib/content";
import { routeMeta } from "./meta";

export const metadata: Metadata = routeMeta("home");

// Hidden-until-revealed styles only apply under html.js, so the site reads with JavaScript off.
// If the page has not hydrated after 5 seconds, the class is taken away again and everything shows.
const JS_FLAG = `(function(){var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.hasAttribute('data-ready'))d.classList.remove('js')},5000)})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  const nav = routes.filter((r) => r.id !== "home").map((r) => ({ path: r.path, label: r.navLabel }));
  return (
    <html lang="en" className={`dark ${display.variable} ${body.variable} ${label.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SiteHeader items={nav} instagramUrl={links.instagram.url} name={site.name} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter routes={routes} instagram={links.instagram} name={site.name} school={site.school} />
        <RailRider />
        <Toaster position="bottom-center" />
        <MotionRoot />
      </body>
    </html>
  );
}
