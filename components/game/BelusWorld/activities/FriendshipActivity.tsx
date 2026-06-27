// ASD area — EXPRESSIVE & FUNCTIONAL LANGUAGE (Friendship Forest). Five levels
// on the Verbal Behavior progression: request (mand) → action words (verbs) →
// two-word combos → comment/label ("I see…") → sentences + turn-taking
// conversation. Errorless and no-fail: a wrong tap gently wiggles and
// re-prompts; nothing is ever "wrong". Belu models the words, then fades support.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { OverlayShell, ChoiceButton, FaceCard, starsFromSlips, type ActivityProps } from './shared';

const ACCENT = '#c6a0ff';

interface Item { e: string; word: string }

type Round =
  | { kind: 'request'; who: string; face: string; want: Item; options: Item[]; model: string }
  | { kind: 'verb'; who: string; face: string; correct: string; options: string[]; model: string }
  | { kind: 'combo'; who: string; face: string; seq: string[]; pool: string[]; model: string }
  | { kind: 'comment'; scene: string; correct: string; options: string[]; model: string }
  | { kind: 'sentence'; seq: string[]; pool: string[]; model: string }
  | { kind: 'turns'; goal: number; model: string };

const LEVEL_META: Record<number, { first: string; instruction: string }> = {
  1: { first: 'Ask for what you want', instruction: 'Tap the picture to ask for what your friend wants.' },
  2: { first: 'Pick the action word', instruction: 'Look at your friend. Tap the word for what they are doing.' },
  3: { first: 'Put two words together', instruction: 'Tap the two word-cards in order to make a message.' },
  4: { first: 'Tell what you see', instruction: 'Finish "I see a…" by tapping the right word.' },
  5: { first: 'Make a sentence & chat', instruction: 'Build the sentence, then take turns talking with Belu.' },
};

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

function buildRounds(level: number): Round[] {
  if (level === 1) {
    const items: Item[] = [
      { e: '🍎', word: 'apple' },
      { e: '⚽', word: 'ball' },
      { e: '📖', word: 'book' },
      { e: '🥤', word: 'drink' },
    ];
    const friends = [
      { who: 'Fox', face: '🦊' },
      { who: 'Bunny', face: '🐰' },
      { who: 'Bear', face: '🐻' },
    ];
    return friends.map((f, i) => {
      const want = items[i % items.length];
      const others = shuffle(items.filter((it) => it.word !== want.word)).slice(0, 2);
      return {
        kind: 'request' as const,
        who: f.who,
        face: f.face,
        want,
        options: shuffle([want, ...others]),
        model: `Let's ask! Tap to say: "I want ${want.word}."`,
      };
    });
  }
  if (level === 2) {
    return [
      { kind: 'verb', who: 'Fox', face: '🦊', correct: 'running', options: shuffle(['running', 'sleeping', 'eating']), model: 'The fox is moving fast! Tap: running.' },
      { kind: 'verb', who: 'Bird', face: '🐦', correct: 'flying', options: shuffle(['flying', 'jumping', 'eating']), model: 'Up in the sky! Tap: flying.' },
      { kind: 'verb', who: 'Bear', face: '🐻', correct: 'eating', options: shuffle(['eating', 'running', 'flying']), model: 'Yum! Tap: eating.' },
      { kind: 'verb', who: 'Bunny', face: '🐰', correct: 'jumping', options: shuffle(['jumping', 'sleeping', 'flying']), model: 'Hop hop! Tap: jumping.' },
    ];
  }
  if (level === 3) {
    const combos: { who: string; face: string; seq: string[]; extra: string[] }[] = [
      { who: 'Bunny', face: '🐰', seq: ['want', 'ball'], extra: ['book'] },
      { who: 'Fox', face: '🦊', seq: ['want', 'apple'], extra: ['drink'] },
      { who: 'Bear', face: '🐻', seq: ['big', 'hug'], extra: ['ball'] },
    ];
    return combos.map((c) => ({
      kind: 'combo' as const,
      who: c.who,
      face: c.face,
      seq: c.seq,
      pool: shuffle([...c.seq, ...c.extra]),
      model: `Let's say: "${c.seq.join(' ')}". Tap them in order.`,
    }));
  }
  if (level === 4) {
    return [
      { kind: 'comment', scene: '🐶', correct: 'dog', options: shuffle(['dog', 'cat', 'fish']), model: 'You noticed something! Tap: dog.' },
      { kind: 'comment', scene: '🌳', correct: 'tree', options: shuffle(['tree', 'rock', 'cloud']), model: 'Nice looking! Tap: tree.' },
      { kind: 'comment', scene: '⭐', correct: 'star', options: shuffle(['star', 'moon', 'sun']), model: 'Way up high! Tap: star.' },
      { kind: 'comment', scene: '🦋', correct: 'butterfly', options: shuffle(['butterfly', 'bee', 'bird']), model: 'So pretty! Tap: butterfly.' },
    ];
  }
  // level 5
  return [
    { kind: 'sentence', seq: ['I', 'like', 'apples'], pool: shuffle(['I', 'like', 'apples', 'run']), model: 'Let\'s say: "I like apples." Tap the words in order.' },
    { kind: 'sentence', seq: ['I', 'see', 'you'], pool: shuffle(['I', 'see', 'you', 'big']), model: 'Now: "I see you." Tap them in order.' },
    { kind: 'turns', goal: 4, model: 'Now let\'s chat! Take turns talking with me.' },
  ];
}

