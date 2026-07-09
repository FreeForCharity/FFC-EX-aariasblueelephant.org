// ---------------------------------------------------------------------------
// Heads-up display layered over the 3D canvas: Nilu's speech, the sticker
// collection, the settings gear, the contextual "play here" prompt and the
// controls hint. The container ignores pointer events; only the buttons catch
// them, so movement taps still reach the canvas underneath.
// ---------------------------------------------------------------------------

import { useState } from 'react';
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
  onToggleMute: () => void;
  muted: boolean;
}

export default function HUD({ beluLine, nearZone, starQuestZone, stickers, totalStars, isTouch, onOpenSettings, onOpenMap, onOpenWardrobe, onToggleFullscreen, onGoHome, onExit, onPause, onCycleSpeed, speedLabel, onToggleMute, muted }: Props) {
  const zoneMeta = nearZone && nearZone !== 'home' ? ISLANDS[nearZone] : null;
  const hasStarQuest = !!starQuestZone && starQuestZone === nearZone;
  const [showMore, setShowMore] = useState(false);

  // Tucked into the "More" popover so a stray tap can't dress up Nilu, open the
  // map, change speed, go fullscreen, open settings, or exit by accident — a
  // child should only ever see mute / pause / home / more as instant taps.
  const moreRows: Array<{ label: string; onClick: () => void; ariaLabel: string }> = [
    { label: '🎩 Dress up', onClick: onOpenWardrobe, ariaLabel: 'Dress up Nilu' },
    { label: '🗺️ Growth map', onClick: onOpenMap, ariaLabel: 'Growth map' },
    { label: `🎛️ Speed: ${speedLabel}`, onClick: onCycleSpeed, ariaLabel: `Game speed: ${speedLabel} — tap for more time or faster` },
    { label: '⛶ Full screen', onClick: onToggleFullscreen, ariaLabel: 'Full screen' },
    { label: '⚙️ For grown-ups & settings', onClick: onOpenSettings, ariaLabel: 'Settings' },
    { label: '🚪 Leave game', onClick: onExit, ariaLabel: 'Exit game' },
  ];

  const runMoreAction = (fn: () => void) => {
    fn();
    setShowMore(false);
  };

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

      {/* Stars + stickers — top right, info only so it's small */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 shadow backdrop-blur">
          <span className="text-xs">⭐</span>
          <span className="text-xs font-bold text-slate-700">{totalStars}</span>
          {stickers.length > 0 && (
            <span className="ml-0.5 flex gap-0.5">
              {stickers.map((s, i) => (
                <span key={i} className="text-sm">{s}</span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Always-visible controls — big (48px+) and few, for a 4-10yo audience.
          Everything else (wardrobe/map/speed/fullscreen/settings/exit) lives
          behind "More" so a stray tap can't dress up Nilu or exit the game. */}
      <div className="absolute right-4 top-14 flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-xl shadow-lg backdrop-blur transition hover:bg-white active:scale-95"
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          title={muted ? 'Unmute sound' : 'Mute sound'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={onPause}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-xl shadow-lg backdrop-blur transition hover:bg-white active:scale-95"
          aria-label="Take a break"
          title="Take a break"
        >
          ⏸️
        </button>
        {/* labeled + emerald so a child hunting for "how do I get back?" spots it
            among the icon-only buttons — it teleports Nilu straight to home base */}
        <button
          onClick={onGoHome}
          className="pointer-events-auto flex h-12 items-center gap-1.5 rounded-full bg-emerald-500/95 px-4 text-xl shadow-lg backdrop-blur transition hover:bg-emerald-400 active:scale-95"
          aria-label="Go back to home base"
          title="Go back to home base"
        >
          🏡<span className="text-base font-bold text-white">Home</span>
        </button>
        <button
          onClick={() => setShowMore(v => !v)}
          className="pointer-events-auto flex h-12 items-center gap-1 rounded-full bg-white/90 px-4 text-xl shadow-lg backdrop-blur transition hover:bg-white active:scale-95"
          aria-label="More options"
          title="More options"
          aria-expanded={showMore}
        >
          ⋯<span className="text-base font-bold text-slate-700">More</span>
        </button>
      </div>

      {/* "More" popover — big labeled rows for dress up / map / speed /
          fullscreen / settings / exit, kept one deliberate tap away. */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="pointer-events-auto absolute right-4 top-28 z-40 flex w-64 flex-col overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur"
          >
            {moreRows.map(row => (
              <button
                key={row.ariaLabel}
                onClick={() => runMoreAction(row.onClick)}
                className="flex h-14 items-center px-5 text-left text-base font-bold text-slate-700 transition hover:bg-slate-100 active:bg-slate-200"
                aria-label={row.ariaLabel}
                title={row.ariaLabel}
              >
                {row.label}
              </button>
            ))}
            <button
              onClick={() => setShowMore(false)}
              className="flex h-14 items-center border-t border-slate-200 px-5 text-left text-base font-bold text-rose-500 transition hover:bg-rose-50 active:bg-rose-100"
              aria-label="Close menu"
              title="Close menu"
            >
              ✕ Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera zoom — under the top-right menu, clear of the bottom controls */}
      <div className="absolute right-4 top-32 flex flex-col gap-2">
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
