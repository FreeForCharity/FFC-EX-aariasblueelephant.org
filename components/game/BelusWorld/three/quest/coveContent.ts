// ---------------------------------------------------------------------------
// Calm Cove content — "calm the storm" play.
//   The cove water starts stormy and choppy. As the child follows BreatheOrb's
//   breaths, the sea visibly settles each cycle — waves shrink, the colour
//   brightens from stormy grey-blue to bright cyan, and at the end fish leap and
//   a rainbow appears. No quiz feel: you literally calm the sea by breathing.
//
// The pedagogy mirrors quests.ts COVE exactly (same breath counts + the same
// pre-breath actions per level), only reshaped for the embodied "calm the storm"
// mechanic so integration stays trivial:
//   L1: 2 breaths.            L2: 3 breaths.
//   L3: body-scan — walk to a glowing body-spot totem, then breathe.
//   L4: pick ONE calm strategy totem, then 1 breath.
//   L5: build a calm plan — walk to 3 strategy totems in a row, then 1 breath.
// ---------------------------------------------------------------------------

import { isEs } from '../../../../../lib/lang';

/** A totem the child walks Nilu into (or taps) — a body spot or a calm strategy. */
export interface CoveTotem {
  emoji: string;
  label: string;
}

/** What the child must do BEFORE the breathing begins on a given level. */
export type CovePreStep =
  | { kind: 'none' }
  /** walk to ONE body spot to "send calm" there */
  | { kind: 'bodySpot'; totems: CoveTotem[] }
  /** walk to ONE calm strategy */
  | { kind: 'pickOne'; totems: CoveTotem[] }
  /** walk to `need` strategies in a row to build a plan */
  | { kind: 'plan'; need: number; totems: CoveTotem[] };

export interface CoveLevel {
  goal: string;
  intro: string;
  outro: string;
  moment: string;
  /** how many calm breath cycles settle the sea on this level */
  cycles: number;
  /** the action before breathing (drives the totems that appear) */
  pre: CovePreStep;
  /** the line Nilu says once the pre-step is done and breathing is about to start */
  breatheCue: string;
  /** how many hidden treasure shells are tucked around the cove this level */
  shells: number;
  /** what the dolphin buddy squeaks when it surfaces on the calm sea */
  dolphin: string;
  /** an optional "copy the pose" round the child walks to and holds, played
   *  after the pre-step (if any) and before breathing */
  pose?: CovePose;
  /** when true, the breathing round speaks a running count ("One! Two!…")
   *  on each breath-out instead of just the phase label */
  counting?: boolean;
  /** an optional five-senses grounding mini-round (2-3 tappable orbs walked to
   *  in sequence), played after the pre-step and before any pose/breathing */
  senses?: CoveSenseStep[];
}

/** A "copy the pose" round: Nilu's friend shows a pose, the child walks to the
 *  totem, and holds it through a slow spoken 3-2-1 count. */
export interface CovePose {
  emoji: string;
  name: string;
  /** spoken the moment the child arrives and the hold begins */
  cue: string;
}

const POSES_EN: Record<string, CovePose> = {
  crisscross: { emoji: '🧘', name: 'Criss-cross sit', cue: 'Sit crossed and tall, just like me.' },
  tree: { emoji: '🌳', name: 'Tree pose', cue: 'Stand tall like a tree — arms up like branches!' },
  butterfly: { emoji: '🦋', name: 'Butterfly wings', cue: 'Flap your arms slowly, like soft butterfly wings.' },
  star: { emoji: '⭐', name: 'Star pose', cue: 'Arms and legs wide, like a bright star!' },
  turtle: { emoji: '🐢', name: 'Turtle curl', cue: 'Curl up small and hug your knees.' },
};

const POSES_ES: Record<string, CovePose> = {
  crisscross: { emoji: '🧘', name: 'Sentado con piernas cruzadas', cue: 'Siéntate con las piernas cruzadas y la espalda recta, igual que yo.' },
  tree: { emoji: '🌳', name: 'Postura del árbol', cue: '¡Ponte de pie bien alto, como un árbol — brazos arriba como ramas!' },
  butterfly: { emoji: '🦋', name: 'Alas de mariposa', cue: 'Mueve tus brazos despacio, como suaves alas de mariposa.' },
  star: { emoji: '⭐', name: 'Postura de estrella', cue: '¡Brazos y piernas bien abiertos, como una estrella brillante!' },
  turtle: { emoji: '🐢', name: 'Tortuga enroscada', cue: 'Enróllate pequeñito y abraza tus rodillas.' },
};

