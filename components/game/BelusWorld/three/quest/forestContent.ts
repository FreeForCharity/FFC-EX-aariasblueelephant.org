// ---------------------------------------------------------------------------
// Friendship Forest content — MAGIC WORDS (expressive language as spell-casting).
//   walk up to a 3D animal friend → linger a moment → a thought bubble shows
//   what they WANT or SEE (a picture) → 3 word bubbles appear around them →
//   walk Belu into the word bubbles IN ORDER to "say" the phrase → the wanted
//   thing magically appears (sparkles + the item pops) and the friend cheers.
// The child isn't taking a quiz: they are CASTING the phrase out loud, word by
// word, and watching their words make something real happen. That is exactly
// what expressive language is for — using words to act on the world.
// Pedagogy mirrors quests.ts FOREST: L1 single mands, L2 action verbs,
// L3 two-word combos, L4 "I see X", L5 short sentences + a friendly turn-take.
// ---------------------------------------------------------------------------

import type { AnimalSpecies } from './Animal3D';

export interface SpellWord {
  /** the word painted on the bubble (also what the child "says") */
  word: string;
  /** a picture that helps a pre-reader recognise the word */
  emoji: string;
}

export interface ForestFriend {
  species: AnimalSpecies;
  /** what the friend is thinking about — shown in their thought card */
  thought: string;
  /** the magic phrase, in order. Walk into these words to cast it. */
  spell: SpellWord[];
  /** a couple of EXTRA decoy words mixed in so there's a real choice to make.
   *  (left empty for the very first single-word rounds to keep them errorless-easy) */
  decoys: SpellWord[];
  /** the thing that magically appears once the phrase is complete */
  reward: string;
  /** Belu's happy line when the spell lands */
  cheer: string;
  /** local XZ offset from the forest centre */
  pos: [number, number];
}

export interface ForestLevel {
  goal: string;
  intro: string;
  outro: string;
  moment: string;
  friends: ForestFriend[];
  /** hidden collectible "twinkles" (fireflies/stars) scattered to be found.
   *  Optional — defaults are filled in by FOREST_TWINKLES if a level omits them. */
  twinkles?: { emoji: string; pos: [number, number] }[];
}

// ---- little builders so the data stays readable -----------------------------

function w(word: string, emoji: string): SpellWord {
  return { word, emoji };
}

// ===========================================================================
// FRIENDSHIP FOREST — Expressive Language (5 levels, 2..5 friends each)
// ===========================================================================

