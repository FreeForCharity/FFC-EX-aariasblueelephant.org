// ---------------------------------------------------------------------------
// Morning Mountain content — life skills you DO by walking, not a quiz.
//   Stations sit around the island, each a little object (bed 🛏️, sink 🪥,
//   wardrobe 👕, breakfast 🥣, backpack 🎒, door 🚪 …). Belu walks to them IN
//   ORDER to "do" each step of the morning routine. Walking to the next-correct
//   station does it (bounce + ✅ sparkle + Belu narrates); a wrong/out-of-order
//   station gives a gentle "what do we do first?" nudge — never a fail.
//
// The pedagogy mirrors quests.ts MOUNTAIN exactly, just re-expressed as a
// walk-the-routine layout:
//   L1 single self-care matches  • L2 short chains  • L3 full morning sequence
//   L4 safety (walk to the SAFE marker of two)  • L5 independent self-check (any order)
// ---------------------------------------------------------------------------

/** How a station behaves once Belu reaches it. */
export type StationKind =
  | 'ordered' // must be visited in sequence order (L1-L3, the routine)
  | 'safe' // L4: the safe choice of a pair (visiting it completes that pair)
  | 'unsafe' // L4: the un-safe twin — a gentle nudge, never a fail
  | 'any'; // L5: visit in any order, all count

export interface Station {
  emoji: string;
  /** the word under the picture, and the routine step it represents */
  label: string;
  kind: StationKind;
  /** local XZ offset from the island centre */
  pos: [number, number];
  /** the kind line Belu says when this station is "done" */
  done?: string;
  /** L4 only: which safe/unsafe pair this station belongs to */
  pair?: number;
}

export interface MountainLevel {
  goal: string;
  intro: string;
  outro: string;
  moment: string;
  /** the routine, in the order the ordered/safe stations must be visited */
  stations: Station[];
}

function st(
  emoji: string,
  label: string,
  kind: StationKind,
  x: number,
  z: number,
  extra: Partial<Station> = {},
): Station {
  return { emoji, label, kind, pos: [x, z], ...extra };
}

// A ring of station spots around the island centre, so the routine is a little
// walking loop. Index = the visit order for ordered levels.
const RING: [number, number][] = [
  [0, -5], // top
  [4.5, -2.5], // upper-right
  [4.5, 2.5], // lower-right
  [0, 5], // bottom
  [-4.5, 2.5], // lower-left
  [-4.5, -2.5], // upper-left
];

// L4 safety pairs sit side by side (safe on the left, twin on the right) at a
// few spots around the ring, so Belu chooses by walking to the safe one.
const SAFE_SPOTS: [number, number][] = [[-2.6, -4], [2.6, -4], [-2.6, 4], [2.6, 4]];
const TWIN_DX = 2.4;

