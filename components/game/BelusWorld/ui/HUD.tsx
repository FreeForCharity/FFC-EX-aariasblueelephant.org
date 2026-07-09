// ---------------------------------------------------------------------------
// Heads-up display layered over the 3D canvas: Nilu's speech, the sticker
// collection, the settings gear, the contextual "play here" prompt and the
// controls hint. The container ignores pointer events; only the buttons catch
// them, so movement taps still reach the canvas underneath.
// ---------------------------------------------------------------------------

import { AnimatePresence, motion } from 'framer-motion';
import { ISLANDS, type ZoneId } from '../three/worldConfig';
import { nudgeZoom, CAM_ZOOM_STEP } from '../three/playerState';

interface Props {
  beluLine: string | null;
  nearZone: ZoneId | null;
  /** a fully-bloomed island Nilu is standing on that still has today's Star
   *  Quest waiting — shows a small glowing ⭐ banner */
  starQuestZone?: ZoneId | null;
  stickers: string[];
  totalStars: number;
  isTouch: boolean;
  onOpenSettings: () => void;
  onOpenMap: () => void;
  onOpenWardrobe: () => void;
  onToggleFullscreen: () => void;
  onGoHome: () => void;
  onExit: () => void;
  onPause: () => void;
  onCycleSpeed: () => void;
  speedLabel: string;
}

export default function HUD({ beluLine, nearZone, starQuestZone, stickers, totalStars, isTouch, onOpenSettings, onOpenMap, onOpenWardrobe, onToggleFullscreen, onGoHome, onExit, onPause, onCycleSpeed, speedLabel }: Props) {
  const zoneMeta = nearZone && nearZone !== 'home' ? ISLANDS[nearZone] : null;
  const hasStarQuest = !!starQuestZone && starQuestZone === nearZone;

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* Nilu speech — top left */}
      <div className="absolute left-4 top-4 flex max-w-[78%] items-start gap-2">
        <div
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-2xl"
          style={{ background: 'linear-gradient(140deg,#7ec0ff,#5fa8e8)', boxShadow: '0 6px 18px rgba(40,90,160,0.4)' }}
        >
          🐘
        </div>
        <AnimatePresence>
          {beluLine && (
            <motion.div
              key={beluLine}
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              className="rounded-2xl rounded-tl-sm bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur"
            >
              {beluLine}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stars + stickers + map + settings — top right */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur">
          <span className="text-sm">⭐</span>
          <span className="text-sm font-bold text-slate-700">{totalStars}</span>
          {stickers.length > 0 && (
            <span className="ml-1 flex gap-0.5">
              {stickers.map((s, i) => (
                <span key={i} className="text-base">{s}</span>
              ))}
            </span>
          )}
        </div>
        <button
          onClick={onGoHome}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Go to home island"
          title="Home base"
        >
          🏡
        </button>
        <button
          onClick={onOpenWardrobe}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Dress up Nilu"
          title="Dress up Nilu"
        >
          🎩
        </button>
        <button
          onClick={onOpenMap}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Growth map"
        >
          🗺️
        </button>
        <button
          onClick={onCycleSpeed}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Game speed"
          title={`Game speed: ${speedLabel} — tap for more time 🐢 or faster 🚀`}
        >
          🎛️
        </button>
        <button
          onClick={onToggleFullscreen}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Full screen"
          title="Full screen"
        >
          ⛶
        </button>
        <button
          onClick={onPause}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Take a break"
          title="Take a break"
        >
          ⏸️
        </button>
        <button
          onClick={onOpenSettings}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Settings"
        >
          ⚙️
        </button>
        {/* Exit — kept visually separate (left border gap + warmer tint) from
            settings/pause so a stray tap doesn't read as "just another button" */}
        <button
          onClick={onExit}
          className="pointer-events-auto ml-1.5 flex h-10 w-10 items-center justify-center rounded-full border-l-2 border-white/60 bg-rose-50/90 pl-0.5 text-lg text-rose-500 shadow-lg backdrop-blur transition hover:bg-rose-100"
          aria-label="Exit game"
          title="Exit"
        >
          ✕
        </button>
      </div>

      {/* Camera zoom — under the top-right menu, clear of the bottom controls */}
      <div className="absolute right-4 top-16 flex flex-col gap-2">
        <button
          onClick={() => nudgeZoom(-CAM_ZOOM_STEP)}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-slate-700 shadow-lg backdrop-blur transition hover:bg-white active:scale-90"
          aria-label="Zoom in"
          title="Zoom in"
          data-zoom="in"
        >
          🔍＋
        </button>
        <button
          onClick={() => nudgeZoom(CAM_ZOOM_STEP)}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-slate-700 shadow-lg backdrop-blur transition hover:bg-white active:scale-90"
          aria-label="Zoom out"
          title="Zoom out"
          data-zoom="out"
        >
          🔍−
        </button>
      </div>

      {/* Arrival banner — shows which island you've reached */}
      <AnimatePresence>
        {zoneMeta && (
          <motion.div
            key={zoneMeta.id}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            className="absolute left-1/2 top-20 -translate-x-1/2 rounded-3xl px-6 py-3 text-center shadow-2xl"
            style={{ background: `linear-gradient(140deg, #ffffff, ${zoneMeta.accent}33)`, border: `2px solid ${zoneMeta.accent}` }}
          >
            <div className="text-2xl">{zoneMeta.emoji}</div>
            <div className="text-base font-extrabold text-slate-800">{zoneMeta.label}</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-500">Walk up to your friend to begin ✨</div>
            {hasStarQuest && (
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="mt-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700"
              >
                ⭐ Today's Star Quest here!
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls hint — desktop only, bottom center */}
      {!isTouch && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/35 px-4 py-2 text-xs font-medium text-white backdrop-blur">
          <span className="font-bold">WASD</span> / arrows to move · <span className="font-bold">Space</span> to jump ·{' '}
          walk into a glowing orb to answer
        </div>
      )}
    </div>
  );
}
