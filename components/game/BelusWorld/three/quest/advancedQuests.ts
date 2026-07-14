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
// ActivityZone (belu/progress.ts) has been widened to include the four
// advanced zones, so AdvancedQuest is now just an alias for Quest and
// ADVANCED_QUESTS merges straight into QUESTS in quests.ts.
// ---------------------------------------------------------------------------

import type { Quest, Orb } from './quests';
import type { Mood } from './QuestNPC';
import type { ActivityZone } from '../../belu/progress';
import { isEs } from '../../../../../lib/lang';

/** The four advanced zone ids — a subset of ActivityZone. */
export type AdvancedZone = Extract<ActivityZone, 'garden' | 'deepforest' | 'lagoon' | 'bay'>;

/** Same shape as Quest — kept as its own name for readability in this file. */
export type AdvancedQuest = Quest;

const MOOD = (m: Mood): Mood => m;

function opt(emoji: string, caption: string, correct = false): Orb {
  return { emoji, caption, correct };
}

// ===========================================================================
// FEELINGS GARDEN 🌷 — Advanced Feelings (sister island of meadow)
// ===========================================================================

const GARDEN_EN: AdvancedQuest[] = [
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

const GARDEN_ES: AdvancedQuest[] = [
  {
    zone: 'garden', level: 1, goal: 'Dos sentimientos a la vez',
    intro: '¡Bienvenido a mi jardín! A veces sentimos DOS sentimientos al mismo tiempo. Los dos están bien.',
    outro: 'Ya sabes que dos sentimientos pueden pasar juntos. ¡Eso lo sabe un niño grande!',
    moment: 'leyó sentimientos mezclados en el jardín',
    rounds: [
      { kind: 'choice', say: 'Es el primer día de Bea en una clase nueva. Se siente feliz Y nerviosa. ¿Pueden ser verdad las dos cosas?',
        npc: { face: '🐛', mood: MOOD('neutral'), thought: { emoji: '🏫' } },
        options: [
          opt('✅', 'Sí, las dos a la vez', true),
          opt('❌', 'No, solo un sentimiento'),
        ], doneLine: '¡Sí! Feliz y nerviosa pueden estar las dos. Las dos están bien.' },
      { kind: 'multiPick', say: 'Camina hacia LOS DOS sentimientos que Bea podría tener en su primer día.', picks: 2,
        npc: { face: '🐛', mood: MOOD('neutral'), thought: { emoji: '🏫' } },
        options: [
          opt('🤩', 'emocionada', true),
          opt('😟', 'un poco nerviosa', true),
          opt('😡', 'enojada'),
          opt('😴', 'aburrida'),
        ], doneLine: 'Emocionada Y un poco nerviosa — las dos a la vez. Eso le pasa a todos.' },
      { kind: 'choice', say: 'Sol va de viaje divertido, pero va a extrañar a su perro. ¿Qué dos sentimientos van mejor?',
        npc: { face: '🦋', mood: MOOD('neutral'), thought: { emoji: '🧳' } },
        options: [
          opt('🥹', 'emocionado y un poco triste', true),
          opt('😡', 'solo enojado'),
          opt('😐', 'solo aburrido'),
        ], doneLine: 'Emocionado por el viaje, y un poco triste por extrañar a su perro — las dos son verdad.' },
    ],
  },
  {
    zone: 'garden', level: 2, goal: 'La cara no siempre dice el sentimiento',
    intro: 'Una cara no siempre muestra el sentimiento verdadero de adentro. Vamos a mirar más de cerca.',
    outro: '¡Miraste más allá de la cara y encontraste el sentimiento verdadero. Eso es notar muy bien!',
    moment: 'miró más allá de las caras en el jardín',
    rounds: [
      { kind: 'choice', say: 'Milo está sonriendo, pero bosteza y sus ojos se ven pesados. ¿Cómo podría sentirse Milo en verdad?',
        npc: { face: '🦋', mood: MOOD('happy'), thought: { emoji: '😪' } },
        options: [
          opt('😴', 'cansado, aunque sonría', true),
          opt('😡', 'enojado'),
          opt('😨', 'asustado'),
        ], doneLine: 'Una sonrisa puede esconder un sentimiento de cansancio adentro. Buena observación.' },
      { kind: 'choice', say: 'Pip dice "estoy bien" pero su voz es bajita y mira al piso. ¿Qué podría ser verdad?',
        npc: { face: '🐛', mood: MOOD('neutral'), thought: { emoji: '🤔' } },
        options: [
          opt('😞', 'Podría sentirse triste por dentro', true),
          opt('🤩', 'Está muy emocionada'),
          opt('😤', 'Está muy enojada'),
        ], doneLine: 'A veces "estoy bien" esconde un sentimiento. Es amable preguntarle cómo está.' },
      { kind: 'choice', say: '¿Qué es amable decir si crees que la cara de un amigo no coincide con cómo se siente?',
        npc: { face: '🦋', mood: MOOD('calm') },
        options: [
          opt('💬', '¿De verdad estás bien?', true),
          opt('🙉', 'Nada, solo adivina'),
          opt('😏', 'Te ves bien'),
        ], doneLine: '"¿De verdad estás bien?" le da a un amigo la oportunidad de contarte.' },
    ],
  },
  {
    zone: 'garden', level: 3, goal: 'Notar los sentimientos de un amigo por lo que pasó',
    intro: 'Podemos adivinar el sentimiento de un amigo recordando lo que le acaba de pasar.',
    outro: '¡Notaste los sentimientos por lo que pasó — eso es empatía de verdad!',
    moment: 'notó los sentimientos de un amigo en el jardín',
    rounds: [
      { kind: 'choice', say: 'La torre de bloques de Sam se acaba de caer con un golpe fuerte. ¿Cómo se siente Sam ahora mismo?',
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '🧱' } },
        options: [
          opt('😞', 'triste o frustrado', true),
          opt('🤩', 'emocionado'),
          opt('😴', 'aburrido'),
        ], doneLine: 'A la mayoría de nosotros una torre que se cae también nos haría sentir tristes o frustrados.' },
      { kind: 'choice', say: 'El globo de Lulu se acaba de volar hacia el cielo. ¿Cómo se siente Lulu?',
        npc: { face: '🦋', mood: MOOD('disappointed'), thought: { emoji: '🎈' } },
        options: [
          opt('😞', 'decepcionada', true),
          opt('😌', 'tranquila'),
          opt('🏆', 'orgullosa'),
        ], doneLine: 'Perder un globo da decepción — eso tiene sentido.' },
      { kind: 'choice', say: 'El amigo de Otto se tuvo que mudar a un pueblo nuevo. ¿Cómo podría sentirse Otto?',
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '📦' } },
        options: [
          opt('😢', 'triste, extrañando a su amigo', true),
          opt('😄', 'feliz'),
          opt('😲', 'sorprendido'),
        ], doneLine: 'Extrañar a un amigo que se mudó es un sentimiento real y triste.' },
    ],
  },
  {
    zone: 'garden', level: 4, goal: 'Ayudar a un amigo triste',
    intro: 'Cuando un amigo se siente triste, hay maneras suaves de ayudar. Vamos a practicar.',
    outro: 'Sabes justo cómo ayudar a un amigo triste. Eso es bondad de verdad.',
    moment: 'ayudó a un amigo triste en el jardín',
    rounds: [
      { kind: 'choice', say: 'La torre de Sam se cayó y se ve triste. ¿Cuál es un buen primer paso amable?',
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '🧱' } },
        options: [
          opt('🧎', 'Sentarte con él', true),
          opt('😆', 'Reírte'),
          opt('🚶', 'Irte caminando'),
        ], doneLine: 'Sentarte con un amigo triste le muestra que no está solo.' },
      { kind: 'choice', say: 'Sam sigue triste por la torre. ¿Qué le puedes ofrecer después?',
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '🧱' } },
        options: [
          opt('🤝', 'Ofrecerte a ayudar a reconstruirla', true),
          opt('🙅', 'Decirle que deje de estar triste'),
          opt('🏃', 'Irte a jugar a otro lado'),
        ], doneLine: 'Ofrecerte a ayudar es una manera hermosa de mostrar que te importa.' },
      { kind: 'choice', say: 'Sam TODAVÍA está muy triste, aunque te sentaste y ayudaste. ¿Cuál es un buen siguiente paso?',
        npc: { face: '🐛', mood: MOOD('sad'), thought: { emoji: '💭' } },
        options: [
          opt('🙋', 'Buscar a una persona adulta', true),
          opt('🤐', 'No decir nada'),
          opt('😤', 'Alterarte también'),
        ], doneLine: 'Cuando un sentimiento es grande, buscar a una persona adulta es una gran idea.' },
    ],
  },
  {
    zone: 'garden', level: 5, goal: 'Mis sentimientos cambian como las nubes',
    intro: 'Los sentimientos se mueven y cambian, como las nubes que pasan. Un sentimiento grande ahora no dura para siempre.',
    outro: 'Aprendiste que los sentimientos pasan, como las nubes en el cielo. Siempre volverás a sentirte tranquilo.',
    moment: 'aprendió que los sentimientos pasan en el jardín',
    rounds: [
      { kind: 'choice', say: 'Bea se sintió muy enojada cuando pausaron su juego. Un rato después, ¿cómo podría sentirse?',
        npc: { face: '🦋', mood: MOOD('angry'), thought: { emoji: '⏸️' } },
        options: [
          opt('😌', 'tranquila otra vez, después de un rato', true),
          opt('😡', 'enojada para siempre'),
        ], doneLine: 'Sí — hasta los sentimientos de mucho enojo pasan, como una nube que sigue su camino.' },
      { kind: 'breathe', say: 'Vamos a ayudar a que un sentimiento grande pase, como una nube. Respira conmigo.',
        npc: { face: '🦋', mood: MOOD('calm') }, cycles: 3,
        doneLine: 'El sentimiento grande flotó y se fue, como una nube. Ahora te sientes más tranquilo.' },
      { kind: 'steps', say: 'Camina el sendero de las nubes — mira cómo cada sentimiento pasa flotando, un paso a la vez.',
        npc: { face: '🐛', mood: MOOD('calm') },
        count: 4,
        labels: ['Enojado ☁️', 'Un poco más tranquilo ⛅', 'Más tranquilo aún 🌤️', 'Tranquilo otra vez ☀️'],
        doneLine: 'De enojado, a tranquilo — los sentimientos de verdad cambian, como las nubes que pasan.' },
    ],
  },
];

