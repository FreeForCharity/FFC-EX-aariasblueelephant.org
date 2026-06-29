// ---------------------------------------------------------------------------
// Calm Cove content — "calm the storm" play.
//   The cove water starts stormy and choppy. As the child follows BreatheOrb's
//   breaths, the sea visibly settles each cycle — waves shrink, the colour
//   brightens from stormy grey-blue to bright cyan, and at the end fish leap and
//   a rainbow appears. No quiz feel: you literally calm the sea by breathing.
//
// The pedagogy mirrors quests.ts COVE exactly (same breath counts + the same
// pre-breath actions per level), only reshaped for the embodied "calm the storm"
// mechanic so integration stays trivial:
//   L1: 2 breaths.            L2: 3 breaths.
//   L3: body-scan — walk to a glowing body-spot totem, then breathe.
//   L4: pick ONE calm strategy totem, then 1 breath.
//   L5: build a calm plan — walk to 3 strategy totems in a row, then 1 breath.
// ---------------------------------------------------------------------------

/** A totem the child walks Belu into (or taps) — a body spot or a calm strategy. */
export interface CoveTotem {
  emoji: string;
  label: string;
}

/** What the child must do BEFORE the breathing begins on a given level. */
export type CovePreStep =
  | { kind: 'none' }
  /** walk to ONE body spot to "send calm" there */
  | { kind: 'bodySpot'; totems: CoveTotem[] }
  /** walk to ONE calm strategy */
  | { kind: 'pickOne'; totems: CoveTotem[] }
  /** walk to `need` strategies in a row to build a plan */
  | { kind: 'plan'; need: number; totems: CoveTotem[] };

export interface CoveLevel {
  goal: string;
  intro: string;
  outro: string;
  moment: string;
  /** how many calm breath cycles settle the sea on this level */
  cycles: number;
  /** the action before breathing (drives the totems that appear) */
  pre: CovePreStep;
  /** the line Belu says once the pre-step is done and breathing is about to start */
  breatheCue: string;
}

// Reused calm strategies (matches quests.ts CALM_STRATEGIES pedagogy).
const STRATEGIES: CoveTotem[] = [
  { emoji: '🌬️', label: 'Deep breaths' },
  { emoji: '🤫', label: 'Quiet spot' },
  { emoji: '✊', label: 'Squeeze hands' },
  { emoji: '✋', label: 'Ask for a break' },
  { emoji: '🖐️', label: 'Count to five' },
  { emoji: '🤗', label: 'Get a big hug' },
];

// Body spots for the level-3 body scan (matches quests.ts L3 options).
const BODY_SPOTS: CoveTotem[] = [
  { emoji: '🫄', label: 'Tummy' },
  { emoji: '🫁', label: 'Chest' },
  { emoji: '💪', label: 'Shoulders' },
  { emoji: '🤲', label: 'Hands' },
];

export const COVE_LEVELS: CoveLevel[] = [
  {
    goal: 'Calm the sea with 2 breaths',
    intro: "The cove is stormy today. Let's calm the sea together — follow the bubble and breathe with me.",
    outro: 'Look — the sea is calm and bright! Thank you for breathing with me. 🌈',
    moment: 'calmed the stormy sea at the cove',
    cycles: 2,
    pre: { kind: 'none' },
    breatheCue: 'Breathe in as the bubble grows, out as it shrinks. Watch the sea settle.',
  },
  {
    goal: 'Calm the sea with 3 breaths',
    intro: "The storm is a little bigger now. We can do it — a longer calm together.",
    outro: 'The whole cove is sparkling cyan now. You calmed the sea! 🌈',
    moment: 'calmed the stormy sea at the cove',
    cycles: 3,
    pre: { kind: 'none' },
    breatheCue: 'Breathe slowly with the bubble. Each breath calms the waves.',
  },
  {
    goal: 'Send calm to your body, then breathe',
    intro: "Before we breathe, let's notice our body. Walk to a spot to send your calm to.",
    outro: 'Calm in your body, calm in the sea. Beautiful! 🌈',
    moment: 'did a calm body check at the cove',
    cycles: 2,
    pre: { kind: 'bodySpot', totems: BODY_SPOTS },
    breatheCue: 'Now breathe with me, sending calm to that spot — and watch the sea settle.',
  },
  {
    goal: 'Pick a calm strategy, then breathe',
    intro: "It feels loud and busy here. Walk to one thing that helps you feel calm.",
    outro: 'Great choice — that really helps. The sea is calm and bright. 🌈',
    moment: 'chose a calm strategy at the cove',
    cycles: 1,
    pre: { kind: 'pickOne', totems: STRATEGIES.slice(0, 4) },
    breatheCue: 'Now one calm breath together — let the sea grow calm.',
  },
  {
    goal: 'Build your calm plan, then breathe',
    intro: "Let's build YOUR calm plan. Walk to three things that help you most.",
    outro: 'A wonderful calm plan — and a calm, sparkling sea! 🌈',
    moment: 'built my own calm plan at the cove',
    cycles: 1,
    pre: { kind: 'plan', need: 3, totems: STRATEGIES },
    breatheCue: 'A wonderful plan! One calm breath to finish — and the sea is calm.',
  },
];
