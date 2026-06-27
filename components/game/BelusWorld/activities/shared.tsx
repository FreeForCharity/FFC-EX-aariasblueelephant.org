// ---------------------------------------------------------------------------
// Shared scaffolding for the in-world learning activities.
//
// Research-informed (see project memory): every activity is errorless and
// no-fail, shows a First→Then board and a visual step schedule, gives literal
// instructions with a text-to-speech replay button, and never uses a timer or
// a "wrong" buzzer. Wrong taps gently wiggle and re-prompt. Each activity is
// leveled (1..MAX_LEVEL) and reports 1–3 stars on completion (best is kept).
// ---------------------------------------------------------------------------

import { motion } from 'framer-motion';
import type { BeluEmotion } from '../BeluCharacter';

export interface ActivityResult {
  /** 1..3 — based on how smoothly it went, never below 1 (no-fail) */
  stars: number;
  /** short human phrase for Belu's memory, e.g. "matched feeling faces" */
  moment: string;
}

export interface ActivityProps {
  /** which level the child chose to play (1-based) */
  level: number;
  /** say a line: shows Belu's speech bubble AND speaks it aloud if narration is on */
  speak: (text: string) => void;
  onBeluEmotion: (e: BeluEmotion) => void;
  onComplete: (result: ActivityResult) => void;
  onExit: () => void;
}

/** Compute a gentle star rating from the number of gentle re-prompts. */
export function starsFromSlips(slips: number): number {
  if (slips <= 0) return 3;
  if (slips <= 2) return 2;
  return 1;
}

export function OverlayShell({
  title,
  emoji,
  accent,
  level,
  step,
  total,
  firstThen,
  instruction,
  onSpeak,
  onExit,
  children,
}: {
  title: string;
  emoji: string;
  accent: string;
  level: number;
  step: number;
  total: number;
  /** the First→Then board labels, e.g. { first: 'Match the feelings', then: '⭐ Earn a star' } */
  firstThen?: { first: string; then: string };
  /** the single, literal instruction for the current screen */
  instruction?: string;
  /** re-speak the instruction (text-to-speech) */
  onSpeak?: () => void;
  onExit: () => void;
  children: React.ReactNode;
}) {
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
        exit={{ scale: 0.92, y: 10 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-lg rounded-[28px] p-5 sm:p-7"
        style={{
          background: 'linear-gradient(160deg, #ffffff 0%, #f4f8ff 100%)',
          boxShadow: '0 30px 80px rgba(20,30,60,0.45), inset 0 1px 0 rgba(255,255,255,0.9)',
          border: '1px solid rgba(255,255,255,0.7)',
        }}
      >
        {/* header */}
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
            style={{ background: accent, boxShadow: `0 6px 18px ${accent}66` }}
          >
            {emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-800">{title}</h2>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: accent }}>
                Level {level}
              </span>
            </div>
            <ProgressDots step={step} total={total} accent={accent} />
          </div>
          <button
            onClick={onExit}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Leave activity"
          >
            ✕
          </button>
        </div>

        {/* First → Then board (evidence-based visual support) */}
        {firstThen && (
          <div className="mb-3 flex items-stretch gap-2 rounded-2xl bg-slate-50 p-2 text-center text-xs font-bold">
            <div className="flex-1 rounded-xl bg-white px-2 py-2 text-slate-600 shadow-sm">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">First</div>
              {firstThen.first}
            </div>
            <div className="flex items-center text-slate-300">➜</div>
            <div className="flex-1 rounded-xl px-2 py-2 text-slate-700 shadow-sm" style={{ background: `${accent}22` }}>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Then</div>
              {firstThen.then}
            </div>
          </div>
        )}

        {/* literal instruction + read-aloud */}
        {instruction && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
            <button
              onClick={onSpeak}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white text-base shadow-sm transition active:scale-90"
              aria-label="Read aloud"
            >
              🔊
            </button>
            <p className="text-sm font-semibold text-slate-700">{instruction}</p>
          </div>
        )}

        {children}

        <p className="mt-4 text-center text-xs font-medium text-slate-400">
          🐘 Belu is learning right alongside you · take all the time you need
        </p>
      </motion.div>
    </motion.div>
  );
}

function ProgressDots({ step, total, accent }: { step: number; total: number; accent: string }) {
  return (
    <div className="mt-1 flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-2 rounded-full transition-all duration-300"
          style={{ width: i === step ? 22 : 10, background: i <= step ? accent : '#d8e0ec' }}
        />
      ))}
    </div>
  );
}

export function ChoiceButton({
  onClick,
  shake,
  children,
  accent,
  big,
}: {
  onClick: () => void;
  shake?: boolean;
  children: React.ReactNode;
  accent: string;
  big?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={`flex items-center justify-center gap-2 rounded-2xl border-2 bg-white px-4 text-center font-bold text-slate-700 transition ${
        big ? 'min-h-[84px] py-4 text-lg' : 'min-h-[64px] py-3 text-base'
      }`}
      style={{ borderColor: `${accent}55`, boxShadow: '0 4px 14px rgba(30,40,70,0.08)' }}
    >
      {children}
    </motion.button>
  );
}

// Big friendly emoji-face for the feelings + language activities.
export function FaceCard({ emoji, label, size = 120 }: { emoji: string; label?: string; size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        style={{ fontSize: size, lineHeight: 1 }}
      >
        {emoji}
      </motion.div>
      {label && <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>}
    </div>
  );
}
