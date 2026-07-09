// ---------------------------------------------------------------------------
// The lessons — now as embodied quests instead of flashcard pop-ups.
// Each island has 5 levels; each level is a short list of "rounds" the child
// plays by walking Nilu up to a friend and walking into (or tapping) glowing
// answer orbs out in the world. The pedagogy is unchanged from the original
// research-based activities — only the DELIVERY moved from a 2D quiz panel into
// the 3D world. Still errorless, no timers, no losing.
// ---------------------------------------------------------------------------

import type { ActivityZone } from '../../belu/progress';
import type { Mood } from './QuestNPC';
import { ADVANCED_QUESTS } from './advancedQuests';

export interface Orb {
  emoji: string;
  caption?: string;
  /** for 'choice' rounds: is this the right one? */
  correct?: boolean;
}

export type RoundKind = 'choice' | 'sequence' | 'multiPick' | 'breathe' | 'carry' | 'sort' | 'steps';

export interface QuestRound {
  kind: RoundKind;
  /** the line Nilu says when this round begins */
  say: string;
  /** the friend you meet for this round */
  npc: { face: string; mood: Mood; thought?: { emoji: string; caption?: string } };
  /** choice: pick the one correct orb */
  options?: Orb[];
  /** sequence: walk into these in the right order (order = captions, in order) */
  pool?: Orb[];
  order?: string[];
  /** multiPick: choose `picks` of the options (all are valid) */
  picks?: number;
  /** breathe: how many calm breath cycles */
  cycles?: number;
  /** carry: things to carry to numbered pads, in the CORRECT order — the
   *  array order itself is the correct delivery order (slot 0 = pad 1, etc).
   *  sort: things to carry to a table — `table` says which table (index into
   *  `tables`) each one belongs on; any delivery order is fine. */
  items?: (Orb & { table?: number })[];
  /** sort: the labeled tables/bins the child sorts `items` onto */
  tables?: Orb[];
  /** steps: how many stepping stones to walk, in order, 1..count */
  count?: number;
  /** steps: optional short captions spoken instead of plain numbers */
  labels?: string[];
  /** optional success line when the round is solved */
  doneLine?: string;
}

export interface Quest {
  zone: ActivityZone;
  level: number; // 1-based
  goal: string;
  intro: string;
  outro: string;
  moment: string;
  rounds: QuestRound[];
}

// ---- helpers ---------------------------------------------------------------

const FEEL: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😡', scared: '😨', excited: '🤩',
  proud: '🏆', calm: '😌', surprised: '😲', disappointed: '😞',
  frustrated: '😤', bored: '😐', kind: '💖',
};

/** an emotion-word answer orb */
function feel(word: string, correct = false): Orb {
  return { emoji: FEEL[word] ?? '🙂', caption: word, correct };
}

const MOOD = (m: Mood): Mood => m;

// ===========================================================================
// FEELINGS MEADOW — Reading Emotions
// ===========================================================================

const MEADOW: Quest[] = [
  {
    zone: 'meadow', level: 1, goal: 'Match feeling faces',
    intro: "Hi! My meadow friends are showing their feelings. Can you read each one?",
    outro: "You read every feeling so well. Thank you for teaching me!",
    moment: 'read feelings in the meadow',
    rounds: [
      { kind: 'choice', say: 'Pip is making a face. Which feeling is this?',
        npc: { face: '😊', mood: MOOD('happy') },
        options: [feel('happy', true), feel('sad')] },
      { kind: 'choice', say: 'How about Milo? Which feeling is this?',
        npc: { face: '😢', mood: MOOD('sad') },
        options: [feel('sad', true), feel('happy'), feel('angry')] },
      { kind: 'choice', say: 'Look at Bea. Which feeling is this?',
        npc: { face: '😡', mood: MOOD('angry') },
        options: [feel('angry', true), feel('calm'), feel('happy')] },
      { kind: 'choice', say: 'And Otto — which feeling is this?',
        npc: { face: '😨', mood: MOOD('scared') },
        options: [feel('scared', true), feel('excited'), feel('sad')] },
    ],
  },
  {
    zone: 'meadow', level: 2, goal: 'Read body clues',
    intro: "Now look at how my friends move their bodies. Their bodies show feelings too!",
    outro: "You read every feeling so well. Thank you for teaching me!",
    moment: 'read feelings in the meadow',
    rounds: [
      { kind: 'choice', say: 'Milo has slumped shoulders and is looking down. How does Milo feel?',
        npc: { face: '😔', mood: MOOD('sad') },
        options: [feel('sad', true), feel('excited'), feel('angry')] },
      { kind: 'choice', say: 'Lulu is jumping up and down, clapping fast. How does Lulu feel?',
        npc: { face: '🤩', mood: MOOD('excited') },
        options: [feel('excited', true), feel('scared'), feel('sad')] },
      { kind: 'choice', say: 'Otto is hiding behind a tree, shaking a little. How does Otto feel?',
        npc: { face: '😨', mood: MOOD('scared') },
        options: [feel('scared', true), feel('happy'), feel('proud')] },
      { kind: 'choice', say: 'Bea has arms crossed tight and is stamping a foot. How does Bea feel?',
        npc: { face: '😤', mood: MOOD('angry') },
        options: [feel('angry', true), feel('calm'), feel('surprised')] },
    ],
  },
  {
    zone: 'meadow', level: 3, goal: 'Feelings from what happens',
    intro: "Sometimes we know a feeling from what just happened. Let's try!",
    outro: "You read every feeling so well. Thank you for teaching me!",
    moment: 'read feelings in the meadow',
    rounds: [
      { kind: 'choice', say: 'Pip got a surprise birthday gift! How does Pip feel?',
        npc: { face: '🙂', mood: MOOD('happy'), thought: { emoji: '🎁' } },
        options: [feel('happy', true), feel('sad'), feel('angry'), feel('scared')] },
      { kind: 'choice', say: "Sol's ice cream fell on the ground. How does Sol feel?",
        npc: { face: '🙂', mood: MOOD('sad'), thought: { emoji: '🍦' } },
        options: [feel('sad', true), feel('excited'), feel('proud')] },
      { kind: 'choice', say: 'A loud thunderstorm starts booming. How does Otto feel?',
        npc: { face: '🙂', mood: MOOD('scared'), thought: { emoji: '⛈️' } },
        options: [feel('scared', true), feel('happy'), feel('calm')] },
      { kind: 'choice', say: 'Lulu finished a hard puzzle all by herself. How does Lulu feel?',
        npc: { face: '🙂', mood: MOOD('proud'), thought: { emoji: '🏆' } },
        options: [feel('proud', true), feel('angry'), feel('sad')] },
    ],
  },
  {
    zone: 'meadow', level: 4, goal: 'What they wanted',
    intro: "Feelings depend on what we hoped for. Think about what each friend wanted.",
    outro: "You read every feeling so well. Thank you for teaching me!",
    moment: 'read feelings in the meadow',
    rounds: [
      { kind: 'choice', say: 'Mona wanted the red ball, but she got the blue one. How does Mona feel?',
        npc: { face: '😞', mood: MOOD('disappointed'), thought: { emoji: '🔵' } },
        options: [feel('disappointed', true), feel('happy'), feel('surprised')] },
      { kind: 'choice', say: 'Pip hoped for pancakes — and pancakes are ready! How does Pip feel?',
        npc: { face: '😄', mood: MOOD('happy'), thought: { emoji: '🥞' } },
        options: [feel('happy', true), feel('sad'), feel('scared')] },
      { kind: 'choice', say: 'Bea expected one friend, but TEN friends came! How does Bea feel?',
        npc: { face: '😲', mood: MOOD('surprised'), thought: { emoji: '🎉' } },
        options: [feel('surprised', true), feel('angry'), feel('bored')] },
      { kind: 'choice', say: 'Sol wanted to play outside, but it is raining. How does Sol feel?',
        npc: { face: '😟', mood: MOOD('disappointed'), thought: { emoji: '🌧️' } },
        options: [feel('disappointed', true), feel('excited'), feel('proud')] },
    ],
  },
  {
    zone: 'meadow', level: 5, goal: 'Help a friend',
    intro: "The kindest thing is helping. Find the feeling, then choose a kind way to help.",
    outro: "You read every feeling so well. Thank you for teaching me!",
    moment: 'helped friends in the meadow',
    rounds: [
      { kind: 'choice', say: "Sam doesn't know his block tower fell down. When he sees it, how will he feel?",
        npc: { face: '🙂', mood: MOOD('neutral'), thought: { emoji: '🧱' } },
        options: [feel('sad', true), feel('happy'), feel('proud')] },
      { kind: 'choice', say: 'Now — what is a kind way to help Sam?',
        npc: { face: '😢', mood: MOOD('sad') },
        options: [
          { emoji: '🤗', caption: 'Hug & help rebuild', correct: true },
          { emoji: '😆', caption: 'Laugh at him' },
          { emoji: '🚶', caption: 'Walk away' },
        ], doneLine: 'That is so kind. You are a good friend.' },
      { kind: 'choice', say: 'Lulu is stuck on a puzzle and getting frustrated. How does Lulu feel?',
        npc: { face: '😤', mood: MOOD('frustrated'), thought: { emoji: '🧩' } },
        options: [feel('frustrated', true), feel('excited'), feel('calm')] },
      { kind: 'choice', say: 'How can you help Lulu?',
        npc: { face: '😤', mood: MOOD('frustrated') },
        options: [
          { emoji: '🙋', caption: 'Ask if she wants help', correct: true },
          { emoji: '🙅', caption: 'Take the puzzle away' },
          { emoji: '🚶', caption: 'Ignore her' },
        ], doneLine: 'Asking first is very kind.' },
      { kind: 'choice', say: 'Otto dropped his snack and looks like he might cry. How does Otto feel?',
        npc: { face: '😢', mood: MOOD('sad'), thought: { emoji: '🍪' } },
        options: [feel('sad', true), feel('angry'), feel('surprised')] },
      { kind: 'choice', say: 'What can you say to Otto?',
        npc: { face: '😢', mood: MOOD('sad') },
        options: [
          { emoji: '💗', caption: 'Want to share mine?', correct: true },
          { emoji: '😝', caption: 'Too bad for you!' },
          { emoji: '🤐', caption: 'Say nothing' },
        ], doneLine: 'Sharing makes friends feel better.' },
    ],
  },
];

