// Colours, the stadium's look, and small generated textures. The tops keep the materials and
// stickers they were authored with; only the stadium is recoloured, to the black basin and the
// green Xtreme line of the real kit.
import * as THREE from "three";
import type { StadiumModel, StadiumSurface } from "./assets";

function token(name: string, fallback: string) {
  const v = typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : "";
  return new THREE.Color(v || fallback);
}

export function palette() {
  return {
    ink: token("--ink", "#0c0a0a"),
    ink2: token("--ink-2", "#171313"),
    ink3: token("--ink-3", "#2a2323"),
    paper: token("--paper", "#f6f1e9"),
    red: token("--red", "#e8121a"),
    xtreme: token("--xtreme", "#6dff3a"),
    /** the inner panel the kit scenes sit in */
    panel: token("--card-2", "#141414"),
  };
}
export type Palette = ReturnType<typeof palette>;

/* ---------- generated textures ---------- */

/** Soft round sprite for glows and sparks. */
export function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.22, "rgba(255,255,255,0.75)");
  grd.addColorStop(0.55, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(0,0,0,0.85)");
  grd.addColorStop(0.45, "rgba(0,0,0,0.45)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ---------- the stadium ---------- */

/**
 * Recolour the supplied stadium: glossy black basin and walls, a dark printed ring, black pockets
 * with white marks, and the Xtreme line as a deep green rail whose teeth are warm white at rest and
 * turn green where `railAmount` (one texel per lighting bin, red channel) says the rail is lit.
 */
export function dressStadium(model: StadiumModel, pal: Palette, railAmount: THREE.Texture) {
  const mats: Record<Exclude<StadiumSurface, "rail">, THREE.Material> = {
    basin: new THREE.MeshPhysicalMaterial({
      color: "#0f0c0c", roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.32,
    }),
    print: new THREE.MeshStandardMaterial({ color: pal.ink3, roughness: 0.55, envMapIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -1 }),
    pocket: new THREE.MeshStandardMaterial({ color: "#050404", roughness: 0.8, envMapIntensity: 0.2 }),
    marks: new THREE.MeshStandardMaterial({ color: pal.paper, roughness: 0.6, emissive: pal.paper, emissiveIntensity: 0.12, polygonOffset: true, polygonOffsetFactor: -2 }),
    // the slopes face the key light almost head-on; keep them matte so they stay black, not silver
    wall: new THREE.MeshStandardMaterial({ color: "#0b0909", roughness: 0.82, metalness: 0, envMapIntensity: 0.08, side: THREE.DoubleSide }),
    rim: new THREE.MeshPhysicalMaterial({
      color: "#121010", roughness: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 0.3, side: THREE.DoubleSide,
    }),
  };
  for (const [name, list] of Object.entries(model.surfaces) as [StadiumSurface, THREE.Mesh[]][]) {
    const mat = name === "rail" ? railMaterial(pal, railAmount) : mats[name];
    for (const m of list) {
      (m.material as THREE.Material).dispose();
      m.material = mat;
      // The floor is a low-poly cone a few degrees off flat; its averaged normals fan out into a
      // star in the gloss. Face the near-flat parts straight up so the floor reads as one surface.
      if (name !== "rail" && name !== "wall" && name !== "rim") {
        const N = m.geometry.getAttribute("normal");
        for (let i = 0; i < N.count; i++) if (N.getY(i) > 0.9) N.setXYZ(i, 0, 1, 0);
      }
    }
  }
  // materials no mesh took (none today) are freed with the rest on dispose via the meshes
  for (const [name, mat] of Object.entries(mats)) if (!model.surfaces[name as StadiumSurface].length) mat.dispose();
}

function railMaterial(pal: Palette, railAmount: THREE.Texture) {
  const body = pal.xtreme.clone().multiplyScalar(0.16);
  const mat = new THREE.MeshStandardMaterial({ color: body, roughness: 0.38, metalness: 0, envMapIntensity: 0.6 });
  const uniforms = {
    railAmount: { value: railAmount },
    toothRest: { value: pal.paper.clone() },
    railLit: { value: pal.xtreme.clone() },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float toothMask;\nvarying float vTooth;\nvarying vec2 vRailXZ;",
      )
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvTooth = toothMask;\nvRailXZ = (modelMatrix * vec4(transformed, 1.0)).xz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D railAmount;\nuniform vec3 toothRest;\nuniform vec3 railLit;\nvarying float vTooth;\nvarying vec2 vRailXZ;",
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        [
          "float railTh = atan(-vRailXZ.y, vRailXZ.x);",
          "float railA = texture2D(railAmount, vec2(railTh / 6.28318530718, 0.5)).r;",
          "float toothK = smoothstep(0.15, 0.85, vTooth);",
          "vec3 railBase = mix(diffuse, toothRest, toothK);",
          "vec4 diffuseColor = vec4(mix(railBase, railLit, clamp(railA * (0.35 + 0.65 * toothK) * 1.4, 0.0, 1.0)), opacity);",
        ].join("\n"),
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += toothRest * 0.12 * toothK + railLit * railA * (0.25 + 1.1 * toothK);",
      );
  };
  mat.customProgramCacheKey = () => "rail-teeth-v1";
  return mat;
}
