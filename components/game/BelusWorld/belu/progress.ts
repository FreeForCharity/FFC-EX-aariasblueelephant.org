// ---------------------------------------------------------------------------
// Progress + leveling.
// Every island has MAX_LEVEL levels. Finishing a level earns 1–3 stars (best
// score is kept — you can always replay to improve, never to lose). Stars feed
// two *visible* things the child strives for:
//   1. each island visibly BLOOMS as its levels are completed, and
//   2. Belu visibly GROWS UP as total stars rise (baby → child → teen → grown).
// No timers, no losing, no farming the same level past 3 stars.
// ---------------------------------------------------------------------------

export type ActivityZone = 'meadow' | 'mountain' | 'cove' | 'forest';

export const ZONES: ActivityZone[] = ['meadow', 'mountain', 'cove', 'forest'];
export const MAX_LEVEL = 5;
export const MAX_STARS_PER_LEVEL = 3;
export const MAX_STARS_PER_ISLAND = MAX_LEVEL * MAX_STARS_PER_LEVEL; // 15
export const MAX_TOTAL_STARS = MAX_STARS_PER_ISLAND * ZONES.length; // 60

export interface IslandProgress {
  /** best stars earned on each level (index 0..MAX_LEVEL-1); 0 = not completed */
  levelStars: number[];
}

export interface GameProgress {
  islands: Record<ActivityZone, IslandProgress>;
  /** cosmetic accessories the child has unlocked for Belu */
  unlocked: string[];
}

const KEY = 'belus_world_progress_v1';

function emptyIsland(): IslandProgress {
  return { levelStars: Array(MAX_LEVEL).fill(0) };
}

function defaults(): GameProgress {
  return {
    islands: {
      meadow: emptyIsland(),
      mountain: emptyIsland(),
      cove: emptyIsland(),
      forest: emptyIsland(),
    },
    unlocked: [],
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

// ---- totals ----

export function totalStars(p: GameProgress): number {
  return ZONES.reduce((sum, z) => sum + islandStars(p, z), 0);
}

export function totalCompletedLevels(p: GameProgress): number {
  return ZONES.reduce((sum, z) => sum + completedLevels(p, z), 0);
}

// ---- Belu growth (the headline reward) ----

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

// star thresholds for each growth stage
const GROWTH_THRESHOLDS = [0, 12, 28, 48];
const GROWTH_LABELS = ['Baby Belu', 'Little Belu', 'Big Belu', 'Grown-Up Belu'];
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
  return growthFromStars(totalStars(p));
}

// ---- mutations (return a new object) ----

export interface AwardResult {
  progress: GameProgress;
  /** did this play complete a brand-new level? */
  newLevel: boolean;
  /** did Belu just advance a growth stage? */
  grewUp: boolean;
  growthBefore: GrowthStage;
  growthAfter: GrowthStage;
}

/** Record a finished level. levelIdx is 0-based. stars is 1..3. Keeps the best. */
export function awardLevel(
  p: GameProgress,
  zone: ActivityZone,
  levelIdx: number,
  stars: number,
): AwardResult {
  const growthBefore = getGrowth(p).stage;
  const next: GameProgress = {
    ...p,
    islands: { ...p.islands, [zone]: { levelStars: [...p.islands[zone].levelStars] } },
  };
  const prevBest = next.islands[zone].levelStars[levelIdx] ?? 0;
  const wasIncomplete = prevBest === 0;
  next.islands[zone].levelStars[levelIdx] = Math.max(prevBest, Math.min(MAX_STARS_PER_LEVEL, stars));
  const growthAfter = getGrowth(next).stage;
  return {
    progress: next,
    newLevel: wasIncomplete,
    grewUp: growthAfter > growthBefore,
    growthBefore,
    growthAfter,
  };
}

export function unlockAccessory(p: GameProgress, id: string): GameProgress {
  if (p.unlocked.includes(id)) return p;
  return { ...p, unlocked: [...p.unlocked, id] };
}
