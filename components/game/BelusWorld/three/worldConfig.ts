// ---------------------------------------------------------------------------
// Nilu's World — 3D world configuration
// A cluster of floating sky-islands connected by rainbow bridges.
// Everything the world needs to lay itself out lives here so the geometry,
// the ground-collision math, and the gameplay all read from one source.
// ---------------------------------------------------------------------------

export type ZoneId = 'home' | 'meadow' | 'mountain' | 'cove' | 'forest' | 'rainbow';

export interface IslandDef {
  id: ZoneId;
  /** world-space centre on the XZ plane */
  cx: number;
  cz: number;
  /** flat radius the player can stand on */
  radius: number;
  /** height of the island's walkable top */
  top: number;
  /** primary grass / surface colour */
  grass: string;
  /** rock / cliff colour for the underside */
  rock: string;
  /** soft accent glow used by crystals + signposts on this island */
  accent: string;
  /** the learning zone this island hosts (home has none) */
  label: string;
  emoji: string;
}

export interface BridgeDef {
  from: ZoneId;
  to: ZoneId;
  /** half-width of the walkable plank surface */
  halfWidth: number;
  colors: string[];
}

// The home hub sits at the centre; the four learning islands orbit it at
// different heights so the kid genuinely travels up and down, not just across.
export const ISLANDS: Record<ZoneId, IslandDef> = {
  home: {
    id: 'home',
    cx: 0,
    cz: 0,
    radius: 11,
    top: 0,
    grass: '#7ec850',
    rock: '#8a6b4f',
    accent: '#ffd166',
    label: "Nilu's Home",
    emoji: '🏡',
  },
  meadow: {
    id: 'meadow',
    cx: -38,
    cz: -8,
    radius: 9.5,
    top: 2.5,
    grass: '#9ad86a',
    rock: '#9c7a59',
    accent: '#ff8fc8',
    label: 'Feelings Meadow',
    emoji: '🌸',
  },
  mountain: {
    id: 'mountain',
    cx: 36,
    cz: -14,
    radius: 9.5,
    top: 4.5,
    grass: '#bfe3a0',
    rock: '#7f8a99',
    accent: '#7cc6ff',
    label: 'Morning Mountain',
    emoji: '⛰️',
  },
  cove: {
    id: 'cove',
    cx: -28,
    cz: 30,
    radius: 9.5,
    top: -2,
    grass: '#86d6c0',
    rock: '#6f8aa0',
    accent: '#5fd0e0',
    label: 'Calm Cove',
    emoji: '🌊',
  },
  forest: {
    id: 'forest',
    cx: 32,
    cz: 30,
    radius: 9.5,
    top: 1,
    grass: '#6fbf73',
    rock: '#7a6b4a',
    accent: '#c6a0ff',
    label: 'Friendship Forest',
    emoji: '🌳',
  },
  // A reward island that only FORMS once the child masters their first island.
  // It's a free-play playground (no lesson) Nilu can walk to and explore — a
  // visible "the world grew because of you" payoff. Sits out beyond home.
  rainbow: {
    id: 'rainbow',
    cx: 0,
    cz: -42,
    radius: 10,
    top: 3,
    grass: '#b6e3ff',
    rock: '#9a86c4',
    accent: '#ff9ed8',
    label: 'Rainbow Playground',
    emoji: '🌈',
  },
};

export const ISLAND_LIST = Object.values(ISLANDS);

const RAINBOW_STRIPES = ['#ff6b6b', '#ffd166', '#7ec850', '#5fd0e0', '#8a7bff'];

export const BRIDGES: BridgeDef[] = [
  { from: 'home', to: 'meadow', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'home', to: 'mountain', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'home', to: 'cove', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'home', to: 'forest', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  // bridge to the reward island — only walkable once it's unlocked
  { from: 'home', to: 'rainbow', halfWidth: 2.4, colors: RAINBOW_STRIPES },
];

// The zone islands that host a learning activity (everything except home + the
// reward island). The rainbow playground has no lesson — it's just to explore.
export const ZONE_ISLANDS: ZoneId[] = ['meadow', 'mountain', 'cove', 'forest'];

// Runtime flag: the reward island (and its bridge) only physically exist once
// the child has finished their first level. Rendering AND ground-collision both
// read this so a locked island is neither visible nor walkable.
export const worldRuntime = { rainbowUnlocked: false };

// Where the interaction crystal sits on each zone island (offset from centre)
// and how close Nilu must be to trigger the "Play!" prompt.
export const INTERACT_RADIUS = 4.5;

export const PLAYER_SPAWN = { x: 0, y: 0.4, z: 6 };

// Solid things Nilu can't walk through (horizontal keep-out cylinders). The
// Morning Mountain peak is a real landmark — Nilu walks AROUND it, not through.
// World.tsx renders the peak at this same spot, so visuals and collision agree.
export interface Obstacle {
  x: number;
  z: number;
  r: number;
}
export const OBSTACLES: Obstacle[] = (() => {
  const m = ISLANDS.mountain;
  const len = Math.hypot(m.cx, m.cz) || 1;
  const home = ISLANDS.home;
  const meadow = ISLANDS.meadow;
  return [
    // Morning Mountain peak
    { x: m.cx + (m.cx / len) * 6.5, z: m.cz + (m.cz / len) * 6.5, r: 3.0 },
    // home cottage + its welcome trees (positions mirror HomeDecor in World.tsx)
    { x: home.cx + 0, z: home.cz - 2, r: 1.7 },
    { x: home.cx + 3.5, z: home.cz + 1, r: 0.7 },
    { x: home.cx - 3.8, z: home.cz + 0.5, r: 0.7 },
    // the meadow's big tree (mirrors ZoneDecor meadow tree)
    { x: meadow.cx + meadow.radius * 0.5, z: meadow.cz - meadow.radius * 0.3, r: 0.7 },
  ];
})();
