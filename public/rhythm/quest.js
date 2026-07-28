/* ============================================================================
   Nilu's Music Meadow — THE ADVENTURE  (quest.js · window.RQuest)   LAYER 3
   © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Built by Aaria and her Friends 💙

   Layer 1 (game.js) gave the meadow songs. Layer 2 (walk.js + world.js) let a
   child WALK it and bump into things. Layer 3 gives the walking a reason:
   five tiny kindnesses to do, and a journal that quietly shows what is still
   out there — the thing a child comes back for.

   WHAT THIS FILE OWNS
     · #rqChip     one objective at a time, in the left rail's last slot
     · #rqJournal  a full-screen sticker album of everything discoverable
     · #rqStamp    the "new stamp!" flourish (decorative, never tapped — and
                   held back while walk.js's #rwCard has the screen centre)
     · in-world:   ONE glowing beacon at the current target + 6 trail fireflies
                   (9 objects total; every geometry/material/texture reused)
   Styles live in adventure.css. Screen zones: see that file's zone map — this
   file touches nothing in top-centre, bottom-centre, right edge, bottom-left
   or bottom-right, which belong to siblings. Verified in a real browser at
   360 / 768 / 1440 px wide, in English and in Spanish: no horizontal scroll,
   the chip sits under #rCount / #rwFind / #rwHome / #kToast, and every tab,
   card and Done button clears 56px.

   NO-FAIL PROMISES (please keep these if you edit)
     · every quest is optional, order-free, and can be ignored forever
     · nothing can be missed and nothing can softlock: every step completes on
       ARRIVING somewhere, or on a generous dwell, or on the discovery landing
       through layer 2 — three independent routes to the same warm ending
     · no timers, no score, no failure, no red, no "wrong"
     · the guide is two drifting fireflies and one soft pulse, never a nag, and
       it stays silent during a song, during breathing and while paused

   INTEGRATION (the wiring step, not this file)
     <link rel="stylesheet" href="adventure.css">
     <script src="quest.js"></script>
     RQuest.init({ K, RWalk, RWorld, RPlaces, plantFlower, playNote,
                   THREE, scene });        // THREE/scene optional — see below
     onFrame:  RQuest.tick(dt)
     a kit action:  { emoji:'📔', label:'Journal', labelEs:'Diario',
                      onTap: () => RQuest.openJournal() }
     gate scene taps with:  if (RQuest.active) return;
   THREE/scene are optional: if they are not passed we find the scene through
   RWalk.avatar().parent, and if there is no scene at all the adventure still
   runs — the chip's warm/cold pip replaces the beacon.
   ========================================================================== */

