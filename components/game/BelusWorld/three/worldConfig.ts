// ---------------------------------------------------------------------------
// Aaria's Floating Islands — 3D world configuration
// A cluster of floating sky-islands connected by rainbow bridges.
// Everything the world needs to lay itself out lives here so the geometry,
// the ground-collision math, and the gameplay all read from one source.
// ---------------------------------------------------------------------------

export type ZoneId =
  | 'home' | 'meadow' | 'mountain' | 'cove' | 'forest' | 'shore' | 'rainbow'
  | 'school' | 'afternoon' | 'night'
  | 'garden' | 'deepforest' | 'lagoon' | 'bay';

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
  // The fifth learning island — sharing, turn-taking and waiting, practiced on
  // a sunny beach. Sits south of home, between the cove and the forest.
  shore: {
    id: 'shore',
    cx: 2,
    cz: 44,
    radius: 9.5,
    top: 0.5,
    grass: '#f2dfa9',
    rock: '#b09a72',
    accent: '#ffb066',
    label: 'Sharing Shore',
    emoji: '🏖️',
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
  // ---- Nilu's Day arc islands — these are HIDDEN until the previous stage of
  // the day is mastered, then they FORM with a celebration (see worldRuntime
  // flags below + the rainbowUnlocked pattern in worldMath/World/index). ----
  // 🏫 School Island — stage 2 of Nilu's day. North-east, between Morning
  // Mountain and the Rainbow Playground.
  school: {
    id: 'school',
    cx: 26,
    cz: -34,
    radius: 8.5,
    top: 3.5,
    grass: '#e3d38a',
    rock: '#a08454',
    accent: '#f59e0b',
    label: 'School Island',
    emoji: '🏫',
  },
  // 🏡 Fun Corner — after-school play + home routines. Continues the day's
  // sweep south-east of School Island (chained FROM school, not home — the
  // day arc reads as one continuous path: mountain → school → afternoon →
  // night, so finishing a stage always leads onward, never back to base).
  afternoon: {
    id: 'afternoon',
    cx: 44,
    cz: -48,
    radius: 8.5,
    top: 2,
    grass: '#ffc9a3',
    rock: '#a56b52',
    accent: '#fb7185',
    label: 'Fun Corner',
    emoji: '🏡',
  },
  // 🌙 Sleepy Island — winding down for the night. Final stop of the day's
  // sweep, chained FROM Fun Corner, curving back east toward Morning
  // Mountain's side of the map so the day arc closes into a loop shape.
  night: {
    id: 'night',
    cx: 62,
    cz: -28,
    radius: 8.5,
    top: 1.5,
    grass: '#9aa4d8',
    rock: '#6d6a94',
    accent: '#818cf8',
    label: 'Sleepy Island',
    emoji: '🌙',
  },
  // ---- Advanced sister islands — these FORM once their parent skill island
  // reaches 5/5 completed levels (plain gating, no dayArc/fresh choice
  // involved). Each sits further out beyond its parent, away from home, so
  // the bridge always runs parent → advanced (never home → advanced). See
  // three/quest/advancedQuests.ts for the lesson content. ----
  garden: {
    id: 'garden',
    cx: -75.18,
    cz: -15.83,
    radius: 8.5,
    top: 3,
    grass: '#ffd3e6',
    rock: '#c98aa8',
    accent: '#ec4899',
    label: 'Feelings Garden',
    emoji: '🌷',
  },
  deepforest: {
    id: 'deepforest',
    cx: 59.72,
    cz: 56,
    radius: 8.5,
    top: 1.5,
    grass: '#2f7d4a',
    rock: '#4a5a3c',
    accent: '#16a34a',
    label: 'Deep Forest',
    emoji: '🌲',
  },
  lagoon: {
    id: 'lagoon',
    cx: -53.93,
    cz: 57.78,
    radius: 8.5,
    top: -1.5,
    grass: '#8fd8d0',
    rock: '#5a8a95',
    accent: '#06b6d4',
    label: 'Quiet Lagoon',
    emoji: '🪷',
  },
  bay: {
    id: 'bay',
    cx: 3.73,
    cz: 81.96,
    radius: 8.5,
    top: 1,
    grass: '#f2dfa9',
    rock: '#b09a72',
    accent: '#f97316',
    label: 'Treasure Bay',
    emoji: '⛵',
  },
};

export const ISLAND_LIST = Object.values(ISLANDS);

const RAINBOW_STRIPES = ['#ff6b6b', '#ffd166', '#7ec850', '#5fd0e0', '#8a7bff'];

export const BRIDGES: BridgeDef[] = [
  { from: 'home', to: 'meadow', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'home', to: 'mountain', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'home', to: 'cove', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'home', to: 'forest', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'home', to: 'shore', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  // bridge to the reward island — only walkable once it's unlocked
  { from: 'home', to: 'rainbow', halfWidth: 2.4, colors: RAINBOW_STRIPES },
  // Day Arc islands — bridges only form when their island does. The day
  // chains forward from wherever Nilu just was (not back to Home) so each
  // new stage genuinely feels like leveling up: Home → Mountain is the day's
  // one entrance, then Mountain → School → Afternoon → Night sweeps onward.
  { from: 'mountain', to: 'school', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'school', to: 'afternoon', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'afternoon', to: 'night', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  // Advanced sister islands — the bridge always runs FROM the parent skill
  // island (never from home), so finishing that island always leads onward.
  { from: 'meadow', to: 'garden', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'forest', to: 'deepforest', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'cove', to: 'lagoon', halfWidth: 2.2, colors: RAINBOW_STRIPES },
  { from: 'shore', to: 'bay', halfWidth: 2.2, colors: RAINBOW_STRIPES },
];

// The zone islands that host a learning activity (everything except home + the
// reward island). The rainbow playground has no lesson — it's just to explore.
export const ZONE_ISLANDS: ZoneId[] = [
  'meadow', 'mountain', 'cove', 'forest', 'shore',
  'school', 'afternoon', 'night',
  'garden', 'deepforest', 'lagoon', 'bay',
];

// Runtime flags: the reward island + the Day Arc islands + the advanced
// sister islands (and their bridges) only physically exist once earned.
// Rendering AND ground-collision both read these so a locked island is
// neither visible nor walkable.
export const worldRuntime = {
  rainbowUnlocked: false,
  schoolUnlocked: false,
  afternoonUnlocked: false,
  nightUnlocked: false,
  gardenUnlocked: false,
  deepforestUnlocked: false,
  lagoonUnlocked: false,
  bayUnlocked: false,
};

/** Does this island physically exist right now? (locked islands are neither
 *  visible nor walkable — same contract as the original rainbow island) */
export function isZoneFormed(id: ZoneId): boolean {
  if (id === 'rainbow') return worldRuntime.rainbowUnlocked;
  if (id === 'school') return worldRuntime.schoolUnlocked;
  if (id === 'afternoon') return worldRuntime.afternoonUnlocked;
  if (id === 'night') return worldRuntime.nightUnlocked;
  if (id === 'garden') return worldRuntime.gardenUnlocked;
  if (id === 'deepforest') return worldRuntime.deepforestUnlocked;
  if (id === 'lagoon') return worldRuntime.lagoonUnlocked;
  if (id === 'bay') return worldRuntime.bayUnlocked;
  return true;
}

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