// ===========================================================================
// MORNING MOUNTAIN — Life Skills
// ===========================================================================

function step(emoji: string, caption: string, correct = false): Orb {
  return { emoji, caption, correct };
}

const MOUNTAIN: Quest[] = [
  {
    zone: 'mountain', level: 1, goal: 'Match each action',
    intro: "Let's get ready for the day! For each question, walk to the one picture that matches.",
    outro: 'You did it all by yourself — you are so ready!',
    moment: 'practiced life skills on the mountain',
    rounds: [
      { kind: 'choice', say: 'Which one do we use to brush our teeth?',
        npc: { face: '🦷', mood: MOOD('happy') },
        options: [step('🪥', 'brush', true), step('🍕', 'pizza'), step('⚽', 'ball')] },
      { kind: 'choice', say: 'Which one washes our hands?',
        npc: { face: '🤲', mood: MOOD('happy') },
        options: [step('📺', 'TV'), step('🧼', 'soap', true), step('🎈', 'balloon')] },
      { kind: 'choice', say: 'Which one dries our hair?',
        npc: { face: '💇', mood: MOOD('happy') },
        options: [step('🚗', 'car'), step('🍞', 'bread'), step('🧴', 'dryer', true)] },
      { kind: 'choice', say: 'Which one goes on our feet?',
        npc: { face: '🦶', mood: MOOD('happy') },
        options: [step('👟', 'shoes', true), step('🪀', 'yoyo'), step('🍩', 'donut')] },
    ],
  },
  {
    zone: 'mountain', level: 2, goal: 'Build the steps',
    intro: "Some jobs have steps in order. Walk into each picture, first to last, to build the steps!",
    outro: 'You did it all by yourself — you are so ready!',
    moment: 'practiced life skills on the mountain',
    rounds: [
      { kind: 'sequence', say: 'How do we brush our teeth? Do the steps in order.',
        npc: { face: '🪥', mood: MOOD('happy') },
        pool: [step('😁', 'Brush!'), step('🪥', 'Get brush'), step('🧴', 'Toothpaste')],
        order: ['Get brush', 'Toothpaste', 'Brush!'],
        doneLine: "That's how we brush our teeth!" },
      { kind: 'sequence', say: 'Now washing hands. What order?',
        npc: { face: '🧼', mood: MOOD('happy') },
        pool: [step('🧻', 'Dry hands'), step('💧', 'Turn on water'), step('🧼', 'Use soap')],
        order: ['Turn on water', 'Use soap', 'Dry hands'],
        doneLine: 'Squeaky clean!' },
      { kind: 'sequence', say: 'Getting dressed — first to last.',
        npc: { face: '👕', mood: MOOD('happy') },
        pool: [step('👖', 'Pants'), step('🩲', 'Underclothes'), step('👕', 'Shirt')],
        order: ['Underclothes', 'Shirt', 'Pants'],
        doneLine: 'All dressed!' },
    ],
  },
  {
    zone: 'mountain', level: 3, goal: 'The whole morning',
    intro: "Let's do the WHOLE morning, step by step. Walk them in order!",
    outro: 'You did it all by yourself — you are so ready!',
    moment: 'practiced life skills on the mountain',
    rounds: [
      { kind: 'sequence', say: 'What do we do first in the morning? Go in order!',
        npc: { face: '🌅', mood: MOOD('happy') },
        pool: [
          step('🎒', 'Pack bag'), step('😴', 'Wake up'), step('🥣', 'Eat breakfast'),
          step('🪥', 'Brush teeth'), step('👋', 'Say goodbye'), step('👕', 'Get dressed'),
        ],
        order: ['Wake up', 'Brush teeth', 'Get dressed', 'Eat breakfast', 'Pack bag', 'Say goodbye'],
        doneLine: 'A perfect morning, start to finish!' },
    ],
  },
  {
    zone: 'mountain', level: 4, goal: 'Stay safe',
    intro: "Being safe is a big-kid skill. Walk to the choice that keeps us safe.",
    outro: 'You did it all by yourself — you are so ready!',
    moment: 'practiced staying safe on the mountain',
    rounds: [
      { kind: 'choice', say: 'Before crossing the street, what do we do first?',
        npc: { face: '🚦', mood: MOOD('neutral') },
        options: [step('👀', 'Look both ways', true), step('🏃', 'Run across fast')],
        doneLine: 'Yes — that is the safe choice!' },
      { kind: 'choice', say: 'The stove is hot and red. What do we do?',
        npc: { face: '🔥', mood: MOOD('neutral') },
        options: [step('🙅', 'Stay away', true), step('✋', 'Touch it')],
        doneLine: 'Staying away keeps us safe.' },
      { kind: 'choice', say: 'A stranger asks you to go with them. What do we do?',
        npc: { face: '❓', mood: MOOD('neutral') },
        options: [step('🙋', 'Find a grown-up you trust', true), step('🚶', 'Go with them')],
        doneLine: 'Always find a trusted grown-up.' },
      { kind: 'choice', say: 'Time to ride in the car. What do we do?',
        npc: { face: '🚗', mood: MOOD('neutral') },
        options: [step('🔒', 'Buckle your seatbelt', true), step('🎮', 'Stand up and play')],
        doneLine: 'Click! Safe and ready.' },
    ],
  },
  {
    zone: 'mountain', level: 5, goal: 'All by myself',
    intro: "Can you get ready all by yourself? Walk to each job you can do!",
    outro: 'You did it all by yourself — you are so ready!',
    moment: 'got ready all by myself',
    rounds: [
      { kind: 'multiPick', say: 'Do each morning job — walk into all five!', picks: 5,
        npc: { face: '🌟', mood: MOOD('proud') },
        options: [
          step('🛏️', 'Make the bed'), step('🪥', 'Brush teeth'), step('👕', 'Get dressed'),
          step('🥣', 'Eat breakfast'), step('🎒', 'Pack my bag'),
        ],
        doneLine: 'All done — you got ready by yourself! 🌟' },
    ],
  },
];

