// ---------------------------------------------------------------------------
// Progress + leveling.
// Every island has MAX_LEVEL levels. Finishing a level earns 1–3 stars (best
// score is kept — you can always replay to improve, never to lose). Stars feed
// two *visible* things the child strives for:
//   1. each island visibly BLOOMS as its levels are completed, and
//   2. Nilu visibly GROWS UP as total stars rise (baby → child → teen → grown).
// No timers, no losing, no farming the same level past 3 stars.
// ---------------------------------------------------------------------------

export type ActivityZone =
  | 'meadow' | 'mountain' | 'cove' | 'forest' | 'shore'
  | 'school' | 'afternoon' | 'night';

export const ZONES: ActivityZone[] = [
  'meadow', 'mountain', 'cove', 'forest', 'shore',
  'school', 'afternoon', 'night',
];

/** Nilu's Day — the story arc through one day of Nilu's life. Each stage's
 *  island only FORMS once the previous stage's island is fully completed. */
export const DAY_ARC: ActivityZone[] = ['mountain', 'school', 'afternoon', 'night'];
export const MAX_LEVEL = 5;
export const MAX_STARS_PER_LEVEL = 3;
export const MAX_STARS_PER_ISLAND = MAX_LEVEL * MAX_STARS_PER_LEVEL; // 15
export const MAX_TOTAL_STARS = MAX_STARS_PER_ISLAND * ZONES.length; // 75

export interface IslandProgress {
  /** best stars earned on each level (index 0..MAX_LEVEL-1); 0 = not completed */
  levelStars: number[];
}

export type CosmeticSlot = 'head' | 'face' | 'back';
export interface Cosmetic {
  id: string;
  name: string;
  icon: string;
  slot: CosmeticSlot;
}
/** Everything Nilu can wear. Earned one per completed level (UNLOCK_ORDER). */
export const COSMETICS: Cosmetic[] = [
  { id: 'cap', name: 'Explorer Cap', icon: '🧢', slot: 'head' },
  { id: 'bow', name: 'Cute Bow', icon: '🎀', slot: 'head' },
  { id: 'party', name: 'Party Hat', icon: '🥳', slot: 'head' },
  { id: 'flowercrown', name: 'Flower Crown', icon: '🌸', slot: 'head' },
  { id: 'sunhat', name: 'Sunny Hat', icon: '👒', slot: 'head' },
  { id: 'beanie', name: 'Cozy Beanie', icon: '🧶', slot: 'head' },
  { id: 'crown', name: 'Golden Crown', icon: '👑', slot: 'head' },
  { id: 'wizard', name: 'Wizard Hat', icon: '🧙', slot: 'head' },
  { id: 'glasses', name: 'Cool Shades', icon: '🕶️', slot: 'face' },
  { id: 'goggles', name: 'Swim Goggles', icon: '🥽', slot: 'face' },
  { id: 'hearts', name: 'Heart Glasses', icon: '💖', slot: 'face' },
  { id: 'cape', name: 'Hero Cape', icon: '🦸', slot: 'back' },
  { id: 'scarf', name: 'Rainbow Scarf', icon: '🧣', slot: 'back' },
  { id: 'backpack', name: 'Explorer Backpack', icon: '🎒', slot: 'back' },
  { id: 'balloon', name: 'Sky Balloon', icon: '🎈', slot: 'back' },
  { id: 'wings', name: 'Fairy Wings', icon: '🧚', slot: 'back' },
  // ---- Nilu's Day items — earned across the School / Fun Corner / Sleepy
  // Island levels so the later day-arc levels keep paying out. ----
  { id: 'schoolcap', name: 'School Cap', icon: '🧢', slot: 'head' },
  { id: 'schoolbag', name: 'School Bag', icon: '🎒', slot: 'back' },
  { id: 'starbadge', name: 'Star Badge', icon: '⭐', slot: 'face' },
  { id: 'pajamahat', name: 'Pajama Hat', icon: '😴', slot: 'head' },
  { id: 'teddy', name: 'Cuddly Teddy', icon: '🧸', slot: 'back' },
  { id: 'moonpin', name: 'Moon Pin', icon: '🌙', slot: 'face' },
  { id: 'kite', name: 'Play Kite', icon: '🪁', slot: 'back' },
  { id: 'snackpin', name: 'Snack Pin', icon: '🍎', slot: 'face' },
];
/** the order items unlock as the child completes levels — slots interleaved so
 *  every few levels the reward feels different (a hat, then something for the
 *  back, then the face…). 24 items across 40 total levels. */
