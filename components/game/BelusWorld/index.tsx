// ===========================================================================
// Nilu's World — a 3D floating-island adventure for kids on the autism
// spectrum. The child walks/jumps Nilu (a blue elephant) across magical sky
// islands. Each island teaches one ASD skill area across 5 levels. As the
// child earns stars, two things VISIBLY happen: Nilu grows up (baby → grown)
// and each island blooms. Nilu also remembers the child and grows a
// personality across visits, learning right alongside them.
//
// Designed against evidence-based ASD principles (see project memory):
// errorless / no-fail, no timers, predictable token rewards, First-Then visual
// supports, read-aloud narration, and full sensory comfort settings.
// ===========================================================================

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BeluEmotion } from './BeluCharacter';
import { ISLANDS, worldRuntime, type ZoneId } from './three/worldConfig';
import { attachKeyboard, queueGoHome } from './three/input';
import HUD from './ui/HUD';
import TouchControls from './ui/TouchControls';
import GrowthMap from './ui/GrowthMap';
import Wardrobe from './ui/Wardrobe';
import type { QuestStatus } from './three/quest/QuestLayer';
import {
  loadMemory,
  saveMemory,
  recordVisit,
  recordZoneVisit,
  recordMoment,
  addAchievement,
  setPlayerName,
  type BeluMemory,
} from './belu/memory';
import { getDialogue } from './belu/dialogue';
import {
  loadProgress,
  saveProgress,
  awardLevel,
  equipCosmetic,
  getGrowth,
  completedLevels,
  totalCompletedLevels,
  nextLevel,
  totalStars,
  todayKey,
  collectSparkle,
  plantSeed,
  recordHealedFriend,
  givePetal,
  todaysVisitor,
  sparklesFoundToday,
  plantStage,
  starQuestAvailable,
  completeStarQuest,
  STAR_QUEST_SPARKLES,
  earnAchievement,
  saveCalmPlan,
  topPracticeZones,
  isIslandComplete,
  islandStars,
  MAX_STARS_PER_ISLAND,
  MAX_LEVEL,
  DAY_ARC,
  dayStageComplete,
  isDayZoneUnlocked,
  recordDayStage,
  setDayChoice,
  markDayCelebrated,
  type GameProgress,
  type ActivityZone,
  type CosmeticSlot,
  ZONES,
} from './belu/progress';
import { newlyEarned, type Achievement } from './belu/achievements';
import type { AnimalSpecies } from './three/quest/Animal3D';
import { speakAloud, playSound, stopSpeaking } from './belu/feedback';

const GameCanvas = lazy(() => import('./three/GameCanvas'));

type Phase = 'intro' | 'world';

// Game pace 🐢🐇🚀 — kids who need more time stay Relaxed; kids who want it snappier
// go Fast. Scales how long Nilu's speech bubble lingers AND the read-aloud rate.
const SPEED = {
  relaxed: { ico: '🐢', label: 'Relaxed', dur: 1.5, rate: 0.82 },
  normal: { ico: '🐇', label: 'Normal', dur: 1.0, rate: 0.98 },
  fast: { ico: '🚀', label: 'Fast', dur: 0.55, rate: 1.35 },
} as const;
type SpeedKey = keyof typeof SPEED;
const SPEED_ORDER: SpeedKey[] = ['relaxed', 'normal', 'fast'];

interface Settings {
  reduceMotion: boolean;
  calmMode: boolean;
  sound: boolean;
  narration: boolean;
  speed: SpeedKey;
}