// ===========================================================================
// CALM COVE — Self-Regulation & Senses
// ===========================================================================

const CALM_STRATEGIES: Orb[] = [
  { emoji: '🌬️', caption: 'Deep breaths', correct: true },
  { emoji: '🤫', caption: 'Quiet spot', correct: true },
  { emoji: '✊', caption: 'Squeeze hands', correct: true },
  { emoji: '✋', caption: 'Ask for a break', correct: true },
  { emoji: '🖐️', caption: 'Count to five', correct: true },
  { emoji: '🤗', caption: 'Get a big hug', correct: true },
];

const COVE: Quest[] = [
  {
    zone: 'cove', level: 1, goal: 'Breathe with Nilu',
    intro: "Welcome to the cove. Let's feel calm together. Follow the bubble with me.",
    outro: 'I feel calm and cozy now. Thank you for being with me.',
    moment: 'practiced staying calm at the cove',
    rounds: [
      { kind: 'breathe', say: 'Breathe in as the bubble grows, out as it shrinks.',
        npc: { face: '😌', mood: MOOD('calm') }, cycles: 2 },
    ],
  },
  {
    zone: 'cove', level: 2, goal: 'A longer calm',
    intro: "Let's take a longer calm together. Follow the bubble.",
    outro: 'I feel calm and cozy now. Thank you for being with me.',
    moment: 'practiced staying calm at the cove',
    rounds: [
      { kind: 'breathe', say: 'Breathe in as the bubble grows, out as it shrinks.',
        npc: { face: '😌', mood: MOOD('calm') }, cycles: 3 },
    ],
  },
  {
    zone: 'cove', level: 3, goal: 'Body check',
    intro: "Let's notice our body. Pick a place to send calm to, then we'll breathe.",
    outro: 'I feel calm and cozy now. Thank you for being with me.',
    moment: 'did a calm body check at the cove',
    rounds: [
      { kind: 'choice', say: 'Where will you send your calm? Walk to a spot.',
        npc: { face: '😌', mood: MOOD('calm') },
        options: [
          { emoji: '🫄', caption: 'Tummy', correct: true },
          { emoji: '🫁', caption: 'Chest', correct: true },
          { emoji: '💪', caption: 'Shoulders', correct: true },
          { emoji: '🤲', caption: 'Hands', correct: true },
        ], doneLine: 'Lovely. Sending calm there now.' },
      { kind: 'breathe', say: "Now breathe with me, sending calm to that spot.",
        npc: { face: '😌', mood: MOOD('calm') }, cycles: 2 },
    ],
  },
  {
    zone: 'cove', level: 4, goal: 'Pick a strategy',
    intro: "Sometimes things feel too big. It is loud and busy here. What helps you?",
    outro: 'I feel calm and cozy now. Thank you for being with me.',
    moment: 'chose a calm strategy at the cove',
    rounds: [
      { kind: 'choice', say: 'It is very loud and busy. Walk to something that helps you feel calm.',
        npc: { face: '🫨', mood: MOOD('frustrated') },
        options: CALM_STRATEGIES.slice(0, 4),
        doneLine: 'Great idea — that really helps. One calm breath now.' },
      { kind: 'breathe', say: 'One calm breath together.',
        npc: { face: '😌', mood: MOOD('calm') }, cycles: 1 },
    ],
  },
  {
    zone: 'cove', level: 5, goal: 'My calm plan',
    intro: "Let's build YOUR calm plan. Pick three things that help you most.",
    outro: 'That is a wonderful calm plan. I feel calm and cozy now.',
    moment: 'built my own calm plan',
    rounds: [
      { kind: 'multiPick', say: 'Walk into THREE things for your very own calm plan.', picks: 3,
        npc: { face: '🌟', mood: MOOD('calm') },
        options: CALM_STRATEGIES,
        doneLine: 'A wonderful calm plan. One breath to finish.' },
      { kind: 'breathe', say: "Let's finish with one calm breath.",
        npc: { face: '😌', mood: MOOD('calm') }, cycles: 1 },
    ],
  },
];

// ===========================================================================
// FRIENDSHIP FOREST — Expressive Language
// ===========================================================================

