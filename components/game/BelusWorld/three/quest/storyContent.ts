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
}

export interface StoryLevel {
  goal: string;
  intro: string;
  outro: string;
  moment: string;
  friends: StoryFriend[];
}

// the clue + the 3 ways-to-help for each feeling (1 kind choice, 2 unkind)
const FEELINGS: Record<AnimalMood, { clue: string; helps: HelpOption[] }> = {
  scared: {
    clue: 'is hiding and trembling — they feel scared.',
    helps: [
      { emoji: '🤫', label: 'Sit quietly close', correct: true },
      { emoji: '👻', label: 'Jump out & yell' },
      { emoji: '🚶', label: 'Walk away' },
    ],
  },
  sad: {
    clue: 'is slumped and quiet — they feel sad.',
    helps: [
      { emoji: '🤗', label: 'Give a warm hug', correct: true },
      { emoji: '🙅', label: 'Say "stop crying"' },
      { emoji: '😆', label: 'Laugh at them' },
    ],
  },
  lonely: {
    clue: 'is sitting all by themselves — they feel lonely.',
    helps: [
      { emoji: '🎈', label: 'Invite them to play', correct: true },
      { emoji: '🙈', label: 'Ignore them' },
      { emoji: '🚶', label: 'Leave them alone' },
    ],
  },
  worried: {
    clue: 'keeps fidgeting and looking around — they feel worried.',
    helps: [
      { emoji: '🌬️', label: 'Breathe slow together', correct: true },
      { emoji: '🏃', label: 'Rush them' },
      { emoji: '🙄', label: 'Say it’s silly' },
    ],
  },
  happy: { clue: 'feels happy!', helps: [{ emoji: '🎉', label: 'Celebrate!', correct: true }] },
};

function f(species: AnimalSpecies, feeling: AnimalMood, x: number, z: number): StoryFriend {
  return { species, feeling, clue: FEELINGS[feeling].clue, helps: FEELINGS[feeling].helps, pos: [x, z] };
}

export const MEADOW_STORY: StoryLevel[] = [
  {
    goal: 'Help 2 friends',
    intro: "Some meadow friends are feeling big feelings. Walk up close, see how they feel, and choose a kind way to help!",
    outro: 'You helped every friend feel better. You are so kind! ☀️',
    moment: 'helped friends in the meadow',
    friends: [f('fox', 'scared', -2, 0), f('bunny', 'sad', 3, 1)],
  },
  {
    goal: 'Help 3 friends',
    intro: "More friends need a kind buddy. Look at how each one looks and feels, then help.",
    outro: 'Three happy friends — the whole meadow is smiling! 🌈',
    moment: 'helped friends in the meadow',
    friends: [f('bear', 'sad', -3, 2), f('bird', 'scared', 3, -2), f('bunny', 'lonely', 0, 3)],
  },
  {
    goal: 'Read 3 feelings & help',
    intro: "Watch their bodies closely — they each feel something different. Choose how to help each one.",
    outro: 'You read every feeling and helped. Amazing kindness! ☀️',
    moment: 'helped friends in the meadow',
    friends: [f('cat', 'worried', -3, -2), f('bear', 'sad', 3, 2), f('fox', 'scared', -2, 3)],
  },
  {
    goal: 'Help 4 friends',
    intro: "Lots of friends need help today. You know how to be kind — go to each one!",
    outro: 'Four friends, four smiles. You’re a wonderful friend! 🌻',
    moment: 'helped friends in the meadow',
    friends: [f('bunny', 'sad', -4, 0), f('bird', 'lonely', 4, 0), f('bear', 'worried', 0, -3), f('cat', 'scared', 0, 3)],
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
  },
];
