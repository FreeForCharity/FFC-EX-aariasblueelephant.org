// ---------------------------------------------------------------------------
// Destination entry screen. Shown when Belu reaches an island. Presents the
// skill, a First→Then frame, and a visible LEVEL PATH (1..5) the child climbs.
// Each node shows the stars earned; the next level pulses invitingly; future
// levels are gently locked (unlock in order — predictable, no surprises).
// This screen IS the per-island progress display + the "selectable" choice.
// ---------------------------------------------------------------------------

import { motion } from 'framer-motion';
import type { ActivityMeta } from '../activities/registry';
import { MAX_LEVEL } from '../belu/progress';

interface Props {
  meta: ActivityMeta;
  /** best stars per level (length MAX_LEVEL), 0 = not done */
  levelStars: number[];
  onPlay: (level: number) => void;
  onClose: () => void;
}

function Stars({ n, accent }: { n: number; accent: string }) {
  return (
    <span className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ color: i < n ? accent : '#d8e0ec' }}>★</span>
      ))}
    </span>
  );
}

export default function LevelSelect({ meta, levelStars, onPlay, onClose }: Props) {
  const completed = levelStars.filter((s) => s > 0).length;
  const nextLevel = Math.min(completed + 1, MAX_LEVEL);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,28,46,0.55)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md rounded-[28px] p-6"
        style={{
          background: `linear-gradient(160deg, #ffffff 0%, ${meta.accent}18 100%)`,
          boxShadow: '0 30px 80px rgba(20,30,60,0.45)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          aria-label="Back to the world"
        >
          ✕
        </button>

        {/* header */}
        <div className="mb-1 flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
            style={{ background: meta.accent, boxShadow: `0 6px 18px ${meta.accent}66` }}
          >
            {meta.emoji}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">{meta.title}</h2>
            <p className="text-sm font-semibold" style={{ color: '#888' }}>
              {meta.skill}
            </p>
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-500">{meta.tagline}</p>

        {/* level path */}
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: MAX_LEVEL }).map((_, i) => {
            const lvl = i + 1;
            const stars = levelStars[i] ?? 0;
            const done = stars > 0;
            const unlocked = lvl <= nextLevel;
            const isNext = lvl === nextLevel && !done;
            return (
              <motion.button
                key={lvl}
                disabled={!unlocked}
                onClick={() => unlocked && onPlay(lvl)}
                whileTap={unlocked ? { scale: 0.97 } : {}}
                animate={isNext ? { scale: [1, 1.025, 1] } : {}}
                transition={isNext ? { duration: 1.6, repeat: Infinity } : {}}
                className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition"
                style={{
                  borderColor: unlocked ? `${meta.accent}66` : '#e6ebf2',
                  background: unlocked ? '#fff' : '#f5f7fa',
                  opacity: unlocked ? 1 : 0.6,
                  boxShadow: isNext ? `0 6px 20px ${meta.accent}44` : '0 2px 8px rgba(30,40,70,0.05)',
                }}
              >
                <div
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-lg font-black text-white"
                  style={{ background: done ? meta.accent : unlocked ? `${meta.accent}aa` : '#c2cbd6' }}
                >
                  {unlocked ? lvl : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-700">{meta.levelNames[i]}</div>
                  <div className="text-xs text-slate-400">Level {lvl}</div>
                </div>
                {done ? (
                  <Stars n={stars} accent={meta.accent} />
                ) : isNext ? (
                  <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: meta.accent }}>
                    Play ▶
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </div>

        {completed >= MAX_LEVEL && (
          <p className="mt-4 rounded-2xl bg-amber-100 px-4 py-2 text-center text-sm font-bold text-amber-700">
            🎉 Island mastered! It has fully bloomed.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