export const POSES: Record<string, CovePose> = isEs()
  ? Object.fromEntries(Object.keys(POSES_EN).map((k) => [k, POSES_ES[k] ?? POSES_EN[k]]))
  : POSES_EN;

/** One step of the five-senses grounding round: "find something you can ___". */
export interface CoveSenseStep {
  senseEmoji: string;
  senseLabel: string; // 'SEE' | 'HEAR' | 'FEEL' …
  targetEmoji: string; // the thing to walk to / tap
  targetLabel: string;
}

/** Kind, gentle lines Nilu says as the child finds hidden shells (cycled). */
const SHELL_FINDS_EN: string[] = [
  'Ooh, a shiny shell! Hold it up to your ear — can you hear the sea? 🐚',
  'A sparkly treasure! You have good finding eyes. ✨',
  'Another one! The calm sea likes to leave us little gifts. 💙',
  'A starfish! Pop it in your treasure bag. ⭐',
  'You found one more! What a collector you are. 🌟',
];

const SHELL_FINDS_ES: string[] = [
  '¡Uy, una concha brillante! Ponla junto a tu oreja — ¿puedes oír el mar? 🐚',
  '¡Un tesoro brillante! Tienes buenos ojos para encontrar cosas. ✨',
  '¡Otra más! Al mar tranquilo le gusta dejarnos regalitos. 💙',
  '¡Una estrella de mar! Guárdala en tu bolsa de tesoros. ⭐',
  '¡Encontraste una más! Qué buen coleccionista eres. 🌟',
];

export const SHELL_FINDS: string[] = isEs()
  ? SHELL_FINDS_EN.map((item, i) => SHELL_FINDS_ES[i] ?? item)
  : SHELL_FINDS_EN;

/** Tiny gentle dolphin jokes for replay variety (chosen by a seed, never random). */
const DOLPHIN_JOKES_EN: string[] = [
  'The dolphin squeaks: "What did the sea say to the shore? Nothing — it just waved!" 🌊',
  'The dolphin giggles: "I love calm days. They are just my-sea-tea!" 🫧',
  'The dolphin grins: "You breathe better than a whale, and they have HUGE lungs!" 🐳',
];

const DOLPHIN_JOKES_ES: string[] = [
  'El delfín chilla: "¿Qué le dijo el mar a la orilla? ¡Nada — solo la saludó con una ola!" 🌊',
  'El delfín se ríe: "Me encantan los días tranquilos. ¡Son pura mar-avilla!" 🫧',
  'El delfín sonríe: "¡Respiras mejor que una ballena, y eso que tienen pulmones ENORMES!" 🐳',
];

export const DOLPHIN_JOKES: string[] = isEs()
  ? DOLPHIN_JOKES_EN.map((item, i) => DOLPHIN_JOKES_ES[i] ?? item)
  : DOLPHIN_JOKES_EN;

// Reused calm strategies (matches quests.ts CALM_STRATEGIES pedagogy).
const STRATEGIES_EN: CoveTotem[] = [
  { emoji: '🌬️', label: 'Deep breaths' },
  { emoji: '🤫', label: 'Quiet spot' },
  { emoji: '✊', label: 'Squeeze hands' },
  { emoji: '✋', label: 'Ask for a break' },
  { emoji: '🖐️', label: 'Count to five' },
  { emoji: '🤗', label: 'Get a big hug' },
];

const STRATEGIES_ES: CoveTotem[] = [
  { emoji: '🌬️', label: 'Respiraciones profundas' },
  { emoji: '🤫', label: 'Lugar tranquilo' },
  { emoji: '✊', label: 'Apretar las manos' },
  { emoji: '✋', label: 'Pedir un descanso' },
  { emoji: '🖐️', label: 'Contar hasta cinco' },
  { emoji: '🤗', label: 'Un abrazo grande' },
];

