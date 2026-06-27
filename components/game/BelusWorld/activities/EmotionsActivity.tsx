// ASD area — READING EMOTIONS (Feelings Meadow). Five levels following the
// evidence-based emotion-recognition hierarchy: match faces → read body
// language → infer from situations → desire-based reasoning → belief/
// perspective + how to help. Errorless and no-fail: a wrong tap gently wiggles
// and re-prompts; nothing is ever marked "wrong". Belu models learning too.

import { useEffect, useMemo, useRef, useState } from 'react';
import { OverlayShell, ChoiceButton, FaceCard, starsFromSlips, type ActivityProps } from './shared';

interface Follow {
  question: string;
  options: string[];
  answer: string;
}
interface Round {
  face: string;
  who: string;
  scene?: string;
  question: string;
  options: string[];
  answer: string;
  follow?: Follow;
}

const LEVEL_META: Record<number, { first: string; instruction: string }> = {
  1: { first: 'Match the feeling faces', instruction: 'Look at the face. Which feeling is it?' },
  2: { first: 'Read the body clues', instruction: 'Look at the face and body. How do they feel?' },
  3: { first: 'Feelings from what happens', instruction: 'Read what happened. How do they feel?' },
  4: { first: 'What they wanted', instruction: 'Think about what they wanted. How do they feel now?' },
  5: { first: 'Help a friend feel better', instruction: 'Figure out the feeling, then choose a kind way to help.' },
};

const ROUNDS: Record<number, Round[]> = {
  1: [
    { face: '😊', who: 'Pip', question: 'Which feeling is this?', options: ['happy', 'sad'], answer: 'happy' },
    { face: '😢', who: 'Milo', question: 'Which feeling is this?', options: ['sad', 'happy', 'angry'], answer: 'sad' },
    { face: '😡', who: 'Bea', question: 'Which feeling is this?', options: ['angry', 'calm', 'happy'], answer: 'angry' },
    { face: '😨', who: 'Otto', question: 'Which feeling is this?', options: ['scared', 'excited', 'sad'], answer: 'scared' },
  ],
  2: [
    { face: '😔', who: 'Milo', scene: 'Slumped shoulders, looking down at the ground.', question: 'How does Milo feel?', options: ['sad', 'excited', 'angry'], answer: 'sad' },
    { face: '🤩', who: 'Lulu', scene: 'Jumping up and down, clapping hands fast.', question: 'How does Lulu feel?', options: ['excited', 'scared', 'sad'], answer: 'excited' },
    { face: '😨', who: 'Otto', scene: 'Hiding behind a tree, shaking a little.', question: 'How does Otto feel?', options: ['scared', 'happy', 'proud'], answer: 'scared' },
    { face: '😤', who: 'Bea', scene: 'Arms crossed tight, stamping a foot.', question: 'How does Bea feel?', options: ['angry', 'calm', 'surprised'], answer: 'angry' },
  ],
  3: [
    { face: '🎁', who: 'Pip', scene: 'Pip got a surprise birthday gift!', question: 'How does Pip feel?', options: ['happy', 'sad', 'angry', 'scared'], answer: 'happy' },
    { face: '🍦', who: 'Sol', scene: "Sol's ice cream fell on the ground.", question: 'How does Sol feel?', options: ['sad', 'excited', 'proud'], answer: 'sad' },
    { face: '⛈️', who: 'Otto', scene: 'A loud thunderstorm starts booming.', question: 'How does Otto feel?', options: ['scared', 'happy', 'calm'], answer: 'scared' },
    { face: '🏆', who: 'Lulu', scene: 'Lulu finished a hard puzzle all by herself.', question: 'How does Lulu feel?', options: ['proud', 'angry', 'sad'], answer: 'proud' },
  ],
  4: [
    { face: '😞', who: 'Mona', scene: 'Mona wanted the red ball, but she got the blue one.', question: 'How does Mona feel?', options: ['disappointed', 'happy', 'surprised'], answer: 'disappointed' },
    { face: '😄', who: 'Pip', scene: 'Pip hoped for pancakes — and pancakes are ready!', question: 'How does Pip feel?', options: ['happy', 'sad', 'scared'], answer: 'happy' },
    { face: '😲', who: 'Bea', scene: 'Bea expected one friend, but TEN friends came!', question: 'How does Bea feel?', options: ['surprised', 'angry', 'bored'], answer: 'surprised' },
    { face: '😟', who: 'Sol', scene: 'Sol wanted to play outside, but it is raining.', question: 'How does Sol feel?', options: ['disappointed', 'excited', 'proud'], answer: 'disappointed' },
  ],
  5: [
    {
      face: '🧱', who: 'Sam', scene: "Sam doesn't know his block tower fell down.",
      question: 'When Sam sees it, how will he feel?', options: ['sad', 'happy', 'proud'], answer: 'sad',
      follow: { question: 'What is a kind way to help?', options: ['Give a hug and help rebuild', 'Laugh at him', 'Walk away'], answer: 'Give a hug and help rebuild' },
    },
    {
      face: '🧩', who: 'Lulu', scene: 'Lulu is stuck on a puzzle and getting frustrated.',
      question: 'How does Lulu feel?', options: ['frustrated', 'excited', 'calm'], answer: 'frustrated',
      follow: { question: 'How can you help?', options: ['Ask if she wants help', 'Take the puzzle away', 'Ignore her'], answer: 'Ask if she wants help' },
    },
    {
      face: '😢', who: 'Otto', scene: 'Otto dropped his snack and looks like he might cry.',
      question: 'How does Otto feel?', options: ['sad', 'angry', 'surprised'], answer: 'sad',
      follow: { question: 'What can you say?', options: ['"Are you okay? Want to share mine?"', '"Too bad for you!"', 'Say nothing'], answer: '"Are you okay? Want to share mine?"' },
    },
  ],
};

