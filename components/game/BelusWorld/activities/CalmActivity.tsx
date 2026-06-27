// ASD area — SELF-REGULATION & SENSORY (Calm Cove). Five levels deepen from
// simple guided breathing to building a personal calm-down plan. No fail, no
// pressure: breathing is gently paced, every choice is affirmed. Research-based
// (co-regulation, identify-then-strategy, self-management).

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { OverlayShell, ChoiceButton, starsFromSlips, type ActivityProps } from './shared';

type Phase = 'in' | 'hold' | 'out';
const SEQ: { phase: Phase; label: string; secs: number; scale: number }[] = [
  { phase: 'in', label: 'Breathe in…', secs: 4, scale: 1.6 },
  { phase: 'hold', label: 'Hold gently…', secs: 2, scale: 1.6 },
  { phase: 'out', label: 'Breathe out…', secs: 4, scale: 0.85 },
];

const BODY_SPOTS = [
  { id: 'tummy', label: 'Tummy', emoji: '🫄' },
  { id: 'chest', label: 'Chest', emoji: '🫁' },
  { id: 'shoulders', label: 'Shoulders', emoji: '💪' },
  { id: 'hands', label: 'Hands', emoji: '🤲' },
];

const STRATEGIES = [
  { id: 'breathe', label: 'Take deep breaths', emoji: '🌬️' },
  { id: 'quiet', label: 'Find a quiet spot', emoji: '🤫' },
  { id: 'squeeze', label: 'Squeeze my hands', emoji: '✊' },
  { id: 'break', label: 'Ask for a break', emoji: '✋' },
  { id: 'count', label: 'Count to five', emoji: '🖐️' },
  { id: 'hug', label: 'Get a big hug', emoji: '🤗' },
];

const LOUD_SCENES = [
  'It is very loud and busy in here.',
  'The room is too bright and noisy.',
  'Everything feels like too much right now.',
];

