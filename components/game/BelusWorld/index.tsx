// ===========================================================================
// Belu's World — a 3D floating-island adventure for kids on the autism
// spectrum. The child walks/jumps Belu (a blue elephant) across magical sky
// islands. Each island teaches one ASD skill area across 5 levels. As the
// child earns stars, two things VISIBLY happen: Belu grows up (baby → grown)
// and each island blooms. Belu also remembers the child and grows a
// personality across visits, learning right alongside them.
//
// Designed against evidence-based ASD principles (see project memory):
// errorless / no-fail, no timers, predictable token rewards, First-Then visual
// supports, read-aloud narration, and full sensory comfort settings.
// ===========================================================================

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BeluEmotion } from './BeluCharacter';
import { ISLANDS, type ZoneId } from './three/worldConfig';
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
  nextLevel,
  totalStars,
  type GameProgress,
  type ActivityZone,
  type CosmeticSlot,
  ZONES,
} from './belu/progress';
import { speakAloud, playSound, stopSpeaking } from './belu/feedback';

const GameCanvas = lazy(() => import('./three/GameCanvas'));

type Phase = 'intro' | 'world';

interface Settings {
  reduceMotion: boolean;
  calmMode: boolean;
  sound: boolean;
  narration: boolean;
}

const STICKER_KEYS: Record<ActivityZone, string> = {
  meadow: '💛',
  mountain: '⛰️',
  cove: '🌊',
  forest: '🌳',
};

interface RewardInfo {
  stars: number;
  skill: string;
  levelUp: boolean;
  grewUp: boolean;
  growthLabel: string;
  islandMastered: boolean;
  unlockedItem?: { name: string; icon: string };
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
  const [settings, setSettings] = useState<Settings>({
    reduceMotion: false,
    calmMode: false,
    sound: true,
    narration: true,
  });

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

  // Belu speaks: speech bubble + (optional) read-aloud narration.
  const speak = useCallback((line: string) => {
    setBeluLine(line);
    speakAloud(line, settingsRef.current.narration);
    if (lineTimer.current) clearTimeout(lineTimer.current);
    lineTimer.current = setTimeout(() => setBeluLine(null), 5000);
  }, []);

  function start() {
    const m = recordVisit(memory);
    saveMemory(m);
    setMemory(m);
    setPhase('world');
    const greetKey = m.visitCount <= 1 ? 'greeting_first' : 'greeting_return';
    setTimeout(() => speak(getDialogue(greetKey, { memory: m })), 700);
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

  const paused = showSettings || showMap || reward !== null || showWardrobe;

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
    (zone: ActivityZone, level: number, stars: number, moment: string) => {
      const res = awardLevel(progress, zone, level - 1, stars);
      saveProgress(res.progress);
      setProgress(res.progress);

      // personality memory (separate from leveling)
      let m = recordZoneVisit(memory, zone);
      m = recordMoment(m, moment);
      m = addAchievement(m, `${ISLANDS[zone].label} L${level}`);
      saveMemory(m);
      setMemory(m);

      const mastered = completedLevels(res.progress, zone) >= 5;
      setEmotion('excited');
      playSound(res.grewUp ? 'growup' : res.newLevel ? 'levelup' : 'star', settingsRef.current.sound);
      setReward({
        stars,
        skill: ISLANDS[zone].label,
        levelUp: res.newLevel,
        grewUp: res.grewUp,
        growthLabel: getGrowth(res.progress).label,
        islandMastered: mastered,
        unlockedItem: res.unlockedItem ? { name: res.unlockedItem.name, icon: res.unlockedItem.icon } : undefined,
      });
    },
    [progress, memory],
  );

