// ASD area — LIFE SKILLS & DAILY LIVING (Morning Mountain). Five levels built
// on task-analysis + chaining: single self-care steps → short chains → full
// routine sequencing → safety choices → independent self-check. Errorless and
// no-fail: a wrong tap gently wiggles and re-prompts; nothing is ever "wrong".

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { OverlayShell, ChoiceButton, starsFromSlips, type ActivityProps } from './shared';

const ACCENT = '#7cc6ff';

// ----- content tables -----
interface MatchRound { prompt: string; answer: string; choices: string[]; }
const L1: MatchRound[] = [
  { prompt: 'Brush your teeth', answer: '🪥', choices: ['🪥', '🍕', '⚽'] },
  { prompt: 'Wash your hands', answer: '🧼', choices: ['📺', '🧼', '🎈'] },
  { prompt: 'Dry your hair', answer: '🧴', choices: ['🚗', '🍞', '🧴'] },
  { prompt: 'Put on your shoes', answer: '👟', choices: ['👟', '🪀', '🍩'] },
];

interface Chain { label: string; steps: { e: string; t: string }[]; }
const L2: Chain[] = [
  { label: 'Brushing teeth', steps: [{ e: '🪥', t: 'Get the brush' }, { e: '🧴', t: 'Add toothpaste' }, { e: '😁', t: 'Brush!' }] },
  { label: 'Washing hands', steps: [{ e: '💧', t: 'Turn on water' }, { e: '🧼', t: 'Use soap' }, { e: '🧻', t: 'Dry hands' }] },
  { label: 'Getting dressed', steps: [{ e: '🩲', t: 'Underclothes' }, { e: '👕', t: 'Shirt' }, { e: '👖', t: 'Pants' }] },
];

const ROUTINE = [
  { e: '😴', t: 'Wake up' },
  { e: '🪥', t: 'Brush teeth' },
  { e: '👕', t: 'Get dressed' },
  { e: '🥣', t: 'Eat breakfast' },
  { e: '🎒', t: 'Pack bag' },
  { e: '👋', t: 'Say goodbye' },
];

interface Safety { situation: string; options: { e: string; t: string; safe: boolean }[]; }
const L4: Safety[] = [
  { situation: 'Before crossing the street, what do we do first?', options: [{ e: '👀', t: 'Look both ways', safe: true }, { e: '🏃', t: 'Run across fast', safe: false }] },
  { situation: 'The stove is hot and red. What do we do?', options: [{ e: '🔥', t: 'Touch it', safe: false }, { e: '🙅', t: 'Stay away', safe: true }] },
  { situation: 'A stranger asks you to go with them. What do we do?', options: [{ e: '🙋', t: 'Find a grown-up you trust', safe: true }, { e: '🚶', t: 'Go with them', safe: false }] },
  { situation: 'Time to ride in the car. What do we do?', options: [{ e: '🎮', t: 'Stand up and play', safe: false }, { e: '🔒', t: 'Buckle your seatbelt', safe: true }] },
];

const L5_TASKS = [
  { e: '🛏️', t: 'Make the bed' },
  { e: '🪥', t: 'Brush teeth' },
  { e: '👕', t: 'Get dressed' },
  { e: '🥣', t: 'Eat breakfast' },
  { e: '🎒', t: 'Pack my bag' },
];

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => 0.5 - Math.random()); }