export const UNLOCK_ORDER = [
  'cap', 'bow', 'glasses', 'scarf', 'party', 'flowercrown', 'cape', 'sunhat',
  'goggles', 'crown', 'backpack', 'beanie', 'hearts', 'wings', 'balloon', 'wizard',
  'schoolcap', 'snackpin', 'schoolbag', 'kite', 'starbadge', 'teddy', 'moonpin', 'pajamahat',
];

export interface EquippedCosmetics {
  head?: string;
  face?: string;
  back?: string;
}

export function cosmeticById(id: string): Cosmetic | undefined {
  return COSMETICS.find((c) => c.id === id);
}

/** A seed planted in the Home garden. It only ever GROWS (one stage per real
 *  day, up to a flower) — plants never wilt, never decay, never need care. */
export interface GardenPlant {
  plantedDate: string; // local YYYY-MM-DD
}
export const GARDEN_SLOTS = 4;
export const PLANT_MAX_STAGE = 3; // 0 sprout → 1 leaves → 2 bud → 3 flower

export interface GameProgress {
  islands: Record<ActivityZone, IslandProgress>;
  /** cosmetic accessories the child has unlocked for Nilu */
  unlocked: string[];
  /** which cosmetic is worn in each slot */
  equipped: EquippedCosmetics;
  /** lifetime sparkles + petals collected — fills the glass jar at Home */
  jarSparkles: number;
  /** seeds ready to plant in the Home garden */
  seeds: number;
  /** the Home garden plots (each plant only grows, never wilts) */
  garden: GardenPlant[];
  /** today's hidden-sparkle hunt: which sparkle ids were found on `date` */
  dailySparkles: { date: string; found: string[] };
  /** animal friends the child has helped/healed — they remember the child */
  healedFriends: string[];
  /** local date of the last once-a-day friend "visit moment" (petal gift) */
  lastVisitMomentDate: string | null;
  /** highest growth stage Nilu has EVER reached — growth never goes backwards,
   *  even if star thresholds are rebalanced in an update */
  growthFloor: number;
  /** one-time achievement ids the child has earned (additive, never removed) */
  achievementsEarned: string[];
  /** today's Star Quests: which fully-bloomed islands' daily quest is done */
  starQuests: { date: string; doneZones: string[] };
  /** lifetime per-zone "gentle re-prompt" (slip) + played-round tallies — never
   *  shown to the child, only surfaced to grown-ups as "areas practicing most" */
  practiceStats: Record<ActivityZone, { slips: number; rounds: number }>;
  /** the child's most recent self-chosen calm-plan totems from Calm Cove L5
   *  (e.g. ["Deep breaths", "Squeeze my hands", "Count to 5"]) — empty if never built */
  calmPlan: string[];
  /** Nilu's Day arc bookkeeping:
   *  - choice: what a pre-update player picked when the day arc arrived
   *    ('fresh' = re-earn each stage post-choice, 'continue' = existing
   *    completed levels count, null = not asked yet)
   *  - stagesDone: day-arc zones mastered AFTER the choice (used by 'fresh')
   *  - celebrated: day-arc islands whose "a new island formed!" celebration
   *    has already fired (so it fires exactly once) */
  dayArc: {
    choice: 'fresh' | 'continue' | null;
    stagesDone: string[];
    celebrated: string[];
  };
  /** My Day Book — one sticker id per level, earned on its FIRST completion
   *  (e.g. 'school-3'). Additive only, never removed; tolerant of old saves. */
  dayBook: string[];
}

/** A single My Day Book sticker: the picture + short praise shown for a level. */
export interface DayBookSticker {
  id: string;
  emoji: string;
  label: string;
}

