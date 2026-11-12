import ExtLink from "@/components/site/ExtLink";
import Arrows from "@/components/site/Arrows";
import { WboLogo } from "@/components/site/Brand";
import VideoPlayer from "@/components/site/VideoPlayer";
import SectionHead from "@/components/site/SectionHead";
import Tile from "@/components/site/Tile";
import Reveal from "@/components/motion/Reveal";
import SplitTitle from "@/components/motion/SplitTitle";
import Tilt from "@/components/motion/Tilt";
import PageToc from "@/components/site/PageToc";
import SceneWord from "@/components/motion/SceneWord";
import Tally from "@/components/motion/Tally";
import PointCounter from "@/components/motion/PointCounter";
import DrillPlayer from "@/components/motion/DrillPlayer";
import { FinishDiagram, type FinishKind } from "@/components/motion/Diagrams";
import { TopImage } from "@/components/site/TopImage";
import PracticeSheet from "@/components/site/PracticeSheet";
import { links, videos } from "@/lib/content";
import { routeMeta } from "../meta";

export const metadata = routeMeta("competitive");

const finishes: { pts: number; name: string; text: string; kind: FinishKind }[] = [
  { pts: 1, kind: "spin", name: "Spin / Survivor Finish", text: "Your top outspins the opponent's." },
  { pts: 2, kind: "over", name: "Over / Knockout Finish", text: "You send the opposing top into a knockout pocket." },
  { pts: 2, kind: "burst", name: "Burst Finish", text: "The opposing top comes apart." },
  { pts: 3, kind: "xtreme", name: "Xtreme Finish", text: "You send the opposing top into the Xtreme Zone." },
];

const rounds = [1, 2, 3, 4];

const drillSteps = [
  "Pick one combo and do not change it.",
  "Launch it a few times, changing only the launch angle each round.",
  "Write down what the top did, then compare the rounds.",
];

// In-page contents: the section headings below, by id.
const toc = [
  { id: "combos-h", label: "Looking for a combo to build?" },
  { id: "score-h", label: "The scoresheet" },
  { id: "deck-h", label: "Deck coverage" },
  { id: "drill-h", label: "Practice drill: change only the angle" },
  { id: "vid-h", label: "Watch the full guide" },
  { id: "cn-h", label: "Next" },
];

export default function Compete() {
  const v = videos.competitive;
  return (
    <>
      <PageToc items={toc} />
      <section className="section section--hero hero hero-glow has-word" aria-labelledby="comp-h">
        <SceneWord place="bottom-right">Xtreme Finish</SceneWord>
        <div className="wrap">
          <Reveal as="p" variant="deal" className="badge">
            Compete
          </Reveal>
          <SplitTitle id="comp-h" className="h-hero" text="Score the match" />
          <Reveal as="p" variant="deal" delay={400} className="lede">
            Every launch is trying to end the round in one of four ways. Know what each one is worth and you know what
            the other player is aiming for.
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="combos-h">
        <div className="wrap">
          <Reveal>
            <Tile glow className="combo-tile">
              <span className="speedlines" data-loop aria-hidden="true" />
              <div>
                <WboLogo className="wbo-logo--lg" />
                <h2 id="combos-h" className="h-lg" style={{ marginTop: "var(--space-3)" }}>
                  Looking for a combo to build?
                </h2>
                <p>
                  Current results and rankings live with the WBO. The club does not copy them here, so what you see is
                  always current.
                </p>
              </div>
              <ExtLink href={links.wboWinningCombos.url} className="btn btn--xl" context="World Beyblade Organization">
                Browse WBO winning combos <Arrows />
              </ExtLink>
            </Tile>
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="score-h">
        <div className="wrap">
          <SectionHead id="score-h" count={finishes.length}>
            The scoresheet
          </SectionHead>
          <Reveal>
            <Tile tone="light">
              <ol className="sheet">
                {finishes.map((f) => (
                  <Reveal as="li" key={f.name} variant="deal" index={0} className="sheet__row">
                    <Reveal as="span" variant="stamp" delay={300} className="sheet__pts">
                      <PointCounter value={f.pts} label={`${f.pts} ${f.pts === 1 ? "point" : "points"}`} />
                    </Reveal>
                    <h3 className="sheet__name">{f.name}</h3>
                    <p className="sheet__text">{f.text}</p>
                    <div className="sheet__dg">
                      <FinishDiagram kind={f.kind} />
                    </div>
                  </Reveal>
                ))}
                <li className="sheet__total">
                  <span className="sheet__pts" aria-hidden="true">
                    4
                  </span>
                  <div>
                    <p>
                      <strong>First to 4 points</strong> is the standard match in the brand guide. Check your event
                      organizer&rsquo;s rules for deck restrictions, format and the score target.
                    </p>
                    <Tally />
                  </div>
                </li>
              </ol>
              <p className="sheet__rules">
                For the full ruleset, read the{" "}
                <ExtLink href={links.wboRules.url} className="textlink">
                  WBO X rules
                </ExtLink>
                .
              </p>
            </Tile>
          </Reveal>
        </div>
      </section>

      <section className="section section--flush has-word" aria-labelledby="deck-h">
        <SceneWord place="top-left">Defense</SceneWord>
        <div className="wrap">
          <SectionHead
            id="deck-h"
            count="2"
            lead={
              <p>
                A deck is the set of tops you can bring to a match. Coverage means that whatever the other player
                sends, one of your tops has a reasonable answer.
              </p>
            }
          >
            Deck coverage
          </SectionHead>
          <div className="bento bento--2 deck">
            <Reveal variant="left">
              <Tilt>
                <Tile
                  eyebrow={<TopImage top="sol-eclipse" className="deck__pic" />}
                  title="A stamina build"
                >
                  <p>Can pursue a long matchup, staying in the stadium and waiting for the other top to run out of spin.</p>
                </Tile>
              </Tilt>
            </Reveal>
            <Reveal variant="right">
              <Tilt>
                <Tile eyebrow={<TopImage top="hells-scythe" className="deck__pic" />} title="An attack build">
                  <p>Can seek a quick knockout before the round has time to turn into a spin-off.</p>
                </Tile>
              </Tilt>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="drill-h">
        <div className="wrap split">
          <Reveal variant="left" className="reveal-fill">
            <Tile>
              <h2 id="drill-h" className="h-lg">
                Practice drill: change only the angle
              </h2>
              <DrillPlayer steps={drillSteps} />
              <p>The drill teaches you how one combo moves before you blame the combo.</p>
            </Tile>
          </Reveal>

          <Reveal variant="right" className="reveal-fill">
            <Tile>
              <PracticeSheet rounds={rounds.length} />
            </Tile>
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="vid-h">
        <div className="wrap split">
          <Reveal variant="left" className="reveal-fill">
            <Tile>
              <h2 id="vid-h" className="h-lg">
                Watch the full guide
              </h2>
              <p>
                {v.channel}&rsquo;s competitive guide is a longer look at how players think about the game. Its main
                section starts at {v.starts.main.stamp}. Video by {v.channel}; the views are the creator&rsquo;s.
              </p>
            </Tile>
          </Reveal>
          <Reveal variant="right" className="reveal-fill">
            <Tile>
              <VideoPlayer video={v} offer={["main"]} />
            </Tile>
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="cn-h">
        <div className="wrap">
          <SectionHead id="cn-h" count="2" as="h2">
            Next
          </SectionHead>
          <div className="bento bento--2">
            <Reveal variant="deal" index={0}>
              <Tile href="/gear" cta="Club gear picks" />
            </Reveal>
            <Reveal variant="deal" index={1}>
              <Tile href="/community" cta="Find local players" />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