(function () {
  "use strict";

  /* ==========================================================================
     1. THE QUEST TABLE
        Grown-ups: this is the bit to edit. Five small kindnesses. Keep them
        this short and this gentle. Every line is English + Spanish; an
        English-only string is a repo violation.

        step.to      where the objective points. Resolved at runtime against
                     the real world (world.js / places.js); the FALLBACK_AT
                     table below is only used if that lookup finds nothing.
        step.r       how close counts as "there" (metres)
        step.need    'reach' (default) · 'berries' · 'stones' · 'ramp'
        step.dwell   seconds standing at the target that ALSO complete the
                     step — the promise that nothing can ever get stuck
        step.find    a discovery kind that completes the step wherever the
                     child happens to be standing when layer 2 announces it

        q.stampSoft / q.finishSoft
                     Told instead of q.stamp / q.finish when the quest was
                     finished by the dwell kindness clause rather than by
                     really doing the thing. Same warmth, no untrue claim:
                     "you found the waterfall" instead of "you played all four
                     stepping-stones". Optional — leave them out where arriving
                     IS the whole job.
     ====================================================================== */

  var QUESTS = [

    /* 1 ─ the lost chime bar ─────────────────────────────────────────────── */
    {
      id: 'chime',
      emoji: '🔔',
      title:  { en: "Twee's lost chime",
                es: 'El carillón perdido de Twee' },
      teaser: { en: 'Twee dropped something shiny near the water.',
                es: 'A Twee se le cayó algo brillante cerca del agua.' },
      stamp:  { en: 'You carried the chime bar home. Now it sparkles!',
                es: 'Llevaste la barrita a casa. ¡Ahora brilla!' },
      finish: { en: 'Twee plays your chime bar. Listen — it sparkles!',
                es: 'Twee toca tu barrita. Escucha — ¡cómo brilla!' },
      reward: 'sparkle',
      steps: [
        { to: 'stream', r: 4.2, find: 'stream', dwell: 8,
          chip: { en: 'Find the lost chime bar by the stream',
                  es: 'Encuentra la barrita perdida junto al arroyo' },
          say:  { en: 'Twee lost a shiny chime bar down by the stream. Can you find it?',
                  es: 'A Twee se le perdió una barrita brillante junto al arroyo. ¿La puedes encontrar?' },
          done: { en: 'Ding! You found it. Hold it tight!',
                  es: '¡Din! La encontraste. ¡Agárrala fuerte!' } },
        { to: 'bird', r: 3.6, carry: '🔔',
          chip: { en: 'Carry the chime bar back to Twee',
                  es: 'Llévale la barrita de vuelta a Twee' },
          say:  { en: 'You have it! Now walk back to Twee the bird.',
                  es: '¡La tienes! Ahora regresa con Twee el pajarito.' } }
      ]
    },

    /* 2 ─ the shy fox cub ────────────────────────────────────────────────── */
    {
      id: 'fox',
      emoji: '🦊',
      title:  { en: 'The shy fox cub',
                es: 'El zorrito tímido' },
      teaser: { en: 'Someone orange is hiding on the hill.',
                es: 'Alguien naranja se esconde en la colina.' },
      stamp:  { en: 'Three berries made a friend. The fox cub plays with the band!',
                es: 'Tres moritas hicieron un amigo. ¡El zorrito toca con la banda!' },
      stampSoft: { en: 'You sat with the shy fox cub. Now he plays with the band!',
                   es: 'Te sentaste con el zorrito tímido. ¡Ahora toca con la banda!' },
      finish: { en: 'The fox cub is not shy any more. He wants to play with you!',
                es: 'El zorrito ya no es tímido. ¡Quiere tocar contigo!' },
      finishSoft: { en: 'You waited so gently that the fox cub came out. He wants to play with you!',
                    es: 'Esperaste con tanta calma que el zorrito salió. ¡Quiere tocar contigo!' },
      reward: 'band',
      steps: [
        { to: 'berry', r: 7, need: 'berries', n: 3, dwell: 9, find: null,
          chip: { en: 'Berries {have}/{n} · pick them in the Berry Hollow',
                  es: 'Moritas {have}/{n} · recógelas en la Cañada de las Moritas' },
          say:  { en: 'The fox cub loves berries. Walk into the berry bushes to pick three!',
                  es: 'Al zorrito le encantan las moritas. ¡Métete en los arbustos y recoge tres!' },
          done: { en: 'Three sweet berries! The fox cub will love these.',
                  es: '¡Tres moritas dulces! Al zorrito le van a encantar.' } },
        { to: 'fox', r: 4, find: 'fox', dwell: 8, carry: '🫐', take: 3,
          chip: { en: 'Give the berries to the fox cub on the hill',
                  es: 'Dale las moritas al zorrito de la colina' },
          say:  { en: 'Now take them up the hill. Walk slowly — he is a little shy.',
                  es: 'Ahora llévaselas a la colina. Camina despacito — es un poco tímido.' } }
      ]
    },

    /* 3 ─ the singing waterfall ──────────────────────────────────────────── */
    {
      id: 'water',
      emoji: '💧',
      title:  { en: 'The waterfall that sings',
                es: 'La cascada que canta' },
      teaser: { en: 'Somewhere north-west, water falls and hums.',
                es: 'Hacia el noroeste, cae agua y tararea.' },
      stamp:  { en: 'You played all four stepping-stones. The waterfall sang along!',
                es: 'Tocaste las cuatro piedras. ¡La cascada cantó contigo!' },
      stampSoft: { en: 'You found the Waterfall Grotto, all the way out past the trees!',
                   es: '¡Encontraste la Gruta de la Cascada, allá lejos pasando los árboles!' },
      finish: { en: 'Listen! The whole waterfall is singing your song.',
                es: '¡Escucha! Toda la cascada está cantando tu canción.' },
      finishSoft: { en: 'You found the waterfall! Hop on the four flat stones — every one of them sings.',
                    es: '¡Encontraste la cascada! Salta en las cuatro piedras planas — todas cantan.' },
      reward: 'water',
      steps: [
        { to: 'grotto', r: 7, need: 'stones', n: 4, dwell: 10, find: null,
          chip: { en: 'Stones {have}/{n} · hop on the singing stones',
                  es: 'Piedras {have}/{n} · salta en las piedras que cantan' },
          say:  { en: 'Follow the lanterns north-west. Four flat stones are waiting, and every one sings.',
                  es: 'Sigue los farolitos hacia el noroeste. Te esperan cuatro piedras planas, y cada una canta.' } }
      ]
    },

    /* 4 ─ the fireflies going home ───────────────────────────────────────── */
    {
      id: 'flies',
      emoji: '✨',
      title:  { en: 'Fireflies going home',
                es: 'Luciérnagas que vuelven a casa' },
      teaser: { en: 'Some little lights are far from the meadow.',
                es: 'Unas lucecitas están lejos del prado.' },
      stamp:  { en: 'You walked the fireflies home. The meadow is full of little lights!',
                es: 'Llevaste las luciérnagas a casa. ¡El prado está lleno de lucecitas!' },
      finish: { en: 'Look behind you — every firefly followed you home!',
                es: 'Mira atrás — ¡todas las luciérnagas te siguieron a casa!' },
      reward: 'sparkle',
      steps: [
        { to: 'star', r: 8, find: 'star',
          chip: { en: 'Visit the Star Clearing where the sky is biggest',
                  es: 'Visita el Claro de las Estrellas, donde el cielo es más grande' },
          say:  { en: 'The fireflies are waiting where the sky is biggest, out to the north-east.',
                  es: 'Las luciérnagas esperan donde el cielo es más grande, hacia el noreste.' },
          done: { en: 'They woke up! Now they want to follow you.',
                  es: '¡Se despertaron! Ahora quieren seguirte.' } },
        { to: 'band', r: 9, carry: '✨',
          chip: { en: 'Walk home to Nilu — the fireflies will follow you',
                  es: 'Vuelve con Nilu — las luciérnagas te seguirán' },
          say:  { en: 'Walk home slowly and they will come with you.',
                  es: 'Vuelve despacito y ellas irán contigo.' } }
      ]
    },

    /* 5 ─ the treehouse concert ──────────────────────────────────────────── */
    {
      id: 'tree',
      emoji: '🌳',
      title:  { en: 'The treehouse concert',
                es: 'El concierto en la casa del árbol' },
      teaser: { en: 'A ramp winds up a very big tree.',
                es: 'Una rampa sube por un árbol muy grande.' },
      stamp:  { en: 'You lit every ramp lantern and the whole meadow played for you!',
                es: '¡Encendiste todos los faroles de la rampa y todo el prado tocó para ti!' },
      stampSoft: { en: "You found Nilu's treehouse and the whole meadow played for you!",
                   es: '¡Encontraste la casa del árbol de Nilu y todo el prado tocó para ti!' },
      finish: { en: 'Every lantern is lit and the big tree is glowing. Everybody, play!',
                es: 'Todos los faroles encendidos y el árbol grande brillando. ¡Todos a tocar!' },
      finishSoft: { en: 'You found the big blossom tree! Walk round and round the trunk to light its lanterns.',
                    es: '¡Encontraste el árbol grande de flores! Da vueltas al tronco para encender sus faroles.' },
      reward: 'chord',
      /* The gate is the six ramp lanterns, not height: RWalk.pose() is x/z
         only, so 'high' could never be true and the old find:'treehouse'
         handed the stamp over the moment the child arrived on the grass. */
      steps: [
        { to: 'treehouse', r: 7, need: 'ramp', n: 6, dwell: 7,
          chip: { en: 'Lanterns {have}/{n} · walk round and round up the ramp',
                  es: 'Faroles {have}/{n} · sube dando vueltas por la rampa' },
          say:  { en: 'There is a big tree to the south-east with a ramp that goes round and round. Go up!',
                  es: 'Hay un árbol grandote al sureste con una rampa que da vueltas y vueltas. ¡Súbete!' } }
      ]
    }
  ];

  /* Where an objective points when the real world has not told us. Only ever
     used as a last resort — see resolveTarget(). */
  var FALLBACK_AT = {
    stream:    { x:  -9,  z:   9,  r: 4.5 },
    fox:       { x: -13,  z:  -9,  r: 4.5 },
    berry:     { x: -36,  z:  34,  r: 8 },
    grotto:    { x: -38,  z: -34,  r: 8 },
    star:      { x:  40,  z: -36,  r: 9 },
    treehouse: { x:  36,  z:  36,  r: 8 },
    band:      { x:   0,  z:  -1,  r: 9 }
  };
  /* the four musicians, exactly where index.html seats them */
  var ANIMALS = {
    bear:  { x: -5.2, z: -1.644, i: 0 },
    bunny: { x: -1.9, z: -0.918, i: 1 },
    frog:  { x:  1.9, z: -0.918, i: 2 },
    bird:  { x:  5.2, z: -1.644, i: 3 }
  };

  /* ==========================================================================
     2. THE JOURNAL
        Real ids come from world.js and places.js at runtime. These tables are
        the safety net (and the source of every hint sentence), so the album is
        never empty and never English-only.
     ====================================================================== */

  /* id fragments → a "kind", used for hints, emoji and quest targeting */
  var KINDS = [
    [/step|hop.?stone|stone.?\d/i,               'stepstone'],
    [/grot|waterfall|water.?fall|cascad|fall/i,  'grotto'],
    /* NOT a bare /hollow/: world.js's "The Hollow Log" would swallow it nine
       rows before the 'log' rule, and every berry objective in the meadow
       would point at a log in the middle of the grass. */
    [/berr|mora|baya|berry.?hollow/i,            'berry'],
    [/star|estrell|clearing|claro/i,             'star'],
    [/tree.?house|platform|casa.?arbol|arbol/i,  'treehouse'],
    [/sign|post|letrero|arrow/i,                 'signpost'],
    [/swing|columpio/i,                          'swing'],
    [/stage|escenario|tarima/i,                  'stage'],
    [/lantern|farol|path|sendero/i,              'lantern'],
    [/hill|colina|knoll|loma/i,                  'hill'],
    [/bridge|puente|plank/i,                     'bridge'],
    [/stream|brook|creek|river|arroy/i,          'stream'],
    [/log|tronco|hollowlog/i,                    'log'],
    [/mush|shroom|hongo|seta/i,                  'mushroom'],
    [/lily|pad|nenuf|nenúf/i,                    'lily'],
    [/circle|stones|piedra|rock|roca/i,          'stones'],
    [/note|sparkle|chispa|nota|music/i,          'note'],
    [/fox|zorr/i,                                'fox'],
    [/hedge|eriz/i,                              'friend'],
    [/turtle|tortug/i,                           'friend'],
    [/owl|buho|búho/i,                           'friend'],
    [/deer|ciervo|venad|squirrel|ardilla|snail|caracol|mouse|rat[oó]n|duck|pato/i, 'friend'],
    [/friend|shy|amig|t[ií]mid/i,                'friend'],
    [/pond|estanque|water|agua/i,                'pond'],
    [/flower|flor|bloom/i,                       'flower']
  ];
  function kindOf(s) {
    s = String(s || '');
    for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0].test(s)) return KINDS[i][1];
    return 'thing';
  }

  /* the tiny "go and look" sentence on a LOCKED card */
  var HINT = {
    stepstone: { en: 'Flat stones you can hop on. Each one sings!',
                 es: 'Piedras planas para saltar. ¡Cada una canta!' },
    grotto:    { en: 'Cold water falls from a tall grey rock.',
                 es: 'Cae agua fría de una roca gris muy alta.' },
    berry:     { en: 'Little purple sweets grow on a bush.',
                 es: 'Hay dulcecitos morados en un arbusto.' },
    star:      { en: 'A wide dark place where the sky is biggest.',
                 es: 'Un lugar ancho y oscuro donde el cielo es más grande.' },
    treehouse: { en: 'A ramp goes round and round, up a big tree.',
                 es: 'Una rampa sube dando vueltas por un árbol grandote.' },
    signpost:  { en: 'Wooden arrows point four ways.',
                 es: 'Unas flechas de madera señalan cuatro caminos.' },
    lantern:   { en: 'Little lights in a line. Follow them!',
                 es: 'Lucecitas en fila. ¡Síguelas!' },
    swing:     { en: 'It sways all by itself under a big tree.',
                 es: 'Se mece solito bajo un árbol grande.' },
    stage:     { en: 'Warm lantern light, waiting for somebody to stand in it.',
                 es: 'Luz calientita de farolitos, esperando a alguien.' },
    hill:      { en: 'The green bump you can stand on top of.',
                 es: 'La lomita verde a la que te puedes subir.' },
    bridge:    { en: 'Little wooden planks over the water.',
                 es: 'Unas tablitas de madera sobre el agua.' },
    stream:    { en: 'Water that sings while it runs along.',
                 es: 'Agua que canta mientras corre.' },
    log:       { en: 'A tree lying down, with a hole to walk through.',
                 es: 'Un árbol acostado, con un hueco para pasar.' },
    mushroom:  { en: 'Red hats standing in a circle on the grass.',
                 es: 'Sombreritos rojos en círculo sobre el pasto.' },
    lily:      { en: 'Green plates floating on the pond.',
                 es: 'Platitos verdes flotando en el estanque.' },
    stones:    { en: 'Big grey stones standing in a ring.',
                 es: 'Piedras grises grandes paradas en círculo.' },
    note:      { en: 'A tiny sparkle hiding somewhere quiet.',
                 es: 'Una chispita escondida en un lugar tranquilo.' },
    fox:       { en: 'A shy orange friend up on the hill.',
                 es: 'Un amiguito naranja y tímido en la colina.' },
    friend:    { en: 'A shy friend waiting to say hello.',
                 es: 'Un amiguito tímido esperando saludarte.' },
    pond:      { en: 'Cool blue water in the middle of it all.',
                 es: 'Agua azul y fresquita en medio de todo.' },
    flower:    { en: 'Something your music made grow.',
                 es: 'Algo que hizo crecer tu música.' },
    thing:     { en: 'Something lovely is out there. Go and see!',
                 es: 'Algo lindo te espera allá. ¡Ve a verlo!' }
  };

  /* the warm line on a FOUND card */
  var LINE = {
    stepstone: { en: 'Hop, hop — every stone has its own note.',
                 es: 'Salta, salta — cada piedra tiene su nota.' },
    grotto:    { en: 'The water sings when you step on the stones.',
                 es: 'El agua canta cuando pisas las piedras.' },
    berry:     { en: 'Walk into a bush to pick a berry.',
                 es: 'Métete en un arbusto para recoger una morita.' },
    star:      { en: 'Come back here when the stars come out.',
                 es: 'Vuelve aquí cuando salgan las estrellas.' },
    treehouse: { en: 'The whole meadow looks tiny from up there!',
                 es: '¡Desde allá arriba el prado se ve chiquito!' },
    signpost:  { en: 'Four arrows, four adventures.',
                 es: 'Cuatro flechas, cuatro aventuras.' },
    lantern:   { en: 'They light the way there and back.',
                 es: 'Alumbran el camino de ida y de vuelta.' },
    swing:     { en: 'Swish, swish, all on its own.',
                 es: 'Suish, suish, se mece solito.' },
    stage:     { en: 'Stand in the light and the band plays for you.',
                 es: 'Párate en la luz y la banda toca para ti.' },
    hill:      { en: 'The best place to see everything.',
                 es: 'El mejor lugar para verlo todo.' },
    bridge:    { en: 'Clip clop, clip clop, over you go.',
                 es: 'Clop clop, clop clop, y ya pasaste.' },
    stream:    { en: 'Cool water and happy toes.',
                 es: 'Agua fresquita y deditos felices.' },
    log:       { en: 'Cosy and dark and just your size.',
                 es: 'Acogedor, oscuro y de tu tamaño.' },
    mushroom:  { en: 'Stand in the middle and make a wish.',
                 es: 'Párate en el medio y pide un deseo.' },
    lily:      { en: 'Hop, hop, hop across the water.',
                 es: 'Salta, salta, salta sobre el agua.' },
    stones:    { en: 'Old quiet stones that like music.',
                 es: 'Piedras viejitas y calladas a las que les gusta la música.' },
    note:      { en: 'One more sparkle for your song.',
                 es: 'Una chispita más para tu canción.' },
    fox:       { en: 'Not shy any more — he likes you!',
                 es: 'Ya no es tímido — ¡le caes bien!' },
    friend:    { en: 'A new friend for the meadow.',
                 es: 'Un amiguito nuevo para el prado.' },
    pond:      { en: 'It breathes in and out with you.',
                 es: 'Respira contigo, adentro y afuera.' },
    flower:    { en: 'Your music grew this one.',
                 es: 'Tu música hizo crecer esta.' },
    thing:     { en: 'You found it! 💙',
                 es: '¡Lo encontraste! 💙' }
  };

  /* safety-net cards, used only where the real world gives us nothing */
  var NOTE_EM = ['🎵', '🎶', '💫', '✨', '🎼', '🌟', '🔮', '🪄'];
  function fallbackMeadow() {
    var a = [
      { id: 'hill',        emoji: '⛰️', en: 'The little hill',    es: 'La lomita' },
      { id: 'stream',      emoji: '💦', en: 'The singing stream', es: 'El arroyo cantarín' },
      { id: 'bridge',      emoji: '🌉', en: 'The tiny bridge',    es: 'El puentecito' },
      { id: 'log',         emoji: '🪵', en: 'The hollow log',     es: 'El tronco hueco' },
      { id: 'mushrooms',   emoji: '🍄', en: 'The mushroom ring',  es: 'El círculo de hongos' },
      { id: 'lilypads',    emoji: '🪷', en: 'The lily pads',      es: 'Los nenúfares' },
      { id: 'stonecircle', emoji: '🪨', en: 'The stone circle',   es: 'El círculo de piedras' }
    ];
    for (var i = 0; i < 8; i++) {
      a.push({ id: 'note' + (i + 1), emoji: NOTE_EM[i],
               en: 'Sparkle note ' + (i + 1), es: 'Chispita ' + (i + 1) });
    }
    a.push({ id: 'friend-fox',    emoji: '🦊', en: 'The fox cub',     es: 'El zorrito' });
    a.push({ id: 'friend-hedge',  emoji: '🦔', en: 'The hedgehog',    es: 'El erizo' });
    a.push({ id: 'friend-turtle', emoji: '🐢', en: 'The turtle',      es: 'La tortuga' });
    a.push({ id: 'friend-owl',    emoji: '🦉', en: 'The sleepy owl',  es: 'El búho dormilón' });
    return a;
  }
  function fallbackFar() {
    return [
      { id: 'grotto',    emoji: '💧', en: 'The waterfall grotto', es: 'La gruta de la cascada',    x: -38, z: -34 },
      { id: 'berry',     emoji: '🫐', en: 'The Berry Hollow',     es: 'La Cañada de las Moritas',  x: -36, z:  34 },
      { id: 'star',      emoji: '✨', en: 'The Star Clearing',    es: 'El Claro de las Estrellas', x:  40, z: -36 },
      { id: 'treehouse', emoji: '🌳', en: 'The treehouse',        es: 'La casa del árbol',         x:  36, z:  36 },
      { id: 'signpost',  emoji: '🪧', en: 'The signpost',         es: 'El letrero',                x:  12, z:  22 }
    ];
  }

  /* every other user-facing string in the file */
  var UI = {
    journal:   { en: 'Adventure Journal',       es: 'Diario de aventuras' },
    sub:       { en: 'Tap a page to hear about it',
                 es: 'Toca una página para saber de ella' },
    subPick:   { en: 'Tap a quest to make it your next adventure',
                 es: 'Toca una misión para que sea tu próxima aventura' },
    done:      { en: '💙 Done',                 es: '💙 ¡Listo!' },
    closeAria: { en: 'Close the journal',       es: 'Cerrar el diario' },
    putAway:   { en: 'Put this away for now',   es: 'Guardar esto por ahora' },
    open:      { en: 'Journal',                 es: 'Diario' },
    openAria:  { en: 'Open the adventure journal',
                 es: 'Abrir el diario de aventuras' },
    tabAll:    { en: '✨ All',        es: '✨ Todo' },
    tabMeadow: { en: '🌼 Meadow',     es: '🌼 El prado' },
    tabFar:    { en: '🗺️ Far away',   es: '🗺️ A lo lejos' },
    tabQuest:  { en: '📜 Quests',     es: '📜 Misiones' },
    secMeadow: { en: '🌼 In the meadow',        es: '🌼 En el prado' },
    secFar:    { en: '🗺️ Out past the trees',   es: '🗺️ Más allá de los árboles' },
    secQuest:  { en: '📜 Little adventures',    es: '📜 Aventuras pequeñitas' },
    unknown:   { en: '? ? ?',                   es: '? ? ?' },
    newStamp:  { en: 'A new stamp!',            es: '¡Un sello nuevo!' },
    notYet:    { en: 'Not stamped yet — tap to try it!',
                 es: 'Sin sello todavía — ¡toca para intentarlo!' },
    pipFar:    { en: 'far away',    es: 'está lejos' },
    pipMid:    { en: 'getting closer',  es: 'ya casi' },
    pipNear:   { en: 'right here!', es: '¡aquí mismo!' },
    allFound:  { en: 'You found EVERYTHING in the meadow! 🏆',
                 es: '¡Encontraste TODO en el prado! 🏆' },
    allQuests: { en: 'All five little adventures are done. Nilu is so proud of you! 🌟',
                 es: 'Las cinco aventuras están listas. ¡Nilu está muy orgullosa de ti! 🌟' },
    chosen:    { en: 'New adventure! Look at the top-left corner.',
                 es: '¡Aventura nueva! Mira arriba a la izquierda.' },
    hintSaid:  { en: 'Let me show you which way…',
                 es: 'Te muestro por dónde…' },
    stillOut:  { en: 'still out there',  es: 'todavía por encontrar' },
    firstOpen: { en: 'This is your journal. Grey pages are things you have not found yet — go and look!',
                 es: 'Este es tu diario. Las páginas grises son cosas que aún no encuentras — ¡ve a buscarlas!' }
  };

  /* ==========================================================================
     3. little helpers
     ====================================================================== */
  var K = window.ABEKit || null;
  var host = null, inited = false;

  function T(o) {
    if (!o) return '';
    if (typeof o === 'string') return o;
    try { return K && K.tr ? K.tr(o.en, o.es) : o.en; } catch (e) { return o.en; }
  }
  function fmt(s, have, n) {
    return String(s).replace('{have}', have).replace('{n}', n);
  }
  function safe(fn) {
    return function () { try { return fn.apply(null, arguments); } catch (e) {
      try { console.warn('[RQuest]', e); } catch (_) {} return false; } };
  }
  var save = function (k, v) { try { K && K.save && K.save(k, v); } catch (e) {} };
  var load = function (k, d) { try { return K && K.load ? K.load(k, d) : d; } catch (e) { return d; } };
  var lessMotion = function () {
    try { return typeof K.reduceMotion === 'function' ? !!K.reduceMotion() : !!K.reduceMotion; }
    catch (e) { return false; }
  };
  var calm     = function () { try { return !!(K.calm && K.calm()); } catch (e) { return false; } };
  /* kit speed is a DURATION multiplier (relaxed 1.5 · normal 1 · fast 0.6) */
  var speedMul = function () {
    var s = 1;
    try { s = Number(K.speed ? K.speed() : 1); } catch (e) {}
    return (s >= 0.4 && s <= 3) ? s : 1;
  };
  var paused   = function () { try { return !!K.paused; } catch (e) { return false; } };
  var replaying= function () { try { return !!K.replaying; } catch (e) { return false; } };
  var songOn   = function () { try { return !!(window.RGame && window.RGame.active); } catch (e) { return false; } };
  var breathOn = function () { try { return !!(window.RM && window.RM.G && window.RM.G.breathing); } catch (e) { return false; } };
  function sfx(n) { try { K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} }
  function say(s) { try { if (s && K.say) K.say(s); } catch (e) {} }
  function note(i, v) { try { host && host.playNote && host.playNote(i, v); } catch (e) {} }
  function flower(i) { try { host && host.plantFlower && host.plantFlower(i); } catch (e) {} }
  function mk(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  /* ==========================================================================
     4. state
     ====================================================================== */
  var CARDS = [];              // every journal card, meadow + far + quests
  var FOUND = {};              // ids this file has seen discovered
  var DONE  = {};              // finished quest ids
  var SOFT  = {};              // quest ids finished by the dwell kindness clause
  var STAGE = {};              // quest id -> which step we are on
  var DWELL = {};              // quest id -> seconds spent at the current target
  var activeId = null;         // the one quest showing on the chip
  var autoPick = true;         // false once the child dismisses an objective
  var learned = 0;             // safety-net cards invented at runtime

  var clock = 0, idleT = 0, guideCd = 20, guides = 0, trailT = 0, chipPulseT = 0;
  var netId = null, netT = 0, evalT = 0, evalAcc = 0, chipT = 0, harvestT = 0, harvested = false;
  var berriesSeen = 0, stonesSeen = 0;   // counted from events, if places.js sends any
  var journalOpen = false, tab = 'all', firstOpenDone = false, freshId = null;
  var stampTimer = 0, hintTarget = null, sceneT = 0;

  /* DOM */
  var elChip = null, chipEmoji = null, chipText = null, chipDot = null, chipX = null;
  var elJour = null, elBook = null, elTitle = null, elSub = null, elCount = null,
      elRing = null, elRingTxt = null, elTabs = null, elGrid = null, elClose = null;
  var elStamp = null, stEmoji = null, stName = null, stLine = null;
  var lastChipKey = '', pendingStamp = null;

  /* three.js — all optional */
  var TH = null, SC = null, beacon = null, bGlow = null, bBeam = null, bEmoji = null;
  var trail = [], glowTex = null, texCache = {}, sceneTries = 0;

  /* ==========================================================================
     5. discoveries — read the REAL ids from the siblings, never a copy
     ====================================================================== */

  /* pull a list out of whatever shape a sibling module exposes */
  function pull(mod) {
    if (!mod) return null;
    /* discoveries() first, on purpose: places.js's list() gives short ids
       ('grotto') while the ids it actually registers as finds are prefixed
       ('place.grotto'). Getting this order wrong would leave every far card
       locked forever. */
    var names = ['discoveries', 'list', 'cards', 'items', 'things', 'spots', 'places'];
    for (var i = 0; i < names.length; i++) {
      try {
        var v = mod[names[i]];
        if (typeof v === 'function') v = v.call(mod);
        if (v && v.length) return v;
      } catch (e) {}
    }
    var props = ['LIST', 'DISCOVERIES', 'ITEMS', 'PLACES'];
    for (var j = 0; j < props.length; j++) {
      try { if (mod[props[j]] && mod[props[j]].length) return mod[props[j]]; } catch (e) {}
    }
    return null;
  }

  /* Siblings describe themselves in two different shapes and both are fine:
       world.js   { id, emoji, x, z, r, en: [title, line], es: [title, line] }
       places.js  { id, emoji, x, z, name:{en,es}, hint:{en,es}, card:{en,es} }
     pair() reads either, plus a plain string, and always answers {en, es}. */
  function pair(v, es, idx) {
    if (!v) return null;
    if (typeof v === 'string') return { en: v, es: es || v };
    if (v.length !== undefined && typeof v[idx || 0] === 'string') {
      return { en: v[idx || 0], es: (es && es[idx || 0]) || v[idx || 0] };
    }
    if (typeof v === 'object' && (v.en || v.es)) return { en: v.en || v.es, es: v.es || v.en };
    return null;
  }
  function pickName(e) {
    return pair(e.name, e.nameEs, 0) || pair(e.title, e.titleEs, 0) ||
           pair(e.label, e.labelEs, 0) || pair(e.en, e.es, 0);
  }

  function toCard(e, zone) {
    if (!e || !e.id) return null;
    var id = String(e.id);
    var nm = pickName(e) || { en: id.replace(/[-_.]/g, ' '), es: id.replace(/[-_.]/g, ' ') };
    var kind = kindOf(id + ' ' + nm.en);
    var hint = pair(e.hint, e.hintEs, 0) || HINT[kind] || HINT.thing;
    /* the warm "you found it" sentence: places.js calls it card, world.js
       tucks it into the second slot of its en/es pair */
    var line = pair(e.card, e.cardEs, 0) || pair(e.line, e.lineEs, 0) ||
               pair(e.en, e.es, 1) || LINE[kind] || LINE.thing;
    var c = {
      id: id, zone: zone, kind: kind, emoji: e.emoji || emojiFor(kind),
      name: nm, hint: hint, line: line, real: true
    };
    if (typeof e.x === 'number' && typeof e.z === 'number') { c.x = e.x; c.z = e.z; }
    if (typeof e.r === 'number') c.r = e.r;
    /* an EARNED card (places.js's "you played all four stones") carries the
       coordinates of the place it belongs to, purely so the fireflies know
       which way to point. Standing there must never award it — see safetyNet. */
    if (e.earned === true) c.earned = true;
    if (e.found === true) FOUND[id] = 1;      /* the sibling already knows */
    return c;
  }

  var KIND_EM = {
    stepstone: '🪨', grotto: '💧', berry: '🫐', star: '✨', treehouse: '🌳',
    signpost: '🪧', lantern: '🏮', hill: '⛰️', bridge: '🌉', stream: '💦',
    log: '🪵', mushroom: '🍄', lily: '🪷', stones: '🪨', note: '🎵',
    fox: '🦊', friend: '🐾', pond: '💧', flower: '🌸', thing: '✨'
  };
  function emojiFor(kind) { return KIND_EM[kind] || '✨'; }

  /* build (or rebuild) the whole card table from whatever exists right now */
  function harvest() {
    var meadow = [], far = [], i, c, raw;

    raw = pull((host && host.RWorld) || window.RWorld);
    var realMeadow = !!(raw && raw.length);
    if (raw) for (i = 0; i < raw.length; i++) { c = toCard(raw[i], 'meadow'); if (c) meadow.push(c); }

    raw = pull((host && host.RPlaces) || window.RPlaces);
    var realFar = !!(raw && raw.length);
    if (raw) for (i = 0; i < raw.length; i++) { c = toCard(raw[i], 'far'); if (c) far.push(c); }

    if (meadow.length || far.length) harvested = true;

    /* the fallback tables spell their names out in both languages, so build
       them straight rather than through toCard's guessing */
    function build(src, zone) {
      var out = [];
      for (var k = 0; k < src.length; k++) {
        var e = src[k], kind = kindOf(e.id + ' ' + e.en);
        var card = {
          id: e.id, zone: zone, kind: kind, emoji: e.emoji || emojiFor(kind),
          name: { en: e.en, es: e.es || e.en },
          hint: HINT[kind] || HINT.thing, line: LINE[kind] || LINE.thing,
          real: false                       /* guessed coords: no safety net */
        };
        if (typeof e.x === 'number') { card.x = e.x; card.z = e.z; }
        out.push(card);
      }
      return out;
    }
    if (!realMeadow) meadow = build(fallbackMeadow(), 'meadow');
    if (!realFar)    far    = build(fallbackFar(), 'far');

    /* quest stamps are cards too */
    var quests = [];
    for (i = 0; i < QUESTS.length; i++) {
      var q = QUESTS[i];
      quests.push({
        id: 'q:' + q.id, quest: q.id, zone: 'quest', kind: 'quest', emoji: q.emoji,
        name: q.title, hint: q.teaser,
        line: (SOFT[q.id] && q.stampSoft) || q.stamp, real: true
      });
    }

    /* keep any card we learned at runtime that the tables do not know */
    var keep = [];
    for (i = 0; i < CARDS.length; i++) if (CARDS[i].learned) keep.push(CARDS[i]);

    CARDS = meadow.concat(far, quests, keep);
    dedupe();
  }
  function dedupe() {
    var seen = {}, out = [];
    for (var i = 0; i < CARDS.length; i++) {
      var id = CARDS[i].id;
      if (seen[id]) continue;
      seen[id] = 1; out.push(CARDS[i]);
    }
    CARDS = out;
  }
  function cardById(id) {
    for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i];
    return null;
  }
  function cardByKind(kinds) {
    for (var k = 0; k < kinds.length; k++) {
      for (var i = 0; i < CARDS.length; i++) {
        var c = CARDS[i];
        if (c.kind === kinds[k] && typeof c.x === 'number') return c;
      }
    }
    return null;
  }

  /* the child found something — from layer 2, or from our own quiet safety net */
  function onDiscover(id, label) {
    if (!id) return;
    id = String(id);
    if (FOUND[id]) return;
    FOUND[id] = 1;
    saveFound();
    idleT = 0;
    freshId = id;
    var c = cardById(id);
    if (!c) c = learnCard(id, label);
    if (c) {
      /* a discovery can quietly finish a step, wherever the child is standing */
      creditFind(c.kind);
      if (c.kind === 'stepstone') stonesSeen++;
    }
    if (journalOpen) renderGrid();
    refreshChip(true);
  }
  function learnCard(id, label) {
    if (learned >= 14) return null;
    learned++;
    var kind = kindOf(id + ' ' + (label || ''));
    var nm = label ? { en: label, es: label } : { en: String(id).replace(/[-_]/g, ' '),
                                                  es: String(id).replace(/[-_]/g, ' ') };
    var c = { id: id, zone: (kind === 'grotto' || kind === 'berry' || kind === 'star' ||
                             kind === 'treehouse' || kind === 'signpost' || kind === 'lantern' ||
                             kind === 'stepstone') ? 'far' : 'meadow',
              kind: kind, emoji: emojiFor(kind), name: nm,
              hint: HINT[kind] || HINT.thing, line: LINE[kind] || LINE.thing,
              real: true, learned: true };
    CARDS.push(c);
    return c;
  }
  function saveFound() {
    var a = [], k;
    for (k in FOUND) if (FOUND.hasOwnProperty(k)) a.push(k);
    save('quest.found', a);
  }
  function isFound(c) {
    if (!c) return false;
    if (c.zone === 'quest') return !!DONE[c.quest];
    if (FOUND[c.id]) return true;
    /* ask whoever owns this thing — RWalk keeps the master set, but the
       siblings each know their own, so any of them can unlock the sticker */
    try {
      var W = (host && host.RWalk) || window.RWalk;
      if (W && W.hasFound && W.hasFound(c.id)) { FOUND[c.id] = 1; return true; }
      var Wo = (host && host.RWorld) || window.RWorld;
      if (Wo && Wo.isFound && Wo.isFound(c.id)) { FOUND[c.id] = 1; return true; }
      var Pl = (host && host.RPlaces) || window.RPlaces;
      if (Pl && Pl.reached && Pl.reached(c.id)) { FOUND[c.id] = 1; return true; }
    } catch (e) {}
    return false;
  }

  /* wrap RWalk.found so every discovery — whoever announces it — lands here */
  function hookWalk() {
    var W = host && host.RWalk ? host.RWalk : window.RWalk;
    if (!W || typeof W.found !== 'function' || W.__rqHook) return;
    var orig = W.found;
    try {
      W.found = function (id, label, opts) {
        var was = orig.apply(W, arguments);
        if (was) { try { onDiscover(id, label); } catch (e) {} }
        return was;
      };
      W.__rqHook = true;
    } catch (e) {}
    /* seed from whatever has already been found in earlier sessions */
    var seeds = [load('quest.found', []), load('walk.found', [])];
    for (var s = 0; s < seeds.length; s++) {
      var a = seeds[s];
      if (a && a.length) for (var i = 0; i < a.length; i++) if (a[i]) FOUND[String(a[i])] = 1;
    }
  }

  /* ==========================================================================
     6. where things are, and the beacon that shows the way
     ====================================================================== */
  var TARGET_KINDS = {
    stream:    ['stream', 'bridge'],
    fox:       ['fox', 'hill', 'friend'],
    berry:     ['berry'],
    grotto:    ['grotto', 'stepstone'],
    star:      ['star'],
    treehouse: ['treehouse']
  };
  var TGT = { x: 0, z: 0, r: 4 };          // reused every call — no allocations
  function resolveTarget(step) {
    var key = step.to, c;
    if (ANIMALS[key]) {
      TGT.x = ANIMALS[key].x; TGT.z = ANIMALS[key].z; TGT.r = step.r || 3.6; return TGT;
    }
    if (TARGET_KINDS[key]) {
      c = cardByKind(TARGET_KINDS[key]);
      if (c) { TGT.x = c.x; TGT.z = c.z; TGT.r = step.r || c.r || 5; return TGT; }
    }
    c = FALLBACK_AT[key];
    if (!c) return null;
    TGT.x = c.x; TGT.z = c.z; TGT.r = step.r || c.r || 5;
    return TGT;
  }

  function pose() {
    var W = host && host.RWalk ? host.RWalk : window.RWalk;
    if (!W) return null;
    var p = null;
    try { p = W.pos && typeof W.pos.x === 'number' ? W.pos : (W.pose ? W.pose() : null); } catch (e) {}
    if (!p || typeof p.x !== 'number' || typeof p.z !== 'number') return null;
    return p;
  }

  /* --- three.js bits (all optional) --------------------------------------- */
  function findScene() {
    if (SC) return SC;
    /* the siblings may still be building — try again once a second, for a while */
    if (sceneTries > 25 || clock < sceneT) return null;
    sceneT = clock + 1;
    sceneTries++;
    try {
      TH = (host && host.THREE) || window.THREE || null;
      if (!TH) return null;
      var s = (host && host.scene) || null;
      if (!s) {
        var W = host && host.RWalk ? host.RWalk : window.RWalk;
        var av = W && W.avatar ? W.avatar() : null;
        var n = av;
        while (n && !n.isScene && n.type !== 'Scene') n = n.parent;
        s = n || null;
      }
      if (s && s.add) SC = s;
    } catch (e) {}
    return SC;
  }
  function glowTexture() {
    if (glowTex) return glowTex;
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(255,240,180,1)');
    gr.addColorStop(1, 'rgba(255,196,86,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    glowTex = new TH.CanvasTexture(c);
    return glowTex;
  }
  function emojiTexture(em) {
    if (texCache[em]) return texCache[em];
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d');
    g.font = '102px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(em, 64, 70);
    texCache[em] = new TH.CanvasTexture(c);
    return texCache[em];
  }
  function sprite(tex, scale, additive) {
    var s = new TH.Sprite(new TH.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false, fog: false,
      blending: additive ? TH.AdditiveBlending : TH.NormalBlending
    }));
    s.scale.set(scale, scale, 1);
    return s;
  }
  /* ONE beacon + 6 trail fireflies. Nine objects, built once, reused forever. */
  function buildBeacon() {
    if (beacon || !findScene()) return;
    beacon = new TH.Group();
    bGlow = sprite(glowTexture(), 5.4, true);
    bGlow.position.y = 0.9;
    bBeam = new TH.Mesh(
      new TH.CylinderGeometry(0.55, 1.7, 13, 10, 1, true),
      new TH.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.15,
                                 depthWrite: false, side: TH.DoubleSide,
                                 blending: TH.AdditiveBlending, fog: false }));
    bBeam.position.y = 6.6;
    bEmoji = sprite(emojiTexture('⭐'), 2.4, false);
    bEmoji.position.y = 3.5;
    beacon.add(bGlow, bBeam, bEmoji);
    beacon.visible = false;
    SC.add(beacon);
    for (var i = 0; i < 6; i++) {
      var f = sprite(glowTexture(), 0.7, true);
      f.visible = false;
      SC.add(f);
      trail.push(f);
    }
  }
  function setBeacon(x, z, emoji) {
    buildBeacon();
    if (!beacon) return;
    beacon.position.set(x, 0, z);
    beacon.visible = true;
    if (emoji && bEmoji && bEmoji.userData.em !== emoji) {
      bEmoji.userData.em = emoji;                 /* only re-upload on a change */
      bEmoji.material.map = emojiTexture(emoji);
      bEmoji.material.needsUpdate = true;
    }
  }
  function hideBeacon() { if (beacon) beacon.visible = false; }

  /* ==========================================================================
     7. the objective chip
     ====================================================================== */
  function buildChip() {
    if (elChip || !document.body) return;
    elChip = mk('div'); elChip.id = 'rqChip';
    elChip.setAttribute('role', 'button');
    elChip.setAttribute('tabindex', '0');
    chipEmoji = mk('span', 'rqChipEmoji', '📔');
    chipText  = mk('span', 'rqChipText', '');
    chipDot   = mk('span', 'rqChipDot');
    chipDot.style.display = 'none';
    chipX = mk('button', 'rqChipX', '✕');
    chipX.type = 'button';
    chipX.setAttribute('aria-label', T(UI.putAway));
    chipX.title = T(UI.putAway);
    chipX.addEventListener('click', function (e) {
      e.stopPropagation(); e.preventDefault();
      dismissObjective();
    });
    elChip.appendChild(chipEmoji);
    elChip.appendChild(chipText);
    elChip.appendChild(chipX);
    elChip.appendChild(chipDot);
    elChip.addEventListener('click', function () { openJournal(); });
    elChip.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openJournal(); }
    });
    document.body.appendChild(elChip);
  }

  function activeQuest() {
    if (!activeId) return null;
    for (var i = 0; i < QUESTS.length; i++) if (QUESTS[i].id === activeId) return QUESTS[i];
    return null;
  }
  function activeStep() {
    var q = activeQuest();
    if (!q || DONE[q.id]) return null;
    return q.steps[STAGE[q.id] || 0] || null;
  }
  function firstOpenQuest() {
    for (var i = 0; i < QUESTS.length; i++) if (!DONE[QUESTS[i].id]) return QUESTS[i].id;
    return null;
  }

  function counts() {
    var f = 0;
    for (var i = 0; i < CARDS.length; i++) if (isFound(CARDS[i])) f++;
    return { found: f, total: CARDS.length };
  }

  /* the chip only ever shows ONE line: the objective, or the way into the book */
  function refreshChip(force) {
    if (!elChip) return;
    var q = activeQuest(), st = activeStep(), key, txt, em;
    if (q && st) {
      em = st.carry || q.emoji;
      txt = T(st.chip);
      if (st.need === 'berries') txt = fmt(txt, Math.min(berryCount(), st.n || 3), st.n || 3);
      if (st.need === 'stones')  txt = fmt(txt, Math.min(stoneCount(), st.n || 4), st.n || 4);
      if (st.need === 'ramp')    txt = fmt(txt, Math.min(rampCount(), st.n || 6), st.n || 6);
      var pip = proximityWord();
      if (pip) txt += ' · ' + pip;
      chipX.style.display = '';
    } else {
      var c = counts();
      em = '📔';
      txt = T(UI.open) + ' · 🔎 ' + c.found + ' / ' + c.total;
      chipX.style.display = 'none';
    }
    key = em + '|' + txt;
    if (!force && key === lastChipKey) return;
    lastChipKey = key;
    chipEmoji.textContent = em;
    chipText.textContent = txt;
    elChip.hidden = false;
    elChip.classList.remove('hide');
    elChip.setAttribute('aria-label', txt + ' — ' + T(UI.openAria));
    elChip.title = T(UI.openAria);
  }
  function proximityWord() {
    var st = activeStep();
    if (!st) return '';
    var p = pose();
    if (!p) return '';
    var t = resolveTarget(st);
    if (!t) return '';
    var d = Math.hypot(p.x - t.x, p.z - t.z);
    if (d <= t.r + 1.5) return '⭐ ' + T(UI.pipNear);
    if (d <= t.r + 12)  return '👀 ' + T(UI.pipMid);
    return '🔎 ' + T(UI.pipFar);
  }
  function pulseChip() {
    if (!elChip || elChip.hidden) return;
    elChip.classList.remove('pulse');
    /* force the animation to restart even on back-to-back pulses */
    void elChip.offsetWidth;
    elChip.classList.add('pulse');
    chipPulseT = 1.7;
  }

  function setQuest(id, quiet) {
    var q = null, i;
    for (i = 0; i < QUESTS.length; i++) if (QUESTS[i].id === id) q = QUESTS[i];
    if (!q || DONE[q.id]) return false;
    activeId = q.id;
    autoPick = true;
    save('quest.active', activeId);
    save('quest.auto', 1);
    var st = q.steps[STAGE[q.id] || 0];
    refreshChip(true);
    updateBeacon(true);
    trailT = 6;
    if (!quiet) { sfx('tap'); say(T(st.say)); pulseChip(); }
    return true;
  }
  function dismissObjective() {
    sfx('tap');
    activeId = null;
    autoPick = false;
    save('quest.active', '');
    save('quest.auto', 0);
    hideBeacon();
    trailT = 0;
    refreshChip(true);
  }

  /* ==========================================================================
     8. the quest engine
        Three independent ways to finish every step, so a child can never be
        stuck: arrive · linger · or simply discover the thing.
     ====================================================================== */
  function berryCount() {
    var P = host && host.RPlaces ? host.RPlaces : window.RPlaces, v, i;
    var names = ['berries', 'berryCount', 'picked', 'carried'];
    if (P) for (i = 0; i < names.length; i++) {
      try {
        v = P[names[i]];
        if (typeof v === 'function') v = v.call(P);
        if (typeof v === 'number' && isFinite(v)) return Math.max(v, berriesSeen);
      } catch (e) {}
    }
    try { if (P && P.state && typeof P.state.berries === 'number') return Math.max(P.state.berries, berriesSeen); } catch (e) {}
    v = load('places.berries', null);
    if (typeof v === 'number' && isFinite(v)) return Math.max(v, berriesSeen);
    return berriesSeen;
  }
  function stoneCount() {
    var P = host && host.RPlaces ? host.RPlaces : window.RPlaces, v, i;
    var names = ['stones', 'stoneCount', 'stonesPlayed'];
    if (P) for (i = 0; i < names.length; i++) {
      try {
        v = P[names[i]];
        if (typeof v === 'function') v = v.call(P);
        if (typeof v === 'number' && isFinite(v)) return Math.max(v, stonesSeen);
      } catch (e) {}
    }
    /* otherwise count the stepping-stones the child has actually discovered */
    var n = 0;
    for (i = 0; i < CARDS.length; i++) if (CARDS[i].kind === 'stepstone' && isFound(CARDS[i])) n++;
    return Math.max(n, stonesSeen);
  }
  /* how many of the treehouse ramp's lanterns are alight — the only honest
     measure of "went up", because RWalk.pose() has no y to test */
  function rampCount() {
    var P = host && host.RPlaces ? host.RPlaces : window.RPlaces, v;
    try {
      if (P) {
        v = P.rampLit;
        if (typeof v === 'function') v = v.call(P);
        if (typeof v === 'number' && isFinite(v)) return v;
      }
    } catch (e) {}
    var a = load('places.ramp', null), n = 0;
    if (a && a.length) for (var i = 0; i < a.length; i++) if (a[i]) n++;
    return n;
  }
  /* a discovery of the right kind quietly finishes a waiting step */
  function creditFind(kind) {
    for (var i = 0; i < QUESTS.length; i++) {
      var q = QUESTS[i];
      if (DONE[q.id]) continue;
      var st = q.steps[STAGE[q.id] || 0];
      if (st && st.find && st.find === kind) advance(q);
    }
  }

  function evalQuests(dt, p) {
    for (var i = 0; i < QUESTS.length; i++) {
      var q = QUESTS[i];
      if (DONE[q.id]) continue;
      var idx = STAGE[q.id] || 0;
      var st = q.steps[idx];
      if (!st) { finishQuest(q); continue; }
      var t = resolveTarget(st);
      if (!t || !p) continue;
      var d = Math.hypot(p.x - t.x, p.z - t.z);
      var near = d <= t.r;
      var key = q.id;
      if (near) DWELL[key] = (DWELL[key] || 0) + dt; else DWELL[key] = 0;

      var ok = false;
      if (st.need === 'berries')      ok = berryCount() >= (st.n || 3);
      else if (st.need === 'stones')  ok = stoneCount() >= (st.n || 4);
      else if (st.need === 'ramp')    ok = rampCount() >= (st.n || 6);
      else                            ok = near;                      /* plain 'reach' */

      /* the kindness clause: standing there long enough is always enough.
         It is remembered, so the ending says "you found it" rather than
         claiming the child did something they did not do. */
      if (!ok && near && st.dwell && DWELL[key] >= st.dwell) { ok = true; markSoft(q); }

      if (ok) advance(q);
    }
  }

  function markSoft(q) {
    if (SOFT[q.id]) return;
    SOFT[q.id] = 1;
    save('quest.soft', SOFT);
  }
  /* the warm line to tell: the honest one when the dwell clause did the work */
  function ending(q, which) {
    return T((SOFT[q.id] && q[which + 'Soft']) || q[which]);
  }

  function advance(q) {
    var idx = STAGE[q.id] || 0;
    var st = q.steps[idx];
    DWELL[q.id] = 0;
    /* handing something over really hands it over, if places.js is carrying it */
    if (st && st.take) {
      try {
        var Pl = (host && host.RPlaces) || window.RPlaces;
        if (Pl && Pl.takeBerries) Pl.takeBerries(st.take);
      } catch (e) {}
    }
    if (idx + 1 < q.steps.length) {
      STAGE[q.id] = idx + 1;
      save('quest.stage', STAGE);
      sfx('pop');
      if (st && st.done && !songOn()) {
        try { K.toast && K.toast(q.emoji + ' ' + T(st.done), 3200); } catch (e) {}
        say(T(st.done));
      }
      if (activeId === q.id) {
        refreshChip(true);
        updateBeacon(true);
        trailT = 6;
        var nx = q.steps[STAGE[q.id]];
        if (nx && nx.say) setTimeout(function () { say(T(nx.say)); }, 2200);
      }
      idleT = 0;
      return;
    }
    finishQuest(q);
  }

  var REWARD = {
    sparkle: [[3, 0.18, 0], [3, 0.16, 160], [3, 0.14, 320], [1, 0.12, 470]],
    band:    [[0, 0.2, 0], [1, 0.2, 170], [2, 0.2, 340], [3, 0.22, 510]],
    water:   [[3, 0.2, 0], [2, 0.18, 190], [1, 0.18, 380], [0, 0.2, 570]],
    chord:   [[0, 0.16, 0], [1, 0.16, 60], [2, 0.16, 120], [3, 0.18, 180]]
  };
  function playReward(name) {
    var seq = REWARD[name] || REWARD.sparkle;
    for (var i = 0; i < seq.length; i++) {
      (function (s) { setTimeout(function () { note(s[0], s[1]); }, s[2]); })(seq[i]);
    }
  }

  function finishQuest(q) {
    if (DONE[q.id]) return;
    DONE[q.id] = 1;
    save('quest.done', DONE);
    DWELL[q.id] = 0;
    idleT = 0;
    freshId = 'q:' + q.id;

    sfx('star');
    for (var i = 0; i < 6; i++) flower(i % 4);
    try { K.streakBump && K.streakBump(); } catch (e) {}
    try { K.recordEvent && K.recordEvent('quest', q.id); } catch (e) {}
    playReward(q.reward);
    showStamp(q.emoji, T(q.title), ending(q, 'stamp'));
    say(ending(q, 'finish'));

    if (activeId === q.id) { activeId = null; hideBeacon(); trailT = 0; }
    save('quest.active', activeId || '');
    if (journalOpen) renderGrid();
    refreshChip(true);
    if (chipDot) chipDot.style.display = '';

    var all = true;
    for (var j = 0; j < QUESTS.length; j++) if (!DONE[QUESTS[j].id]) all = false;
    if (all) {
      setTimeout(function () {
        try { K.toast && K.toast(T(UI.allQuests), 5000); } catch (e) {}
        sfx('star');
      }, 2600);
      return;
    }
    if (autoPick) {
      setTimeout(function () {
        if (!activeId && autoPick) {
          var nx = firstOpenQuest();
          if (nx) setQuest(nx, false);
        }
      }, 3600);
    }
  }

  /* ==========================================================================
     9. the "new stamp!" flourish
     ====================================================================== */
  function buildStamp() {
    if (elStamp || !document.body) return;
    elStamp = mk('div'); elStamp.id = 'rqStamp';
    elStamp.setAttribute('aria-hidden', 'true');
    stEmoji = mk('div', 'rqStampEmoji', '⭐');
    stName  = mk('div', 'rqStampName', '');
    stLine  = mk('div', 'rqStampLine', '');
    elStamp.appendChild(stEmoji);
    elStamp.appendChild(stName);
    elStamp.appendChild(stLine);
    document.body.appendChild(elStamp);
  }
  /* Layer 2's "you found something!" card owns dead centre (#rwCard, z 88,
     top 42%) and our flourish sits in exactly the same spot at exactly the
     same z. Both are fired by the same discovery on the treehouse and the fox,
     so the stamp would land on the card's 💙 button. The card is the one with
     a button in it, so the card wins and the stamp waits its turn. */
  function cardUp() {
    try {
      var c = document.getElementById('rwCard');
      return !!(c && c.classList.contains('show'));
    } catch (e) { return false; }
  }
  function showStamp(emoji, name, line) {
    if (cardUp()) { pendingStamp = [emoji, name, line]; return; }
    buildStamp();
    if (!elStamp) return;
    stEmoji.textContent = emoji || '⭐';
    stName.textContent = T(UI.newStamp);
    stLine.textContent = line || '';
    elStamp.setAttribute('aria-label', T(UI.newStamp) + ' ' + (name || ''));
    elStamp.classList.remove('show');
    void elStamp.offsetWidth;                 /* restart the flourish */
    elStamp.classList.add('show');
    stampTimer = 2.1;
  }

  /* ==========================================================================
     10. the adventure journal
     ====================================================================== */
  function buildJournal() {
    if (elJour || !document.body) return;
    elJour = mk('div'); elJour.id = 'rqJournal';
    elJour.setAttribute('role', 'dialog');
    elJour.setAttribute('aria-modal', 'true');
    elJour.setAttribute('aria-label', T(UI.journal));

    elBook = mk('div', 'rqBook');

    var head = mk('div', 'rqBookHead');
    elTitle = mk('h2', null, T(UI.journal));
    elSub = mk('small', 'rqBookSub', T(UI.sub));
    elTitle.appendChild(elSub);
    elCount = mk('div', 'rqCount', '🔎 0 / 0');
    elRing = mk('div', 'rqRing');
    elRingTxt = mk('span', null, '0/0');
    elRing.appendChild(elRingTxt);
    head.appendChild(elTitle);
    head.appendChild(elCount);
    head.appendChild(elRing);

    elTabs = mk('div', 'rqTabs');
    var tabs = [['all', UI.tabAll], ['meadow', UI.tabMeadow], ['far', UI.tabFar], ['quest', UI.tabQuest]];
    for (var i = 0; i < tabs.length; i++) {
      (function (key, label) {
        var b = mk('button', 'rqTab' + (key === tab ? ' on' : ''), T(label));
        b.type = 'button';
        b.setAttribute('data-tab', key);
        b.addEventListener('click', function () {
          if (tab === key) return;
          tab = key;
          sfx('tap');
          var all = elTabs.querySelectorAll('.rqTab');
          for (var j = 0; j < all.length; j++) {
            all[j].classList.toggle('on', all[j].getAttribute('data-tab') === key);
          }
          renderGrid();
        });
        elTabs.appendChild(b);
      })(tabs[i][0], tabs[i][1]);
    }

    elGrid = mk('div', 'rqGrid');
    elGrid.setAttribute('role', 'list');

    elClose = mk('button', 'rqClose', T(UI.done));
    elClose.type = 'button';
    elClose.setAttribute('aria-label', T(UI.closeAria));
    elClose.addEventListener('click', function () { sfx('tap'); closeJournal(); });

    elBook.appendChild(head);
    elBook.appendChild(elTabs);
    elBook.appendChild(elGrid);
    elBook.appendChild(elClose);
    elJour.appendChild(elBook);

    /* tapping the dark around the book closes it too */
    elJour.addEventListener('click', function (e) { if (e.target === elJour) closeJournal(); });
    document.body.appendChild(elJour);
  }

  function sectionRow(label) {
    var d = mk('div', 'rqSection', T(label));
    d.setAttribute('role', 'presentation');
    return d;
  }

  /* what a not-yet-stamped quest page says: the actual next little job */
  function questObjectiveLine(qid) {
    for (var i = 0; i < QUESTS.length; i++) {
      if (QUESTS[i].id !== qid) continue;
      var st = QUESTS[i].steps[STAGE[qid] || 0];
      if (!st) break;
      var s = T(st.chip);
      if (st.need === 'berries') s = fmt(s, Math.min(berryCount(), st.n || 3), st.n || 3);
      if (st.need === 'stones')  s = fmt(s, Math.min(stoneCount(), st.n || 4), st.n || 4);
      if (st.need === 'ramp')    s = fmt(s, Math.min(rampCount(), st.n || 6), st.n || 6);
      return s;
    }
    return T(UI.notYet);
  }

  function cardEl(c) {
    var found = isFound(c);
    var isQuest = c.zone === 'quest';
    var b = mk('button', 'rqCard ' + (found ? 'found' : 'locked') + (isQuest ? ' stamp' : ''));
    b.type = 'button';
    b.setAttribute('role', 'listitem');

    /* A quest is an invitation, so its page is never a mystery. A hidden
       wonder keeps its NAME secret but still shows its emoji — adventure.css
       flattens it to a grey silhouette, which is the whole tease: the child
       can see the shape of what is missing, and reads the hint underneath. */
    var em = mk('span', 'rqCardEmoji', c.emoji || '✨');
    var nm = mk('span', 'rqCardName', (found || isQuest) ? T(c.name) : T(UI.unknown));
    var body;
    if (found) body = T(c.line);
    else if (isQuest) body = questObjectiveLine(c.quest);
    else body = T(c.hint);
    var ht = mk('span', 'rqCardHint', body);
    b.appendChild(em); b.appendChild(nm); b.appendChild(ht);

    if (c.id === freshId) b.classList.add('fresh');

    b.setAttribute('aria-label', nm.textContent + '. ' + ht.textContent);
    b.addEventListener('click', function () {
      sfx('tap');
      if (isQuest && !found) {
        if (setQuest(c.quest, false)) {
          try { K.toast && K.toast(c.emoji + ' ' + T(UI.chosen), 2800); } catch (e) {}
          closeJournal();
        }
        return;
      }
      if (found) { say(T(c.name) + '. ' + T(c.line)); return; }
      /* a locked wonder: say the hint and point the fireflies at it */
      say(T(c.hint));
      if (typeof c.x === 'number') {
        hintTarget = c;
        trailT = 7;
        setTimeout(function () { closeJournal(); }, 900);
      }
    });
    return b;
  }

  function renderGrid() {
    if (!elGrid) return;
    harvest();
    while (elGrid.firstChild) elGrid.removeChild(elGrid.firstChild);

    var groups = [];
    if (tab === 'all') {
      groups = [['meadow', UI.secMeadow], ['far', UI.secFar], ['quest', UI.secQuest]];
    } else if (tab === 'meadow') groups = [['meadow', UI.secMeadow]];
    else if (tab === 'far')      groups = [['far', UI.secFar]];
    else                         groups = [['quest', UI.secQuest]];

    for (var g = 0; g < groups.length; g++) {
      var zone = groups[g][0], any = false, frag = document.createDocumentFragment();
      for (var i = 0; i < CARDS.length; i++) {
        if (CARDS[i].zone !== zone) continue;
        frag.appendChild(cardEl(CARDS[i]));
        any = true;
      }
      if (!any) continue;
      if (groups.length > 1 || tab === 'all') elGrid.appendChild(sectionRow(groups[g][1]));
      elGrid.appendChild(frag);
    }
    freshId = null;
    renderHead();
  }

  function renderHead() {
    if (!elCount) return;
    var c = counts();
    var pct = c.total ? Math.round((c.found / c.total) * 100) : 0;
    elCount.textContent = '🔎 ' + c.found + ' / ' + c.total;
    elRing.style.setProperty('--rq-p', pct);
    /* the arc IS the fraction — the middle just shows how many stickers so far */
    elRingTxt.textContent = String(c.found);
    elRing.setAttribute('role', 'img');
    elRing.setAttribute('aria-label', '🔎 ' + c.found + ' / ' + c.total);
    if (elSub) {
      elSub.textContent = (tab === 'quest') ? T(UI.subPick)
        : (c.found >= c.total && c.total > 0 ? T(UI.allFound)
          : (c.total - c.found) + ' ' + T(UI.stillOut) + ' · ' + T(UI.sub));
    }
  }

  function openJournal() {
    buildJournal();
    if (!elJour) return;
    journalOpen = true;
    idleT = 0;
    if (chipDot) chipDot.style.display = 'none';
    /* a stamp in mid-flourish sits above the book — let the book have the screen */
    if (elStamp && stampTimer > 0) { elStamp.classList.remove('show'); stampTimer = 0; }
    pendingStamp = null;            /* the new sticker is right there in the album */
    renderGrid();
    elJour.classList.add('show');
    try { if (elClose && elClose.focus) elClose.focus({ preventScroll: true }); } catch (e) {}
    sfx('pop');
    if (!firstOpenDone) {
      firstOpenDone = true;
      var c = counts();
      say(T(UI.firstOpen) + ' ' + c.found + ' / ' + c.total);
    }
  }
  function closeJournal() {
    if (!elJour) return;
    journalOpen = false;
    elJour.classList.remove('show');
    idleT = 0;
    refreshChip(true);
  }
  function toggleJournal() { journalOpen ? closeJournal() : openJournal(); }

  /* ==========================================================================
     11. the gentle guide — two fireflies and one soft pulse. Never a nag.
     ====================================================================== */
  var IDLE_AT = 35;                       /* seconds · scaled by the kit's speed */
  function nearestUnfound(p) {
    var best = null, bd = 1e9;
    for (var i = 0; i < CARDS.length; i++) {
      var c = CARDS[i];
      if (c.zone === 'quest' || typeof c.x !== 'number' || isFound(c)) continue;
      var d = Math.hypot(p.x - c.x, p.z - c.z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }
  function guideQuiet() {
    return journalOpen || paused() || replaying() || songOn() || breathOn();
  }
  function guideTick(dt, p) {
    if (guideCd > 0) guideCd -= dt;
    if (guideQuiet()) { idleT = 0; return; }
    idleT += dt;
    if (idleT < IDLE_AT * speedMul() || guideCd > 0 || !p) return;
    idleT = 0;
    guides++;
    guideCd = guides < 3 ? 55 : 110;      /* it gets rarer, never noisier */
    var st = activeStep();
    if (st) { updateBeacon(true); trailT = 6; }
    else {
      var c = nearestUnfound(p);
      if (!c) return;
      hintTarget = c;
      trailT = 6;
    }
    pulseChip();
  }

  /* ==========================================================================
     12. per-frame
     ====================================================================== */
  function guideXZ(p) {
    /* whichever the fireflies should be heading for right now */
    var st = activeStep();
    if (st) {
      var t = resolveTarget(st);
      if (t) return t;
    }
    if (hintTarget && !isFound(hintTarget)) return hintTarget;
    hintTarget = null;
    return null;
  }

  function updateBeacon(force) {
    if (!findScene()) return;
    var st = activeStep();
    if (!st) {
      if (hintTarget && !isFound(hintTarget) && typeof hintTarget.x === 'number') {
        setBeacon(hintTarget.x, hintTarget.z, hintTarget.emoji);
      } else hideBeacon();
      return;
    }
    var t = resolveTarget(st);
    if (!t) { hideBeacon(); return; }
    var q = activeQuest();
    setBeacon(t.x, t.z, (q && q.emoji) || '⭐');
  }

  function animate(dt, p) {
    if (!beacon) return;
    var slow = lessMotion();
    var soft = calm() ? 0.65 : 1;
    if (beacon.visible) {
      var b = slow ? 0 : Math.sin(clock * 2.1) * 0.28;
      bEmoji.position.y = 3.5 + b;
      bGlow.material.opacity = (slow ? 0.7 : 0.7 + Math.sin(clock * 2.1) * 0.18) * soft;
      bBeam.material.opacity = (slow ? 0.13 : 0.13 + Math.sin(clock * 1.6) * 0.05) * soft;
    }
    /* the firefly trail: a short line of lights from the child toward the goal */
    var t = trailT > 0 ? guideXZ(p) : null;
    if (!t || !p) {
      for (var i = 0; i < trail.length; i++) if (trail[i].visible) trail[i].visible = false;
      return;
    }
    var dx = t.x - p.x, dz = t.z - p.z;
    var len = Math.hypot(dx, dz);
    if (len < 0.001) len = 0.001;
    var reach = Math.min(len * 0.9, 13);
    var fade = Math.min(1, trailT / 1.2);
    for (var k = 0; k < trail.length; k++) {
      var f = trail[k];
      var u = (k + 1) / (trail.length + 1);
      var d = reach * u;
      f.visible = true;
      f.position.x = p.x + (dx / len) * d;
      f.position.z = p.z + (dz / len) * d;
      f.position.y = 1.1 + (slow ? 0 : Math.sin(clock * 2.6 + k * 1.1) * 0.35);
      f.material.opacity = (slow ? 0.7 : 0.55 + Math.sin(clock * 3 + k) * 0.25) * fade * soft;
    }
  }

  function tick(dt) {
    if (!inited) return;
    dt = Math.max(0, Math.min(0.05, dt || 0));
    if (paused()) return;
    clock += dt;

    if (stampTimer > 0) {
      stampTimer -= dt;
      if (stampTimer <= 0 && elStamp) elStamp.classList.remove('show');
    }
    if (pendingStamp && !cardUp()) {           /* the centre is free again */
      var ps = pendingStamp;
      pendingStamp = null;
      showStamp(ps[0], ps[1], ps[2]);
    }
    if (chipPulseT > 0) {
      chipPulseT -= dt;
      if (chipPulseT <= 0 && elChip) elChip.classList.remove('pulse');
    }
    if (trailT > 0) trailT -= dt;

    /* the siblings may finish building after us — keep looking for a while */
    if (!harvested && clock < 40) {
      harvestT -= dt;
      if (harvestT <= 0) {
        harvestT = 2;
        harvest();
        hookWalk();
        if (harvested) { refreshChip(true); if (journalOpen) renderGrid(); }
      }
    }

    var p = pose();
    if (replaying()) { animate(dt, p); return; }

    /* quests are judged five times a second, but they are told the REAL time
       that passed, so "stand here for 9 seconds" means nine real seconds */
    evalT -= dt;
    evalAcc += dt;
    if (evalT <= 0) {
      evalT = 0.2;
      if (p) {
        evalQuests(evalAcc, p);
        safetyNet(evalAcc, p);
      }
      evalAcc = 0;
    }
    chipT -= dt;
    if (chipT <= 0) { chipT = 0.3; refreshChip(false); }

    guideTick(dt, p);
    updateBeacon(false);
    animate(dt, p);
  }

  /* A very quiet backstop: if the child has been standing right on top of an
     undiscovered PLACE for a second and a half and nobody has announced it,
     we announce it ourselves. Layer 2 always wins the race in practice — this
     only ever catches a gap, so nothing in the journal can be unreachable.

     Earned cards are exempt. Their x/z is the place they belong to, not a
     trigger: awarding "the waterfall sang" from the coordinates alone would
     mark it found before the child ever touched a stone, and the real
     celebration — the flowers, the spoken line, the card — would then be
     skipped forever, because places.js reads its own achievement back as
     already-found. */
  function safetyNet(dt, p) {
    var best = null, bd = 2.2;
    for (var i = 0; i < CARDS.length; i++) {
      var c = CARDS[i];
      if (c.zone === 'quest' || !c.real || c.earned ||
          typeof c.x !== 'number' || isFound(c)) continue;
      var d = Math.hypot(p.x - c.x, p.z - c.z);
      if (d < bd) { bd = d; best = c; }
    }
    if (!best) { netId = null; netT = 0; return; }
    if (netId !== best.id) { netId = best.id; netT = 0; }
    netT += dt;
    if (netT < 1.5) return;
    netT = 0;
    var W = host && host.RWalk ? host.RWalk : window.RWalk;
    var announced = false;
    try { if (W && W.found) announced = !!W.found(best.id, T(best.name), { emoji: best.emoji, text: T(best.line) }); } catch (e) {}
    if (!announced) onDiscover(best.id, T(best.name));
  }

  /* ==========================================================================
     13. boot
     ====================================================================== */
  function init(h) {
    if (inited) return true;
    host = h || {};
    if (host.K) K = host.K;
    if (!K) K = window.ABEKit;
    if (!K) return false;

    /* remembered adventure */
    var f = load('quest.found', []);
    if (f && f.length) for (var i = 0; i < f.length; i++) FOUND[String(f[i])] = 1;
    var d = load('quest.done', {});
    if (d && typeof d === 'object') for (var k in d) if (d.hasOwnProperty(k)) DONE[k] = 1;
    var so = load('quest.soft', {});
    if (so && typeof so === 'object') for (var k3 in so) if (so.hasOwnProperty(k3)) SOFT[k3] = 1;
    var s = load('quest.stage', {});
    if (s && typeof s === 'object') for (var k2 in s) if (s.hasOwnProperty(k2)) STAGE[k2] = s[k2] | 0;
    autoPick = load('quest.auto', 1) ? true : false;
    berriesSeen = load('quest.berries', 0) | 0;

    harvest();
    hookWalk();
    buildChip();
    buildStamp();
    buildJournal();

    var want = load('quest.active', '');
    if (want && !DONE[want]) activeId = want;
    else if (autoPick) activeId = firstOpenQuest();
    refreshChip(true);
    updateBeacon(true);

    /* a berry / a singing stone, if places.js chooses to tell us about them */
    try {
      addEventListener('rq:pick', function (e) {
        var kind = e && e.detail && e.detail.kind;
        if (kind === 'stone') stonesSeen++;
        else { berriesSeen++; save('quest.berries', berriesSeen); }
        idleT = 0;
      });
      addEventListener('keydown', function (e) {
        idleT = 0;
        if (e.key === 'Escape' && journalOpen) { e.preventDefault(); closeJournal(); }
        else if ((e.key === 'j' || e.key === 'J') && !e.metaKey && !e.ctrlKey && !e.altKey) toggleJournal();
      });
      /* any deliberate tap counts as "the child is busy" — the guide waits.
         Holding the joystick fires one pointerdown, so a long walk that finds
         nothing still earns a nudge, which is exactly when one helps. */
      addEventListener('pointerdown', function () { idleT = 0; }, true);
    } catch (e) {}

    /* the very first objective arrives softly, once the meadow has settled */
    if (activeId) {
      setTimeout(function () {
        var st = activeStep();
        if (st && !songOn() && !breathOn() && !paused()) { say(T(st.say)); pulseChip(); }
      }, 9000);
    }
    inited = true;
    return true;
  }

  /* grown-up / test helper — start the whole adventure again */
  function forget() {
    FOUND = {}; DONE = {}; SOFT = {}; STAGE = {}; DWELL = {};
    learned = 0; berriesSeen = 0; stonesSeen = 0; guides = 0;
    save('quest.found', []); save('quest.done', {}); save('quest.stage', {});
    save('quest.soft', {});
    save('quest.berries', 0); save('quest.active', '');
    autoPick = true; save('quest.auto', 1);
    activeId = firstOpenQuest();
    harvest(); refreshChip(true); updateBeacon(true);
    if (journalOpen) renderGrid();
    return true;
  }

  window.RQuest = {
    init: safe(init),
    tick: safe(tick),
    openJournal: safe(openJournal),
    closeJournal: safe(closeJournal),
    toggleJournal: safe(toggleJournal),
    setQuest: safe(setQuest),
    /* places.js may call RQuest.pick('berry') / RQuest.pick('stone') if it likes;
       if it never does, berryCount() / stoneCount() find the numbers themselves. */
    pick: safe(function (kind) {
      if (kind === 'stone') stonesSeen++;
      else { berriesSeen++; save('quest.berries', berriesSeen); }
      idleT = 0;
      refreshChip(true);
      return true;
    }),
    progress: safe(function () {
      var c = counts();
      return { found: c.found, total: c.total,
               quests: QUESTS.length, questsDone: Object.keys(DONE).length };
    }),
    list: safe(function () { return CARDS.slice(); }),
    forget: safe(forget),
    /* true only while the full-screen journal is up, so the meadow can ignore
       taps. The stamp flourish is decorative and never sets this. */
    get active() { try { return !!journalOpen; } catch (e) { return false; } }
  };
})();
