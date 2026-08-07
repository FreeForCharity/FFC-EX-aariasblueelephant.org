/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — ALL THE WORDS  (window.SBContent)

   ══════════════════════════════════════════════════════════════════════════
   COACHES — SCOTT, SAM, AJITH: THIS IS YOUR FILE.
   ══════════════════════════════════════════════════════════════════════════
   Every single thing the game says to a child lives in here and nowhere else.
   If a cue doesn't match how you actually teach it on Saturday, change it
   here — you don't need to touch any other file, and nothing will break.

   HOW TO EDIT
     · Each line looks like:   t('English words', 'Palabras en español')
     · Change the English AND the Spanish. Both are required — an English-only
       string is a repo violation (see CLAUDE.md).
     · Keep it SHORT. One instruction per line. These get read aloud.
     · Keep it LITERAL. No idioms. "Keep your eye on the ball" is confusing;
       "Look at the ball" is not.
     · Say what TO do, never what not to do. "Hold the bat with two hands"
       beats "Don't swing one-handed".
     · Never add a line that says a child did something wrong.

   The Coach Mode screen inside the game shows this whole script station by
   station, so you can read it on a phone at practice and check it against
   what you're actually saying.

   NOTE ON HANDEDNESS: where a cue depends on which hand a child throws with,
   write {glove} / {throw} / {front} / {back} and the game fills in the right
   word — "left" for a righty's glove hand, and the reverse for a lefty.

   SPANISH GENDER — this bites. Each token comes out in one gender, so it has
   to sit next to the right noun:
       {glove} {back}   feminine  →  use with "mano"   (mano izquierda)
       {throw} {front}  masculine →  use with "brazo" / "pie"  (brazo derecho)
   Writing "guante {glove}" gives "guante izquierda", which is wrong. Say
   "mano {glove}" instead.

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  /* t(english, spanish) — the only helper you need */
  const t = (en, es) => ({ en: en, es: es });

  const C = {};

  /* ══════════════════════════════════════════════════════════ 1. THE PEOPLE */

  /* WHO DOES WHAT
       Three coaches, no hierarchy — the child just needs to know who is where.
       Coach AJ has the bases, the line-up, the warm-up and the safety rules,
       and he is the one who comes over when a child raises their hand.
       Coach Scott has the throwing and fielding stations.
       Coach Sam has the pitching circle and the batting station. */
  C.coaches = [
    {
      id: 'aj', name: 'Coach AJ', role: 'coach', skills: ['run'],
      shirt: 0xd97706, cap: 0x9a5109, skin: 0xa9714b, hair: 0x1a1208,
      title: t('Bases & Warm-up', 'Bases y calentamiento'),
      greet: t('Hi! I\'m Coach AJ. If you don\'t know what to do, come and find me.',
               '¡Hola! Soy el Coach AJ. Si no sabes qué hacer, ven a buscarme.'),
    },
    {
      id: 'scott', name: 'Coach Scott', role: 'station', skills: ['throw', 'field'],
      shirt: 0x2f6fb5, cap: 0x1d4b7d, skin: 0xe8b98a, hair: 0x6b4a2f,
      title: t('Throwing & Fielding', 'Lanzar y fildear'),
      greet: t('Hi! I\'m Coach Scott. I help with throwing and catching.',
               '¡Hola! Soy el Coach Scott. Yo ayudo a lanzar y atrapar.'),
    },
    {
      id: 'sam', name: 'Coach Sam', role: 'station', skills: ['pitch', 'bat', 'box'],
      shirt: 0x3f9142, cap: 0x24632a, skin: 0x8d5a3b, hair: 0x2a1c12,
      title: t('Pitching & Batting', 'Pitcheo y bateo'),
      greet: t('Hey there! I\'m Coach Sam. We pitch and we hit.',
               '¡Qué tal! Soy el Coach Sam. Aquí lanzamos y bateamos.'),
    },
  ];

  /* Coach AJ's own lines. He opens practice and answers raised hands, but he
     is not "the boss" — keep these plain and about the child, never about him. */
  C.aj = {
    id: 'aj',
    welcome: t('Welcome to practice, {name}! I\'m Coach AJ.',
               '¡Bienvenido a la práctica, {name}! Soy el Coach AJ.'),
    whoIsWho: t('Coach Scott has throwing and fielding. Coach Sam has pitching and batting. I\'ve got the bases.',
                'El Coach Scott ve lanzar y fildear. El Coach Sam ve pitcheo y bateo. Yo veo las bases.'),
    sendTo: t('{name}, go to {coach} now.', '{name}, ve con {coach} ahora.'),
    safetyIntro: t('Before we play, we learn how to stay safe.',
                   'Antes de jugar, aprendemos a estar seguros.'),
    anyProblem: t('If anything hurts, or you feel worried, come and tell a coach. Any time.',
                  'Si algo te duele o te sientes preocupado, dile a un coach. Cuando sea.'),
    proud: t('You did great today, {name}.', 'Lo hiciste muy bien hoy, {name}.'),
  };

  /* ══════════════════════════════════════════════════ 1b. NILU'S VOICE
     Nilu tells this whole story. She is the child's buddy, not a coach — she
     never gives a softball instruction. She explains what is happening, walks
     ahead, cheers, and — this is the important part — she is the one who says
     "go ask Coach AJ" whenever the child needs a person, not a skill.
     Keep her warm, short, and always on the child's side. */

  C.nilu = {
    meet: t('Hi! I\'m Nilu. I come to every practice with you.',
            '¡Hola! Soy Nilu. Yo vengo contigo a cada práctica.'),
    stayWithYou: t('I\'ll stay right beside you the whole time.',
                   'Voy a estar a tu lado todo el tiempo.'),
    followMe: t('Follow me! I\'ll show you.', '¡Sígueme! Yo te enseño.'),
    thisWay: t('This way — over here. 🐘', 'Por aquí — ven. 🐘'),
    waiting: t('I\'ll wait for you. Take your time.', 'Te espero. Tómate tu tiempo.'),
    watchCoach: t('Watch {coach}. Then it\'s your turn.',
                  'Mira a {coach}. Después te toca a ti.'),
    yourTurn: t('Now it\'s your turn. You can do this.',
                'Ahora te toca a ti. Tú puedes.'),
    goodJob: t('You did it! I saw you. 💙', '¡Lo lograste! Yo te vi. 💙'),
    tryAgain: t('That\'s okay. We can try again — I\'m right here.',
                'Está bien. Podemos intentar otra vez — aquí estoy.'),
    proud: t('I\'m so proud of you, {name}.', 'Estoy muy orgullosa de ti, {name}.'),
    restIsOk: t('Resting is part of practice too.',
                'Descansar también es parte de la práctica.'),

    /* the single most useful thing Nilu teaches — who to ask, and how */
    whoToAsk: t('If you need anything, just ask Coach AJ.',
                'Si necesitas algo, pídeselo al Coach AJ.'),
    howToAsk: t('Raise your hand. Wait for Coach AJ to look at you. Then tell him.',
                'Levanta la mano. Espera a que el Coach AJ te mire. Y luego dile.'),
    askAnyTime: t('You can ask any time. Coach AJ always says yes.',
                  'Puedes pedirlo cuando quieras. El Coach AJ siempre dice que sí.'),
    tapToAsk: t('🙋 Tap this button when you need something.',
                '🙋 Toca este botón cuando necesites algo.'),
    braveAsking: t('Asking for what you need is a brave thing to do.',
                   'Pedir lo que necesitas es algo muy valiente.'),
  };

  /* ══════════════════════════════════════════ 1c. 🙋 ASKING FOR WHAT YOU NEED
     Tapping 🙋 always does the same four things, in the same order:
       raise your hand → Coach AJ looks → you say it → he says yes.
     Add or remove a need here and the button's menu changes to match. */

  C.needs = {
    title: t('What do you need?', '¿Qué necesitas?'),
    how: t('Raise your hand and Coach AJ will come.',
           'Levanta la mano y el Coach AJ va a venir.'),
    cancel: t('Nothing — I\'m okay 👍', 'Nada — estoy bien 👍'),
    handUp: t('You raised your hand. ✋', 'Levantaste la mano. ✋'),
    waiting: t('Coach AJ is looking… wait for him.', 'El Coach AJ te está viendo… espéralo.'),
    coming: t('Coach AJ is coming over.', 'El Coach AJ viene para acá.'),
    thanks: t('Thanks for telling me, {name}.', 'Gracias por avisarme, {name}.'),
    thanksNoName: t('Thanks for telling me.', 'Gracias por avisarme.'),
    sticker: t('You asked for what you needed', 'Pediste lo que necesitabas'),
    tally: t('You asked for what you needed {n} times. That is {n} wins.',
             'Pediste lo que necesitabas {n} veces. Eso son {n} logros.'),

    items: [
      {
        id: 'break', emoji: '🪑',
        label: t('A break', 'Un descanso'),
        say: t('I need a break, please.', 'Necesito un descanso, por favor.'),
        reply: t('Of course. Go sit on the bench. Take all the time you need.',
                 'Claro que sí. Ve a sentarte en la banca. Tómate el tiempo que necesites.'),
        nilu: t('Come on, I\'ll sit with you. 💙', 'Ven, me siento contigo. 💙'),
      },
      {
        id: 'water', emoji: '💧',
        label: t('Water', 'Agua'),
        say: t('Can I have water, please?', '¿Me puedes dar agua, por favor?'),
        reply: t('Good idea. The water is right by the dugout. Go and drink.',
                 'Buena idea. El agua está junto al dugout. Ve y toma.'),
        nilu: t('Drinking water helps you play better!', '¡Tomar agua te ayuda a jugar mejor!'),
        done: t('All done. Ready when you are.', 'Listo. Cuando tú quieras seguimos.'),
      },
      {
        id: 'bathroom', emoji: '🚻',
        label: t('The bathroom', 'El baño'),
        say: t('I need the bathroom, please.', 'Necesito ir al baño, por favor.'),
        reply: t('No problem. Let\'s go — I\'ll walk with you.',
                 'No hay problema. Vamos — yo te acompaño.'),
        nilu: t('Everybody needs the bathroom sometimes.',
                'Todos necesitamos ir al baño a veces.'),
        done: t('Welcome back! Nothing started without you.',
                '¡Bienvenido de vuelta! Nada empezó sin ti.'),
      },
      {
        id: 'grownup', emoji: '👨‍👩‍👧',
        label: t('To see my grown-up', 'Ver a mi adulto'),
        say: t('Can I see my grown-up?', '¿Puedo ver a mi adulto?'),
        reply: t('They are right there in the seats, watching you. Wave to them!',
                 'Están ahí en las gradas, viéndote. ¡Salúdalos!'),
        nilu: t('Look — they\'re waving back at you! 👋',
                '¡Mira — te están saludando! 👋'),
        done: t('They are staying right there the whole practice.',
                'Se van a quedar ahí toda la práctica.'),
      },
      {
        id: 'hurt', emoji: '🤕',
        label: t('I got hurt', 'Me lastimé'),
        say: t('I got hurt.', 'Me lastimé.'),
        reply: t('Thank you for telling me right away. Let me have a look. Do you want to rest?',
                 'Gracias por decírmelo enseguida. Déjame ver. ¿Quieres descansar?'),
        nilu: t('Always tell a coach when something hurts. Always.',
                'Siempre dile a un coach cuando algo te duela. Siempre.'),
        restBtn: t('🪑 I want to rest', '🪑 Quiero descansar'),
        goBtn: t('🥎 I\'m okay to play', '🥎 Estoy bien para jugar'),
      },
    ],
  };

  /* ══════════════════════════════════════════════════════ 1d. THE ROSTER
     The teammates who line up, stretch, model things first and field behind
     you. Four of these are cast at random every session, so practice never
     feels like the same four kids — and the child's OWN name is always taken
     out of the pool first, so nobody is ever standing next to themselves.

     `regular: true` = comes to practice most weeks, so they get cast more
     often. Add, remove or reorder freely; the game just reads the list. */
  C.roster = [
    { name: 'Dylan',   regular: true },
    { name: 'Aaria',   regular: true },
    { name: 'Sumeet',  regular: true },
    { name: 'Aayushi', regular: true },
    { name: 'Jacob',   regular: true },
    { name: 'Lillie',  regular: true },
    { name: 'Anish',   regular: true },
    { name: 'Zayne' },
    { name: 'Maria' },
    { name: 'Arhaan' },
    { name: 'Waris' },
    { name: 'Aaryahi' },
    { name: 'Nihira' },
    { name: 'Aaryav' },
    { name: 'Carmel' },
  ];

  /* how the four cast teammates look — jersey, cap, skin, hair, in order */
  C.mateLooks = [
    { shirt: 0xef6f9c, cap: 0xb44771, skin: 0xe8b98a, hair: 0x3b2410 },
    { shirt: 0x7c5cd6, cap: 0x4c3792, skin: 0x8d5a3b, hair: 0x14100a },
    { shirt: 0x18a4a0, cap: 0x0d6d6a, skin: 0xf0cba6, hair: 0x8a5a1e },
    { shirt: 0xe5484d, cap: 0x9d2b2f, skin: 0xa9714b, hair: 0x120c06 },
  ];

  /* ══════════════════════════════════════════════════════ 2. GETTING STARTED */

  C.start = {
    askName: t('What is your name?', '¿Cómo te llamas?'),
    namePlaceholder: t('Type your name', 'Escribe tu nombre'),
    nameSkip: t('Skip for now', 'Saltar por ahora'),
    nameOk: t('That\'s me! 🥎', '¡Ese soy yo! 🥎'),

    askHand: t('Which hand do you throw with?', '¿Con qué mano lanzas?'),
    askHandWhy: t('Nilu asks so your glove goes on the right hand.',
                  'Nilu pregunta para ponerte el guante en la mano correcta.'),
    handRight: t('This one', 'Esta'),
    handLeft: t('This one', 'Esta'),
    handUnsure: t('I\'m not sure yet', 'Todavía no sé'),
    handUnsureHelp: t('That\'s okay! Try a throw with each hand, then pick the one that felt good.',
                      '¡Está bien! Prueba un lanzamiento con cada mano y elige la que se sintió mejor.'),
    handSetRight: t('Great — your glove goes on your left hand. 🧤',
                    'Perfecto — tu guante va en la mano izquierda. 🧤'),
    handSetLeft: t('Great — your glove goes on your right hand. 🧤',
                   'Perfecto — tu guante va en la mano derecha. 🧤'),

    welcome: t('Welcome to practice, {name}! I\'m Nilu. I\'ll stay with you the whole time.',
               '¡Bienvenido a la práctica, {name}! Soy Nilu. Voy a estar contigo todo el tiempo.'),
    welcomeNoName: t('Welcome to practice! I\'m Nilu. I\'ll stay with you the whole time.',
                     '¡Bienvenido a la práctica! Soy Nilu. Voy a estar contigo todo el tiempo.'),
    firstHint: t('🕹️ Walk with the stick — or tap the grass to go there!',
                 '🕹️ Camina con la palanca — ¡o toca el pasto para ir ahí!'),
    breakHint: t('🙋 Need a break? Tap the Break button any time. Asking is always okay.',
                 '🙋 ¿Necesitas un descanso? Toca el botón Descanso cuando quieras. Siempre está bien pedirlo.'),
    followHint: t('💙 Follow Nilu — she shows you where to go.',
                  '💙 Sigue a Nilu — ella te enseña a dónde ir.'),
  };

  /* ══════════════════════════════════════════════════ 3. 🙋 ASKING FOR A BREAK
     The most important twelve lines in this file. A break is never a problem,
     never costs progress, and is celebrated the same way a good throw is. */

  C.breakTime = {
    lessonTitle: t('How to ask for a break', 'Cómo pedir un descanso'),
    lessonIntro: t('Sometimes practice feels like too much. That is okay. Here is what to do.',
                   'A veces la práctica se siente pesada. Está bien. Esto es lo que puedes hacer.'),
    steps: [
      t('1. Raise your hand up high. ✋', '1. Levanta la mano bien alto. ✋'),
      t('2. Wait for the coach to look at you.', '2. Espera a que el coach te mire.'),
      t('3. Say: "I need a break."', '3. Di: "Necesito un descanso."'),
      t('4. Walk to the bench and sit down.', '4. Camina a la banca y siéntate.'),
    ],
    watchFirst: t('Watch {name} do it first.', 'Mira cómo lo hace {name} primero.'),
    npcAsks: t('I need a break, please.', 'Necesito un descanso, por favor.'),
    npcCoachReply: t('Of course. Go sit down — I\'ll be right here.',
                     'Claro que sí. Ve a sentarte — aquí te espero.'),
    yourTurn: t('Now you try. Tap the 🙋 Break button.',
                'Ahora inténtalo tú. Toca el botón 🙋 Descanso.'),

    /* what happens every single time a child taps 🙋, in every level */
    handUp: t('You raised your hand. ✋', 'Levantaste la mano. ✋'),
    say: t('I need a break, please.', 'Necesito un descanso, por favor.'),
    coachComes: t('{coach} is coming over…', '{coach} viene para acá…'),
    coachReply: t('Thanks for asking, {name}. Take all the time you need. I\'ll be right here.',
                  'Gracias por avisarme, {name}. Tómate el tiempo que necesites. Aquí voy a estar.'),
    coachReplyNoName: t('Thanks for asking. Take all the time you need. I\'ll be right here.',
                        'Gracias por avisarme. Tómate el tiempo que necesites. Aquí voy a estar.'),
    walkToBench: t('Nilu walks with you to the bench. 💙', 'Nilu camina contigo hasta la banca. 💙'),
    resting: t('Resting is part of practice.', 'Descansar también es parte de la práctica.'),
    breathe: t('Breathe in… and out… 🫧', 'Inhala… y exhala… 🫧'),
    ready: t('🥎 I\'m ready', '🥎 Ya estoy listo'),
    stayLonger: t('💙 A little longer', '💙 Un ratito más'),
    back: t('Welcome back, {name}! Right where you left off.',
            '¡Bienvenido de vuelta, {name}! Justo donde lo dejaste.'),
    backNoName: t('Welcome back! Right where you left off.',
                  '¡Bienvenido de vuelta! Justo donde lo dejaste.'),
    sticker: t('Asked for a break — that\'s brave', 'Pediste un descanso — eso es ser valiente'),
    tally: t('You asked for a break {n} times. That is {n} wins.',
             'Pediste un descanso {n} veces. Eso son {n} logros.'),
  };

  /* ══════════════════════════════════════════════════ 4. LEVEL 1 — THE GEAR
     Walk up to the real object, then pick from three floating answers.
     `whatFor` is the function answer; the game builds the wrong choices from
     other items' `whatFor`, so keep each one distinct. */

  C.gear = [
    { id: 'ball', emoji: '🥎', at: 'bag', kind: 'thing', fnAsk: true,
      name: t('the ball', 'la pelota'),
      whatFor: t('Throw it and catch it', 'Lanzarla y atraparla'),
      note: t('A softball is bigger than a baseball, and it is not soft!',
              'Una pelota de softbol es más grande que una de béisbol, ¡y no es blanda!') },
    { id: 'glove', emoji: '🧤', at: 'bag', kind: 'thing', fnAsk: true,
      name: t('the glove', 'el guante'),
      whatFor: t('To catch the ball', 'Para atrapar la pelota'),
      note: t('The glove keeps your hand safe. It goes on your {glove} hand.',
              'El guante protege tu mano. Va en tu mano {glove}.') },
    { id: 'bat', emoji: '🏏', at: 'rack', kind: 'thing', fnAsk: true,
      name: t('the bat', 'el bate'),
      whatFor: t('To hit the ball', 'Para pegarle a la pelota'),
      note: t('Hold the bat with two hands. Carry it — never swing it near a friend.',
              'Agarra el bate con las dos manos. Cárgalo — nunca lo balancees cerca de un amigo.') },
    { id: 'helmet', emoji: '⛑️', at: 'rack', kind: 'thing', fnAsk: true,
      name: t('the helmet', 'el casco'),
      whatFor: t('Keeps your head safe', 'Protege tu cabeza'),
      note: t('Helmet on FIRST. Then you can pick up the bat.',
              'Primero el casco. Después puedes tomar el bate.') },
    { id: 'tee', emoji: '🔵', at: 'plate', kind: 'thing', fnAsk: true,
      name: t('the batting tee', 'el tee de bateo'),
      whatFor: t('Holds the ball still', 'Sostiene la pelota quieta'),
      note: t('The ball waits on the tee. It will not move until you hit it.',
              'La pelota espera en el tee. No se mueve hasta que le pegas.') },
    { id: 'plate', emoji: '🏠', at: 'plate', kind: 'place', fnAsk: true,
      name: t('home plate', 'el home'),
      whatFor: t('Where you bat and score', 'Donde bateas y anotas'),
      note: t('Home plate is where you start and where you finish.',
              'El home es donde empiezas y donde terminas.') },
    { id: 'first', emoji: '1️⃣', at: 'first', kind: 'place', fnAsk: true,
      name: t('first base', 'la primera base'),
      whatFor: t('The first base you run to', 'La primera base a la que corres'),
      note: t('Run straight THROUGH first base. You do not have to stop on it.',
              'Corre y PASA por encima de la primera base. No tienes que frenar en ella.') },
    { id: 'second', emoji: '2️⃣', at: 'second', kind: 'place',
      name: t('second base', 'la segunda base'),
      whatFor: t('The base in the middle', 'La base de en medio'),
      note: t('Second base is straight ahead from home plate.',
              'La segunda base está justo enfrente del home.') },
    { id: 'third', emoji: '3️⃣', at: 'third', kind: 'place',
      name: t('third base', 'la tercera base'),
      whatFor: t('The last base before home', 'La última base antes del home'),
      note: t('After third base, you run home and your team cheers!',
              'Después de la tercera, corres al home y ¡tu equipo grita!') },
    { id: 'circle', emoji: '⚪', at: 'circle', kind: 'place',
      name: t('the pitching circle', 'el círculo de lanzamiento'),
      whatFor: t('Where the pitcher stands', 'Donde se para el pitcher'),
      note: t('Only the pitcher stands here. Your feet touch the white rubber.',
              'Solo el pitcher se para aquí. Tus pies tocan la goma blanca.') },
    { id: 'dugout', emoji: '🪑', at: 'dugout', kind: 'place', fnAsk: true,
      name: t('the dugout', 'el dugout'),
      whatFor: t('Where the team sits', 'Donde se sienta el equipo'),
      note: t('The dugout is the safe place to sit. Bats and helmets live here.',
              'El dugout es el lugar seguro para sentarse. Aquí viven los bates y los cascos.') },
    { id: 'water', emoji: '💧', at: 'dugout', kind: 'thing', fnAsk: true,
      name: t('the water bottle', 'la botella de agua'),
      whatFor: t('For drinking water', 'Para tomar agua'),
      note: t('Ask for water any time. Being thirsty is a good reason to stop.',
              'Pide agua cuando quieras. Tener sed es una buena razón para parar.') },
    { id: 'mask', emoji: '😷', at: 'rack', kind: 'thing',
      name: t('the catcher\'s mask', 'la máscara del cátcher'),
      whatFor: t('Keeps the face safe', 'Protege la cara'),
      note: t('The catcher squats behind home plate and wears the mask.',
              'El cátcher se pone en cuclillas detrás del home y usa la máscara.') },
    { id: 'cleats', emoji: '👟', at: 'bag', kind: 'thing',
      name: t('the cleats', 'los tacos'),
      whatFor: t('Shoes that grip the grass', 'Zapatos que agarran el pasto'),
      note: t('Cleats grip the grass so you can run fast and stop safely.',
              'Los tacos se agarran del pasto para correr rápido y frenar seguro.') },
    { id: 'fence', emoji: '🚧', at: 'fence', kind: 'place',
      name: t('the outfield fence', 'la barda del jardín'),
      whatFor: t('The end of the field', 'Donde termina el campo'),
      note: t('If the ball goes over the fence, that is a home run!',
              'Si la pelota pasa la barda, ¡eso es un jonrón!') },
  ];

  /* the question wrappers — one shape, every single time */
  C.gearQ = {
    naming: t('Which one is {thing}?', '¿Cuál es {thing}?'),
    where: t('Where is {thing}?', '¿Dónde está {thing}?'),
    walkTo: t('Walk to {thing}.', 'Camina hasta {thing}.'),
    function: t('What do we use {thing} for?', '¿Para qué usamos {thing}?'),
    right: t('Yes! That is {thing}.', '¡Sí! Eso es {thing}.'),
    rightFn: t('That\'s right!', '¡Correcto!'),
    /* the gentle re-offer — never says "wrong" */
    softMiss: t('That one is {picked}. Let\'s look for {thing}.',
                'Ese es {picked}. Busquemos {thing}.'),
    softMissFn: t('Not that one. Let\'s try again.', 'Ese no. Probemos otra vez.'),
    glowHelp: t('Here it is — this one. 💙', 'Aquí está — este. 💙'),
    allDone: t('You know all the gear, {name}! Coach Scott is waiting at the throwing station.',
               '¡Ya conoces todo el equipo, {name}! El Coach Scott te espera en la estación de lanzar.'),
  };

  /* ═══════════════════════════════════════════════════════ 5. SAFETY RULES */

  C.safety = [
    { id: 'helmet-first', emoji: '⛑️',
      rule: t('Helmet on before you pick up a bat.', 'Casco puesto antes de tomar el bate.'),
      why: t('It keeps your head safe.', 'Protege tu cabeza.') },
    { id: 'bat-space', emoji: '↔️',
      rule: t('Look around before you swing. Nobody close.',
              'Mira alrededor antes de batear. Que no haya nadie cerca.'),
      why: t('A bat is heavy and moves fast.', 'El bate pesa y va muy rápido.') },
    { id: 'watch-ball', emoji: '👀',
      rule: t('Look at the ball when it is in the air.', 'Mira la pelota cuando está en el aire.'),
      why: t('Then you can catch it or move out of the way.',
             'Así puedes atraparla o quitarte del camino.') },
    { id: 'carry-bat', emoji: '🚶',
      rule: t('Walk with the bat. Hold it down low.', 'Camina con el bate. Llévalo abajo.'),
      why: t('So it stays away from your friends.', 'Así se mantiene lejos de tus amigos.') },
    { id: 'wait-turn', emoji: '🪑',
      rule: t('Wait in the dugout until the coach calls your name.',
              'Espera en el dugout hasta que el coach diga tu nombre.'),
      why: t('The dugout is the safe place to wait.', 'El dugout es el lugar seguro para esperar.') },
    { id: 'ask-break', emoji: '🙋',
      rule: t('Raise your hand and ask when you need a break.',
              'Levanta la mano y avisa cuando necesites un descanso.'),
      why: t('Coaches always say yes.', 'Los coaches siempre dicen que sí.') },
  ];

  C.safetyQ = {
    ask: t('When do we put the helmet on?', '¿Cuándo nos ponemos el casco?'),
    intro: t('Now the most important part: staying safe.',
             'Ahora lo más importante: estar seguros.'),
    done: t('You know the safety rules! That keeps everybody safe.',
            '¡Ya sabes las reglas de seguridad! Eso nos cuida a todos.'),
  };

  /* ══════════════════════════════════════════════ 6. THE SKILLS (LEVELS 2–6)
     Each drill is a list of steps. One step at a time, in this order.
     `do` is what the child hears; `show` is what the coach says while
     demonstrating. Reorder or reword freely — the game just walks the list. */

  C.drills = {

    /* ───────────────────────────────────────── LEVEL 2 · THROWING (Scott) */
    throw: {
      id: 'throw', coach: 'scott', emoji: '🤾',
      title: t('Throwing', 'Lanzar'),
      intro: t('We throw overhand — the ball goes up over your shoulder.',
               'Lanzamos por arriba — la pelota pasa por encima del hombro.'),
      steps: [
        { id: 'grip',
          show: t('Hold the ball with your fingers, not squeezed in your palm.',
                  'Agarra la pelota con los dedos, no apretada en la palma.'),
          do: t('Pick up the ball.', 'Toma la pelota.') },
        { id: 'point',
          show: t('Point your glove at me.', 'Apúntame con el guante.'),
          do: t('Point your {glove} hand at Coach Scott.',
                'Apunta tu mano {glove} hacia el Coach Scott.') },
        { id: 'step',
          show: t('Step forward with your {front} foot.', 'Da un paso con tu pie {front}.'),
          do: t('Step with your {front} foot.', 'Da un paso con tu pie {front}.') },
        { id: 'elbow',
          show: t('Elbow up, like a letter L.', 'Codo arriba, como una letra L.'),
          do: t('Bring your {throw} arm back. Elbow up.',
                'Lleva tu brazo {throw} hacia atrás. Codo arriba.') },
        { id: 'release',
          show: t('Throw to my glove.', 'Lanza hacia mi guante.'),
          do: t('Throw!', '¡Lanza!') },
        { id: 'follow',
          show: t('Reach out after the ball.', 'Estira el brazo después de soltar.'),
          do: t('Reach out. Nice.', 'Estira el brazo. Muy bien.') },
      ],
      praise: [
        t('That is a real throw, {name}!', '¡Ese es un lanzamiento de verdad, {name}!'),
        t('Elbow was up. That is the one.', 'El codo estaba arriba. Así es.'),
        t('You stepped and threw. Perfect.', 'Diste el paso y lanzaste. Perfecto.'),
        t('Coach Scott caught it! 🧤', '¡El Coach Scott la atrapó! 🧤'),
      ],
      again: t('One more?', '¿Otra vez?'),
      done: t('Nice throwing, {name}. Coach Sam is at the pitching circle.',
              'Buenos lanzamientos, {name}. El Coach Sam está en el círculo.'),
    },

    /* ───────────────────────────────────────── LEVEL 3 · PITCHING (Sam) */
    pitch: {
      id: 'pitch', coach: 'sam', emoji: '🌀',
      title: t('Pitching', 'Lanzar de pitcher'),
      intro: t('Pitching is different. The ball goes UNDER, not over. Your arm makes a big circle.',
               'El pitcheo es diferente. La pelota va por ABAJO, no por arriba. Tu brazo hace un círculo grande.'),
      steps: [
        { id: 'rubber',
          show: t('Both feet on the white rubber.', 'Los dos pies sobre la goma blanca.'),
          do: t('Stand on the rubber.', 'Párate en la goma.') },
        { id: 'ready',
          show: t('Ball in your glove. Look at the catcher.',
                  'Pelota en el guante. Mira al cátcher.'),
          do: t('Hold the ball in your glove.', 'Sostén la pelota en el guante.') },
        { id: 'back',
          show: t('Take the ball out and swing your arm back.',
                  'Saca la pelota y lleva el brazo hacia atrás.'),
          do: t('Arm back.', 'Brazo atrás.') },
        { id: 'circle',
          show: t('Big circle — up, around, and down past your leg.',
                  'Círculo grande — arriba, alrededor y abajo junto a tu pierna.'),
          do: t('Swipe the big circle. ➰', 'Dibuja el círculo grande. ➰') },
        { id: 'release',
          show: t('Let go when your hand is next to your hip.',
                  'Suelta cuando tu mano esté junto a tu cadera.'),
          do: t('Let go by your hip!', '¡Suelta junto a la cadera!') },
        { id: 'stepto',
          show: t('Step toward home plate.', 'Da un paso hacia el home.'),
          do: t('Step toward home.', 'Da un paso hacia el home.') },
      ],
      praise: [
        t('Underhand — that is a real pitch!', 'Por abajo — ¡ese es un pitcheo de verdad!'),
        t('Big smooth circle. Beautiful.', 'Círculo grande y suave. Precioso.'),
        t('Right over the plate! 🎯', '¡Justo por el home! 🎯'),
        t('You let go at the right time.', 'Soltaste en el momento correcto.'),
      ],
      again: t('One more pitch?', '¿Otro pitcheo?'),
      done: t('You are pitching, {name}! Coach Scott has the gloves ready.',
              '¡Ya estás pitcheando, {name}! El Coach Scott tiene los guantes listos.'),
    },

    /* ──────────────────────────────────────── LEVEL 4 · FIELDING (Ajith) */
    field: {
      id: 'field', coach: 'scott', emoji: '🧤',
      title: t('Fielding', 'Fildear'),
      intro: t('Fielding is catching a ball that comes to you on the ground.',
               'Fildear es atrapar una pelota que llega rodando.'),
      steps: [
        { id: 'ready',
          show: t('Feet apart. Knees bent. Glove down near the grass.',
                  'Pies separados. Rodillas dobladas. Guante abajo, cerca del pasto.'),
          do: t('Get ready. Glove down.', 'Ponte listo. Guante abajo.') },
        { id: 'watch',
          show: t('Look at the ball the whole way.', 'Mira la pelota todo el camino.'),
          do: t('Look at the ball.', 'Mira la pelota.') },
        { id: 'move',
          show: t('Move in front of the ball.', 'Muévete y ponte enfrente de la pelota.'),
          do: t('Walk in front of the ball!', '¡Ponte enfrente de la pelota!') },
        { id: 'scoop',
          show: t('Glove down, other hand on top.', 'Guante abajo, la otra mano encima.'),
          do: t('Two hands. Scoop it up.', 'Dos manos. Recógela.') },
        { id: 'stand',
          show: t('Stand up with the ball.', 'Levántate con la pelota.'),
          do: t('Stand up.', 'Levántate.') },
        { id: 'throwfirst',
          show: t('Now throw to first base.', 'Ahora lanza a la primera base.'),
          do: t('Throw to first!', '¡Lanza a primera!') },
      ],
      praise: [
        t('You got in front of it! That is the hard part.',
          '¡Te pusiste enfrente! Esa es la parte difícil.'),
        t('Two hands. Great fielding.', 'Dos manos. Excelente fildeo.'),
        t('Clean scoop, {name}!', '¡Recogida limpia, {name}!'),
        t('Out at first! 🎉', '¡Out en primera! 🎉'),
      ],
      again: t('Here comes another one!', '¡Ahí va otra!'),
      done: t('Great glove work. Coach Sam is at the plate — time to hit! Grab a helmet.',
              'Excelente trabajo con el guante. El Coach Sam te espera en el home — ¡hora de batear! Toma un casco.'),
    },

    /* ────────────────────────────────────────────── LEVEL 5 · BATTING */
    bat: {
      id: 'bat', coach: 'sam', emoji: '🏏',
      title: t('Batting', 'Batear'),
      intro: t('We start on the tee. The ball waits for you — it does not move.',
               'Empezamos con el tee. La pelota te espera — no se mueve.'),
      steps: [
        { id: 'helmet',
          show: t('Helmet first. Always.', 'Primero el casco. Siempre.'),
          do: t('Put your helmet on.', 'Ponte el casco.') },
        { id: 'pickbat',
          show: t('Pick up the bat with two hands.', 'Toma el bate con las dos manos.'),
          do: t('Pick up the bat.', 'Toma el bate.') },
        { id: 'grip',
          show: t('Hands together. {back} hand on the bottom.',
                  'Manos juntas. Mano {back} abajo.'),
          do: t('Hands together on the bat.', 'Manos juntas en el bate.') },
        { id: 'stance',
          show: t('Stand in the box. Feet apart. Side to the ball.',
                  'Párate en la caja. Pies separados. De lado a la pelota.'),
          do: t('Step into the batter\'s box.', 'Métete a la caja de bateo.') },
        { id: 'look',
          show: t('Look at the ball on the tee.', 'Mira la pelota en el tee.'),
          do: t('Look at the ball.', 'Mira la pelota.') },
        { id: 'swing',
          show: t('Swing level, all the way around.', 'Batea derecho, gira completo.'),
          do: t('Swing!', '¡Batea!') },
        { id: 'drop',
          show: t('Put the bat DOWN. Do not throw it.', 'Deja el bate ABAJO. No lo avientes.'),
          do: t('Put the bat down.', 'Deja el bate en el suelo.') },
        { id: 'run',
          show: t('Now run to first base!', '¡Ahora corre a primera base!'),
          do: t('Run to first!', '¡Corre a primera!') },
      ],
      praise: [
        t('You hit it, {name}!! 🥎', '¡¡Le pegaste, {name}!! 🥎'),
        t('Level swing. That is how it is done.', 'Batazo derecho. Así se hace.'),
        t('Bat down, then run. Perfect.', 'Bate abajo, luego corres. Perfecto.'),
        t('Look at it go! 🎉', '¡Mira cómo va! 🎉'),
      ],
      again: t('Want to hit another one?', '¿Quieres pegarle a otra?'),
      tossIntro: t('Now Coach Sam will toss it to you. Wait for it, then swing.',
                   'Ahora el Coach Sam te la va a lanzar. Espérala y batea.'),
      done: t('You are a hitter, {name}! Let\'s learn the bases.',
              '¡Ya eres bateador, {name}! Ahora aprendamos las bases.'),
    },

    /* ────────────────── LEVEL 5b · STEPPING IN AND OUT OF THE BOX */
    box: {
      id: 'box', coach: 'sam', emoji: '👣',
      title: t('Stepping in and out', 'Entrar y salir de la caja'),
      intro: t('Sometimes the coach says step out. Then you wait. Then you step back in.',
               'A veces el coach dice que salgas. Esperas. Y luego vuelves a entrar.'),
      steps: [
        { id: 'in1',
          show: t('Step IN the box.', 'ENTRA a la caja.'),
          do: t('Step into the box.', 'Métete a la caja.') },
        { id: 'out1',
          show: t('Step OUT. Both feet outside the line.',
                  'SAL. Los dos pies fuera de la línea.'),
          do: t('Step out of the box.', 'Sal de la caja.') },
        { id: 'wait',
          show: t('Wait here. Look at me.', 'Espera aquí. Mírame.'),
          do: t('Wait. Watch the coach.', 'Espera. Mira al coach.') },
        { id: 'in2',
          show: t('Okay — step back IN.', 'Muy bien — VUELVE a entrar.'),
          do: t('Step back in.', 'Vuelve a entrar.') },
      ],
      praise: [
        t('In and out, just like that.', 'Adentro y afuera, así mismo.'),
        t('You waited. That was the hard part!', '¡Esperaste! Esa era la parte difícil.'),
        t('You listened to the coach. 👂', 'Escuchaste al coach. 👂'),
      ],
      again: t('Let\'s do it one more time.', 'Hagámoslo una vez más.'),
      done: t('You know how to step in and out. That is a real batter.',
              'Ya sabes entrar y salir. Eso es ser un bateador de verdad.'),
    },

    /* ────────────────────────────────────── LEVEL 6 · RUNNING THE BASES */
    run: {
      id: 'run', coach: 'aj', emoji: '🏃',
      title: t('Running the bases', 'Correr las bases'),
      intro: t('The bases go in one order, every time: first, second, third, home.',
               'Las bases van en un solo orden, siempre: primera, segunda, tercera y home.'),
      steps: [
        { id: 'tofirst',
          show: t('Run straight through first base. Do not stop on it.',
                  'Corre y pasa por encima de primera. No frenes en ella.'),
          do: t('Run to first base!', '¡Corre a primera base!') },
        { id: 'look',
          show: t('Look at me. I will point where to go.',
                  'Mírame. Yo te voy a señalar a dónde ir.'),
          do: t('Look at Coach AJ.', 'Mira al Coach AJ.') },
        { id: 'tosecond',
          show: t('Go to second!', '¡Vete a segunda!'),
          do: t('Run to second base!', '¡Corre a segunda base!') },
        { id: 'tothird',
          show: t('Keep going — third base!', 'Sigue — ¡tercera base!'),
          do: t('Run to third base!', '¡Corre a tercera base!') },
        { id: 'home',
          show: t('Come home! Run!', '¡Ven al home! ¡Corre!'),
          do: t('Run home!', '¡Corre al home!') },
      ],
      praise: [
        t('You ran THROUGH the base. Exactly right.',
          'Pasaste POR ENCIMA de la base. Exactamente así.'),
        t('You looked at the coach first. 👀', 'Miraste al coach primero. 👀'),
        t('SAFE! 🎉', '¡QUIETO! 🎉'),
        t('You scored, {name}! The whole team is cheering!',
          '¡Anotaste, {name}! ¡Todo el equipo está gritando!'),
      ],
      again: t('Want to run them again?', '¿Quieres correrlas otra vez?'),
      stopHere: t('STOP on this base.', 'FRENA en esta base.'),
      done: t('You know all four bases, {name}. Now let\'s be a team.',
              'Ya conoces las cuatro bases, {name}. Ahora seamos un equipo.'),
    },
  };

  /* the words the game uses around every drill, same shape every time */
  C.drillUI = {
    watchCoach: t('Watch {coach} first.', 'Mira a {coach} primero.'),
    nowYou: t('Now you try.', 'Ahora inténtalo tú.'),
    stepOf: t('Step {n} of {total}', 'Paso {n} de {total}'),
    sayAgain: t('🔁 Say it again', '🔁 Repítelo'),
    tryAgain: t('Let\'s try that step again — no rush.',
                'Intentemos ese paso otra vez — sin prisa.'),
    goodTry: t('Good try! Coaches try lots of times too.',
               '¡Buen intento! Los coaches también intentan muchas veces.'),
    standHere: t('Stand on the footprints. 👣', 'Párate en las huellas. 👣'),
    bigButton: t('Tap the big button when you are ready.',
                 'Toca el botón grande cuando estés listo.'),
    mastered: t('⭐ {skill} — you did it!', '⭐ {skill} — ¡lo lograste!'),
  };

  /* ═══════════════════════════════════════════ 7. TEAM TIME (every level) */

  C.team = {
    whistle: t('🔔 LINE UP!', '🔔 ¡EN FILA!'),
    lineUpSay: t('Line up, everyone!', '¡Todos en fila!'),
    lineUpDo: t('Walk to the empty spot. 👣', 'Camina al lugar vacío. 👣'),
    lineUpDone: t('The whole team is lined up. Thank you, {name}!',
                  'Todo el equipo está en fila. ¡Gracias, {name}!'),
    lineUpWait: t('Take your time. Nobody starts without you.',
                  'Tómate tu tiempo. Nadie empieza sin ti.'),

    stretchIntro: t('Warm up first, so nothing hurts.',
                    'Primero calentamos, para que nada te duela.'),
    /* the short warm-up that follows EVERY line-up — Nilu does it with you */
    withNilu: t('Stretch with me! Copy what I do. 🐘',
                '¡Estírate conmigo! Copia lo que hago. 🐘'),
    warmDone: t('Nice stretching. Now we\'re ready.',
                'Qué bien te estiraste. Ahora sí estamos listos.'),
    stretches: [
      { id: 'arms', emoji: '🔄', do: t('Big arm circles.', 'Círculos grandes con los brazos.') },
      { id: 'toes', emoji: '🙇', do: t('Reach down to your toes.', 'Toca los dedos de tus pies.') },
      { id: 'jacks', emoji: '⭐', do: t('Five jumping jacks.', 'Cinco saltos de tijera.') },
      { id: 'twist', emoji: '↔️', do: t('Twist side to side.', 'Gira de un lado al otro.') },
      { id: 'lap', emoji: '🏃', do: t('One lap around the bases with the team.',
                                      'Una vuelta a las bases con el equipo.') },
    ],
    stretchDone: t('Warm and ready. 💪', 'Calientito y listo. 💪'),

    waterSay: t('Water break! Everybody drink.', '¡Descanso de agua! Todos tomen.'),
    eyesOnCoach: t('Eyes on the coach. 👀', 'Ojos en el coach. 👀'),
    dugoutWait: t('Wait in the dugout until your name is called.',
                  'Espera en el dugout hasta que digan tu nombre.'),
    cheer: t('GO TEAM! 💙', '¡VAMOS EQUIPO! 💙'),
  };

  /* ═══════════════════════════════════════════ 8. LEVEL 8 — GAME DAY */

  C.positions = [
    { id: 'p',  emoji: '🌀', name: t('pitcher', 'pitcher'),
      where: t('in the circle', 'en el círculo') },
    { id: 'c',  emoji: '😷', name: t('catcher', 'cátcher'),
      where: t('behind home plate', 'detrás del home') },
    { id: '1b', emoji: '1️⃣', name: t('first base', 'primera base'),
      where: t('next to first base', 'junto a la primera base') },
    { id: '2b', emoji: '2️⃣', name: t('second base', 'segunda base'),
      where: t('next to second base', 'junto a la segunda base') },
    { id: '3b', emoji: '3️⃣', name: t('third base', 'tercera base'),
      where: t('next to third base', 'junto a la tercera base') },
    { id: 'ss', emoji: '🔷', name: t('shortstop', 'shortstop'),
      where: t('between second and third', 'entre segunda y tercera') },
    { id: 'lf', emoji: '🌿', name: t('left field', 'jardín izquierdo'),
      where: t('out in the grass on the left', 'allá en el pasto, a la izquierda') },
    { id: 'cf', emoji: '🌳', name: t('center field', 'jardín central'),
      where: t('out in the grass in the middle', 'allá en el pasto, al centro') },
    { id: 'rf', emoji: '🍀', name: t('right field', 'jardín derecho'),
      where: t('out in the grass on the right', 'allá en el pasto, a la derecha') },
  ];

  C.gameDay = {
    intro: t('Today is game day, {name}. Your whole team is here.',
             'Hoy es día de juego, {name}. Todo tu equipo está aquí.'),
    posCall: t('{name}, you are playing {pos}. Go stand {where}.',
               '{name}, tú juegas {pos}. Ve y párate {where}.'),
    posGood: t('That\'s your spot. Ready position!', 'Ese es tu lugar. ¡Posición de listo!'),
    atBat: t('You\'re up to bat, {name}!', '¡Te toca batear, {name}!'),
    inField: t('Here comes a ball to you!', '¡Ahí va una pelota para ti!'),
    crowd: t('Everybody is cheering for you! 👏', '¡Todos están echándote porras! 👏'),
    medalTitle: t('Regionals Ready! 🥇', '¡Listo para los Regionales! 🥇'),
    medal: t('{name}, you learned every part of softball. Coach AJ, Coach Scott and Coach Sam are so proud of you.',
             '{name}, aprendiste todas las partes del softbol. El Coach Scott, el Coach Sam y el Coach AJ están muy orgullosos de ti.'),
    medalSub: t('Special Olympics Northern California · Aaria\'s Blue Elephant',
                'Special Olympics Northern California · Aaria\'s Blue Elephant'),
  };

  /* ═══════════════════════════════════════════ 9. LEVELS & SCHEDULE STRIP */

  C.levels = [
    { id: 'gear',  emoji: '🥎', name: t('Know Your Gear', 'Conoce tu equipo') },
    { id: 'throw', emoji: '🤾', name: t('Throwing', 'Lanzar') },
    { id: 'pitch', emoji: '🌀', name: t('Pitching', 'Pitcheo') },
    { id: 'field', emoji: '🧤', name: t('Fielding', 'Fildear') },
    { id: 'bat',   emoji: '🏏', name: t('Batting', 'Batear') },
    { id: 'run',   emoji: '🏃', name: t('Running Bases', 'Correr bases') },
    { id: 'team',  emoji: '👥', name: t('Team Time', 'Trabajo en equipo') },
    { id: 'game',  emoji: '🏆', name: t('Game Day', 'Día de juego') },
  ];

  C.ui = {
    scheduleTitle: t('Today\'s practice', 'La práctica de hoy'),
    now: t('now', 'ahora'),
    next: t('next', 'sigue'),
    locked: t('Not yet — finish the one before.', 'Todavía no — termina el anterior.'),
    comingSoon: t('Nilu is still setting this part up. Walk around and explore! 🐘',
                  'Nilu todavía está preparando esta parte. ¡Camina y explora! 🐘'),
    unlocked: t('🔓 {level} is open!', '🔓 ¡{level} está abierto!'),
    goTo: t('Walk to {coach}.', 'Camina hacia {coach}.'),
    yay: t('💙 Yay!', '💙 ¡Genial!'),
    ok: t('👍 Okay', '👍 Está bien'),
    stickerBook: t('My Stickers', 'Mis calcomanías'),
    zoomIn: t('Zoom in — get closer', 'Acercar — verlo de cerca'),
    zoomOut: t('Zoom out — see the field', 'Alejar — ver el campo'),
    backToNilu: t('Walk back to Nilu', 'Vuelve con Nilu'),
  };

  /* ═══════════════════════════════════════════ 10. COACH MODE (grown-ups) */

  C.coachMode = {
    title: t('Coach Mode', 'Modo Coach'),
    gate: t('Grown-ups only. What is {a} + {b}?', 'Solo para adultos. ¿Cuánto es {a} + {b}?'),
    gateWrong: t('Not quite — try again.', 'No es — inténtalo otra vez.'),
    player: t('Player', 'Jugador'),
    hand: t('Throws with', 'Lanza con'),
    handR: t('right hand', 'la mano derecha'),
    handL: t('left hand', 'la mano izquierda'),
    progress: t('Skills practiced', 'Habilidades practicadas'),
    reps: t('{n} reps', '{n} repeticiones'),
    notYet: t('not yet', 'todavía no'),
    selfAdvocacy: t('Self-advocacy', 'Pedir ayuda'),
    assist: t('Assist', 'Ayuda'),
    assistOn: t('ON — no timing needed (recommended)', 'SÍ — sin necesidad de tiempo (recomendado)'),
    assistOff: t('off — real timing', 'no — con tiempo real'),
    cueSheet: t('📋 Cue sheet — everything the game says',
                '📋 Guion — todo lo que dice el juego'),
    practiceCard: t('📤 Share today\'s practice card', '📤 Compartir la tarjeta de práctica'),
    resetHand: t('Change throwing hand', 'Cambiar la mano de lanzar'),
    close: t('✔️ Done', '✔️ Listo'),
    note: t('Nothing here leaves this device. No names, no scores, no accounts.',
            'Nada de esto sale de este aparato. Sin nombres, sin puntajes, sin cuentas.'),
  };

  C.t = t;
  window.SBContent = C;
})();
