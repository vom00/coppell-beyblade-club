import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/lib/content";
import Arrows from "@/components/site/Arrows";
import Tile from "@/components/site/Tile";
import GravityLetters from "@/components/ui/gravity-letters";

export const metadata: Metadata = { title: "Page not found · Coppell Beyblade Club" };

export default function NotFound() {
  return (
    <section className="section section--hero hero hero-glow" aria-labelledby="nf-h">
      <div className="wrap">
        <p className="badge">404</p>
        <h1 id="nf-h" className="h-hero">
          That page left the stadium
        </h1>
        <p className="lede">The page you asked for is not here. Try one of these five.</p>
        <ul className="actions">
          {routes.map((r) => (
            <li key={r.id}>
              <Link href={r.path} className="btn btn--quiet">
                {r.navLabel} <Arrows />
              </Link>
            </li>
          ))}
        </ul>
        <div style={{ width: "100%", marginTop: "var(--space-7)" }}>
          <Tile>
            <GravityLetters className="gl-field" items={["4", "0", "4"]} size={64} color="#e8121a" maxGlyphs={30}>
              <p className="gl-field__hint hint" aria-hidden="true">
                [Tap or hold to drop letters]
              </p>
            </GravityLetters>
          </Tile>
        </div>
      </div>
    </section>
  );
}
