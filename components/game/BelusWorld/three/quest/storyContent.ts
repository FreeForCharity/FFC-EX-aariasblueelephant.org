// ---------------------------------------------------------------------------
// Feelings Meadow — reshaped as CARING PLAY, not a quiz.
//
// Friends sit in the meadow under a little weather cloud that shows how they
// feel (🌧️ sad, ⛈️ scared, ☁️ lonely, 🌥️ worried). There are no questions and
// no right/wrong answers. The child simply walks Belu up to a friend and stays
// with them — Belu comforts them, their cloud clears step by step into sunshine,
// flowers burst open, and when every friend is sunny the whole meadow blooms.
//
// The learning (reading emotions) happens by SEEING the feeling and the body
// language, hearing Belu name it, and watching kindness change their world.
// ---------------------------------------------------------------------------

import type { Mood } from './QuestNPC';

export interface StoryFriend {
  face: string;
  /** kid-facing feeling word — Belu names it on approach */
  feeling: string;
  mood: Mood;
  /** cloud stages from worst → sunny; last is always ☀️. careNeeded = stages-1 */
  clouds: string[];
  /** local position on the meadow (offset from the island centre, XZ) */
  pos: [number, number];
}

export interface StoryLevel {
  goal: string;
  intro: string;
  outro: string;
  moment: string;
  friends: StoryFriend[];
}

const RAIN = ['🌧️', '🌥️', '☀️'];
const STORM = ['⛈️', '🌥️', '☀️'];
const LONELY = ['☁️', '🌤️', '☀️'];
const WORRY = ['🌥️', '🌤️', '☀️'];

function f(face: string, feeling: string, mood: Mood, clouds: string[], x: number, z: number): StoryFriend {
  return { face, feeling, mood, clouds, pos: [x, z] };
}

export const MEADOW_STORY: StoryLevel[] = [
  {
    goal: 'Cheer up 2 friends',
    intro: "Some meadow friends feel cloudy today. Walk up close and Belu will help them feel better!",
    outro: 'You made the whole meadow sunny! You are such a kind friend. ☀️',
    moment: 'cheered up friends in the meadow',
    friends: [
      f('🐰', 'sad', 'sad', RAIN, -2, -1),
      f('🦊', 'scared', 'scared', STORM, 3, 1),
    ],
  },
  {
    goal: 'Help 3 friends feel sunny',
    intro: "More friends feel cloudy. Go be with each one until their sunshine comes back!",
    outro: 'Every friend is smiling now. You helped the sun come out! 🌈',
    moment: 'cheered up friends in the meadow',
    friends: [
      f('🐻', 'sad', 'sad', RAIN, -3, 2),
      f('🐥', 'scared', 'scared', STORM, 3, -2),
      f('🐰', 'lonely', 'sad', LONELY, 0, 3),
    ],
  },
  {
    goal: 'Warm up 3 cloudy friends',
    intro: "Look at how each friend's body looks. Stay close and help their cloud clear away.",
    outro: 'You noticed how everyone felt and helped. The meadow is glowing! ☀️',
    moment: 'cheered up friends in the meadow',
    friends: [
      f('🦊', 'worried', 'disappointed', WORRY, -3, -2),
      f('🐻', 'sad', 'sad', RAIN, 3, 2),
      f('🐱', 'scared', 'scared', STORM, -2, 3),
    ],
  },
  {
    goal: 'Bring sunshine to 4 friends',
    intro: "Lots of friends need a kind buddy today. Visit every one of them!",
    outro: 'Four happy friends! You turned the whole sky sunny. 🌻',
    moment: 'cheered up friends in the meadow',
    friends: [
      f('🐰', 'sad', 'sad', RAIN, -4, 0),
      f('🐦', 'lonely', 'sad', LONELY, 4, 0),
      f('🐻', 'worried', 'disappointed', WORRY, 0, -3),
      f('🦊', 'scared', 'scared', STORM, 0, 3),
    ],
  },
  {
    goal: 'Be everyone’s kind friend',
    intro: "The whole meadow is feeling big feelings. You know just what to do — go spread kindness!",
    outro: 'You are the kindest friend in all the sky islands. The meadow is in full bloom! 🌷',
    moment: 'spread kindness across the meadow',
    friends: [
      f('🐻', 'sad', 'sad', RAIN, -4, -2),
      f('🐱', 'scared', 'scared', STORM, 4, -2),
      f('🐰', 'lonely', 'sad', LONELY, -3, 3),
      f('🦊', 'worried', 'disappointed', WORRY, 3, 3),
      f('🐥', 'sad', 'sad', RAIN, 0, 0),
    ],
  },
];