const FOREST: Quest[] = [
  {
    zone: 'forest', level: 1, goal: 'Ask for it',
    intro: "My forest friends want things. Help them ask! Walk to what they want.",
    outro: 'You used your words so well! I loved talking with you.',
    moment: 'used my words in the forest',
    rounds: [
      { kind: 'choice', say: 'The fox wants something. Look at the bubble — what does Fox want?',
        npc: { face: '🦊', mood: MOOD('happy'), thought: { emoji: '🍎' } },
        options: [
          { emoji: '🍎', caption: 'I want apple', correct: true },
          { emoji: '⚽', caption: 'I want ball' },
          { emoji: '📖', caption: 'I want book' },
        ], doneLine: 'Yes! "I want apple!" Here you go! 🎉' },
      { kind: 'choice', say: 'What does Bunny want?',
        npc: { face: '🐰', mood: MOOD('happy'), thought: { emoji: '⚽' } },
        options: [
          { emoji: '⚽', caption: 'I want ball', correct: true },
          { emoji: '🥤', caption: 'I want drink' },
          { emoji: '🍎', caption: 'I want apple' },
        ], doneLine: 'Yes! "I want ball!" 🎉' },
      { kind: 'choice', say: 'And what does Bear want?',
        npc: { face: '🐻', mood: MOOD('happy'), thought: { emoji: '📖' } },
        options: [
          { emoji: '📖', caption: 'I want book', correct: true },
          { emoji: '⚽', caption: 'I want ball' },
          { emoji: '🥤', caption: 'I want drink' },
        ], doneLine: 'Yes! "I want book!" 🎉' },
    ],
  },
  {
    zone: 'forest', level: 2, goal: 'Action words',
    intro: "Watch what my friends are doing. Walk to the action word!",
    outro: 'You used your words so well! I loved talking with you.',
    moment: 'used my words in the forest',
    rounds: [
      { kind: 'choice', say: 'The fox is moving fast! What is the fox doing?',
        npc: { face: '🦊', mood: MOOD('excited'), thought: { emoji: '💨' } },
        options: [
          { emoji: '🏃', caption: 'running', correct: true },
          { emoji: '😴', caption: 'sleeping' },
          { emoji: '🍽️', caption: 'eating' },
        ], doneLine: 'Yes! The fox is running!' },
      { kind: 'choice', say: 'Up in the sky! What is the bird doing?',
        npc: { face: '🐦', mood: MOOD('excited'), thought: { emoji: '☁️' } },
        options: [
          { emoji: '🕊️', caption: 'flying', correct: true },
          { emoji: '🦘', caption: 'jumping' },
          { emoji: '🍽️', caption: 'eating' },
        ], doneLine: 'Yes! The bird is flying!' },
      { kind: 'choice', say: 'Yum! What is the bear doing?',
        npc: { face: '🐻', mood: MOOD('happy'), thought: { emoji: '🍯' } },
        options: [
          { emoji: '🍽️', caption: 'eating', correct: true },
          { emoji: '🏃', caption: 'running' },
          { emoji: '🕊️', caption: 'flying' },
        ], doneLine: 'Yes! The bear is eating!' },
      { kind: 'choice', say: 'Hop hop! What is the bunny doing?',
        npc: { face: '🐰', mood: MOOD('excited'), thought: { emoji: '⬆️' } },
        options: [
          { emoji: '🦘', caption: 'jumping', correct: true },
          { emoji: '😴', caption: 'sleeping' },
          { emoji: '🕊️', caption: 'flying' },
        ], doneLine: 'Yes! The bunny is jumping!' },
    ],
  },
  {
    zone: 'forest', level: 3, goal: 'Two words',
    intro: "Let's put two words together. Walk into the words in order!",
    outro: 'You used your words so well! I loved talking with you.',
    moment: 'used my words in the forest',
    rounds: [
      { kind: 'sequence', say: 'Say it with me: "want ball". Walk into the words in order.',
        npc: { face: '🐰', mood: MOOD('happy') },
        pool: [{ emoji: '📖', caption: 'book' }, { emoji: '🙋', caption: 'want' }, { emoji: '⚽', caption: 'ball' }],
        order: ['want', 'ball'], doneLine: '"want ball" — perfect! 🌟' },
      { kind: 'sequence', say: 'Now: "want apple".',
        npc: { face: '🦊', mood: MOOD('happy') },
        pool: [{ emoji: '🥤', caption: 'drink' }, { emoji: '🙋', caption: 'want' }, { emoji: '🍎', caption: 'apple' }],
        order: ['want', 'apple'], doneLine: '"want apple" — perfect! 🌟' },
      { kind: 'sequence', say: 'And: "big hug".',
        npc: { face: '🐻', mood: MOOD('happy') },
        pool: [{ emoji: '⚽', caption: 'ball' }, { emoji: '🫅', caption: 'big' }, { emoji: '🤗', caption: 'hug' }],
        order: ['big', 'hug'], doneLine: '"big hug" — perfect! 🌟' },
    ],
  },
  {
    zone: 'forest', level: 4, goal: 'I see…',
    intro: "When we notice things, we can say 'I see…'. Walk to what you see!",
    outro: 'You used your words so well! I loved talking with you.',
    moment: 'used my words in the forest',
    rounds: [
      { kind: 'choice', say: 'You noticed something! Say "I see a…" — walk to it.',
        npc: { face: '👀', mood: MOOD('happy'), thought: { emoji: '🐶' } },
        options: [
          { emoji: '🐶', caption: 'dog', correct: true },
          { emoji: '🐱', caption: 'cat' },
          { emoji: '🐟', caption: 'fish' },
        ], doneLine: 'I see a dog! Great noticing! 👀' },
      { kind: 'choice', say: 'Nice looking! What do you see?',
        npc: { face: '👀', mood: MOOD('happy'), thought: { emoji: '🌳' } },
        options: [
          { emoji: '🌳', caption: 'tree', correct: true },
          { emoji: '🪨', caption: 'rock' },
          { emoji: '☁️', caption: 'cloud' },
        ], doneLine: 'I see a tree! 👀' },
      { kind: 'choice', say: 'Way up high! What do you see?',
        npc: { face: '👀', mood: MOOD('happy'), thought: { emoji: '⭐' } },
        options: [
          { emoji: '⭐', caption: 'star', correct: true },
          { emoji: '🌙', caption: 'moon' },
          { emoji: '☀️', caption: 'sun' },
        ], doneLine: 'I see a star! 👀' },
      { kind: 'choice', say: 'So pretty! What do you see?',
        npc: { face: '👀', mood: MOOD('happy'), thought: { emoji: '🦋' } },
        options: [
          { emoji: '🦋', caption: 'butterfly', correct: true },
          { emoji: '🐝', caption: 'bee' },
          { emoji: '🐦', caption: 'bird' },
        ], doneLine: 'I see a butterfly! 👀' },
    ],
  },
  {
    zone: 'forest', level: 5, goal: 'Sentences & chat',
    intro: "Let's make whole sentences, then take turns chatting like good friends!",
    outro: 'We took turns talking so nicely! That is what friends do. 💜',
    moment: 'made sentences and took turns',
    rounds: [
      { kind: 'sequence', say: 'Say: "I like apples." Walk into the words in order.',
        npc: { face: '😊', mood: MOOD('happy') },
        pool: [
          { emoji: '🏃', caption: 'run' }, { emoji: '🙋', caption: 'I' },
          { emoji: '🍎', caption: 'apples' }, { emoji: '💗', caption: 'like' },
        ],
        order: ['I', 'like', 'apples'], doneLine: '"I like apples." Wonderful!' },
      { kind: 'sequence', say: 'Now: "I see you."',
        npc: { face: '😊', mood: MOOD('happy') },
        pool: [
          { emoji: '🫅', caption: 'big' }, { emoji: '🙋', caption: 'I' },
          { emoji: '🫵', caption: 'you' }, { emoji: '👀', caption: 'see' },
        ],
        order: ['I', 'see', 'you'], doneLine: '"I see you." Now let\'s chat — take turns!' },
      { kind: 'multiPick', say: "Let's take turns! Walk into each chat bubble to share a turn.", picks: 4,
        npc: { face: '🐘', mood: MOOD('happy') },
        options: [
          { emoji: '💬', caption: 'My turn' },
          { emoji: '🗨️', caption: 'Your turn' },
          { emoji: '💬', caption: 'My turn' },
          { emoji: '🗨️', caption: 'Your turn' },
        ],
        doneLine: 'We took turns so nicely! 💜' },
    ],
  },
];

