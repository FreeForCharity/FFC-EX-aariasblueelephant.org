// ---------------------------------------------------------------------------
// ADVANCED SISTER ISLANDS — unlocked when a skill island reaches 5/5:
//   meadow  → garden     (Feelings Garden 🌷)   advanced feelings
//   forest  → deepforest (Deep Forest 🌲)        advanced friendship & words
//   cove    → lagoon     (Quiet Lagoon 🪷)       advanced calm
//   shore   → bay        (Treasure Bay ⛵)       advanced sharing & cooperation
//
// Same shape and voice as quests.ts: 5 levels per island, short warm rounds,
// errorless, no timers, no losing. Faces vary per helper but each island has
// a "home" face: garden 🦋, deepforest 🦌, lagoon 🐬, bay 🦜.
//
// TODO(engine agent): `Quest.zone` in quests.ts is typed `ActivityZone`, which
// does not yet include 'garden' | 'deepforest' | 'lagoon' | 'bay'. Rather than
// edit quests.ts (other agents are mid-edit on it), this file defines its own
// `AdvancedZone` union and a local `AdvancedQuest` type — an `Omit<Quest,
// 'zone'> & { zone: AdvancedZone }` — so this file compiles standalone today.
// Once ActivityZone is widened to include the four advanced zones, the engine
// agent can simply re-type ADVANCED_QUESTS as Record<ActivityZone, Quest[]>
// (or merge these arrays into QUESTS) with no changes needed to the data below.
// ---------------------------------------------------------------------------

import type { Quest, Orb } from './quests';
import type { Mood } from './QuestNPC';

/** The four new zone ids — not yet part of ActivityZone. See TODO above. */
export type AdvancedZone = 'garden' | 'deepforest' | 'lagoon' | 'bay';

/** Same shape as Quest, but with our own zone union until quests.ts is widened. */
export type AdvancedQuest = Omit<Quest, 'zone'> & { zone: AdvancedZone };

const MOOD = (m: Mood): Mood => m;

function opt(emoji: string, caption: string, correct = false): Orb {
  return { emoji, caption, correct };
}

// ===========================================================================
// FEELINGS GARDEN 🌷 — Advanced Feelings (sister island of meadow)
// ===========================================================================

