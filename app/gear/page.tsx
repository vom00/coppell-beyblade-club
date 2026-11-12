import Image from "next/image";
import VideoPlayer from "@/components/site/VideoPlayer";
import ExtLink from "@/components/site/ExtLink";
import Arrows from "@/components/site/Arrows";
import { RetailerMark } from "@/components/site/Brand";
import SectionHead from "@/components/site/SectionHead";
import Tile from "@/components/site/Tile";
import Reveal from "@/components/motion/Reveal";
import SplitTitle from "@/components/motion/SplitTitle";
import Tilt from "@/components/motion/Tilt";
import SceneWord from "@/components/motion/SceneWord";
import Chooser from "@/components/motion/Chooser";
import { productGroups, products, videos } from "@/lib/content";
import { routeMeta } from "../meta";

export const metadata = routeMeta("gear");

export default function Gear() {
  const v = videos.competitive;
  return (
    <>
      <section className="section section--hero hero hero-glow has-word" aria-labelledby="gear-h">
        <SceneWord place="bottom-right">Ratchet</SceneWord>
        <div className="wrap">
          <Reveal as="p" variant="deal" className="badge">
            Gear
          </Reveal>
          <SplitTitle id="gear-h" className="h-hero" text="The club’s six picks" />
          <Reveal as="p" variant="deal" delay={400} className="lede">
            Where to start depends on what is in the box. Pick the kind of box first, then the top. Live price and
            availability are the retailer&rsquo;s to show, so check the retailer&rsquo;s page for both.
          </Reveal>
          <Reveal as="p" variant="left" delay={520} className="hero-note">
            <strong>You will also need a compatible stadium.</strong> Two players battle in one Beyblade X stadium, and
            none of the picks below is a stadium.
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="box-h">
        <div className="wrap">
          <SectionHead id="box-h" count={productGroups.length}>
            What is in the box?
          </SectionHead>
          <Chooser
            groups={productGroups.map((g) => ({
              id: g.id,
              heading: g.heading,
              inTheBox: g.inTheBox,
              items: products
                .filter((p) => p.group === g.id)
                .map((p) => ({ name: p.name, retailer: p.retailer, launcher: p.launcher })),
            }))}
          />
        </div>
      </section>

      {productGroups.map((g) => {
        const items = products.filter((p) => p.group === g.id);
        return (
          <section key={g.id} id={g.id} className="section section--flush" aria-labelledby={`${g.id}-h`}>
            <div className="wrap">
              <SectionHead id={`${g.id}-h`} count={items.length} lead={<p>{g.inTheBox}</p>}>
                {g.heading}
              </SectionHead>
              <ul className="bento bento--3 shelf">
                {items.map((p, i) => (
                  <li key={p.productId} className="tag-slot">
                    <Reveal variant="tag" index={i}>
                      <Tilt>
                        <Tile
                          className="product"
                          eyebrow={
                            <span className="product__top">
                              <Image
                                className="top-img product__pic"
                                src={`/products/${p.productId}.webp`}
                                alt={p.name}
                                width={80}
                                height={80}
                              />
                              <span className="chips">
                                <span className={`chip ${p.includesLauncher ? "chip--brand" : "chip--quiet"}`}>{p.launcher}</span>
                                <span className="chip chip--logo"><RetailerMark retailer={p.retailer} /> {p.retailer}</span>
                              </span>
                            </span>
                          }
                          title={p.name}
                          foot={
                            <ExtLink href={p.url} className="btn" context={p.name}>
                              <RetailerMark retailer={p.retailer} /> {p.retailer === "Amazon" ? "View on Amazon" : "View at Walmart"} <Arrows />
                            </ExtLink>
                          }
                        >
                          {(p.spin || p.type) && <p className="product__spec">{[p.spin, p.type].filter(Boolean).join(" · ")}</p>}
                          <p>{p.reason}</p>
                          {p.note && <p className="product__note">{p.note}</p>}
                        </Tile>
                      </Tilt>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section className="section" aria-labelledby="advice-h">
        <div className="wrap split">
          <Reveal variant="left" className="reveal-fill">
            <Tile>
              <h2 id="advice-h" className="h-lg">
                A second opinion on buying
              </h2>
              <p>
                {v.channel}&rsquo;s competitive guide has a section on what to buy. Start from the top at{" "}
                {v.starts.main.stamp}, or jump straight to the buying chapter.
              </p>
              <p>
                {v.channel}&rsquo;s recommendations are {v.channel}&rsquo;s own. The six picks on this page are the
                club&rsquo;s, so the two lists may differ.
              </p>
            </Tile>
          </Reveal>
          <Reveal variant="right" className="reveal-fill">
            <Tile>
              <VideoPlayer video={v} offer={["main", "buying"]} />
            </Tile>
          </Reveal>
        </div>
      </section>
    </>
  );
}