/** Thematic reward sticker for every zone × level (8 zones × 5 levels = 40),
 *  keyed `${zone}-${level}` (level is 1-based, matching UI numbering). */
export const DAY_BOOK_STICKERS: Record<string, { emoji: string; label: string }> = {
  'meadow-1': { emoji: '😊', label: 'Spotted happy!' },
  'meadow-2': { emoji: '😢', label: 'Spotted sad!' },
  'meadow-3': { emoji: '😠', label: 'Spotted mad!' },
  'meadow-4': { emoji: '😲', label: 'Spotted surprised!' },
  'meadow-5': { emoji: '🥰', label: 'Read all the feelings!' },

  'mountain-1': { emoji: '🪥', label: 'Brushed teeth!' },
  'mountain-2': { emoji: '👕', label: 'Got dressed!' },
  'mountain-3': { emoji: '🧼', label: 'Washed hands!' },
  'mountain-4': { emoji: '🍽️', label: 'Set the table!' },
  'mountain-5': { emoji: '🎒', label: 'Ready for the day!' },

  'cove-1': { emoji: '🌊', label: 'Calmed the sea!' },
  'cove-2': { emoji: '🦋', label: 'Counted my breaths!' },
  'cove-3': { emoji: '🧘', label: 'Calm body check!' },
  'cove-4': { emoji: '💙', label: 'Chose my calm trick!' },
  'cove-5': { emoji: '⭐', label: 'Built my calm plan!' },

  'forest-1': { emoji: '🗣️', label: 'Used my words!' },
  'forest-2': { emoji: '🙋', label: 'Asked for help!' },
  'forest-3': { emoji: '📖', label: 'Told a story!' },
  'forest-4': { emoji: '🤝', label: 'Asked to play!' },
  'forest-5': { emoji: '💬', label: 'Shared my feelings!' },

  'shore-1': { emoji: '🏖️', label: 'Took my turn!' },
  'shore-2': { emoji: '🤲', label: 'Shared a toy!' },
  'shore-3': { emoji: '⏳', label: 'Waited patiently!' },
  'shore-4': { emoji: '🙌', label: 'Played together!' },
  'shore-5': { emoji: '🎉', label: 'Great teamwork!' },

  'school-1': { emoji: '✋', label: 'Raised my hand!' },
  'school-2': { emoji: '📏', label: 'Lined up nicely!' },
  'school-3': { emoji: '🎒', label: 'Packed my bag!' },
  'school-4': { emoji: '👂', label: 'Listened well!' },
  'school-5': { emoji: '🏫', label: 'Great school day!' },

  'afternoon-1': { emoji: '🍎', label: 'Ate my snack!' },
  'afternoon-2': { emoji: '🧸', label: 'Cleaned up toys!' },
  'afternoon-3': { emoji: '🎨', label: 'Made some art!' },
  'afternoon-4': { emoji: '🪁', label: 'Played outside!' },
  'afternoon-5': { emoji: '🏡', label: 'Fun afternoon!' },

  'night-1': { emoji: '🛁', label: 'Took a bath!' },
  'night-2': { emoji: '🦷', label: 'Brushed at night!' },
  'night-3': { emoji: '📚', label: 'Story time!' },
  'night-4': { emoji: '🧸', label: 'Cuddled Teddy!' },
  'night-5': { emoji: '🌙', label: 'Slept tight!' },
};

const KEY = 'belus_world_progress_v1';

function emptyIsland(): IslandProgress {
  return { levelStars: Array(MAX_LEVEL).fill(0) };
}

function emptyPracticeStats(): Record<ActivityZone, { slips: number; rounds: number }> {
  return {
    meadow: { slips: 0, rounds: 0 },
    mountain: { slips: 0, rounds: 0 },
    cove: { slips: 0, rounds: 0 },
    forest: { slips: 0, rounds: 0 },
    shore: { slips: 0, rounds: 0 },
    school: { slips: 0, rounds: 0 },
    afternoon: { slips: 0, rounds: 0 },
    night: { slips: 0, rounds: 0 },
  };
}

