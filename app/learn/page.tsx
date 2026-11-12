import Link from "next/link";
import PartsExplode, { type PartCopy } from "@/components/scene/PartsExplode";
import PartsConveyor from "@/components/scene/PartsConveyor";
import RailCatchStill from "@/components/scene/RailCatchStill";
import VideoPlayer from "@/components/site/VideoPlayer";
import SectionHead from "@/components/site/SectionHead";
import Tile from "@/components/site/Tile";
import Reveal from "@/components/motion/Reveal";
import SplitTitle from "@/components/motion/SplitTitle";
import Tilt from "@/components/motion/Tilt";
import TypeReveal from "@/components/motion/TypeReveal";
import PageToc from "@/components/site/PageToc";
import SceneWord from "@/components/motion/SceneWord";
import RailCatchLoop from "@/components/motion/RailCatchLoop";
import { TypeDiagram, type TypeKind } from "@/components/motion/Diagrams";
import { TaskList } from "@/components/ui/task-list";
import { links, videos } from "@/lib/content";
import { routeMeta } from "../meta";

export const metadata = routeMeta("learn");

const parts: PartCopy[] = [
  { id: "blade", name: "Blade", summary: "The upper contact surface. It is the part that hits the opposing top." },
  { id: "ratchet", name: "Ratchet", summary: "Connects the assembly together and affects the top's height." },
  { id: "bit", name: "Bit", summary: "The tip. It influences how the top moves and engages the stadium rail." },
];

const types: { name: string; kind: TypeKind; text: string }[] = [
  {
    name: "Attack",
    kind: "attack",
    text: "Hits hard and hunts for a knockout. It burns through its spin quickly, so a match that drags on favors the other top.",
  },
  {
    name: "Defense",
    kind: "defense",
    text: "Takes hits and holds its ground. It is better at surviving a clash than at ending one.",
  },
  {
    name: "Stamina",
    kind: "stamina",
    text: "Keeps spinning the longest. One clean knockout early can end it before the long game starts.",
  },
  {
    name: "Balance",
    kind: "balance",
    text: "Blends the other three. It rarely beats a specialist at the specialist's own job.",
  },
];

// In-page contents: the section headings below, by id.
const toc = [
  { id: "parts-h", label: "One top, three parts" },
  { id: "conv-h", label: "Pick a part" },
  { id: "rail-h", label: "How the rail catch works" },
  { id: "types-h", label: "Four types, four trade-offs" },
  { id: "first-h", label: "What you need for a first battle" },
  { id: "refs-h", label: "Official references" },
  { id: "next-h", label: "Next steps" },
];

const checklist = [
  { id: "top", label: "A top for each player." },
  { id: "launcher", label: "A compatible launcher for each player." },
  { id: "stadium", label: "One Beyblade X stadium between you." },
];

