import ExtLink from "./ExtLink";
import { BrandMark, WboLogo } from "./Brand";
import Reveal from "@/components/motion/Reveal";
import { links, products, videos } from "@/lib/content";

/*
 * "This site links to": the places the site sends visitors. Each entry is a link to a destination that is
 * already in lib/content.ts. These are not sponsors, partners or backers, and nothing here implies endorsement.
 * Instagram, Discord, YouTube, Walmart and Amazon use simple-icons marks; the WBO entry is the WBO's own logo.
 */
export default function LogoRow() {
  const walmart = products.find((p) => p.retailer === "Walmart");
  const amazon = products.find((p) => p.retailer === "Amazon");
  return (
    <Reveal className="logos" aria-label="Places this site links to" role="group">
      <p className="logos__label">This site links to</p>
      <ExtLink href={links.instagram.url} className="logo-link" context="Club Instagram">
        <BrandMark brand="instagram" /> Instagram
      </ExtLink>
      <ExtLink href={links.dfwBeyblades.url} className="logo-link" context="DFW Beyblades community">
        <BrandMark brand="discord" /> Discord
      </ExtLink>
      <ExtLink href={videos.beginners.starts.main.watchUrl} className="logo-link" context={videos.beginners.title}>
        <BrandMark brand="youtube" /> YouTube
      </ExtLink>
      {walmart && (
        <ExtLink href={walmart.url} className="logo-link" context={walmart.name}>
          <BrandMark brand="walmart" /> Walmart
        </ExtLink>
      )}
      {amazon && (
        <ExtLink href={amazon.url} className="logo-link" context={amazon.name}>
          <BrandMark brand="amazon" /> Amazon
        </ExtLink>
      )}
      <ExtLink href={links.wboRules.url} className="logo-link" context={links.wboRules.label}>
        <WboLogo />
      </ExtLink>
    </Reveal>
  );
}