export const FOREST_STORY: ForestLevel[] = [
  // L1 — single mands: "apple" / "ball" / "book". One word = the whole spell.
  {
    goal: 'Say the magic word',
    intro:
      "My forest friends are wishing for things! Walk up close, see what they want, then walk into the magic WORD to make it appear.",
    outro: 'You said every magic word so well! Your words make things happen. 🌳',
    moment: 'cast my first magic words in the forest',
    twinkles: [
      { emoji: '✨', pos: [-5.5, -4] },
      { emoji: '⭐', pos: [5.5, -4.5] },
      { emoji: '🐝', pos: [0, 5.5] },
    ],
    friends: [
      {
        species: 'fox', thought: '🍎',
        spell: [w('apple', '🍎')], decoys: [w('ball', '⚽')],
        reward: '🍎', cheer: 'Apple! You said it — here it comes! 🍎',
        pos: [-3, 0],
      },
      {
        species: 'bunny', thought: '⚽',
        spell: [w('ball', '⚽')], decoys: [w('book', '📖')],
        reward: '⚽', cheer: 'Ball! Your word made it pop! ⚽',
        pos: [3, 1],
      },
      {
        species: 'bear', thought: '📖',
        spell: [w('book', '📖')], decoys: [w('apple', '🍎')],
        reward: '📖', cheer: 'Book! Magic words really work! 📖',
        pos: [0, -3],
      },
    ],
  },

  // L2 — action verbs: name what the friend is DOING. Still one word per spell.
  {
    goal: 'Say the action word',
    intro:
      'Watch what my friends are doing! Walk up close, then walk into the ACTION word to cheer them on.',
    outro: 'You named every action! Action words are powerful. 🏃',
    moment: 'used action words in the forest',
    friends: [
      {
        species: 'fox', thought: '💨',
        spell: [w('running', '🏃')], decoys: [w('sleeping', '😴'), w('eating', '🍽️')],
        reward: '🏃', cheer: 'Running! Look at Fox go! 🏃',
        pos: [-4, -1],
      },
      {
        species: 'bird', thought: '☁️',
        spell: [w('flying', '🕊️')], decoys: [w('jumping', '🦘'), w('eating', '🍽️')],
        reward: '🕊️', cheer: 'Flying! Up Bird goes! 🕊️',
        pos: [4, -1],
      },
      {
        species: 'bear', thought: '🍯',
        spell: [w('eating', '🍽️')], decoys: [w('running', '🏃'), w('flying', '🕊️')],
        reward: '🍯', cheer: 'Eating! Yummy honey! 🍯',
        pos: [-2, 3],
      },
      {
        species: 'bunny', thought: '⬆️',
        spell: [w('jumping', '🦘')], decoys: [w('sleeping', '😴'), w('flying', '🕊️')],
        reward: '🦘', cheer: 'Jumping! Hop hop hop! 🦘',
        pos: [3, 3],
      },
    ],
  },

  // L3 — two-word combos: "want ball", "want apple", "big hug". Order matters!
  {
    goal: 'Cast a two-word spell',
    intro:
      "Now let's put TWO words together! Walk into the words in order to cast the whole spell.",
    outro: 'You put words together so well! Two words, big magic. ✨',
    moment: 'made two-word spells in the forest',
    friends: [
      {
        species: 'bunny', thought: '⚽',
        spell: [w('want', '🙋'), w('ball', '⚽')], decoys: [w('book', '📖')],
        reward: '⚽', cheer: '"want ball" — perfect! Here it is! ⚽',
        pos: [-3, 1],
      },
      {
        species: 'fox', thought: '🍎',
        spell: [w('want', '🙋'), w('apple', '🍎')], decoys: [w('drink', '🥤')],
        reward: '🍎', cheer: '"want apple" — yes! 🍎',
        pos: [3, 1],
      },
      {
        species: 'bear', thought: '🤗',
        spell: [w('big', '🫅'), w('hug', '🤗')], decoys: [w('ball', '⚽')],
        reward: '🤗', cheer: '"big hug" — aww, the best kind! 🤗',
        pos: [0, -3],
      },
    ],
  },

  // L4 — "I see X": noticing + sharing. Three words, the first two are constant.
  {
    goal: 'Say "I see a…"',
    intro:
      "When we notice something we can tell a friend! Walk into 'I' then 'see' then what you SEE.",
    outro: 'You told me everything you saw! Sharing what we notice is wonderful. 👀',
    moment: 'told friends what I saw in the forest',
    friends: [
      {
        species: 'fox', thought: '🐶',
        spell: [w('I', '🙋'), w('see', '👀'), w('dog', '🐶')],
        decoys: [w('cat', '🐱')],
        reward: '🐶', cheer: '"I see a dog!" Great noticing! 🐶',
        pos: [-4, 0],
      },
      {
        species: 'bird', thought: '🌳',
        spell: [w('I', '🙋'), w('see', '👀'), w('tree', '🌳')],
        decoys: [w('rock', '🪨')],
        reward: '🌳', cheer: '"I see a tree!" 🌳',
        pos: [4, 0],
      },
      {
        species: 'bunny', thought: '⭐',
        spell: [w('I', '🙋'), w('see', '👀'), w('star', '⭐')],
        decoys: [w('moon', '🌙')],
        reward: '⭐', cheer: '"I see a star!" Way up high! ⭐',
        pos: [0, 3],
      },
      {
        species: 'bear', thought: '🦋',
        spell: [w('I', '🙋'), w('see', '👀'), w('butterfly', '🦋')],
        decoys: [w('bee', '🐝')],
        reward: '🦋', cheer: '"I see a butterfly!" So pretty! 🦋',
        pos: [0, -3],
      },
    ],
  },

  // L5 — whole sentences + a friendly turn-take with Belu (the social finale).
  {
    goal: 'Whole sentences & taking turns',
    intro:
      "Let's make WHOLE sentences, then chat like good friends — taking turns talking!",
    outro: 'We took turns talking so nicely. That is what friends do. 💜',
    moment: 'made sentences and took turns in the forest',
    friends: [
      {
        species: 'fox', thought: '🍎',
        spell: [w('I', '🙋'), w('like', '💗'), w('apples', '🍎')],
        decoys: [w('run', '🏃')],
        reward: '🍎', cheer: '"I like apples." Wonderful sentence! 🍎',
        pos: [-4, 1],
      },
      {
        species: 'bunny', thought: '🫵',
        spell: [w('I', '🙋'), w('see', '👀'), w('you', '🫵')],
        decoys: [w('big', '🫅')],
        reward: '💜', cheer: '"I see you." I see you too, friend! 💜',
        pos: [4, 1],
      },
      // a friendly turn-take: say it back and forth like a real little chat
      {
        species: 'bear', thought: '💬',
        spell: [w('my turn', '💬'), w('your turn', '🗨️'), w('my turn', '💬'), w('your turn', '🗨️')],
        decoys: [],
        reward: '💜', cheer: 'We took turns so nicely! That is what friends do. 💜',
        pos: [0, -3],
      },
    ],
  },
];

// Default scatter of hidden twinkles for any level that doesn't specify its own.
// Kept deterministic (fixed positions) — kids can hunt these down between
// friends for a little sparkle + chime, with no pressure to find them all.
export const FOREST_TWINKLES: { emoji: string; pos: [number, number] }[] = [
  { emoji: '✨', pos: [-5.5, -4] },
  { emoji: '🐝', pos: [5.5, -4] },
  { emoji: '⭐', pos: [0, 5.6] },
  { emoji: '🍄', pos: [-5.8, 3.5] },
];

// Warm one-liners Belu says when a hidden twinkle is found — the firefly guide
// celebrating discovery. Rotated by a seed so it doesn't feel repetitive.
export const TWINKLE_FINDS: string[] = [
  'Ooh, a hidden sparkle! You found it! ✨',
  'A little firefly was hiding there — well spotted! 🐝',
  'You have sharp eyes! Another shiny one! ⭐',
  'The forest left a sparkle just for you! 🍄',
];

// Belu's gentle nudges while exploring the forest (idle personality).
export const FOREST_NUDGES: string[] = [
  'The forest feels happier the more friends we help. 🌳',
  'Listen — the fireflies are dancing! 🐝',
  'Your words are magic here. Try walking into one! 💜',
];