function defaults(): GameProgress {
  return {
    islands: {
      meadow: emptyIsland(),
      mountain: emptyIsland(),
      cove: emptyIsland(),
      forest: emptyIsland(),
      shore: emptyIsland(),
      school: emptyIsland(),
      afternoon: emptyIsland(),
      night: emptyIsland(),
    },
    unlocked: [],
    equipped: {},
    jarSparkles: 0,
    seeds: 0,
    garden: [],
    dailySparkles: { date: '', found: [] },
    healedFriends: [],
    lastVisitMomentDate: null,
    growthFloor: 0,
    achievementsEarned: [],
    starQuests: { date: '', doneZones: [] },
    practiceStats: emptyPracticeStats(),
    calmPlan: [],
    dayArc: { choice: null, stagesDone: [], celebrated: [] },
    dayBook: [],
  };
}

export function loadProgress(): GameProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    const base = defaults();
    if (parsed.islands) {
      for (const z of ZONES) {
        const ip = parsed.islands[z];
        if (ip && Array.isArray(ip.levelStars)) {
          // tolerate older saves with a different MAX_LEVEL
          base.islands[z].levelStars = Array.from(
            { length: MAX_LEVEL },
            (_, i) => ip.levelStars[i] ?? 0,
          );
        }
      }
    }
    if (Array.isArray(parsed.unlocked)) base.unlocked = parsed.unlocked;
    if (parsed.equipped && typeof parsed.equipped === 'object') base.equipped = parsed.equipped;
    if (typeof parsed.jarSparkles === 'number') base.jarSparkles = Math.max(0, parsed.jarSparkles);
    if (typeof parsed.seeds === 'number') base.seeds = Math.max(0, parsed.seeds);
    if (Array.isArray(parsed.garden)) {
      base.garden = parsed.garden
        .filter((g): g is GardenPlant => !!g && typeof g.plantedDate === 'string')
        .slice(0, GARDEN_SLOTS);
    }
    if (parsed.dailySparkles && typeof parsed.dailySparkles.date === 'string' && Array.isArray(parsed.dailySparkles.found)) {
      base.dailySparkles = { date: parsed.dailySparkles.date, found: parsed.dailySparkles.found };
    }
    if (Array.isArray(parsed.healedFriends)) base.healedFriends = parsed.healedFriends;
    if (typeof parsed.lastVisitMomentDate === 'string') base.lastVisitMomentDate = parsed.lastVisitMomentDate;
    if (Array.isArray(parsed.achievementsEarned)) base.achievementsEarned = parsed.achievementsEarned;
    if (parsed.starQuests && typeof parsed.starQuests.date === 'string' && Array.isArray(parsed.starQuests.doneZones)) {
      base.starQuests = { date: parsed.starQuests.date, doneZones: parsed.starQuests.doneZones };
    }
    // older saves have no practiceStats — tolerate partial/missing per-zone entries
    if (parsed.practiceStats && typeof parsed.practiceStats === 'object') {
      for (const z of ZONES) {
        const ps = (parsed.practiceStats as Record<string, { slips?: number; rounds?: number }>)[z];
        if (ps && typeof ps.slips === 'number' && typeof ps.rounds === 'number') {
          base.practiceStats[z] = { slips: Math.max(0, ps.slips), rounds: Math.max(0, ps.rounds) };
        }
      }
    }
    if (Array.isArray(parsed.calmPlan)) {
      base.calmPlan = parsed.calmPlan.filter((c): c is string => typeof c === 'string');
    }
    // older saves have no dayArc — they keep choice=null (which triggers the
    // one-time fresh/continue chooser for players with real progress)
    if (parsed.dayArc && typeof parsed.dayArc === 'object') {
      const da = parsed.dayArc as Partial<GameProgress['dayArc']>;
      if (da.choice === 'fresh' || da.choice === 'continue') base.dayArc.choice = da.choice;
      if (Array.isArray(da.stagesDone)) {
        base.dayArc.stagesDone = da.stagesDone.filter((s): s is string => typeof s === 'string');
      }
      if (Array.isArray(da.celebrated)) {
        base.dayArc.celebrated = da.celebrated.filter((s): s is string => typeof s === 'string');
      }
    }
    // older saves have no dayBook — tolerate missing/malformed entries entirely
    if (Array.isArray(parsed.dayBook)) {
      base.dayBook = parsed.dayBook.filter((s): s is string => typeof s === 'string');
    }
    if (typeof parsed.growthFloor === 'number') {
      base.growthFloor = Math.max(0, Math.min(3, parsed.growthFloor));
    } else {
      // migrate pre-rebalance saves: the growth stage the child ALREADY reached
      // under the old thresholds becomes the floor, so Nilu never shrinks back.
      const legacyStars = totalStars(base);
      const legacy = [0, 12, 28, 48];
      let stage = 0;
      for (let i = legacy.length - 1; i >= 0; i--) {
        if (legacyStars >= legacy[i]) { stage = i; break; }
      }
      base.growthFloor = stage;
    }
    return base;
  } catch {
    return defaults();
  }
}

