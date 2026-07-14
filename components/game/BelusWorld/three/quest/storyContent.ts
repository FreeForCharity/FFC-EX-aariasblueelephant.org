// ---------------------------------------------------------------------------
// Feelings Meadow content — caring play, the owner's design:
//   walk up to a 3D animal → linger a moment → a CLUE about how it feels pops
//   up → 3 ways to help appear → choose the kind one → the animal cheers up.
// The feeling is read from the animal's body language + the clue; the choice is
// about HOW TO BE KIND (a real social skill), never an abstract "what feeling?".
// ---------------------------------------------------------------------------

import type { AnimalSpecies, AnimalMood } from './Animal3D';
import { isEs } from '../../../../../lib/lang';

export interface HelpOption {
  emoji: string;
  label: string;
  correct?: boolean;
}

export interface StoryFriend {
  species: AnimalSpecies;
  feeling: AnimalMood; // also drives the body-language animation
  clue: string;
  helps: HelpOption[];
  pos: [number, number]; // local offset from the meadow centre (XZ)
  thanks: string; // what the friend says, in their own voice, once helped
}

export interface StoryLevel {
  goal: string;
  intro: string;
  outro: string;
  moment: string;
  friends: StoryFriend[];
  /** hidden collectible fireflies (local XZ offsets) scattered to find */
  fireflies: [number, number][];
}

// each species has a little voice — said when they cheer up, so they feel like
// real friends with personalities, not interchangeable blobs.
const THANKS: Record<AnimalSpecies, string[]> = {
  fox: ['Thank you! I feel brave now. *happy yip!*', 'You stayed with me — you’re a true friend!'],
  bunny: ['Hop hop! You made my heart feel soft and warm. 💛', 'Thank you, friend! Want to hop together?'],
  bear: ['Aw… that big hug helped a lot. *gentle bear grin*', 'Thank you. You give the best hugs!'],
  bird: ['Tweet tweet! I feel light as a feather now! 🪶', 'You cheered me up — let’s sing together!'],
  cat: ['Purr… I feel calm and cozy now. Thank you.', 'Mrow! You’re the kindest friend in the meadow.'],
};

// the clue + the 3 ways-to-help for each feeling (1 kind choice, 2 unkind).
// Several clue wordings per feeling so seeing the same feeling again still feels
// fresh — the child still reads the body language, just told a new way.
const FEELINGS: Record<AnimalMood, { clues: string[]; helps: HelpOption[] }> = {
  scared: {
    clues: [
      'is hiding and trembling — they feel scared.',
      'is curled up small with wide eyes — they feel scared.',
      'is shaking behind the grass — something gave them a fright.',
    ],
    helps: [
      { emoji: '🤫', label: 'Sit quietly close', correct: true },
      { emoji: '👻', label: 'Jump out & yell' },
      { emoji: '🚶', label: 'Walk away' },
    ],
  },
  sad: {
    clues: [
      'is slumped and quiet — they feel sad.',
      'has droopy shoulders and a teary face — they feel sad.',
      'is sighing with their head down — they feel sad.',
    ],
    helps: [
      { emoji: '🤗', label: 'Give a warm hug', correct: true },
      { emoji: '🙅', label: 'Say "stop crying"' },
      { emoji: '😆', label: 'Laugh at them' },
    ],
  },
  lonely: {
    clues: [
      'is sitting all by themselves — they feel lonely.',
      'is watching the others play, all alone — they feel lonely.',
      'has nobody to play with — they feel lonely.',
    ],
    helps: [
      { emoji: '🎈', label: 'Invite them to play', correct: true },
      { emoji: '🙈', label: 'Ignore them' },
      { emoji: '🚶', label: 'Leave them alone' },
    ],
  },
  worried: {
    clues: [
      'keeps fidgeting and looking around — they feel worried.',
      'is pacing and biting their lip — they feel worried.',
      'can’t sit still and keeps glancing about — they feel worried.',
    ],
    helps: [
      { emoji: '🌬️', label: 'Breathe slow together', correct: true },
      { emoji: '🏃', label: 'Rush them' },
      { emoji: '🙄', label: 'Say it’s silly' },
    ],
  },
  happy: { clues: ['feels happy!'], helps: [{ emoji: '🎉', label: 'Celebrate!', correct: true }] },
};

// ---- Spanish voice + feeling tables (same shape/order as above) -----------
const THANKS_ES: Record<AnimalSpecies, string[]> = {
  fox: ['¡Gracias! Ahora me siento valiente. *ladrido feliz!*', '¡Te quedaste conmigo — eres un verdadero amigo!'],
  bunny: ['¡Salta, salta! Me hiciste sentir el corazón calientito. 💛', '¡Gracias, amigo! ¿Saltamos juntos?'],
  bear: ['Aww… ese abrazo grande me ayudó mucho. *sonrisa de oso*', '¡Gracias! Das los mejores abrazos.'],
  bird: ['¡Pío pío! ¡Ahora me siento ligero como una pluma! 🪶', '¡Me alegraste el día — cantemos juntos!'],
  cat: ['Ronroneo… ahora me siento tranquilo y calientito. Gracias.', '¡Miau! Eres el amigo más bueno del prado.'],
};