const SETTINGS_KEY = 'belus_world_settings_v1';
const DEFAULT_SETTINGS: Settings = { reduceMotion: false, calmMode: false, sound: true, narration: true, speed: 'normal' };
function loadSettings(): Settings {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    // No saved preference yet — respect the OS-level "prefers reduced motion"
    // signal so kids who need it get a calmer first run automatically.
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return { ...DEFAULT_SETTINGS, reduceMotion: !!prefersReduced };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

const STICKER_KEYS: Record<ActivityZone, string> = {
  meadow: '💛',
  mountain: '⛰️',
  cove: '🌊',
  forest: '🌳',
  shore: '🏖️',
  school: '🏫',
  afternoon: '🏡',
  night: '🌙',
};

// Nilu's Day arc — the four stages of one day, in order (☀️→🏫→🏡→🌙)
const DAY_STAGE_META: Record<string, { emoji: string; name: string }> = {
  mountain: { emoji: '☀️', name: 'Morning Mountain' },
  school: { emoji: '🏫', name: 'School Island' },
  afternoon: { emoji: '🏡', name: 'Fun Corner' },
  night: { emoji: '🌙', name: 'Sleepy Island' },
};

interface RewardInfo {
  stars: number;
  skill: string;
  levelUp: boolean;
  grewUp: boolean;
  growthLabel: string;
  islandMastered: boolean;
  unlockedItem?: { name: string; icon: string };
  /** this play also completed today's Star Quest on a fully-bloomed island */
  starQuest?: boolean;
  /** a brand-new badge earned by this play (first one, if several) */
  newBadge?: Achievement;
  /** a My Day Book sticker earned by finishing this level for the first time */
  dayBookSticker?: { emoji: string; label: string };
}

export default function BelusWorldGame() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [memory, setMemory] = useState<BeluMemory>(() => loadMemory());
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const [emotion, setEmotion] = useState<BeluEmotion>('happy');
  const [beluLine, setBeluLine] = useState<string | null>(null);
  const [nearZone, setNearZone] = useState<ZoneId | null>(null);
  const [questStatus, setQuestStatus] = useState<QuestStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [reward, setReward] = useState<RewardInfo | null>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [showGrownUpGate, setShowGrownUpGate] = useState(false);
  const [showGrownUps, setShowGrownUps] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const lineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const isTouch = useRef(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

  const growth = useMemo(() => getGrowth(progress), [progress]);
  const islandLevels = useMemo(
    () => Object.fromEntries(ZONES.map((z) => [z, completedLevels(progress, z)])) as Partial<Record<ZoneId, number>>,
    [progress],
  );
  const stickers = useMemo(
    () => ZONES.filter((z) => completedLevels(progress, z) > 0).map((z) => STICKER_KEYS[z]),
    [progress],
  );
  const islandNextLevel = useMemo(
    () => Object.fromEntries(ZONES.map((z) => [z, nextLevel(progress, z)])) as Record<ActivityZone, number>,
    [progress],
  );
  // the reward island forms once the child finishes their very first level
  const rainbowUnlocked = useMemo(() => totalCompletedLevels(progress) >= 1, [progress]);
  worldRuntime.rainbowUnlocked = rainbowUnlocked;

  // ---- Nilu's Day arc: each stage's island only forms once the previous
  // stage is complete (school ⇐ mountain 5/5, afternoon ⇐ school 5/5,
  // night ⇐ afternoon 5/5). 'fresh' players re-earn stages post-choice. ----
  const schoolUnlocked = useMemo(() => isDayZoneUnlocked(progress, 'school'), [progress]);
  const afternoonUnlocked = useMemo(() => isDayZoneUnlocked(progress, 'afternoon'), [progress]);
  const nightUnlocked = useMemo(() => isDayZoneUnlocked(progress, 'night'), [progress]);
  worldRuntime.schoolUnlocked = schoolUnlocked;
  worldRuntime.afternoonUnlocked = afternoonUnlocked;
  worldRuntime.nightUnlocked = nightUnlocked;
  const dayUnlocks = useMemo(
    () => ({ school: schoolUnlocked, afternoon: afternoonUnlocked, night: nightUnlocked }),
    [schoolUnlocked, afternoonUnlocked, nightUnlocked],
  );
  const unlockedDayZones = useMemo(
    () => (['school', 'afternoon', 'night'] as ActivityZone[]).filter((z) => dayUnlocks[z as 'school' | 'afternoon' | 'night']),
    [dayUnlocks],
  );

  // the one-time fresh/continue chooser (players updating with real progress)
  const needsDayChoice = progress.dayArc.choice === null && totalCompletedLevels(progress) > 0;
  // new players never see the chooser — they simply live the day in order
  useEffect(() => {
    if (progress.dayArc.choice === null && totalCompletedLevels(progress) === 0) {
      setProgress((p) => {
        if (p.dayArc.choice !== null) return p;
        const next = setDayChoice(p, 'continue');
        saveProgress(next);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);
  const handleDayChoice = useCallback((choice: 'fresh' | 'continue') => {
    setProgress((p) => {
      const next = setDayChoice(p, choice);
      saveProgress(next);
      return next;
    });
    playSound('tap', settingsRef.current.sound);
  }, []);

  // island-forming celebration — fires once per day-arc island, the moment its
  // unlock condition flips true (and any reward toast is out of the way)
  const [islandFormed, setIslandFormed] = useState<{ zone: ActivityZone; label: string; emoji: string } | null>(null);

  // ---- Home life: daily sparkles, garden, jar, remembered friends ----
  const dateKey = todayKey();

  // Star Quest chip: a small ⭐ glow when Nilu is standing on a fully-bloomed
  // island that still has its once-a-day Star Quest waiting to be replayed.
  const starQuestZone = useMemo(() => {
    if (!nearZone || nearZone === 'home' || nearZone === 'rainbow') return null;
    return starQuestAvailable(progress, nearZone as ActivityZone, dateKey) ? nearZone : null;
  }, [nearZone, progress, dateKey]);

  const sparklesFound = useMemo(() => sparklesFoundToday(progress, dateKey), [progress, dateKey]);
  const visitor = useMemo(() => todaysVisitor(progress) as AnimalSpecies | null, [progress]);

  // Nilu speaks: speech bubble + (optional) read-aloud narration.
  const speak = useCallback((line: string) => {
    setBeluLine(line);
    const sp = SPEED[settingsRef.current.speed] || SPEED.normal;
    speakAloud(line, settingsRef.current.narration, { rate: 0.95 * sp.rate });
    if (lineTimer.current) clearTimeout(lineTimer.current);
    // keep the bubble up long enough to read — by length, scaled by game speed
    const ms = Math.max(4000, line.length * 95) * sp.dur;
    lineTimer.current = setTimeout(() => setBeluLine(null), ms);
  }, []);

  // ---- island-forming celebration (once per island; waits for reward toast) ----
  useEffect(() => {
    if (phase !== 'world' || reward !== null || islandFormed !== null) return;
    if (progress.dayArc.choice === null) return; // chooser still open
    const unlockedFlags: Record<'school' | 'afternoon' | 'night', boolean> = dayUnlocks;
    for (const z of ['school', 'afternoon', 'night'] as const) {
      if (!unlockedFlags[z] || progress.dayArc.celebrated.includes(z)) continue;
      const isl = ISLANDS[z];
      setProgress((p) => {
        const next = markDayCelebrated(p, z);
        if (next !== p) saveProgress(next);
        return next;
      });
      setIslandFormed({ zone: z, label: isl.label, emoji: isl.emoji });
      playSound('growup', settingsRef.current.sound);
      speak(`Look! A new island appeared — ${isl.label}! Let's go!`);
      setEmotion('excited');
      break; // one celebration at a time
    }
  }, [phase, reward, islandFormed, progress, dayUnlocks, speak]);

  // persist comfort + speed settings so they don't reset each visit
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings]);

  // stamp "last game played" so the Home page's smart Play button can offer
  // to resume Nilu's World alongside the other static games
  useEffect(() => {
    try {
      localStorage.setItem('abe_last_game', JSON.stringify({
        url: '/nelus-world',
        name: "Nilu's World",
        emoji: '🌈',
        at: Date.now(),
      }));
    } catch { /* ignore */ }
  }, []);

  const cycleSpeed = useCallback(() => {
    setSettings((s) => {
      const next = SPEED_ORDER[(SPEED_ORDER.indexOf(s.speed) + 1) % SPEED_ORDER.length];
      playSound('tap', s.sound);
      return { ...s, speed: next };
    });
  }, []);

  // one-tap master mute — flips the same settings.sound the settings panel
  // uses, and cancels any speech already in flight so it doesn't keep talking
  const toggleMute = useCallback(() => {
    setSettings((s) => {
      const next = !s.sound;
      if (!next) stopSpeaking();
      return { ...s, sound: next };
    });
  }, []);

  function start(name: string) {
    // did the garden grow while the child was away? (checked BEFORE the visit
    // stamp updates, so "away" means since the previous session)
    const prevDate = memory.lastVisit ? memory.lastVisit.slice(0, 10) : null;
    let gardenLine: string | null = null;
    if (prevDate) {
      const opened = progress.garden.some(
        (pl) => plantStage(pl.plantedDate, dateKey) >= 3 && plantStage(pl.plantedDate, prevDate) < 3,
      );
      const grew = progress.garden.some(
        (pl) => plantStage(pl.plantedDate, dateKey) > plantStage(pl.plantedDate, prevDate),
      );
      if (opened) gardenLine = 'Our flower opened while you were away! 🌸 Come see — it even has a butterfly!';
      else if (grew) gardenLine = 'Psst — our garden grew while you were away! 🌱 Come look!';
    }

    let m = setPlayerName(memory, name);   // personalize Nilu's greetings
    m = recordVisit(m);
    saveMemory(m);
    setMemory(m);
    setPhase('world');
    const greetKey = m.visitCount <= 1 ? 'greeting_first' : 'greeting_return';
    setTimeout(() => speak(getDialogue(greetKey, { memory: m })), 700);
    if (gardenLine) setTimeout(() => speak(gardenLine!), 7000);
  }

  useEffect(() => {
    if (phase !== 'world') return;
    const detach = attachKeyboard();
    return () => {
      detach();
      stopSpeaking();
      if (lineTimer.current) clearTimeout(lineTimer.current);
    };
  }, [phase]);

  const paused = showSettings || showMap || reward !== null || showWardrobe || showExitConfirm || manualPause || showGrownUpGate || showGrownUps || needsDayChoice;

  const handleProximity = useCallback((zone: ZoneId | null) => {
    setNearZone(zone);
    if (zone && zone !== 'home') setEmotion('curious');
  }, []);

  // a sound helper bound to the current sound setting
  const sfx = useCallback((kind: Parameters<typeof playSound>[0]) => {
    playSound(kind, settingsRef.current.sound);
  }, []);

  const handleEquip = useCallback((slot: CosmeticSlot, id: string | null) => {
    setProgress((p) => {
      const next = equipCosmetic(p, slot, id);
      saveProgress(next);
      return next;
    });
    playSound('tap', settingsRef.current.sound);
  }, []);

  // ---- Home life handlers (all additive, all persisted via progress) ----
  const sparkleLine = useRef(0);
  const handleCollectSparkle = useCallback((id: string) => {
    setProgress((p) => {
      const next = collectSparkle(p, id);
      if (next !== p) saveProgress(next);
      return next;
    });
    playSound('star', settingsRef.current.sound);
    setEmotion('excited');
    // the flavor varies, the outcome never does: sparkle → jar glow + a seed
    const lines = [
      'A sparkle! ✨ Into our jar it goes — and look, a seed for the garden!',
      'Ooh, you found a sparkle! ✨ Our jar glows a little brighter.',
      'A hidden sparkle! ✨ That earns us a garden seed too!',
    ];
    speak(lines[sparkleLine.current++ % lines.length]);
  }, [speak]);

  const handlePlant = useCallback(() => {
    // HomeLife only calls this when a seed + a free plot are available
    setProgress((p) => {
      const next = plantSeed(p);
      if (next !== p) saveProgress(next);
      return next;
    });
    playSound('correct', settingsRef.current.sound);
    speak('We planted a seed! 🌱 Come back tomorrow and see it grow.');
  }, [speak]);

  const handleFriendHealed = useCallback((species: string) => {
    setProgress((p) => {
      const next = recordHealedFriend(p, species);
      if (next !== p) saveProgress(next);
      return next;
    });
  }, []);

  const handlePetal = useCallback(() => {
    setProgress((p) => {
      const next = givePetal(p);
      saveProgress(next);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    // rootRef exists in the world; on the intro menu fall back to the whole page
    const el = rootRef.current ?? document.documentElement;
    el.requestFullscreen?.().catch(() => {});
  }, []);

  const handleQuestComplete = useCallback(
    (zone: ActivityZone, level: number, stars: number, moment: string, slips: number = 0, calmChoices?: string[]) => {
      // was today's Star Quest still waiting on this (already-bloomed) island?
      // checked BEFORE awarding, since awardLevel doesn't change bloom status here.
      const questWasAvailable = starQuestAvailable(progress, zone, dateKey);
      const res = awardLevel(progress, zone, level - 1, stars, slips, 1);
      let nextProgress = res.progress;
      if (calmChoices && calmChoices.length > 0) nextProgress = saveCalmPlan(nextProgress, calmChoices);

      // Nilu's Day arc: finishing the island's current task (first completed
      // level) AFTER the fresh/continue choice records the stage — the next
      // island forms immediately. This is what the 'fresh' gating path reads.
      if (completedLevels(nextProgress, zone) >= 1) {
        nextProgress = recordDayStage(nextProgress, zone);
      }

      let starQuestDone = false;
      if (questWasAvailable) {
        const withQuest = completeStarQuest(nextProgress, zone, dateKey);
        if (withQuest !== nextProgress) {
          starQuestDone = true;
          nextProgress = withQuest;
        }
      }

      // personality memory (separate from leveling)
      let m = recordZoneVisit(memory, zone);
      m = recordMoment(m, moment);
      m = addAchievement(m, `${ISLANDS[zone].label} L${level}`);

      // one-time achievements: check against the freshest progress + memory,
      // right after the natural "finished a level" moment
      const earned = newlyEarned(nextProgress, m);
      for (const a of earned) nextProgress = earnAchievement(nextProgress, a.id);

      saveProgress(nextProgress);
      setProgress(nextProgress);
      saveMemory(m);
      setMemory(m);

      const mastered = completedLevels(nextProgress, zone) >= 5;
      setEmotion('excited');
      playSound(res.grewUp ? 'growup' : res.newLevel ? 'levelup' : 'star', settingsRef.current.sound);
      setReward({
        stars,
        skill: ISLANDS[zone].label,
        levelUp: res.newLevel,
        grewUp: res.grewUp,
        growthLabel: getGrowth(nextProgress).label,
        islandMastered: mastered,
        unlockedItem: res.unlockedItem ? { name: res.unlockedItem.name, icon: res.unlockedItem.icon } : undefined,
        starQuest: starQuestDone,
        newBadge: earned[0],
        dayBookSticker: res.dayBookSticker
          ? { emoji: res.dayBookSticker.emoji, label: res.dayBookSticker.label }
          : undefined,
      });
    },
    [progress, memory, dateKey],
  );

  // Badges that aren't tied to finishing a level (sparkle jar milestones, a
  // garden flower opening on a new day, visit-day streak, etc.) are caught
  // here — a passive safety net so nothing is missed. Award-then-no-op is
  // safe: newlyEarned only returns ids not already in achievementsEarned, so
  // this settles after one extra render with no loop.
  useEffect(() => {
    const earned = newlyEarned(progress, memory);
    if (earned.length === 0) return;
    let next = progress;
    for (const a of earned) next = earnAchievement(next, a.id);
    saveProgress(next);
    setProgress(next);
  }, [progress, memory]);

  if (phase === 'intro') {
    return (
      <IntroScreen
        memory={memory}
        growthLabel={growth.label}
        reduceMotion={settings.reduceMotion || settings.calmMode}
        onStart={start}
        onToggleFullscreen={toggleFullscreen}
      />
    );
  }

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 overflow-hidden bg-[#bfe2ff]">
      <Suspense fallback={<LoadingWorld />}>
        <GameCanvas
          emotion={emotion}
          paused={paused}
          reduceMotion={settings.reduceMotion}
          calmMode={settings.calmMode}
          activeZone={nearZone}
          growthScale={growth.scale}
          growthStage={growth.stage}
          equipped={progress.equipped}
          islandLevels={islandLevels}
          rainbowUnlocked={rainbowUnlocked}
          dayUnlocks={dayUnlocks}
          unlockedDayZones={unlockedDayZones}
          islandNextLevel={islandNextLevel}
          sound={settings.sound}
          dateKey={dateKey}
          jarCount={progress.jarSparkles}
          seeds={progress.seeds}
          garden={progress.garden}
          sparklesFound={sparklesFound}
          healedFriends={progress.healedFriends}
          visitor={visitor}
          onCollectSparkle={handleCollectSparkle}
          onPlant={handlePlant}
          onPetal={handlePetal}
          onFriendHealed={handleFriendHealed}
          onProximity={handleProximity}
          speak={speak}
          setEmotion={setEmotion}
          playSound={sfx}
          onQuestComplete={handleQuestComplete}
          onQuestStatus={setQuestStatus}
        />
      </Suspense>

      <HUD
        beluLine={beluLine}
        nearZone={questStatus ? null : nearZone}
        starQuestZone={questStatus ? null : starQuestZone}
        stickers={stickers}
        totalStars={totalStars(progress)}
        isTouch={isTouch.current}
        onOpenSettings={() => setShowSettings(true)}
        onOpenMap={() => setShowMap(true)}
        onOpenWardrobe={() => setShowWardrobe(true)}
        onToggleFullscreen={toggleFullscreen}
        onGoHome={() => { queueGoHome(); sfx('tap'); }}
        onExit={() => { sfx('tap'); setShowExitConfirm(true); }}
        onPause={() => { sfx('tap'); setManualPause(true); }}
        onCycleSpeed={cycleSpeed}
        speedLabel={SPEED[settings.speed].label}
        onToggleMute={toggleMute}
        muted={!settings.sound}
      />

      <AnimatePresence>
        {questStatus && !paused && (
          <QuestPanel status={questStatus} />
        )}
      </AnimatePresence>

      {/* Nilu's Day plan — ☀️→🏫→🏡→🌙, always visible so the child can see
          where they are in the day */}
      {!paused && (
        <DayPlanChip
          progress={progress}
          reduceMotion={settings.reduceMotion || settings.calmMode}
          onSpeakGoal={(line) => { speak(line); playSound('tap', settingsRef.current.sound); }}
        />
      )}

      {!paused && <TouchControls />}

      {/* one-time fresh/continue chooser for players updating into Nilu's Day */}
      <AnimatePresence>
        {needsDayChoice && (
          <FreshDayModal onChoose={handleDayChoice} />
        )}
      </AnimatePresence>

      {/* "a new island formed!" celebration toast */}
      <AnimatePresence>
        {islandFormed && (
          <IslandFormedToast
            info={islandFormed}
            reduceMotion={settings.reduceMotion || settings.calmMode}
            onClose={() => setIslandFormed(null)}
          />
        )}
      </AnimatePresence>

      {/* Reward / celebration */}
      <AnimatePresence>
        {reward && (
          <RewardToast
            reward={reward}
            reduceMotion={settings.reduceMotion || settings.calmMode}
            onClose={() => setReward(null)}
          />
        )}
      </AnimatePresence>

      {/* Growth map */}
      <AnimatePresence>{showMap && <GrowthMap progress={progress} memory={memory} onClose={() => setShowMap(false)} />}</AnimatePresence>

      {/* Wardrobe */}
      <AnimatePresence>
        {showWardrobe && <Wardrobe progress={progress} onEquip={handleEquip} onClose={() => setShowWardrobe(false)} />}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            onClose={() => setShowSettings(false)}
            onOpenGrownUps={() => { setShowSettings(false); setShowGrownUpGate(true); }}
          />
        )}
      </AnimatePresence>

      {/* For grown-ups — a simple typed-math gate before any stats are shown,
          so a curious child doesn't wander into a read-only parent report */}
      <AnimatePresence>
        {showGrownUpGate && (
          <GrownUpGate
            onCancel={() => setShowGrownUpGate(false)}
            onUnlock={() => { setShowGrownUpGate(false); setShowGrownUps(true); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGrownUps && (
          <GrownUpsPanel progress={progress} memory={memory} onClose={() => setShowGrownUps(false)} />
        )}
      </AnimatePresence>

      {/* Exit confirm — a small, calm check before leaving, kept visually
          distinct from the settings gear so a stray tap never boots a child
          out of the world without warning */}
      <AnimatePresence>
        {showExitConfirm && (
          <ExitConfirm
            onStay={() => setShowExitConfirm(false)}
            onLeave={() => { stopSpeaking(); window.history.back(); }}
          />
        )}
      </AnimatePresence>

      {/* Manual pause — a calm full-screen break, separate from panel-pausing */}
      <AnimatePresence>
        {manualPause && <PauseOverlay onResume={() => setManualPause(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------

function IntroScreen({ memory, growthLabel, reduceMotion, onStart, onToggleFullscreen }: { memory: BeluMemory; growthLabel: string; reduceMotion: boolean; onStart: (name: string) => void; onToggleFullscreen: () => void }) {
  const returning = memory.visitCount > 0;
  const [name, setName] = useState(memory.playerName ?? 'Aaria');
  const [showHow, setShowHow] = useState(false);
  const RAINBOW = 'linear-gradient(90deg,#ff5e7e,#ffa94d,#ffd43b,#69db7c,#4dabf7,#b197fc)';
  const play = () => onStart(name.trim() || 'friend');

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto p-6 text-center"
      style={{ background: 'linear-gradient(180deg,#7ec8ff 0%,#b9e7ff 45%,#baf2bb 100%)' }}
    >
      {/* drifting clouds — stand still under reduce motion */}
      {!reduceMotion &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute text-6xl opacity-80"
            style={{ top: `${10 + i * 24}%` }}
            initial={{ left: '-20%' }}
            animate={{ left: '120%' }}
            transition={{ duration: 30 + i * 10, repeat: Infinity, ease: 'linear' }}
          >
            ☁️
          </motion.div>
        ))}
      {reduceMotion &&
        [0, 1, 2].map((i) => (
          <div key={i} className="pointer-events-none absolute text-6xl opacity-60" style={{ top: `${10 + i * 24}%`, left: `${20 + i * 30}%` }}>
            ☁️
          </div>
        ))}

      {/* org logo — gentle pop-in, then a soft float (float skipped under reduce motion) */}
      <motion.div
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        <motion.img
          src="/abe-logo.png"
          alt="Aaria's Blue Elephant — Building a New Inclusive World"
          className="w-[min(36vh,210px)] rounded-full"
          style={{ boxShadow: '0 10px 28px rgba(20,40,90,.3)' }}
          animate={reduceMotion ? {} : { y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* rainbow title — bounce skipped under reduce motion */}
      <motion.h1
        className="text-5xl font-black drop-shadow-sm sm:text-6xl"
        style={{ backgroundImage: RAINBOW, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
        animate={reduceMotion ? {} : { y: [0, -10, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        Nilu's World
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-xl text-base font-extrabold sm:text-lg"
        style={{ color: '#246' }}
      >
        Built for <span className="text-pink-500">Aaria and Her Friends</span> 💖 — explore islands, meet friends &amp; help Nilu grow!
      </motion.p>

      <motion.a
        href="/legal/disclosure.html"
        target="_blank"
        rel="noopener"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.35 }}
        className="text-xs underline opacity-70 hover:opacity-100"
      >
        General Disclosure
      </motion.a>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-3xl tracking-[0.25em] sm:text-4xl"
      >
        🐘🌸⛰️🌊🌳🌈
      </motion.div>

      {returning && (
        <p className="max-w-md text-sm font-semibold text-sky-900/70">
          Welcome back! {growthLabel} is waiting on the sky islands. 🌈
        </p>
      )}

      {/* who is playing? — personalizes Nilu's greetings */}
      <div className="mt-1 flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-2.5">
        <label htmlFor="beluName" className="text-base font-bold text-sky-900">Who is playing?</label>
        <input
          id="beluName"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') play(); }}
          className="w-44 rounded-xl border-[3px] border-sky-300 bg-white px-3 py-1.5 text-center text-lg font-bold text-blue-700 outline-none focus:border-sky-400"
        />
      </div>

      {/* big Play */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={play}
        className="mt-2 rounded-full bg-gradient-to-b from-green-300 to-green-500 px-14 py-4 text-2xl font-black text-green-950 shadow-[0_6px_0_#2f9e44,0_10px_18px_rgba(0,0,0,0.18)] active:translate-y-1"
      >
        {returning ? 'Continue ✨' : '▶ Play!'}
      </motion.button>

      {/* secondary buttons */}
      <div className="mt-1 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setShowHow(true)}
          className="rounded-full bg-gradient-to-b from-amber-300 to-orange-400 px-7 py-2.5 text-base font-bold text-amber-950 shadow-[0_5px_0_#e8920c,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-1"
        >
          ❓ How to Play
        </button>
        <button
          onClick={onToggleFullscreen}
          className="rounded-full bg-gradient-to-b from-amber-300 to-orange-400 px-7 py-2.5 text-base font-bold text-amber-950 shadow-[0_5px_0_#e8920c,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-1"
        >
          ⛶ Full Screen
        </button>
      </div>

      <p className="mt-2 rounded-full bg-white/55 px-5 py-2 text-xs font-semibold text-sky-900/70">
        A game from <b>Aaria's Blue Elephant</b> 🐘💙 · aariasblueelephant.org
      </p>

      <AnimatePresence>{showHow && <HowToPlay onClose={() => setShowHow(false)} />}</AnimatePresence>
    </div>
  );
}

// Friendly "How to Play" card for the landing page — controls + the no-fail promise.
function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,40,80,0.45)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9 }}
        className="w-full max-w-md rounded-[26px] bg-gradient-to-b from-white to-sky-50 p-7 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl">🐘💙</div>
        <h2 className="mt-2 text-2xl font-black text-sky-700">How to Play</h2>
        <div className="mt-4 space-y-2 text-left text-base font-semibold text-slate-700">
          <p>🕹️ <b>Arrows or the joystick</b> — walk Nilu around</p>
          <p>⬆️ <b>Jump button</b> — hop over things</p>
          <p>✋ <b>Drag</b> the world to look around</p>
          <p>🫧 <b>Walk into glowing orbs</b> (or tap them) to help your friends</p>
          <p>⭐ Earn stars to help <b>Nilu grow up</b> and bloom the islands</p>
          <p>💙 There is <b>no way to lose</b> — just explore and have fun!</p>
        </div>
        <button
          onClick={onClose}
          className="mt-6 rounded-full bg-green-500 px-9 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95"
        >
          Let's play! 🎮
        </button>
      </motion.div>
    </motion.div>
  );
}

function LoadingWorld() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center" style={{ background: '#bfe2ff' }}>
      <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-7xl">
        🐘
      </motion.div>
      <p className="mt-4 text-lg font-bold text-sky-700">Floating up to the islands…</p>
    </div>
  );
}

// The persistent "what to do right now" task card, pinned top-center. Keeps the
// current question + progress on screen so the child always knows the next step.
function QuestPanel({ status }: { status: QuestStatus }) {
  const correct = status.phase === 'correct';
  return (
    <motion.div
      key="questpanel"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="pointer-events-none fixed left-1/2 top-20 z-30 w-[min(92vw,460px)] -translate-x-1/2"
    >
      <div
        className="rounded-3xl px-5 py-3 text-center shadow-2xl backdrop-blur"
        style={{
          background: correct
            ? 'linear-gradient(140deg,#eafff0,#ffffff)'
            : `linear-gradient(140deg,#ffffff,${status.accent}22)`,
          border: `2px solid ${correct ? '#69db7c' : status.accent}`,
        }}
      >
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
          <span className="text-base">{status.emoji}</span>
          <span>{status.title}</span>
          <span className="text-slate-300">·</span>
          <span>Level {status.level}</span>
        </div>

        {/* progress dots */}
        <div className="mt-1 flex justify-center gap-1.5">
          {Array.from({ length: status.total }).map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === status.step ? 20 : 8,
                background: i < status.step || correct ? '#69db7c' : i === status.step ? status.accent : '#d8e0ec',
              }}
            />
          ))}
        </div>

        <motion.p
          key={status.instruction}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mt-2 font-extrabold ${correct ? 'text-green-600 text-xl' : 'text-slate-800 text-base'}`}
        >
          {correct ? '🎉 ' + status.instruction : status.instruction}
        </motion.p>

        {!correct && (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {status.hint ?? 'Walk Nilu into the matching glowing orb 🫧 (or tap it)'}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Nilu's Day plan chip — ☀️→🏫→🏡→🌙. Completed stages are bright, locked ones
// dimmed, the current one pulses gently. Tapping it speaks the current goal.
// ---------------------------------------------------------------------------
function DayPlanChip({ progress, reduceMotion, onSpeakGoal }: { progress: GameProgress; reduceMotion: boolean; onSpeakGoal: (line: string) => void }) {
  const done = DAY_ARC.map((z) => dayStageComplete(progress, z));
  const unlocked = DAY_ARC.map((z) => isDayZoneUnlocked(progress, z));
  const currentIdx = done.findIndex((d) => !d); // -1 → the whole day is done
  const tap = () => {
    if (currentIdx === -1) onSpeakGoal('You finished the whole day — morning to night! Amazing! 🌙✨');
    else onSpeakGoal(`Next: finish ${DAY_STAGE_META[DAY_ARC[currentIdx]].name}!`);
  };
  return (
    <button
      onClick={tap}
      className="fixed left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur transition hover:bg-white"
      aria-label="Nilu's day plan"
      title="Nilu's day — tap to hear what's next"
    >
      {DAY_ARC.map((z, i) => {
        const meta = DAY_STAGE_META[z];
        const isCurrent = i === currentIdx;
        const isDim = !done[i] && !isCurrent && !unlocked[i];
        return (
          <span key={z} className="flex items-center">
            {i > 0 && <span className="mx-0.5 text-[10px] text-slate-300">→</span>}
            {isCurrent && !reduceMotion ? (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="text-base"
              >
                {meta.emoji}
              </motion.span>
            ) : (
              <span
                className="text-base"
                style={{
                  opacity: done[i] || isCurrent ? 1 : 0.35,
                  filter: isDim ? 'grayscale(1)' : 'none',
                }}
              >
                {meta.emoji}
              </span>
            )}
          </span>
        );
      })}
    </button>
  );
}

// ---------------------------------------------------------------------------
// One-time gentle chooser when a player with existing progress updates into
// the Nilu's Day world. 'Fresh' re-lives the day (stages re-earned); 'Keep
// going' counts everything already done (School may form right away).
// ---------------------------------------------------------------------------
function FreshDayModal({ onChoose }: { onChoose: (choice: 'fresh' | 'continue') => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,28,46,0.5)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92 }}
        className="w-full max-w-sm rounded-[26px] bg-gradient-to-b from-white to-sky-50 p-7 text-center shadow-2xl"
      >
        <div className="text-5xl">🌅🐘</div>
        <h2 className="mt-2 text-2xl font-black text-sky-700">Nilu's world grew! ✨</h2>
        <p className="mt-2 text-base font-semibold text-slate-600">
          A whole day of adventures is here — morning ☀️, school 🏫, play time 🏡 and bedtime 🌙.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={() => onChoose('fresh')}
            className="rounded-full bg-gradient-to-b from-amber-300 to-orange-400 py-3 text-base font-bold text-amber-950 shadow-[0_5px_0_#e8920c,0_8px_14px_rgba(0,0,0,0.15)] transition active:translate-y-1"
          >
            ☀️ Start a fresh day
          </button>
          <button
            onClick={() => onChoose('continue')}
            className="rounded-full bg-gradient-to-b from-green-300 to-green-500 py-3 text-base font-bold text-green-950 shadow-[0_5px_0_#2f9e44,0_8px_14px_rgba(0,0,0,0.15)] transition active:translate-y-1"
          >
            ▶️ Keep going where I was
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// "A new island formed!" — a bright, once-per-island celebration toast.
// ---------------------------------------------------------------------------
function IslandFormedToast({ info, reduceMotion, onClose }: { info: { zone: ActivityZone; label: string; emoji: string }; reduceMotion: boolean; onClose: () => void }) {
  // gently auto-dismiss so it never blocks play for long
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-x-0 top-1/3 z-50 flex justify-center px-6"
    >
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { scale: 0.7, y: 24 }}
        animate={reduceMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.85 }}
        transition={reduceMotion ? { duration: 0.25 } : { type: 'spring', stiffness: 240, damping: 18 }}
        className="pointer-events-auto relative rounded-[26px] bg-white px-8 py-6 text-center shadow-2xl"
        onClick={onClose}
      >
        {!reduceMotion && Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              className="absolute left-1/2 top-8 text-lg"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos(a) * 110, y: Math.sin(a) * 110, opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.1 }}
            >
              {['✨', '🌈', '⭐'][i % 3]}
            </motion.span>
          );
        })}
        <div className="text-6xl">{info.emoji}</div>
        <h2 className="mt-2 text-xl font-black text-slate-800">A new island appeared!</h2>
        <p className="mt-1 text-base font-bold text-sky-600">{info.label} just formed in the sky ✨</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">Follow the new rainbow bridge to explore!</p>
        <button
          onClick={onClose}
          className="mt-4 rounded-full bg-sky-500 px-7 py-2.5 text-base font-bold text-white shadow-lg transition active:scale-95"
        >
          Let's go! →
        </button>
      </motion.div>
    </motion.div>
  );
}

function RewardToast({ reward, reduceMotion, onClose }: { reward: RewardInfo; reduceMotion: boolean; onClose: () => void }) {
  const headline = reward.grewUp ? 'Nilu Grew Up!' : reward.levelUp ? 'Level Complete!' : 'Great Job!';
  const hero = reward.grewUp ? '🐘✨' : reward.islandMastered ? '🌷' : '⭐';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,28,46,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, y: 40 }}
        animate={reduceMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.8 }}
        transition={reduceMotion ? { duration: 0.25 } : { type: 'spring', stiffness: 240, damping: 18 }}
        className="relative rounded-[28px] bg-white px-8 py-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* particle burst — a fun flourish, but never forced on a child who
            finds motion overwhelming */}
        {!reduceMotion && Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              className="absolute left-1/2 top-12 text-xl"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos(a) * 140, y: Math.sin(a) * 140, opacity: 0 }}
              transition={{ duration: 1.2, delay: 0.1 }}
            >
              {['✨', '⭐', '🌟'][i % 3]}
            </motion.span>
          );
        })}

        {reduceMotion ? (
          <div className="text-7xl">{hero}</div>
        ) : (
          <motion.div
            animate={{ scale: [1, 1.18, 1], rotate: reward.grewUp ? [0, 6, -6, 0] : 0 }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="text-7xl"
          >
            {hero}
          </motion.div>
        )}

        <h2 className="mt-3 text-2xl font-black text-slate-800">{headline}</h2>

        {/* stars earned */}
        <div className="mt-2 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: i < reward.stars ? 1 : 0.6, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.15, type: 'spring' }}
              className="text-3xl"
              style={{ filter: i < reward.stars ? 'none' : 'grayscale(1) opacity(0.4)' }}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <p className="mt-2 font-semibold text-slate-500">You grew your “{reward.skill}” skill 🌱</p>

        {reward.grewUp && (
          <p className="mt-3 rounded-2xl bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
            🎉 Nilu is now {reward.growthLabel}! You helped Nilu grow.
          </p>
        )}
        {reward.islandMastered && !reward.grewUp && (
          <p className="mt-3 rounded-2xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
            🌷 You fully bloomed this island!
          </p>
        )}
        {reward.unlockedItem && (
          <p className="mt-3 rounded-2xl bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
            🎁 New for Nilu: {reward.unlockedItem.icon} {reward.unlockedItem.name}! Tap 🎩 to wear it.
          </p>
        )}
        {reward.starQuest && (
          <p className="mt-3 rounded-2xl bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700">
            ⭐ Today's Star Quest complete! +{STAR_QUEST_SPARKLES} sparkles for the jar!
          </p>
        )}
        {reward.newBadge && (
          <p className="mt-3 rounded-2xl bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
            {reward.newBadge.icon} New badge: {reward.newBadge.name}! Check My Badges on the map.
          </p>
        )}
        {reward.dayBookSticker && (
          <p className="mt-3 rounded-2xl bg-pink-100 px-4 py-2 text-sm font-bold text-pink-700">
            📖 New Day Book sticker: {reward.dayBookSticker.emoji} {reward.dayBookSticker.label}
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-5 rounded-full bg-sky-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95"
        >
          Keep exploring →
        </button>
      </motion.div>
    </motion.div>
  );
}

// Small, calm "are you sure?" before leaving the world — visually distinct
// (warm/soft, no gear icon, no settings toggles) from the Comfort Settings panel.
function ExitConfirm({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,28,46,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onStay}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92 }}
        className="w-full max-w-xs rounded-[24px] bg-gradient-to-b from-white to-amber-50 p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl">🌈🐘</div>
        <h2 className="mt-2 text-lg font-extrabold text-slate-800">Leave Nilu's World? 🌈</h2>
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={onStay}
            className="rounded-full bg-green-500 py-3 text-base font-bold text-white shadow-lg transition active:scale-95"
          >
            Stay and play
          </button>
          <button
            onClick={onLeave}
            className="rounded-full bg-slate-100 py-3 text-base font-bold text-slate-500 transition active:scale-95"
          >
            Leave
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// A calm full-screen break — reuses the existing `paused` wiring so the 3D
// world truly stops (no timers, no penalty; the child resumes whenever ready).
function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 p-6 text-center"
      style={{ background: 'rgba(30,60,110,0.75)', backdropFilter: 'blur(10px)' }}
    >
      <div className="text-6xl">💙</div>
      <h2 className="text-2xl font-black text-white">Taking a break 💙</h2>
      <p className="max-w-xs text-sm font-semibold text-white/80">Nilu is waiting patiently. Come back whenever you're ready.</p>
      <button
        onClick={onResume}
        className="mt-1 rounded-full bg-green-400 px-10 py-4 text-xl font-black text-green-950 shadow-[0_6px_0_#2f9e44,0_10px_18px_rgba(0,0,0,0.25)] transition active:translate-y-1"
      >
        Keep playing ▶️
      </button>
    </motion.div>
  );
}

function SettingsPanel({
  settings,
  onChange,
  onClose,
  onOpenGrownUps,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
  onOpenGrownUps: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,28,46,0.5)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92 }}
        className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-800">Comfort Settings</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">Make Nilu's World feel just right for you. 💙</p>

        {/* Game speed — more time to read/listen 🐢 or snappier 🚀 */}
        <div className="mb-3 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 font-bold text-slate-700">🎛️ Game speed</div>
          <div className="flex gap-2">
            {SPEED_ORDER.map((k) => (
              <button
                key={k}
                onClick={() => onChange({ ...settings, speed: k })}
                className={`flex-1 rounded-xl px-2 py-2 text-sm font-bold transition ${settings.speed === k ? 'bg-sky-500 text-white shadow' : 'bg-white text-slate-600'}`}
              >
                {SPEED[k].ico} {SPEED[k].label}
              </button>
            ))}
          </div>
          <div className="mt-1.5 text-xs text-slate-400">🐢 more time to read &amp; listen · 🚀 faster</div>
        </div>

        <Toggle label="Calm mode" hint="Softer glow, gentler colors" on={settings.calmMode} onClick={() => onChange({ ...settings, calmMode: !settings.calmMode })} />
        <Toggle label="Reduce motion" hint="Slow down drifting clouds & effects" on={settings.reduceMotion} onClick={() => onChange({ ...settings, reduceMotion: !settings.reduceMotion })} />
        <Toggle label="Sounds" hint="Gentle chimes for stars & success" on={settings.sound} onClick={() => onChange({ ...settings, sound: !settings.sound })} />
        <Toggle label="Read aloud" hint="Nilu speaks her words out loud" on={settings.narration} onClick={() => onChange({ ...settings, narration: !settings.narration })} />

        <button
          onClick={onOpenGrownUps}
          className="mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          👤 For grown-ups — view progress notes
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-full bg-sky-500 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// For grown-ups: a simple typed-math question gates a read-only parent/carer
// view. Deliberately low-friction (not a real password) — its only job is to
// keep a curious child from wandering into adult-facing progress notes.
// ---------------------------------------------------------------------------

function makeGateQuestion() {
  const a = 3 + Math.floor(Math.random() * 6); // 3..8
  const b = 3 + Math.floor(Math.random() * 6);
  return { a, b, answer: a + b };
}

function GrownUpGate({ onCancel, onUnlock }: { onCancel: () => void; onUnlock: () => void }) {
  const [q] = useState(makeGateQuestion);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  function submit() {
    if (Number(value.trim()) === q.answer) {
      onUnlock();
    } else {
      setWrong(true);
      setValue('');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,28,46,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92 }}
        className="w-full max-w-xs rounded-[24px] bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl">👤</div>
        <h2 className="mt-1 text-lg font-extrabold text-slate-800">For grown-ups</h2>
        <p className="mt-1 text-sm text-slate-500">Quick check — solve this to continue:</p>
        <p className="mt-3 text-2xl font-black text-sky-700">{q.a} + {q.b} = ?</p>
        <input
          autoFocus
          inputMode="numeric"
          value={value}
          onChange={(e) => { setValue(e.target.value); setWrong(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className={`mt-3 w-24 rounded-xl border-[3px] bg-white px-3 py-2 text-center text-lg font-bold text-slate-700 outline-none ${wrong ? 'border-rose-300' : 'border-slate-200 focus:border-sky-400'}`}
        />
        {wrong && <p className="mt-1 text-xs font-semibold text-rose-500">Not quite — try again.</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-full bg-slate-100 py-2.5 text-sm font-bold text-slate-500 transition active:scale-95">
            Cancel
          </button>
          <button onClick={submit} className="flex-1 rounded-full bg-sky-500 py-2.5 text-sm font-bold text-white shadow-lg transition active:scale-95">
            Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Read-only progress notes for a parent/carer: visited days, per-island
// levels/stars, skills practiced, recent moments, areas practicing most (from
// slip data), and the child's saved calm-plan choices. Calm, plain styling —
// no games, no motion flourishes.
function GrownUpsPanel({ progress, memory, onClose }: { progress: GameProgress; memory: BeluMemory; onClose: () => void }) {
  const practicing = topPracticeZones(progress).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(30,36,48,0.6)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-800">Progress notes</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">✕</button>
        </div>
        <p className="mb-4 text-xs text-slate-400">Read-only, for grown-ups. Nilu's World is always no-fail for the child — nothing here is a score.</p>

        <Section title="Days visited">
          <p className="text-2xl font-black text-slate-700">{memory.visitDays}</p>
        </Section>

        <Section title="Islands: levels done &amp; stars">
          <div className="flex flex-col gap-1.5">
            {ZONES.map((z) => (
              <div key={z} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-600">{ISLANDS[z].emoji} {ISLANDS[z].label}</span>
                <span className="font-bold text-slate-500">
                  {completedLevels(progress, z)}/5 levels · {islandStars(progress, z)}/{MAX_STARS_PER_ISLAND}⭐
                  {isIslandComplete(progress, z) ? ' · bloomed 🌷' : ''}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Skills practiced">
          {memory.skillsPracticed.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {memory.skillsPracticed.map((s) => (
                <span key={s.zone} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {s.zone}: {s.count}×
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title="Areas practicing most">
          {practicing.length === 0 ? (
            <p className="text-sm text-slate-400">Not enough plays yet to tell.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {practicing.map((p) => (
                <div key={p.zone} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-amber-800">{ISLANDS[p.zone].emoji} {ISLANDS[p.zone].label}</span>
                  <span className="font-bold text-amber-600">{p.slips} gentle re-prompts / {p.rounds} rounds</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-1 text-[11px] text-slate-400">A higher number just means more re-tries were offered — never a penalty, and stars are unaffected.</p>
        </Section>

        <Section title="Recent moments">
          {memory.recentMoments.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing yet.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm text-slate-600">
              {memory.recentMoments.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
        </Section>

        <Section title="Calm plan (Calm Cove)">
          {progress.calmPlan.length === 0 ? (
            <p className="text-sm text-slate-400">Not built yet — this appears after Calm Cove level 5.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {progress.calmPlan.map((c, i) => (
                <span key={i} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{c}</span>
              ))}
            </div>
          )}
        </Section>

        <button onClick={onClose} className="mt-2 w-full rounded-full bg-sky-500 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95">
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ label, hint, on, onClick }: { label: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-3 flex w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-left"
    >
      <span>
        <span className="block font-bold text-slate-700">{label}</span>
        <span className="block text-xs text-slate-400">{hint}</span>
      </span>
      <span className="relative h-7 w-12 flex-none rounded-full transition" style={{ background: on ? '#5fa8e8' : '#cbd5e1' }}>
        <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: on ? 22 : 2 }} />
      </span>
    </button>
  );
}