const GARDEN: AdvancedQuest[] = [
  {
    zone: 'garden', level: 1, goal: 'Two feelings at once',
    intro: "Welcome to my garden! Sometimes we feel TWO feelings at the same time. Both are okay.",
    outro: 'You know that two feelings can happen together. That is a big-kid thing to know!',
    moment: 'read mixed feelings in the garden',
    rounds: [
      { kind: 'choice', say: "It's Bea's first day at a new class. She feels happy AND nervous. Can both be true?",
        npc: { face: '🐛', mood: MOOD('neutral'), thought: { emoji: '🏫' } },
        options: [
          opt('✅', 'Yes, both at once', true),
          opt('❌', 'No, just one feeling'),
        ], doneLine: 'Yes! Happy and nervous can both be there. Both are okay.' },
      { kind: 'multiPick', say: 'Walk into BOTH feelings Bea might have on her first day.', picks: 2,
        npc: { face: '🐛', mood: MOOD('neutral'), thought: { emoji: '🏫' } },
        options: [
          opt('🤩', 'excited', true),
          opt('😟', 'a little nervous', true),
          opt('😡', 'angry'),
          opt('😴', 'bored'),
        ], doneLine: 'Excited AND a little nervous — both at the same time. That happens to everyone.' },
      { kind: 'choice', say: 'Sol is going on a fun trip, but will miss his dog. What two feelings fit best?',
        npc: { face: '🦋', mood: MOOD('neutral'), thought: { emoji: '🧳' } },
        options: [
          opt('🥹', 'excited and a little sad', true),
          opt('😡', 'only angry'),
          opt('😐', 'only bored'),
        ], doneLine: 'Excited about the trip, and a little sad to miss his dog — both true.' },
    ],
  },
  {
    zone: 'garden', level: 2, goal: 'Faces don\'t always match feelings',
    intro: "A face doesn't always show the real feeling underneath. Let's look closer.",
    outro: 'You looked past the face and found the real feeling. That takes great noticing!',
    moment: 'looked past faces in the garden',
    rounds: [
      { kind: 'choice', say: 'Milo is smiling, but he yawns and his eyes look heavy. How might Milo really feel?',
        npc: { face: '🦋', mood: MOOD('happy'), thought: { emoji: '😪' } },
        options: [
          opt('😴', 'tired, even with a smile', true),
          opt('😡', 'angry'),
          opt('😨', 'scared'),
        ], doneLine: 'A smile can hide a tired feeling underneath. Good noticing.' },
      { kind: 'choice', say: 'Pip says "I\'m fine" but her voice is quiet and she looks at the ground. What might be true?',
        npc: { face: '🐛', mood: MOOD('neutral'), thought: { emoji: '🤔' } },
        options: [
          opt('😞', 'She might feel sad inside', true),
          opt('🤩', 'She is very excited'),
          opt('😤', 'She is very angry'),
        ], doneLine: 'Sometimes "I\'m fine" hides a feeling. It is kind to check in.' },
      { kind: 'choice', say: 'What is a kind thing to say if you think a friend\'s face doesn\'t match how they feel?',
        npc: { face: '🦋', mood: MOOD('calm') },
        options: [
          opt('💬', 'Are you really okay?', true),
          opt('🙉', 'Nothing, just guess'),
          opt('😏', 'You look fine to me'),
        ], doneLine: '"Are you really okay?" gives a friend a chance to share.' },
    ],
  },
  {
    zone: 'garden', level: 3, goal: "Noticing a friend's feelings from what happened",
    intro: "We can guess a friend's feeling by remembering what just happened to them.",
    outro: 'You noticed feelings from what happened — that is real empathy!',
    moment: "noticed a friend's feelings in the garden",
    rounds: [
      { kind: 'choice', say: "Sam's block tower just fell down with a crash. How does Sam feel right now?",
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '🧱' } },
        options: [
          opt('😞', 'sad or frustrated', true),
          opt('🤩', 'excited'),
          opt('😴', 'bored'),
        ], doneLine: 'A tower falling would make most of us feel sad or frustrated too.' },
      { kind: 'choice', say: "Lulu's balloon just flew away into the sky. How does Lulu feel?",
        npc: { face: '🦋', mood: MOOD('disappointed'), thought: { emoji: '🎈' } },
        options: [
          opt('😞', 'disappointed', true),
          opt('😌', 'calm'),
          opt('🏆', 'proud'),
        ], doneLine: 'Losing a balloon is disappointing — that makes sense.' },
      { kind: 'choice', say: "Otto's friend had to move away to a new town. How might Otto feel?",
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '📦' } },
        options: [
          opt('😢', 'sad, missing his friend', true),
          opt('😄', 'happy'),
          opt('😲', 'surprised'),
        ], doneLine: 'Missing a friend who moved away is a real, sad feeling.' },
    ],
  },
  {
    zone: 'garden', level: 4, goal: 'Helping a sad friend',
    intro: "When a friend feels sad, there are gentle ways to help. Let's practice.",
    outro: 'You know just how to help a sad friend. That is real kindness.',
    moment: 'helped a sad friend in the garden',
    rounds: [
      { kind: 'choice', say: "Sam's tower fell down and he looks sad. What is a kind first step?",
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '🧱' } },
        options: [
          opt('🧎', 'Sit with him', true),
          opt('😆', 'Laugh'),
          opt('🚶', 'Walk away'),
        ], doneLine: 'Sitting with a sad friend shows them they are not alone.' },
      { kind: 'choice', say: 'Sam is still sad about the tower. What can you offer next?',
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '🧱' } },
        options: [
          opt('🤝', 'Offer to help rebuild', true),
          opt('🙅', 'Tell him to stop being sad'),
          opt('🏃', 'Go play somewhere else'),
        ], doneLine: 'Offering to help is a wonderful way to show you care.' },
      { kind: 'choice', say: "Sam is STILL very sad, even after sitting and helping. What is a good next step?",
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '💭' } },
        options: [
          opt('🙋', 'Get a grown-up', true),
          opt('🤐', 'Say nothing at all'),
          opt('😤', 'Get upset too'),
        ], doneLine: 'When a feeling is big, getting a grown-up is a great idea.' },
    ],
  },
  {
    zone: 'garden', level: 5, goal: 'My feelings change like clouds',
    intro: "Feelings move and change, like clouds passing by. A big feeling now does not last forever.",
    outro: 'You learned that feelings pass, like clouds in the sky. You will always feel calm again.',
    moment: 'learned that feelings pass in the garden',
    rounds: [
      { kind: 'choice', say: 'Bea felt very mad when her game got paused. A little later, how might she feel?',
        npc: { face: '🦋', mood: MOOD('angry'), thought: { emoji: '⏸️' } },
        options: [
          opt('😌', 'calm again, after some time', true),
          opt('😡', 'mad forever'),
        ], doneLine: 'Yes — even big mad feelings pass, like a cloud moving on.' },
      { kind: 'breathe', say: "Let's help a big feeling pass, like a cloud. Breathe with me.",
        npc: { face: '🦋', mood: MOOD('calm') }, cycles: 3,
        doneLine: 'The big feeling floated by, like a cloud. You feel calmer now.' },
      { kind: 'steps', say: 'Walk the cloud path — watch each feeling drift by, one step at a time.',
        npc: { face: '🐛', mood: MOOD('calm') },
        count: 4,
        labels: ['Mad ☁️', 'A little calmer ⛅', 'Calmer still 🌤️', 'Calm again ☀️'],
        doneLine: 'From mad, to calm — feelings really do change, like clouds passing by.' },
    ],
  },
];