export default function RoutineActivity({ level, speak, onBeluEmotion, onComplete, onExit }: ActivityProps) {
  const [round, setRound] = useState(0);     // L1, L4: round index
  const [placed, setPlaced] = useState<number[]>([]); // L2, L3: order placed
  const [checked, setChecked] = useState<number[]>([]); // L5
  const [shake, setShake] = useState<number | null>(null);
  const [slips, setSlips] = useState(0);

  const routineSteps = useMemo(() => (level >= 3 ? ROUTINE : ROUTINE.slice(0, 4)), [level]);
  const pool = useMemo(
    () => (level === 2 ? shuffle(L2[round].steps.map((_, i) => i)) : level === 3 ? shuffle(routineSteps.map((_, i) => i)) : []),
    // re-shuffle each round/level
    [level, round, routineSteps],
  );
  const choiceOrder = useMemo(
    () => (level === 1 ? shuffle(L1[round].choices) : []),
    [level, round],
  );

  function slip(id: number, line: string) {
    setShake(id);
    setSlips((s) => s + 1);
    onBeluEmotion('curious');
    speak(line);
    setTimeout(() => setShake(null), 450);
  }

  function finish() {
    onBeluEmotion('excited');
    speak('You did it all by yourself — you are so ready!');
    setTimeout(() => onComplete({ stars: starsFromSlips(slips), moment: 'practiced life skills on the mountain' }), 450);
  }

  // ---------- LEVEL 1: match the action ----------
  if (level === 1) {
    const r = L1[round];
    return (
      <Shell level={level} step={round} total={L1.length} firstThen={{ first: 'Match each action', then: '⭐ Earn a star' }} instruction={`Tap what we use to: ${r.prompt}.`} speak={speak} onExit={onExit}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-center text-lg font-extrabold text-slate-700">{r.prompt}?</div>
          <div className="grid w-full grid-cols-3 gap-3">
            {choiceOrder.map((c, i) => (
              <ChoiceButton key={c} big accent={ACCENT} shake={shake === i}
                onClick={() => {
                  if (c === r.answer) {
                    onBeluEmotion('happy');
                    speak('Yes! That is just right.');
                    if (round + 1 >= L1.length) finish(); else setRound((x) => x + 1);
                  } else slip(i, `Hmm, which one do we use to ${r.prompt.toLowerCase()}?`);
                }}>
                <span className="text-4xl">{c}</span>
              </ChoiceButton>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- LEVEL 2 & 3: build the sequence in order ----------
  if (level === 2 || level === 3) {
    const steps = level === 2 ? L2[round].steps : routineSteps;
    const label = level === 2 ? L2[round].label : 'Morning routine';
    const total = level === 2 ? L2.length : steps.length;
    const step = level === 2 ? round : placed.length;

    function tap(i: number) {
      if (i === placed.length) {
        const np = [...placed, i];
        setPlaced(np);
        onBeluEmotion('happy');
        if (np.length === steps.length) {
          if (level === 2) {
            speak(`Great! That's how we do ${label.toLowerCase()}.`);
            if (round + 1 >= L2.length) finish();
            else { setTimeout(() => { setRound((x) => x + 1); setPlaced([]); }, 500); }
          } else {
            finish();
          }
        } else {
          speak(`Then comes "${steps[i].t}". What's next?`);
        }
      } else {
        slip(i, level === 2 ? `What do we do first for ${label.toLowerCase()}?` : 'What do we do first in the morning?');
      }
    }

    return (
      <Shell level={level} step={step} total={total} firstThen={{ first: `Put ${label} in order`, then: '⭐ Earn a star' }} instruction={`Tap the steps for ${label} in the right order.`} speak={speak} onExit={onExit}>
        {/* visual schedule building up */}
        <div className="mb-4 flex min-h-[58px] flex-wrap items-center justify-center gap-2 rounded-2xl bg-sky-50 p-3">
          {placed.length === 0 && <span className="text-sm text-slate-400">Start with what comes first…</span>}
          {placed.map((i, n) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow">
              <span className="text-lg">{steps[i].e}</span>{steps[i].t}
              {n < placed.length - 1 && <span className="text-sky-300">→</span>}
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pool.filter((i) => !placed.includes(i)).map((i) => (
            <motion.button key={i} onClick={() => tap(i)} whileTap={{ scale: 0.92 }} animate={shake === i ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-1 rounded-2xl border-2 border-sky-200 bg-white p-3 font-bold text-slate-700 shadow-sm">
              <span className="text-3xl">{steps[i].e}</span>
              <span className="text-xs">{steps[i].t}</span>
            </motion.button>
          ))}
        </div>
      </Shell>
    );
  }

  // ---------- LEVEL 4: safety choices ----------
  if (level === 4) {
    const s = L4[round];
    return (
      <Shell level={level} step={round} total={L4.length} firstThen={{ first: 'Pick the safe choice', then: '⭐ Earn a star' }} instruction={s.situation} speak={speak} onExit={onExit}>
        <div className="flex flex-col gap-3">
          {s.options.map((o, i) => (
            <ChoiceButton key={i} accent={ACCENT} shake={shake === i}
              onClick={() => {
                if (o.safe) {
                  onBeluEmotion('happy');
                  speak('Yes — that is the safe choice. Good thinking!');
                  if (round + 1 >= L4.length) finish(); else setRound((x) => x + 1);
                } else slip(i, 'Let\'s keep safe. Which choice keeps us safe?');
              }}>
              <span className="text-2xl">{o.e}</span><span>{o.t}</span>
            </ChoiceButton>
          ))}
        </div>
      </Shell>
    );
  }

  // ---------- LEVEL 5: independent self-check ----------
  const allDone = checked.length >= L5_TASKS.length;
  return (
    <Shell level={level} step={checked.length} total={L5_TASKS.length} firstThen={{ first: 'Check off each task', then: '⭐ Earn a star' }} instruction="Get yourself ready! Tap each task as you finish it." speak={speak} onExit={onExit}>
      <div className="flex flex-col gap-2">
        {L5_TASKS.map((t, i) => {
          const done = checked.includes(i);
          return (
            <motion.button key={i} whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (done) return;
                const nc = [...checked, i];
                setChecked(nc);
                onBeluEmotion('happy');
                if (nc.length >= L5_TASKS.length) finish(); else speak('Nice — what will you do next?');
              }}
              className="flex items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 text-left font-bold text-slate-700 shadow-sm"
              style={{ borderColor: done ? '#7ec850' : '#cfe4ff' }}>
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full" style={{ background: done ? '#7ec850' : '#eef4fb', color: done ? '#fff' : '#9bb' }}>{done ? '✓' : ''}</span>
              <span className="text-2xl">{t.e}</span>
              <span className={done ? 'text-slate-400 line-through' : ''}>{t.t}</span>
            </motion.button>
          );
        })}
      </div>
      {allDone && <p className="mt-3 text-center text-sm font-bold text-green-600">All done — you got ready by yourself! 🌟</p>}
    </Shell>
  );
}

// small wrapper to avoid repeating OverlayShell boilerplate
function Shell({
  level, step, total, firstThen, instruction, speak, onExit, children,
}: {
  level: number; step: number; total: number;
  firstThen: { first: string; then: string }; instruction: string;
  speak: (t: string) => void; onExit: () => void; children: React.ReactNode;
}) {
  return (
    <OverlayShell title="Morning Mountain" emoji="⛰️" accent={ACCENT} level={level} step={step} total={total}
      firstThen={firstThen} instruction={instruction} onSpeak={() => speak(instruction)} onExit={onExit}>
      {children}
    </OverlayShell>
  );
}
