import ExtLink from "@/components/site/ExtLink";
import Arrows from "@/components/site/Arrows";
import { BrandMark } from "@/components/site/Brand";
import SectionHead from "@/components/site/SectionHead";
import Tile from "@/components/site/Tile";
import Reveal from "@/components/motion/Reveal";
import SplitTitle from "@/components/motion/SplitTitle";
import SceneWord from "@/components/motion/SceneWord";
import CrestRing from "@/components/motion/CrestRing";
import CopyLink from "@/components/site/CopyLink";
import FluidOrb from "@/components/ui/fluid-orb";
import { BadgeMorph } from "@/components/ui/ruixen/badge-morph";
import Clip from "@/components/site/Clip";
import ScrambleText from "@/components/ui/ruixen/scramble-text";
import { links, meeting } from "@/lib/content";
import { routeMeta } from "../meta";

export const metadata = routeMeta("community");

const discords = [links.beyLounge, links.dfwBeyblades];

export default function Community() {
  return (
    <>
      <section className="section section--hero hero hero-glow has-word" aria-labelledby="comm-h">
        <SceneWord place="bottom-left">DFW</SceneWord>
        <div className="wrap">
          <Reveal as="p" variant="deal" className="badge">
            Community
          </Reveal>
          <SplitTitle id="comm-h" className="h-hero" text="Where the players are" />
          <Reveal as="p" variant="deal" delay={400} className="lede">
            Club updates go up on Instagram first. Questions about joining, the date of the next meeting or who is
            eligible go to the same place: message the club account.
          </Reveal>
          <div className="community-hero__crest" aria-hidden="true" style={{ marginTop: "var(--space-6)" }}>
            {/* RareUI Fluid Orb in the crest red, behind the crest. Decorative; pauses offscreen; one still frame under reduced motion. */}
            <div className="orb-slot">
              <FluidOrb size={320} color="#e8121a" base="#1a0305" style={{ width: "100%", height: "100%" }} />
            </div>
            <CrestRing variant="radar" />
          </div>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="meet-h">
        <div className="wrap">
          <SectionHead
            id="meet-h"
            lead={<p>{meeting.line} The date of the next meeting is not posted here, so ask on Instagram before your first visit.</p>}
          >
            Meetings
          </SectionHead>
          <Reveal>
            <Tile className="meet">
              <div className="meet__grid">
                <Clip name="meet" label="Video, no sound: the club meets every two weeks, on Tuesdays of A weeks, from 4:20 to 5:20, in room C112" />
                <dl className="meet__facts">
                  <div>
                    <dt>How often</dt>
                    <dd>{meeting.cadence}</dd>
                  </div>
                  <div>
                    <dt>Day</dt>
                    <dd>{meeting.day}</dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>{meeting.time}</dd>
                  </div>
                  <div>
                    <dt>Room</dt>
                    <dd>
                      {/* Ruixen Scramble Text: the room number decodes on hover. */}
                      <ScrambleText as="span">{meeting.room}</ScrambleText>
                      <small>{meeting.roomNote}</small>
                    </dd>
                  </div>
                </dl>
              </div>
            </Tile>
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="ig-h">
        <div className="wrap">
          <Reveal>
            <Tile glow className="ig-big">
              <BrandMark brand="instagram" />
              <h2 id="ig-h" className="h-lg">
                {links.instagram.label}
              </h2>
              <div className="actions">
                <ExtLink href={links.instagram.url} className="btn btn--xl" context="Club Instagram">
                  Club Instagram <Arrows />
                </ExtLink>
                <CopyLink url={links.instagram.url} name="Club Instagram" />
              </div>
            </Tile>
          </Reveal>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="discord-h">
        <div className="wrap">
          <SectionHead
            id="discord-h"
            lead={
              <p>These are external communities. The club does not run them, so their rules and moderators are their own.</p>
            }
          >
            Beyond the club: two Discord communities
          </SectionHead>
          <ul className="bento bento--2">
            {discords.map((d, i) => (
              <Reveal as="li" key={d.url} variant={i % 2 ? "right" : "left"} index={i}>
                <Tile
                  className="disc"
                  eyebrow={<BadgeMorph status="idle" label="External community" />}
                  title={d.label}
                  foot={
                    <>
                      <ExtLink href={d.url} className="btn" context={`${d.label} Discord`}>
                        <BrandMark brand="discord" /> Join {d.label} on Discord <Arrows />
                      </ExtLink>
                      <CopyLink url={d.url} name={`${d.label} Discord invite`} />
                    </>
                  }
                >
                  <p className="row__purpose">{d.purpose.charAt(0).toUpperCase() + d.purpose.slice(1)}</p>
                </Tile>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
