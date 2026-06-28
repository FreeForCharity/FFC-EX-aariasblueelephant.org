// ---------------------------------------------------------------------------
// The lessons — now as embodied quests instead of flashcard pop-ups.
// Each island has 5 levels; each level is a short list of "rounds" the child
// plays by walking Belu up to a friend and walking into (or tapping) glowing
// answer orbs out in the world. The pedagogy is unchanged from the original
// research-based activities — only the DELIVERY moved from a 2D quiz panel into
// the 3D world. Still errorless, no timers, no losing.
// ---------------------------------------------------------------------------

import type { ActivityZone } from '../../belu/progress';
import type { Mood } from './QuestNPC';

export interface Orb {
  emoji: string;
  caption?: string;
  /** for 'choice' rounds: is this the right one? */
  correct?: boolean;
}

export type RoundKind = 'choice' | 'sequence' | 'multiPick' | 'breathe';

export interface QuestRound {
  kind: RoundKind;
  /** the line Belu says when this round begins */
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
    intro: "Let's get ready for the day! Walk to the right thing for each job.",
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
    intro: "Some jobs have steps in order. Walk into the steps from first to last!",
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
    zone: 'cove', level: 1, goal: 'Breathe with Belu',
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

export const QUESTS: Record<ActivityZone, Quest[]> = {
  meadow: MEADOW,
  mountain: MOUNTAIN,
  cove: COVE,
  forest: FOREST,
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