// ===========================================================================
// SHARING SHORE — Sharing & Taking Turns
// ===========================================================================

const SHORE: Quest[] = [
  {
    zone: 'shore', level: 1, goal: 'Whose turn is it?',
    intro: "My beach friends are playing catch! Help me see whose turn it is.",
    outro: 'You know all about turns now. Turn-taking makes games fun for everyone!',
    moment: 'learned about turns at the shore',
    rounds: [
      { kind: 'choice', say: 'Crab just threw the ball to Seal. Whose turn is it now?',
        npc: { face: '🦀', mood: MOOD('happy'), thought: { emoji: '⚽' } },
        options: [
          { emoji: '🦭', caption: "Seal's turn", correct: true },
          { emoji: '🦀', caption: "Crab's turn" },
        ], doneLine: "Yes! Seal has the ball, so it's Seal's turn!" },
      { kind: 'choice', say: 'Seal threw it back! Whose turn is it now?',
        npc: { face: '🦭', mood: MOOD('excited'), thought: { emoji: '⚽' } },
        options: [
          { emoji: '🦀', caption: "Crab's turn", correct: true },
          { emoji: '🦭', caption: "Seal's turn" },
        ], doneLine: 'Yes! Back and forth — that is taking turns!' },
      { kind: 'choice', say: 'Crab says YOU can play too! Crab goes, Seal goes... who goes next?',
        npc: { face: '🦀', mood: MOOD('happy'), thought: { emoji: '🫵' } },
        options: [
          { emoji: '🙋', caption: 'My turn', correct: true },
          { emoji: '🦀', caption: "Crab's turn" },
        ], doneLine: 'Your turn! Everyone gets a turn when we share the game. 🎉' },
    ],
  },
  {
    zone: 'shore', level: 2, goal: 'Share the shells',
    intro: "I found SO many shells! Sharing means everyone gets some. Let's give some to my friends.",
    outro: 'You shared with every friend. Look how happy they are!',
    moment: 'shared my shells at the shore',
    rounds: [
      { kind: 'multiPick', say: 'Walk into a shell to give it away — one for each friend!', picks: 3,
        npc: { face: '🐢', mood: MOOD('happy') },
        options: [
          { emoji: '🐚', caption: 'for Turtle' },
          { emoji: '🐚', caption: 'for Crab' },
          { emoji: '🐚', caption: 'for Seal' },
        ],
        doneLine: 'A shell for everyone! Sharing feels good. 💖' },
      { kind: 'choice', say: 'Turtle only has one bucket, and you want to build too. What is the sharing way?',
        npc: { face: '🐢', mood: MOOD('happy'), thought: { emoji: '🪣' } },
        options: [
          { emoji: '🤝', caption: 'use it together', correct: true },
          { emoji: '🏃', caption: 'grab it and run' },
        ], doneLine: 'Yes! We can use it together — that is sharing!' },
      { kind: 'choice', say: 'Seal wants to see your shiny shell. You can share a LOOK! What do you say?',
        npc: { face: '🦭', mood: MOOD('happy'), thought: { emoji: '✨' } },
        options: [
          { emoji: '🫴', caption: 'here, look!', correct: true },
          { emoji: '🙈', caption: 'no, mine!' },
        ], doneLine: '"Here, look!" You shared and it is still yours. 🌟' },
    ],
  },
  {
    zone: 'shore', level: 3, goal: 'Waiting is okay',
    intro: "Sometimes we wait for our turn. Waiting is hard for me too! Let's practice together.",
    outro: 'You waited SO well. Waiting means your turn is coming!',
    moment: 'practiced waiting at the shore',
    rounds: [
      { kind: 'choice', say: 'Crab is on the slide. You want a turn! What do we do first?',
        npc: { face: '🦀', mood: MOOD('happy'), thought: { emoji: '🛝' } },
        options: [
          { emoji: '⏳', caption: 'wait my turn', correct: true },
          { emoji: '😤', caption: 'push past' },
        ], doneLine: 'Yes — we wait, and our turn comes!' },
      { kind: 'breathe', say: 'Waiting time! Take slow breaths with me while Crab finishes.',
        npc: { face: '🐘', mood: MOOD('calm') }, cycles: 2,
        doneLine: 'Look — Crab is done. Now it is YOUR turn! 🛝' },
      { kind: 'choice', say: 'Turtle is still using the bucket. What can you do while you wait?',
        npc: { face: '🐢', mood: MOOD('calm'), thought: { emoji: '🪣' } },
        options: [
          { emoji: '🏖️', caption: 'play nearby', correct: true },
          { emoji: '😡', caption: 'yell at Turtle' },
        ], doneLine: 'Playing nearby makes waiting easy — and your turn still comes!' },
    ],
  },
  {
    zone: 'shore', level: 4, goal: 'Ask for a turn',
    intro: "When we want a turn, we can ASK with kind words. Let's build the asking words!",
    outro: 'You asked so kindly! Kind words open the way to turns.',
    moment: 'asked for a turn at the shore',
    rounds: [
      { kind: 'sequence', say: 'Say it with me: "my turn please". Walk into the words in order.',
        npc: { face: '🦭', mood: MOOD('happy') },
        pool: [{ emoji: '🏃', caption: 'run' }, { emoji: '🙋', caption: 'my turn' }, { emoji: '🙏', caption: 'please' }],
        order: ['my turn', 'please'], doneLine: '"My turn please!" Seal smiles and hands it over. 🌟' },
      { kind: 'sequence', say: 'Crab asked YOU for a turn! Say: "your turn now".',
        npc: { face: '🦀', mood: MOOD('happy') },
        pool: [{ emoji: '🐚', caption: 'shell' }, { emoji: '🫵', caption: 'your turn' }, { emoji: '⏰', caption: 'now' }],
        order: ['your turn', 'now'], doneLine: '"Your turn now!" Giving a turn is a gift. 💖' },
      { kind: 'choice', say: 'You asked, but Turtle says "not yet — one more minute." What do we do?',
        npc: { face: '🐢', mood: MOOD('calm'), thought: { emoji: '⏳' } },
        options: [
          { emoji: '👍', caption: 'okay, I can wait', correct: true },
          { emoji: '😭', caption: 'grab it anyway' },
        ], doneLine: 'You waited kindly — and Turtle remembered your turn!' },
    ],
  },
  {
    zone: 'shore', level: 5, goal: 'Build together',
    intro: "Bunny wants to build a sandcastle... and so do I! Let's build ONE castle — together!",
    outro: 'We built it TOGETHER. Sharing made it twice as good. 🏰',
    moment: 'built a sandcastle with a friend',
    rounds: [
      { kind: 'choice', say: 'One pile of sand, two builders. How do we start?',
        npc: { face: '🐰', mood: MOOD('excited'), thought: { emoji: '🏰' } },
        options: [
          { emoji: '🤝', caption: 'build together', correct: true },
          { emoji: '🧱', caption: 'build a wall between us' },
        ], doneLine: 'Together! Two builders make one AMAZING castle.' },
      { kind: 'multiPick', say: 'Take turns adding parts! Walk into each turn to build.', picks: 4,
        npc: { face: '🐰', mood: MOOD('happy') },
        options: [
          { emoji: '🏰', caption: 'my tower' },
          { emoji: '🐰', caption: "Bunny's wall" },
          { emoji: '🚩', caption: 'my flag' },
          { emoji: '🐚', caption: "Bunny's shells" },
        ],
        doneLine: 'Turn by turn, the castle grew! 🏰' },
      { kind: 'choice', say: 'The castle is done! Bunny looks so proud. What do we say?',
        npc: { face: '🐰', mood: MOOD('proud'), thought: { emoji: '🏰' } },
        options: [
          { emoji: '🎉', caption: 'we did it!', correct: true },
          { emoji: '😤', caption: 'mine is better' },
        ], doneLine: '"WE did it!" That is the best part of sharing. 💜' },
    ],
  },
];

