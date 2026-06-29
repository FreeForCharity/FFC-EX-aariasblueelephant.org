// ---------------------------------------------------------------------------
// Feelings Meadow content — caring play, the owner's design:
//   walk up to a 3D animal → linger a moment → a CLUE about how it feels pops
//   up → 3 ways to help appear → choose the kind one → the animal cheers up.
// The feeling is read from the animal's body language + the clue; the choice is
// about HOW TO BE KIND (a real social skill), never an abstract "what feeling?".
// ---------------------------------------------------------------------------

import type { AnimalSpecies, AnimalMood } from './Animal3D';

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

export const MEADOW_STORY: StoryLevel[] = [
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
