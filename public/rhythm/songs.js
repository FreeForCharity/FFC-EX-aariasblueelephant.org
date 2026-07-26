/* Nilu's Music Meadow — song book
 * ---------------------------------------------------------------------------
 * Only four pitches exist in the meadow (C-D-E-G pentatonic), one per animal:
 *
 *   a:0 = Bo the bear   drum    C5 523.25
 *   a:1 = Pip the bunny shaker  D5 587.33
 *   a:2 = Momo the frog log     E5 659.25
 *   a:3 = Twee the bird chimes  G5 783.99
 *
 * Every melody below is either a public-domain traditional tune or an original
 * written for this game. Notes that fall outside C-D-E-G are folded onto the
 * nearest available pitch (noted in each song's comment) so the shape of the
 * tune still reads. `t` is seconds from song start; all values are computed
 * from the stated bpm and written out literally, ascending.
 *
 * Ordered easiest first. No note is ever less than 0.32s after the one before,
 * so even the sparkliest song stays tappable by small hands.
 */
(function () {
  var SONGS = [

    /* 1. HOT CROSS BUNS (traditional, public domain) — the tutorial song.
     *    E D C | E D C | C C D D | E D C
     *    4/4 at 70 bpm: quarter = 0.86s, half = 1.72s. Every gap >= 0.86s.
     */
    {
      id: 'hotcross',
      title: { en: 'Hot Cross Buns', es: 'Bollitos calientes' },
      emoji: '🥐',
      diff: 1,
      notes: [
        { t: 0.00, a: 2 }, { t: 0.86, a: 1 }, { t: 1.72, a: 0 },            // E  D  C-
        { t: 3.44, a: 2 }, { t: 4.30, a: 1 }, { t: 5.16, a: 0 },            // E  D  C-
        { t: 6.88, a: 0 }, { t: 7.74, a: 0 }, { t: 8.60, a: 1 }, { t: 9.46, a: 1 }, // C C D D
        { t: 10.32, a: 2 }, { t: 11.18, a: 1 }, { t: 12.04, a: 0 }          // E  D  C--
      ]
    },

    /* 2. MARY HAD A LITTLE LAMB (traditional, public domain)
     *    E D C D | E E E- | D D D- | E G G- | E D C D | E E E E | D D E D | C---
     *    4/4 at 80 bpm: quarter = 0.75s, bar = 3.00s. Fits the pentatonic exactly.
     */
    {
      id: 'mary',
      title: { en: 'Mary Had a Little Lamb', es: 'María tenía un corderito' },
      emoji: '🐑',
      diff: 1,
      notes: [
        { t: 0.00, a: 2 }, { t: 0.75, a: 1 }, { t: 1.50, a: 0 }, { t: 2.25, a: 1 },   // E D C D
        { t: 3.00, a: 2 }, { t: 3.75, a: 2 }, { t: 4.50, a: 2 },                      // E E E-
        { t: 6.00, a: 1 }, { t: 6.75, a: 1 }, { t: 7.50, a: 1 },                      // D D D-
        { t: 9.00, a: 2 }, { t: 9.75, a: 3 }, { t: 10.50, a: 3 },                     // E G G-
        { t: 12.00, a: 2 }, { t: 12.75, a: 1 }, { t: 13.50, a: 0 }, { t: 14.25, a: 1 },// E D C D
        { t: 15.00, a: 2 }, { t: 15.75, a: 2 }, { t: 16.50, a: 2 }, { t: 17.25, a: 2 },// E E E E
        { t: 18.00, a: 1 }, { t: 18.75, a: 1 }, { t: 19.50, a: 2 }, { t: 20.25, a: 1 },// D D E D
        { t: 21.00, a: 0 }                                                             // C---
      ]
    },

    /* 3. LIGHTLY ROW (traditional, public domain) — the "merrily rolling along"
     *    slot. Lightly Row is used instead of Merrily We Roll Along because that
     *    tune is note-for-note the same melody as Mary Had a Little Lamb.
     *    G E E- | F D D- | C D E F | G G G- | G E E- | E D D- | C E G G | E D C-
     *    Every F is folded down to E (nearest available pitch).
     *    4/4 at 100 bpm: quarter = 0.6s, bar = 2.4s.
     */
    {
      id: 'merrily',
      title: { en: 'Lightly Row', es: 'Rema suavecito' },
      emoji: '🚣',
      diff: 2,
      notes: [
        { t: 0.00, a: 3 }, { t: 0.60, a: 2 }, { t: 1.20, a: 2 },                       // G E E-
        { t: 2.40, a: 2 }, { t: 3.00, a: 1 }, { t: 3.60, a: 1 },                       // (F>E) D D-
        { t: 4.80, a: 0 }, { t: 5.40, a: 1 }, { t: 6.00, a: 2 }, { t: 6.60, a: 2 },    // C D E (F>E)
        { t: 7.20, a: 3 }, { t: 7.80, a: 3 }, { t: 8.40, a: 3 },                       // G G G-
        { t: 9.60, a: 3 }, { t: 10.20, a: 2 }, { t: 10.80, a: 2 },                     // G E E-
        { t: 12.00, a: 2 }, { t: 12.60, a: 1 }, { t: 13.20, a: 1 },                    // (F>E) D D-
        { t: 14.40, a: 0 }, { t: 15.00, a: 2 }, { t: 15.60, a: 3 }, { t: 16.20, a: 3 },// C E G G
        { t: 16.80, a: 2 }, { t: 17.40, a: 1 }, { t: 18.00, a: 0 }                     // E D C- (gentle close)
      ]
    },

    /* 4. FRÈRE JACQUES / MARTINILLO (traditional, public domain)
     *    C D E C | C D E C | E F G- | E F G- | G A G F E C | G A G F E C | C G C- | C G C-
     *    F folds down to E and A folds down to G; the low "ding dang dong" G is
     *    voiced up to G5 (the only G the meadow has), so the bell figure rings
     *    C - up a fifth - C.
     *    4/4 at 60 bpm: quarter = 1.0s, eighth = 0.5s, bar = 4.0s.
     */
    {
      id: 'frere',
      title: { en: 'Frère Jacques', es: 'Martinillo' },
      emoji: '🔔',
      diff: 2,
      notes: [
        { t: 0.00, a: 0 }, { t: 1.00, a: 1 }, { t: 2.00, a: 2 }, { t: 3.00, a: 0 },    // C D E C
        { t: 4.00, a: 0 }, { t: 5.00, a: 1 }, { t: 6.00, a: 2 }, { t: 7.00, a: 0 },    // C D E C
        { t: 8.00, a: 2 }, { t: 9.00, a: 2 }, { t: 10.00, a: 3 },                      // E (F>E) G-
        { t: 12.00, a: 2 }, { t: 13.00, a: 2 }, { t: 14.00, a: 3 },                    // E (F>E) G-
        { t: 16.00, a: 3 }, { t: 16.50, a: 3 }, { t: 17.00, a: 3 }, { t: 17.50, a: 2 },// G (A>G) G (F>E)
        { t: 18.00, a: 2 }, { t: 19.00, a: 0 },                                        // E C
        { t: 20.00, a: 3 }, { t: 20.50, a: 3 }, { t: 21.00, a: 3 }, { t: 21.50, a: 2 },// G (A>G) G (F>E)
        { t: 22.00, a: 2 }, { t: 23.00, a: 0 },                                        // E C
        { t: 24.00, a: 0 }, { t: 25.00, a: 3 }, { t: 26.00, a: 0 },                    // C G C-
        { t: 28.00, a: 0 }, { t: 29.00, a: 3 }, { t: 30.00, a: 0 }                     // C G C-
      ]
    },

    /* 5. NILU'S MEADOW WALTZ — original melody written for this game.
     *    3/4 waltz, four four-bar phrases, always landing on beat 1:
     *    | C E G | E- D | D E D | C-- | E G G | G- E | E D C | D-- |
     *    | G E D | E G E | D C D | E- G | G E D | E D C |
     *    3/4 at 100 bpm: quarter = 0.6s, bar = 1.8s.
     */
    {
      id: 'meadow',
      title: { en: "Nilu's Meadow Waltz", es: 'El vals del prado de Nilu' },
      emoji: '🌼',
      diff: 3,
      notes: [
        { t: 0.00, a: 0 }, { t: 0.60, a: 2 }, { t: 1.20, a: 3 },                       // C E G
        { t: 1.80, a: 2 }, { t: 3.00, a: 1 },                                          // E- D
        { t: 3.60, a: 1 }, { t: 4.20, a: 2 }, { t: 4.80, a: 1 },                       // D E D
        { t: 5.40, a: 0 },                                                             // C--
        { t: 7.20, a: 2 }, { t: 7.80, a: 3 }, { t: 8.40, a: 3 },                       // E G G
        { t: 9.00, a: 3 }, { t: 10.20, a: 2 },                                         // G- E
        { t: 10.80, a: 2 }, { t: 11.40, a: 1 }, { t: 12.00, a: 0 },                    // E D C
        { t: 12.60, a: 1 },                                                            // D--
        { t: 14.40, a: 3 }, { t: 15.00, a: 2 }, { t: 15.60, a: 1 },                    // G E D
        { t: 16.20, a: 2 }, { t: 16.80, a: 3 }, { t: 17.40, a: 2 },                    // E G E
        { t: 18.00, a: 1 }, { t: 18.60, a: 0 }, { t: 19.20, a: 1 },                    // D C D
        { t: 19.80, a: 2 }, { t: 21.00, a: 3 },                                        // E- G
        { t: 21.60, a: 3 }, { t: 22.20, a: 2 }, { t: 22.80, a: 1 },                    // G E D
        { t: 23.40, a: 2 }, { t: 24.00, a: 1 }, { t: 24.60, a: 0 }                     // E D C
      ]
    },

    /* 6. FIREFLY PARADE — original melody written for this game. The sparkliest
     *    one: skipping eighth-note runs that always settle onto two calm quarters.
     *    4/4 at ~86 bpm: quarter = 0.70s, eighth = 0.35s, bar = 2.80s.
     *    Nothing is ever quicker than 0.35s, and no two eighths in a row land on
     *    the same animal, so little fingers always get to travel.
     *    | C E G E  G E | D E D C  D E | G E G E  G- | E D E G  E D |
     *    | C D E G  E G | G E D E  D C | E G E G  E D | C E G--    |
     */
    {
      id: 'fireflies',
      title: { en: 'Firefly Parade', es: 'El desfile de luciérnagas' },
      emoji: '✨',
      diff: 3,
      notes: [
        { t: 0.00, a: 0 }, { t: 0.35, a: 2 }, { t: 0.70, a: 3 }, { t: 1.05, a: 2 },    // C E G E
        { t: 1.40, a: 3 }, { t: 2.10, a: 2 },                                          // G  E
        { t: 2.80, a: 1 }, { t: 3.15, a: 2 }, { t: 3.50, a: 1 }, { t: 3.85, a: 0 },    // D E D C
        { t: 4.20, a: 1 }, { t: 4.90, a: 2 },                                          // D  E
        { t: 5.60, a: 3 }, { t: 5.95, a: 2 }, { t: 6.30, a: 3 }, { t: 6.65, a: 2 },    // G E G E
        { t: 7.00, a: 3 },                                                             // G-
        { t: 8.40, a: 2 }, { t: 8.75, a: 1 }, { t: 9.10, a: 2 }, { t: 9.45, a: 3 },    // E D E G
        { t: 9.80, a: 2 }, { t: 10.50, a: 1 },                                         // E  D
        { t: 11.20, a: 0 }, { t: 11.55, a: 1 }, { t: 11.90, a: 2 }, { t: 12.25, a: 3 },// C D E G
        { t: 12.60, a: 2 }, { t: 13.30, a: 3 },                                        // E  G
        { t: 14.00, a: 3 }, { t: 14.35, a: 2 }, { t: 14.70, a: 1 }, { t: 15.05, a: 2 },// G E D E
        { t: 15.40, a: 1 }, { t: 16.10, a: 0 },                                        // D  C
        { t: 16.80, a: 2 }, { t: 17.15, a: 3 }, { t: 17.50, a: 2 }, { t: 17.85, a: 3 },// E G E G
        { t: 18.20, a: 2 }, { t: 18.90, a: 1 },                                        // E  D
        { t: 19.60, a: 0 }, { t: 19.95, a: 2 }, { t: 20.30, a: 3 }                     // C E G--
      ]
    }

  ];

  window.RSONGS = SONGS;
  window.RSONGS_STARS = SONGS.length * 3; // 18
})();