// ===========================================================================
// DEEP FOREST 🌲 — Advanced Friendship & Words (sister island of forest)
// ===========================================================================

const DEEPFOREST: AdvancedQuest[] = [
  {
    zone: 'deepforest', level: 1, goal: 'Joining kids already playing',
    intro: "Some friends are already playing deep in the forest. Let's learn how to join in.",
    outro: 'You learned how to ask to join a game. That takes real courage!',
    moment: 'learned to join a game in the deep forest',
    rounds: [
      { kind: 'choice', say: 'Fox and Bunny are playing tag without you. What can you say?',
        npc: { face: '🦌', mood: MOOD('happy'), thought: { emoji: '🏃' } },
        options: [
          opt('🙋', 'Can I play too?', true),
          opt('🤐', 'Say nothing and watch'),
          opt('😤', 'Grab the ball and run'),
        ], doneLine: '"Can I play too?" is a great way to ask.' },
      { kind: 'choice', say: 'You asked "Can I play too?" — now what do you do?',
        npc: { face: '🦊', mood: MOOD('happy'), thought: { emoji: '❓' } },
        options: [
          opt('⏳', 'Wait for their answer', true),
          opt('🏃', 'Start playing right away without waiting'),
        ], doneLine: 'Waiting for the answer is polite and kind.' },
      { kind: 'choice', say: 'Fox says "Yes, come play!" What do you do?',
        npc: { face: '🦊', mood: MOOD('happy'), thought: { emoji: '✅' } },
        options: [
          opt('🎉', 'Join in happily', true),
          opt('🙅', 'Say no thanks'),
        ], doneLine: 'You joined the game. Great asking!' },
    ],
  },
  {
    zone: 'deepforest', level: 2, goal: 'When a friend says no',
    intro: "Sometimes a friend says no, and that is okay too. Let's learn what to do.",
    outro: "You learned that 'no' is okay, and there is always another game. Well done.",
    moment: 'learned what to do when a friend says no in the deep forest',
    rounds: [
      { kind: 'choice', say: 'You ask "Can I play too?" and Bear says "Not right now." How do you feel first?',
        npc: { face: '🐻', mood: MOOD('neutral'), thought: { emoji: '🙅' } },
        options: [
          opt('😞', 'A little disappointed — that is okay', true),
          opt('😡', 'I must yell'),
        ], doneLine: 'It is okay to feel a little disappointed. That feeling passes.' },
      { kind: 'choice', say: 'Bear said not right now. What can you do next?',
        npc: { face: '🐻', mood: MOOD('neutral') },
        options: [
          opt('🔍', 'Find another game to play', true),
          opt('😤', 'Push in anyway'),
          opt('😭', 'Cry loudly at Bear'),
        ], doneLine: 'Finding another game keeps your day fun.' },
      { kind: 'choice', say: 'Maybe later you still want to play with Bear. What can you try?',
        npc: { face: '🐻', mood: MOOD('happy') },
        options: [
          opt('🙋', 'Ask again later', true),
          opt('🙅', 'Never ask Bear again'),
        ], doneLine: 'Asking again later is a great idea. "Not now" is not "never."' },
    ],
  },
  {
    zone: 'deepforest', level: 3, goal: 'Losing a game gracefully',
    intro: "Sometimes we don't win. There is a friendly way to lose a game.",
    outro: 'You lost a game with a friendly heart. That makes you fun to play with!',
    moment: 'lost a game gracefully in the deep forest',
    rounds: [
      { kind: 'choice', say: 'Deer won the race and you came in second. What do you say to Deer?',
        npc: { face: '🦌', mood: MOOD('proud'), thought: { emoji: '🏁' } },
        options: [
          opt('👏', 'Good game!', true),
          opt('😤', 'That was not fair'),
          opt('🙄', 'I did not even try'),
        ], doneLine: '"Good game!" shows you can be a gracious friend.' },
      { kind: 'choice', say: 'You feel a little disappointed you did not win. What can you do with that feeling?',
        npc: { face: '🦌', mood: MOOD('neutral') },
        options: [
          opt('🌬️', 'Take a breath, it is okay', true),
          opt('😡', 'Kick the ground'),
        ], doneLine: 'A breath helps the disappointed feeling pass.' },
      { kind: 'choice', say: 'What is a good next step after losing a game?',
        npc: { face: '🦌', mood: MOOD('happy') },
        options: [
          opt('🔁', 'Try again', true),
          opt('🚪', 'Never play again'),
        ], doneLine: 'Trying again is how we get better and have more fun.' },
    ],
  },
  {
    zone: 'deepforest', level: 4, goal: 'Politely disagreeing',
    intro: "Friends don't always want the same thing. Let's learn to disagree kindly.",
    outro: 'You disagreed kindly and found a fair answer. That is a big friendship skill!',
    moment: 'disagreed politely in the deep forest',
    rounds: [
      { kind: 'choice', say: 'You and Bunny both want the red block. What can you say?',
        npc: { face: '🐰', mood: MOOD('neutral'), thought: { emoji: '🟥' } },
        options: [
          opt('💬', 'I want the red one', true),
          opt('😤', 'Grab it and run'),
          opt('🤐', 'Say nothing and feel upset'),
        ], doneLine: 'Saying what you want clearly is a good first step.' },
      { kind: 'choice', say: 'Bunny wants the red block too. What can you both try?',
        npc: { face: '🐰', mood: MOOD('neutral') },
        options: [
          opt('🔄', 'Can we take turns?', true),
          opt('😡', 'It is mine, no turns'),
        ], doneLine: '"Can we take turns?" is a fair, kind way to solve it.' },
      { kind: 'choice', say: 'You both agree to take turns. Who goes first can be decided by...',
        npc: { face: '🐰', mood: MOOD('happy') },
        options: [
          opt('🪙', 'A fair pick, like a coin flip', true),
          opt('😤', 'Whoever grabs it first'),
        ], doneLine: 'A fair pick keeps it friendly for everyone.' },
    ],
  },
  {
    zone: 'deepforest', level: 5, goal: 'Giving and receiving compliments',
    intro: "Kind words about a friend's work are called compliments. Let's practice giving and getting them.",
    outro: 'You gave and received compliments so kindly. That is how friendships grow!',
    moment: 'shared compliments in the deep forest',
    rounds: [
      { kind: 'choice', say: 'Owl built a very tall tower. What kind thing can you say?',
        npc: { face: '🦉', mood: MOOD('proud'), thought: { emoji: '🗼' } },
        options: [
          opt('👏', 'Wow, great tower!', true),
          opt('😐', 'That is boring'),
          opt('🤐', 'Say nothing'),
        ], doneLine: 'A kind compliment can make a friend\'s whole day.' },
      { kind: 'choice', say: 'Deer says "I love your drawing!" What do you say back?',
        npc: { face: '🦌', mood: MOOD('happy'), thought: { emoji: '🎨' } },
        options: [
          opt('😊', 'Thank you!', true),
          opt('🙅', 'It is not good'),
        ], doneLine: '"Thank you!" is the perfect way to take a compliment.' },
      { kind: 'multiPick', say: 'Walk into two kind things you could say about a friend\'s work.', picks: 2,
        npc: { face: '🦌', mood: MOOD('happy') },
        options: [
          opt('🌈', 'I love the colors!', true),
          opt('💪', 'You worked so hard!', true),
          opt('😒', 'It could be better'),
          opt('🥱', "That's boring"),
        ], doneLine: 'Those are wonderful compliments — friends love hearing them.' },
    ],
  },
];