const FEELINGS_ES: Record<AnimalMood, { clues: string[]; helps: HelpOption[] }> = {
  scared: {
    clues: [
      'se está escondiendo y temblando — tiene miedo.',
      'está hecho bolita con los ojos bien abiertos — tiene miedo.',
      'está temblando detrás del pasto — algo lo asustó.',
    ],
    helps: [
      { emoji: '🤫', label: 'Quedarse cerca en silencio', correct: true },
      { emoji: '👻', label: 'Saltar y gritar' },
      { emoji: '🚶', label: 'Irse' },
    ],
  },
  sad: {
    clues: [
      'está encogido y callado — se siente triste.',
      'tiene los hombros caídos y la cara llorosa — se siente triste.',
      'suspira con la cabeza baja — se siente triste.',
    ],
    helps: [
      { emoji: '🤗', label: 'Dar un abrazo cálido', correct: true },
      { emoji: '🙅', label: 'Decir "deja de llorar"' },
      { emoji: '😆', label: 'Reírse de él' },
    ],
  },
  lonely: {
    clues: [
      'está sentado solito — se siente solo.',
      'mira a los demás jugar, solito — se siente solo.',
      'no tiene con quién jugar — se siente solo.',
    ],
    helps: [
      { emoji: '🎈', label: 'Invitarlo a jugar', correct: true },
      { emoji: '🙈', label: 'Ignorarlo' },
      { emoji: '🚶', label: 'Dejarlo solo' },
    ],
  },
  worried: {
    clues: [
      'se mueve nervioso y mira alrededor — está preocupado.',
      'camina de un lado a otro y se muerde el labio — está preocupado.',
      'no puede quedarse quieto y mira por todos lados — está preocupado.',
    ],
    helps: [
      { emoji: '🌬️', label: 'Respirar despacio juntos', correct: true },
      { emoji: '🏃', label: 'Apurarlo' },
      { emoji: '🙄', label: 'Decir que es una tontería' },
    ],
  },
  happy: { clues: ['¡se siente feliz!'], helps: [{ emoji: '🎉', label: '¡Celebrar!', correct: true }] },
};

function f(species: AnimalSpecies, feeling: AnimalMood, x: number, z: number): StoryFriend {
  const cfg = FEELINGS[feeling];
  // deterministic pick from position so it varies without Math.random
  const pick = Math.abs(Math.round((x * 7 + z * 13)));
  const thanksList = THANKS[species];
  return {
    species,
    feeling,
    clue: cfg.clues[pick % cfg.clues.length],
    helps: cfg.helps,
    pos: [x, z],
    thanks: thanksList[pick % thanksList.length],
  };
}

function fEs(species: AnimalSpecies, feeling: AnimalMood, x: number, z: number): StoryFriend {
  const cfg = FEELINGS_ES[feeling];
  // deterministic pick from position so it varies without Math.random
  const pick = Math.abs(Math.round((x * 7 + z * 13)));
  const thanksList = THANKS_ES[species];
  return {
    species,
    feeling,
    clue: cfg.clues[pick % cfg.clues.length],
    helps: cfg.helps,
    pos: [x, z],
    thanks: thanksList[pick % thanksList.length],
  };
}