export function saveProgress(p: GameProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode / quota — fail silently, game still playable */
  }
}

// ---- per-island derived values ----

export function islandStars(p: GameProgress, zone: ActivityZone): number {
  return p.islands[zone].levelStars.reduce((a, b) => a + b, 0);
}

/** how many levels have been completed (≥1 star) — drives the bloom stage */
export function completedLevels(p: GameProgress, zone: ActivityZone): number {
  return p.islands[zone].levelStars.filter((s) => s > 0).length;
}

/** the next level to play (1-based). Levels unlock in order. */
export function nextLevel(p: GameProgress, zone: ActivityZone): number {
  return Math.min(completedLevels(p, zone) + 1, MAX_LEVEL);
}

/** is a given level (1-based) unlocked / playable? */
export function isLevelUnlocked(p: GameProgress, zone: ActivityZone, level: number): boolean {
  return level <= nextLevel(p, zone);
}

export function isIslandComplete(p: GameProgress, zone: ActivityZone): boolean {
  return completedLevels(p, zone) >= MAX_LEVEL;
}

// ---- Nilu's Day arc (☀️ mountain → 🏫 school → 🏡 afternoon → 🌙 night) ----

/** Is this day-arc stage "done" for gating purposes? Finishing the island's
 *  CURRENT task (one completed level) advances the day — the next island forms
 *  right away. Levels 2-5 stay as richer replays of the same routine; the day
 *  never asks a child to grind an island (or detour) before moving on.
 *  A 'fresh' player re-earns each stage AFTER their choice (stagesDone). */
export function dayStageComplete(p: GameProgress, zone: ActivityZone): boolean {
  if (p.dayArc.choice === 'fresh') return p.dayArc.stagesDone.includes(zone);
  return completedLevels(p, zone) >= 1;
}

/** Has this day-arc island FORMED yet? The first stage (mountain) is always
 *  available; each later island forms once the previous stage is complete. */
export function isDayZoneUnlocked(p: GameProgress, zone: ActivityZone): boolean {
  const idx = DAY_ARC.indexOf(zone);
  if (idx <= 0) return true; // mountain (and any non-arc zone) is always open
  return dayStageComplete(p, DAY_ARC[idx - 1]);
}

/** Record that a day-arc stage was mastered (island reached 5/5) — feeds the
 *  'fresh' gating path. No-op for already-recorded stages. */
export function recordDayStage(p: GameProgress, zone: ActivityZone): GameProgress {
  if (!DAY_ARC.includes(zone) || p.dayArc.stagesDone.includes(zone)) return p;
  return { ...p, dayArc: { ...p.dayArc, stagesDone: [...p.dayArc.stagesDone, zone] } };
}

/** Set the one-time fresh/continue choice for the Nilu's Day update. */
export function setDayChoice(p: GameProgress, choice: 'fresh' | 'continue'): GameProgress {
  if (p.dayArc.choice !== null) return p;
  return { ...p, dayArc: { ...p.dayArc, choice } };
}