export default function CalmActivity({ level, speak, onBeluEmotion, onComplete, onExit }: ActivityProps) {
  // breaths required scales with level
  const breaths = level === 1 ? 2 : level === 2 ? 3 : level >= 4 ? 1 : 2;
  // does this level have a "choosing" stage before/after breathing?
  const hasBody = level === 3;
  const hasStrategy = level === 4;
  const hasPlan = level === 5;

  const slips = useRef(0);
  const [stage, setStage] = useState<'intro' | 'choose' | 'breathe' | 'done'>('intro');
  const [picked, setPicked] = useState<string[]>([]);

  // breathing state
  const [cycle, setCycle] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const planGoal = 3;

  useEffect(() => {
    onBeluEmotion('calm');
    speak("Welcome to the cove. Let's feel calm together.");
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    onBeluEmotion('happy');
    speak('I feel calm and cozy now. Thank you for being with me.');
    setStage('done');
    setTimeout(() => onComplete({ stars: starsFromSlips(slips.current), moment: 'practiced staying calm at the cove' }), 700);
  }

  // ---- breathing loop ----
  const current = SEQ[phaseIdx];
  useEffect(() => {
    if (!running) return;
    timer.current = setTimeout(() => {
      const next = (phaseIdx + 1) % SEQ.length;
      if (next === 0) {
        const c = cycle + 1;
        setCycle(c);
        if (c >= breaths) {
          setRunning(false);
          finish();
          return;
        }
      }
      setPhaseIdx(next);
    }, current.secs * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phaseIdx]);

  function startBreathing() {
    onBeluEmotion('calm');
    speak('Follow the bubble. Breathe in as it grows, out as it shrinks.');
    setCycle(0);
    setPhaseIdx(0);
    setRunning(true);
    setStage('breathe');
  }

  // ---- choose stage (body / strategy / plan) ----
  function pickBody(label: string) {
    speak(`Lovely. Feeling calm in your ${label.toLowerCase()} is wonderful.`);
    onBeluEmotion('happy');
    startBreathing();
  }
  function pickStrategy(label: string) {
    speak(`Great idea — "${label}" really helps. Let's do one calm breath too.`);
    onBeluEmotion('happy');
    startBreathing();
  }
  function pickPlan(id: string, label: string) {
    if (picked.includes(id)) return;
    const np = [...picked, id];
    setPicked(np);
    onBeluEmotion('happy');
    if (np.length >= planGoal) {
      speak('That is a wonderful calm plan. Let’s finish with one breath.');
      startBreathing();
    } else {
      speak(`"${label}" — good choice for your calm plan. Pick ${planGoal - np.length} more.`);
    }
  }

  // first-then + instruction per level
  const firstThen = {
    first: hasStrategy ? 'Pick what helps you' : hasPlan ? 'Build your calm plan' : 'Breathe with Belu',
    then: '⭐ Earn a star',
  };
  const instruction =
    stage === 'breathe'
      ? 'Follow the glowing bubble. Breathe slowly.'
      : hasBody
        ? 'Where do you feel calm in your body? Tap a spot.'
        : hasStrategy
          ? 'When it feels like too much, what can you do? Tap one.'
          : hasPlan
            ? `Tap ${planGoal} things that help you feel calm.`
            : 'When you are ready, press Start to breathe.';

  const totalSteps = hasPlan ? planGoal + 1 : hasBody || hasStrategy ? 2 : 1;
  const stepNow = stage === 'breathe' || stage === 'done' ? totalSteps - 1 : hasPlan ? picked.length : 0;

  return (
    <OverlayShell
      title="Calm Cove"
      emoji="🌊"
      accent="#5fd0e0"
      level={level}
      step={stepNow}
      total={totalSteps}
      firstThen={firstThen}
      instruction={instruction}
      onSpeak={() => speak(instruction)}
      onExit={onExit}
    >
      {/* CHOOSING stages */}
      {stage === 'intro' && hasBody && (
        <Choices items={BODY_SPOTS} accent="#5fd0e0" onPick={(it) => pickBody(it.label)} />
      )}
      {stage === 'intro' && hasStrategy && (
        <>
          <p className="mb-3 rounded-2xl bg-cyan-50 px-4 py-3 text-center text-base font-semibold text-slate-700">
            {LOUD_SCENES[(level - 1) % LOUD_SCENES.length]}
          </p>
          <Choices items={STRATEGIES.slice(0, 4)} accent="#5fd0e0" onPick={(it) => pickStrategy(it.label)} />
        </>
      )}
      {stage === 'intro' && hasPlan && (
        <>
          <div className="mb-3 flex min-h-[44px] flex-wrap items-center justify-center gap-2 rounded-2xl bg-cyan-50 p-2">
            {picked.length === 0 && <span className="text-sm text-slate-400">Your calm plan will show here…</span>}
            {picked.map((id) => {
              const s = STRATEGIES.find((x) => x.id === id)!;
              return (
                <span key={id} className="rounded-xl bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow">
                  {s.emoji} {s.label}
                </span>
              );
            })}
          </div>
          <Choices items={STRATEGIES} accent="#5fd0e0" onPick={(it) => pickPlan(it.id, it.label)} disabledIds={picked} />
        </>
      )}

      {/* plain breathing levels: show Start button */}
      {stage === 'intro' && !hasBody && !hasStrategy && !hasPlan && (
        <div className="flex flex-col items-center gap-4 py-2">
          <BreathBubble running={false} phase={SEQ[0]} />
          <button
            onClick={startBreathing}
            className="rounded-full bg-cyan-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95"
          >
            Start breathing 🫧
          </button>
        </div>
      )}

      {/* BREATHING stage */}
      {stage === 'breathe' && (
        <div className="flex flex-col items-center gap-6 py-2">
          <BreathBubble running={running} phase={current} />
          <p className="text-center text-sm font-medium text-slate-500">
            Calm breath {Math.min(cycle + 1, breaths)} of {breaths} — let your shoulders relax 💙
          </p>
        </div>
      )}

      {stage === 'done' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="text-6xl">
            🌊
          </motion.div>
          <p className="text-center text-base font-bold text-cyan-600">So calm. Well done.</p>
        </div>
      )}
    </OverlayShell>
  );
}

function Choices({
  items,
  accent,
  onPick,
  disabledIds = [],
}: {
  items: { id: string; label: string; emoji: string }[];
  accent: string;
  onPick: (it: { id: string; label: string; emoji: string }) => void;
  disabledIds?: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <ChoiceButton key={it.id} accent={accent} onClick={() => !disabledIds.includes(it.id) && onPick(it)}>
          <span className="text-2xl">{it.emoji}</span>
          <span>{it.label}</span>
        </ChoiceButton>
      ))}
    </div>
  );
}

function BreathBubble({ running, phase }: { running: boolean; phase: { label: string; secs: number; scale: number } }) {
  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <motion.div
        className="absolute rounded-full"
        style={{ width: 200, height: 200, background: 'radial-gradient(circle, #bdf0fa 0%, #5fd0e0 70%)' }}
        animate={{ scale: running ? phase.scale : 1 }}
        transition={{ duration: running ? phase.secs : 0.6, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full border-4"
        style={{ width: 230, height: 230, borderColor: '#5fd0e066' }}
        animate={{ scale: running ? phase.scale * 1.05 : 1, opacity: running ? 0.6 : 0.3 }}
        transition={{ duration: running ? phase.secs : 0.6, ease: 'easeInOut' }}
      />
      <span className="relative z-10 text-center text-lg font-extrabold text-white drop-shadow">
        {running ? phase.label : 'Ready?'}
      </span>
    </div>
  );
}