const MEADOW_STORY_EN: StoryLevel[] = [
  {
    goal: 'Help 2 friends',
    intro: "Some meadow friends are feeling big feelings. Walk up close, see how they feel, and choose a kind way to help!",
    outro: 'You helped every friend feel better. You are so kind! ☀️',
    moment: 'helped friends in the meadow',
    friends: [f('fox', 'scared', -2, 0), f('bunny', 'sad', 3, 1)],
    fireflies: [[5, -4], [-5, 3], [1, 5]],
  },
  {
    goal: 'Help 3 friends',
    intro: "More friends need a kind buddy. Look at how each one looks and feels, then help.",
    outro: 'Three happy friends — the whole meadow is smiling! 🌈',
    moment: 'helped friends in the meadow',
    friends: [f('bear', 'sad', -3, 2), f('bird', 'scared', 3, -2), f('bunny', 'lonely', 0, 3)],
    fireflies: [[5, 4], [-5, -3], [4, 5], [-4, 4]],
  },
  {
    goal: 'Read 3 feelings & help',
    intro: "Watch their bodies closely — they each feel something different. Choose how to help each one.",
    outro: 'You read every feeling and helped. Amazing kindness! ☀️',
    moment: 'helped friends in the meadow',
    friends: [f('cat', 'worried', -3, -2), f('bear', 'sad', 3, 2), f('fox', 'scared', -2, 3)],
    fireflies: [[5, 4], [-5, 3], [4, -4], [0, 5]],
  },
  {
    goal: 'Help 4 friends',
    intro: "Lots of friends need help today. You know how to be kind — go to each one!",
    outro: 'Four friends, four smiles. You’re a wonderful friend! 🌻',
    moment: 'helped friends in the meadow',
    friends: [f('bunny', 'sad', -4, 0), f('bird', 'lonely', 4, 0), f('bear', 'worried', 0, -3), f('cat', 'scared', 0, 3)],
    fireflies: [[5, 5], [-5, -4], [5, -4], [-5, 4], [2, 6]],
  },
  {
    goal: 'Be everyone’s kind friend',
    intro: "The whole meadow has big feelings. Help every single friend feel safe and happy!",
    outro: 'You are the kindest friend in the sky islands. The meadow is in full bloom! 🌷',
    moment: 'spread kindness across the meadow',
    friends: [
      f('bear', 'sad', -4, -2), f('cat', 'scared', 4, -2), f('bunny', 'lonely', -3, 3),
      f('fox', 'worried', 3, 3), f('bird', 'sad', 0, 0),
    ],
    fireflies: [[6, 0], [-6, 0], [0, 6], [5, -5], [-5, 5], [6, 5]],
  },
];

const MEADOW_STORY_ES: StoryLevel[] = [
  {
    goal: 'Ayuda a 2 amigos',
    intro: 'Algunos amigos del prado tienen sentimientos grandes. Acércate, mira cómo se sienten y elige una forma amable de ayudar.',
    outro: '¡Ayudaste a cada amigo a sentirse mejor. Eres muy bondadoso! ☀️',
    moment: 'ayudó a los amigos del prado',
    friends: [fEs('fox', 'scared', -2, 0), fEs('bunny', 'sad', 3, 1)],
    fireflies: [[5, -4], [-5, 3], [1, 5]],
  },
  {
    goal: 'Ayuda a 3 amigos',
    intro: 'Más amigos necesitan un compañero amable. Mira cómo se ve y se siente cada uno, y luego ayuda.',
    outro: '¡Tres amigos felices — todo el prado está sonriendo! 🌈',
    moment: 'ayudó a los amigos del prado',
    friends: [fEs('bear', 'sad', -3, 2), fEs('bird', 'scared', 3, -2), fEs('bunny', 'lonely', 0, 3)],
    fireflies: [[5, 4], [-5, -3], [4, 5], [-4, 4]],
  },
  {
    goal: 'Lee 3 sentimientos y ayuda',
    intro: 'Observa bien sus cuerpitos — cada uno siente algo diferente. Elige cómo ayudar a cada uno.',
    outro: '¡Leíste cada sentimiento y ayudaste. Qué bondad tan increíble! ☀️',
    moment: 'ayudó a los amigos del prado',
    friends: [fEs('cat', 'worried', -3, -2), fEs('bear', 'sad', 3, 2), fEs('fox', 'scared', -2, 3)],
    fireflies: [[5, 4], [-5, 3], [4, -4], [0, 5]],
  },
  {
    goal: 'Ayuda a 4 amigos',
    intro: 'Muchos amigos necesitan ayuda hoy. Tú sabes cómo ser amable — ¡ve a cada uno!',
    outro: '¡Cuatro amigos, cuatro sonrisas. Eres un amigo maravilloso! 🌻',
    moment: 'ayudó a los amigos del prado',
    friends: [fEs('bunny', 'sad', -4, 0), fEs('bird', 'lonely', 4, 0), fEs('bear', 'worried', 0, -3), fEs('cat', 'scared', 0, 3)],
    fireflies: [[5, 5], [-5, -4], [5, -4], [-5, 4], [2, 6]],
  },
  {
    goal: 'Sé el amigo amable de todos',
    intro: '¡Todo el prado tiene sentimientos grandes. Ayuda a cada amigo a sentirse seguro y feliz!',
    outro: '¡Eres el amigo más bondadoso de las islas del cielo. El prado está en plena floración! 🌷',
    moment: 'esparció bondad por el prado',
    friends: [
      fEs('bear', 'sad', -4, -2), fEs('cat', 'scared', 4, -2), fEs('bunny', 'lonely', -3, 3),
      fEs('fox', 'worried', 3, 3), fEs('bird', 'sad', 0, 0),
    ],
    fireflies: [[6, 0], [-6, 0], [0, 6], [5, -5], [-5, 5], [6, 5]],
  },
];

export const MEADOW_STORY: StoryLevel[] = isEs()
  ? MEADOW_STORY_EN.map((item, i) => MEADOW_STORY_ES[i] ?? item)
  : MEADOW_STORY_EN;
