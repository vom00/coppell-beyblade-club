// The supplied models. No three.js here, so any component can list them without pulling the engine
// into the initial bundle. Load a top with `loadTop(id)` from ./assets (engine chunk only).

export type TopId = "dran-sword" | "drake-brave" | "unicorn-delta" | "knight-shield" | "hells-scythe" | "sol-eclipse";

export interface TopInfo {
  id: TopId;
  url: string;
}

export const TOPS: readonly TopInfo[] = [
  { id: "dran-sword", url: "/models/dran-sword.glb" },
  { id: "drake-brave", url: "/models/drake-brave.glb" },
  { id: "unicorn-delta", url: "/models/unicorn-delta.glb" },
  { id: "knight-shield", url: "/models/knight-shield.glb" },
  { id: "hells-scythe", url: "/models/hells-scythe.glb" },
  { id: "sol-eclipse", url: "/models/sol-eclipse.glb" },
];

export const STADIUM_URL = "/models/stadium.glb";

/** Kenney kit pieces, one GLB per scene (built by scripts/build-kenney.mjs). */
export const FACTORY_KIT_URL = "/models/kenney/factory/factory-line.glb";
export const SPACE_KIT_URL = "/models/kenney/space/display-bay.glb";