const GARDEN = isEs() ? GARDEN_EN.map((item, i) => GARDEN_ES[i] ?? item) : GARDEN_EN;

// ===========================================================================
// DEEP FOREST 🌲 — Advanced Friendship & Words (sister island of forest)
// ===========================================================================

const DEEPFOREST_EN: AdvancedQuest[] = [
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

const DEEPFOREST_ES: AdvancedQuest[] = [
  {
    zone: 'deepforest', level: 1, goal: 'Unirse a niños que ya están jugando',
    intro: 'Algunos amigos ya están jugando en lo profundo del bosque. Vamos a aprender cómo unirnos.',
    outro: '¡Aprendiste cómo pedir unirte a un juego. Eso toma mucho valor!',
    moment: 'aprendió a unirse a un juego en el bosque profundo',
    rounds: [
      { kind: 'choice', say: 'Zorro y Conejita están jugando a las atrapadas sin ti. ¿Qué puedes decir?',
        npc: { face: '🦌', mood: MOOD('happy'), thought: { emoji: '🏃' } },
        options: [
          opt('🙋', '¿Puedo jugar también?', true),
          opt('🤐', 'No decir nada y solo mirar'),
          opt('😤', 'Agarrar la pelota y correr'),
        ], doneLine: '"¿Puedo jugar también?" es una gran manera de preguntar.' },
      { kind: 'choice', say: 'Preguntaste "¿Puedo jugar también?" — ¿ahora qué haces?',
        npc: { face: '🦊', mood: MOOD('happy'), thought: { emoji: '❓' } },
        options: [
          opt('⏳', 'Esperar su respuesta', true),
          opt('🏃', 'Empezar a jugar de una vez sin esperar'),
        ], doneLine: 'Esperar la respuesta es amable y educado.' },
      { kind: 'choice', say: 'Zorro dice "¡Sí, ven a jugar!" ¿Qué haces?',
        npc: { face: '🦊', mood: MOOD('happy'), thought: { emoji: '✅' } },
        options: [
          opt('🎉', 'Unirte feliz', true),
          opt('🙅', 'Decir que no gracias'),
        ], doneLine: '¡Te uniste al juego. Muy bien preguntado!' },
    ],
  },
  {
    zone: 'deepforest', level: 2, goal: 'Cuando un amigo dice que no',
    intro: 'A veces un amigo dice que no, y eso también está bien. Vamos a aprender qué hacer.',
    outro: "Aprendiste que 'no' está bien, y siempre hay otro juego. Muy bien hecho.",
    moment: 'aprendió qué hacer cuando un amigo dice que no en el bosque profundo',
    rounds: [
      { kind: 'choice', say: 'Preguntas "¿Puedo jugar también?" y Oso dice "Ahora no." ¿Cómo te sientes primero?',
        npc: { face: '🐻', mood: MOOD('neutral'), thought: { emoji: '🙅' } },
        options: [
          opt('😞', 'Un poco decepcionado — y eso está bien', true),
          opt('😡', 'Tengo que gritar'),
        ], doneLine: 'Está bien sentirse un poco decepcionado. Ese sentimiento pasa.' },
      { kind: 'choice', say: 'Oso dijo ahora no. ¿Qué puedes hacer después?',
        npc: { face: '🐻', mood: MOOD('neutral') },
        options: [
          opt('🔍', 'Buscar otro juego para jugar', true),
          opt('😤', 'Meterte de todos modos'),
          opt('😭', 'Llorar fuerte frente a Oso'),
        ], doneLine: 'Buscar otro juego mantiene tu día divertido.' },
      { kind: 'choice', say: 'Tal vez más tarde todavía quieras jugar con Oso. ¿Qué puedes intentar?',
        npc: { face: '🐻', mood: MOOD('happy') },
        options: [
          opt('🙋', 'Preguntar de nuevo más tarde', true),
          opt('🙅', 'Nunca más preguntarle a Oso'),
        ], doneLine: 'Preguntar de nuevo más tarde es una gran idea. "Ahora no" no es "nunca."' },
    ],
  },
  {
    zone: 'deepforest', level: 3, goal: 'Perder un juego con buena actitud',
    intro: 'A veces no ganamos. Hay una manera amigable de perder un juego.',
    outro: '¡Perdiste un juego con corazón amigable. Eso te hace divertido para jugar!',
    moment: 'perdió un juego con buena actitud en el bosque profundo',
    rounds: [
      { kind: 'choice', say: 'Venado ganó la carrera y tú llegaste segundo. ¿Qué le dices a Venado?',
        npc: { face: '🦌', mood: MOOD('proud'), thought: { emoji: '🏁' } },
        options: [
          opt('👏', '¡Buen juego!', true),
          opt('😤', 'Eso no fue justo'),
          opt('🙄', 'Ni siquiera intenté'),
        ], doneLine: '"¡Buen juego!" muestra que puedes ser un amigo generoso.' },
      { kind: 'choice', say: 'Te sientes un poco decepcionado por no haber ganado. ¿Qué puedes hacer con ese sentimiento?',
        npc: { face: '🦌', mood: MOOD('neutral') },
        options: [
          opt('🌬️', 'Respirar hondo, está bien', true),
          opt('😡', 'Patear el suelo'),
        ], doneLine: 'Una respiración ayuda a que pase el sentimiento de decepción.' },
      { kind: 'choice', say: '¿Cuál es un buen siguiente paso después de perder un juego?',
        npc: { face: '🦌', mood: MOOD('happy') },
        options: [
          opt('🔁', 'Intentarlo de nuevo', true),
          opt('🚪', 'Nunca jugar otra vez'),
        ], doneLine: 'Intentarlo de nuevo es cómo mejoramos y nos divertimos más.' },
    ],
  },
  {
    zone: 'deepforest', level: 4, goal: 'No estar de acuerdo con amabilidad',
    intro: 'Los amigos no siempre quieren lo mismo. Vamos a aprender a no estar de acuerdo con amabilidad.',
    outro: '¡No estuviste de acuerdo con amabilidad y encontraste una respuesta justa. Eso es una gran habilidad de amistad!',
    moment: 'no estuvo de acuerdo con amabilidad en el bosque profundo',
    rounds: [
      { kind: 'choice', say: 'Tú y Conejita quieren el bloque rojo. ¿Qué puedes decir?',
        npc: { face: '🐰', mood: MOOD('neutral'), thought: { emoji: '🟥' } },
        options: [
          opt('💬', 'Yo quiero el rojo', true),
          opt('😤', 'Agarrarlo y correr'),
          opt('🤐', 'No decir nada y sentirte mal'),
        ], doneLine: 'Decir lo que quieres con claridad es un buen primer paso.' },
      { kind: 'choice', say: 'Conejita también quiere el bloque rojo. ¿Qué pueden intentar los dos?',
        npc: { face: '🐰', mood: MOOD('neutral') },
        options: [
          opt('🔄', '¿Podemos turnarnos?', true),
          opt('😡', 'Es mío, no hay turnos'),
        ], doneLine: '"¿Podemos turnarnos?" es una manera justa y amable de resolverlo.' },
      { kind: 'choice', say: 'Los dos aceptan turnarse. ¿Quién va primero se puede decidir con...?',
        npc: { face: '🐰', mood: MOOD('happy') },
        options: [
          opt('🪙', 'Una elección justa, como una moneda al aire', true),
          opt('😤', 'Quien lo agarre primero'),
        ], doneLine: 'Una elección justa mantiene todo amigable para todos.' },
    ],
  },
  {
    zone: 'deepforest', level: 5, goal: 'Dar y recibir cumplidos',
    intro: 'Las palabras amables sobre el trabajo de un amigo se llaman cumplidos. Vamos a practicar darlos y recibirlos.',
    outro: '¡Diste y recibiste cumplidos con tanta amabilidad. Así crecen las amistades!',
    moment: 'compartió cumplidos en el bosque profundo',
    rounds: [
      { kind: 'choice', say: 'Búho construyó una torre muy alta. ¿Qué cosa amable puedes decir?',
        npc: { face: '🦉', mood: MOOD('proud'), thought: { emoji: '🗼' } },
        options: [
          opt('👏', '¡Wow, qué torre tan buena!', true),
          opt('😐', 'Eso es aburrido'),
          opt('🤐', 'No decir nada'),
        ], doneLine: 'Un cumplido amable puede alegrarle todo el día a un amigo.' },
      { kind: 'choice', say: 'Venado dice "¡Me encanta tu dibujo!" ¿Qué le dices de vuelta?',
        npc: { face: '🦌', mood: MOOD('happy'), thought: { emoji: '🎨' } },
        options: [
          opt('😊', '¡Gracias!', true),
          opt('🙅', 'No está bueno'),
        ], doneLine: '"¡Gracias!" es la manera perfecta de recibir un cumplido.' },
      { kind: 'multiPick', say: 'Camina hacia dos cosas amables que podrías decir sobre el trabajo de un amigo.', picks: 2,
        npc: { face: '🦌', mood: MOOD('happy') },
        options: [
          opt('🌈', '¡Me encantan los colores!', true),
          opt('💪', '¡Trabajaste tan duro!', true),
          opt('😒', 'Podría estar mejor'),
          opt('🥱', 'Eso es aburrido'),
        ], doneLine: 'Esos son cumplidos maravillosos — a los amigos les encanta escucharlos.' },
    ],
  },
];

const DEEPFOREST = isEs() ? DEEPFOREST_EN.map((item, i) => DEEPFOREST_ES[i] ?? item) : DEEPFOREST_EN;

// ===========================================================================
// QUIET LAGOON 🪷 — Advanced Calm (sister island of cove)
// ===========================================================================

const LAGOON_EN: AdvancedQuest[] = [
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

const LAGOON_ES: AdvancedQuest[] = [
  {
    zone: 'lagoon', level: 1, goal: 'Notar señales tempranas del cuerpo',
    intro: 'Nuestro cuerpo manda pequeñas señales antes de que crezca un sentimiento grande. Vamos a aprender a notarlas temprano.',
    outro: '¡Notaste las señales tempranas en tu cuerpo. Eso es un superpoder para mantenerte tranquilo!',
    moment: 'notó señales tempranas del cuerpo en la laguna',
    rounds: [
      { kind: 'choice', say: 'Antes de que crezca un sentimiento grande, tus manos podrían sentirse...',
        npc: { face: '🐬', mood: MOOD('neutral'), thought: { emoji: '✊' } },
        options: [
          opt('✊', 'apretadas o tensas', true),
          opt('🖐️', 'sueltas y flojas'),
        ], doneLine: '¡Las manos apretadas pueden ser una señal temprana — buena observación!' },
      { kind: 'choice', say: 'Tu corazón podría empezar a sentirse...',
        npc: { face: '🐬', mood: MOOD('neutral'), thought: { emoji: '💓' } },
        options: [
          opt('💓', 'rápido, latiendo deprisa', true),
          opt('💤', 'somnoliento y lento'),
        ], doneLine: 'Un corazón rápido también puede ser una señal temprana.' },
      { kind: 'choice', say: 'Cuando notas una señal como manos apretadas o corazón rápido, ¿cuál es un buen primer paso?',
        npc: { face: '🐬', mood: MOOD('calm') },
        options: [
          opt('🌬️', 'Respirar con calma', true),
          opt('🙈', 'Ignorarlo y seguir'),
        ], doneLine: 'Notar temprano y respirar ayuda a que los sentimientos se mantengan pequeños y manejables.' },
    ],
  },
  {
    zone: 'lagoon', level: 2, goal: 'Una escalera de respiración más larga',
    intro: 'Vamos a subir las piedras de calma — cinco respiraciones, una piedra a la vez.',
    outro: '¡Subiste las cinco piedras de calma. Qué escalera de respiraciones tan tranquila!',
    moment: 'subió la escalera de respiración en la laguna',
    rounds: [
      { kind: 'steps', say: 'Sube las piedras de calma conmigo — una respiración lenta en cada piedra.',
        npc: { face: '🐬', mood: MOOD('calm') },
        count: 5,
        labels: ['Respira 1 🌊', 'Respira 2 🌊', 'Respira 3 🌊', 'Respira 4 🌊', 'Respira 5 🌊'],
        doneLine: 'Cinco respiraciones lentas, cinco piedras de calma — ahora te sientes en paz.' },
      { kind: 'breathe', say: 'Una respiración más juntos, solo porque se siente bien.',
        npc: { face: '🐬', mood: MOOD('calm') }, cycles: 2,
        doneLine: 'Tan tranquilo y en calma, como la laguna misma.' },
    ],
  },
  {
    zone: 'lagoon', level: 3, goal: 'Hacer un plan para lugares ruidosos',
    intro: 'Los lugares ruidosos pueden sentirse abrumadores. Vamos a separar las ideas que ayudan de las que no.',
    outro: '¡Armaste un plan inteligente para lugares ruidosos. Ya estás listo para cualquier lugar!',
    moment: 'hizo un plan para lugares ruidosos en la laguna',
    rounds: [
      { kind: 'sort', say: '¡Vamos a separar ideas para lugares ruidosos! Lleva cada una a útil o no útil.',
        npc: { face: '🐬', mood: MOOD('neutral'), thought: { emoji: '🔊' } },
        tables: [
          opt('✅', 'Útil'),
          opt('❌', 'No útil'),
        ],
        items: [
          { emoji: '🙉', caption: 'Taparte los oídos', table: 0 },
          { emoji: '🙋', caption: 'Pedir un rincón tranquilo', table: 0 },
          { emoji: '🌬️', caption: 'Respirar hondo', table: 0 },
          { emoji: '😡', caption: 'Gritar más fuerte', table: 1 },
          { emoji: '🏃', caption: 'Correr solo', table: 1 },
        ],
        doneLine: '¡Taparte los oídos, pedir tranquilidad, y respirar — eso sí ayuda!' },
      { kind: 'choice', say: 'Un cuarto ruidoso se siente abrumador ahora mismo. ¿Qué intentas primero?',
        npc: { face: '🐬', mood: MOOD('neutral'), thought: { emoji: '🔊' } },
        options: [
          opt('🙉', 'Taparme los oídos', true),
          opt('😡', 'Gritar más fuerte'),
        ], doneLine: 'Taparte los oídos es un gran primer plan.' },
    ],
  },
  {
    zone: 'lagoon', level: 4, goal: 'Esperar con calma',
    intro: 'Esperar puede sentirse largo. Vamos a practicar formas divertidas de esperar con calma.',
    outro: '¡Esperaste con tanta calma con tus propios juegos de espera. Qué paciencia tan maravillosa!',
    moment: 'practicó esperar con calma en la laguna',
    rounds: [
      { kind: 'multiPick', say: 'Camina hacia DOS juegos de espera que ayudan a que el tiempo pase con calma.', picks: 2,
        npc: { face: '🐬', mood: MOOD('calm'), thought: { emoji: '⏳' } },
        options: [
          opt('🔢', 'Contar despacio', true),
          opt('✊', 'Apretar mis manos', true),
          opt('😡', 'Gritar "¡apúrate!"'),
          opt('🏃', 'Correr por todos lados haciendo ruido'),
        ], doneLine: 'Contar y apretar las manos son grandes maneras de esperar con calma.' },
      { kind: 'steps', say: 'Vamos a contar despacio juntos mientras esperamos, un número a la vez.',
        npc: { face: '🐬', mood: MOOD('calm') },
        count: 5,
        doneLine: 'Uno, dos, tres, cuatro, cinco — se acabó la espera, ¡y te mantuviste tan tranquilo!' },
      { kind: 'choice', say: 'Mientras esperas, pensar en tu cosa favorita puede ayudar. ¿Cuál es una buena favorita para pensar?',
        npc: { face: '🐬', mood: MOOD('calm'), thought: { emoji: '💭' } },
        options: [
          opt('🌟', 'Mi cosa favorita', true),
          opt('😤', 'Qué lento va esto'),
        ], doneLine: 'Pensar en una cosa favorita hace que la espera se sienta más corta.' },
    ],
  },
  {
    zone: 'lagoon', level: 5, goal: 'Cuando los planes cambian',
    intro: 'A veces los planes cambian sin avisar. Vamos a practicar pensar en una idea nueva.',
    outro: '¡Encontraste un plan nuevo cuando el viejo cambió. Eso es pensamiento flexible — qué fuerte!',
    moment: 'manejó un plan que cambió en la laguna',
    rounds: [
      { kind: 'choice', say: 'El parque está cerrado hoy, y ese era el plan. ¿Cómo podrías sentirte primero?',
        npc: { face: '🐬', mood: MOOD('disappointed'), thought: { emoji: '🚫' } },
        options: [
          opt('😞', 'Un poco decepcionado — y eso está bien', true),
          opt('😡', 'Tengo que gritar por eso'),
        ], doneLine: 'Sentirte decepcionado cuando un plan cambia está bien.' },
      { kind: 'breathe', say: 'Vamos a respirar juntos para pasar la sorpresa.',
        npc: { face: '🐬', mood: MOOD('calm') }, cycles: 2,
        doneLine: 'Una respiración con calma abre espacio para una idea nueva.' },
      { kind: 'choice', say: 'El parque está cerrado. ¿Qué podemos hacer en su lugar?',
        npc: { face: '🐬', mood: MOOD('calm'), thought: { emoji: '❓' } },
        options: [
          opt('🏠', 'Pensar en algo divertido para hacer en casa', true),
          opt('😤', 'Quedarte molesto todo el día'),
        ], doneLine: 'Encontrar un plan nuevo convierte un momento difícil en uno bueno.' },
    ],
  },
];

const LAGOON = isEs() ? LAGOON_EN.map((item, i) => LAGOON_ES[i] ?? item) : LAGOON_EN;

// ===========================================================================
// TREASURE BAY ⛵ — Advanced Sharing & Cooperation (sister island of shore)
// ===========================================================================

const BAY_EN: AdvancedQuest[] = [
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

const BAY_ES: AdvancedQuest[] = [
  {
    zone: 'bay', level: 1, goal: 'Pedir prestado y devolver',
    intro: 'A veces le pedimos algo prestado a un amigo. Vamos a practicar pedirlo, y devolverlo.',
    outro: '¡Pediste prestado y devolviste con tanta amabilidad. Eso construye confianza entre amigos!',
    moment: 'practicó pedir prestado y devolver en la bahía',
    rounds: [
      { kind: 'choice', say: 'Perico tiene una pala que quieres usar. ¿Qué le dices?',
        npc: { face: '🦜', mood: MOOD('happy'), thought: { emoji: '🪏' } },
        options: [
          opt('🙋', '¿Me la prestas?', true),
          opt('🤚', 'Tomarla sin preguntar'),
        ], doneLine: '"¿Me la prestas?" es la manera amable de preguntar.' },
      { kind: 'choice', say: 'Ya terminaste de usar la pala. ¿Qué haces ahora?',
        npc: { face: '🦜', mood: MOOD('happy') },
        options: [
          opt('🔙', 'Devolverla y decir gracias', true),
          opt('🙅', 'Quedártela'),
        ], doneLine: '"Aquí la tienes de vuelta — ¡gracias!" Así funciona pedir prestado.' },
      { kind: 'choice', say: 'Perico dice "¡Gracias por traerla de vuelta!" ¿Cómo te sientes?',
        npc: { face: '🦜', mood: MOOD('happy') },
        options: [
          opt('😊', 'Feliz — fui un buen amigo', true),
          opt('😐', 'No importa'),
        ], doneLine: 'Que confíen en ti con cosas prestadas se siente muy bien.' },
    ],
  },
  {
    zone: 'bay', level: 2, goal: 'Intercambiar y llegar a un acuerdo',
    intro: 'A veces dos amigos quieren cosas diferentes. Un intercambio puede hacer felices a los dos.',
    outro: '¡Hiciste un intercambio justo. Llegar a un acuerdo hace que todos ganen!',
    moment: 'hizo un intercambio justo en la bahía',
    rounds: [
      { kind: 'choice', say: 'Tú tienes una concha azul, Tortuga tiene una rosada. A los dos les gusta la del otro. ¿Qué pueden intentar?',
        npc: { face: '🐢', mood: MOOD('neutral'), thought: { emoji: '🐚' } },
        options: [
          opt('🔄', 'Intercambiar las conchas', true),
          opt('🙅', 'Quedarte con la tuya y tomar la de ella también'),
        ], doneLine: '¡Un intercambio significa que los dos se quedan con algo que les gusta!' },
      { kind: 'choice', say: 'Los dos quieren elegir el juego primero. ¿Cuál es una manera justa de decidir?',
        npc: { face: '🦜', mood: MOOD('neutral') },
        options: [
          opt('🥇', 'Tú eliges primero esta vez, yo elijo la próxima', true),
          opt('😤', 'Yo siempre elijo primero'),
        ], doneLine: 'Turnarse para elegir es un acuerdo justo.' },
      { kind: 'choice', say: 'Salió justo para los dos. ¿Cómo se sienten ambos?',
        npc: { face: '🐢', mood: MOOD('happy') },
        options: [
          opt('😊', 'Felices, se sintió justo', true),
          opt('😤', 'Todavía molestos'),
        ], doneLine: 'Un intercambio justo deja a todos sintiéndose bien.' },
    ],
  },
  {
    zone: 'bay', level: 3, goal: 'Construir juntos',
    intro: 'Vamos a construir un castillo de arena juntos, una pieza a la vez — turnándonos para agregar.',
    outro: '¡Construyeron todo el castillo juntos, turno por turno. Se ve aún mejor hecho en equipo!',
    moment: 'construyó un castillo de arena junto a otro en la bahía',
    rounds: [
      { kind: 'choice', say: 'Un montón de arena, dos constructores. ¿Cómo deberían empezar?',
        npc: { face: '🦜', mood: MOOD('excited'), thought: { emoji: '🏰' } },
        options: [
          opt('🤝', 'Turnarse para agregar piezas', true),
          opt('🙅', 'Construir por separado sin turnos'),
        ], doneLine: 'Turnarse significa que el castillo se construye de verdad en equipo.' },
      { kind: 'carry', say: '¡Vamos a construirlo! Lleva cada pieza al castillo, un turno a la vez — tu pieza, mi pieza, tu pieza.',
        npc: { face: '🦜', mood: MOOD('happy') },
        items: [
          { emoji: '🧱', caption: 'mi pieza' },
          { emoji: '🐚', caption: 'la pieza de Perico' },
          { emoji: '🚩', caption: 'mi pieza' },
        ],
        doneLine: '¡Pieza por pieza, turno por turno — el castillo creció alto!' },
      { kind: 'choice', say: '¡El castillo está terminado! ¿Cómo te sientes por haberlo construido juntos?',
        npc: { face: '🦜', mood: MOOD('proud'), thought: { emoji: '🏰' } },
        options: [
          opt('🎉', '¡Orgulloso — lo construimos juntos!', true),
          opt('😤', 'Deseo haberlo construido solo'),
        ], doneLine: '"¡Lo construimos juntos!" — el mejor tipo de orgullo.' },
    ],
  },
  {
    zone: 'bay', level: 4, goal: 'Cuando solo hay uno',
    intro: 'Solo un bote, y dos amigos que quieren pasear. Vamos a encontrar maneras justas de compartirlo.',
    outro: '¡Encontraste maneras justas de compartir una sola cosa. Eso toma verdadero trabajo en equipo!',
    moment: 'compartió algo con justicia en la bahía',
    rounds: [
      { kind: 'choice', say: 'Solo hay un bote, y tanto tú como Tortuga quieren pasear. ¿Cuál es una idea justa?',
        npc: { face: '🐢', mood: MOOD('neutral'), thought: { emoji: '⛵' } },
        options: [
          opt('⏱️', 'Turnarse con un cronómetro', true),
          opt('😤', 'Quien llegue primero se lo queda'),
        ], doneLine: 'Un cronómetro hace que los turnos sean justos para todos.' },
      { kind: 'choice', say: 'El bote es suficientemente grande para dos. ¿Qué más podrían intentar?',
        npc: { face: '🐢', mood: MOOD('happy') },
        options: [
          opt('🤝', 'Pasear juntos', true),
          opt('🙅', 'Empujar a Tortuga fuera'),
        ], doneLine: '¡Pasear juntos significa que nadie tiene que esperar nada!' },
      { kind: 'choice', say: 'Si no pueden pasear juntos ni usar un cronómetro, ¿cuál es otra idea justa?',
        npc: { face: '🦜', mood: MOOD('neutral') },
        options: [
          opt('🎲', 'Elegir juntos, con algo justo', true),
          opt('😡', 'Discutir hasta que alguien se rinda'),
        ], doneLine: 'Elegir juntos, con justicia, mantiene a todos como amigos.' },
    ],
  },
  {
    zone: 'bay', level: 5, goal: 'Celebrar la victoria de un amigo',
    intro: 'Cuando un amigo gana o hace algo genial, podemos celebrar CON él.',
    outro: '¡Celebraste la victoria de un amigo con todo tu corazón. Eso es amistad de verdad!',
    moment: 'celebró la victoria de un amigo en la bahía',
    rounds: [
      { kind: 'choice', say: '¡Tortuga acaba de ganar la carrera de natación! ¿Qué puedes hacer?',
        npc: { face: '🐢', mood: MOOD('proud'), thought: { emoji: '🏆' } },
        options: [
          opt('👏', 'Aplaudir para Tortuga', true),
          opt('😤', 'Mirar hacia otro lado, molesto'),
        ], doneLine: 'Aplaudir por un amigo muestra que estás feliz por él.' },
      { kind: 'choice', say: '¿Qué palabras amables le puedes decir a Tortuga?',
        npc: { face: '🐢', mood: MOOD('proud') },
        options: [
          opt('🎉', '¡Felicidades, gran trabajo!', true),
          opt('😒', 'Solo tuviste suerte'),
        ], doneLine: '"¡Felicidades, gran trabajo!" hace que quien gana se sienta visto de verdad.' },
      { kind: 'choice', say: 'No ganaste esta vez, pero animaste a Tortuga. ¿Cómo se puede sentir eso?',
        npc: { face: '🦜', mood: MOOD('happy') },
        options: [
          opt('💖', 'Bien — estar feliz por otros también se siente bonito', true),
          opt('😡', 'Solo mal'),
        ], doneLine: 'Estar feliz por un amigo es su propio tipo de victoria.' },
    ],
  },
];

const BAY = isEs() ? BAY_EN.map((item, i) => BAY_ES[i] ?? item) : BAY_EN;

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
const ADVANCED_STICKERS_EN: Record<string, { emoji: string; label: string }> = {
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

const ADVANCED_STICKERS_ES: Record<string, { emoji: string; label: string }> = {
  'garden-1': { emoji: '🌦️', label: '¡Los sentimientos mezclados están bien! 🌦️' },
  'garden-2': { emoji: '🎭', label: '¡Una cara no siempre lo dice todo! 🎭' },
  'garden-3': { emoji: '🧠', label: '¡Puedo adivinar cómo se siente un amigo! 🧠' },
  'garden-4': { emoji: '🤗', label: '¡Sé cómo ayudar a un amigo triste! 🤗' },
  'garden-5': { emoji: '☁️', label: '¡Los sentimientos pasan, como las nubes! ☁️' },
  'deepforest-1': { emoji: '🙋', label: '¿Puedo jugar también? ¡Sé cómo preguntar! 🙋' },
  'deepforest-2': { emoji: '🔍', label: '¡Cuando un amigo dice que no, busco otro juego! 🔍' },
  'deepforest-3': { emoji: '👏', label: '¡Buen juego! ¡Puedo perder con una sonrisa! 👏' },
  'deepforest-4': { emoji: '🔄', label: '¿Podemos turnarnos? ¡No estoy de acuerdo con amabilidad! 🔄' },
  'deepforest-5': { emoji: '💛', label: '¡Doy y recibo cumplidos! 💛' },
  'lagoon-1': { emoji: '✊', label: '¡Noto temprano las manos apretadas y el corazón rápido! ✊' },
  'lagoon-2': { emoji: '🪨', label: '¡Cinco respiraciones de calma, cinco piedras de calma! 🪨' },
  'lagoon-3': { emoji: '🔊', label: '¡Tengo un plan para lugares ruidosos! 🔊' },
  'lagoon-4': { emoji: '⏳', label: '¡Puedo esperar con calma con mis propios juegos! ⏳' },
  'lagoon-5': { emoji: '🔀', label: '¡Cuando los planes cambian, pienso en algo nuevo! 🔀' },
  'bay-1': { emoji: '🔙', label: '¡Pido prestado con amabilidad y lo devuelvo! 🔙' },
  'bay-2': { emoji: '🔄', label: '¡Puedo intercambiar y llegar a un acuerdo! 🔄' },
  'bay-3': { emoji: '🏰', label: '¡Lo construimos juntos, turno por turno! 🏰' },
  'bay-4': { emoji: '⛵', label: '¡Cuando solo hay uno, lo compartimos con justicia! ⛵' },
  'bay-5': { emoji: '🎉', label: '¡Celebro la victoria de mi amigo! 🎉' },
};

export const ADVANCED_STICKERS = isEs()
  ? Object.fromEntries(Object.entries(ADVANCED_STICKERS_EN).map(([k, v]) => [k, ADVANCED_STICKERS_ES[k] ?? v]))
  : ADVANCED_STICKERS_EN;