// ===========================================================================
// NILU'S DAY ARC — School, Fun Corner, and Sleepy Island. Same shape as every
// other island: 5 levels, short warm rounds, errorless, no timers, no losing.
// ===========================================================================

// ---- SCHOOL ISLAND — School Skills ----------------------------------------

const SCHOOL: Quest[] = [
  {
    zone: 'school', level: 1, goal: 'Getting ready to learn',
    intro: "Good morning! It's school time. Owl teacher is here. Let's get ready to learn together.",
    outro: 'You know just how to get ready to learn. Great job!',
    moment: 'got ready to learn on School Island',
    rounds: [
      { kind: 'carry', say: "Let's pack the backpack! Pick up the book and carry it to spot 1!",
        npc: { face: '🎒', mood: MOOD('happy') },
        items: [
          { emoji: '📚', caption: 'book' },
          { emoji: '🥪', caption: 'lunchbox' },
          { emoji: '💧', caption: 'water bottle' },
        ],
        doneLine: 'Packed and ready — book, lunchbox, water bottle!' },
      { kind: 'choice', say: 'The teacher is talking to the class. What do I do?',
        npc: { face: '🦉', mood: MOOD('happy') },
        options: [
          step('👂', 'Listen', true), step('📢', 'Shout'), step('🚶', 'Walk away'),
        ], doneLine: 'Listening ears help you learn.' },
    ],
  },
  {
    zone: 'school', level: 2, goal: 'Raising my hand',
    intro: "In school, we use our hand to talk. Let's practice raising it!",
    outro: 'You raised your hand so nicely. The teacher always sees you.',
    moment: 'practiced raising my hand on School Island',
    rounds: [
      { kind: 'choice', say: 'I have a question for my teacher. What do I do?',
        npc: { face: '🦉', mood: MOOD('happy'), thought: { emoji: '❓' } },
        options: [
          step('✋', 'Raise my hand and wait', true), step('📢', 'Call out'), step('🤚', 'Grab the teacher'),
        ], doneLine: 'Raise your hand and wait — the teacher will see you.' },
      { kind: 'choice', say: 'The teacher is helping Bunny right now. What do I do?',
        npc: { face: '🐰', mood: MOOD('happy'), thought: { emoji: '⏳' } },
        options: [
          step('⏳', 'Wait my turn', true), step('🗣️', 'Interrupt'),
        ], doneLine: 'Waiting is hard, but your turn is coming.' },
    ],
  },
  {
    zone: 'school', level: 3, goal: 'Staying in my seat & asking for a break',
    intro: "Sitting for a while can feel hard. It's always okay to ask for a break!",
    outro: 'Asking for a break is always okay — you did it so well.',
    moment: 'practiced asking for a break on School Island',
    rounds: [
      { kind: 'choice', say: 'It is work time at my table. What do I do?',
        npc: { face: '🦉', mood: MOOD('happy') },
        options: [
          step('🪑', 'Stay in my seat', true), step('🚶', 'Wander around'),
        ], doneLine: 'Staying in your seat helps you finish your work.' },
      { kind: 'choice', say: 'My body feels wiggly and I want to move. What can I do?',
        npc: { face: '🦉', mood: MOOD('neutral'), thought: { emoji: '🌀' } },
        options: [
          step('🙋', 'Ask for a break', true), step('🏃', 'Run out the door'), step('🙈', 'Hide under the desk'),
        ], doneLine: 'Asking for a break is always okay!' },
      { kind: 'breathe', say: 'The teacher says yes! Take your break — breathe slow with me.',
        npc: { face: '🦉', mood: MOOD('calm') }, cycles: 2,
        doneLine: 'A calm break helps you feel ready again.' },
    ],
  },
  {
    zone: 'school', level: 4, goal: 'Lunch time manners',
    intro: "It's lunch time! Let's use kind lunch manners with our friends.",
    outro: 'Such kind lunch manners — you shared the table so nicely.',
    moment: 'practiced lunch manners on School Island',
    rounds: [
      { kind: 'choice', say: 'Bear has a yummy cookie at lunch. It looks so good! What do I do?',
        npc: { face: '🐻', mood: MOOD('happy'), thought: { emoji: '🍪' } },
        options: [
          step('🙏', 'Ask first', true), step('🤚', 'Take it without asking'), step('😋', 'Grab some'),
        ], doneLine: "Asking first is kind. Then it's Bear's choice to share." },
      { kind: 'sort', say: "Let's sort lunch things! Carry each one to whose it is.",
        npc: { face: '🦉', mood: MOOD('happy') },
        tables: [
          { emoji: '🎒', caption: 'My things' },
          { emoji: '🐻', caption: "Bear's things" },
        ],
        items: [
          { emoji: '🍱', caption: 'My lunchbox', table: 0 },
          { emoji: '💧', caption: 'My water bottle', table: 0 },
          { emoji: '🍪', caption: "Bear's cookie", table: 1 },
        ],
        doneLine: "Yours stay with you, Bear's stay with Bear!" },
    ],
  },
  {
    zone: 'school', level: 5, goal: 'Being a classroom friend',
    intro: "The best part of school is being a good friend. Let's practice classroom kindness!",
    outro: 'You finished a whole school day being such a good friend — I am SO proud of you!',
    moment: 'was a classroom friend on School Island',
    rounds: [
      { kind: 'choice', say: 'Bunny dropped her books on the floor! What is a kind thing to do?',
        npc: { face: '🐰', mood: MOOD('sad'), thought: { emoji: '📚' } },
        options: [
          step('🤝', 'Help pick them up', true), step('😆', 'Laugh'), step('🚶', 'Walk away'),
        ], doneLine: 'Helping a friend is the kindest thing.' },
      { kind: 'choice', say: "We're building with the classroom blocks together. My hands should be...",
        npc: { face: '🦉', mood: MOOD('happy') },
        options: [
          step('🤲', 'Gentle', true), step('✊', 'Grabby'),
        ], doneLine: 'Gentle hands keep the blocks — and your friends — safe.' },
      { kind: 'choice', say: 'Bear wants a turn with the classroom toy. What do I do?',
        npc: { face: '🐻', mood: MOOD('happy'), thought: { emoji: '🧸' } },
        options: [
          step('🔄', 'Give Bear a turn', true), step('🙅', 'Keep it to myself'),
        ], doneLine: 'Taking turns makes the toy fun for everyone.' },
    ],
  },
];

