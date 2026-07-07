// ---------------------------------------------------------------------------
// One-time achievements — gentle "look what you did!" moments, decoupled from
// the star/level ladder. All additive: an achievement is earned once, kept
// forever, and there is nothing to miss or lose. Checks read the existing
// progress + memory state, so earning them requires no new bookkeeping in the
// play layers.
// ---------------------------------------------------------------------------

import {
  type GameProgress,
  ZONES,
  MAX_LEVEL,
  completedLevels,
  totalCompletedLevels,
  isIslandComplete,
  getGrowth,
  plantStage,
  PLANT_MAX_STAGE,
} from './progress';
import type { BeluMemory } from './memory';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  /** kid-facing, literal, always positive */
  blurb: string;
  check: (p: GameProgress, m: BeluMemory) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_level',
    name: 'First Adventure',
    icon: '🌟',
    blurb: 'You finished your very first level!',
    check: (p) => totalCompletedLevels(p) >= 1,
  },
  {
    id: 'first_friend',
    name: 'Friend Helper',
    icon: '💛',
    blurb: 'You helped an animal friend feel better!',
    check: (p) => p.healedFriends.length >= 1,
  },
  {
    id: 'five_levels',
    name: 'Busy Explorer',
    icon: '🧭',
    blurb: 'Five levels finished — you are on a roll!',
    check: (p) => totalCompletedLevels(p) >= 5,
  },
  {
    id: 'island_bloom',
    name: 'Island Gardener',
    icon: '🌷',
    blurb: 'You made a whole island bloom!',
    check: (p) => ZONES.some((z) => isIslandComplete(p, z)),
  },
  {
    id: 'all_islands',
    name: 'World Bloomer',
    icon: '🌈',
    blurb: 'Every single island is fully bloomed. Wow!',
    check: (p) => ZONES.every((z) => isIslandComplete(p, z)),
  },
  {
    id: 'every_island_started',
    name: 'Bridge Walker',
    icon: '🌉',
    blurb: 'You played on every island in the world!',
    check: (p) => ZONES.every((z) => completedLevels(p, z) >= 1),
  },
  {
    id: 'sparkle_10',
    name: 'Sparkle Keeper',
    icon: '✨',
    blurb: 'Ten sparkles glowing in the jar!',
    check: (p) => p.jarSparkles >= 10,
  },
  {
    id: 'sparkle_50',
    name: 'Sparkle Star',
    icon: '🌠',
    blurb: 'FIFTY sparkles! The jar is shining bright.',
    check: (p) => p.jarSparkles >= 50,
  },
  {
    id: 'garden_flower',
    name: 'Flower Grower',
    icon: '🌸',
    blurb: 'A seed you planted opened into a flower!',
    check: (p) => p.garden.some((pl) => plantStage(pl.plantedDate) >= PLANT_MAX_STAGE),
  },
  {
    id: 'wardrobe_5',
    name: 'Snappy Dresser',
    icon: '🎩',
    blurb: 'Five wardrobe treasures for Nilu!',
    check: (p) => p.unlocked.length >= 5,
  },
  {
    id: 'visits_3',
    name: 'Coming Back',
    icon: '🗓️',
    blurb: 'You have visited on three different days!',
    check: (_p, m) => m.visitDays >= 3,
  },
  {
    id: 'visits_7',
    name: 'True Friend',
    icon: '💙',
    blurb: 'Seven visit days — Nilu is so happy to know you!',
    check: (_p, m) => m.visitDays >= 7,
  },
  {
    id: 'grown_up',
    name: 'All Grown Up',
    icon: '🐘',
    blurb: 'You helped Nilu grow all the way up!',
    check: (p) => getGrowth(p).stage >= 3,
  },
  {
    id: 'star_quest',
    name: 'Star Quester',
    icon: '⭐',
    blurb: 'You finished a golden Star Quest!',
    check: (p) => p.starQuests.doneZones.length >= 1,
  },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Achievements whose condition just became true but aren't earned yet. */
export function newlyEarned(p: GameProgress, m: BeluMemory): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !p.achievementsEarned.includes(a.id) && a.check(p, m));
}
