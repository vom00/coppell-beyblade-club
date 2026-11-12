import Image from "next/image";
import Link from "next/link";
import RailSequence from "@/components/scene/RailSequence";
import DisplayBay from "@/components/scene/DisplayBay";
import ExtLink from "@/components/site/ExtLink";
import Arrows from "@/components/site/Arrows";
import { BrandMark } from "@/components/site/Brand";
import SectionHead from "@/components/site/SectionHead";
import Tile from "@/components/site/Tile";
import Clip from "@/components/site/Clip";
import LogoRow from "@/components/site/LogoRow";
import Reveal from "@/components/motion/Reveal";
import SplitTitle from "@/components/motion/SplitTitle";
import Tilt from "@/components/motion/Tilt";
import SceneWord from "@/components/motion/SceneWord";
import CrestRing from "@/components/motion/CrestRing";
import PointCounter from "@/components/motion/PointCounter";
import { TopImage } from "@/components/site/TopImage";
import type { TopId } from "@/lib/content-types";
import { RisingGlow } from "@/components/ui/ruixen/rising-glow";
import FaqSection from "@/components/site/FaqSection";
import { bayTops, faq, links, site } from "@/lib/content";
import { routeMeta } from "./meta";

export const metadata = routeMeta("home");

const competeLinks = [
  { href: "/competitive#score-h", label: "Scoring and deck building", line: "How the four finishes score, and why a deck covers more than one matchup." },
  { href: "/gear", label: "Club gear picks", line: "Six picks, grouped by what is in the box." },
  { href: "/community", label: "DFW community", line: "Instagram for Coppell, Discord for the wider region." },
];

// Same four finishes and points as the scoresheet on Compete.
const finishes = [
  { name: "Spin Finish", pts: 1, top: "knight-shield" },
  { name: "Over Finish", pts: 2, top: "dran-sword" },
  { name: "Burst Finish", pts: 2, top: "unicorn-delta" },
  { name: "Xtreme Finish", pts: 3, top: "drake-brave" },
] satisfies { name: string; pts: number; top: TopId }[];

export default function Home() {
  return (
    <>
      <RailSequence
        intro={
          <div className="hero hero-copy">
            <Image className="hero-crest" src="/brand/crest-512.png" alt="" width={64} height={64} priority />
            <p className="badge" style={{ marginTop: "var(--space-4)" }}>
              Beyblade X club
            </p>
            <SplitTitle text={site.name} className="h-hero" />
            <p className="lede">
              A Beyblade X club at {site.school}. New launchers are welcome: start with how the game works, or ask the
              club a question on Instagram.
            </p>
            <div className="actions">
              <Link href="/learn" className="btn">
                Learn Beyblade X <Arrows />
              </Link>
              <ExtLink href={links.instagram.url} className="btn btn--quiet" context="Club Instagram">
                <BrandMark brand="instagram" /> Club Instagram
              </ExtLink>
            </div>
          </div>
        }
        outro={
          <ul className="outro">
            <li>
              <Link href="/learn" className="link">
                Learn <Arrows />
              </Link>
              <p>How a top, a launcher and a stadium fit together.</p>
            </li>
            <li>
              <Link href="/competitive" className="link">
                Compete <Arrows />
              </Link>
              <p>Scoring, deck coverage and where the winning combos are.</p>
            </li>
          </ul>
        }
      />

      <section className="section" aria-labelledby="bay-h">
        <div className="wrap">
          <SectionHead id="bay-h" count={bayTops.length}>
            In the display bay
          </SectionHead>
          <Reveal>
            <DisplayBay tops={bayTops} />
          </Reveal>
        </div>
      </section>

      <section className="section has-word" aria-labelledby="lanes-h">
        <SceneWord place="top-right">Xtreme Dash</SceneWord>
        <div className="wrap">
          <SectionHead id="lanes-h" count="2">
            Two ways in
          </SectionHead>
          <div className="bento bento--lanes">
            <Reveal variant="left" className="lane-slot">
              <Tilt>
                <Tile
                  className="lane"
                  eyebrow={<span className="chip chip--brand">New here</span>}
                  title="Start with the basics"
                  href="/learn"
                  cta="Read the beginner guide"
                >
                  <Clip name="basics" label="Video, no sound: how the blade, ratchet and bit of a top fit together" />
                  <p>
                    What Beyblade X is, the three parts of a top, and what two players need on the table for a first
                    battle.
                  </p>
                </Tile>
              </Tilt>
            </Reveal>

            <Reveal variant="right" className="lane-slot" delay={120}>
              <Tilt>
                <Tile
                  className="lane"
                  eyebrow={<span className="chip chip--quiet">Here to compete</span>}
                  title="Go straight to the match"
                >
                  <Clip name="match" label="Video, no sound: the four ways a round ends and what each one scores" />
                  <ul className="rowlinks rowlinks--stack">
                    {competeLinks.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="link">
                          {l.label} <Arrows />
                        </Link>
                        <p>{l.line}</p>
                      </li>
                    ))}
                  </ul>
                </Tile>
              </Tilt>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="fin-h">
        <div className="wrap">
          <SectionHead id="fin-h" count={finishes.length}>
            The four finishes
          </SectionHead>
          <ul className="bento bento--4">
            {finishes.map((f, i) => (
              <Reveal as="li" key={f.name} variant="deal" index={i}>
                <Tile
                  className="fin"
                  media={
                    <>
                      <TopImage top={f.top} />
                      <PointCounter
                        className="fin__pts"
                        value={f.pts}
                        label={`${f.pts} ${f.pts === 1 ? "point" : "points"}`}
                      />
                    </>
                  }
                  href="/competitive"
                  cta={f.name}
                />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tight" aria-label="Places this site links to">
        <div className="wrap">
          <LogoRow />
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="faq-h">
        <div className="wrap">
          <SectionHead id="faq-h" count={faq.length}>
            Questions
          </SectionHead>
          <Reveal>
            <FaqSection items={faq} />
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="ig-h">
        <div className="wrap">
          <Reveal>
            <Tile glow className="ig-tile">
              <div className="glow-slot" aria-hidden="true">
                <RisingGlow height={112} particleCount={14} particleColor="#e8121a" />
              </div>
              <div className="ig-tile__grid">
                <div>
                  <h2 id="ig-h" className="h-lg">
                    Questions about joining or the next meeting? Ask the club.
                  </h2>
                  <ExtLink href={links.instagram.url} className="btn btn--xl" context="Club Instagram">
                    <BrandMark brand="instagram" /> Club Instagram
                  </ExtLink>
                </div>
                <div className="ig-tile__crest" aria-hidden="true">
                  <CrestRing variant="arc" />
                </div>
              </div>
            </Tile>
          </Reveal>
        </div>
      </section>
    </>
  );
}