/** Mark a day-arc island's "it formed!" celebration as played (fires once). */
export function markDayCelebrated(p: GameProgress, zone: ActivityZone): GameProgress {
  if (p.dayArc.celebrated.includes(zone)) return p;
  return { ...p, dayArc: { ...p.dayArc, celebrated: [...p.dayArc.celebrated, zone] } };
}

// ---- totals ----

export function totalStars(p: GameProgress): number {
  return ZONES.reduce((sum, z) => sum + islandStars(p, z), 0);
}

export function totalCompletedLevels(p: GameProgress): number {
  return ZONES.reduce((sum, z) => sum + completedLevels(p, z), 0);
}

// ---- Nilu growth (the headline reward) ----

export type GrowthStage = 0 | 1 | 2 | 3;

export interface GrowthInfo {
  stage: GrowthStage;
  /** kid-facing name of this stage */
  label: string;
  /** total stars needed to reach the NEXT stage, or null if fully grown */
  nextAt: number | null;
  /** 0..1 toward the next stage (1 if grown) */
  progress: number;
  /** visual scale to apply to the 3D model */
  scale: number;
}

// Star thresholds for each growth stage. Retuned for the Nilu's Day update
// (8 islands × 15 stars = 120 max) so the FINAL stage lands near the end of
// the whole journey instead of leaving the day-arc islands with no growth
// payoff. Existing players are protected by `growthFloor` — a stage once
// reached is never lost.
const GROWTH_THRESHOLDS = [0, 18, 45, 84];
const GROWTH_LABELS = ['Baby Nilu', 'Little Nilu', 'Big Nilu', 'Grown-Up Nilu'];
const GROWTH_SCALES = [0.7, 0.85, 1.0, 1.15];

export function growthFromStars(stars: number): GrowthInfo {
  let stage: GrowthStage = 0;
  for (let i = GROWTH_THRESHOLDS.length - 1; i >= 0; i--) {
    if (stars >= GROWTH_THRESHOLDS[i]) {
      stage = i as GrowthStage;
      break;
    }
  }
  const nextAt = stage < 3 ? GROWTH_THRESHOLDS[stage + 1] : null;
  const base = GROWTH_THRESHOLDS[stage];
  const progress = nextAt === null ? 1 : (stars - base) / (nextAt - base);
  return {
    stage,
    label: GROWTH_LABELS[stage],
    nextAt,
    progress: Math.max(0, Math.min(1, progress)),
    scale: GROWTH_SCALES[stage],
  };
}

export function getGrowth(p: GameProgress): GrowthInfo {
  const info = growthFromStars(totalStars(p));
  const floor = Math.max(0, Math.min(3, p.growthFloor ?? 0)) as GrowthStage;
  if (floor <= info.stage) return info;
  // the floor wins: growth NEVER goes backwards (e.g. after a rebalance)
  const nextAt = floor < 3 ? GROWTH_THRESHOLDS[floor + 1] : null;
  return {
    stage: floor,
    label: GROWTH_LABELS[floor],
    nextAt,
    progress: nextAt === null ? 1 : 0,
    scale: GROWTH_SCALES[floor],
  };
}

// ---- Home garden + sparkle jar + friendships (all additive, never decay) ----

/** Local calendar date as YYYY-MM-DD (real days drive sparkles + plant growth). */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole days between two YYYY-MM-DD keys (b - a), never negative. */
export function daysBetween(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  if (pa.length !== 3 || pb.length !== 3 || pa.some(Number.isNaN) || pb.some(Number.isNaN)) return 0;
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.max(0, Math.floor((tb - ta) / 86400000));
}

/** Growth stage of a plant on a given date: one stage per real day, capped at
 *  the flower. Plants only grow — a stage is never lost. */
export function plantStage(plantedDate: string, onDate: string = todayKey()): number {
  return Math.min(PLANT_MAX_STAGE, daysBetween(plantedDate, onDate));
}

/** The sparkle ids found so far TODAY (empty if the hunt reset overnight). */
export function sparklesFoundToday(p: GameProgress, date: string = todayKey()): string[] {
  return p.dailySparkles.date === date ? p.dailySparkles.found : [];
}

