import { Composition, Still } from "remotion";
import "./index.css";
import { Basics, BASICS_FRAMES, Exploded } from "./Basics";
import { Match, MATCH_FRAMES, Summary } from "./Match";

const SIZE = { width: 1280, height: 720 };

export function RemotionRoot() {
  return (
    <>
      <Composition id="basics" component={Basics} durationInFrames={BASICS_FRAMES} fps={30} {...SIZE} />
      <Composition id="match" component={Match} durationInFrames={MATCH_FRAMES} fps={30} {...SIZE} />
      <Still id="basics-poster" component={Exploded} {...SIZE} />
      <Still id="match-poster" component={Summary} {...SIZE} />
    </>
  );
}