function shuffle(a: string[]): string[] {
  return [...a].sort(() => 0.5 - Math.random());
}

export default function EmotionsActivity({ level, speak, onBeluEmotion, onComplete, onExit }: ActivityProps) {
  const lvl = Math.max(1, Math.min(5, level));
  const rounds = ROUNDS[lvl];
  const meta = LEVEL_META[lvl];

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'main' | 'follow'>('main');
  const [slips, setSlips] = useState(0);
  const [shake, setShake] = useState<string | null>(null);
  const modeled = useRef(false);

  const round = rounds[idx];
  const inFollow = phase === 'follow' && round.follow;
  const question = inFollow ? round.follow!.question : round.question;
  const answer = inFollow ? round.follow!.answer : round.answer;
  const options = useMemo(
    () => shuffle(inFollow ? round.follow!.options : round.options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx, phase],
  );

  // Belu gently models that learning takes practice (first round only).
  useEffect(() => {
    onBeluEmotion('curious');
    if (!modeled.current) {
      modeled.current = true;
      const guess = round.options.find((o) => o !== round.answer) ?? round.answer;
      const t = setTimeout(() => speak(`Hmm... I think maybe ${guess}? Can you check for me?`), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    onBeluEmotion('excited');
    speak('You read every feeling so well. Thank you for teaching me!');
    setTimeout(() => onComplete({ stars: starsFromSlips(slips), moment: 'read feelings in the meadow' }), 500);
  }

  function choose(label: string) {
    if (label !== answer) {
      setSlips((s) => s + 1);
      setShake(label);
      onBeluEmotion('curious');
      speak('Look again — what do the clues tell us?');
      setTimeout(() => setShake(null), 450);
      return;
    }
    onBeluEmotion('happy');
    if (round.follow && phase === 'main') {
      speak('Yes! Now, how can we be a kind friend?');
      setPhase('follow');
      return;
    }
    if (idx + 1 >= rounds.length) {
      finish();
    } else {
      speak('That’s it! You really understand feelings.');
      setPhase('main');
      setIdx((i) => i + 1);
    }
  }

  return (
    <OverlayShell
      title="Feelings Meadow"
      emoji="🌸"
      accent="#ff8fc8"
      level={lvl}
      step={idx}
      total={rounds.length}
      firstThen={{ first: meta.first, then: '⭐ Earn a star' }}
      instruction={inFollow ? 'Choose the kindest way to help.' : meta.instruction}
      onSpeak={() => speak(inFollow ? round.follow!.question : meta.instruction)}
      onExit={onExit}
    >
      <div className="flex flex-col items-center gap-4">
        <FaceCard emoji={round.face} label={round.who} size={inFollow ? 80 : 116} />
        {round.scene && !inFollow && (
          <p className="rounded-2xl bg-pink-50 px-4 py-2 text-center text-base font-semibold text-slate-700">
            {round.scene}
          </p>
        )}
        <p className="text-center text-sm font-bold text-slate-500">{question}</p>
        <div className="grid w-full grid-cols-2 gap-3">
          {options.map((o) => (
            <ChoiceButton key={o} onClick={() => choose(o)} shake={shake === o} accent="#ff8fc8">
              <span className="capitalize">{o}</span>
            </ChoiceButton>
          ))}
        </div>
      </div>
    </OverlayShell>
  );
}