export const MOUNTAIN_ROUTINE: MountainLevel[] = [
  {
    goal: 'Do each self-care job',
    intro: "Let's get ready for the day! Walk to each job in order to do it.",
    outro: 'You did it all by yourself — you are so ready!',
    moment: 'practiced life skills on the mountain',
    // L1: a short ordered chain of single self-care matches (wake→wash→brush→shoes)
    stations: [
      st('🛏️', 'Wake up', 'ordered', RING[0][0], RING[0][1], { done: 'Good morning! Up we get.' }),
      st('🧼', 'Wash hands', 'ordered', RING[1][0], RING[1][1], { done: 'Squeaky clean hands!' }),
      st('🪥', 'Brush teeth', 'ordered', RING[2][0], RING[2][1], { done: 'Sparkly clean teeth!' }),
      st('👟', 'Put on shoes', 'ordered', RING[3][0], RING[3][1], { done: 'Shoes on — ready to go!' }),
    ],
  },
  {
    goal: 'Do the steps in order',
    intro: 'Some jobs have steps in order. Walk the steps from first to last!',
    outro: 'You did it all by yourself — you are so ready!',
    moment: 'practiced life skills on the mountain',
    // L2: a short chain — get up, get dressed, then breakfast
    stations: [
      st('😴', 'Wake up', 'ordered', RING[0][0], RING[0][1], { done: 'Up and at it!' }),
      st('🪥', 'Brush teeth', 'ordered', RING[1][0], RING[1][1], { done: "That's how we brush!" }),
      st('👕', 'Get dressed', 'ordered', RING[3][0], RING[3][1], { done: 'All dressed!' }),
      st('🥣', 'Eat breakfast', 'ordered', RING[4][0], RING[4][1], { done: 'Yum — good fuel!' }),
    ],
  },
  {
    goal: 'The whole morning',
    intro: "Let's do the WHOLE morning, step by step. Walk them in order!",
    outro: 'A perfect morning, start to finish!',
    moment: 'practiced life skills on the mountain',
    // L3: the full morning sequence wake→brush→dress→eat→pack→goodbye
    stations: [
      st('😴', 'Wake up', 'ordered', RING[0][0], RING[0][1], { done: 'Good morning!' }),
      st('🪥', 'Brush teeth', 'ordered', RING[1][0], RING[1][1], { done: 'Teeth all clean!' }),
      st('👕', 'Get dressed', 'ordered', RING[2][0], RING[2][1], { done: 'Looking sharp!' }),
      st('🥣', 'Eat breakfast', 'ordered', RING[3][0], RING[3][1], { done: 'Yummy breakfast!' }),
      st('🎒', 'Pack bag', 'ordered', RING[4][0], RING[4][1], { done: 'Bag is packed!' }),
      st('🚪', 'Say goodbye', 'ordered', RING[5][0], RING[5][1], { done: 'Bye-bye — have a great day!' }),
    ],
  },
  {
    goal: 'Stay safe',
    intro: 'Being safe is a big-kid skill. Walk to the choice that keeps us safe.',
    outro: 'You made every safe choice — well done!',
    moment: 'practiced staying safe on the mountain',
    // L4: each pair = a safe marker + its un-safe twin. Walk to the SAFE one.
    stations: [
      st('👀', 'Look both ways', 'safe', SAFE_SPOTS[0][0], SAFE_SPOTS[0][1], { pair: 0, done: 'Yes — that is the safe choice!' }),
      st('🏃', 'Run across fast', 'unsafe', SAFE_SPOTS[0][0] + TWIN_DX, SAFE_SPOTS[0][1], { pair: 0 }),
      st('🙅', 'Stay away (hot stove)', 'safe', SAFE_SPOTS[1][0], SAFE_SPOTS[1][1], { pair: 1, done: 'Staying away keeps us safe.' }),
      st('✋', 'Touch the stove', 'unsafe', SAFE_SPOTS[1][0] + TWIN_DX, SAFE_SPOTS[1][1], { pair: 1 }),
      st('🙋', 'Find a trusted grown-up', 'safe', SAFE_SPOTS[2][0], SAFE_SPOTS[2][1], { pair: 2, done: 'Always find a trusted grown-up.' }),
      st('🚶', 'Go with a stranger', 'unsafe', SAFE_SPOTS[2][0] + TWIN_DX, SAFE_SPOTS[2][1], { pair: 2 }),
      st('🔒', 'Buckle your seatbelt', 'safe', SAFE_SPOTS[3][0], SAFE_SPOTS[3][1], { pair: 3, done: 'Click! Safe and ready.' }),
      st('🎮', 'Stand up in the car', 'unsafe', SAFE_SPOTS[3][0] + TWIN_DX, SAFE_SPOTS[3][1], { pair: 3 }),
    ],
  },
  {
    goal: 'All by myself',
    intro: 'Can you get ready all by yourself? Walk to each job — any order you like!',
    outro: 'All done — you got ready by yourself! 🌟',
    moment: 'got ready all by myself',
    // L5: independent self-check — visit all five, any order
    stations: [
      st('🛏️', 'Make the bed', 'any', RING[0][0], RING[0][1], { done: 'Bed all made!' }),
      st('🪥', 'Brush teeth', 'any', RING[1][0], RING[1][1], { done: 'Teeth all clean!' }),
      st('👕', 'Get dressed', 'any', RING[2][0], RING[2][1], { done: 'All dressed!' }),
      st('🥣', 'Eat breakfast', 'any', RING[4][0], RING[4][1], { done: 'Yummy breakfast!' }),
      st('🎒', 'Pack my bag', 'any', RING[5][0], RING[5][1], { done: 'Bag is packed!' }),
    ],
  },
];