// ===========================================================================
// QUIET LAGOON 🪷 — Advanced Calm (sister island of cove)
// ===========================================================================

const LAGOON: AdvancedQuest[] = [
  {
    zone: 'lagoon', level: 1, goal: 'Noticing early body signals',
    intro: "Our body sends little signals before a big feeling grows. Let's learn to notice them early.",
    outro: 'You noticed the early signals in your body. That is a superpower for staying calm!',
    moment: 'noticed early body signals at the lagoon',
    rounds: [
      { kind: 'choice', say: 'Before a big feeling grows, your hands might feel...',
        npc: { face: '🐬', mood: MOOD('neutral'), thought: { emoji: '✊' } },
        options: [
          opt('✊', 'tight or clenched', true),
          opt('🖐️', 'loose and floppy'),
        ], doneLine: 'Tight hands can be an early signal — good noticing!' },
      { kind: 'choice', say: 'Your heart might start to feel...',
        npc: { face: '🐬', mood: MOOD('neutral'), thought: { emoji: '💓' } },
        options: [
          opt('💓', 'fast, beating quickly', true),
          opt('💤', 'sleepy and slow'),
        ], doneLine: 'A fast heart can be an early signal too.' },
      { kind: 'choice', say: 'When you notice a signal like tight hands or a fast heart, what is a good first step?',
        npc: { face: '🐬', mood: MOOD('calm') },
        options: [
          opt('🌬️', 'Take a calm breath', true),
          opt('🙈', 'Ignore it and keep going'),
        ], doneLine: 'Noticing early and breathing helps keep feelings small and manageable.' },
    ],
  },
  {
    zone: 'lagoon', level: 2, goal: 'A longer breathing ladder',
    intro: "Let's climb the calm stepping stones — five breaths, one stone at a time.",
    outro: 'You climbed all five calm stones. What a peaceful ladder of breaths!',
    moment: 'climbed the breathing ladder at the lagoon',
    rounds: [
      { kind: 'steps', say: "Climb the calm stones with me — one slow breath on each stone.",
        npc: { face: '🐬', mood: MOOD('calm') },
        count: 5,
        labels: ['Breathe 1 🌊', 'Breathe 2 🌊', 'Breathe 3 🌊', 'Breathe 4 🌊', 'Breathe 5 🌊'],
        doneLine: 'Five slow breaths, five calm stones — you feel peaceful now.' },
      { kind: 'breathe', say: 'One more gentle breath together, just because it feels nice.',
        npc: { face: '🐬', mood: MOOD('calm') }, cycles: 2,
        doneLine: 'So calm and quiet, like the lagoon itself.' },
    ],
  },
  {
    zone: 'lagoon', level: 3, goal: 'Making a plan for loud places',
    intro: "Loud places can feel like too much. Let's sort helpful ideas from ones that are not helpful.",
    outro: 'You built a smart plan for loud places. You are ready for anywhere now!',
    moment: 'made a plan for loud places at the lagoon',
    rounds: [
      { kind: 'sort', say: "Let's sort ideas for loud places! Carry each one to helpful or not helpful.",
        npc: { face: '🐬', mood: MOOD('neutral'), thought: { emoji: '🔊' } },
        tables: [
          opt('✅', 'Helpful'),
          opt('❌', 'Not helpful'),
        ],
        items: [
          { emoji: '🙉', caption: 'Cover ears', table: 0 },
          { emoji: '🙋', caption: 'Ask for a quiet corner', table: 0 },
          { emoji: '🌬️', caption: 'Take a deep breath', table: 0 },
          { emoji: '😡', caption: 'Yell louder', table: 1 },
          { emoji: '🏃', caption: 'Run off alone', table: 1 },
        ],
        doneLine: 'Covering ears, asking for quiet, and breathing — those really help!' },
      { kind: 'choice', say: 'A loud room feels like too much right now. What do you try first?',
        npc: { face: '🐬', mood: MOOD('neutral'), thought: { emoji: '🔊' } },
        options: [
          opt('🙉', 'Cover my ears', true),
          opt('😡', 'Yell louder'),
        ], doneLine: 'Covering your ears is a great first plan.' },
    ],
  },
  {
    zone: 'lagoon', level: 4, goal: 'Waiting calmly',
    intro: "Waiting can feel long. Let's practice fun ways to wait calmly.",
    outro: 'You waited so calmly with your own waiting games. Wonderful patience!',
    moment: 'practiced waiting calmly at the lagoon',
    rounds: [
      { kind: 'multiPick', say: 'Walk into TWO waiting games that help the time pass calmly.', picks: 2,
        npc: { face: '🐬', mood: MOOD('calm'), thought: { emoji: '⏳' } },
        options: [
          opt('🔢', 'Count slowly', true),
          opt('✊', 'Squeeze my hands', true),
          opt('😡', 'Yell "hurry up!"'),
          opt('🏃', 'Run around loudly'),
        ], doneLine: 'Counting and squeezing hands are great ways to wait calmly.' },
      { kind: 'steps', say: "Let's count slowly together while we wait, one number at a time.",
        npc: { face: '🐬', mood: MOOD('calm') },
        count: 5,
        doneLine: 'One, two, three, four, five — the wait is over, and you stayed so calm!' },
      { kind: 'choice', say: 'While you wait, thinking of your favorite thing can help. What is a good favorite to think of?',
        npc: { face: '🐬', mood: MOOD('calm'), thought: { emoji: '💭' } },
        options: [
          opt('🌟', 'My favorite thing', true),
          opt('😤', 'How slow this is'),
        ], doneLine: 'Thinking of a favorite thing makes waiting feel shorter.' },
    ],
  },
  {
    zone: 'lagoon', level: 5, goal: 'When plans change',
    intro: "Sometimes plans change without warning. Let's practice thinking of a new idea.",
    outro: 'You found a new plan when the old one changed. That is flexible thinking — so strong!',
    moment: 'handled a changed plan at the lagoon',
    rounds: [
      { kind: 'choice', say: 'The park is closed today, and that was the plan. How might you feel first?',
        npc: { face: '🐬', mood: MOOD('disappointed'), thought: { emoji: '🚫' } },
        options: [
          opt('😞', 'A little disappointed — that is okay', true),
          opt('😡', 'I must yell about it'),
        ], doneLine: 'Feeling disappointed when a plan changes is okay.' },
      { kind: 'breathe', say: 'Let\'s breathe through the surprise together.',
        npc: { face: '🐬', mood: MOOD('calm') }, cycles: 2,
        doneLine: 'A calm breath makes room for a new idea.' },
      { kind: 'choice', say: 'The park is closed. What can we do instead?',
        npc: { face: '🐬', mood: MOOD('calm'), thought: { emoji: '❓' } },
        options: [
          opt('🏠', 'Think of a fun thing to do at home', true),
          opt('😤', 'Stay upset all day'),
        ], doneLine: 'Finding a new plan turns a hard moment into a good one.' },
    ],
  },
];