// ---- FUN CORNER — Home Routines --------------------------------------------

const AFTERNOON: Quest[] = [
  {
    zone: 'afternoon', level: 1, goal: 'Coming home',
    intro: "We're home from school! Buddy Dog is SO happy to see you. Let's do our coming-home steps.",
    outro: 'Coming home the cozy way — you know just what to do!',
    moment: 'practiced coming home at the Fun Corner',
    rounds: [
      { kind: 'sequence', say: "We're home! Walk into the steps in order.",
        npc: { face: '🐕', mood: MOOD('happy'), thought: { emoji: '👟' } },
        pool: [
          step('👟', 'Take off my shoes'), step('🧼', 'Wash my hands'),
          step('🤗', 'Hug my family'), step('📺', 'Turn on the TV'),
        ],
        order: ['Take off my shoes', 'Wash my hands', 'Hug my family'],
        doneLine: 'Home, safe, and clean — now for hugs!' },
      { kind: 'choice', say: 'Buddy Dog runs to meet you at the door. What do you say?',
        npc: { face: '🐕', mood: MOOD('excited') },
        options: [
          step('👋', 'Hi Buddy!', true), step('🙈', 'Ignore Buddy'),
        ], doneLine: 'Buddy Dog loves being greeted!' },
    ],
  },
  {
    zone: 'afternoon', level: 2, goal: 'Snack time',
    intro: "Snack time at the little table! Let's make a healthy pick and ask nicely.",
    outro: 'That was the nicest snack time ever.',
    moment: 'shared snack time at the Fun Corner',
    rounds: [
      { kind: 'sort', say: "Let's sort snacks! Carry each one to the right plate.",
        npc: { face: '🐕', mood: MOOD('happy'), thought: { emoji: '🍎' } },
        tables: [
          { emoji: '🍎', caption: 'Every day' },
          { emoji: '🎉', caption: 'Sometimes' },
        ],
        items: [
          { emoji: '🍎', caption: 'apple', table: 0 },
          { emoji: '🥕', caption: 'carrot', table: 0 },
          { emoji: '🍬', caption: 'candy', table: 1 },
          { emoji: '🍟', caption: 'chips', table: 1 },
        ],
        doneLine: 'Every-day foods and sometimes-treats — both are okay, just not the same amount!' },
      { kind: 'choice', say: 'You want a snack from the kitchen. What do you do?',
        npc: { face: '🐕', mood: MOOD('happy') },
        options: [
          step('🙋', 'Ask a grown-up', true), step('🤚', 'Grab it myself'),
        ], doneLine: 'Asking first is the safe, kind way.' },
    ],
  },
  {
    zone: 'afternoon', level: 3, goal: 'Homework first, then play',
    intro: "It's First-Then time! First homework, then something fun.",
    outro: 'First homework, THEN play — you earned it!',
    moment: 'did homework first, then played at the Fun Corner',
    rounds: [
      { kind: 'choice', say: 'First homework, then...',
        npc: { face: '🐕', mood: MOOD('happy'), thought: { emoji: '📝' } },
        options: [
          step('🧸', 'Play', true), step('📚', 'More homework'),
        ], doneLine: 'First homework, then play — that is the plan!' },
      { kind: 'steps', say: "Let's walk the plan: First, Then, Next!",
        npc: { face: '🐕', mood: MOOD('happy') },
        count: 3,
        labels: ['First: homework 📖', 'Then: puzzle 🧩', 'Next: play ⚽'],
        doneLine: 'First homework, then puzzle, next play — you followed the whole plan!' },
    ],
  },
  {
    zone: 'afternoon', level: 4, goal: 'Play time choices',
    intro: "Now the BEST part — play time! Let's play outside the friendly way.",
    outro: 'Playing with you is the best part of my day.',
    moment: 'played outside the friendly way at the Fun Corner',
    rounds: [
      { kind: 'choice', say: 'You want to go play outside. What do we do first?',
        npc: { face: '🐕', mood: MOOD('excited'), thought: { emoji: '🚪' } },
        options: [
          step('🙋', 'Ask a grown-up', true), step('🚪', 'Just go outside'),
        ], doneLine: 'Asking first keeps you safe.' },
      { kind: 'choice', say: 'Buddy Dog wants a turn on the swing too. What do we do?',
        npc: { face: '🐕', mood: MOOD('happy'), thought: { emoji: '🛝' } },
        options: [
          step('🔄', 'Take turns', true), step('🙅', 'Keep swinging'),
        ], doneLine: 'Taking turns means everyone gets a turn.' },
      { kind: 'choice', say: 'You have one ball to share outside. What is the sharing way?',
        npc: { face: '🐕', mood: MOOD('happy'), thought: { emoji: '⚽' } },
        options: [
          step('🤝', 'Play together', true), step('🙅', 'Keep the ball to myself'),
        ], doneLine: 'Sharing makes outside play more fun.' },
    ],
  },
  {
    zone: 'afternoon', level: 5, goal: 'Tidy-up time',
    intro: "Play time is winding down. Let's tidy up — everything has its own place!",
    outro: 'Everything back in its place — the Fun Corner sparkles!',
    moment: 'tidied up at the Fun Corner',
    rounds: [
      { kind: 'carry', say: 'Time to tidy up! Pick up the toys and carry them to spot 1!',
        npc: { face: '🐕', mood: MOOD('happy'), thought: { emoji: '🧸' } },
        items: [
          { emoji: '🧸', caption: 'toys' },
          { emoji: '📚', caption: 'books' },
          { emoji: '👕', caption: 'clothes' },
        ],
        doneLine: 'Toys in the bin, books on the shelf, clothes in the basket — tidy!' },
      { kind: 'choice', say: 'One lost sock is on the floor. Where does it go?',
        npc: { face: '🐕', mood: MOOD('happy') },
        options: [
          step('🧺', 'The laundry basket', true), step('🛏️', 'Under the bed'),
        ], doneLine: 'Every little thing has its place.' },
    ],
  },
];

