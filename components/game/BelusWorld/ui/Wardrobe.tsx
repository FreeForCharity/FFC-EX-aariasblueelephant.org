// ---------------------------------------------------------------------------
// Belu's Wardrobe — the reward for finishing levels. Each completed level
// unlocks a new accessory; here the child dresses Belu up (a hat, shades, a
// cape…). Equipping is instant and saved, so Belu keeps the look across visits.
// ---------------------------------------------------------------------------

import { motion } from 'framer-motion';
import {
  COSMETICS,
  type CosmeticSlot,
  type GameProgress,
} from '../belu/progress';

const SLOTS: { slot: CosmeticSlot; label: string }[] = [
  { slot: 'head', label: 'Hats' },
  { slot: 'face', label: 'Glasses' },
  { slot: 'back', label: 'Capes & Wings' },
];

export default function Wardrobe({
  progress,
  onEquip,
  onClose,
}: {
  progress: GameProgress;
  onEquip: (slot: CosmeticSlot, id: string | null) => void;
  onClose: () => void;
}) {
  const unlockedCount = progress.unlocked.length;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(20,28,46,0.55)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800">Belu's Wardrobe 🎩</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm font-semibold text-violet-500">
          {unlockedCount} of {COSMETICS.length} unlocked · finish levels to earn more!
        </p>

        {SLOTS.map(({ slot, label }) => {
          const items = COSMETICS.filter((c) => c.slot === slot);
          const equippedId = progress.equipped[slot];
          return (
            <div key={slot} className="mb-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</h3>
              <div className="flex flex-wrap gap-2">
                {/* "take it off" option */}
                <button
                  onClick={() => onEquip(slot, null)}
                  className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 text-2xl ${
                    !equippedId ? 'border-violet-400 bg-violet-50' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  🚫
                  <span className="text-[9px] font-bold text-slate-400">None</span>
                </button>
                {items.map((c) => {
                  const unlocked = progress.unlocked.includes(c.id);
                  const equipped = equippedId === c.id;
                  return (
                    <button
                      key={c.id}
                      disabled={!unlocked}
                      onClick={() => onEquip(slot, c.id)}
                      title={unlocked ? c.name : 'Finish a level to unlock'}
                      className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 text-2xl transition ${
                        equipped
                          ? 'border-violet-500 bg-violet-100'
                          : unlocked
                            ? 'border-slate-200 bg-white hover:bg-slate-50'
                            : 'border-slate-100 bg-slate-100 opacity-60'
                      }`}
                    >
                      <span style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>{c.icon}</span>
                      <span className="text-[9px] font-bold text-slate-400">{unlocked ? c.name.split(' ')[0] : '🔒'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-full bg-violet-500 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95"
        >
          Looking good! →
        </button>
      </motion.div>
    </motion.div>
  );
}
