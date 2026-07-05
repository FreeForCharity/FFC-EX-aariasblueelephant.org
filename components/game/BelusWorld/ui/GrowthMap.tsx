// ---------------------------------------------------------------------------
// The Growth Map — a single screen where the child SEES their progress:
//   • how grown-up Nilu is, with a meter to the next growth,
//   • how much each island has bloomed (levels completed),
//   • total stars collected, and a sticker gallery.
// This is the recognizable thing the child strives for — concrete, additive,
// never punishing.
// ---------------------------------------------------------------------------

import { motion } from 'framer-motion';
import { ISLANDS } from '../three/worldConfig';
import {
  type GameProgress,
  type ActivityZone,
  ZONES,
  MAX_LEVEL,
  MAX_STARS_PER_ISLAND,
  getGrowth,
  islandStars,
  completedLevels,
  totalStars,
} from '../belu/progress';

const SKILLS: Record<ActivityZone, string> = {
  meadow: 'Reading Emotions',
  mountain: 'Life Skills',
  cove: 'Calm & Senses',
  forest: 'Expressive Language',
};

const GROWTH_EMOJI = ['🐣', '🐘', '🐘', '🐘']; // baby vs grown handled by scale below
const GROWTH_SCALE = [44, 60, 78, 96];

export default function GrowthMap({ progress, onClose }: { progress: GameProgress; onClose: () => void }) {
  const growth = getGrowth(progress);
  const stars = totalStars(progress);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,28,46,0.55)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6"
        style={{ boxShadow: '0 30px 80px rgba(20,30,60,0.45)' }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="mb-1 text-center text-2xl font-black text-slate-800">My Growth Map</h2>
        <p className="mb-4 text-center text-sm font-semibold text-amber-500">⭐ {stars} stars collected</p>

        {/* Nilu growth */}
        <div className="mb-5 rounded-3xl p-5 text-center" style={{ background: 'linear-gradient(160deg,#eaf6ff,#fff)' }}>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            style={{ fontSize: GROWTH_SCALE[growth.stage], lineHeight: 1 }}
          >
            {GROWTH_EMOJI[growth.stage]}
          </motion.div>
          <div className="mt-1 text-lg font-extrabold text-sky-700">{growth.label}</div>
          {/* meter */}
          <div className="mx-auto mt-3 h-4 w-full max-w-[260px] overflow-hidden rounded-full bg-sky-100">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,#7ec0ff,#5fa8e8)' }}
              initial={{ width: 0 }}
              animate={{ width: `${growth.progress * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {growth.nextAt === null
              ? 'Nilu is all grown up — amazing! 🎉'
              : `${growth.nextAt - stars} more ⭐ to help Nilu grow bigger!`}
          </p>
        </div>

        {/* Islands bloom */}
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Island Gardens</h3>
        <div className="flex flex-col gap-2.5">
          {ZONES.map((z) => {
            const meta = { emoji: ISLANDS[z].emoji, accent: ISLANDS[z].accent, skill: SKILLS[z] };
            const done = completedLevels(progress, z);
            const s = islandStars(progress, z);
            const bloomPct = (done / MAX_LEVEL) * 100;
            return (
              <div key={z} className="flex items-center gap-3 rounded-2xl border-2 border-slate-100 p-3">
                <div
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-2xl"
                  style={{ background: `${meta.accent}33` }}
                >
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-bold text-slate-700">{meta.skill}</span>
                    <span className="ml-2 flex-none text-xs font-bold" style={{ color: meta.accent }}>
                      {s}/{MAX_STARS_PER_ISLAND} ⭐
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${bloomPct}%`, background: meta.accent }} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {done >= MAX_LEVEL ? '🌷 Fully bloomed!' : `${done}/${MAX_LEVEL} levels grown`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-sky-500 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95"
        >
          Back to exploring →
        </button>
      </motion.div>
    </motion.div>
  );
}