// Body spots for the level-3 body scan (matches quests.ts L3 options).
const BODY_SPOTS_EN: CoveTotem[] = [
  { emoji: '🫄', label: 'Tummy' },
  { emoji: '🫁', label: 'Chest' },
  { emoji: '💪', label: 'Shoulders' },
  { emoji: '🤲', label: 'Hands' },
];

const BODY_SPOTS_ES: CoveTotem[] = [
  { emoji: '🫄', label: 'Pancita' },
  { emoji: '🫁', label: 'Pecho' },
  { emoji: '💪', label: 'Hombros' },
  { emoji: '🤲', label: 'Manos' },
];

const COVE_LEVELS_EN: CoveLevel[] = [
  {
    goal: 'Calm the sea with 2 breaths',
    intro: "The cove is stormy today. Let's calm the sea together — follow the bubble and breathe with me.",
    outro: 'Look — the sea is calm and bright! Thank you for breathing with me. 🌈',
    moment: 'calmed the stormy sea at the cove',
    cycles: 2,
    pre: { kind: 'none' },
    breatheCue: 'Breathe in as the bubble grows, out as it shrinks. Watch the sea settle.',
    shells: 3,
    dolphin: 'Eee-eee! A dolphin pops up to say hello and do a happy flip! 🐬',
  },
  {
    goal: 'Calm the sea with 3 breaths',
    intro: "The storm is a little bigger now. We can do it — a longer calm together.",
    outro: 'The whole cove is sparkling cyan now. You calmed the sea! 🌈',
    moment: 'calmed the stormy sea at the cove',
    cycles: 3,
    pre: { kind: 'none' },
    breatheCue: "Let's count 3 butterfly breaths together — follow the bubble.",
    shells: 4,
    dolphin: 'Splash! The dolphin leaps for joy because YOU made the sea so calm. 🐬',
    pose: POSES_EN.tree,
    counting: true,
  },
  {
    goal: 'Send calm to your body, then breathe',
    intro: "Before we breathe, let's notice our body. Walk to a spot to send your calm to.",
    outro: 'Calm in your body, calm in the sea. Beautiful! 🌈',
    moment: 'did a calm body check at the cove',
    cycles: 2,
    pre: { kind: 'bodySpot', totems: BODY_SPOTS_EN },
    breatheCue: 'Now breathe with me, sending calm to that spot — and watch the sea settle.',
    shells: 4,
    dolphin: 'A dolphin surfaces and nods, as if to say "well done, calm friend." 🐬',
    pose: POSES_EN.butterfly,
  },
  {
    goal: 'Pick a calm strategy, then breathe',
    intro: "It feels loud and busy here. Walk to one thing that helps you feel calm.",
    outro: 'Great choice — that really helps. The sea is calm and bright. 🌈',
    moment: 'chose a calm strategy at the cove',
    cycles: 1,
    pre: { kind: 'pickOne', totems: STRATEGIES_EN.slice(0, 4) },
    breatheCue: 'Now one calm breath together — let the sea grow calm.',
    shells: 5,
    dolphin: 'The dolphin spins a happy loop above the bright, calm water! 🐬',
    senses: [
      { senseEmoji: '👀', senseLabel: 'SEE', targetEmoji: '🌸', targetLabel: 'the flower' },
      { senseEmoji: '👂', senseLabel: 'HEAR', targetEmoji: '🌊', targetLabel: 'the wave' },
      { senseEmoji: '🤲', senseLabel: 'FEEL', targetEmoji: '🌬️', targetLabel: 'the breeze' },
    ],
  },
  {
    goal: 'Build your calm plan, then breathe',
    intro: "Let's build YOUR calm plan. Walk to three things that help you most.",
    outro: 'A wonderful calm plan — and a calm, sparkling sea! 🌈',
    moment: 'built my own calm plan at the cove',
    cycles: 1,
    pre: { kind: 'plan', need: 3, totems: STRATEGIES_EN },
    breatheCue: 'A wonderful plan! One calm breath to finish — and the sea is calm.',
    shells: 5,
    dolphin: 'A whole family of dolphins leaps in a happy line — your calm plan worked! 🐬',
  },
];