export default function Learn() {
  const v = videos.beginners;
  return (
    <>
      <PageToc items={toc} />
      <section className="section section--hero hero hero-glow" aria-labelledby="learn-h">
        <div className="wrap">
          <Reveal as="p" variant="deal" className="badge">
            Learn
          </Reveal>
          <SplitTitle id="learn-h" className="h-hero" text="What is Beyblade X?" />
          <Reveal variant="deal" delay={400} className="lede">
            <p>
              Two players each launch a customizable spinning top into a stadium and let the tops fight. This is the
              fourth generation of Beyblade. In it, a gear on the bit can catch the stadium rail and accelerate the top
              into an Xtreme Dash.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="parts-h">
        <div className="wrap">
          <SectionHead
            id="parts-h"
            count={parts.length}
            lead={<p>Every top is built from parts you can swap. This is the classic layout, pulled apart.</p>}
          >
            One top, three parts
          </SectionHead>
        </div>
      </section>

      <PartsExplode parts={parts} />

      <section className="section section--tight" aria-label="A note on integrated parts">
        <div className="wrap">
          <Reveal variant="left">
            <Tile className="note-tile">
              <span className="chip chip--brand">Note</span>
              <p>
                Not every release follows this layout. Some integrate parts: Nether Incendio Z, for example, integrates
                the ratchet into its blade. The build illustrated here is the classic three-part layout.
              </p>
            </Tile>
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="conv-h">
        <div className="wrap">
          <SectionHead id="conv-h" count={parts.length}>
            Pick a part
          </SectionHead>
          <Reveal>
            <PartsConveyor parts={parts} />
          </Reveal>
        </div>
      </section>

      <section className="section has-word" aria-labelledby="rail-h">
        <SceneWord place="bottom-left">Xtreme Dash</SceneWord>
        <div className="wrap split">
          <Reveal variant="left" className="reveal-fill">
            <Tile eyebrow={<span className="chip chip--quiet">Rail catch</span>}>
              <h2 id="rail-h" className="h-lg">
                How the rail catch works
              </h2>
              <p>
                The stadium has a toothed rail running around its edge. The bit carries a small gear. When that gear
                meets the rail, it grips the teeth and the rail drives the top forward in a burst of speed. That is an
                Xtreme Dash.
              </p>
              <p>
                It is why the bit matters as much as the blade in this generation: the tip decides where the top travels,
                and the gear decides whether it catches the rail on the way.
              </p>
            </Tile>
          </Reveal>
          <Reveal variant="right" className="reveal-fill">
            <Tile
              tone="light"
              className="still"
              media={
                <>
                  <RailCatchLoop className="only-motion" />
                  <RailCatchStill className="only-still" />
                </>
              }
            />
          </Reveal>
        </div>
      </section>

      <section className="section section--flush has-word" aria-labelledby="types-h">
        <SceneWord place="top-right">Stamina</SceneWord>
        <div className="wrap">
          <SectionHead id="types-h" count={types.length}>
            Four types, four trade-offs
          </SectionHead>
          <div className="bento bento--4">
            {types.map((t, i) => (
              <Reveal key={t.name} variant="deal" index={i}>
                <Tilt>
                  <Tile className="type" tone="light" media={
                      <TypeReveal kind={t.kind}>
                        <TypeDiagram kind={t.kind} />
                      </TypeReveal>
                    } title={t.name} index={`0${i + 1}`}>
                    <p>{t.text}</p>
                  </Tile>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="first-h">
        <div className="wrap split">
          <Reveal variant="left" className="reveal-fill">
            <Tile>
              <h2 id="first-h" className="h-lg">
                What you need for a first battle
              </h2>
              <p>Two players, and three things on the table:</p>
              <div className="tasks">
                <TaskList defaultTasks={checklist} size="md" aria-label="First battle checklist" />
              </div>
              <p className="hint">Tap an item to tick it off</p>
              <p>
                Starter packs put a top and a launcher in one box.{" "}
                <Link href="/gear" className="textlink">
                  The club&rsquo;s gear picks
                </Link>{" "}
                start there.
              </p>
            </Tile>
          </Reveal>

          <Reveal variant="right" className="reveal-fill">
            <Tile>
              <h2 className="h-md">Watch the basics</h2>
              <VideoPlayer video={v} offer={["main"]} />
              <p className="video-note">
                {v.channel} walks through the basics for new players. This link starts at {v.starts.main.stamp}, where
                the basics begin. Video by {v.channel}.
              </p>
            </Tile>
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="refs-h">
        <div className="wrap">
          <SectionHead id="refs-h" count="2">
            Official references
          </SectionHead>
          <ul className="bento bento--2">
            {[links.parentGuide, links.noRatchetHelp].map((l, i) => (
              <Reveal as="li" key={l.url} variant="deal" index={i}>
                <Tile href={l.url} cta={l.label} external>
                  <p>{l.purpose}</p>
                </Tile>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="next-h">
        <div className="wrap">
          <SectionHead id="next-h" count="2">
            Next steps
          </SectionHead>
          <div className="bento bento--2">
            <Reveal variant="left">
              <Tilt>
                <Tile title="Compete" href="/competitive" cta="Go to Compete">
                  <p>Learn how the four finishes score and how a deck covers different matchups.</p>
                </Tile>
              </Tilt>
            </Reveal>
            <Reveal variant="right">
              <Tilt>
                <Tile title="Gear" href="/gear" cta="Go to Gear">
                  <p>See the six picks the club recommends, and what is in each box.</p>
                </Tile>
              </Tilt>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