/** Collect one of today's hidden sparkles: feeds the jar AND yields a seed. */
export function collectSparkle(p: GameProgress, id: string): GameProgress {
  const date = todayKey();
  const found = sparklesFoundToday(p, date);
  if (found.includes(id)) return p;
  return {
    ...p,
    dailySparkles: { date, found: [...found, id] },
    jarSparkles: p.jarSparkles + 1,
    seeds: p.seeds + 1,
  };
}

/** Plant one seed in the next free garden slot (no-op if none free / no seed). */
export function plantSeed(p: GameProgress): GameProgress {
  if (p.seeds <= 0 || p.garden.length >= GARDEN_SLOTS) return p;
  return { ...p, seeds: p.seeds - 1, garden: [...p.garden, { plantedDate: todayKey() }] };
}

/** Remember an animal friend the child healed — friendships are forever. */
export function recordHealedFriend(p: GameProgress, species: string): GameProgress {
  if (p.healedFriends.includes(species)) return p;
  return { ...p, healedFriends: [...p.healedFriends, species] };
}

/** The once-a-day visit-moment petal: feeds the jar, marks today as done. */
export function givePetal(p: GameProgress): GameProgress {
  return { ...p, jarSparkles: p.jarSparkles + 1, lastVisitMomentDate: todayKey() };
}

/** Which healed friend has today's optional visit moment (date-seeded), or null
 *  if there are no healed friends yet / today's moment already happened. */
export function todaysVisitor(p: GameProgress): string | null {
  const date = todayKey();
  if (p.healedFriends.length === 0 || p.lastVisitMomentDate === date) return null;
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0;
  return p.healedFriends[h % p.healedFriends.length];
}

// ---- mutations (return a new object) ----

export interface AwardResult {
  progress: GameProgress;
  /** did this play complete a brand-new level? */
  newLevel: boolean;
  /** did Nilu just advance a growth stage? */
  grewUp: boolean;
  growthBefore: GrowthStage;
  growthAfter: GrowthStage;
  /** a cosmetic unlocked by finishing this level for the first time, if any */
  unlockedItem?: Cosmetic;
  /** sparkles gifted for replaying an already-finished level (0 on first plays) */
  replaySparkles: number;
  /** a My Day Book sticker earned by finishing this level for the FIRST time */
  dayBookSticker?: DayBookSticker;
}

/** Record a finished level. levelIdx is 0-based. stars is 1..3. Keeps the best.
 *  `slips` (gentle re-prompts during this play) and `rounds` (questions/steps
 *  played) accumulate lifetime into `practiceStats` — grown-ups-only, never
 *  shown to the child and never affects stars or no-fail behavior. */