  if (phase === 'intro') {
    return <IntroScreen memory={memory} growthLabel={growth.label} onStart={start} onToggleFullscreen={toggleFullscreen} />;
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
          islandNextLevel={islandNextLevel}
          sound={settings.sound}
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
        stickers={stickers}
        totalStars={totalStars(progress)}
        isTouch={isTouch.current}
        onOpenSettings={() => setShowSettings(true)}
        onOpenMap={() => setShowMap(true)}
        onOpenWardrobe={() => setShowWardrobe(true)}
        onToggleFullscreen={toggleFullscreen}
        onGoHome={() => { queueGoHome(); sfx('tap'); }}
        onExit={() => { stopSpeaking(); window.history.back(); }}
      />

      <AnimatePresence>
        {questStatus && !showSettings && !showMap && reward === null && (
          <QuestPanel status={questStatus} />
        )}
      </AnimatePresence>

      {!paused && <TouchControls />}

      {/* Reward / celebration */}
      <AnimatePresence>
        {reward && <RewardToast reward={reward} onClose={() => setReward(null)} />}
      </AnimatePresence>

      {/* Growth map */}
      <AnimatePresence>{showMap && <GrowthMap progress={progress} onClose={() => setShowMap(false)} />}</AnimatePresence>

      {/* Wardrobe */}
      <AnimatePresence>
        {showWardrobe && <Wardrobe progress={progress} onEquip={handleEquip} onClose={() => setShowWardrobe(false)} />}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------

function IntroScreen({ memory, growthLabel, onStart, onToggleFullscreen }: { memory: BeluMemory; growthLabel: string; onStart: () => void; onToggleFullscreen: () => void }) {
  const returning = memory.visitCount > 0;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto p-6 text-center"
      style={{ background: 'linear-gradient(180deg,#aee0ff 0%,#d8f0ff 55%,#fff6e0 100%)' }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute text-6xl opacity-80"
          style={{ top: `${12 + i * 22}%` }}
          initial={{ left: '-20%' }}
          animate={{ left: '120%' }}
          transition={{ duration: 30 + i * 10, repeat: Infinity, ease: 'linear' }}
        >
          ☁️
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="text-[110px] leading-none drop-shadow-lg"
      >
        🐘
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-2 text-5xl font-black drop-shadow-sm sm:text-6xl"
        style={{
          backgroundImage: 'linear-gradient(90deg,#ff5e7e,#ffa94d,#ffd43b,#69db7c,#4dabf7,#b197fc)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Belu's World
      </motion.h1>

      {/* multicolour autism-acceptance infinity symbol */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: 'spring' }}
        className="mt-1 text-4xl font-black leading-none"
        style={{
          backgroundImage: 'linear-gradient(90deg,#ff5e7e,#ffa94d,#ffd43b,#69db7c,#4dabf7,#b197fc)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
        aria-label="autism acceptance infinity symbol"
      >
        ∞
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-2 text-lg font-extrabold text-sky-800"
      >
        Built for <span className="text-pink-500">Aaria and Her Friends</span> 💖
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-1 max-w-md text-base font-semibold text-sky-900/70"
      >
        {returning
          ? `Welcome back! ${growthLabel} is waiting on the sky islands. Earn stars to help Belu grow!`
          : 'Explore floating islands, meet friendly faces, and help baby Belu grow up big and strong!'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 text-3xl tracking-[0.3em]"
      >
        🐘🌸⛰️🌊🌳🌈
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="mt-7 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 px-12 py-4 text-2xl font-black text-white shadow-xl"
      >
        {returning ? 'Continue ✨' : 'Calling all friends of Aaria ✨'}
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleFullscreen}
        className="mt-3 rounded-full border-2 border-sky-300 bg-white/70 px-7 py-2.5 text-base font-bold text-sky-700 shadow-md"
      >
        ⛶ Full Screen
      </motion.button>

      <p className="mt-5 text-sm font-medium text-sky-900/50">
        Move with the arrows or joystick · Meet friends · Walk into glowing orbs · No way to lose 💙
      </p>
      <p className="mt-4 rounded-full bg-white/55 px-5 py-2 text-xs font-semibold text-sky-900/70">
        A game from <b>Aaria's Blue Elephant</b> 🐘💙 · aariasblueelephant.org
      </p>
    </div>
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
            {status.hint ?? 'Walk Belu into the matching glowing orb 🫧 (or tap it)'}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function RewardToast({ reward, onClose }: { reward: RewardInfo; onClose: () => void }) {
  const headline = reward.grewUp ? 'Belu Grew Up!' : reward.levelUp ? 'Level Complete!' : 'Great Job!';
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
        initial={{ scale: 0.6, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className="relative rounded-[28px] bg-white px-8 py-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {Array.from({ length: 16 }).map((_, i) => {
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

        <motion.div
          animate={{ scale: [1, 1.18, 1], rotate: reward.grewUp ? [0, 6, -6, 0] : 0 }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="text-7xl"
        >
          {hero}
        </motion.div>

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
            🎉 Belu is now {reward.growthLabel}! You helped Belu grow.
          </p>
        )}
        {reward.islandMastered && !reward.grewUp && (
          <p className="mt-3 rounded-2xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
            🌷 You fully bloomed this island!
          </p>
        )}
        {reward.unlockedItem && (
          <p className="mt-3 rounded-2xl bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
            🎁 New for Belu: {reward.unlockedItem.icon} {reward.unlockedItem.name}! Tap 🎩 to wear it.
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

function SettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
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
        <p className="mb-4 text-sm text-slate-500">Make Belu's World feel just right for you. 💙</p>

        <Toggle label="Calm mode" hint="Softer glow, gentler colors" on={settings.calmMode} onClick={() => onChange({ ...settings, calmMode: !settings.calmMode })} />
        <Toggle label="Reduce motion" hint="Slow down drifting clouds & effects" on={settings.reduceMotion} onClick={() => onChange({ ...settings, reduceMotion: !settings.reduceMotion })} />
        <Toggle label="Sounds" hint="Gentle chimes for stars & success" on={settings.sound} onClick={() => onChange({ ...settings, sound: !settings.sound })} />
        <Toggle label="Read aloud" hint="Belu speaks her words out loud" on={settings.narration} onClick={() => onChange({ ...settings, narration: !settings.narration })} />

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-sky-500 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
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
