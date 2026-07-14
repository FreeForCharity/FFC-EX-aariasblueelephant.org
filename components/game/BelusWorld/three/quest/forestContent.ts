// ---------------------------------------------------------------------------
// Friendship Forest content — MAGIC WORDS (expressive language as spell-casting).
//   walk up to a 3D animal friend → linger a moment → a thought bubble shows
//   what they WANT or SEE (a picture) → 3 word bubbles appear around them →
//   walk Nilu into the word bubbles IN ORDER to "say" the phrase → the wanted
//   thing magically appears (sparkles + the item pops) and the friend cheers.
// The child isn't taking a quiz: they are CASTING the phrase out loud, word by
// word, and watching their words make something real happen. That is exactly
// what expressive language is for — using words to act on the world.
// Pedagogy mirrors quests.ts FOREST: L1 single mands, L2 action verbs,
// L3 two-word combos, L4 "I see X", L5 short sentences + a friendly turn-take.
// ---------------------------------------------------------------------------

import type { AnimalSpecies } from './Animal3D';
import { isEs } from '../../../../../lib/lang';

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
  /** Nilu's happy line when the spell lands */
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

const FOREST_STORY_EN: ForestLevel[] = [
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

  // L5 — whole sentences + a friendly turn-take with Nilu (the social finale).
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

const FOREST_STORY_ES: ForestLevel[] = [
  // L1 — single mands
  {
    goal: 'Di la palabra mágica',
    intro:
      '¡Mis amigos del bosque están deseando cosas! Acércate, mira qué quieren, y luego camina hacia la PALABRA mágica para hacerla aparecer.',
    outro: '¡Dijiste cada palabra mágica tan bien! Tus palabras hacen que las cosas sucedan. 🌳',
    moment: 'dije mis primeras palabras mágicas en el bosque',
    twinkles: [
      { emoji: '✨', pos: [-5.5, -4] },
      { emoji: '⭐', pos: [5.5, -4.5] },
      { emoji: '🐝', pos: [0, 5.5] },
    ],
    friends: [
      {
        species: 'fox', thought: '🍎',
        spell: [w('manzana', '🍎')], decoys: [w('pelota', '⚽')],
        reward: '🍎', cheer: '¡Manzana! ¡La dijiste — aquí viene! 🍎',
        pos: [-3, 0],
      },
      {
        species: 'bunny', thought: '⚽',
        spell: [w('pelota', '⚽')], decoys: [w('libro', '📖')],
        reward: '⚽', cheer: '¡Pelota! ¡Tu palabra la hizo aparecer! ⚽',
        pos: [3, 1],
      },
      {
        species: 'bear', thought: '📖',
        spell: [w('libro', '📖')], decoys: [w('manzana', '🍎')],
        reward: '📖', cheer: '¡Libro! ¡Las palabras mágicas sí funcionan! 📖',
        pos: [0, -3],
      },
    ],
  },

  // L2 — action verbs
  {
    goal: 'Di la palabra de acción',
    intro:
      '¡Mira lo que están haciendo mis amigos! Acércate, y luego camina hacia la palabra de ACCIÓN para animarlos.',
    outro: '¡Nombraste cada acción! Las palabras de acción son poderosas. 🏃',
    moment: 'usé palabras de acción en el bosque',
    friends: [
      {
        species: 'fox', thought: '💨',
        spell: [w('corriendo', '🏃')], decoys: [w('durmiendo', '😴'), w('comiendo', '🍽️')],
        reward: '🏃', cheer: '¡Corriendo! ¡Mira cómo va Zorro! 🏃',
        pos: [-4, -1],
      },
      {
        species: 'bird', thought: '☁️',
        spell: [w('volando', '🕊️')], decoys: [w('saltando', '🦘'), w('comiendo', '🍽️')],
        reward: '🕊️', cheer: '¡Volando! ¡Arriba va Pájaro! 🕊️',
        pos: [4, -1],
      },
      {
        species: 'bear', thought: '🍯',
        spell: [w('comiendo', '🍽️')], decoys: [w('corriendo', '🏃'), w('volando', '🕊️')],
        reward: '🍯', cheer: '¡Comiendo! ¡Rica miel! 🍯',
        pos: [-2, 3],
      },
      {
        species: 'bunny', thought: '⬆️',
        spell: [w('saltando', '🦘')], decoys: [w('durmiendo', '😴'), w('volando', '🕊️')],
        reward: '🦘', cheer: '¡Saltando! ¡Salta, salta, salta! 🦘',
        pos: [3, 3],
      },
    ],
  },

  // L3 — two-word combos
  {
    goal: 'Lanza un hechizo de dos palabras',
    intro:
      '¡Ahora vamos a juntar DOS palabras! Camina hacia las palabras en orden para lanzar todo el hechizo.',
    outro: '¡Juntaste las palabras tan bien! Dos palabras, gran magia. ✨',
    moment: 'hice hechizos de dos palabras en el bosque',
    friends: [
      {
        species: 'bunny', thought: '⚽',
        spell: [w('quiero', '🙋'), w('pelota', '⚽')], decoys: [w('libro', '📖')],
        reward: '⚽', cheer: '"quiero pelota" — ¡perfecto! ¡Aquí está! ⚽',
        pos: [-3, 1],
      },
      {
        species: 'fox', thought: '🍎',
        spell: [w('quiero', '🙋'), w('manzana', '🍎')], decoys: [w('bebida', '🥤')],
        reward: '🍎', cheer: '"quiero manzana" — ¡sí! 🍎',
        pos: [3, 1],
      },
      {
        species: 'bear', thought: '🤗',
        spell: [w('gran', '🫅'), w('abrazo', '🤗')], decoys: [w('pelota', '⚽')],
        reward: '🤗', cheer: '"gran abrazo" — aww, ¡el mejor tipo! 🤗',
        pos: [0, -3],
      },
    ],
  },

  // L4 — "yo veo X"
  {
    goal: 'Di "Veo un/a…"',
    intro:
      '¡Cuando notamos algo podemos contárselo a un amigo! Camina hacia "yo" luego "veo" y luego lo que VES.',
    outro: '¡Me contaste todo lo que viste! Compartir lo que notamos es maravilloso. 👀',
    moment: 'les conté a mis amigos lo que vi en el bosque',
    friends: [
      {
        species: 'fox', thought: '🐶',
        spell: [w('yo', '🙋'), w('veo', '👀'), w('perro', '🐶')],
        decoys: [w('gato', '🐱')],
        reward: '🐶', cheer: '"¡Yo veo un perro!" ¡Muy buena observación! 🐶',
        pos: [-4, 0],
      },
      {
        species: 'bird', thought: '🌳',
        spell: [w('yo', '🙋'), w('veo', '👀'), w('árbol', '🌳')],
        decoys: [w('roca', '🪨')],
        reward: '🌳', cheer: '"¡Yo veo un árbol!" 🌳',
        pos: [4, 0],
      },
      {
        species: 'bunny', thought: '⭐',
        spell: [w('yo', '🙋'), w('veo', '👀'), w('estrella', '⭐')],
        decoys: [w('luna', '🌙')],
        reward: '⭐', cheer: '"¡Yo veo una estrella!" ¡Muy alto en el cielo! ⭐',
        pos: [0, 3],
      },
      {
        species: 'bear', thought: '🦋',
        spell: [w('yo', '🙋'), w('veo', '👀'), w('mariposa', '🦋')],
        decoys: [w('abeja', '🐝')],
        reward: '🦋', cheer: '"¡Yo veo una mariposa!" ¡Qué bonita! 🦋',
        pos: [0, -3],
      },
    ],
  },

  // L5 — whole sentences + turn-taking
  {
    goal: 'Oraciones completas y turnos',
    intro:
      '¡Vamos a formar oraciones COMPLETAS, y luego a conversar como buenos amigos — turnándonos para hablar!',
    outro: 'Nos turnamos para hablar tan bien. Eso es lo que hacen los amigos. 💜',
    moment: 'hice oraciones y me turné para hablar en el bosque',
    friends: [
      {
        species: 'fox', thought: '🍎',
        spell: [w('me', '🙋'), w('gustan', '💗'), w('las manzanas', '🍎')],
        decoys: [w('correr', '🏃')],
        reward: '🍎', cheer: '"Me gustan las manzanas." ¡Qué buena oración! 🍎',
        pos: [-4, 1],
      },
      {
        species: 'bunny', thought: '🫵',
        spell: [w('yo', '🙋'), w('veo', '👀'), w('a ti', '🫵')],
        decoys: [w('grande', '🫅')],
        reward: '💜', cheer: '"Yo veo a ti." ¡Yo también te veo, amigo! 💜',
        pos: [4, 1],
      },
      // a friendly turn-take: say it back and forth like a real little chat
      {
        species: 'bear', thought: '💬',
        spell: [w('mi turno', '💬'), w('tu turno', '🗨️'), w('mi turno', '💬'), w('tu turno', '🗨️')],
        decoys: [],
        reward: '💜', cheer: '¡Nos turnamos tan bien! Eso es lo que hacen los amigos. 💜',
        pos: [0, -3],
      },
    ],
  },
];

export const FOREST_STORY: ForestLevel[] = isEs()
  ? FOREST_STORY_EN.map((lvl, i) => FOREST_STORY_ES[i] ?? lvl)
  : FOREST_STORY_EN;

// Default scatter of hidden twinkles for any level that doesn't specify its own.
// Kept deterministic (fixed positions) — kids can hunt these down between
// friends for a little sparkle + chime, with no pressure to find them all.
export const FOREST_TWINKLES: { emoji: string; pos: [number, number] }[] = [
  { emoji: '✨', pos: [-5.5, -4] },
  { emoji: '🐝', pos: [5.5, -4] },
  { emoji: '⭐', pos: [0, 5.6] },
  { emoji: '🍄', pos: [-5.8, 3.5] },
];

// Warm one-liners Nilu says when a hidden twinkle is found — the firefly guide
// celebrating discovery. Rotated by a seed so it doesn't feel repetitive.
const TWINKLE_FINDS_EN: string[] = [
  'Ooh, a hidden sparkle! You found it! ✨',
  'A little firefly was hiding there — well spotted! 🐝',
  'You have sharp eyes! Another shiny one! ⭐',
  'The forest left a sparkle just for you! 🍄',
];

const TWINKLE_FINDS_ES: string[] = [
  '¡Ooh, un brillo escondido! ¡Lo encontraste! ✨',
  'Una lucecita se escondía ahí — ¡bien visto! 🐝',
  '¡Tienes ojos muy agudos! ¡Otro brillito! ⭐',
  '¡El bosque dejó un brillo solo para ti! 🍄',
];

export const TWINKLE_FINDS: string[] = isEs()
  ? TWINKLE_FINDS_EN.map((line, i) => TWINKLE_FINDS_ES[i] ?? line)
  : TWINKLE_FINDS_EN;

// Nilu's gentle nudges while exploring the forest (idle personality).
const FOREST_NUDGES_EN: string[] = [
  'The forest feels happier the more friends we help. 🌳',
  'Listen — the fireflies are dancing! 🐝',
  'Your words are magic here. Try walking into one! 💜',
];

const FOREST_NUDGES_ES: string[] = [
  'El bosque se siente más feliz mientras más amigos ayudamos. 🌳',
  '¡Escucha — las luciérnagas están bailando! 🐝',
  'Tus palabras son mágicas aquí. ¡Intenta caminar hacia una! 💜',
];

export const FOREST_NUDGES: string[] = isEs()
  ? FOREST_NUDGES_EN.map((line, i) => FOREST_NUDGES_ES[i] ?? line)
  : FOREST_NUDGES_EN;