export function awardLevel(
  p: GameProgress,
  zone: ActivityZone,
  levelIdx: number,
  stars: number,
  slips = 0,
  rounds = 1,
): AwardResult {
  const growthBefore = getGrowth(p).stage;
  const next: GameProgress = {
    ...p,
    islands: { ...p.islands, [zone]: { levelStars: [...p.islands[zone].levelStars] } },
    practiceStats: {
      ...p.practiceStats,
      [zone]: {
        slips: (p.practiceStats?.[zone]?.slips ?? 0) + Math.max(0, slips),
        rounds: (p.practiceStats?.[zone]?.rounds ?? 0) + Math.max(1, rounds),
      },
    },
  };
  const prevBest = next.islands[zone].levelStars[levelIdx] ?? 0;
  const wasIncomplete = prevBest === 0;
  // every finished level also yields a seed for the Home garden
  next.seeds = (p.seeds ?? 0) + 1;
  // replaying a finished level is never wasted: it harvests jar sparkles, so
  // revisiting a favourite island keeps feeding the Home garden economy
  const replaySparkles = wasIncomplete ? 0 : 3;
  next.jarSparkles = (p.jarSparkles ?? 0) + replaySparkles;
  next.islands[zone].levelStars[levelIdx] = Math.max(prevBest, Math.min(MAX_STARS_PER_LEVEL, stars));
  const growthAfter = getGrowth(next).stage;
  // a stage once reached is never lost
  next.growthFloor = Math.max(p.growthFloor ?? 0, growthAfter);

  // first-time level completion unlocks the next cosmetic
  let unlockedItem: Cosmetic | undefined;
  if (wasIncomplete) {
    next.unlocked = [...p.unlocked];
    const nextId = UNLOCK_ORDER.find((id) => !next.unlocked.includes(id));
    if (nextId) {
      next.unlocked.push(nextId);
      unlockedItem = cosmeticById(nextId);
      // auto-equip the very first thing they earn so the reward is visible
      if (!next.equipped[unlockedItem!.slot]) {
        next.equipped = { ...next.equipped, [unlockedItem!.slot]: nextId };
      }
    }
  }

  // first-time level completion also earns a My Day Book sticker (a small,
  // additive per-level keepsake — never lost, never re-earned on replay)
  let dayBookSticker: DayBookSticker | undefined;
  if (wasIncomplete) {
    const id = `${zone}-${levelIdx + 1}`;
    if (!p.dayBook.includes(id)) {
      const sticker = DAY_BOOK_STICKERS[id];
      next.dayBook = [...(p.dayBook ?? []), id];
      if (sticker) dayBookSticker = { id, ...sticker };
    }
  }

  return {
    progress: next,
    newLevel: wasIncomplete,
    grewUp: growthAfter > growthBefore,
    growthBefore,
    growthAfter,
    unlockedItem,
    replaySparkles,
    dayBookSticker,
  };
}

// ---- daily Star Quests (endgame remix content on fully-bloomed islands) ----

/** Is the once-a-day Star Quest on this island still waiting today? Only
 *  fully-bloomed islands host one — it's the endgame's daily ritual. */
export function starQuestAvailable(p: GameProgress, zone: ActivityZone, date: string = todayKey()): boolean {
  if (!isIslandComplete(p, zone)) return false;
  const done = p.starQuests.date === date ? p.starQuests.doneZones : [];
  return !done.includes(zone);
}

export const STAR_QUEST_SPARKLES = 5;

/** Mark today's Star Quest on an island done: a generous sparkle + seed gift. */
export function completeStarQuest(p: GameProgress, zone: ActivityZone, date: string = todayKey()): GameProgress {
  const done = p.starQuests.date === date ? p.starQuests.doneZones : [];
  if (done.includes(zone)) return p;
  return {
    ...p,
    starQuests: { date, doneZones: [...done, zone] },
    jarSparkles: p.jarSparkles + STAR_QUEST_SPARKLES,
    seeds: p.seeds + 1,
  };
}

/** Record a one-time achievement (no-op if already earned). */
export function earnAchievement(p: GameProgress, id: string): GameProgress {
  if (p.achievementsEarned.includes(id)) return p;
  return { ...p, achievementsEarned: [...p.achievementsEarned, id] };
}

/** Save the child's freshly-built calm plan (Calm Cove L5) so grown-ups can see it. */
export function saveCalmPlan(p: GameProgress, choices: string[]): GameProgress {
  if (choices.length === 0) return p;
  return { ...p, calmPlan: choices };
}

/** Zones ranked by how much gentle re-prompting they've needed (slips per
 *  round played), most-practiced first. Zones with no rounds yet are skipped —
 *  this is a "where might they want more support" signal, not a report card. */
export function topPracticeZones(p: GameProgress): { zone: ActivityZone; rate: number; slips: number; rounds: number }[] {
  return ZONES
    .map((zone) => {
      const s = p.practiceStats?.[zone] ?? { slips: 0, rounds: 0 };
      return { zone, slips: s.slips, rounds: s.rounds, rate: s.rounds > 0 ? s.slips / s.rounds : 0 };
    })
    .filter((z) => z.rounds > 0)
    .sort((a, b) => b.rate - a.rate);
}

export function equipCosmetic(p: GameProgress, slot: CosmeticSlot, id: string | null): GameProgress {
  const equipped = { ...p.equipped };
  if (id === null) delete equipped[slot];
  else equipped[slot] = id;
  return { ...p, equipped };
}