// ===========================================================================
// TREASURE BAY ⛵ — Advanced Sharing & Cooperation (sister island of shore)
// ===========================================================================

const BAY: AdvancedQuest[] = [
  {
    zone: 'bay', level: 1, goal: 'Borrowing and returning',
    intro: "Sometimes we borrow a friend's thing. Let's practice asking, and giving it back.",
    outro: 'You borrowed and returned so kindly. That builds friend trust!',
    moment: 'practiced borrowing and returning at the bay',
    rounds: [
      { kind: 'choice', say: 'Parrot has a shovel you want to use. What do you say?',
        npc: { face: '🦜', mood: MOOD('happy'), thought: { emoji: '🪏' } },
        options: [
          opt('🙋', 'Can I borrow it?', true),
          opt('🤚', 'Take it without asking'),
        ], doneLine: '"Can I borrow it?" is the kind way to ask.' },
      { kind: 'choice', say: 'You are done with the shovel. What do you do now?',
        npc: { face: '🦜', mood: MOOD('happy') },
        options: [
          opt('🔙', 'Give it back and say thank you', true),
          opt('🙅', 'Keep it'),
        ], doneLine: '"Here it is back — thank you!" That is how borrowing works.' },
      { kind: 'choice', say: 'Parrot says "Thanks for bringing it back!" How do you feel?',
        npc: { face: '🦜', mood: MOOD('happy') },
        options: [
          opt('😊', 'Happy — I was a good friend', true),
          opt('😐', 'It does not matter'),
        ], doneLine: 'Being trusted with borrowed things feels great.' },
    ],
  },
  {
    zone: 'bay', level: 2, goal: 'Trading and compromise',
    intro: "Sometimes two friends want different things. A trade can make everyone happy.",
    outro: 'You made a fair trade. Compromise makes everyone a winner!',
    moment: 'made a fair trade at the bay',
    rounds: [
      { kind: 'choice', say: 'You have a blue shell, Turtle has a pink shell. You both like the other one. What can you try?',
        npc: { face: '🐢', mood: MOOD('neutral'), thought: { emoji: '🐚' } },
        options: [
          opt('🔄', 'Trade shells', true),
          opt('🙅', 'Keep mine and take theirs too'),
        ], doneLine: 'A trade means you both get something you like!' },
      { kind: 'choice', say: 'You both want to pick the game first. What is a fair way to decide?',
        npc: { face: '🦜', mood: MOOD('neutral') },
        options: [
          opt('🥇', 'You pick first this time, I pick next time', true),
          opt('😤', 'I always pick first'),
        ], doneLine: 'Taking turns picking is a fair compromise.' },
      { kind: 'choice', say: 'It worked out fairly for both of you. How do you both feel?',
        npc: { face: '🐢', mood: MOOD('happy') },
        options: [
          opt('😊', 'Happy, it felt fair', true),
          opt('😤', 'Still upset'),
        ], doneLine: 'A fair trade leaves everyone feeling good.' },
    ],
  },
  {
    zone: 'bay', level: 3, goal: 'Building together',
    intro: "Let's build a sandcastle together, one piece at a time — taking turns adding to it.",
    outro: 'You built the whole castle together, turn by turn. It is even better made together!',
    moment: 'built a sandcastle together at the bay',
    rounds: [
      { kind: 'choice', say: 'One pile of sand, two builders. How should you start?',
        npc: { face: '🦜', mood: MOOD('excited'), thought: { emoji: '🏰' } },
        options: [
          opt('🤝', 'Take turns adding pieces', true),
          opt('🙅', 'Build separately with no turns'),
        ], doneLine: 'Taking turns means the castle is truly built together.' },
      { kind: 'carry', say: "Let's build it! Carry each piece to the castle, one turn at a time — your piece, my piece, your piece.",
        npc: { face: '🦜', mood: MOOD('happy') },
        items: [
          { emoji: '🧱', caption: 'my piece' },
          { emoji: '🐚', caption: "Parrot's piece" },
          { emoji: '🚩', caption: 'my piece' },
        ],
        doneLine: 'Piece by piece, turn by turn — the castle grew tall!' },
      { kind: 'choice', say: 'The castle is finished! How do you feel about building it together?',
        npc: { face: '🦜', mood: MOOD('proud'), thought: { emoji: '🏰' } },
        options: [
          opt('🎉', 'Proud — we built it together!', true),
          opt('😤', 'I wish I built it alone'),
        ], doneLine: '"We built it together!" — the best kind of proud.' },
    ],
  },
  {
    zone: 'bay', level: 4, goal: 'When there is only one',
    intro: "Only one boat, and two friends who want to ride. Let's find fair ways to share it.",
    outro: 'You found fair ways to share one thing. That takes real teamwork!',
    moment: 'shared one thing fairly at the bay',
    rounds: [
      { kind: 'choice', say: 'There is only one boat, and both you and Turtle want to ride. What is a fair idea?',
        npc: { face: '🐢', mood: MOOD('neutral'), thought: { emoji: '⛵' } },
        options: [
          opt('⏱️', 'Take turns with a timer', true),
          opt('😤', 'Whoever gets there first keeps it'),
        ], doneLine: 'A timer makes turns fair for everyone.' },
      { kind: 'choice', say: 'The boat is big enough for two. What else could you try?',
        npc: { face: '🐢', mood: MOOD('happy') },
        options: [
          opt('🤝', 'Ride together', true),
          opt('🙅', 'Push Turtle out'),
        ], doneLine: 'Riding together means no one has to wait at all!' },
      { kind: 'choice', say: 'If you cannot ride together or use a timer, what is one more fair idea?',
        npc: { face: '🦜', mood: MOOD('neutral') },
        options: [
          opt('🎲', 'Choose together, like a fair pick', true),
          opt('😡', 'Argue until someone gives up'),
        ], doneLine: 'Choosing together, fairly, keeps everyone as friends.' },
    ],
  },
  {
    zone: 'bay', level: 5, goal: "Celebrating a friend's win",
    intro: "When a friend wins or does something great, we can celebrate WITH them.",
    outro: "You celebrated a friend's win with your whole heart. That is true friendship!",
    moment: "celebrated a friend's win at the bay",
    rounds: [
      { kind: 'choice', say: 'Turtle just won the swimming race! What can you do?',
        npc: { face: '🐢', mood: MOOD('proud'), thought: { emoji: '🏆' } },
        options: [
          opt('👏', 'Clap for Turtle', true),
          opt('😤', 'Look away, upset'),
        ], doneLine: 'Clapping for a friend shows you are happy for them.' },
      { kind: 'choice', say: 'What kind words can you say to Turtle?',
        npc: { face: '🐢', mood: MOOD('proud') },
        options: [
          opt('🎉', 'Congrats, great job!', true),
          opt('😒', 'You just got lucky'),
        ], doneLine: '"Congrats, great job!" makes a winner feel truly seen.' },
      { kind: 'choice', say: 'You did not win this time, but you cheered for Turtle. How can that feel?',
        npc: { face: '🦜', mood: MOOD('happy') },
        options: [
          opt('💖', 'Good — being happy for others feels nice too', true),
          opt('😡', 'Only bad'),
        ], doneLine: 'Being happy for a friend is its own kind of winning.' },
    ],
  },
];