// Module-scope shell so it keeps a STABLE identity across re-renders (a nested
// component would remount the overlay and replay its entrance animation on
// every tap — a visible flicker).
function ForestShell({
  frame,
  total,
  step,
  children,
}: {
  frame: { lvl: number; meta: { first: string; instruction: string }; speak: (t: string) => void; onExit: () => void };
  total: number;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <OverlayShell
      title="Friendship Forest"
      emoji="🌳"
      accent={ACCENT}
      level={frame.lvl}
      step={step}
      total={total}
      firstThen={{ first: frame.meta.first, then: '⭐ Earn a star' }}
      instruction={frame.meta.instruction}
      onSpeak={() => frame.speak(frame.meta.instruction)}
      onExit={frame.onExit}
    >
      {children}
    </OverlayShell>
  );
}

export default function FriendshipActivity({ level, speak, onBeluEmotion, onComplete, onExit }: ActivityProps) {
  const lvl = Math.max(1, Math.min(5, level));
  const meta = LEVEL_META[lvl];
  const rounds = useMemo(() => buildRounds(lvl), [lvl]);

  const [idx, setIdx] = useState(0);
  const [built, setBuilt] = useState<number[]>([]); // chosen pool indices (combo/sentence)
  const [turns, setTurns] = useState(0);
  const [holder, setHolder] = useState<'you' | 'belu'>('you');
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const slips = useRef(0);
  const modeled = useRef(false);

  const round = rounds[idx];

  // reset per-round build state
  useEffect(() => {
    setBuilt([]);
    setTurns(0);
    setHolder('you');
  }, [idx]);

  // Belu models the target on entering a round, then fades on later rounds.
  useEffect(() => {
    onBeluEmotion('curious');
    if (idx <= 1 || !modeled.current) {
      modeled.current = true;
      const t = setTimeout(() => speak(round.model), 450);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  function slip(key: string, line: string) {
    slips.current += 1;
    setShakeKey(key);
    onBeluEmotion('curious');
    speak(line);
    setTimeout(() => setShakeKey(null), 450);
  }

  function finish() {
    onBeluEmotion('excited');
    speak('You used your words so well! I loved talking with you.');
    setTimeout(() => onComplete({ stars: starsFromSlips(slips.current), moment: 'used my words in the forest' }), 500);
  }

  function advance(praise: string) {
    onBeluEmotion('happy');
    speak(praise);
    if (idx + 1 >= rounds.length) setTimeout(finish, 650);
    else setTimeout(() => setIdx((i) => i + 1), 650);
  }

  const frame = { lvl, meta, speak, onExit };

  // ---------- REQUEST (L1) ----------
  if (round.kind === 'request') {
    return (
      <ForestShell frame={frame} total={rounds.length} step={idx}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <FaceCard emoji={round.face} label={round.who} />
            <div className="absolute -right-2 -top-1 rounded-2xl bg-white px-3 py-1 text-2xl shadow">{round.want.e}💭</div>
          </div>
          <p className="text-center text-sm font-bold text-slate-500">Tap to ask for what {round.who} wants:</p>
          <div className="grid w-full grid-cols-3 gap-3">
            {round.options.map((it) => (
              <ChoiceButton
                key={it.word}
                big
                accent={ACCENT}
                shake={shakeKey === it.word}
                onClick={() =>
                  it.word === round.want.word
                    ? advance(`Yes! "I want ${round.want.word}!" Here you go! 🎉`)
                    : slip(it.word, `Look at the thought bubble. What does ${round.who} want?`)
                }
              >
                <span className="flex flex-col items-center">
                  <span className="text-4xl">{it.e}</span>
                  <span className="text-xs">{it.word}</span>
                </span>
              </ChoiceButton>
            ))}
          </div>
        </div>
      </ForestShell>
    );
  }

  // ---------- VERB (L2) ----------
  if (round.kind === 'verb') {
    return (
      <ForestShell frame={frame} total={rounds.length} step={idx}>
        <div className="flex flex-col items-center gap-4">
          <FaceCard emoji={round.face} label={round.who} />
          <p className="text-center text-base font-bold text-slate-600">The {round.who.toLowerCase()} is…</p>
          <div className="grid w-full grid-cols-3 gap-3">
            {round.options.map((w) => (
              <ChoiceButton
                key={w}
                accent={ACCENT}
                shake={shakeKey === w}
                onClick={() =>
                  w === round.correct
                    ? advance(`Yes! The ${round.who.toLowerCase()} is ${round.correct}!`)
                    : slip(w, 'Look closely — what are they doing?')
                }
              >
                {w}
              </ChoiceButton>
            ))}
          </div>
        </div>
      </ForestShell>
    );
  }

  // ---------- COMBO / SENTENCE (L3 / L5a) — build in order ----------
  if (round.kind === 'combo' || round.kind === 'sentence') {
    const expected = round.seq[built.length];
    const tapWord = (poolIdx: number, word: string) => {
      if (built.includes(poolIdx)) return;
      if (word === expected) {
        const nb = [...built, poolIdx];
        setBuilt(nb);
        if (nb.length === round.seq.length) advance(`"${round.seq.join(' ')}" — perfect! 🌟`);
        else onBeluEmotion('happy');
      } else {
        slip('w' + poolIdx, `Next word is "${expected}". You can do it!`);
      }
    };
    return (
      <ForestShell frame={frame} total={rounds.length} step={idx}>
        <div className="flex flex-col items-center gap-4">
          {round.kind === 'combo' && <FaceCard emoji={round.face} label={round.who} size={80} />}
          {/* sentence strip */}
          <div className="flex min-h-[52px] w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-purple-50 p-3">
            {built.length === 0 && <span className="text-sm text-slate-400">Tap the words in order…</span>}
            {built.map((pi, n) => (
              <motion.span
                key={pi}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-xl bg-white px-3 py-2 text-base font-bold text-slate-700 shadow"
              >
                {round.pool[pi]}
                {n < built.length - 1 && <span className="ml-2 text-purple-300">·</span>}
              </motion.span>
            ))}
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            {round.pool.map((w, pi) => (
              <ChoiceButton
                key={pi}
                accent={ACCENT}
                shake={shakeKey === 'w' + pi}
                onClick={() => tapWord(pi, w)}
              >
                <span className={built.includes(pi) ? 'opacity-30' : ''}>{w}</span>
              </ChoiceButton>
            ))}
          </div>
        </div>
      </ForestShell>
    );
  }

  // ---------- COMMENT (L4) ----------
  if (round.kind === 'comment') {
    return (
      <ForestShell frame={frame} total={rounds.length} step={idx}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-[110px] leading-none">{round.scene}</div>
          <p className="text-center text-xl font-extrabold text-slate-700">
            I see a <span className="text-purple-400">___</span>
          </p>
          <div className="grid w-full grid-cols-3 gap-3">
            {round.options.map((w) => (
              <ChoiceButton
                key={w}
                accent={ACCENT}
                shake={shakeKey === w}
                onClick={() =>
                  w === round.correct
                    ? advance(`"I see a ${round.correct}!" Great noticing! 👀`)
                    : slip(w, 'What is in the picture? Tap its name.')
                }
              >
                {w}
              </ChoiceButton>
            ))}
          </div>
        </div>
      </ForestShell>
    );
  }

  // ---------- TURNS (L5b) ----------
  const takeTurn = () => {
    const n = turns + 1;
    setTurns(n);
    if (n >= round.goal) {
      advance('We took turns talking so nicely! That is what friends do. 💜');
    } else {
      setHolder((h) => (h === 'you' ? 'belu' : 'you'));
      onBeluEmotion('happy');
      speak(holder === 'you' ? 'My turn — thank you for sharing!' : 'Your turn now, friend!');
    }
  };
  return (
    <ForestShell frame={frame} total={rounds.length} step={idx}>
      <div className="flex flex-col items-center gap-5 py-2">
        <p className="text-center text-base font-bold text-slate-600">Take turns talking — pass it back and forth.</p>
        <div className="flex items-center justify-center gap-6">
          <FaceCard emoji="🧒" label="You" size={66} />
          <motion.span animate={{ x: holder === 'you' ? -6 : 6 }} className="text-3xl">
            🗣️
          </motion.span>
          <FaceCard emoji="🐘" label="Belu" size={66} />
        </div>
        <div className="text-lg font-extrabold text-slate-700">
          {holder === 'you' ? 'Your turn to talk!' : 'Belu is talking…'}
        </div>
        <button
          onClick={takeTurn}
          className="rounded-full bg-purple-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95"
        >
          {holder === 'you' ? 'Take my turn 🗣️' : 'Listen to Belu 👂'}
        </button>
        <p className="text-sm text-slate-400">Turn {turns} of {round.goal}</p>
      </div>
    </ForestShell>
  );
}
