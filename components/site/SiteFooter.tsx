import Image from "next/image";
import Link from "next/link";
import ExtLink from "./ExtLink";
import { BrandMark, WboLogo } from "./Brand";
import { WordmarkFooter } from "@/components/ui/ruixen/wordmark-footer";
import { links } from "@/lib/content";
import type { SiteRoute, ExternalLink } from "@/lib/content-types";

/*
 * The bottom of every page: one card with the club's name and three short lists (pages, community,
 * references), the fine print under it, then the big wordmark. Every link here already exists in lib/content.ts.
 */
export default function SiteFooter({
  routes,
  instagram,
  name,
  school,
}: {
  routes: SiteRoute[];
  instagram: ExternalLink;
  name: string;
  school: string;
}) {
  return (
    <footer className="site-footer" data-ground="ink">
      <div className="wrap">
        <div className="site-footer__card">
          <div className="site-footer__top">
            <div className="site-footer__id">
              <Image src="/brand/crest-512.png" alt="" width={56} height={56} />
              <div>
                <p className="site-footer__name">{name}</p>
                <p className="muted">{school}</p>
              </div>
            </div>
            <ExtLink href={instagram.url} className="btn btn--quiet" context={instagram.label}>
              <BrandMark brand="instagram" /> Club Instagram <span aria-hidden="true">↗</span>
            </ExtLink>
          </div>

          <div className="site-footer__cols">
            <nav aria-label="Footer">
              <p className="site-footer__label">[Pages]</p>
              <ul className="site-footer__list">
                {routes.map((r) => (
                  <li key={r.id}>
                    <Link href={r.path}>{r.navLabel}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <p className="site-footer__label">[Community]</p>
              <ul className="site-footer__list">
                <li>
                  <ExtLink href={instagram.url} context={instagram.label}>
                    <BrandMark brand="instagram" /> Instagram
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href={links.dfwBeyblades.url} context="Discord">
                    <BrandMark brand="discord" /> {links.dfwBeyblades.label}
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href={links.beyLounge.url} context="Discord">
                    <BrandMark brand="discord" /> {links.beyLounge.label}
                  </ExtLink>
                </li>
              </ul>
            </div>
            <div>
              <p className="site-footer__label">[References]</p>
              <ul className="site-footer__list">
                <li>
                  <ExtLink href={links.wboRules.url}>
                    <WboLogo alt="" /> {links.wboRules.label}
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href={links.parentGuide.url}>{links.parentGuide.label}</ExtLink>
                </li>
                <li>
                  <ExtLink href={links.noRatchetHelp.url}>{links.noRatchetHelp.label}</ExtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="site-footer__legal">
          <p>This is a student club site. It is not affiliated with the Beyblade brand owners or the WBO.</p>
          <p>
            Interface components from <ExtLink href="https://www.rareui.com/">RareUI</ExtLink> and{" "}
            <ExtLink href="https://ruixen.com/">Ruixen UI</ExtLink>. Factory and space station 3D pieces by{" "}
            <ExtLink href="https://kenney.nl/">Kenney</ExtLink>. All trademarks belong to their owners.
          </p>
        </div>
      </div>
      <WordmarkFooter brandName="Coppell" />
    </footer>
  );
}