// ===========================================================================

export const ADVANCED_QUESTS: Record<AdvancedZone, AdvancedQuest[]> = {
  garden: GARDEN,
  deepforest: DEEPFOREST,
  lagoon: LAGOON,
  bay: BAY,
};

/** Get the advanced quest for a zone at a 1-based level (clamped). */
export function getAdvancedQuest(zone: AdvancedZone, level: number): AdvancedQuest {
  const list = ADVANCED_QUESTS[zone];
  const idx = Math.max(0, Math.min(list.length - 1, level - 1));
  return list[idx];
}

/** Suggested Day Book sticker entries for each advanced level, 'garden-1'..'bay-5'. */
export const ADVANCED_STICKERS: Record<string, { emoji: string; label: string }> = {
  'garden-1': { emoji: '🌦️', label: 'Mixed feelings are okay! 🌦️' },
  'garden-2': { emoji: '🎭', label: 'A face doesn\'t always tell it all! 🎭' },
  'garden-3': { emoji: '🧠', label: 'I can guess how a friend feels! 🧠' },
  'garden-4': { emoji: '🤗', label: 'I know how to help a sad friend! 🤗' },
  'garden-5': { emoji: '☁️', label: 'Feelings pass, like clouds! ☁️' },
  'deepforest-1': { emoji: '🙋', label: 'Can I play too? I know how to ask! 🙋' },
  'deepforest-2': { emoji: '🔍', label: 'When a friend says no, I find another game! 🔍' },
  'deepforest-3': { emoji: '👏', label: 'Good game! I can lose with a smile! 👏' },
  'deepforest-4': { emoji: '🔄', label: 'Can we take turns? I disagree kindly! 🔄' },
  'deepforest-5': { emoji: '💛', label: 'I give and take compliments! 💛' },
  'lagoon-1': { emoji: '✊', label: 'I notice tight hands and a fast heart early! ✊' },
  'lagoon-2': { emoji: '🪨', label: 'Five calm breaths, five calm stones! 🪨' },
  'lagoon-3': { emoji: '🔊', label: 'I have a plan for loud places! 🔊' },
  'lagoon-4': { emoji: '⏳', label: 'I can wait calmly with my own games! ⏳' },
  'lagoon-5': { emoji: '🔀', label: 'When plans change, I think of something new! 🔀' },
  'bay-1': { emoji: '🔙', label: 'I borrow kindly and give it back! 🔙' },
  'bay-2': { emoji: '🔄', label: 'I can trade and compromise! 🔄' },
  'bay-3': { emoji: '🏰', label: 'We built it together, turn by turn! 🏰' },
  'bay-4': { emoji: '⛵', label: 'When there is only one, we share it fairly! ⛵' },
  'bay-5': { emoji: '🎉', label: 'I celebrate my friend\'s win! 🎉' },
};