// ---- SLEEPY ISLAND — Bedtime Routines ---------------------------------------

const NIGHT: Quest[] = [
  {
    zone: 'night', level: 1, goal: 'Dinner together',
    intro: "The moon is up and it's dinner time. Sheep is here to eat together, nice and slow.",
    outro: 'Dinner together feels so cozy with you.',
    moment: 'had dinner together on Sleepy Island',
    rounds: [
      { kind: 'choice', say: 'We sit down for dinner. What do we do before eating?',
        npc: { face: '🐑', mood: MOOD('calm'), thought: { emoji: '🍽️' } },
        options: [
          step('🍽️', 'Wait for everyone', true), step('🍴', 'Start eating alone'),
        ], doneLine: 'Waiting for everyone makes dinner nice together.' },
      { kind: 'choice', say: 'There is a new food on your plate. What can we try?',
        npc: { face: '🐑', mood: MOOD('calm'), thought: { emoji: '🥦' } },
        options: [
          step('😋', 'One small bite', true), step('🙅', 'Refuse to try it'),
        ], doneLine: 'One bite is brave — thank you for trying!' },
      { kind: 'choice', say: 'Dinner is done. What do we say?',
        npc: { face: '🐑', mood: MOOD('calm') },
        options: [
          step('🙏', 'Thank you!', true), step('🚶', 'Walk away with no words'),
        ], doneLine: '"Thank you!" makes the cook feel good.' },
    ],
  },
  {
    zone: 'night', level: 2, goal: 'Bath time',
    intro: "Time for a bath! Let's do the bath steps in order, nice and easy.",
    outro: 'Clean and cozy, ready for pajamas!',
    moment: 'took a bath on Sleepy Island',
    rounds: [
      { kind: 'sequence', say: 'Bath time! Walk into the steps in order.',
        npc: { face: '🐑', mood: MOOD('calm'), thought: { emoji: '🛁' } },
        pool: [
          step('🛁', 'Get in the water'), step('🧼', 'Wash up'),
          step('🧻', 'Dry off'), step('🛌', 'Put on pajamas'),
        ],
        order: ['Get in the water', 'Wash up', 'Dry off', 'Put on pajamas'],
        doneLine: 'Squeaky clean and comfy — great bath!' },
    ],
  },
  {
    zone: 'night', level: 3, goal: 'Brush teeth',
    intro: "Sparkly teeth help us sleep sweet. Let's brush, step by step.",
    outro: 'Sparkly clean teeth, ready for bed!',
    moment: 'brushed my teeth on Sleepy Island',
    rounds: [
      { kind: 'sequence', say: "Let's brush our teeth. Walk into the steps in order.",
        npc: { face: '🐑', mood: MOOD('calm'), thought: { emoji: '🪥' } },
        pool: [step('🪥', 'Get my brush'), step('🧴', 'Add toothpaste'), step('😁', 'Brush!')],
        order: ['Get my brush', 'Add toothpaste', 'Brush!'],
        doneLine: 'Brush brush brush — sparkly!' },
      { kind: 'steps', say: 'Brush time! Count with me as you walk each number.',
        npc: { face: '🐑', mood: MOOD('calm'), thought: { emoji: '🪥' } },
        count: 4,
        doneLine: 'One, two, three, four — every tooth is sparkly clean!' },
    ],
  },
  {
    zone: 'night', level: 4, goal: 'Getting my bed ready',
    intro: "Let's get your bed all ready for a cozy night. Walk into everything you need!",
    outro: 'Your bed is all ready for a cozy night!',
    moment: 'got my bed ready on Sleepy Island',
    rounds: [
      { kind: 'carry', say: 'Pick up the pillow and carry it to spot 1 on the bed!',
        npc: { face: '🐑', mood: MOOD('calm') },
        items: [
          { emoji: '🛏️', caption: 'pillow' },
          { emoji: '🧸', caption: 'teddy' },
          { emoji: '💧', caption: 'water cup' },
        ],
        doneLine: 'Pillow, teddy, water cup — your bed is all ready!' },
    ],
  },
  {
    zone: 'night', level: 5, goal: 'Goodnight',
    intro: "The whole day is done — morning, school, play, and now sleep. Let's finish with story time and goodnight.",
    outro: 'You did a whole wonderful day! Tomorrow the rainbow playground is waiting for us again. Goodnight, my friend. 🌙',
    moment: 'said goodnight on Sleepy Island',
    rounds: [
      { kind: 'choice', say: "It's story time! Which story sounds nice tonight?",
        npc: { face: '🐑', mood: MOOD('calm'), thought: { emoji: '📖' } },
        options: [
          step('🦕', 'The dinosaur book', true), step('🐰', 'The bunny book', true),
        ], doneLine: 'A wonderful story! Snuggle in.' },
      { kind: 'choice', say: 'The story is over. What do we say to our family?',
        npc: { face: '🐑', mood: MOOD('calm'), thought: { emoji: '💤' } },
        options: [
          step('😴', 'Goodnight!', true), step('🏃', 'One more run around'),
        ], doneLine: '"Goodnight!" Sweet and soft.' },
      { kind: 'choice', say: 'The lights are getting dim. What happens now?',
        npc: { face: '🐑', mood: MOOD('calm'), thought: { emoji: '🌙' } },
        options: [
          step('💤', 'Sleepy time', true), step('🎮', 'Playtime again'),
        ], doneLine: 'Dim lights mean it is time to rest. Sweet dreams. 🌙✨' },
    ],
  },
];

// ===========================================================================

export const QUESTS: Record<ActivityZone, Quest[]> = {
  meadow: MEADOW,
  mountain: MOUNTAIN,
  cove: COVE,
  forest: FOREST,
  shore: SHORE,
  school: SCHOOL,
  afternoon: AFTERNOON,
  night: NIGHT,
  // Advanced sister islands (garden/deepforest/lagoon/bay) — see advancedQuests.ts
  ...ADVANCED_QUESTS,
};

/** Get the quest for a zone at a 1-based level (clamped to the available set). */
export function getQuest(zone: ActivityZone, level: number): Quest {
  const list = QUESTS[zone];
  const idx = Math.max(0, Math.min(list.length - 1, level - 1));
  return list[idx];
}

/** Stars from the number of gentle re-prompts (slips). 0 → 3, 1-2 → 2, else 1. */
export function starsFromSlips(slips: number): number {
  if (slips <= 0) return 3;
  if (slips <= 2) return 2;
  return 1;
}