const COVE_LEVELS_ES: CoveLevel[] = [
  {
    goal: 'Calma el mar con 2 respiraciones',
    intro: 'El mar está agitado hoy. Vamos a calmar el mar juntos — sigue la burbuja y respira conmigo.',
    outro: '¡Mira — el mar está calmado y brillante! Gracias por respirar conmigo. 🌈',
    moment: 'calmó el mar agitado de la cala',
    cycles: 2,
    pre: { kind: 'none' },
    breatheCue: 'Inhala mientras la burbuja crece, exhala mientras se encoge. Observa cómo se calma el mar.',
    shells: 3,
    dolphin: '¡Iii-iii! ¡Un delfín asoma para saludar y da una voltereta feliz! 🐬',
  },
  {
    goal: 'Calma el mar con 3 respiraciones',
    intro: 'La tormenta es un poco más grande ahora. Podemos lograrlo — una calma más larga juntos.',
    outro: '¡Toda la cala brilla de color cian ahora. Calmaste el mar! 🌈',
    moment: 'calmó el mar agitado de la cala',
    cycles: 3,
    pre: { kind: 'none' },
    breatheCue: 'Contemos 3 respiraciones de mariposa juntos — sigue la burbuja.',
    shells: 4,
    dolphin: '¡Splash! El delfín salta de alegría porque TÚ calmaste tanto el mar. 🐬',
    pose: POSES_ES.tree,
    counting: true,
  },
  {
    goal: 'Envía calma a tu cuerpo, luego respira',
    intro: 'Antes de respirar, notemos nuestro cuerpo. Camina hasta un lugar para enviarle tu calma.',
    outro: 'Calma en tu cuerpo, calma en el mar. ¡Hermoso! 🌈',
    moment: 'hizo un chequeo de calma corporal en la cala',
    cycles: 2,
    pre: { kind: 'bodySpot', totems: BODY_SPOTS_ES },
    breatheCue: 'Ahora respira conmigo, enviando calma a ese lugar — y observa cómo se calma el mar.',
    shells: 4,
    dolphin: 'Un delfín asoma y asiente, como diciendo "bien hecho, amigo tranquilo." 🐬',
    pose: POSES_ES.butterfly,
  },
  {
    goal: 'Elige una estrategia de calma, luego respira',
    intro: 'Se siente ruidoso y agitado aquí. Camina hasta algo que te ayude a sentirte tranquilo.',
    outro: 'Excelente elección — eso realmente ayuda. El mar está calmado y brillante. 🌈',
    moment: 'eligió una estrategia de calma en la cala',
    cycles: 1,
    pre: { kind: 'pickOne', totems: STRATEGIES_ES.slice(0, 4) },
    breatheCue: 'Ahora una respiración de calma juntos — deja que el mar se calme.',
    shells: 5,
    dolphin: '¡El delfín da una vuelta feliz sobre el agua brillante y calmada! 🐬',
    senses: [
      { senseEmoji: '👀', senseLabel: 'VER', targetEmoji: '🌸', targetLabel: 'la flor' },
      { senseEmoji: '👂', senseLabel: 'OÍR', targetEmoji: '🌊', targetLabel: 'la ola' },
      { senseEmoji: '🤲', senseLabel: 'SENTIR', targetEmoji: '🌬️', targetLabel: 'la brisa' },
    ],
  },
  {
    goal: 'Construye tu plan de calma, luego respira',
    intro: 'Vamos a construir TU plan de calma. Camina hasta tres cosas que más te ayuden.',
    outro: '¡Un plan de calma maravilloso — y un mar tranquilo y brillante! 🌈',
    moment: 'construyó su propio plan de calma en la cala',
    cycles: 1,
    pre: { kind: 'plan', need: 3, totems: STRATEGIES_ES },
    breatheCue: '¡Un plan maravilloso! Una respiración de calma para terminar — y el mar está tranquilo.',
    shells: 5,
    dolphin: '¡Toda una familia de delfines salta en una fila feliz — tu plan de calma funcionó! 🐬',
  },
];

export const COVE_LEVELS: CoveLevel[] = isEs()
  ? COVE_LEVELS_EN.map((lvl, i) => COVE_LEVELS_ES[i] ?? lvl)
  : COVE_LEVELS_EN;
