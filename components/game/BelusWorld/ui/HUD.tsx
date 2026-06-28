// ---------------------------------------------------------------------------
// Heads-up display layered over the 3D canvas: Belu's speech, the sticker
// collection, the settings gear, the contextual "play here" prompt and the
// controls hint. The container ignores pointer events; only the buttons catch
// them, so movement taps still reach the canvas underneath.
// ---------------------------------------------------------------------------

import { AnimatePresence, motion } from 'framer-motion';
import { ISLANDS, type ZoneId } from '../three/worldConfig';

interface Props {
  beluLine: string | null;
  nearZone: ZoneId | null;
  stickers: string[];
  totalStars: number;
  isTouch: boolean;
  onOpenSettings: () => void;
  onOpenMap: () => void;
}

export default function HUD({ beluLine, nearZone, stickers, totalStars, isTouch, onOpenSettings, onOpenMap }: Props) {
  const zoneMeta = nearZone && nearZone !== 'home' ? ISLANDS[nearZone] : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* Belu speech — top left */}
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
          onClick={onOpenMap}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Growth map"
        >
          🗺️
        </button>
        <button
          onClick={onOpenSettings}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:bg-white"
          aria-label="Settings"
        >
          ⚙️
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
